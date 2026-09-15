from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

# ==============================================================================
# SKELETON: Implement your account views here
# ==============================================================================
#
# 1. register_view(request):
#    - Process UserRegisterForm on POST
#    - Save user with hashed password (set_password)
#    - Redirect to login page on success
#
# 2. login_view(request):
#    - Process AuthenticationForm or custom auth
#    - Authenticate credentials and login(request, user)
#    - Redirect to feed
#
# 3. logout_view(request):
#    - Call logout(request)
#    - Redirect to login page
#
# 4. profile_view(request, username):
#    - Fetch User by username
#    - Fetch user's posts, followers count, following count
#    - Check if the current user is following this profile
#    - Render 'accounts/profile.html'
#
# 5. edit_profile_view(request):
#    - Load current user's profile with ProfileUpdateForm
#    - Handle avatar file uploads and bio updates
#    - Redirect back to profile page
#
# 6. follow_toggle_view(request, username):
#    - If already following -> unfollow (delete record)
#    - If not following -> create Follow record
#    - Redirect back to referring page
# ==============================================================================
