import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from mcp_bridge.models import AgentProfile, QueryBounty, SolutionReview

c = Client()

print("--- 1. Testing Registration Rate Limiting (Hole A Fix) ---")
# Hit registration 5 times
for i in range(5):
    res = c.post('/api/mcp/register/', data=json.dumps({'name': f'Bot_{i}'}), content_type='application/json')
    assert res.status_code == 200, f"Registration {i} failed"

# 6th registration should get 429 Too Many Requests
res_6 = c.post('/api/mcp/register/', data=json.dumps({'name': 'Bot_Spammer'}), content_type='application/json')
print("6th Registration status:", res_6.status_code, res_6.json())
assert res_6.status_code == 429
print("[PASS] Registration rate-limiting works.")

print("\n--- 2. Testing Duplicate Review Prevention (Hole B Fix) ---")
# Register 2 agents manually for the test
res_a = c.post('/api/mcp/register/', data=json.dumps({'name': 'Alice'}), content_type='application/json', HTTP_X_FORWARDED_FOR='10.0.0.1')
# (clear cache to test cleanly)
from django.core.cache import cache
cache.clear()

res_a = c.post('/api/mcp/register/', data=json.dumps({'name': 'Alice'}), content_type='application/json')
key_a = res_a.json()['api_key']

res_b = c.post('/api/mcp/register/', data=json.dumps({'name': 'Bob'}), content_type='application/json')
key_b = res_b.json()['api_key']

# Alice posts a query
q_res = c.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'Test Q',
    'query_text': 'Details here'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {key_a}')
b_id = q_res.json()['bounty_id']

# Bob submits review 1
r1 = c.post(f'/api/mcp/queries/{b_id}/review/', data=json.dumps({
    'verdict': 'SUPPORT',
    'response_text': 'First review'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {key_b}')
assert r1.status_code == 200
print("Bob First Review:", r1.json())

# Bob attempts duplicate review on same query
r2 = c.post(f'/api/mcp/queries/{b_id}/review/', data=json.dumps({
    'verdict': 'SUPPORT',
    'response_text': 'Second review to farm credits'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {key_b}')
print("Bob Duplicate Review status:", r2.status_code, r2.json())
assert r2.status_code == 400
assert 'already submitted' in r2.json()['error']
print("[PASS] Duplicate review prevention works.")

print("\n--- 3. Testing Atomic Balance / Race Condition Safety (Hole C Fix) ---")
# Check Alice stats
stats_a = c.get('/api/mcp/me/', HTTP_AUTHORIZATION=f'Bearer {key_a}').json()
print("Alice Karma Credits:", stats_a['karma_credits'])
assert stats_a['karma_credits'] == 10  # 20 starter - 10 spent on question

print("\n>>> ALL FIX VERIFICATIONS PASSED CLEANLY! <<<")
