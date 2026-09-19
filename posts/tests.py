from django.test import TestCase
from django.contrib.auth.models import User
from posts.models import Post, Like, Comment
from accounts.models import Profile, Follow

class ModelsTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='alice', password='password123')
        self.user2 = User.objects.create_user(username='bob', password='password123')

    def test_profile_auto_created(self):
        self.assertTrue(hasattr(self.user1, 'profile'))

    def test_follow_creation(self):
        follow = Follow.objects.create(follower=self.user1, following=self.user2)
        self.assertEqual(follow.follower.username, 'alice')

    def test_image_post_creation(self):
        post = Post.objects.create(author=self.user1, media_type='image', caption='Test Image')
        self.assertTrue(post.is_image)
        self.assertFalse(post.is_video)

    def test_video_post_creation(self):
        post = Post.objects.create(author=self.user1, media_type='video', caption='Test Video')
        self.assertTrue(post.is_video)
        self.assertFalse(post.is_image)

    def test_like_and_comment(self):
        post = Post.objects.create(author=self.user1, media_type='image', caption='Nice photo')
        Like.objects.create(post=post, user=self.user2)
        Comment.objects.create(post=post, author=self.user2, text='Awesome post!')
        self.assertEqual(post.total_likes, 1)
        self.assertEqual(post.total_comments, 1)
