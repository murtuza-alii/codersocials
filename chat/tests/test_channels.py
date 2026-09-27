from django.test import TestCase
from django.contrib.auth.models import User
from communities.models import Community, CommunityMembership
from chat.models import CommunityChannel, ChannelMessage


class CommunityChannelsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('chatter', password='password123')
        self.comm = Community.objects.create(name='Dev Hub', creator=self.user)
        CommunityMembership.objects.create(community=self.comm, user=self.user, status='APPROVED')

    def test_create_channel_and_send_message(self):
        channel = CommunityChannel.objects.create(community=self.comm, name='general', slug='general')
        msg = ChannelMessage.objects.create(channel=channel, sender=self.user, message='Hello world!')
        self.assertEqual(channel.messages.count(), 1)
        self.assertEqual(msg.message, 'Hello world!')
        self.assertEqual(channel.community, self.comm)
