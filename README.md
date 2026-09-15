# SocialConnect - College Mini-Project Blueprint & Documentation

A modern social networking platform inspired by **Instagram**, designed for users to connect, share photo content, follow friends, and engage through likes and comments.

---

## 1. Is Django Good for this System? (Project Defense & Pitch)

> **Short Answer: YES, Django is arguably the single best framework for this project.**

When defending your technology choice in college, here are the exact technical facts you should present:

1. **Instagram itself is built on Django**:
   Instagram's entire backend was originally engineered with **Python and Django** and still runs on one of the largest Django deployments in the world. Citing this immediately validates your architectural decision to evaluators.
2. **Batteries-Included Security**:
   Social platforms require strict security. Django includes out-of-the-box protection against:
   - **CSRF (Cross-Site Request Forgery)** via `{% csrf_token %}` tokens.
   - **SQL Injection** via parameterized queries in the Django ORM.
   - **XSS (Cross-Site Scripting)** with automatic HTML template escaping.
   - **Secure Password Hashing** using the industry-standard PBKDF2 algorithm with SHA-256.
3. **Powerful Built-in ORM & Media Pipeline**:
   Handling complex relational models (users, follows, posts, comments, likes) and file storage (image uploads with Pillow) requires zero boilerplate compared to raw SQL or Express/Node.
4. **Built-in Administrative Dashboard (`/admin`)**:
   Allows you to easily show live database records, users, and content moderation during your practical viva.

---

## 2. System Architecture: The MTV Pattern

Django utilizes the **MTV (Model - Template - View)** design pattern:

```
                  ┌────────────────────────────────────────────────┐
                  │                 HTTP Request                   │
                  └───────────────────────┬────────────────────────┘
                                          ▼
                                    [ urls.py ]
                               (Routing / Dispatcher)
                                          │
                                          ▼
                                   [ views.py ]
                             (Business Logic / Controller)
                                  ▲               │
                       Query / ORM│               │ Passes Context Data
                                  ▼               ▼
                           [ models.py ]    [ templates/*.html ]
                         (Database Layer)     (UI Presentation)
                                                  │
                                                  ▼
                                            HTTP Response
```

- **Model (`models.py`)**: Defines data structures, relational constraints, and database tables.
- **Template (`templates/*.html`)**: Presentation layer combining HTML, CSS, and Django Template Tags to render dynamic web pages.
- **View (`views.py`)**: Business logic that queries the Model, prepares data context, and renders the Template or handles form submissions.

---

## 3. Database Schema & Entity-Relationship Design (ERD)

The system is structured around relational entities designed to handle social graphs and multimedia posts:

```
 ┌──────────────────────┐         1 : 1         ┌────────────────────────┐
 │   auth_user (User)   ├───────────────────────┤        Profile         │
 ├──────────────────────┤                       ├────────────────────────┤
 │ id (PK)              │                       │ id (PK)                │
 │ username             │                       │ user_id (FK -> User)   │
 │ email                │                       │ avatar (ImageField)    │
 │ password (hashed)    │                       │ bio (TextField)        │
 └──────────┬───────────┘                       │ created_at             │
            │                                   └────────────────────────┘
            │ 1:N
            ├──────────────────────────────────────────┐
            │                                          │ 1:N
            ▼ 1:N                                      ▼
 ┌──────────────────────┐                       ┌────────────────────────┐
 │        Follow        │                       │          Post          │
 ├──────────────────────┤                       ├────────────────────────┤
 │ id (PK)              │                       │ id (PK)                │
 │ follower_id (FK)     │                       │ author_id (FK -> User) │
 │ following_id (FK)    │                       │ image (ImageField)     │
 │ created_at           │                       │ caption (TextField)    │
 └──────────────────────┘                       │ created_at             │
 * unique_together:                             └──────────┬─────────────┘
   (follower, following)                                   │
                                            ┌──────────────┴─────────────┐
                                            │ 1:N                        │ 1:N
                                            ▼                            ▼
                                 ┌──────────────────────┐     ┌──────────────────────┐
                                 │         Like         │     │       Comment        │
                                 ├──────────────────────┤     ├──────────────────────┤
                                 │ id (PK)              │     │ id (PK)              │
                                 │ post_id (FK -> Post) │     │ post_id (FK -> Post) │
                                 │ user_id (FK -> User) │     │ author_id (FK-> User)│
                                 │ created_at           │     │ text (TextField)     │
                                 └──────────────────────┘     │ created_at           │
                                 * unique_together:           └──────────────────────┘
                                   (post, user)
```

### Key Relational Rules:
1. **User ↔ Profile**: One-to-One. Each user has exactly one profile storing their avatar and bio.
2. **Follow Graph**: Many-to-Many through `Follow`. A user can follow many users, and a user can be followed by many users. `unique_together = ('follower', 'following')` guarantees no duplicate follow requests.
3. **User ↔ Post**: One-to-Many. One user creates many posts.
4. **Post ↔ Like**: One-to-Many. `unique_together = ('post', 'user')` ensures one user can only like a given post once.
5. **Post ↔ Comment**: One-to-Many. Users can add multiple text comments to any post.

---

## 4. Project Directory Structure

```text
Networking Site/
│
├── config/                     # Core Project Configuration
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py             # Configures apps, templates, static/media, auth redirects
│   ├── urls.py                 # Main URL routing entrypoint
│   └── wsgi.py
│
├── accounts/                   # App 1: Authentication, Profiles, Social Graph
│   ├── migrations/             # Database migration history
│   ├── __init__.py
│   ├── admin.py                # Admin registration for Profile & Follow models
│   ├── apps.py
│   ├── forms.py                # Registration & Profile update forms
│   ├── models.py               # Profile & Follow models
│   ├── urls.py                 # URLs: /accounts/login/, /accounts/register/, /accounts/profile/<username>/
│   └── views.py                # Auth, profile, and follow toggle views
│
├── posts/                      # App 2: Multimedia Content, Feed, Interactions
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py                # Admin registration for Post, Like, Comment
│   ├── apps.py
│   ├── forms.py                # Post creation & Comment forms
│   ├── models.py               # Post, Like, Comment models
│   ├── urls.py                 # URLs: /, /explore/, /create/, /post/<id>/, /post/<id>/like/
│   └── views.py                # Feed aggregation, create post, like/comment views
│
├── templates/                  # Presentation Layer (HTML Templates)
│   ├── base.html               # Shared skeleton (sidebar, mobile bar, toasts)
│   ├── accounts/
│   │   ├── login.html          # User sign-in interface
│   │   ├── register.html       # New user onboarding
│   │   ├── profile.html        # Instagram-style user profile & post grid
│   │   └── edit_profile.html   # Update avatar & bio
│   └── posts/
│       ├── feed.html           # Main timeline of followed accounts
│       ├── explore.html        # 3-column discovery grid
│       ├── create_post.html    # Image upload & caption form
│       └── post_detail.html    # Expanded view with conversation thread
│
├── static/                     # Static Assets
│   ├── css/
│   │   └── style.css           # Instagram-inspired dark/clean stylesheet
│   └── js/
│       └── main.js             # Client interactivity (toast alerts, UI triggers)
│
├── media/                      # Uploaded files directory (Git ignored)
│   ├── avatars/
│   └── posts/
│
├── manage.py                   # Django CLI utility
├── requirements.txt            # Python dependencies (django, pillow)
├── .gitignore                  # Excludes venv, media files, bytecode, db.sqlite3
└── README.md                   # Complete architectural guide & viva reference
```

---

## 5. Step-by-Step Implementation Roadmap (Do It Yourself Guide)

Follow this order to write the code yourself with complete understanding:

### Phase 1: Models & Database Migration
1. Open `accounts/models.py`: Implement the `Profile` and `Follow` models. Use a `post_save` signal on Django's `User` model to automatically instantiate a `Profile` when someone registers.
2. Open `posts/models.py`: Implement `Post`, `Like`, and `Comment` models with appropriate `ForeignKey` relationships and `CASCADE` deletes.
3. Run migrations:
   ```bash
   python manage.py makemigrations accounts posts
   python manage.py migrate
   ```
4. Register the models in `accounts/admin.py` and `posts/admin.py`.
5. Create a superuser to verify everything in `/admin`:
   ```bash
   python manage.py createsuperuser
   ```

### Phase 2: User Authentication & Registration
1. In `accounts/forms.py`, build `UserRegisterForm` subclassing `forms.ModelForm` with password confirmation validation.
2. In `accounts/views.py`, write `register_view` using `form.save()` and `user.set_password()`.
3. Wire up `login_view` and `logout_view`.
4. Test creating a new user through the browser at `/accounts/register/`.

### Phase 3: Post Creation & Media Uploads
1. In `posts/forms.py`, create `PostCreateForm` exposing `image` and `caption`.
2. In `posts/views.py`, write `create_post_view`:
   - Check `request.user.is_authenticated` (or use `@login_required`).
   - Read `request.POST` and `request.FILES`.
   - Set `post.author = request.user` before saving.
3. Verify that uploaded photos appear properly in the `media/posts/` folder.

### Phase 4: Social Graph (Follow & Unfollow)
1. In `accounts/views.py`, write `follow_toggle_view(request, username)`:
   - Check if `Follow.objects.filter(follower=request.user, following=target_user).exists()`.
   - If true: delete the record (unfollow).
   - If false: create the record (follow).
2. Render follow/following counts in `templates/accounts/profile.html`.

### Phase 5: Feed Algorithm
1. In `posts/views.py`, write the `feed_view`:
   - Retrieve all user IDs that the logged-in user follows:
     ```python
     following_ids = Follow.objects.filter(follower=request.user).values_list('following_id', flat=True)
     ```
   - Query posts where `author_id` is in `following_ids` or is `request.user.id`:
     ```python
     posts = Post.objects.filter(author_id__in=list(following_ids) + [request.user.id]).order_by('-created_at')
     ```
2. Render this list in `templates/posts/feed.html`.

### Phase 6: Likes & Comments Interactivity
1. In `posts/views.py`, implement `like_toggle_view(request, pk)` using the `Like` model.
2. Implement `add_comment_view(request, pk)` using the `CommentForm`.

---

## 6. College Viva / Presentation Q&A Cheat Sheet

| Question | Strong Technical Answer |
|---|---|
| **Q: Why did you choose Django over Node.js/MERN?** | *"Django provides high-level abstractions, built-in ORM, media handling, and superior security (CSRF, SQL injection, password salting/hashing) out of the box. Furthermore, Instagram itself relies heavily on Django for its core backend."* |
| **Q: How does the feed query scale?** | *"We extract the foreign keys of followed users from the `Follow` table, and perform a single indexed query on `Post` filtering by `author_id__in` ordered by `created_at` descending."* |
| **Q: How do you prevent a user from liking a post multiple times?** | *"Through database constraints. The `Like` model uses `unique_together = ('post', 'user')`, which creates a composite unique database index that rejects duplicates at the database level."* |
| **Q: Where are media images stored?** | *"Django saves image metadata/paths in the SQLite database, while the physical image binary files are stored under the file system directory defined by `MEDIA_ROOT`."* |
| **Q: What is a Django Signal?** | *"A signal (specifically `post_save`) allows decoupled applications to get notified when certain actions occur. We use it to automatically create a `Profile` record the moment a new `User` is saved."* |

---

## 7. How to Run the Project Locally

1. **Activate Virtual Environment**:
   - Windows PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
2. **Apply Migrations**:
   ```bash
   python manage.py migrate
   ```
3. **Start the Development Server**:
   ```bash
   python manage.py runserver
   ```
4. Open your browser at `http://127.0.0.1:8000/`.
