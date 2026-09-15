from django.db import models
from django.contrib.auth.models import User

# ==============================================================================
# SKELETON: Define your post models here
# ==============================================================================
#
# 1. Post Model:
#    - author: ForeignKey to User (CASCADE, related_name='posts')
#    - image: ImageField (upload_to='posts/')
#    - caption: TextField (blank=True)
#    - created_at: DateTimeField (auto_now_add=True)
#    - updated_at: DateTimeField (auto_now=True)
#    - Meta: ordering = ['-created_at']
#
# 2. Like Model:
#    - post: ForeignKey to Post (CASCADE, related_name='likes')
#    - user: ForeignKey to User (CASCADE, related_name='liked_posts')
#    - created_at: DateTimeField (auto_now_add=True)
#    - Meta: unique_together = ('post', 'user')
#
# 3. Comment Model:
#    - post: ForeignKey to Post (CASCADE, related_name='comments')
#    - author: ForeignKey to User (CASCADE, related_name='comments')
#    - text: TextField (max_length=500)
#    - created_at: DateTimeField (auto_now_add=True)
#    - Meta: ordering = ['created_at']
# ==============================================================================
