# Design Document: Video & Image Posting System (Instagram Style)

**Date**: 2026-09-19  
**Status**: Approved  
**Approach**: Approach A (Unified `Post` Model with Pillow & FFmpeg Processing)

---

## 1. Overview & Objectives
Build a robust, beginner-friendly system in Django for posting both photos and videos (like Instagram).
- Support single-media posts: either an image or a video per post.
- **Pillow**: Compresses and resizes uploaded images (max dimension 1080px, quality 85%) to reduce storage and speed up page load.
- **FFmpeg**: Compresses uploaded videos (H.264 + AAC) and extracts a cover thumbnail at `00:00:01` for instant grid/feed rendering.
- **Database**: SQLite default, designed with standard Django ORM field types for 100% compatibility with future PostgreSQL migration.
- **Management Command**: `python manage.py populate_data` to seed sample users, posts (photos & videos), follows, and comments; supports `--clear` to wipe all mock data.

---

## 2. Database Models Design

### A. `accounts` App (`accounts/models.py`)
1. **`Profile`**:
   - `user`: `OneToOneField(User, on_delete=models.CASCADE, related_name='profile')`
   - `avatar`: `ImageField(upload_to='avatars/', blank=True, default='avatars/default.png')`
   - `bio`: `TextField(max_length=500, blank=True, default='')`
   - `created_at`: `DateTimeField(auto_now_add=True)`
2. **`Follow`**:
   - `follower`: `ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')`
   - `following`: `ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')`
   - `created_at`: `DateTimeField(auto_now_add=True)`
   - `Meta.unique_together`: `('follower', 'following')`

### B. `posts` App (`posts/models.py`)
1. **`Post`**:
   - `author`: `ForeignKey(User, on_delete=models.CASCADE, related_name='posts')`
   - `MEDIA_TYPE_CHOICES = (('image', 'Image'), ('video', 'Video'))`
   - `media_type`: `CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')`
   - `media_file`: `FileField(upload_to='posts/%Y/%m/')`
   - `thumbnail`: `ImageField(upload_to='thumbnails/%Y/%m/', blank=True, null=True)`
   - `caption`: `TextField(blank=True, default='')`
   - `created_at`: `DateTimeField(auto_now_add=True)`
   - `updated_at`: `DateTimeField(auto_now=True)`
   - `Meta.ordering`: `['-created_at']`
   - Properties: `is_video`, `is_image`, `total_likes`, `total_comments`.
2. **`Like`**:
   - `post`: `ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')`
   - `user`: `ForeignKey(User, on_delete=models.CASCADE, related_name='liked_posts')`
   - `created_at`: `DateTimeField(auto_now_add=True)`
   - `Meta.unique_together`: `('post', 'user')`
3. **`Comment`**:
   - `post`: `ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')`
   - `author`: `ForeignKey(User, on_delete=models.CASCADE, related_name='comments')`
   - `text`: `TextField(max_length=500)`
   - `created_at`: `DateTimeField(auto_now_add=True)`
   - `Meta.ordering`: `['created_at']`

---

## 3. Media Processing Pipeline (`posts/utils.py`)

A clean utility module handles file inspection and compression:
1. **Image Compression (`compress_image`)**:
   - Opens file with Pillow (`Image.open`).
   - Fixes EXIF rotation if needed.
   - If width or height exceeds 1080px, scales down proportionally with `Resampling.LANCZOS`.
   - Saves to a temporary in-memory buffer (`io.BytesIO`) as optimized JPEG (quality=85).
2. **Video Processing (`process_video`)**:
   - Determines video extension (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
   - Calls `ffmpeg` via `subprocess.run`:
     - Compress video: `ffmpeg -y -i <input> -vcodec libx264 -crf 28 -preset fast -vf "scale='min(720,iw)':-2" -acodec aac <output>`
     - Extract thumbnail: `ffmpeg -y -ss 00:00:01 -i <input> -vframes 1 -q:v 2 <thumbnail_output>`
   - Returns compressed video file and thumbnail image file.
3. **Graceful Fallback**:
   - If FFmpeg is temporarily unavailable or an error occurs on a specific format, the original file is preserved so uploads never hard-crash.

---

## 4. Mock Data Seeding & Clearing (`populate_data.py`)
Custom Django management command:
- `python manage.py populate_data`:
  - Creates 3 demo users (`alex`, `sarah`, `dev_coder`).
  - Creates bio and avatars for each.
  - Generates realistic image posts and sample short video posts (using generated test media).
  - Creates cross-follows, likes, and comments.
- `python manage.py populate_data --clear`:
  - Queries all objects tagged as mock data and safely deletes them, including cleaning up created media files in `media/posts/` and `media/thumbnails/`.

---

## 5. Verification Plan
1. Run `python manage.py check` to verify syntax and configuration.
2. Run `makemigrations` and `migrate` to establish the database schema.
3. Run `python manage.py populate_data` to verify data population with both images and videos.
4. Verify thumbnail generation and video media handling.
5. Run `python manage.py populate_data --clear` to verify cleanup.
