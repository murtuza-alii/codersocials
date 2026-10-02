# Chapter 3: Posts, Media Uploads & Feed Algorithm Step-by-Step

In this chapter, you will build photo sharing, the explore page, and the personalized feed algorithm.

---

## 1. How Image Uploads Work in Django

To upload files from the browser, two things are **mandatory**:
1. In HTML: The `<form>` tag **must** have `enctype="multipart/form-data"`:
   ```html
   <form method="POST" enctype="multipart/form-data">
   ```
2. In Python: The view function **must** receive `request.FILES` alongside `request.POST`:
   ```python
   form = PostCreateForm(request.POST, request.FILES)
   ```

Django saves the image file to the filesystem folder specified in `MEDIA_ROOT` (`e:\Networking Site\media\posts\`) and saves just the path string into the SQLite database table.

---

## 2. Writing Post Forms (`posts/forms.py`)

Open `posts/forms.py` and write:

```python
from django import forms
from .models import Post


class PostCreateForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['image', 'caption']
        widgets = {
            'caption': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Write an engaging caption...'}),
        }
```

---

## 3. The Personalized Feed Algorithm (How it Works)

How does Instagram know what posts to show you?
1. Find all users you are following.
2. Query the posts authored by those users (plus your own posts).
3. Order them by newest first (`-created_at`).

In Django ORM, this takes just **2 lines of Python**:

```python
# 1. Grab list of IDs you follow
following_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)

# 2. Grab posts by those IDs or yourself
feed_posts = Post.objects.filter(
    author_id__in=list(following_ids) + [request.user.id]
).order_by('-created_at')
```

---

## 4. Writing Post Views (`posts/views.py`)

Open `posts/views.py`:

```python
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Post, Like
from .forms import PostCreateForm
from accounts.models import Follow


# 1. Personalized Feed
@login_required
def feed_view(request):
    # Retrieve user IDs that the current user follows
    following_users = Follow.objects.filter(follower=request.user).values_list('following', flat=True)

    # Filter posts authored by followed users or the user themselves
    feed_posts = Post.objects.filter(
        author__in=list(following_users) + [request.user.id]
    ).select_related('author', 'author__profile')

    # If the user follows nobody, show recent platform posts so their screen isn't empty!
    if not feed_posts.exists():
        feed_posts = Post.objects.all().select_related('author', 'author__profile')[:20]

    # Pre-fetch post IDs liked by current user (for coloring the heart icon red)
    liked_post_ids = set(Like.objects.filter(user=request.user, post__in=feed_posts).values_list('post_id', flat=True))

    context = {
        'posts': feed_posts,
        'liked_post_ids': liked_post_ids,
    }
    return render(request, 'posts/feed.html', context)


# 2. Explore / Discovery Grid
@login_required
def explore_view(request):
    posts = Post.objects.all().select_related('author', 'author__profile')[:60]
    return render(request, 'posts/explore.html', {'posts': posts})


# 3. Create a New Post
@login_required
def create_post_view(request):
    if request.method == 'POST':
        form = PostCreateForm(request.POST, request.FILES)
        if form.is_valid():
            # commit=False creates the object in memory without saving to DB yet
            post = form.save(commit=False)
            post.author = request.user  # Attach current user as author
            post.save()  # Now save to DB
            messages.success(request, "Your post was shared successfully!")
            return redirect('feed')
    else:
        form = PostCreateForm()
    return render(request, 'posts/create_post.html', {'form': form})


# 4. Post Detail View
@login_required
def post_detail_view(request, pk):
    post = get_object_or_404(Post.objects.select_related('author', 'author__profile'), pk=pk)
    comments = post.comments.select_related('author', 'author__profile').all()
    is_liked = Like.objects.filter(post=post, user=request.user).exists()

    context = {
        'post': post,
        'comments': comments,
        'is_liked': is_liked,
    }
    return render(request, 'posts/post_detail.html', context)
```

---

## 5. Wiring Up URLs (`posts/urls.py`)

Open `posts/urls.py` and register the endpoints:

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.feed_view, name='feed'),
    path('explore/', views.explore_view, name='explore'),
    path('create/', views.create_post_view, name='create_post'),
    path('post/<int:pk>/', views.post_detail_view, name='post_detail'),
]
```

---

## 6. Next Step
Proceed to [Chapter 5: Social Interactions (Follow, Likes & Comments)](file:///e:/Networking%20Site/docs/05_SOCIAL_INTERACTIONS_LIKES_&_COMMENTS.md).

