import os
import tempfile
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.files.base import ContentFile
from .models import Post, Like, Comment
from .forms import PostCreateForm, CommentForm
from .utils import detect_media_type, compress_image, process_video
from accounts.models import Follow


@login_required
def feed_view(request):
    """
    Main feed view showing posts from users that the logged-in user follows,
    plus the user's own posts. If the user follows nobody, shows recent posts.
    """
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)
    
    feed_posts = Post.objects.filter(
        author__in=list(following_users) + [request.user.id]
    ).select_related('author', 'author__profile')
    
    if not feed_posts.exists():
        feed_posts = Post.objects.all().select_related('author', 'author__profile')[:20]

    liked_post_ids = set(Like.objects.filter(user=request.user, post__in=feed_posts).values_list('post_id', flat=True))
    comment_form = CommentForm()

    context = {
        'posts': feed_posts,
        'liked_post_ids': liked_post_ids,
        'comment_form': comment_form,
    }
    return render(request, 'posts/feed.html', context)


@login_required
def explore_view(request):
    """Explore / discover grid showing all recent posts."""
    posts = Post.objects.all().select_related('author', 'author__profile')[:50]
    return render(request, 'posts/explore.html', {'posts': posts})


@login_required
def create_post_view(request):
    """
    Upload a new media post (image or video).
    - Compresses images with Pillow.
    - Compresses videos and extracts thumbnail with FFmpeg.
    """
    if request.method == 'POST':
        form = PostCreateForm(request.POST, request.FILES)
        if form.is_valid():
            uploaded_file = request.FILES['media_file']
            media_type = detect_media_type(uploaded_file.name)

            post = form.save(commit=False)
            post.author = request.user
            post.media_type = media_type

            if media_type == 'image':
                # Compress image using Pillow
                compressed_file = compress_image(uploaded_file)
                post.media_file.save(compressed_file.name, compressed_file, save=False)
                post.thumbnail.save(compressed_file.name, compressed_file, save=False)

            elif media_type == 'video':
                # Save uploaded video to temp file for ffmpeg processing
                ext = os.path.splitext(uploaded_file.name)[1]
                with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_in:
                    for chunk in uploaded_file.chunks():
                        temp_in.write(chunk)
                    temp_in_path = temp_in.name

                try:
                    compressed_path, thumb_path = process_video(temp_in_path)

                    # Save compressed video to model
                    with open(compressed_path, 'rb') as f:
                        video_name = os.path.basename(compressed_path)
                        post.media_file.save(video_name, ContentFile(f.read()), save=False)

                    # Save extracted thumbnail to model
                    if thumb_path and os.path.exists(thumb_path):
                        with open(thumb_path, 'rb') as tf:
                            thumb_name = os.path.basename(thumb_path)
                            post.thumbnail.save(thumb_name, ContentFile(tf.read()), save=False)
                finally:
                    # Clean up temp files
                    if os.path.exists(temp_in_path):
                        os.remove(temp_in_path)
                    if 'compressed_path' in locals() and compressed_path != temp_in_path and os.path.exists(compressed_path):
                        os.remove(compressed_path)
                    if 'thumb_path' in locals() and thumb_path and os.path.exists(thumb_path):
                        os.remove(thumb_path)

            post.save()
            messages.success(request, f"{'Video' if media_type == 'video' else 'Photo'} shared successfully!")
            return redirect('feed')
    else:
        form = PostCreateForm()
    return render(request, 'posts/create_post.html', {'form': form})


@login_required
def post_detail_view(request, pk):
    """Detailed view of a single post with comments list and comment form."""
    post = get_object_or_404(Post.objects.select_related('author', 'author__profile'), pk=pk)
    comments = post.comments.select_related('author', 'author__profile').all()
    is_liked = Like.objects.filter(post=post, user=request.user).exists()
    
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
    }
    return render(request, 'posts/post_detail.html', context)


@login_required
def like_toggle_view(request, pk):
    """Toggle like/unlike on a post."""
    post = get_object_or_404(Post, pk=pk)
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
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.author = request.user
            comment.save()
    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)
