from django.test import TestCase
from django.contrib.auth.models import User
from chat.models import Conversation, ConversationParticipant, DirectMessage


class DirectMessagingTest(TestCase):
    def setUp(self):
        self.alice = User.objects.create_user('alice', password='password123')
        self.bob = User.objects.create_user('bob', password='password123')
        self.charlie = User.objects.create_user('charlie', password='password123')

    def test_create_personal_group_chat(self):
        conv = Conversation.objects.create(is_group=True, title='Weekend Hackers')
        ConversationParticipant.objects.create(conversation=conv, user=self.alice, is_admin=True)
        ConversationParticipant.objects.create(conversation=conv, user=self.bob)
        ConversationParticipant.objects.create(conversation=conv, user=self.charlie)

        DirectMessage.objects.create(conversation=conv, sender=self.alice, message='Welcome to our personal group!')
        self.assertEqual(conv.participants.count(), 3)
        self.assertEqual(conv.messages.count(), 1)
        self.assertTrue(conv.is_group)

    def test_1_on_1_dm_recipient_helper(self):
        conv = Conversation.objects.create(is_group=False)
        ConversationParticipant.objects.create(conversation=conv, user=self.alice)
        ConversationParticipant.objects.create(conversation=conv, user=self.bob)

        self.assertEqual(conv.get_recipient(self.alice), self.bob)
        self.assertEqual(conv.get_recipient(self.bob), self.alice)
