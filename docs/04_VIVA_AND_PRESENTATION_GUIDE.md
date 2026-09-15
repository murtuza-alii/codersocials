# College Viva & Presentation Preparation Guide

This guide contains the most probable questions external examiners and professors ask during project evaluations, along with clear, technical answers.

---

## 1. High-Priority Questions & Answers

### Q1: Why did you choose Django instead of Node.js (MERN) or PHP?
> **Answer**:
> *"Django was chosen because it provides a complete, secure, batteries-included framework suited for data-driven social networks. It has an integrated ORM, built-in user authentication, automatic password hashing, and built-in protection against CSRF and SQL injection. Moreover, Instagram itself was famously created and scaled using Python and Django, making it the most proven technology stack for this exact domain."*

### Q2: How does your database prevent a user from following someone twice or liking a post multiple times?
> **Answer**:
> *"We enforce data integrity at the database layer using Django’s `unique_together` constraint in the model's `Meta` class:
> - For Likes: `unique_together = ('post', 'user')`
> - For Follows: `unique_together = ('follower', 'following')`
> This instructs the underlying database to create a composite unique index, which rejects duplicate records at the SQL level rather than relying solely on application-level checks."*

### Q3: How is password security handled?
> **Answer**:
> *"Passwords are never stored in plain text. Django automatically hashes passwords using PBKDF2 (Password-Based Key Derivation Function 2) with a SHA-256 hash and a cryptographic salt. When a user logs in, Django hashes the submitted password and compares the hash against the stored hash."*

### Q4: How are media files (images) handled and stored?
> **Answer**:
> *"Image files are not stored directly in the database, as that would degrade database performance. Instead, Django’s `ImageField` saves the binary image file directly to the server's filesystem under the `media/` directory (configured by `MEDIA_ROOT`), and only the file path string is saved in the database."*

### Q5: How does the personalized Feed algorithm work?
> **Answer**:
> *"The feed uses a relational query:
> 1. It queries the `Follow` table to extract all user IDs that the current user is following (`following_id`).
> 2. It queries the `Post` table using `author_id__in` to find posts created by those followed users and the user themselves.
> 3. It sorts the results by `-created_at` (descending) so the newest content appears first."*

### Q6: What is the purpose of Django Migrations?
> **Answer**:
> *"Migrations are Django’s way of propagating changes you make to your models (adding a field, deleting a model, etc.) into your database schema. `makemigrations` creates migration files that describe the schema changes, and `migrate` applies those changes to the database as SQL commands."*

### Q7: What is the difference between MVC and MTV?
> **Answer**:
> *"They are functionally equivalent, but Django uses different terminology:
> - **Model**: Same in both (the database layer).
> - **Template (MTV)**: Corresponds to the **View** in standard MVC (the presentation/HTML).
> - **View (MTV)**: Corresponds to the **Controller** in standard MVC (handles request routing, queries data, and selects which template to render)."*

---

## 2. Practical Demonstration Tips

1. **Keep Django Admin open**: Show the `/admin` interface to prove that database rows are being added when users register, follow, and upload posts.
2. **Use Two Different Browsers**: Open Chrome (User A) and an Incognito window or Firefox (User B) to demonstrate real-time interactions (User A posts a picture -> User B sees it on their feed -> User B likes the post).
