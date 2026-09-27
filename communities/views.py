from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from .models import Community, CommunityMembership
from .utils import user_can_access_community, is_community_admin, get_user_membership


def explore_communities(request):
    query = request.GET.get('q', '').strip()
    communities = Community.objects.all().select_related('creator')
    if query:
        communities = communities.filter(
            Q(name__icontains=query) | Q(description__icontains=query) | Q(rules__icontains=query)
        )

    joined_community_ids = set()
    pending_community_ids = set()
    if request.user.is_authenticated:
        memberships = CommunityMembership.objects.filter(user=request.user)
        for m in memberships:
            if m.status == 'APPROVED':
                joined_community_ids.add(m.community_id)
            elif m.status == 'PENDING':
                pending_community_ids.add(m.community_id)

    return render(request, 'communities/explore.html', {
        'communities': communities,
        'query': query,
        'joined_community_ids': joined_community_ids,
        'pending_community_ids': pending_community_ids,
    })


@login_required
def create_community(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        description = request.POST.get('description', '').strip()
        rules = request.POST.get('rules', '').strip()
        privacy = request.POST.get('privacy', 'PUBLIC')
        avatar = request.FILES.get('avatar')
        banner = request.FILES.get('banner')

        if not name:
            messages.error(request, "Community name is required.")
            return render(request, 'communities/create.html')

        community = Community.objects.create(
            name=name,
            description=description,
            rules=rules,
            privacy=privacy,
            avatar=avatar,
            banner=banner,
            creator=request.user,
        )
        # Add creator as Admin
        CommunityMembership.objects.create(
            community=community,
            user=request.user,
            role='ADMIN',
            status='APPROVED',
        )
        messages.success(request, f"Community '{community.name}' created successfully!")
        return redirect('communities:detail', slug=community.slug)

    return render(request, 'communities/create.html')


def community_detail(request, slug):
    community = get_object_or_404(Community.objects.select_related('creator'), slug=slug)
    membership = get_user_membership(request.user, community)
    is_admin = is_community_admin(request.user, community)
    can_access = user_can_access_community(request.user, community)

    if not can_access:
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

    return render(request, 'communities/detail.html', {
        'community': community,
        'membership': membership,
        'is_admin': is_admin,
        'posts': posts,
        'channels': channels,
    })


@login_required
def request_to_join(request, slug):
    community = get_object_or_404(Community, slug=slug)
    membership = get_user_membership(request.user, community)

    if membership:
        if membership.status == 'APPROVED':
            messages.info(request, "You are already a member of this community.")
            return redirect('communities:detail', slug=slug)
        elif membership.status == 'PENDING':
            messages.info(request, "Your request to join is already pending admin review.")
            return redirect('communities:detail', slug=slug)
        elif membership.status == 'BANNED':
            messages.error(request, "You have been restricted from joining this community.")
            return redirect('communities:explore')

    status = 'APPROVED' if community.privacy == 'PUBLIC' else 'PENDING'
    CommunityMembership.objects.create(
        community=community,
        user=request.user,
        role='MEMBER',
        status=status,
    )

    if status == 'APPROVED':
        messages.success(request, f"Welcome to {community.name}!")
    else:
        messages.info(request, f"Join request sent to the administrators of {community.name}.")

    return redirect('communities:detail', slug=slug)


@login_required
def leave_community(request, slug):
    community = get_object_or_404(Community, slug=slug)
    if community.creator == request.user:
        messages.error(request, "The community creator cannot leave their own community.")
        return redirect('communities:detail', slug=slug)

    membership = get_user_membership(request.user, community)
    if membership:
        membership.delete()
        messages.success(request, f"You have left {community.name}.")

    return redirect('communities:explore')


@login_required
def manage_members(request, slug):
    community = get_object_or_404(Community, slug=slug)
    if not is_community_admin(request.user, community):
        raise PermissionDenied("Only administrators can manage community memberships.")

    pending_requests = community.memberships.filter(status='PENDING').select_related('user')
    approved_members = community.memberships.filter(status='APPROVED').select_related('user')

    return render(request, 'communities/manage_members.html', {
        'community': community,
        'pending_requests': pending_requests,
        'approved_members': approved_members,
    })


@login_required
def approve_request(request, slug, membership_id):
    community = get_object_or_404(Community, slug=slug)
    if not is_community_admin(request.user, community):
        raise PermissionDenied("Only administrators can approve join requests.")

    membership = get_object_or_404(CommunityMembership, id=membership_id, community=community)
    membership.status = 'APPROVED'
    membership.save()
    messages.success(request, f"Approved {membership.user.username} to join {community.name}.")
    return redirect('communities:manage_members', slug=slug)


@login_required
def reject_request(request, slug, membership_id):
    community = get_object_or_404(Community, slug=slug)
    if not is_community_admin(request.user, community):
        raise PermissionDenied("Only administrators can reject join requests.")

    membership = get_object_or_404(CommunityMembership, id=membership_id, community=community)
    membership.delete()
    messages.info(request, f"Declined join request from {membership.user.username}.")
    return redirect('communities:manage_members', slug=slug)
