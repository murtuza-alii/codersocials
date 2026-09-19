import os
import io
import tempfile
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from posts.models import Post, Like, Comment
from posts.utils import compress_image, process_video
from accounts.models import Follow

MOCK_USERNAMES = ['alex_dev', 'sarah_creator', 'code_ninja']


class Command(BaseCommand):
    help = 'Populates mock data (users, photos, videos, follows, likes, comments) or clears it with --clear.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all mock data and generated files.'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_mock_data()
        else:
            self.populate_mock_data()

    def clear_mock_data(self):
        self.stdout.write(self.style.WARNING("Clearing all mock data..."))
        users = User.objects.filter(username__in=MOCK_USERNAMES)
        
        # Delete associated media files on disk
        posts = Post.objects.filter(author__in=users)
        deleted_posts_count = posts.count()
        for p in posts:
            if p.media_file:
                p.media_file.delete(save=False)
            if p.thumbnail:
                p.thumbnail.delete(save=False)

        users_count = users.count()
        users.delete() # Cascades to profile, posts, follows, likes, comments

        self.stdout.write(self.style.SUCCESS(
            f"Successfully removed {users_count} mock users and {deleted_posts_count} mock posts with their files."
        ))

    def populate_mock_data(self):
        self.stdout.write(self.style.MIGRATE_HEADING("Creating mock users..."))

        users = {}
        bios = {
            'alex_dev': "Full-stack engineer & photographer 📸 Building cool web apps with Django!",
            'sarah_creator': "Digital artist & video creator ✨ Sharing creative aesthetic vibes 🎬",
            'code_ninja': "Python enthusiast & tech explorer 🐍 Let's connect & build!",
        }

        for username in MOCK_USERNAMES:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': f'{username}@example.com'}
            )
            user.set_password('password123')
            user.save()

            # Set bio and generated avatar
            if hasattr(user, 'profile'):
                profile = user.profile
                profile.bio = bios.get(username, '')
                # Create a simple colored avatar
                avatar_img = Image.new('RGB', (200, 200), color=(50, 100, 200))
                draw = ImageDraw.Draw(avatar_img)
                draw.text((80, 85), username[:2].upper(), fill=(255, 255, 255))
                avatar_io = io.BytesIO()
                avatar_img.save(avatar_io, format='PNG')
                profile.avatar.save(f'{username}_avatar.png', ContentFile(avatar_io.getvalue()), save=False)
                profile.save()

            users[username] = user
            status = "Created" if created else "Updated"
            self.stdout.write(f"  [{status}] {username} (password: password123)")

        self.stdout.write(self.style.MIGRATE_HEADING("Creating social follow graph..."))
        Follow.objects.get_or_create(follower=users['alex_dev'], following=users['sarah_creator'])
        Follow.objects.get_or_create(follower=users['sarah_creator'], following=users['alex_dev'])
        Follow.objects.get_or_create(follower=users['code_ninja'], following=users['alex_dev'])
        Follow.objects.get_or_create(follower=users['code_ninja'], following=users['sarah_creator'])

        self.stdout.write(self.style.MIGRATE_HEADING("Generating sample posts (Images & Videos)..."))

        # 1. Sample Image Post 1 (Alex)
        img1 = Image.new('RGB', (1200, 1200), color=(30, 41, 59))
        draw1 = ImageDraw.Draw(img1)
        draw1.rectangle([200, 200, 1000, 1000], fill=(59, 130, 246))
        draw1.text((350, 580), "Welcome to SocialConnect!", fill=(255, 255, 255))
        img_io1 = io.BytesIO()
        img1.save(img_io1, format='JPEG', quality=95)
        img_io1.seek(0)
        compressed1 = compress_image(img_io1)

        post1 = Post.objects.create(
            author=users['alex_dev'],
            media_type='image',
            caption="First post on the platform! Excited to share this with everyone 🚀 #django #webdev"
        )
        post1.media_file.save("launch_announcement.jpg", compressed1, save=False)
        post1.thumbnail.save("launch_announcement.jpg", compressed1, save=True)

        # 2. Sample Image Post 2 (Sarah)
        img2 = Image.new('RGB', (1000, 1000), color=(15, 23, 42))
        draw2 = ImageDraw.Draw(img2)
        draw2.ellipse([250, 250, 750, 750], fill=(236, 72, 153))
        draw2.text((400, 480), "Aesthetic Sunset", fill=(255, 255, 255))
        img_io2 = io.BytesIO()
        img2.save(img_io2, format='JPEG', quality=95)
        img_io2.seek(0)
        compressed2 = compress_image(img_io2)

        post2 = Post.objects.create(
            author=users['sarah_creator'],
            media_type='image',
            caption="Chasing golden hour gradients today 🌅 What are you working on?"
        )
        post2.media_file.save("golden_hour.jpg", compressed2, save=False)
        post2.thumbnail.save("golden_hour.jpg", compressed2, save=True)

        # 3. Sample Video Post (Sarah) generated via FFmpeg
        self.stdout.write("  Generating sample test video using FFmpeg...")
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_vid:
            temp_vid_path = temp_vid.name

        try:
            # Generate a 2-second test video clip using FFmpeg lavfi testsrc
            gen_cmd = [
                'ffmpeg', '-y',
                '-f', 'lavfi', '-i', 'testsrc=duration=2:size=720x720:rate=30',
                '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=2',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '64k',
                temp_vid_path
            ]
            subprocess.run(gen_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

            # Process with our utility
            compressed_vid_path, thumb_path = process_video(temp_vid_path)

            post3 = Post.objects.create(
                author=users['sarah_creator'],
                media_type='video',
                caption="Testing video playback and FFmpeg compression! 🎬 Plays smoothly with auto-generated thumbnail."
            )
            with open(compressed_vid_path, 'rb') as vf:
                post3.media_file.save("demo_clip.mp4", ContentFile(vf.read()), save=False)
            if thumb_path and os.path.exists(thumb_path):
                with open(thumb_path, 'rb') as tf:
                    post3.thumbnail.save("demo_clip_thumb.jpg", ContentFile(tf.read()), save=False)
            post3.save()

            # Clean temp files
            if compressed_vid_path != temp_vid_path and os.path.exists(compressed_vid_path):
                os.remove(compressed_vid_path)
            if thumb_path and os.path.exists(thumb_path):
                os.remove(thumb_path)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Could not generate synthetic test video with FFmpeg: {e}"))
        finally:
            if os.path.exists(temp_vid_path):
                os.remove(temp_vid_path)

        # Create sample likes & comments
        Like.objects.get_or_create(post=post1, user=users['sarah_creator'])
        Like.objects.get_or_create(post=post1, user=users['code_ninja'])
        Comment.objects.get_or_create(
            post=post1, author=users['sarah_creator'],
            text="Congrats on the launch! The UI looks super clean."
        )
        Comment.objects.get_or_create(
            post=post1, author=users['code_ninja'],
            text="Love the dark mode styling! 🔥"
        )

        Like.objects.get_or_create(post=post2, user=users['alex_dev'])
        Comment.objects.get_or_create(
            post=post2, author=users['alex_dev'],
            text="Beautiful colors Sarah!"
        )

        self.stdout.write(self.style.SUCCESS("\nDone! Mock data populated successfully."))
        self.stdout.write(self.style.SUCCESS("Demo Login Credentials:"))
        for u in MOCK_USERNAMES:
            self.stdout.write(f"  - Username: {u}  |  Password: password123")
        self.stdout.write(self.style.NOTICE("To remove mock data at any time, run: python manage.py populate_data --clear\n"))
