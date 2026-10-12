import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from .models import Profile, Follow
from .forms import UserRegisterForm, ProfileUpdateForm


def csrf_view(request):
    """Returns the CSRF token for frontend fetch calls."""
    return JsonResponse({'status': 'ok', 'csrfToken': get_token(request)})


def me_view(request):
    """Returns the currently authenticated user status."""
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        return JsonResponse({
            'status': 'ok',
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'is_authenticated': True,
                'role': 'ADMIN' if request.user.is_superuser else 'MEMBER',
                'avatar': profile.avatar.url if profile and profile.avatar else None,
                'bio': profile.bio if profile else '',
            }
        })
    # Dev fallback to sarah_creator if present
    sarah = User.objects.filter(username='sarah_creator').first()
    if sarah:
        profile = getattr(sarah, 'profile', None)
        return JsonResponse({
            'status': 'ok',
            'user': {
                'id': sarah.id,
                'username': sarah.username,
                'email': sarah.email,
                'is_authenticated': False,
                'suggested_username': 'sarah_creator',
                'role': 'ADMIN',
                'avatar': profile.avatar.url if profile and profile.avatar else None,
                'bio': profile.bio if profile else '',
            }
        })
    return JsonResponse({
        'status': 'ok',
        'user': {'username': 'cybernaut', 'is_authenticated': False}
    })


@csrf_exempt
def register_view(request):
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if request.user.is_authenticated:
        if is_json:
            return JsonResponse({'status': 'ok', 'user': {'username': request.user.username, 'is_authenticated': True}})
        return redirect('feed')

    if request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                username = body.get('username', '').strip()
                email = body.get('email', '').strip()
                password = body.get('password', '')
            except Exception:
                username, email, password = '', '', ''
        else:
            username = request.POST.get('username', '').strip()
            email = request.POST.get('email', '').strip()
            password = request.POST.get('password', '')

        if not username or not password:
            if is_json:
                return JsonResponse({'status': 'error', 'error': 'Username and password are required.'}, status=400)
            messages.error(request, 'Username and password are required.')
            return render(request, 'accounts/register.html', {'form': UserRegisterForm()})

        if User.objects.filter(username=username).exists():
            if is_json:
                return JsonResponse({'status': 'error', 'error': 'Username already taken.'}, status=400)
            messages.error(request, 'Username already taken.')
            return render(request, 'accounts/register.html', {'form': UserRegisterForm()})

        user = User.objects.create_user(username=username, email=email, password=password)
        # Ensure Profile exists
        Profile.objects.get_or_create(user=user)
        login(request, user)

        if is_json:
            return JsonResponse({
                'status': 'ok',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'is_authenticated': True,
                    'role': 'MEMBER'
                }
            })
        messages.success(request, f"Welcome, {user.username}! Your account has been created.")
        return redirect('feed')

    return render(request, 'accounts/register.html', {'form': UserRegisterForm()})


@csrf_exempt
def login_view(request):
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if request.user.is_authenticated:
        if is_json:
            return JsonResponse({'status': 'ok', 'user': {'id': request.user.id, 'username': request.user.username, 'is_authenticated': True}})
        return redirect('feed')

    if request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                username = body.get('username', '').strip()
                password = body.get('password', '')
            except Exception:
                username, password = '', ''
        else:
            username = request.POST.get('username', '').strip()
            password = request.POST.get('password', '')

        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            profile = getattr(user, 'profile', None)
            if is_json:
                return JsonResponse({
                    'status': 'ok',
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'is_authenticated': True,
                        'role': 'ADMIN' if user.is_superuser else 'MEMBER',
                        'avatar': profile.avatar.url if profile and profile.avatar else None,
                        'bio': profile.bio if profile else '',
                    }
                })
            return redirect('feed')
        else:
            if is_json:
                return JsonResponse({'status': 'error', 'error': 'Invalid username or password.'}, status=400)
            messages.error(request, "Invalid username or password.")
    
    return render(request, 'accounts/login.html', {'form': AuthenticationForm()})


@csrf_exempt
def logout_view(request):
    logout(request)
    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok'})
    messages.info(request, "You have been logged out.")
    return redirect('login')


def profile_view(request, username):
    target_user = get_object_or_404(User, username=username)
    user_posts = target_user.posts.all().select_related('community').prefetch_related('media_items', 'likes', 'comments')
    
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
    is_following = Follow.objects.filter(follower=curr_user, following=target_user).exists() if curr_user else False
    
    followers_count = target_user.followers_set.count()
    following_count = target_user.following_set.count()
    posts_count = user_posts.count()

    profile = getattr(target_user, 'profile', None)

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        formatted_posts = []
        for p in user_posts:
            first_media = p.media_items.first()
            formatted_posts.append({
                'id': p.id,
                'caption': p.caption,
                'thumbnail': first_media.thumbnail.url if first_media and first_media.thumbnail else (p.thumbnail.url if p.thumbnail else None),
                'media_file': first_media.file.url if first_media and first_media.file else (p.media_file.url if p.media_file else None),
                'total_likes': p.like_count,
                'total_comments': p.comment_count,
                'is_video': p.media_type == 'video',
                'created_at': p.created_at.isoformat(),
            })

        return JsonResponse({
            'status': 'ok',
            'target_user': {
                'id': target_user.id,
                'username': target_user.username,
            },
            'profile': {
                'bio': profile.bio if profile else '',
                'avatar': profile.avatar.url if profile and profile.avatar else None,
                'role': 'ADMIN' if target_user.is_superuser else 'MEMBER',
            },
            'posts': formatted_posts,
            'is_following': is_following,
            'followers_count': followers_count,
            'following_count': following_count,
            'posts_count': posts_count,
        })

    context = {
        'target_user': target_user,
        'profile': profile,
        'posts': user_posts,
        'is_following': is_following,
        'followers_count': followers_count,
        'following_count': following_count,
        'posts_count': posts_count,
    }
    return render(request, 'accounts/profile.html', context)


@csrf_exempt
def edit_profile_view(request):
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
    if not curr_user:
        return JsonResponse({'status': 'error', 'error': 'Not authenticated.'}, status=401)
    
    profile, _ = Profile.objects.get_or_create(user=curr_user)

    if request.method == 'POST':
        bio = request.POST.get('bio')
        avatar = request.FILES.get('avatar')
        if bio is not None:
            profile.bio = bio.strip()
        if avatar:
            profile.avatar = avatar
        profile.save()

        if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'ok',
                'profile': {
                    'bio': profile.bio,
                    'avatar': profile.avatar.url if profile.avatar else None,
                }
            })
        messages.success(request, "Profile updated successfully!")
        return redirect('profile', username=curr_user.username)

    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'profile': {
                'bio': profile.bio,
                'avatar': profile.avatar.url if profile.avatar else None,
            }
        })
    return render(request, 'accounts/edit_profile.html', {'form': ProfileUpdateForm(instance=profile)})


@csrf_exempt
def follow_toggle_view(request, username):
    target_user = get_object_or_404(User, username=username)
    curr_user = request.user if request.user.is_authenticated else User.objects.filter(username='sarah_creator').first()
    
    is_following = False
    if curr_user and target_user != curr_user:
        follow_rel = Follow.objects.filter(follower=curr_user, following=target_user)
        if follow_rel.exists():
            follow_rel.delete()
            is_following = False
        else:
            Follow.objects.create(follower=curr_user, following=target_user)
            is_following = True

    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({
            'status': 'ok',
            'is_following': is_following,
            'followers_count': target_user.followers_set.count(),
        })

    return redirect('profile', username=username)
