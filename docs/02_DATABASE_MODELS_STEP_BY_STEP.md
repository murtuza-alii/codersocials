# Chapter 1: Database Models Step-by-Step

In this chapter, you will learn how to write the database models for your social network in `accounts/models.py` and `posts/models.py`.

---

## 1. What is an ORM (Object Relational Mapper)?

In traditional programming, creating a database table requires raw SQL:
```sql
CREATE TABLE profile (id INTEGER PRIMARY KEY, bio TEXT, user_id INTEGER ...);
```
With Django's ORM, you write normal **Python classes** instead. Django translates your Python code into SQL behind the scenes!

---

## 2. Models for App 1: `accounts` (`accounts/models.py`)

Open `accounts/models.py`. We need two models:
1. **`Profile`**: Extends Django's default user to store a profile picture and bio.
2. **`Follow`**: Tracks who is following whom.

### The Code:
```python
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    # OneToOneField means 1 User has exactly 1 Profile (and vice versa)
    # on_delete=models.CASCADE means if the User is deleted, their Profile is deleted too
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # upload_to='avatars/' saves profile pictures inside media/avatars/
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png', blank=True)
    bio = models.TextField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Follow(models.Model):
    # The person who clicks "Follow"
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    
    # The person being followed
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents User A from following User B more than once!
        unique_together = ('follower', 'following')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.follower.username} -> follows -> {self.following.username}"


# SIGNAL: Automatically creates a Profile whenever a new User registers!
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

### Why Line-by-Line?
- **`related_name='profile'`**: Allows you to access the profile directly from any user: `request.user.profile.bio`.
- **`unique_together = ('follower', 'following')`**: Creates a composite unique rule in SQL. If someone tries to follow the same user twice, the database cleanly rejects it.
- **`post_save signal`**: You don't have to manually write `Profile.objects.create()` every time someone signs up. Django triggers this automatically!

---

## 3. Models for App 2: `posts` (`posts/models.py`)

Open `posts/models.py`. We need three models:
1. **`Post`**: The photo and caption.
2. **`Like`**: Records which user liked which post.
3. **`Comment`**: Records comments under a post.

### The Code:
```python
from django.db import models
from django.contrib.auth.models import User


class Post(models.Model):
    # Who posted this picture
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    
    # Uploads photo to media/posts/
    image = models.ImageField(upload_to='posts/')
    caption = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']  # Newest posts appear first

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at.strftime('%Y-%m-%d')}"

    # Helper property: easy access to total likes count
    @property
    def total_likes(self):
        return self.likes.count()

    # Helper property: easy access to total comments count
    @property
    def total_comments(self):
        return self.comments.count()


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_posts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A user can only like any given post once!
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} liked Post #{self.post.id}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']  # Oldest comments first (chronological conversation)

    def __str__(self):
        return f"Comment by {self.author.username} on Post #{self.post.id}"
```

---

## 4. Running Migrations (The Real Database Construction)

Now that you have written your models, tell Django to create the SQLite tables:

```powershell
.\venv\Scripts\python.exe manage.py makemigrations accounts posts
.\venv\Scripts\python.exe manage.py migrate
```

You should see:
```text
Applying accounts.0001_initial... OK
Applying posts.0001_initial... OK
```

---

## 5. Registering in Django Admin (`admin.py`)

To inspect your database visually, register the models in the admin panel:

### In `accounts/admin.py`:
```python
from django.contrib import admin
from .models import Profile, Follow

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at')
    search_fields = ('user__username', 'bio')

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'following', 'created_at')
```

### In `posts/admin.py`:
```python
from django.contrib import admin
from .models import Post, Like, Comment

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('author', 'caption', 'created_at')

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'text', 'created_at')
```

---

## 6. Next Step
Proceed to [Chapter 3: User Authentication & Profiles](file:///e:/Networking%20Site/docs/03_USER_AUTHENTICATION_&_PROFILES.md).

