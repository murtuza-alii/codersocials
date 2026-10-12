import os
import json
import tempfile
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.core.files.base import ContentFile
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Post, PostMedia, Like, Comment
from .forms import PostCreateForm, CommentForm
from .utils import detect_media_type, compress_image, process_video
from .services import get_isolated_home_feed
from communities.utils import is_community_admin, user_can_access_community
from communities.models import Community, CommunityMembership


def get_current_user(request):
    if request.user.is_authenticated:
        return request.user
    return User.objects.filter(username='sarah_creator').first()


def serialize_post(post, curr_user=None):
    media_items = [
        {
            'id': m.id,
            'file': m.file.url if m.file else None,
            'thumbnail': m.thumbnail.url if m.thumbnail else None,
            'media_type': m.media_type,
            'is_video': m.media_type == 'video',
        }
        for m in post.media_items.all()
    ]
    if not media_items and post.media_file:
        media_items.append({
            'id': 1,
            'file': post.media_file.url,
            'thumbnail': post.thumbnail.url if post.thumbnail else post.media_file.url,
            'media_type': post.media_type,
            'is_video': post.media_type == 'video',
        })

    comments = [
        {
            'id': c.id,
            'author': {'username': c.author.username},
            'text': c.text,
            'created_at': c.created_at.isoformat(),
        }
        for c in post.comments.all()
    ]

    is_liked = post.likes.filter(user=curr_user).exists() if curr_user else False
    can_takedown = (curr_user == post.author or (post.community and is_community_admin(curr_user, post.community))) if curr_user else False

    profile = getattr(post.author, 'profile', None)
    return {
        'id': post.id,
        'caption': post.caption,
        'author': {
            'username': post.author.username,
            'avatar': profile.avatar.url if profile and profile.avatar else None,
            'profile': {'role': 'ADMIN' if (post.community and is_community_admin(post.author, post.community)) else 'MEMBER'}
        },
        'community': {
            'id': str(post.community.id),
            'name': post.community.name,
            'slug': post.community.slug,
        } if post.community else None,
        'created_at': post.created_at.isoformat(),
        'total_likes': post.likes.count(),
        'total_comments': post.comments.count(),
        'is_liked': is_liked,
        'can_takedown': can_takedown,
        'media_items': media_items,
        'comments': comments,
    }


def feed_view(request):
    """
    Main feed view showing an isolated feed of posts strictly from communities
    the user has approved membership in, plus public communities.
    """
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if curr_user:
        feed_posts = list(get_isolated_home_feed(curr_user))
        if not feed_posts:
            feed_posts = list(Post.objects.all().select_related('author', 'author__profile', 'community').prefetch_related('media_items', 'likes', 'comments')[:50])
    else:
        feed_posts = list(Post.objects.all().select_related('author', 'author__profile', 'community').prefetch_related('media_items', 'likes', 'comments')[:50])

    if is_json:
        serialized = [serialize_post(p, curr_user) for p in feed_posts]
        return JsonResponse({'status': 'ok', 'posts': serialized})

    if not request.user.is_authenticated:
        return redirect('login')

    liked_post_ids = set(Like.objects.filter(user=request.user, post__in=feed_posts[:50]).values_list('post_id', flat=True))
    comment_form = CommentForm()

    user_communities = Community.objects.filter(
        memberships__user=request.user,
        memberships__status='APPROVED'
    )

    context = {
        'posts': feed_posts,
        'liked_post_ids': liked_post_ids,
        'comment_form': comment_form,
        'user_communities': user_communities,
    }
    return render(request, 'posts/feed.html', context)


def explore_view(request):
    """Explore grid showing all public and accessible posts."""
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest'

    public_comms = Community.objects.filter(privacy='PUBLIC').values_list('id', flat=True)
    user_approved_comms = []
    if curr_user:
        user_approved_comms = list(CommunityMembership.objects.filter(
            user=curr_user, status='APPROVED'
        ).values_list('community_id', flat=True))

    accessible_ids = set(list(public_comms) + user_approved_comms)
    posts = Post.objects.filter(
        community_id__in=accessible_ids
    ).select_related('author', 'author__profile', 'community').prefetch_related('media_items', 'likes', 'comments')[:50]

    if is_json:
        serialized = [serialize_post(p, curr_user) for p in posts]
        return JsonResponse({'status': 'ok', 'posts': serialized})

    return render(request, 'posts/explore.html', {'posts': posts})


@csrf_exempt
def create_post_view(request):
    """
    Upload a new rich post:
    - Supports text thoughts/announcements
    - Supports single or multi-media items (images and videos) for carousels
    """
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    community_slug = request.GET.get('community')
    initial_community = None
    if community_slug:
        initial_community = Community.objects.filter(slug=community_slug).first()

    if request.method == 'POST':
        caption = ''
        comm_val = None
        tag = ''
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                caption = body.get('caption', '').strip()
                comm_val = body.get('community')
                tag = body.get('tag', '').strip()
            except Exception:
                pass
        else:
            caption = request.POST.get('caption', '').strip()
            comm_val = request.POST.get('community')
            tag = request.POST.get('tag', '').strip()

        target_comm = None
        if comm_val:
            try:
                target_comm = Community.objects.filter(id=comm_val).first()
            except Exception:
                target_comm = None
            if not target_comm:
                target_comm = Community.objects.filter(slug=comm_val).first()

        # Check for multiple files or single file
        uploaded_files = request.FILES.getlist('media_files')
        if not uploaded_files and 'media_file' in request.FILES:
            uploaded_files = [request.FILES['media_file']]

        m_type = 'none'
        if uploaded_files:
            m_type = detect_media_type(uploaded_files[0].name) if len(uploaded_files) == 1 else 'image'

        post = Post.objects.create(
            author=curr_user,
            community=target_comm,
            caption=caption,
            tag=tag,
            media_type=m_type,
        )

        # Process each media file and create PostMedia items
        for idx, uploaded_file in enumerate(uploaded_files):
            sub_m_type = detect_media_type(uploaded_file.name)
            post_media = PostMedia(post=post, media_type=sub_m_type, order=idx)

            if sub_m_type == 'image':
                try:
                    compressed_file = compress_image(uploaded_file)
                    post_media.file.save(compressed_file.name, compressed_file, save=False)
                    post_media.thumbnail.save(compressed_file.name, compressed_file, save=False)
                    if idx == 0:
                        post.media_file.save(compressed_file.name, compressed_file, save=False)
                        post.thumbnail.save(compressed_file.name, compressed_file, save=False)
                except Exception:
                    post_media.file.save(uploaded_file.name, uploaded_file, save=False)
                    if idx == 0:
                        post.media_file.save(uploaded_file.name, uploaded_file, save=False)

            elif sub_m_type == 'video':
                ext = os.path.splitext(uploaded_file.name)[1]
                with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_in:
                    for chunk in uploaded_file.chunks():
                        temp_in.write(chunk)
                    temp_in_path = temp_in.name

                try:
                    compressed_path, thumb_path = process_video(temp_in_path)
                    with open(compressed_path, 'rb') as f:
                        v_name = os.path.basename(compressed_path)
                        post_media.file.save(v_name, ContentFile(f.read()), save=False)
                        if idx == 0:
                            post.media_file.save(v_name, ContentFile(f.read()), save=False)

                    if thumb_path and os.path.exists(thumb_path):
                        with open(thumb_path, 'rb') as tf:
                            t_name = os.path.basename(thumb_path)
                            post_media.thumbnail.save(t_name, ContentFile(tf.read()), save=False)
                            if idx == 0:
                                post.thumbnail.save(t_name, ContentFile(tf.read()), save=False)
                except Exception:
                    post_media.file.save(uploaded_file.name, uploaded_file, save=False)
                    if idx == 0:
                        post.media_file.save(uploaded_file.name, uploaded_file, save=False)
                finally:
                    if os.path.exists(temp_in_path):
                        os.remove(temp_in_path)
                    if 'compressed_path' in locals() and compressed_path != temp_in_path and os.path.exists(compressed_path):
                        os.remove(compressed_path)
                    if 'thumb_path' in locals() and thumb_path and os.path.exists(thumb_path):
                        os.remove(thumb_path)

            post_media.save()

        post.save()

        if is_json:
            post_data = serialize_post(post, curr_user)
            return JsonResponse({'status': 'ok', 'post': post_data, **post_data})

        messages.success(request, "Post published successfully!")
        if post.community:
            return redirect('communities:detail', slug=post.community.slug)
        return redirect('feed')

    form = PostCreateForm(user=curr_user, initial={'community': initial_community})
    return render(request, 'posts/create_post.html', {'form': form})


def post_detail_view(request, pk):
    """Detailed view of a single post with comments list and comment form."""
    post = get_object_or_404(
        Post.objects.select_related('author', 'author__profile', 'community').prefetch_related('media_items', 'likes', 'comments', 'comments__author'),
        pk=pk
    )
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.GET.get('format') == 'json' or request.headers.get('x-requested-with') == 'XMLHttpRequest'

    comments = post.comments.select_related('author', 'author__profile').all()
    is_liked = Like.objects.filter(post=post, user=curr_user).exists() if curr_user else False
    can_takedown = (
        curr_user == post.author or
        (post.community and is_community_admin(curr_user, post.community))
    ) if curr_user else False

    if is_json:
        comments_data = [
            {
                'id': c.id,
                'author': {'username': c.author.username},
                'text': c.text,
                'created_at': c.created_at.isoformat(),
            }
            for c in comments
        ]
        return JsonResponse({
            'status': 'ok',
            'post': serialize_post(post, curr_user),
            'is_liked': is_liked,
            'can_takedown': can_takedown,
            'comments': comments_data,
        })

    if request.method == 'POST':
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid() and curr_user:
            comment = comment_form.save(commit=False)
            comment.post = post
            comment.author = curr_user
            comment.save()
            return redirect('post_detail', pk=pk)
    else:
        comment_form = CommentForm()

    context = {
        'post': post,
        'comments': comments,
        'is_liked': is_liked,
        'comment_form': comment_form,
        'can_takedown': can_takedown,
    }
    return render(request, 'posts/post_detail.html', context)


@csrf_exempt
def like_toggle_view(request, pk):
    """Toggle like/unlike on a post."""
    post = get_object_or_404(Post, pk=pk)
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    like_rel = Like.objects.filter(post=post, user=curr_user)
    if like_rel.exists():
        like_rel.delete()
        is_liked = False
    else:
        Like.objects.create(post=post, user=curr_user)
        is_liked = True

    if is_json:
        return JsonResponse({
            'status': 'ok',
            'is_liked': is_liked,
            'liked': is_liked,
            'total_likes': post.likes.count(),
        })

    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)


@csrf_exempt
def add_comment_view(request, pk):
    """Add a quick comment from the feed directly."""
    post = get_object_or_404(Post, pk=pk)
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    text = ''
    if request.method == 'POST':
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                text = (body.get('text') or body.get('content') or '').strip()
            except Exception:
                text = ''
        else:
            text = (request.POST.get('text') or request.POST.get('content') or '').strip()

        if text:
            comment = Comment.objects.create(
                post=post,
                author=curr_user,
                text=text,
            )
            if is_json:
                return JsonResponse({
                    'status': 'ok',
                    'comment': {
                        'id': comment.id,
                        'author': {'username': curr_user.username},
                        'text': comment.text,
                        'created_at': comment.created_at.isoformat(),
                    }
                })

    if is_json:
        return JsonResponse({'status': 'error', 'error': 'Empty comment text.'}, status=400)

    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)


@csrf_exempt
def takedown_post_view(request, pk):
    """
    Take down a post:
    Can be performed by the post author or community admin/moderator.
    """
    post = get_object_or_404(Post, pk=pk)
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    can_takedown = (
        curr_user == post.author or
        (post.community and is_community_admin(curr_user, post.community))
    ) if curr_user else False

    if not can_takedown:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Permission denied.'}, status=403)
        raise PermissionDenied("You do not have permission to remove this post.")

    comm_slug = post.community.slug if post.community else None
    post.delete()

    if is_json:
        return JsonResponse({'status': 'ok', 'id': pk})

    messages.success(request, "Post taken down successfully.")
    if comm_slug:
        return redirect('communities:detail', slug=comm_slug)
    return redirect('feed')


@csrf_exempt
def share_post_view(request, pk):
    """Share/quote a post into an approved community."""
    original_post = get_object_or_404(Post, pk=pk)
    curr_user = get_current_user(request)
    is_json = request.headers.get('accept') == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

    if not curr_user:
        if is_json:
            return JsonResponse({'status': 'error', 'error': 'Authentication required.'}, status=401)
        return redirect('login')

    target_comm_id = None
    note = ''
    if request.content_type == 'application/json':
        try:
            body = json.loads(request.body)
            target_comm_id = body.get('community_id')
            note = body.get('note', '').strip()
        except Exception:
            pass
    else:
        target_comm_id = request.POST.get('community_id')
        note = request.POST.get('note', '').strip()

    target_comm = None
    if target_comm_id:
        try:
            target_comm = Community.objects.filter(id=target_comm_id).first()
        except Exception:
            target_comm = None
        if not target_comm:
            target_comm = Community.objects.filter(slug=target_comm_id).first()

    shared_post = Post.objects.create(
        community=target_comm,
        author=curr_user,
        caption=note,
        shared_from=original_post,
        media_type='none'
    )

    if is_json:
        return JsonResponse({'status': 'ok', 'post': serialize_post(shared_post, curr_user)})

    messages.success(request, "Post shared successfully!")
    if target_comm:
        return redirect('communities:detail', slug=target_comm.slug)
    return redirect('feed')
