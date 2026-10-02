from .models import CommunityMembership


def user_can_access_community(user, community):
    """
    Check if a user has access to view and interact inside a community.
    Public communities are accessible by all users.
    Private communities require an active membership with status 'APPROVED'.
    """
    if community.privacy == 'PUBLIC':
        return True
    if not user.is_authenticated:
        return False
    return CommunityMembership.objects.filter(
        community=community,
        user=user,
        status='APPROVED'
    ).exists()


def is_community_admin(user, community):
    """
    Check if a user is an administrator or creator of a community.
    """
    if not user.is_authenticated:
        return False
    if user == community.creator:
        return True
    return CommunityMembership.objects.filter(
        community=community,
        user=user,
        role__in=['ADMIN', 'MODERATOR'],
        status='APPROVED'
    ).exists()


def get_user_membership(user, community):
    """
    Returns the user's CommunityMembership object or None.
    """
    if not user.is_authenticated:
        return None
    return CommunityMembership.objects.filter(community=community, user=user).first()
