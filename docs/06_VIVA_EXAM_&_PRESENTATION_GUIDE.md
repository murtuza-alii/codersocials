# Chapter 5: College Viva Exam & Presentation Guide

This guide is designed to give you maximum confidence during your project demonstration and viva exam.

---

## 1. Top 10 Viva Questions & Winning Answers

### Q1: "Why did you use Django for a social network project?"
> **Answer**:
> *"Django is the most proven framework in the world for photo-sharing social networks — in fact, Instagram itself was built with Django and Python. Django provides high security out of the box (built-in CSRF defense, SQL injection protection, PBKDF2 password encryption), has an integrated ORM for fast queries, and easily handles file uploads."*

### Q2: "What architectural pattern does Django follow?"
> **Answer**:
> *"Django follows the MTV pattern, which stands for Model, Template, View:
> - **Model**: Defines the database schema and handles data logic.
> - **Template**: The presentation layer combining HTML, CSS, and dynamic Django template tags.
> - **View**: The business logic layer that accepts HTTP requests, communicates with models, and renders templates."*

### Q3: "How does the system ensure a user cannot like a post multiple times?"
> **Answer**:
> *"Through a database integrity constraint. In the `Like` model, we define `unique_together = ('post', 'user')`. This instructs SQLite/PostgreSQL to create a composite unique index on those two columns, which makes duplicate entries impossible at the database engine level."*

### Q4: "How does your Feed algorithm select which posts to display?"
> **Answer**:
> *"The algorithm uses a two-step relational query:
> 1. It queries the `Follow` table to find all `following_id` values where `follower = request.user`.
> 2. It queries the `Post` table filtering by `author_id__in = following_ids + [request.user.id]`, sorted with `.order_by('-created_at')` to present a reverse-chronological timeline."*

### Q5: "Where are user uploaded images stored?"
> **Answer**:
> *"Image files are stored directly on the server's disk storage under the `media/` directory (configured via `MEDIA_ROOT`). Only the relative file path string (e.g. `posts/vacation.jpg`) is stored in the database. This keeps the database lean and prevents memory bottlenecks."*

### Q6: "How do you protect users against Cross-Site Request Forgery (CSRF)?"
> **Answer**:
> *"Every POST form in our HTML templates includes the `{% csrf_token %}` tag. Django generates a unique, cryptographically signed token per user session and verifies it upon form submission. If an external attacker attempts to forge a request on the user's behalf, Django rejects the request with a 403 Forbidden error."*

### Q7: "What is the difference between `makemigrations` and `migrate`?"
> **Answer**:
> *" `makemigrations` scans `models.py` and creates Python migration files, which act as a blueprint of the changes. `migrate` actually executes those blueprints against the database, creating or updating the tables in SQL."*

### Q8: "What is `on_delete=models.CASCADE`?"
> **Answer**:
> *"It guarantees referential integrity. If a user deletes their account, `CASCADE` automatically deletes all their posts, comments, likes, and follows so no orphan data remains in the database."*

### Q9: "What is a Django Signal?"
> **Answer**:
> *"A signal is an event listener. We use the `post_save` signal on the `User` model so that whenever a new user registers, a corresponding `Profile` model is automatically created for them without requiring extra code in our signup view."*

### Q10: "How would you scale this application if it had 1 million users?"
> **Answer**:
> *"1. Switch SQLite to PostgreSQL.
> 2. Offload uploaded media files from local disk to Amazon S3 or Google Cloud Storage.
> 3. Implement Redis caching for the home feed and user follower counts to reduce database query load.
> 4. Use Celery background workers for asynchronous tasks like sending email notifications."*

---

## 2. Recommended 5-Minute Live Presentation Script

When demonstrating your project to your teacher or evaluator, follow this flow:

1. **Step 1 (Introduction - 30 seconds)**:
   - *"Good morning. My project is SocialConnect, an Instagram-inspired photo-sharing and networking platform built with Django and Python."*
2. **Step 2 (Registration & Auth - 1 minute)**:
   - Open browser, navigate to `/accounts/register/`, and create a new user account.
   - Show how the user is redirected to the login page and can log in.
3. **Step 3 (Post Creation & Media - 1 minute)**:
   - Click "Create", upload a photo from your laptop, write a caption, and click "Share Post".
   - Show how the image renders on the feed.
4. **Step 4 (Follow & Feed Demo - 1.5 minutes - The "Wow" Moment)**:
   - Open an **Incognito Window** and log in as a second user.
   - Visit User 1's profile and click **Follow**.
   - Show how User 1's follower count increases by 1.
   - Go to User 2's feed: show how User 1's photo now appears on User 2's timeline!
   - Click **Like** (heart turns red) and add a **Comment**.
5. **Step 5 (Admin Panel & Code Architecture - 1 minute)**:
   - Navigate to `/admin/` and show the evaluator the live records in the database (`Users`, `Profiles`, `Posts`, `Likes`, `Comments`).
   - Conclude by highlighting the MTV architecture and `unique_together` constraints.
