from django.db.models import Q
from communities.models import Community, CommunityMembership
from .models import Post


def get_isolated_home_feed(user):
    """
    Returns an isolated feed of posts for the user:
    - Guaranteed: Posts from private communities are ONLY included if the user has an APPROVED membership.
    - If the user belongs to approved communities, returns posts from those communities.
    - If user has no joined communities yet, returns posts from public communities and unassigned general posts.
    - Non-authenticated users can only see public posts.
    """
    if not user.is_authenticated:
        return Post.objects.filter(
            Q(community__isnull=True) | Q(community__privacy='PUBLIC')
        ).select_related('author', 'author__profile', 'community').prefetch_related(
            'media_items', 'likes', 'comments', 'comments__author'
        ).order_by('-created_at')

    approved_comm_ids = list(
        CommunityMembership.objects.filter(
            user=user,
            status='APPROVED'
        ).values_list('community_id', flat=True)
    )

    if approved_comm_ids:
        # Posts from communities the user is an approved member of + user's own posts
        feed_query = Q(community_id__in=approved_comm_ids) | Q(author=user)
    else:
        # User hasn't joined any private communities yet: show public communities
        feed_query = Q(community__isnull=True) | Q(community__privacy='PUBLIC') | Q(author=user)

    return Post.objects.filter(feed_query).select_related(
        'author', 'author__profile', 'community'
    ).prefetch_related(
        'media_items', 'likes', 'comments', 'comments__author'
    ).distinct().order_by('-created_at')
