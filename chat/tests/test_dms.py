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

    def test_search_users_by_general_name_and_username(self):
        self.alice.first_name = 'Alice'
        self.alice.last_name = 'Wonderland'
        self.alice.save()

        self.bob.first_name = 'Bob'
        self.bob.last_name = 'Builder'
        self.bob.save()

        # Search by first name
        response = self.client.get('/chat/api/users/?q=Alice')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any(u['username'] == 'alice' for u in data['users']))

        # Search by last name
        response = self.client.get('/chat/api/users/?q=Builder')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any(u['username'] == 'bob' for u in data['users']))

        # Search by full name
        response = self.client.get('/chat/api/users/?q=Alice+Wonderland')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any(u['username'] == 'alice' for u in data['users']))

    def test_start_dm_by_general_name(self):
        self.alice.first_name = 'Alice'
        self.alice.last_name = 'Wonderland'
        self.alice.save()

        self.client.login(username='bob', password='password123')
        
        # Test start DM using general name "Alice"
        response = self.client.get('/chat/dm/Alice/', follow=True)
        self.assertEqual(response.status_code, 200)
        
        # Verify 1-on-1 conversation was created
        conv = Conversation.objects.filter(is_group=False, participants__user=self.bob).first()
        self.assertIsNotNone(conv)
        self.assertTrue(conv.participants.filter(user=self.alice).exists())
