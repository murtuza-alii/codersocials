import os
import tempfile
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.files.base import ContentFile
from django.core.exceptions import PermissionDenied
from .models import Post, PostMedia, Like, Comment
from .forms import PostCreateForm, CommentForm
from .utils import detect_media_type, compress_image, process_video
from .services import get_isolated_home_feed
from communities.utils import is_community_admin, user_can_access_community
from communities.models import Community, CommunityMembership


@login_required
def feed_view(request):
    """
    Main feed view showing an isolated feed of posts strictly from communities
    the user has approved membership in, plus public communities.
    """
    feed_posts = get_isolated_home_feed(request.user)
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


@login_required
def explore_view(request):
    """Explore grid showing all public and accessible posts."""
    public_comms = Community.objects.filter(privacy='PUBLIC').values_list('id', flat=True)
    user_approved_comms = CommunityMembership.objects.filter(
        user=request.user, status='APPROVED'
    ).values_list('community_id', flat=True)

    accessible_ids = set(list(public_comms) + list(user_approved_comms))
    posts = Post.objects.filter(
        community_id__in=accessible_ids
    ).select_related('author', 'author__profile', 'community')[:50]

    return render(request, 'posts/explore.html', {'posts': posts})


@login_required
def create_post_view(request):
    """
    Upload a new rich post:
    - Supports text thoughts/announcements
    - Supports single or multi-media items (images and videos) for carousels
    - Automatically processes images with Pillow and videos with FFmpeg
    """
    community_slug = request.GET.get('community')
    initial_community = None
    if community_slug:
        initial_community = Community.objects.filter(slug=community_slug).first()

    if request.method == 'POST':
        form = PostCreateForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user

            # If community specified, verify access
            if post.community:
                if not user_can_access_community(request.user, post.community):
                    messages.error(request, "You are not an approved member of this community.")
                    return redirect('communities:explore')

            # Check for multiple files or single file
            uploaded_files = request.FILES.getlist('media_files')
            if not uploaded_files and 'media_file' in request.FILES:
                uploaded_files = [request.FILES['media_file']]

            if not uploaded_files:
                post.media_type = 'none'
            elif len(uploaded_files) == 1:
                post.media_type = detect_media_type(uploaded_files[0].name)
            else:
                post.media_type = 'image'  # Carousel composite

            post.save()

            # Process each media file and create PostMedia items
            for idx, uploaded_file in enumerate(uploaded_files):
                m_type = detect_media_type(uploaded_file.name)
                post_media = PostMedia(post=post, media_type=m_type, order=idx)

                if m_type == 'image':
                    compressed_file = compress_image(uploaded_file)
                    post_media.file.save(compressed_file.name, compressed_file, save=False)
                    post_media.thumbnail.save(compressed_file.name, compressed_file, save=False)
                    if idx == 0:
                        post.media_file.save(compressed_file.name, compressed_file, save=False)
                        post.thumbnail.save(compressed_file.name, compressed_file, save=False)

                elif m_type == 'video':
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
                    finally:
                        if os.path.exists(temp_in_path):
                            os.remove(temp_in_path)
                        if 'compressed_path' in locals() and compressed_path != temp_in_path and os.path.exists(compressed_path):
                            os.remove(compressed_path)
                        if 'thumb_path' in locals() and thumb_path and os.path.exists(thumb_path):
                            os.remove(thumb_path)

                post_media.save()

            post.save()
            messages.success(request, "Post published successfully!")
            if post.community:
                return redirect('communities:detail', slug=post.community.slug)
            return redirect('feed')
    else:
        form = PostCreateForm(user=request.user, initial={'community': initial_community})

    return render(request, 'posts/create_post.html', {'form': form})


@login_required
def post_detail_view(request, pk):
    """Detailed view of a single post with comments list and comment form."""
    post = get_object_or_404(
        Post.objects.select_related('author', 'author__profile', 'community'),
        pk=pk
    )

    if post.community and not user_can_access_community(request.user, post.community):
        raise PermissionDenied("You do not have permission to view posts in this private community.")

    comments = post.comments.select_related('author', 'author__profile').all()
    is_liked = Like.objects.filter(post=post, user=request.user).exists()
    can_takedown = (
        request.user == post.author or
        (post.community and is_community_admin(request.user, post.community))
    )

    if request.method == 'POST':
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit=False)
            comment.post = post
            comment.author = request.user
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


@login_required
def like_toggle_view(request, pk):
    """Toggle like/unlike on a post."""
    post = get_object_or_404(Post, pk=pk)
    if post.community and not user_can_access_community(request.user, post.community):
        raise PermissionDenied("You cannot like posts in a community you are not part of.")

    like_rel = Like.objects.filter(post=post, user=request.user)
    if like_rel.exists():
        like_rel.delete()
    else:
        Like.objects.create(post=post, user=request.user)

    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)


@login_required
def add_comment_view(request, pk):
    """Add a quick comment from the feed directly."""
    post = get_object_or_404(Post, pk=pk)
    if post.community and not user_can_access_community(request.user, post.community):
        raise PermissionDenied("You cannot comment on posts in a community you are not part of.")

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.author = request.user
            comment.save()
    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)


@login_required
def takedown_post_view(request, pk):
    """
    Take down a post:
    Can be performed by the post author or community admin/moderator.
    """
    post = get_object_or_404(Post, pk=pk)
    can_takedown = (
        request.user == post.author or
        (post.community and is_community_admin(request.user, post.community))
    )
    if not can_takedown:
        raise PermissionDenied("You do not have permission to remove this post.")

    comm_slug = post.community.slug if post.community else None
    post.delete()
    messages.success(request, "Post taken down successfully.")

    if comm_slug:
        return redirect('communities:detail', slug=comm_slug)
    return redirect('feed')


@login_required
def share_post_view(request, pk):
    """Share/quote a post into an approved community."""
    original_post = get_object_or_404(Post, pk=pk)
    if original_post.community and not user_can_access_community(request.user, original_post.community):
        raise PermissionDenied("You cannot share posts from communities you cannot access.")

    target_comm_id = request.POST.get('community_id')
    note = request.POST.get('note', '').strip()

    target_comm = None
    if target_comm_id:
        target_comm = get_object_or_404(Community, id=target_comm_id)
        if not user_can_access_community(request.user, target_comm):
            raise PermissionDenied("You are not an approved member of the target community.")

    shared_post = Post.objects.create(
        community=target_comm,
        author=request.user,
        caption=note,
        shared_from=original_post,
        media_type='none'
    )
    messages.success(request, "Post shared successfully!")
    if target_comm:
        return redirect('communities:detail', slug=target_comm.slug)
    return redirect('feed')
