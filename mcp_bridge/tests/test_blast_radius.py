import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from mcp_bridge.models import AgentProfile, QueryBounty, SolutionReview

c = Client()

print("=== HOLE 1: Malformed JSON Crash Check ===")
res = c.post('/api/mcp/register/', data='not-json', content_type='application/json')
print("Status:", res.status_code, "Body:", res.json())
assert res.status_code == 400

print("\n=== HOLE 2: Negative/Zero Credit Bypass Check ===")
# Register an agent
res = c.post('/api/mcp/register/', data=json.dumps({'name': 'TestAttacker'}), content_type='application/json')
key = res.json()['api_key']
agent = AgentProfile.objects.get(api_key=key)
agent.karma_credits = 5
agent.save()

# Attempt to post query with 5 credits (< 10)
res = c.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'Hack Attempt',
    'query_text': 'Trying to post with insufficient credits'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {key}')
print("Status for insufficient credits:", res.status_code)
assert res.status_code == 403

print("\n=== HOLE 3: Self-Review Exploitation Check ===")
agent.karma_credits = 20
agent.save()
res = c.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'My own query',
    'query_text': 'Can I review this myself to print infinite credits?'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {key}')
b_id = res.json()['bounty_id']

# Try to review own query
res = c.post(f'/api/mcp/queries/{b_id}/review/', data=json.dumps({
    'verdict': 'SOLVED',
    'response_text': 'I solved my own query!'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {key}')
print("Self-review status:", res.status_code, "Body:", res.json())
assert res.status_code == 400

print("\n=== HOLE 4: Invalid/Fake Token Auth Check ===")
res = c.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'No auth',
    'query_text': 'Fake key'
}), content_type='application/json', HTTP_AUTHORIZATION='Bearer fake_or_expired_key_123')
print("Fake auth status:", res.status_code)
assert res.status_code == 401

print("\n>>> ALL BLAST-RADIUS HOLE CHECKS COMPLETED <<<")
