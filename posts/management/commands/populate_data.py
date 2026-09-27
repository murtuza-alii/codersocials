import os
import io
import tempfile
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from posts.models import Post, PostMedia, Like, Comment
from posts.utils import compress_image, process_video
from accounts.models import Follow
from communities.models import Community, CommunityMembership
from chat.models import CommunityChannel, ChannelMessage, Conversation, ConversationParticipant, DirectMessage

MOCK_USERNAMES = ['alex_dev', 'sarah_creator', 'code_ninja']


class Command(BaseCommand):
    help = 'Populates mock data (users, communities, channels, carousels, messages, DMs) or clears it with --clear.'

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
        for p in posts:
            if p.media_file:
                p.media_file.delete(save=False)
            if p.thumbnail:
                p.thumbnail.delete(save=False)
            for pm in p.media_items.all():
                if pm.file:
                    pm.file.delete(save=False)
                if pm.thumbnail:
                    pm.thumbnail.delete(save=False)

        # Clear communities created by mock users
        Community.objects.filter(creator__in=users).delete()

        users_count = users.count()
        users.delete()

        self.stdout.write(self.style.SUCCESS(
            f"Successfully cleared mock users, communities, channels, and associated files."
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

            if hasattr(user, 'profile'):
                profile = user.profile
                profile.bio = bios.get(username, '')
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

        # Follow Graph
        Follow.objects.get_or_create(follower=users['alex_dev'], following=users['sarah_creator'])
        Follow.objects.get_or_create(follower=users['sarah_creator'], following=users['alex_dev'])
        Follow.objects.get_or_create(follower=users['code_ninja'], following=users['alex_dev'])

        # 1. Create Community Spaces
        self.stdout.write(self.style.MIGRATE_HEADING("Creating Community Spaces..."))
        
        # Public Community: Campus Code Sanctuary
        comm1, _ = Community.objects.get_or_create(
            slug='campus-code-sanctuary',
            defaults={
                'name': 'Campus Code Sanctuary',
                'description': 'A safe, inclusive digital sanctuary for campus developers, study groups, and hackathons.',
                'rules': '1. Constructive code reviews only.\n2. Organically verify campus news before spreading rumors.\n3. Safe, supportive environment for all skill levels.',
                'privacy': 'PUBLIC',
                'creator': users['alex_dev']
            }
        )
        CommunityMembership.objects.get_or_create(community=comm1, user=users['alex_dev'], defaults={'role': 'ADMIN', 'status': 'APPROVED'})
        CommunityMembership.objects.get_or_create(community=comm1, user=users['sarah_creator'], defaults={'role': 'MEMBER', 'status': 'APPROVED'})
        CommunityMembership.objects.get_or_create(community=comm1, user=users['code_ninja'], defaults={'role': 'MEMBER', 'status': 'APPROVED'})

        # Private Community: Silicon Tech Vault
        comm2, _ = Community.objects.get_or_create(
            slug='silicon-tech-vault',
            defaults={
                'name': 'Silicon Tech Vault',
                'description': 'Exclusive research sanctuary for confidential project collaboration and deep-tech discussions.',
                'rules': '1. Wetted members only - approval required.\n2. Respect member confidentiality.\n3. Zero tolerance for unverified leaks.',
                'privacy': 'PRIVATE',
                'creator': users['sarah_creator']
            }
        )
        CommunityMembership.objects.get_or_create(community=comm2, user=users['sarah_creator'], defaults={'role': 'ADMIN', 'status': 'APPROVED'})
        CommunityMembership.objects.get_or_create(community=comm2, user=users['alex_dev'], defaults={'role': 'MEMBER', 'status': 'APPROVED'})
        # Code ninja has a pending request to demonstrate the admin approval workflow!
        CommunityMembership.objects.get_or_create(community=comm2, user=users['code_ninja'], defaults={'role': 'MEMBER', 'status': 'PENDING'})

        # 2. Create Channels
        self.stdout.write(self.style.MIGRATE_HEADING("Creating Channels and Channel Messages..."))
        ch1, _ = CommunityChannel.objects.get_or_create(
            community=comm1, slug='announcements',
            defaults={'name': 'announcements', 'topic': 'Official verified updates and hackathon deadlines', 'is_announcement': True}
        )
        ch2, _ = CommunityChannel.objects.get_or_create(
            community=comm1, slug='general',
            defaults={'name': 'general', 'topic': 'General campus chats and peer Q&A', 'is_announcement': False}
        )
        ch3, _ = CommunityChannel.objects.get_or_create(
            community=comm1, slug='dev-chat',
            defaults={'name': 'dev-chat', 'topic': 'Django, Python & system architecture discussions', 'is_announcement': False}
        )

        # Messages in ch1 (announcements)
        ChannelMessage.objects.get_or_create(
            channel=ch1, sender=users['alex_dev'],
            defaults={'message': '📢 Welcome everyone to Campus Code Sanctuary! Midterm project submissions are scheduled for Friday 5 PM.'}
        )
        # Messages in ch2 (general) with organic fact-checking
        ChannelMessage.objects.get_or_create(
            channel=ch2, sender=users['code_ninja'],
            defaults={'message': 'Hey, someone mentioned the lab exam was cancelled next week, is that true?'}
        )
        ChannelMessage.objects.get_or_create(
            channel=ch2, sender=users['alex_dev'],
            defaults={'message': 'Not cancelled! Professor confirmed the schedule today in lecture. Do not believe the WhatsApp rumor!'}
        )
        ChannelMessage.objects.get_or_create(
            channel=ch2, sender=users['sarah_creator'],
            defaults={'message': 'Glad we have this sanctuary to verify true info so rumors dont spread! 🙌'}
        )

        # 3. Create Multi-Media Carousel Posts
        self.stdout.write(self.style.MIGRATE_HEADING("Generating Carousel Posts (Images & Video)..."))

        # Generate image slide 1
        img1 = Image.new('RGB', (1080, 1080), color=(15, 23, 42))
        draw1 = ImageDraw.Draw(img1)
        draw1.rectangle([150, 150, 930, 930], fill=(99, 102, 241))
        draw1.text((320, 520), "Campus Code Sanctuary\nSlide 1: Architecture", fill=(255, 255, 255))
        img_io1 = io.BytesIO()
        img1.save(img_io1, format='JPEG', quality=90)
        img_io1.seek(0)
        comp_img1 = compress_image(img_io1)

        # Generate image slide 2
        img2 = Image.new('RGB', (1080, 1080), color=(30, 27, 75))
        draw2 = ImageDraw.Draw(img2)
        draw2.ellipse([200, 200, 880, 880], fill=(236, 72, 153))
        draw2.text((360, 520), "Slide 2: Multi-Tenancy\nZero Data Leaks", fill=(255, 255, 255))
        img_io2 = io.BytesIO()
        img2.save(img_io2, format='JPEG', quality=90)
        img_io2.seek(0)
        comp_img2 = compress_image(img_io2)

        # Post 1: Carousel in Campus Code Sanctuary
        post1 = Post.objects.create(
            community=comm1,
            author=users['alex_dev'],
            tag='#architecture',
            caption="Excited to unveil our new community architecture! Swipe through the carousel slides to see the tenant isolation design. 🚀"
        )
        pm1 = PostMedia(post=post1, media_type='image', order=0)
        pm1.file.save('slide1.jpg', comp_img1, save=True)
        pm2 = PostMedia(post=post1, media_type='image', order=1)
        pm2.file.save('slide2.jpg', comp_img2, save=True)

        post1.media_file.save('slide1.jpg', comp_img1, save=True)

        # Post 2: Video Carousel in Silicon Tech Vault
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_vid:
            temp_vid_path = temp_vid.name

        try:
            gen_cmd = [
                'ffmpeg', '-y',
                '-f', 'lavfi', '-i', 'testsrc=duration=2:size=720x720:rate=30',
                '-f', 'lavfi', '-i', 'sine=frequency=800:duration=2',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '64k',
                temp_vid_path
            ]
            subprocess.run(gen_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            compressed_vid_path, thumb_path = process_video(temp_vid_path)

            post2 = Post.objects.create(
                community=comm2,
                author=users['sarah_creator'],
                tag='#demo-clip',
                caption="Confidential clip demo inside Silicon Tech Vault! Tap video to play/pause, or use bottom-right mute pill. 🎬"
            )
            pm_vid = PostMedia(post=post2, media_type='video', order=0)
            with open(compressed_vid_path, 'rb') as vf:
                pm_vid.file.save('demo_clip.mp4', ContentFile(vf.read()), save=False)
            if thumb_path and os.path.exists(thumb_path):
                with open(thumb_path, 'rb') as tf:
                    pm_vid.thumbnail.save('demo_thumb.jpg', ContentFile(tf.read()), save=False)
            pm_vid.save()
            post2.media_file = pm_vid.file
            post2.thumbnail = pm_vid.thumbnail
            post2.save()

            if compressed_vid_path != temp_vid_path and os.path.exists(compressed_vid_path):
                os.remove(compressed_vid_path)
            if thumb_path and os.path.exists(thumb_path):
                os.remove(thumb_path)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  Synthetic video generation note: {e}"))
        finally:
            if os.path.exists(temp_vid_path):
                os.remove(temp_vid_path)

        # 4. Create Standalone DMs & Personal Group Chat
        self.stdout.write(self.style.MIGRATE_HEADING("Creating Standalone DMs and Personal Groups..."))
        
        # 1-on-1 DM between Alex and Sarah
        dm_conv = Conversation.objects.create(is_group=False)
        ConversationParticipant.objects.create(conversation=dm_conv, user=users['alex_dev'])
        ConversationParticipant.objects.create(conversation=dm_conv, user=users['sarah_creator'])
        DirectMessage.objects.create(
            conversation=dm_conv, sender=users['alex_dev'],
            message='Hey Sarah, did you see the new community carousel support?'
        )
        DirectMessage.objects.create(
            conversation=dm_conv, sender=users['sarah_creator'],
            message='Yes! The custom video player with tap-to-mute works seamlessly without browser chrome.'
        )

        # Personal WhatsApp-style Group: "Weekend Hackers"
        grp_conv = Conversation.objects.create(is_group=True, title='Weekend Hackers')
        ConversationParticipant.objects.create(conversation=grp_conv, user=users['alex_dev'], is_admin=True)
        ConversationParticipant.objects.create(conversation=grp_conv, user=users['sarah_creator'])
        ConversationParticipant.objects.create(conversation=grp_conv, user=users['code_ninja'])
        DirectMessage.objects.create(
            conversation=grp_conv, sender=users['alex_dev'],
            message='Welcome everyone to our personal hackathon group! This is totally unlinked from any college community.'
        )
        DirectMessage.objects.create(
            conversation=grp_conv, sender=users['code_ninja'],
            message='Awesome! We can plan our weekend sprint here privately.'
        )

        self.stdout.write(self.style.SUCCESS("\nDone! Sanctuary demo data populated successfully."))
        self.stdout.write(self.style.SUCCESS("Demo Login Credentials:"))
        for u in MOCK_USERNAMES:
            self.stdout.write(f"  - Username: {u}  |  Password: password123")
        self.stdout.write(self.style.NOTICE("To remove mock data at any time, run: python manage.py populate_data --clear\n"))
