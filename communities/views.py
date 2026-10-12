import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.http import JsonResponse
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from .models import Community, CommunityMembership
from .utils import user_can_access_community, is_community_admin, get_user_membership
from chat.models import CommunityChannel


def get_current_user(request):
    if request.user.is_authenticated:
        return request.user
    return User.objects.filter(username='sarah_creator').first()


def explore_communities(request):
    query = request.GET.get('q', '').strip()
    communities = Community.objects.all().select_related('creator').prefetch_related('channels')
    if query:
        communities = communities.filter(
            Q(name__icontains=query) | Q(description__icontains=query) | Q(rules__icontains=query)
        )

    curr_user = get_current_user(request)
    joined_community_ids = set()
    pending_community_ids = set()
    if curr_user:
        memberships = CommunityMembership.objects.filter(user=curr_user)
        for m in memberships:
            if m.status == 'APPROVED':
                joined_community_ids.add(m.community_id)
            elif m.status == 'PENDING':
                pending_community_ids.add(m.community_id)

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = []
        for c in communities:
            channels_list = [
                {
                    'id': str(ch.id),
                    'name': ch.name,
                    'slug': ch.slug,
                    'is_announcement': ch.is_announcement,
                    'topic': ch.topic
                }
                for ch in c.channels.all()
            ]
            is_joined = c.id in joined_community_ids
            data.append({
                'id': str(c.id),
                'name': c.name,
                'slug': c.slug,
                'description': c.description,
                'rules': c.rules,
                'privacy': c.privacy,
                'member_count': c.member_count,
                'is_member': is_joined,
                'is_joined': is_joined,
                'is_pending': c.id in pending_community_ids,
                'avatar': c.avatar.url if c.avatar else None,
                'banner': c.banner.url if c.banner else None,
                'channels': channels_list,
            })
        return JsonResponse({'status': 'ok', 'communities': data})

    return render(request, 'communities/explore.html', {
        'communities': communities,
        'query': query,
        'joined_community_ids': joined_community_ids,
        'pending_community_ids': pending_community_ids,
    })


@csrf_exempt
def create_community(request):
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    if request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                name = body.get('name', '').strip()
                description = body.get('description', '').strip()
                rules = body.get('rules', '').strip()
                privacy = body.get('privacy', 'PUBLIC').upper()
                avatar = None
                banner = None
            except Exception:
                name, description, rules, privacy = '', '', '', 'PUBLIC'
                avatar, banner = None, None
        else:
            name = request.POST.get('name', '').strip()
            description = request.POST.get('description', '').strip()
            rules = request.POST.get('rules', '').strip()
            privacy = request.POST.get('privacy', 'PUBLIC').upper()
            avatar = request.FILES.get('avatar')
            banner = request.FILES.get('banner')

        if not name:
            if is_json:
                return JsonResponse({'status': 'error', 'error': 'Community name is required.'}, status=400)
            messages.error(request, "Community name is required.")
            return render(request, 'communities/create.html')

        if privacy not in ['PUBLIC', 'PRIVATE']:
            privacy = 'PUBLIC'

        # Generate base slug and guarantee uniqueness
        base_slug = slugify(name) or 'space'
        candidate_slug = base_slug
        counter = 1
        while Community.objects.filter(slug=candidate_slug).exists():
            candidate_slug = f"{base_slug}-{counter}"
            counter += 1

        community = Community.objects.create(
            name=name,
            slug=candidate_slug,
            description=description,
            rules=rules,
            privacy=privacy,
            avatar=avatar,
            banner=banner,
            creator=curr_user,
        )

        # Add creator as Admin
        CommunityMembership.objects.create(
            community=community,
            user=curr_user,
            role='ADMIN',
            status='APPROVED',
        )

        # Create default channels
        ch1 = CommunityChannel.objects.create(
            community=community,
            name='announcements',
            topic=f'{community.name} official updates',
            is_announcement=True,
        )
        ch2 = CommunityChannel.objects.create(
            community=community,
            name='general',
            topic=f'General discussion for {community.name}',
            is_announcement=False,
        )

        channels_list = [
            {'id': str(ch1.id), 'name': ch1.name, 'slug': ch1.slug, 'is_announcement': True, 'topic': ch1.topic},
            {'id': str(ch2.id), 'name': ch2.name, 'slug': ch2.slug, 'is_announcement': False, 'topic': ch2.topic},
        ]

        if is_json:
            return JsonResponse({
                'status': 'ok',
                'community': {
                    'id': str(community.id),
                    'name': community.name,
                    'slug': community.slug,
                    'description': community.description,
                    'rules': community.rules,
                    'privacy': community.privacy,
                    'member_count': 1,
                    'is_member': True,
                    'is_joined': True,
                    'is_admin': True,
                    'can_access': True,
                    'avatar': community.avatar.url if community.avatar else None,
                    'banner': community.banner.url if community.banner else None,
                    'channels': channels_list,
                }
            })

        messages.success(request, f"Community '{community.name}' created successfully!")
        return redirect('communities:detail', slug=community.slug)

    return render(request, 'communities/create.html')


def community_detail(request, slug):
    community = get_object_or_404(Community.objects.select_related('creator'), slug=slug)
    curr_user = get_current_user(request)

    membership = get_user_membership(curr_user, community) if curr_user else None
    is_admin = is_community_admin(curr_user, community) if curr_user else False
    can_access = user_can_access_community(curr_user, community) if curr_user else (community.privacy == 'PUBLIC')

    if not can_access:
        if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'gated',
                'community': {
                    'id': str(community.id),
                    'name': community.name,
                    'slug': community.slug,
                    'description': community.description,
                    'rules': community.rules,
                    'privacy': community.privacy,
                    'member_count': community.member_count,
                    'is_member': False,
                    'is_joined': False,
                    'is_admin': False,
                    'can_access': False,
                },
                'membership': {'status': membership.status if membership else None, 'role': membership.role if membership else None},
                'is_admin': False,
                'channels': [],
                'posts': [],
            })
        return render(request, 'communities/gated_landing.html', {
            'community': community,
            'membership': membership,
            'is_admin': False,
        })

    # Fetch posts inside this community
    posts = community.posts.all().select_related('author', 'author__profile').prefetch_related(
        'media_items', 'likes', 'comments', 'comments__author'
    )
    channels = community.channels.all()

    if request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        posts_data = []
        for p in posts[:30]:
            media_items = [
                {
                    'id': m.id,
                    'file': m.file.url if m.file else None,
                    'thumbnail': m.thumbnail.url if m.thumbnail else None,
                    'media_type': m.media_type,
                    'is_video': m.media_type == 'video',
                }
                for m in p.media_items.all()
            ]
            comments_data = [
                {
                    'id': c.id,
                    'author': {'username': c.author.username},
                    'text': c.text,
                    'created_at': c.created_at.isoformat(),
                }
                for c in p.comments.all()
            ]
            posts_data.append({
                'id': p.id,
                'author': {
                    'username': p.author.username,
                    'avatar': p.author.profile.avatar.url if hasattr(p.author, 'profile') and p.author.profile.avatar else None,
                    'profile': {'role': 'ADMIN' if is_community_admin(p.author, community) else 'MEMBER'}
                },
                'caption': p.caption,
                'created_at': p.created_at.isoformat(),
                'total_likes': p.likes.count(),
                'total_comments': p.comments.count(),
                'is_liked': p.likes.filter(user=curr_user).exists() if curr_user else False,
                'can_takedown': (curr_user == p.author or is_admin) if curr_user else False,
                'media_items': media_items,
                'comments': comments_data,
            })

        is_member = membership.status == 'APPROVED' if membership else False
        return JsonResponse({
            'status': 'ok',
            'community': {
                'id': str(community.id),
                'name': community.name,
                'slug': community.slug,
                'description': community.description,
                'rules': community.rules,
                'privacy': community.privacy,
                'member_count': community.member_count,
                'is_member': is_member,
                'is_joined': is_member,
                'is_admin': is_admin,
                'can_access': True,
                'creator': {'username': community.creator.username} if community.creator else None,
                'channels': [{'id': str(ch.id), 'name': ch.name, 'slug': ch.slug, 'is_announcement': ch.is_announcement, 'topic': ch.topic} for ch in channels],
            },
            'channels': [{'id': str(ch.id), 'name': ch.name, 'slug': ch.slug, 'is_announcement': ch.is_announcement, 'topic': ch.topic} for ch in channels],
            'membership': {'status': membership.status if membership else None, 'role': membership.role if membership else None},
            'is_admin': is_admin,
            'posts': posts_data,
        })

    return render(request, 'communities/detail.html', {
        'community': community,
        'membership': membership,
        'is_admin': is_admin,
        'posts': posts,
        'channels': channels,
    })


@csrf_exempt
def request_to_join(request, slug):
    community = get_object_or_404(Community, slug=slug)
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    membership = get_user_membership(curr_user, community)

    if membership:
        if is_json:
            return JsonResponse({
                'status': 'ok',
                'is_member': membership.status == 'APPROVED',
                'is_joined': membership.status == 'APPROVED',
                'is_pending': membership.status == 'PENDING',
                'member_count': community.member_count,
            })
        return redirect('communities:detail', slug=slug)

    status = 'APPROVED' if community.privacy == 'PUBLIC' else 'PENDING'
    CommunityMembership.objects.create(
        community=community,
        user=curr_user,
        role='MEMBER',
        status=status,
    )

    if is_json:
        return JsonResponse({
            'status': 'ok',
            'is_member': status == 'APPROVED',
            'is_joined': status == 'APPROVED',
            'is_pending': status == 'PENDING',
            'member_count': community.member_count,
        })

    if status == 'APPROVED':
        messages.success(request, f"Welcome to {community.name}!")
    else:
        messages.info(request, f"Join request sent to the administrators of {community.name}.")

    return redirect('communities:detail', slug=slug)


@csrf_exempt
def leave_community(request, slug):
    community = get_object_or_404(Community, slug=slug)
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    if community.creator == curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Creator cannot leave community.'}, status=400)
        messages.error(request, "The community creator cannot leave their own community.")
        return redirect('communities:detail', slug=slug)

    membership = get_user_membership(curr_user, community)
    if membership:
        membership.delete()

    if is_json:
        return JsonResponse({
            'status': 'ok',
            'is_member': False,
            'is_joined': False,
            'is_pending': False,
            'member_count': community.member_count,
        })

    messages.success(request, f"You have left {community.name}.")
    return redirect('communities:explore')


@login_required
def manage_members(request, slug):
    community = get_object_or_404(Community, slug=slug)
    curr_user = get_current_user(request)
    if not is_community_admin(curr_user, community):
        raise PermissionDenied("Only administrators can manage community memberships.")

    pending_requests = community.memberships.filter(status='PENDING').select_related('user')
    approved_members = community.memberships.filter(status='APPROVED').select_related('user')

    return render(request, 'communities/manage_members.html', {
        'community': community,
        'pending_requests': pending_requests,
        'approved_members': approved_members,
    })


@csrf_exempt
def approve_request(request, slug, membership_id):
    community = get_object_or_404(Community, slug=slug)
    curr_user = get_current_user(request)
    if not is_community_admin(curr_user, community):
        raise PermissionDenied("Only administrators can approve join requests.")

    membership = get_object_or_404(CommunityMembership, id=membership_id, community=community)
    membership.status = 'APPROVED'
    membership.save()

    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'membership_id': membership_id, 'user': membership.user.username})

    messages.success(request, f"Approved {membership.user.username} to join {community.name}.")
    return redirect('communities:manage_members', slug=slug)


@csrf_exempt
def reject_request(request, slug, membership_id):
    community = get_object_or_404(Community, slug=slug)
    curr_user = get_current_user(request)
    if not is_community_admin(curr_user, community):
        raise PermissionDenied("Only administrators can reject join requests.")

    membership = get_object_or_404(CommunityMembership, id=membership_id, community=community)
    membership.delete()

    if request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'membership_id': membership_id})

    messages.info(request, f"Declined join request from {membership.user.username}.")
    return redirect('communities:manage_members', slug=slug)
