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


import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from posts.utils import detect_media_type, compress_image

class MediaProcessingTestCase(TestCase):
    def test_detect_media_type(self):
        self.assertEqual(detect_media_type('photo.jpg'), 'image')
        self.assertEqual(detect_media_type('clip.mp4'), 'video')
        self.assertEqual(detect_media_type('recording.MOV'), 'video')
        self.assertEqual(detect_media_type('graphic.png'), 'image')

    def test_compress_image(self):
        # Create an uncompressed 1500x1500 image in memory
        image = Image.new('RGB', (1500, 1500), color='blue')
        img_io = io.BytesIO()
        image.save(img_io, format='JPEG', quality=100)
        img_io.seek(0)
        uploaded = SimpleUploadedFile('test.jpg', img_io.getvalue(), content_type='image/jpeg')

        compressed = compress_image(uploaded, max_size=(1080, 1080), quality=85)
        self.assertIsNotNone(compressed)
        
        # Verify resized dimensions
        res_img = Image.open(compressed)
        self.assertLessEqual(res_img.width, 1080)
        self.assertLessEqual(res_img.height, 1080)


from django.urls import reverse

class PostViewsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.login(username='testuser', password='password123')

    def test_feed_view_authenticated(self):
        response = self.client.get(reverse('feed'))
        self.assertEqual(response.status_code, 200)

    def test_explore_view_authenticated(self):
        response = self.client.get(reverse('explore'))
        self.assertEqual(response.status_code, 200)

    def test_create_post_view_image(self):
        # Post an image
        image = Image.new('RGB', (800, 800), color='red')
        img_io = io.BytesIO()
        image.save(img_io, format='JPEG')
        img_io.seek(0)
        uploaded = SimpleUploadedFile('test_feed.jpg', img_io.getvalue(), content_type='image/jpeg')

        response = self.client.post(reverse('create_post'), {
            'media_file': uploaded,
            'caption': 'Hello from test',
        })
        self.assertRedirects(response, reverse('feed'))
        self.assertEqual(Post.objects.count(), 1)
        post = Post.objects.first()
        self.assertEqual(post.media_type, 'image')
        self.assertEqual(post.caption, 'Hello from test')


from django.core.management import call_command

class ManagementCommandTestCase(TestCase):
    def test_populate_and_clear_command(self):
        call_command('populate_data')
        self.assertTrue(User.objects.filter(username='alex_dev').exists())
        self.assertTrue(Post.objects.filter(author__username='alex_dev').exists())

        call_command('populate_data', clear=True)
        self.assertFalse(User.objects.filter(username='alex_dev').exists())
        self.assertFalse(Post.objects.filter(author__username='alex_dev').exists())



