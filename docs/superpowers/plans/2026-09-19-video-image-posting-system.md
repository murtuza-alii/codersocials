# Video & Image Posting System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, beginner-friendly Instagram-style media posting system in Django supporting both images (compressed via Pillow) and videos (compressed and thumbnailed via FFmpeg), with clean database models, SQLite storage (PostgreSQL-ready), and a `populate_data` management command with `--clear` support.

**Architecture:** A unified `Post` model stores either image or video content. Media uploaded via forms is passed through synchronous utility functions in `posts/utils.py` (Pillow for resizing/compression, FFmpeg for video transcoding and first-frame thumbnail generation). A management command seeds and cleans demo users and posts.

**Tech Stack:** Python 3.14, Django 6.1.1, Pillow 12.3.0, FFmpeg (system CLI), SQLite (standard Django ORM).

## Global Constraints
- Single media file per post (either one image or one video).
- Keep system beginner-friendly, clean, and database-agnostic (standard Django ORM).
- Direct synchronous processing via Python without Celery/Redis dependencies.
- Handle FFmpeg gracefully if video encoding fails.

---

### Task 1: Database Models for Accounts & Posts

**Files:**
- Create: `accounts/models.py`
- Create: `accounts/admin.py`
- Create: `posts/models.py`
- Create: `posts/admin.py`
- Test: `posts/tests.py`

**Interfaces:**
- Produces: `accounts.models.Profile`, `accounts.models.Follow`, `posts.models.Post`, `posts.models.Like`, `posts.models.Comment`

- [ ] **Step 1: Write model tests in `posts/tests.py`**

```python
from django.test import TestCase
from django.contrib.auth.models import User
from posts.models import Post, Like, Comment
from accounts.models import Profile, Follow

class ModelsTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='alice', password='password123')
        self.user2 = User.objects.create_user(username='bob', password='password123')

    def test_profile_auto_created(self):
        self.assertTrue(hasattr(self.user1, 'profile'))

    def test_follow_creation(self):
        follow = Follow.objects.create(follower=self.user1, following=self.user2)
        self.assertEqual(follow.follower.username, 'alice')

    def test_image_post_creation(self):
        post = Post.objects.create(author=self.user1, media_type='image', caption='Test Image')
        self.assertTrue(post.is_image)
        self.assertFalse(post.is_video)

    def test_video_post_creation(self):
        post = Post.objects.create(author=self.user1, media_type='video', caption='Test Video')
        self.assertTrue(post.is_video)
        self.assertFalse(post.is_image)

    def test_like_and_comment(self):
        post = Post.objects.create(author=self.user1, media_type='image', caption='Nice photo')
        Like.objects.create(post=post, user=self.user2)
        Comment.objects.create(post=post, author=self.user2, text='Awesome post!')
        self.assertEqual(post.total_likes, 1)
        self.assertEqual(post.total_comments, 1)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: FAIL (cannot import `Post` or `Profile` models).

- [ ] **Step 3: Implement `accounts/models.py` and `accounts/admin.py`**

Implement `Profile` (with signal) and `Follow` with `unique_together`.

- [ ] **Step 4: Implement `posts/models.py` and `posts/admin.py`**

Implement `Post`, `Like`, `Comment` with `media_type` choices, `media_file`, `thumbnail`, `is_image`, `is_video`.

- [ ] **Step 5: Run migrations & verify tests pass**

Run:
```powershell
.\venv\Scripts\python.exe manage.py makemigrations accounts posts
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py test posts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add accounts/ posts/
git commit -m "feat(models): implement accounts and posts models with video and image support"
```

---

### Task 2: Media Processing Utilities (Pillow & FFmpeg)

**Files:**
- Create: `posts/utils.py`
- Modify: `posts/tests.py`

**Interfaces:**
- Produces: `posts.utils.compress_image(input_file, max_size=(1080, 1080), quality=85)`
- Produces: `posts.utils.process_video(input_file_path, output_dir)` -> `(compressed_video_path, thumbnail_path)`
- Produces: `posts.utils.detect_media_type(filename)` -> `'image' | 'video'`

- [ ] **Step 1: Write tests for media processing in `posts/tests.py`**

Test `detect_media_type` and Pillow `compress_image` on a generated test image.

- [ ] **Step 2: Run test to verify it fails**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: FAIL (cannot import `posts.utils`).

- [ ] **Step 3: Implement `posts/utils.py`**

Implement:
- `detect_media_type(filename)`: returns `'image'` or `'video'` based on MIME / extension.
- `compress_image(uploaded_file)`: loads via Pillow, auto-orients EXIF, scales to max 1080px, compresses to JPEG (quality 85%).
- `process_video(input_file_path, output_dir)`: calls `ffmpeg` via `subprocess.run` to compress to H.264 MP4 and extract thumbnail at 1s.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add posts/utils.py posts/tests.py
git commit -m "feat(media): add Pillow image compression and FFmpeg video processing"
```

---

### Task 3: Post Creation Form, Views, and Templates for Video & Image

**Files:**
- Create: `posts/forms.py`
- Modify: `posts/views.py`
- Modify: `templates/posts/create_post.html`
- Modify: `templates/posts/feed.html`
- Modify: `templates/posts/post_detail.html`
- Modify: `templates/posts/explore.html`

**Interfaces:**
- Consumes: `posts.models.Post`, `posts.utils.compress_image`, `posts.utils.process_video`, `posts.utils.detect_media_type`
- Produces: Web UI supporting uploading either a video or image, displaying `<video controls>` for video posts and `<img>` for image posts.

- [ ] **Step 1: Write view integration tests in `posts/tests.py`**

Test post creation view with an image upload and test feed rendering.

- [ ] **Step 2: Run test to verify it fails**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: FAIL (view not yet implemented).

- [ ] **Step 3: Implement `posts/forms.py` & `posts/views.py`**

Handle file upload, run compression, set `media_type`, and save.

- [ ] **Step 4: Update templates to render `<video>` when `post.is_video` is True**

Update `feed.html`, `post_detail.html`, `explore.html` with responsive video player tags.

- [ ] **Step 5: Run tests and verify they pass**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add posts/ templates/posts/
git commit -m "feat(views): integrate video and image upload, processing, and playback"
```

---

### Task 4: Mock Data Population & Cleanup Command

**Files:**
- Create: `posts/management/__init__.py`
- Create: `posts/management/commands/__init__.py`
- Create: `posts/management/commands/populate_data.py`
- Modify: `posts/tests.py`

**Interfaces:**
- Produces: `python manage.py populate_data` (populates demo users, image posts, video posts, follows, likes, comments)
- Produces: `python manage.py populate_data --clear` (wipes all mock data and generated demo files)

- [ ] **Step 1: Write command test in `posts/tests.py`**

Test calling `call_command('populate_data')` and `call_command('populate_data', clear=True)`.

- [ ] **Step 2: Run test to verify it fails**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: FAIL (`populate_data` command unknown).

- [ ] **Step 3: Implement `populate_data.py`**

Use Pillow to generate sample colored demo images, FFmpeg to generate a 2-second test MP4 video, create mock users (`alex`, `sarah`, `dev_coder`), create follows, likes, comments.
Add `--clear` flag to delete mock users and remove their media files.

- [ ] **Step 4: Run test to verify it passes**

Run: `.\venv\Scripts\python.exe manage.py test posts`
Expected: PASS

- [ ] **Step 5: Test command live in terminal**

Run:
```powershell
.\venv\Scripts\python.exe manage.py populate_data
.\venv\Scripts\python.exe manage.py populate_data --clear
```

- [ ] **Step 6: Commit**

```bash
git add posts/management/ posts/tests.py
git commit -m "feat(commands): add populate_data command with --clear option"
```

---

### Task 5: Final Documentation & Git Push

**Files:**
- Modify: `README.md`
- Modify: `docs/04_POSTS_UPLOADS_&_FEED_ALGORITHM.md`

- [ ] **Step 1: Update documentation with video & FFmpeg setup notes**
- [ ] **Step 2: Run `python manage.py check` to ensure 0 errors**
- [ ] **Step 3: Commit and push to GitHub**

```bash
git add .
git commit -m "docs: update guides with video posting, ffmpeg compression, and mock data command"
git push origin main
```
