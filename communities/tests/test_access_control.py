from django.test import TestCase, Client
from django.contrib.auth.models import User
from communities.models import Community, CommunityMembership
from communities.utils import user_can_access_community, is_community_admin


class CommunityAccessControlTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user('owner', password='password123')
        self.member = User.objects.create_user('member', password='password123')
        self.outsider = User.objects.create_user('outsider', password='password123')

        self.public_comm = Community.objects.create(name='Open Park', privacy='PUBLIC', creator=self.owner)
        self.private_comm = Community.objects.create(name='Secret Vault', privacy='PRIVATE', creator=self.owner)

        CommunityMembership.objects.create(community=self.private_comm, user=self.owner, role='ADMIN', status='APPROVED')
        CommunityMembership.objects.create(community=self.private_comm, user=self.member, role='MEMBER', status='APPROVED')

    def test_public_community_accessible_by_all(self):
        self.assertTrue(user_can_access_community(self.outsider, self.public_comm))

    def test_private_community_accessible_only_by_approved_members(self):
        self.assertTrue(user_can_access_community(self.member, self.private_comm))
        self.assertFalse(user_can_access_community(self.outsider, self.private_comm))

    def test_pending_join_request_does_not_grant_access(self):
        CommunityMembership.objects.create(community=self.private_comm, user=self.outsider, status='PENDING')
        self.assertFalse(user_can_access_community(self.outsider, self.private_comm))

    def test_admin_check(self):
        self.assertTrue(is_community_admin(self.owner, self.private_comm))
        self.assertFalse(is_community_admin(self.member, self.private_comm))
        self.assertFalse(is_community_admin(self.outsider, self.private_comm))
