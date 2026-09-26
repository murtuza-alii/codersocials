# Community Sanctuary Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant community sanctuary platform featuring Docker containerization, strict query-level tenant isolation, Instagram-style multi-media carousels (photos + video player), Discord-style in-community channels, standalone DMs/WhatsApp-style personal group chats, and a three-pane layout with an accordion secondary sidebar.

**Architecture:** Multi-tenant Django application partitioned by `Community` models with strict ORM-level scoping (`TenantQuerySet`) to prevent cross-tenant data leaks. Docker & Docker Compose orchestrate the web service, database, and persistent media volumes. Frontend uses vanilla JS/CSS3 custom properties with an accordion sidebar (hover on desktop, tap on mobile) and custom HTML5 video carousel controls.

**Tech Stack:** Python 3.12, Django 6.1, Pillow 12.3, Docker & Docker Compose, SQLite (dev) / PostgreSQL (prod), Vanilla JS & CSS3.

## Global Constraints
- Target workspace: `e:\Networking Site`
- Keep existing user auth and profile features intact in `accounts/`.
- No cross-tenant data leakage: Any query for private community posts or channels MUST verify user has `status='APPROVED'`.
- Media carousel must handle both photos and videos with custom tap-to-mute/pause overlays (no standard browser video controls).
- Accordion sidebar must expand on hover for desktop and toggle on tap/click for mobile.
- Follow TDD with Django TestCase test suites.

---

### Task 1: Dockerization Setup (`Dockerfile`, `docker-compose.yml`, `.dockerignore`)

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Modify: `requirements.txt`

**Interfaces:**
- Consumes: Django project structure (`manage.py`, `config/`, `requirements.txt`).
- Produces: Runnable containerized environment exposing port 8000 with persistent volumes for database and uploaded media.

- [ ] **Step 1: Update requirements.txt to include gunicorn and psycopg2-binary**
  Ensure production webserver capability in container.
  ```text
  asgiref==3.12.1
  Django==6.1.1
  pillow==12.3.0
  sqlparse==0.6.0
  tzdata==2026.4
  gunicorn==22.0.0
  ```

- [ ] **Step 2: Create .dockerignore**
  ```text
  venv/
  __pycache__/
  *.pyc
  .git/
  .env
  media/
  db.sqlite3
  ```

- [ ] **Step 3: Create Dockerfile**
  ```dockerfile
  FROM python:3.12-slim-bookworm

  ENV PYTHONDONTWRITEBYTECODE=1
  ENV PYTHONUNBUFFERED=1

  WORKDIR /app

  RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      ffmpeg \
      && rm -rf /var/lib/apt/lists/*

  COPY requirements.txt /app/
  RUN pip install --no-cache-dir -r requirements.txt

  COPY . /app/

  EXPOSE 8000

  CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
  ```

- [ ] **Step 4: Create docker-compose.yml**
  ```yaml
  version: '3.8'

  services:
    web:
      build: .
      command: python manage.py runserver 0.0.0.0:8000
      volumes:
        - .:/app
        - media_volume:/app/media
      ports:
        - "8000:8000"
      environment:
        - DEBUG=1
        - SECRET_KEY=django-insecure-community-sanctuary-key
      restart: unless-stopped

  volumes:
    media_volume:
  ```

- [ ] **Step 5: Verify configuration with docker compose config (or syntax check)**
  Run: `docker compose config`
  Expected: Valid YAML output with service `web`.

- [ ] **Step 6: Commit Docker setup**
  ```bash
  git add Dockerfile docker-compose.yml .dockerignore requirements.txt
  git commit -m "chore: add Dockerfile and docker-compose configuration with persistent volumes"
  ```

---

### Task 2: Communities App Models (`Community`, `CommunityMembership`)

**Files:**
- Create: `communities/__init__.py`
- Create: `communities/models.py`
- Create: `communities/apps.py`
- Create: `communities/admin.py`
- Create: `communities/tests/__init__.py`
- Create: `communities/tests/test_models.py`
- Modify: `config/settings.py` (add `'communities'` to `INSTALLED_APPS`)

**Interfaces:**
- Consumes: `django.contrib.auth.models.User`
- Produces: `Community`, `CommunityMembership` models with roles (`ADMIN`, `MODERATOR`, `MEMBER`) and statuses (`APPROVED`, `PENDING`, `REJECTED`, `BANNED`).

- [ ] **Step 1: Write failing model unit tests**
  File: `communities/tests/test_models.py`
  ```python
  from django.test import TestCase
  from django.contrib.auth.models import User
  from communities.models import Community, CommunityMembership

  class CommunityModelTest(TestCase):
      def setUp(self):
          self.user = User.objects.create_user(username='alice', password='password123')

      def test_create_community_with_defaults(self):
          comm = Community.objects.create(
              name='Tech Sanctuary',
              slug='tech-sanctuary',
              description='A safe tech space',
              privacy='PRIVATE',
              creator=self.user
          )
          self.assertEqual(comm.name, 'Tech Sanctuary')
          self.assertEqual(comm.privacy, 'PRIVATE')
          self.assertEqual(str(comm), 'Tech Sanctuary')

      def test_membership_creation_and_roles(self):
          comm = Community.objects.create(name='Public Hub', slug='public-hub', creator=self.user)
          membership = CommunityMembership.objects.create(
              community=comm,
              user=self.user,
              role='ADMIN',
              status='APPROVED'
          )
          self.assertEqual(membership.role, 'ADMIN')
          self.assertEqual(membership.status, 'APPROVED')
  ```

- [ ] **Step 2: Run test to verify failure**
  Run: `python manage.py test communities`
  Expected: FAIL with "No module named 'communities'"

- [ ] **Step 3: Register 'communities' in `config/settings.py` and write models**
  File: `communities/apps.py`
  ```python
  from django.apps import AppConfig

  class CommunitiesConfig(AppConfig):
      default_auto_field = 'django.db.models.BigAutoField'
      name = 'communities'
  ```

  File: `communities/models.py`
  ```python
  import uuid
  from django.db import models
  from django.contrib.auth.models import User
  from django.utils.text import slugify

  class Community(models.Model):
      PRIVACY_CHOICES = (
          ('PUBLIC', 'Public'),
          ('PRIVATE', 'Private'),
      )
      id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
      name = models.CharField(max_length=100)
      slug = models.SlugField(max_length=120, unique=True, blank=True)
      description = models.TextField(blank=True)
      rules = models.TextField(blank=True, help_text="Community values and rules charter")
      privacy = models.CharField(max_length=10, choices=PRIVACY_CHOICES, default='PUBLIC')
      avatar = models.ImageField(upload_to='communities/avatars/', blank=True, null=True)
      banner = models.ImageField(upload_to='communities/banners/', blank=True, null=True)
      creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_communities')
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          verbose_name_plural = 'Communities'
          ordering = ['-created_at']

      def save(self, *args, **kwargs):
          if not self.slug:
              base_slug = slugify(self.name)
              slug = base_slug
              counter = 1
              while Community.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                  slug = f"{base_slug}-{counter}"
                  counter += 1
              self.slug = slug
          super().save(*args, **kwargs)

      def __str__(self):
          return self.name

  class CommunityMembership(models.Model):
      ROLE_CHOICES = (
          ('ADMIN', 'Admin'),
          ('MODERATOR', 'Moderator'),
          ('MEMBER', 'Member'),
      )
      STATUS_CHOICES = (
          ('APPROVED', 'Approved'),
          ('PENDING', 'Pending Request'),
          ('REJECTED', 'Rejected'),
          ('BANNED', 'Banned'),
      )
      community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='memberships')
      user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='community_memberships')
      role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='MEMBER')
      status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='APPROVED')
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          unique_together = ('community', 'user')

      def __str__(self):
          return f"{self.user.username} in {self.community.name} ({self.status})"
  ```

- [ ] **Step 4: Run migrations and execute tests**
  Run:
  ```bash
  python manage.py makemigrations communities
  python manage.py migrate
  python manage.py test communities.tests.test_models
  ```
  Expected: PASS

- [ ] **Step 5: Register models in admin**
  File: `communities/admin.py`
  ```python
  from django.contrib import admin
  from .models import Community, CommunityMembership

  @admin.register(Community)
  class CommunityAdmin(admin.ModelAdmin):
      list_display = ('name', 'privacy', 'creator', 'created_at')
      search_fields = ('name', 'description')
      prepopulated_fields = {'slug': ('name',)}

  @admin.register(CommunityMembership)
  class CommunityMembershipAdmin(admin.ModelAdmin):
      list_display = ('user', 'community', 'role', 'status', 'created_at')
      list_filter = ('role', 'status')
  ```

- [ ] **Step 6: Commit Task 2**
  ```bash
  git add communities config/settings.py
  git commit -m "feat(communities): add Community and CommunityMembership models with test suite"
  ```

---

### Task 3: Access Control & Join Requests Lifecycle

**Files:**
- Create: `communities/utils.py` (Tenant scoping helper functions)
- Create: `communities/views.py` (Explore, Community detail, Request to Join, Admin member approval queue)
- Create: `communities/urls.py`
- Create: `communities/tests/test_access_control.py`
- Modify: `config/urls.py` (Include `communities.urls`)

**Interfaces:**
- Consumes: `Community`, `CommunityMembership`
- Produces:
  - `user_can_access_community(user, community) -> bool`
  - Views: `community_explore`, `community_detail`, `request_join`, `approve_member`, `reject_member`

- [ ] **Step 1: Write access control tests**
  File: `communities/tests/test_access_control.py`
  ```python
  from django.test import TestCase, Client
  from django.contrib.auth.models import User
  from communities.models import Community, CommunityMembership
  from communities.utils import user_can_access_community

  class CommunityAccessControlTest(TestCase):
      def setUp(self):
          self.client = Client()
          self.owner = User.objects.create_user('owner', password='password123')
          self.member = User.objects.create_user('member', password='password123')
          self.outsider = User.objects.create_user('outsider', password='password123')

          self.public_comm = Community.objects.create(name='Open Park', privacy='PUBLIC', creator=self.owner)
          self.private_comm = Community.objects.create(name='Secret Vault', privacy='PRIVATE', creator=self.owner)

          CommunityMembership.objects.create(community=self.private_comm, user=self.owner, role='ADMIN', status='APPROVED')
          CommunityMembership.objects.create(community=self.private_comm, user=self.member, role='MEMBER', status='APPROVED')

      def test_public_community_accessible_by_all(self):
          self.assertTrue(user_can_access_community(self.outsider, self.public_comm))

      def test_private_community_accessible_only_by_approved_members(self):
          self.assertTrue(user_can_access_community(self.member, self.private_comm))
          self.assertFalse(user_can_access_community(self.outsider, self.private_comm))

      def test_pending_join_request_does_not_grant_access(self):
          CommunityMembership.objects.create(community=self.private_comm, user=self.outsider, status='PENDING')
          self.assertFalse(user_can_access_community(self.outsider, self.private_comm))
  ```

- [ ] **Step 2: Run test to verify failure**
  Run: `python manage.py test communities.tests.test_access_control`
  Expected: FAIL with "cannot import name 'user_can_access_community'"

- [ ] **Step 3: Implement `communities/utils.py`**
  ```python
  from .models import CommunityMembership

  def user_can_access_community(user, community):
      if community.privacy == 'PUBLIC':
          return True
      if not user.is_authenticated:
          return False
      return CommunityMembership.objects.filter(
          community=community,
          user=user,
          status='APPROVED'
      ).exists()

  def is_community_admin(user, community):
      if not user.is_authenticated:
          return False
      if user == community.creator:
          return True
      return CommunityMembership.objects.filter(
          community=community,
          user=user,
          role__in=['ADMIN', 'MODERATOR'],
          status='APPROVED'
      ).exists()
  ```

- [ ] **Step 4: Implement views and URLs for Join Requests**
  File: `communities/views.py`:
  - `explore_communities(request)`: lists public & searchable communities.
  - `community_detail(request, slug)`: checks `user_can_access_community`. If private & not member, renders gated landing with "Request to Join".
  - `request_to_join(request, slug)`: creates `CommunityMembership(status='PENDING')`.
  - `manage_members(request, slug)`: admin-only view to approve/reject pending requests.

- [ ] **Step 5: Run tests to verify pass**
  Run: `python manage.py test communities.tests.test_access_control`
  Expected: PASS

- [ ] **Step 6: Commit Task 3**
  ```bash
  git add communities config/urls.py
  git commit -m "feat(communities): implement access control utilities, join request lifecycle, and permissions"
  ```

---

### Task 4: Multi-Media Carousel Posts (`PostMedia` with Image & Video Support)

**Files:**
- Modify: `posts/models.py` (Add `community` FK, create `PostMedia` model, add `shared_from` FK)
- Create: `posts/tests/test_media_carousel.py`
- Modify: `posts/admin.py`

**Interfaces:**
- Consumes: `Community` (from `communities`), `User` (from `auth`)
- Produces: `Post`, `PostMedia(file, media_type, order)`, `Comment`, `Like`

- [ ] **Step 1: Write unit tests for PostMedia and Carousels**
  File: `posts/tests/test_media_carousel.py`
  ```python
  from django.test import TestCase
  from django.contrib.auth.models import User
  from communities.models import Community
  from posts.models import Post, PostMedia

  class PostMediaCarouselTest(TestCase):
      def setUp(self):
          self.user = User.objects.create_user('bob', password='password123')
          self.comm = Community.objects.create(name='Creators Hub', creator=self.user)

      def test_create_post_with_multiple_media_items(self):
          post = Post.objects.create(
              community=self.comm,
              author=self.user,
              content='Check out my project photos and demo clip!'
          )
          media1 = PostMedia.objects.create(post=post, media_type='IMAGE', order=0)
          media2 = PostMedia.objects.create(post=post, media_type='VIDEO', order=1)

          self.assertEqual(post.media_items.count(), 2)
          self.assertEqual(post.media_items.first().media_type, 'IMAGE')
          self.assertEqual(post.media_items.last().media_type, 'VIDEO')
  ```

- [ ] **Step 2: Run test to verify failure**
  Run: `python manage.py test posts.tests.test_media_carousel`
  Expected: FAIL

- [ ] **Step 3: Update `posts/models.py`**
  Add `PostMedia` model with ordering and type detection:
  ```python
  import uuid
  from django.db import models
  from django.contrib.auth.models import User
  from communities.models import Community

  class Post(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
      community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts')
      author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
      content = models.TextField(blank=True)
      tag = models.CharField(max_length=50, blank=True)
      shared_from = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='shares')
      created_at = models.DateTimeField(auto_now_add=True)
      updated_at = models.DateTimeField(auto_now=True)

      class Meta:
          ordering = ['-created_at']

      def __str__(self):
          return f"{self.author.username} in {self.community.name} ({self.created_at:%Y-%m-%d})"

  class PostMedia(models.Model):
      MEDIA_TYPES = (
          ('IMAGE', 'Image'),
          ('VIDEO', 'Video'),
      )
      post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='media_items')
      file = models.FileField(upload_to='posts/media/%Y/%m/')
      media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='IMAGE')
      order = models.PositiveIntegerField(default=0)
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          ordering = ['order', 'created_at']
  ```

- [ ] **Step 4: Run migrations and execute test**
  Run:
  ```bash
  python manage.py makemigrations posts
  python manage.py migrate
  python manage.py test posts.tests.test_media_carousel
  ```
  Expected: PASS

- [ ] **Step 5: Commit Task 4**
  ```bash
  git add posts/
  git commit -m "feat(posts): upgrade Post model and add PostMedia for multi-item carousels"
  ```

---

### Task 5: Feed Isolation & Admin Take-Down Views

**Files:**
- Create: `posts/services.py` (Feed query builder with strict isolation)
- Modify: `posts/views.py` (Home feed, community feed, take-down post action)
- Create: `posts/tests/test_feed_isolation.py`

**Interfaces:**
- Consumes: `CommunityMembership`, `Post`
- Produces:
  - `get_isolated_home_feed(user)`: Returns posts ONLY from approved communities.
  - `takedown_post(request, post_id)`: Creator or mod delete action.

- [ ] **Step 1: Write feed isolation test**
  File: `posts/tests/test_feed_isolation.py`
  ```python
  from django.test import TestCase
  from django.contrib.auth.models import User
  from communities.models import Community, CommunityMembership
  from posts.models import Post
  from posts.services import get_isolated_home_feed

  class FeedIsolationTest(TestCase):
      def setUp(self):
          self.user_a = User.objects.create_user('alice', password='password123')
          self.user_b = User.objects.create_user('bob', password='password123')

          self.comm_private = Community.objects.create(name='Private Tech', privacy='PRIVATE', creator=self.user_b)
          self.comm_public = Community.objects.create(name='Public Art', privacy='PUBLIC', creator=self.user_a)

          # Bob posts in his private community
          self.private_post = Post.objects.create(community=self.comm_private, author=self.user_b, content='Secret Data')
          # Alice posts in public community
          self.public_post = Post.objects.create(community=self.comm_public, author=self.user_a, content='Public Drawing')

      def test_outsider_cannot_see_private_posts_in_feed(self):
          # Alice has NOT joined Private Tech
          feed = get_isolated_home_feed(self.user_a)
          self.assertNotIn(self.private_post, feed)

      def test_approved_member_sees_community_posts(self):
          CommunityMembership.objects.create(community=self.comm_private, user=self.user_a, status='APPROVED')
          feed = get_isolated_home_feed(self.user_a)
          self.assertIn(self.private_post, feed)
  ```

- [ ] **Step 2: Run test to verify failure**
  Run: `python manage.py test posts.tests.test_feed_isolation`
  Expected: FAIL

- [ ] **Step 3: Implement `posts/services.py` and Admin Take-Down View**
  ```python
  from communities.models import CommunityMembership
  from posts.models import Post

  def get_isolated_home_feed(user):
      if not user.is_authenticated:
          return Post.objects.none()
      approved_comm_ids = CommunityMembership.objects.filter(
          user=user,
          status='APPROVED'
      ).values_list('community_id', flat=True)
      return Post.objects.filter(community_id__in=approved_comm_ids).select_related('author', 'community').prefetch_related('media_items', 'likes', 'comments').order_by('-created_at')
  ```

  In `posts/views.py`:
  ```python
  from django.shortcuts import get_object_or_404, redirect
  from django.contrib.auth.decorators import login_required
  from django.core.exceptions import PermissionDenied
  from communities.utils import is_community_admin
  from .models import Post

  @login_required
  def takedown_post(request, post_id):
      post = get_object_or_404(Post, id=post_id)
      if is_community_admin(request.user, post.community) or post.author == request.user:
          post.delete()
          return redirect('communities:detail', slug=post.community.slug)
      raise PermissionDenied("You do not have permission to remove this post.")
  ```

- [ ] **Step 4: Run test to verify pass**
  Run: `python manage.py test posts.tests.test_feed_isolation`
  Expected: PASS

- [ ] **Step 5: Commit Task 5**
  ```bash
  git add posts/
  git commit -m "feat(posts): add strict feed isolation service and community admin take-down action"
  ```

---

### Task 6: In-Community Discord-Style Channels (`CommunityChannel`, `ChannelMessage`)

**Files:**
- Create: `chat/__init__.py`
- Create: `chat/models.py`
- Create: `chat/apps.py`
- Create: `chat/views.py`
- Create: `chat/urls.py`
- Create: `chat/tests/test_channels.py`
- Modify: `config/settings.py` (Add `'chat'` to `INSTALLED_APPS`)
- Modify: `config/urls.py` (Add `chat.urls`)

**Interfaces:**
- Consumes: `Community`, `User`
- Produces: `CommunityChannel`, `ChannelMessage` with real-time/polling AJAX endpoints.

- [ ] **Step 1: Write channel message unit test**
  File: `chat/tests/test_channels.py`
  ```python
  from django.test import TestCase
  from django.contrib.auth.models import User
  from communities.models import Community, CommunityMembership
  from chat.models import CommunityChannel, ChannelMessage

  class CommunityChannelsTest(TestCase):
      def setUp(self):
          self.user = User.objects.create_user('chatter', password='password123')
          self.comm = Community.objects.create(name='Dev Hub', creator=self.user)
          CommunityMembership.objects.create(community=self.comm, user=self.user, status='APPROVED')

      def test_create_channel_and_send_message(self):
          channel = CommunityChannel.objects.create(community=self.comm, name='general', slug='general')
          msg = ChannelMessage.objects.create(channel=channel, sender=self.user, message='Hello world!')
          self.assertEqual(channel.messages.count(), 1)
          self.assertEqual(msg.message, 'Hello world!')
  ```

- [ ] **Step 2: Run test to verify failure**
  Run: `python manage.py test chat.tests.test_channels`
  Expected: FAIL

- [ ] **Step 3: Implement channel models in `chat/models.py`**
  ```python
  import uuid
  from django.db import models
  from django.contrib.auth.models import User
  from communities.models import Community

  class CommunityChannel(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
      community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='channels')
      name = models.CharField(max_length=50)
      slug = models.SlugField(max_length=60)
      topic = models.CharField(max_length=255, blank=True)
      is_announcement = models.BooleanField(default=False)
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          unique_together = ('community', 'slug')

      def __str__(self):
          return f"#{self.name} in {self.community.name}"

  class ChannelMessage(models.Model):
      channel = models.ForeignKey(CommunityChannel, on_delete=models.CASCADE, related_name='messages')
      sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channel_messages')
      message = models.TextField()
      attachment = models.FileField(upload_to='chat/attachments/', blank=True, null=True)
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          ordering = ['created_at']
  ```

- [ ] **Step 4: Run migrations and verify test pass**
  Run:
  ```bash
  python manage.py makemigrations chat
  python manage.py migrate
  python manage.py test chat.tests.test_channels
  ```
  Expected: PASS

- [ ] **Step 5: Commit Task 6**
  ```bash
  git add chat/ config/settings.py config/urls.py
  git commit -m "feat(chat): implement in-community Discord-style channels and channel messages"
  ```

---

### Task 7: Standalone 1-on-1 DMs & Personal Group Chats

**Files:**
- Modify: `chat/models.py` (Add `Conversation`, `ConversationParticipant`, `DirectMessage`)
- Create: `chat/tests/test_dms.py`
- Modify: `chat/views.py` (Inbox, Conversation thread, Create personal group chat)

**Interfaces:**
- Consumes: `User`
- Produces: `Conversation`, `ConversationParticipant`, `DirectMessage`

- [ ] **Step 1: Write test for standalone 1-on-1 DMs and Personal Groups**
  File: `chat/tests/test_dms.py`
  ```python
  from django.test import TestCase
  from django.contrib.auth.models import User
  from chat.models import Conversation, ConversationParticipant, DirectMessage

  class DirectMessagingTest(TestCase):
      def setUp(self):
          self.alice = User.objects.create_user('alice', password='password123')
          self.bob = User.objects.create_user('bob', password='password123')
          self.charlie = User.objects.create_user('charlie', password='password123')

      def test_create_personal_group_chat(self):
          conv = Conversation.objects.create(is_group=True, title='Weekend Hackers')
          ConversationParticipant.objects.create(conversation=conv, user=self.alice, is_admin=True)
          ConversationParticipant.objects.create(conversation=conv, user=self.bob)
          ConversationParticipant.objects.create(conversation=conv, user=self.charlie)

          DirectMessage.objects.create(conversation=conv, sender=self.alice, message='Welcome to our personal group!')
          self.assertEqual(conv.participants.count(), 3)
          self.assertEqual(conv.messages.count(), 1)
  ```

- [ ] **Step 2: Run test to verify failure**
  Run: `python manage.py test chat.tests.test_dms`
  Expected: FAIL

- [ ] **Step 3: Implement DM and Conversation models in `chat/models.py`**
  ```python
  class Conversation(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
      is_group = models.BooleanField(default=False)
      title = models.CharField(max_length=100, blank=True)
      avatar = models.ImageField(upload_to='conversations/avatars/', blank=True, null=True)
      created_at = models.DateTimeField(auto_now_add=True)

  class ConversationParticipant(models.Model):
      conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
      user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
      is_admin = models.BooleanField(default=False)
      joined_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          unique_together = ('conversation', 'user')

  class DirectMessage(models.Model):
      conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
      sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_direct_messages')
      message = models.TextField()
      attachment = models.FileField(upload_to='dms/attachments/', blank=True, null=True)
      created_at = models.DateTimeField(auto_now_add=True)

      class Meta:
          ordering = ['created_at']
  ```

- [ ] **Step 4: Run migrations and verify tests pass**
  Run:
  ```bash
  python manage.py makemigrations chat
  python manage.py migrate
  python manage.py test chat.tests.test_dms
  ```
  Expected: PASS

- [ ] **Step 5: Commit Task 7**
  ```bash
  git add chat/
  git commit -m "feat(chat): add standalone 1-on-1 DMs and personal group chats"
  ```

---

### Task 8: Frontend Shell with Accordion Sidebar & Custom Video Carousel

**Files:**
- Create: `templates/base_app.html`
- Create: `templates/components/carousel.html`
- Create: `templates/components/accordion_sidebar.html`
- Create: `static/css/sanctuary_layout.css`
- Create: `static/js/carousel_player.js`
- Create: `static/js/accordion_sidebar.js`

**Interfaces:**
- Consumes: `Post.media_items`, `Community.channels`, `User.community_memberships`
- Produces:
  - Three-pane responsive layout with desktop hover-expand and mobile tap-toggle accordion sidebar.
  - Video player with tap-to-mute/pause overlay without browser chrome.

- [ ] **Step 1: Write `static/css/sanctuary_layout.css`**
  Setup responsive layout variables, primary rail, and accordion sidebar:
  ```css
  :root {
      --bg-canvas: #0f172a;
      --bg-surface: #1e293b;
      --bg-surface-hover: #334155;
      --border-subtle: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #6366f1;
      --rail-width: 68px;
      --accordion-width: 240px;
  }

  .app-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
  }

  .primary-rail {
      width: var(--rail-width);
      background: #090d16;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 0;
      gap: 12px;
      z-index: 50;
  }

  .secondary-accordion {
      width: 0;
      overflow: hidden;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 40;
  }

  /* Desktop hover expand */
  @media (hover: hover) {
      .primary-rail:hover + .secondary-accordion,
      .secondary-accordion:hover {
          width: var(--accordion-width);
      }
  }

  /* Mobile tap toggle */
  .secondary-accordion.is-open {
      width: var(--accordion-width) !important;
  }
  ```

- [ ] **Step 2: Write `static/js/carousel_player.js`**
  Provide custom tap-to-mute and tap-to-play/pause for video elements inside the carousel:
  ```javascript
  document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.carousel-video-container').forEach(container => {
          const video = container.querySelector('video');
          const muteBtn = container.querySelector('.mute-toggle');
          if (!video) return;

          container.addEventListener('click', (e) => {
              if (e.target.closest('.mute-toggle')) {
                  video.muted = !video.muted;
                  muteBtn.textContent = video.muted ? '🔇' : '🔊';
              } else {
                  if (video.paused) {
                      video.play();
                  } else {
                      video.pause();
                  }
              }
          });
      });
  });
  ```

- [ ] **Step 3: Write `static/js/accordion_sidebar.js`**
  Handle mobile touch events and drawer toggle buttons:
  ```javascript
  document.addEventListener('DOMContentLoaded', () => {
      const toggleBtn = document.getElementById('toggle-sidebar-btn');
      const accordion = document.querySelector('.secondary-accordion');
      if (toggleBtn && accordion) {
          toggleBtn.addEventListener('click', () => {
              accordion.classList.toggle('is-open');
          });
      }
  });
  ```

- [ ] **Step 4: Commit Task 8**
  ```bash
  git add static/ templates/
  git commit -m "feat(ui): implement three-pane layout with accordion sidebar and custom video carousel player"
  ```

---

### Task 9: Viva Defense Documentation & Presentation Package

**Files:**
- Create: `docs/VIVA_PRESENTATION_&_ARCHITECTURE_GUIDE.md`

**Interfaces:**
- Consumes: All project modules and architectural decisions
- Produces: 5-minute viva demo script, system architecture diagrams, and evaluator Q&A responses.

- [ ] **Step 1: Write `docs/VIVA_PRESENTATION_&_ARCHITECTURE_GUIDE.md`**
  Detail:
  - Architecture breakdown (MTV pattern with Tenant Scoping).
  - Security proofs against data cross-bleeding.
  - Docker deployment execution steps.
  - Top 10 viva exam questions and answers.

- [ ] **Step 2: Commit Task 9**
  ```bash
  git add docs/VIVA_PRESENTATION_&_ARCHITECTURE_GUIDE.md
  git commit -m "docs: add comprehensive Viva Defense and Architecture Guide"
  ```
