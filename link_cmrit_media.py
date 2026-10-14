import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
from communities.models import Community
from posts.models import Post, PostMedia, Comment, Like

User = get_user_model()
admin_user = User.objects.filter(username='sarah_creator').first() or User.objects.first()
alex_user = User.objects.filter(username='alex_dev').first() or admin_user
ninja_user = User.objects.filter(username='code_ninja').first() or admin_user

comm = Community.objects.get(slug='cmrit-engineering-hub')
comm.avatar = 'communities/avatars/cmrit_avatar.png'
comm.banner = 'communities/banners/cmrit_banner.jpg'
comm.save()
print('Community banner and avatar linked!')

# Clear old CMRIT posts
comm.posts.all().delete()

posts_spec = [
    {
        'author': admin_user,
        'tag': '#cultura2026',
        'caption': 'Cultura 2026 Tech Track registrations are officially LIVE! Calling all CMRIT developers, hardware builders, and AI innovators. We have tracks for AI Multi-Agent Orchestration, Track Fusion Robotics, Hardware Hustle CAN-Bus telemetry, and Web3 Sanctum. INR 2,50,000+ prize pool with finals at the CMRIT Main Auditorium stage.',
        'media_path': 'posts/media/2026/10/cultura_hackathon_poster.jpg',
        'comments': [
            (alex_user, 'Our team from 6th sem CSE is building an edge-compute drone surveillance prototype! Looking for one more frontend teammate on Sanctuary OS.'),
            (ninja_user, 'Is the robotics arena in Block D open after 5 PM for sensor calibration runs?'),
        ],
        'likes': [admin_user, alex_user, ninja_user]
    },
    {
        'author': admin_user,
        'tag': '#guest_lecture',
        'caption': 'CMRIT Distinguished Founder Masterclass & Fireside: "Scaling Zero-Copy Distributed Systems from Campus to Cloud" with Dr. Vikram Senapathi (Co-Founder & Chief Architect at HyperScale Labs, Ex-Google Brain, CMRIT Alum 2015). Friday Oct 24, 3:30 PM at Audio Visual Complex (AV Hall 1), Block B. Open to all students & faculty.',
        'media_path': 'posts/media/2026/10/entrepreneur_lecture_poster.jpg',
        'comments': [
            (alex_user, 'Amazing to see CMRIT alumni returning to give deep technical talks on kernel bypass and GPU memory!'),
            (ninja_user, 'Will there be a direct networking and resume drop session with the founders afterwards?'),
        ],
        'likes': [admin_user, alex_user, ninja_user]
    },
    {
        'author': alex_user,
        'tag': '#ieee_cmrit',
        'caption': 'Late-night debugging session at the CMRIT Embedded Systems Lab (Block D // ECE-04). We just benchmarked our STM32F4 microcontroller CAN-bus telemetry link with 1.0 Mbps speed and zero packet loss over 100m shielded twisted pair! Ready for the NextGen Convergence exposition.',
        'media_path': 'posts/media/2026/10/cmrit_hardware_lab.jpg',
        'comments': [
            (admin_user, 'Phenomenal latency numbers (120us). Make sure you submit the paper abstract before Friday 11:59 PM.'),
        ],
        'likes': [admin_user, ninja_user]
    },
    {
        'author': ninja_user,
        'tag': '#campus_life',
        'caption': 'Golden hour view across the CMRIT campus lawn and academic quad near AECS Layout gate after today\'s end-sem lab exam. Nothing beats a hot filter coffee and post-exam architectural debrief with fellow devs before hacking resumes.',
        'media_path': 'posts/media/2026/10/cmrit_campus_quad.jpg',
        'comments': [
            (alex_user, 'The canteen dosa line was wild today haha! Great shot of the main quad.'),
        ],
        'likes': [admin_user, alex_user]
    }
]

for item in posts_spec:
    p = Post.objects.create(
        community=comm,
        author=item['author'],
        caption=item['caption'],
        tag=item['tag'],
        media_type='image',
        media_file=item['media_path']
    )
    PostMedia.objects.create(
        post=p,
        file=item['media_path'],
        media_type='image',
        order=0
    )
    for liker in item['likes']:
        Like.objects.get_or_create(post=p, user=liker)
    for c_author, c_text in item['comments']:
        Comment.objects.create(post=p, author=c_author, text=c_text)

print('Linked all CMRIT media successfully! Total posts:', comm.posts.count())
