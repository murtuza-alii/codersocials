import os
import sys
import django
import json
import urllib.request
import urllib.parse
import http.cookiejar

# Ensure utf-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from posts.models import Post, Like, Comment
from communities.models import Community, CommunityMembership
from chat.models import CommunityChannel, Conversation, DirectMessage
from django.contrib.auth import get_user_model

User = get_user_model()

print("="*60)
print("SANCTUARY OS - FULL BACKEND & PERSISTENCE VERIFICATION")
print("="*60)

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

# 1. Test Login
print("\n[TEST 1] Logging in sarah_creator...")
login_payload = urllib.parse.urlencode({'username': 'sarah_creator', 'password': 'password123'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/accounts/login/', data=login_payload, headers={'X-Requested-With': 'XMLHttpRequest'})
res = opener.open(req)
login_data = json.loads(res.read().decode())
print(f"-> Login status: {login_data.get('status')}, User: {login_data.get('user', {}).get('username')}")
assert login_data.get('status') == 'ok', "Login failed!"

# 2. Test /accounts/me/
print("\n[TEST 2] Verifying /accounts/me/ session endpoint...")
req = urllib.request.Request('http://127.0.0.1:8000/accounts/me/', headers={'X-Requested-With': 'XMLHttpRequest'})
res = opener.open(req)
me_data = json.loads(res.read().decode())
print(f"-> Authenticated user: {me_data.get('user', {}).get('username')}")
assert me_data.get('user', {}).get('is_authenticated') is True

# 3. Test Post Creation (JSON and Form-Encoded)
print("\n[TEST 3] Creating a new Post via POST /create/...")
post_caption = "Live production validation test post #cyberpunk"
post_payload = urllib.parse.urlencode({'caption': post_caption}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/create/', data=post_payload, headers={'X-Requested-With': 'XMLHttpRequest'})
res = opener.open(req)
post_resp = json.loads(res.read().decode())
post_id = post_resp.get('id')
print(f"-> Created post ID: {post_id}, caption: {post_resp.get('caption')}")
assert post_id is not None, "Post creation failed"

# Verify in database directly
db_post = Post.objects.get(id=post_id)
print(f"-> DB Verification: Post {db_post.id} exists in SQLite. Author: {db_post.author.username}")
assert db_post.caption == post_caption

# 4. Test Like Toggle
print("\n[TEST 4] Toggling Like via POST /post/<id>/like/...")
req = urllib.request.Request(f'http://127.0.0.1:8000/post/{post_id}/like/', data=b'', headers={'X-Requested-With': 'XMLHttpRequest'})
res = opener.open(req)
like_resp = json.loads(res.read().decode())
print(f"-> Like response: is_liked={like_resp.get('is_liked')}, total_likes={like_resp.get('total_likes')}")
assert (like_resp.get('is_liked') is True or like_resp.get('liked') is True)
assert like_resp.get('total_likes') == 1
assert Like.objects.filter(post=db_post, user=db_post.author).exists()

# Untoggle like
res = opener.open(req)
unlike_resp = json.loads(res.read().decode())
print(f"-> Unlike response: is_liked={unlike_resp.get('is_liked')}, total_likes={unlike_resp.get('total_likes')}")
assert (unlike_resp.get('is_liked') is False or unlike_resp.get('liked') is False)
assert unlike_resp.get('total_likes') == 0
assert not Like.objects.filter(post=db_post, user=db_post.author).exists()

# 5. Test Comment Addition
print("\n[TEST 5] Adding Comment via POST /post/<id>/comment/...")
comment_text = "Verifying live database persistence for comments."
comm_payload = urllib.parse.urlencode({'text': comment_text}).encode()
req = urllib.request.Request(f'http://127.0.0.1:8000/post/{post_id}/comment/', data=comm_payload, headers={'X-Requested-With': 'XMLHttpRequest'})
res = opener.open(req)
comm_resp = json.loads(res.read().decode())
print(f"-> Comment response status: {comm_resp.get('status')}, author: {comm_resp.get('comment', {}).get('author', {}).get('username')}")
assert comm_resp.get('status') == 'ok'
db_comment = Comment.objects.filter(post=db_post, text=comment_text).first()
assert db_comment is not None, "Comment not found in DB!"
print(f"-> DB Verification: Comment ID {db_comment.id} stored in SQLite.")

# 6. Test Space (Community) Creation
print("\n[TEST 6] Creating Community Space via POST /communities/create/...")
space_name = "Cyber Defense Node"
space_desc = "Decentralized security enclave."
space_payload = urllib.parse.urlencode({'name': space_name, 'description': space_desc, 'is_private': 'false'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/communities/create/', data=space_payload, headers={'X-Requested-With': 'XMLHttpRequest'})
res = opener.open(req)
space_resp = json.loads(res.read().decode())
print(f"-> Space created: {space_resp.get('community', {}).get('name')}, slug: {space_resp.get('community', {}).get('slug')}")
space_slug = space_resp.get('community', {}).get('slug')
assert space_slug is not None

# Verify Space in DB
db_space = Community.objects.get(slug=space_slug)
print(f"-> DB Verification: Community {db_space.name} (UUID: {db_space.id}) in SQLite.")
channels = list(db_space.channels.values_list('name', flat=True))
print(f"-> DB Verification: Auto-created channels: {channels}")
assert 'general' in channels and 'announcements' in channels
admin_membership = CommunityMembership.objects.filter(community=db_space, user=db_post.author, role='ADMIN').exists()
print(f"-> DB Verification: Creator membership is ADMIN: {admin_membership}")
assert admin_membership is True

# 7. Test Space Join/Leave by Alex Dev
print("\n[TEST 7] Testing Community Join/Leave with second user (alex_dev)...")
cookie_jar_alex = http.cookiejar.CookieJar()
opener_alex = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar_alex))
alex_login = urllib.parse.urlencode({'username': 'alex_dev', 'password': 'password123'}).encode()
opener_alex.open(urllib.request.Request('http://127.0.0.1:8000/accounts/login/', data=alex_login, headers={'X-Requested-With': 'XMLHttpRequest'}))

# Join
req_join = urllib.request.Request(f'http://127.0.0.1:8000/communities/c/{space_slug}/join/', data=b'', headers={'X-Requested-With': 'XMLHttpRequest'})
res_join = opener_alex.open(req_join)
join_resp = json.loads(res_join.read().decode())
print(f"-> Join response status: {join_resp.get('status')}")
assert join_resp.get('status') == 'ok'
alex_user = User.objects.get(username='alex_dev')
assert CommunityMembership.objects.filter(community=db_space, user=alex_user).exists()
print(f"-> DB Verification: alex_dev membership confirmed in SQLite.")

# Leave
req_leave = urllib.request.Request(f'http://127.0.0.1:8000/communities/c/{space_slug}/leave/', data=b'', headers={'X-Requested-With': 'XMLHttpRequest'})
res_leave = opener_alex.open(req_leave)
leave_resp = json.loads(res_leave.read().decode())
print(f"-> Leave response status: {leave_resp.get('status')}")
assert leave_resp.get('status') == 'ok'
assert not CommunityMembership.objects.filter(community=db_space, user=alex_user).exists()
print(f"-> DB Verification: alex_dev membership removed from SQLite.")

# 8. Test Direct Message Chat
print("\n[TEST 8] Sending Direct Message via POST /chat/start/<user_id>/...")
dm_msg = "Live direct messaging pipeline operational."
dm_payload = urllib.parse.urlencode({'content': dm_msg}).encode()
req_dm = urllib.request.Request(f'http://127.0.0.1:8000/chat/start/{alex_user.id}/', data=dm_payload, headers={'X-Requested-With': 'XMLHttpRequest'})
res_dm = opener.open(req_dm)
dm_resp = json.loads(res_dm.read().decode())
print(f"-> DM send status: {dm_resp.get('status')}")
assert dm_resp.get('status') == 'ok'
db_dm = DirectMessage.objects.filter(sender=db_post.author, message=dm_msg).first()
assert db_dm is not None, "DirectMessage not found in DB!"
print(f"-> DB Verification: DirectMessage ID {db_dm.id} saved in SQLite.")

# 9. Test Post Takedown
print("\n[TEST 9] Post Takedown via POST /post/<id>/takedown/...")
req_take = urllib.request.Request(f'http://127.0.0.1:8000/post/{post_id}/takedown/', data=b'', headers={'X-Requested-With': 'XMLHttpRequest'})
res_take = opener.open(req_take)
take_resp = json.loads(res_take.read().decode())
print(f"-> Takedown status: {take_resp.get('status')}")
assert take_resp.get('status') == 'ok'
assert not Post.objects.filter(id=post_id).exists()
print(f"-> DB Verification: Post {post_id} permanently removed from SQLite.")

# Clean up test space to keep DB clean
db_space.delete()

print("\n" + "="*60)
print("ALL BACKEND ENDPOINTS AND DATABASE PERSISTENCE TESTS PASSED 100%!")
print("="*60)
