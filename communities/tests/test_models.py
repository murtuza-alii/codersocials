from django.test import TestCase
from django.contrib.auth.models import User
from communities.models import Community, CommunityMembership


class CommunityModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='password123')

    def test_create_community_with_defaults(self):
        comm = Community.objects.create(
            name='Tech Sanctuary',
            description='A safe tech space',
            privacy='PRIVATE',
            creator=self.user
        )
        self.assertEqual(comm.name, 'Tech Sanctuary')
        self.assertEqual(comm.privacy, 'PRIVATE')
        self.assertEqual(comm.slug, 'tech-sanctuary')
        self.assertEqual(str(comm), 'Tech Sanctuary')

    def test_membership_creation_and_roles(self):
        comm = Community.objects.create(name='Public Hub', creator=self.user)
        membership = CommunityMembership.objects.create(
            community=comm,
            user=self.user,
            role='ADMIN',
            status='APPROVED'
        )
        self.assertEqual(membership.role, 'ADMIN')
        self.assertEqual(membership.status, 'APPROVED')
        self.assertIn('alice in Public Hub', str(membership))
