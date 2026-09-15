# Step-by-Step Implementation Roadmap

This roadmap is designed for you to write the code yourself, step-by-step, and understand every line so you can confidently answer questions during evaluation.

---

## Phase 1: Database Models & Migrations

### 1. Define Accounts Models (`accounts/models.py`)
- Create `Profile` with `user` (OneToOne), `avatar`, and `bio`.
- Create `Follow` with `follower` (FK User), `following` (FK User), and `unique_together`.
- Add a Django `post_save` signal on `User` to auto-create a profile whenever a new user signs up.

### 2. Define Posts Models (`posts/models.py`)
- Create `Post` with `author` (FK User), `image`, `caption`, `created_at`.
- Create `Like` with `post`, `user`, and `unique_together`.
- Create `Comment` with `post`, `author`, and `text`.

### 3. Generate Migrations
Run these commands in PowerShell:
```powershell
.\venv\Scripts\python.exe manage.py makemigrations accounts posts
.\venv\Scripts\python.exe manage.py migrate
```

### 4. Register in Django Admin (`accounts/admin.py`, `posts/admin.py`)
- Use `@admin.register(...)` to make your models visible in `/admin`.
- Create an admin user:
  ```powershell
  .\venv\Scripts\python.exe manage.py createsuperuser
  ```

---

## Phase 2: User Authentication & Profiles

### 1. Build Forms (`accounts/forms.py`)
- `UserRegisterForm`: A `ModelForm` based on `User` that collects `username`, `email`, `password`, and checks `password_confirm`.
- `ProfileUpdateForm`: A `ModelForm` based on `Profile` to allow users to update their `avatar` and `bio`.

### 2. Implement Views (`accounts/views.py`)
- `register_view(request)`: Validate form, call `user.set_password()`, save, and redirect to login.
- `login_view(request)`: Authenticate with `authenticate(username, password)`, then call `login(request, user)`.
- `logout_view(request)`: Call `logout(request)`.
- `profile_view(request, username)`: Fetch user, count followers, count following, list their posts.
- `edit_profile_view(request)`: Handle avatar upload (`request.FILES`) and save bio.

### 3. Wire Up URLs (`accounts/urls.py`)
- Link paths: `register/`, `login/`, `logout/`, `profile/<str:username>/`, `edit-profile/`.

---

## Phase 3: Post Creation & Media Uploads

### 1. Build Post Form (`posts/forms.py`)
- `PostCreateForm`: Includes `image` and `caption`.

### 2. Write Post Views (`posts/views.py`)
- `create_post_view(request)`:
  - Check `@login_required`.
  - Process `request.POST` and `request.FILES`.
  - Attach `post.author = request.user`.
  - Save post and redirect to feed.

---

## Phase 4: Social Graph & Feed Algorithm

### 1. Follow / Unfollow Toggle (`accounts/views.py`)
- `follow_toggle_view(request, username)`:
  ```python
  rel = Follow.objects.filter(follower=request.user, following=target_user)
  if rel.exists():
      rel.delete() # Unfollow
  else:
      Follow.objects.create(follower=request.user, following=target_user) # Follow
  ```

### 2. Feed Aggregation Query (`posts/views.py`)
- `feed_view(request)`:
  ```python
  # 1. Get IDs of users being followed
  following_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)

  # 2. Get posts by those users + current user's own posts
  feed_posts = Post.objects.filter(
      author_id__in=list(following_ids) + [request.user.id]
  ).order_by('-created_at')
  ```

---

## Phase 5: Likes & Comments

### 1. Like Toggle (`posts/views.py`)
- Check if `Like.objects.filter(post=post, user=request.user).exists()`.
- If yes, delete it. If no, create it.

### 2. Comment Form & View (`posts/forms.py`, `posts/views.py`)
- `CommentForm`: Simple text input.
- `add_comment_view(request, pk)`: Save comment linked to `post` and `request.user`.

---

## Phase 6: UI & Testing

1. Test user creation at `/accounts/register/`.
2. Test uploading photo at `/create/`.
3. Create a second test user in an incognito window, follow the first user, and observe the feed update!
