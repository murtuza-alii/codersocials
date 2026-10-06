# Chapter 8: The Non-Coder's AI Playbook & Viva Defense Guide

If you don't have deep coding experience and plan to use AI (like Antigravity, ChatGPT, or Claude) to write the code for you, **this guide is your secret weapon**.

In college, **evaluators do not grade you on typing code from memory**. They grade you on:
1. Understanding the system architecture.
2. Knowing how data flows through the application.
3. Being able to explain any line of code when pointed at during your viva.

This guide gives you the **exact step-by-step prompts to give the AI**, the **"decoder ring" to understand what the AI writes**, and the **defense strategy to ace your presentation**.

---

## 1. The Core Mindset: You are the Architect, AI is the Typist

Think of yourself as the **Architect & Project Manager**.
- An architect does not lay every brick by hand.
- An architect designs the blueprint, tells the construction crew (the AI) what to build piece-by-piece, inspects the building for flaws, and explains the structure to the client (your professor).

---

## 2. The Golden Rules: How to Use AI Without Breaking Your Project

Beginners make one big mistake: they paste a huge prompt like *"Build me Instagram with Django"* and the AI outputs 500 lines of broken code that crashes the app.

Follow these 4 rules to never break your project:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE 4 GOLDEN RULES OF USING AI                       │
├────────────────────────────────────────────────────────────────────────┤
│ Rule 1: ONE FILE AT A TIME. Never ask for multiple apps at once.       │
│ Rule 2: ALWAYS FEED CONTEXT. When asking for a view, paste your model. │
│ Rule 3: VERIFY WITH 'python manage.py check'. If red errors appear,    │
│         paste the exact error back to the AI.                          │
│ Rule 4: ALWAYS READ THE CODE ONCE. Use Section 4 of this guide to      │
│         understand every keyword the AI generates.                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Copy-Paste AI Prompts (Phase-by-Phase)

When you are ready to implement the code, copy-paste these exact prompts to your AI in sequence:

### 📋 Phase 1: Models (Database Tables)
**Copy-paste this prompt to your AI:**
> *"I have a Django project with two apps: `accounts` and `posts`. In `accounts/models.py`, please write the `Profile` model (with user OneToOne, avatar ImageField, and bio) and the `Follow` model (follower, following, unique_together). Add a `post_save` signal on User to auto-create the Profile. In `posts/models.py`, write `Post` (author ForeignKey, image ImageField, caption), `Like` (post, user, unique_together), and `Comment` (post, author, text). Include docstrings explaining every line in simple terms."*

After the AI writes the models, run in your terminal:
```powershell
.\venv\Scripts\python.exe manage.py makemigrations accounts posts
.\venv\Scripts\python.exe manage.py migrate
```

---

### 📋 Phase 2: Authentication & Forms
**Copy-paste this prompt to your AI:**
> *"Here is my `accounts/models.py` [paste your models.py]. Now, in `accounts/forms.py`, create a `UserRegisterForm` using Django's User model with username, email, password, and confirm_password (with validation checking that passwords match). Also create `ProfileUpdateForm` for avatar and bio. Then, in `accounts/views.py`, write `register_view`, `login_view`, `logout_view`, `profile_view`, and `edit_profile_view`. Keep the logic beginner-friendly and clean."*

---

### 📋 Phase 3: Posts, Uploads & The Feed Algorithm
**Copy-paste this prompt to your AI:**
> *"Here is my `posts/models.py` [paste your models.py] and my `accounts/models.py` [paste your models.py]. In `posts/forms.py`, write `PostCreateForm` (image and caption) and `CommentForm` (text). In `posts/views.py`, write:
> 1. `create_post_view` that handles `request.FILES` and sets `post.author = request.user`.
> 2. `feed_view` that gets posts from users the current user follows plus their own posts, ordered newest first.
> 3. `explore_view` that shows all platform posts.
> 4. `post_detail_view` that displays the post and its comments list."*

---

### 📋 Phase 4: Social Interactions (Follows, Likes, Comments)
**Copy-paste this prompt to your AI:**
> *"I need toggle actions for social interactions:
> 1. In `accounts/views.py`, write `follow_toggle_view(request, username)` that creates a Follow record if not following, or deletes it if already following.
> 2. In `posts/views.py`, write `like_toggle_view(request, pk)` that creates a Like record if not liked, or deletes it if already liked.
> 3. In `posts/views.py`, write `add_comment_view(request, pk)` that saves a comment to the post.
> Redirect back to the previous page using `request.META.get('HTTP_REFERER')`."*

---

### 📋 Phase 5: URL Routing
**Copy-paste this prompt to your AI:**
> *"Here are my view functions in `accounts/views.py` and `posts/views.py`. Please give me the exact clean `accounts/urls.py`, `posts/urls.py`, and `config/urls.py` to route all views properly with clear path names."*

---

## 4. The "Decoder Ring": How to Explain AI Code to Your Professor

When the teacher points to a line of code on your screen, use this translation cheat sheet to explain what it means:

| Code the AI Writes | What It Means (Plain English) | What to Say in Your Viva |
|---|---|---|
| `on_delete=models.CASCADE` | If parent is deleted, delete child too. | *"This maintains database integrity. If a user deletes their profile, CASCADE automatically deletes their posts and comments so no orphan records remain."* |
| `unique_together = ('follower', 'following')` | Prevents duplicate combinations. | *"This enforces a composite unique constraint at the SQL level, preventing a user from accidentally following someone twice."* |
| `related_name='posts'` | Reverse lookup name. | *"This creates a backwards relationship from User to Post, so I can easily do `user.posts.all()` to get all photos that user took."* |
| `post_save.connect(...)` or `@receiver(post_save)` | Event listener. | *"This is a Django Signal. It listens for when a new User is inserted into the database and immediately creates their Profile row automatically."* |
| `commit=False` | Hold off on saving to database. | *"This pauses the database save so we can manually assign `post.author = request.user` before writing the record to disk."* |
| `request.FILES` | Uploaded media dictionary. | *"Django separates text fields (`request.POST`) from uploaded binary files (`request.FILES`). We need `request.FILES` to capture user photos."* |
| `values_list('following_id', flat=True)` | Extracts just a list of numbers. | *"This flattens the query result into a clean Python list of user IDs `[2, 5, 8]`, which speeds up our feed query."* |
| `author_id__in=following_ids` | SQL `WHERE IN (...)` filter. | *"This generates an SQL IN clause to retrieve posts created by any of the accounts the user follows in a single fast query."* |
| `@login_required` | Security guard. | *"A view decorator that blocks unauthenticated visitors and redirects them to the login page."* |

---

## 5. How to Answer Tricky Viva Questions Without Panicking

### Examiner: *"Did you write this code yourself, or did you use AI?"*
> **Winning Answer**:  
> *"I designed the system architecture, structured the database schema, and planned the MTV workflow myself. For implementing the boilerplate and syntax, I utilized modern AI engineering tools as a pair programmer, and I verified, debugged, and tested every function. I can explain any function or database query in this codebase right now."*  
> *(Teachers respect this answer because you are honest, mature, and confident about explaining the code).*

### Examiner: *"Can you change this code right now to prove you understand it?"*
Teachers love this test. Here are the 3 most common quick changes they ask for, and how to do them:

1. **"Change it so older posts show first instead of newest."**
   - Go to `posts/models.py` or `posts/views.py`.
   - Find `ordering = ['-created_at']` (the minus sign means descending/newest first).
   - Remove the minus sign: `ordering = ['created_at']`!
2. **"Change the maximum bio length to 250 characters."**
   - Go to `accounts/models.py`.
   - Find `bio = models.TextField(max_length=500...)`.
   - Change `500` to `250` and run `python manage.py makemigrations` and `migrate`.
3. **"Make the caption optional."**
   - Go to `posts/models.py`.
   - Point out `caption = models.TextField(blank=True)`. Explain: *"It is already optional because `blank=True` allows empty submissions."*

---

## 6. If You Encounter an Error: The 60-Second Recovery Plan

If the server crashes during testing:
1. Don't panic. Look at the terminal output.
2. Scroll to the **very bottom line** of the red text. That line is the exact error (e.g., `AttributeError`, `ModuleNotFoundError`, `OperationalError`).
3. Copy that exact error line and the traceback, paste it to your AI:
   > *"My Django app threw this error: [paste error]. Here is my file [paste file]. Fix the error and tell me why it happened."*
4. Run `python manage.py check` to verify the fix.

You are now equipped with everything you need to build this app with AI and defend it with complete confidence!
