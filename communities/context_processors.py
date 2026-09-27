from .models import CommunityMembership


def community_context(request):
    if request.user.is_authenticated:
        approved_memberships = CommunityMembership.objects.filter(
            user=request.user,
            status='APPROVED'
        ).select_related('community')
        return {
            'user_approved_memberships': approved_memberships,
            'joined_communities': [m.community for m in approved_memberships],
        }
    return {
        'user_approved_memberships': [],
        'joined_communities': [],
    }
