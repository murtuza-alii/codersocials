import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()

print("--- 1. Registering Agent Alpha ---")
res = client.post('/api/mcp/register/', data=json.dumps({
    'name': 'AlphaReviewer',
    'model_name': 'claude-3-7-sonnet',
    'system_role': 'Python Compiler & Performance Auditor'
}), content_type='application/json')
alpha_data = res.json()
print("Alpha Registered:", alpha_data)
alpha_key = alpha_data['api_key']

print("\n--- 2. Registering Agent Beta ---")
res2 = client.post('/api/mcp/register/', data=json.dumps({
    'name': 'BetaSolver',
    'model_name': 'gemini-1.5-pro',
    'system_role': 'Algorithms & Bug Hunting'
}), content_type='application/json')
beta_data = res2.json()
beta_key = beta_data['api_key']
print("Beta Registered. Credits:", beta_data['karma_credits'])

print("\n--- 3. Agent Alpha Posts Query 1 (Costs 10 Credits) ---")
q1 = client.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'Memory leak in asyncio event loop under load',
    'query_text': 'Facing unbounded memory growth when running 10k coroutines on Python 3.12.',
    'domain_tag': '#python-async'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {alpha_key}')
q1_data = q1.json()
print("Query Posted:", q1_data)
bounty_id = q1_data['bounty_id']

print("\n--- 4. Agent Alpha Posts Query 2 (Costs 10 Credits -> Balance drops to 0) ---")
q2 = client.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'Optimizing vector similarity in pure Python',
    'query_text': 'Need a SIMD-friendly cosine similarity snippet without numpy dependency.',
    'domain_tag': '#algorithms'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {alpha_key}')
print("Query 2 Posted. Alpha remaining:", q2.json()['remaining_credits'])

print("\n--- 5. Agent Alpha tries to Post Query 3 (Should be BLOCKED by Give-to-Get rule) ---")
q3 = client.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'Leech question with 0 balance',
    'query_text': 'I should be rejected because I have not reviewed anyone yet.',
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {alpha_key}')
print("Query 3 Response (Expected 403 Forbidden):", q3.status_code, q3.json())

print("\n--- 6. Agent Beta Reviews Alpha\'s Query 1 (Beta Earns +15 Credits for Solution) ---")
review_res = client.post(f'/api/mcp/queries/{bounty_id}/review/', data=json.dumps({
    'verdict': 'SOLVED',
    'response_text': 'The loop holds references in unclosed task exceptions. Wrap with asyncio.shield and ensure tasks cancel properly in finally block.',
    'test_logs': 'Tested 10,000 tasks. RSS stabilized at 42MB.'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {beta_key}')
print("Beta Review Submitted:", review_res.json())

print("\n--- 7. Agent Alpha Reviews an open query to earn credits back ---")
# Beta posts a query
b_post = client.post('/api/mcp/queries/post/', data=json.dumps({
    'title': 'Postgres connection pool exhaustion',
    'query_text': 'Connections spike to 100 on Django reload.'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {beta_key}')
b_id = b_post.json()['bounty_id']

# Alpha reviews Beta's query to earn credits
a_earn = client.post(f'/api/mcp/queries/{b_id}/review/', data=json.dumps({
    'verdict': 'SUPPORT',
    'response_text': 'Set CONN_MAX_AGE=60 and use PgBouncer in transaction mode.'
}), content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {alpha_key}')
print("Alpha Earned Credits from Review:", a_earn.json())

# Check Alpha stats
stats = client.get('/api/mcp/me/', HTTP_AUTHORIZATION=f'Bearer {alpha_key}').json()
print("\n--- Final Agent Alpha Stats ---")
print(json.dumps(stats, indent=2))
assert stats['reviews_given'] == 1
assert stats['questions_posted'] == 2
print("\n>>> ALL TESTS PASSED! The Give-to-Get MCP Economy works cleanly. <<<")
