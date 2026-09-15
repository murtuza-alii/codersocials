# Database Design & Entity Relationship Diagram (ERD)

## 1. Entity-Relationship Diagram (ERD)

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

---

## 2. Table Schemas & Field Specifications

### 2.1 User (`auth_user`) - Built-in
Provided by `django.contrib.auth.models.User`:
- `id`: Primary key (Integer)
- `username`: Unique varchar identifier
- `email`: User email address
- `password`: Salted, hashed password string

### 2.2 Profile (`accounts.Profile`)
Extends the core `User` model with social details:
- `id`: Primary Key
- `user`: OneToOneField(`User`, on_delete=models.CASCADE)
- `avatar`: ImageField(upload_to='avatars/', blank=True)
- `bio`: TextField(max_length=500, blank=True)
- `created_at`: DateTimeField(auto_now_add=True)

### 2.3 Follow (`accounts.Follow`)
Self-referential many-to-many through-table representing user connections:
- `id`: Primary Key
- `follower`: ForeignKey(`User`, on_delete=models.CASCADE, related_name='following_set')
- `following`: ForeignKey(`User`, on_delete=models.CASCADE, related_name='followers_set')
- `created_at`: DateTimeField(auto_now_add=True)
- **Constraint**: `unique_together = ('follower', 'following')` (prevents following the same user multiple times)

### 2.4 Post (`posts.Post`)
Represents uploaded photo content:
- `id`: Primary Key
- `author`: ForeignKey(`User`, on_delete=models.CASCADE, related_name='posts')
- `image`: ImageField(upload_to='posts/')
- `caption`: TextField(blank=True)
- `created_at`: DateTimeField(auto_now_add=True)
- `updated_at`: DateTimeField(auto_now=True)

### 2.5 Like (`posts.Like`)
Represents user appreciation on a post:
- `id`: Primary Key
- `post`: ForeignKey(`Post`, on_delete=models.CASCADE, related_name='likes')
- `user`: ForeignKey(`User`, on_delete=models.CASCADE, related_name='liked_posts')
- `created_at`: DateTimeField(auto_now_add=True)
- **Constraint**: `unique_together = ('post', 'user')` (prevents double liking)

### 2.6 Comment (`posts.Comment`)
Represents text comments on posts:
- `id`: Primary Key
- `post`: ForeignKey(`Post`, on_delete=models.CASCADE, related_name='comments')
- `author`: ForeignKey(`User`, on_delete=models.CASCADE, related_name='comments')
- `text`: TextField(max_length=500)
- `created_at`: DateTimeField(auto_now_add=True)
