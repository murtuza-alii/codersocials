from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from .models import Profile, Follow
from .forms import UserRegisterForm, ProfileUpdateForm


def register_view(request):
    if request.user.is_authenticated:
        return redirect('feed')

    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, f"Welcome, {user.username}! Your account has been created.")
            return redirect('login')
    else:
        form = UserRegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect('feed')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('feed')
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid credentials.")
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/login.html', {'form': form})


@login_required
def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('login')


@login_required
def profile_view(request, username):
    target_user = get_object_or_404(User, username=username)
    user_posts = target_user.posts.all()
    is_following = Follow.objects.filter(follower=request.user, following=target_user).exists()
    
    followers_count = target_user.followers_set.count()
    following_count = target_user.following_set.count()
    posts_count = user_posts.count()

    context = {
        'target_user': target_user,
        'profile': target_user.profile,
        'posts': user_posts,
        'is_following': is_following,
        'followers_count': followers_count,
        'following_count': following_count,
        'posts_count': posts_count,
    }
    return render(request, 'accounts/profile.html', context)


@login_required
def edit_profile_view(request):
    profile = request.user.profile
    if request.method == 'POST':
        form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, "Profile updated successfully!")
            return redirect('profile', username=request.user.username)
    else:
        form = ProfileUpdateForm(instance=profile)
    return render(request, 'accounts/edit_profile.html', {'form': form})


@login_required
def follow_toggle_view(request, username):
    target_user = get_object_or_404(User, username=username)
    if target_user != request.user:
        follow_rel = Follow.objects.filter(follower=request.user, following=target_user)
        if follow_rel.exists():
            follow_rel.delete()
        else:
            Follow.objects.create(follower=request.user, following=target_user)
    return redirect('profile', username=username)
