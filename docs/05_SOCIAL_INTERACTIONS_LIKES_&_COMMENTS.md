# Chapter 4: Social Interactions (Follows, Likes & Comments) Step-by-Step

In this chapter, you will implement the core interactivity that makes a social network engaging: following creators, liking posts, and writing comments.

---

## 1. The Toggle Pattern

In modern web apps, the same button handles both adding and removing an action:
- Clicking **Follow** $\rightarrow$ Creates a record.
- Clicking **Following** $\rightarrow$ Deletes the record (Unfollow).
- Clicking **Heart** (white) $\rightarrow$ Creates a like.
- Clicking **Heart** (red) $\rightarrow$ Deletes the like.

This is called the **Toggle Pattern**.

---

## 2. Implementing Follow / Unfollow Toggle (`accounts/views.py`)

Add this view to `accounts/views.py`:

```python
@login_required
def follow_toggle_view(request, username):
    target_user = get_object_or_404(User, username=username)

    # You cannot follow yourself!
    if target_user != request.user:
        # Check if already following
        follow_rel = Follow.objects.filter(follower=request.user, following=target_user)

        if follow_rel.exists():
            # Already following -> Unfollow
            follow_rel.delete()
        else:
            # Not following -> Follow
            Follow.objects.create(follower=request.user, following=target_user)

    # Redirect back to the profile page
    return redirect('profile', username=username)
```

And in `accounts/urls.py`, add:
```python
path('follow/<str:username>/', views.follow_toggle_view, name='follow_toggle'),
```

---

## 3. Implementing Like / Unlike Toggle (`posts/views.py`)

Add this view to `posts/views.py`:

```python
@login_required
def like_toggle_view(request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check if this user has already liked this post
    like_rel = Like.objects.filter(post=post, user=request.user)

    if like_rel.exists():
        # Already liked -> Unlike
        like_rel.delete()
    else:
        # Not liked -> Like
        Like.objects.create(post=post, user=request.user)

    # Return the user back to whatever page they were on (feed or post_detail)
    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)
```

And in `posts/urls.py`, add:
```python
path('post/<int:pk>/like/', views.like_toggle_view, name='like_toggle'),
```

---

## 4. Implementing Comments (`posts/forms.py` & `posts/views.py`)

### 1. In `posts/forms.py`:
```python
from .models import Comment

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['text']
        widgets = {
            'text': forms.TextInput(attrs={'placeholder': 'Add a comment...', 'required': True}),
        }
```

### 2. In `posts/views.py`:
```python
from .forms import CommentForm

@login_required
def add_comment_view(request, pk):
    post = get_object_or_404(Post, pk=pk)

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post          # Link to this post
            comment.author = request.user  # Link to the logged-in user
            comment.save()

    next_url = request.META.get('HTTP_REFERER', 'feed')
    return redirect(next_url)
```

And in `posts/urls.py`, add:
```python
path('post/<int:pk>/comment/', views.add_comment_view, name='add_comment'),
```

---

## 5. Next Step
Proceed to [Chapter 6: Viva Exam & Presentation Guide](file:///e:/Networking%20Site/docs/06_VIVA_EXAM_&_PRESENTATION_GUIDE.md).

