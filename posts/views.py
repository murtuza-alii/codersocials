from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

# ==============================================================================
# SKELETON: Implement your post and feed views here
# ==============================================================================
#
# 1. feed_view(request):
#    - Get list of users the current user follows
#    - Fetch posts authored by these users (and current user)
#    - Order by -created_at
#    - Render 'posts/feed.html'
#
# 2. explore_view(request):
#    - Fetch all recent posts across the platform
#    - Render 'posts/explore.html'
#
# 3. create_post_view(request):
#    - Handle PostCreateForm on POST (with request.FILES for media upload)
#    - Associate author = request.user
#    - Save and redirect to feed
#
# 4. post_detail_view(request, pk):
#    - Fetch post by ID (pk)
#    - Fetch associated comments
#    - Handle CommentForm submissions
#    - Render 'posts/post_detail.html'
#
# 5. like_toggle_view(request, pk):
#    - Check if current user already liked post
#    - If liked: delete Like object
#    - If not liked: create Like object
#    - Redirect back
#
# 6. add_comment_view(request, pk):
#    - Process CommentForm for post
#    - Save comment with author = request.user
#    - Redirect back
# ==============================================================================
