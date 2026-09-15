from django.db import models
from django.contrib.auth.models import User

# ==============================================================================
# SKELETON: Define your account models here
# ==============================================================================
#
# 1. Profile Model:
#    - user: OneToOneField to User (CASCADE)
#    - avatar: ImageField (upload_to='avatars/', default placeholder)
#    - bio: TextField (max_length=500, blank=True)
#    - created_at: DateTimeField (auto_now_add=True)
#
# 2. Follow Model:
#    - follower: ForeignKey to User (related_name='following_set')
#    - following: ForeignKey to User (related_name='followers_set')
#    - created_at: DateTimeField (auto_now_add=True)
#    - Meta: unique_together = ('follower', 'following')
#
# 3. Signals (Optional but recommended):
#    - post_save signal on User model to automatically create Profile on signup.
# ==============================================================================
