# Community Sanctuary Platform: Viva Defense & Architecture Guide

This document prepares you to defend and present the **Community Sanctuary Platform** in front of college project evaluators, external viva examiners, and technical interviewers.

---

## 1. The 2-Minute Elevator Pitch

> *"Most college social media projects are basic clones of Instagram or Twitter that do simple CRUD operations on a single flat database table.
>
> Our platform addresses the real-world problems of social media fatigue, public scrutiny, and campus misinformation by building **Multi-Tenant Digital Sanctuaries**.
>
> It combines three industry-proven paradigms:
> 1. **Instagram's visual polish:** Multi-media carousels combining photos and auto-formatted videos with a custom touch-first player without browser chrome.
> 2. **Discord's community hubs:** Walled spaces with topic channels (`#announcements`, `#general`, `#dev-chat`), community rules charters, and member join approvals.
> 3. **WhatsApp's standalone independence:** Direct 1-on-1 messaging by username and personal friend group chats completely separate from any community server.
>
> Crucially, our backend enforces **strict ORM query-level tenant isolation**, guaranteeing that confidential discussions or files within private communities can never bleed or criss-cross into other communities or the public web."*

---

## 2. Technical System Architecture

```
                       [ Client Browser / Mobile Web ]
                                      │
                                      ▼
                        [ Reverse Proxy / Nginx ]
                                      │
                         (Port 8000 / HTTP / WS)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               Django 6.1 Application Core                   │
       │                                                             │
       │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
       │  │    accounts    │ │  communities   │ │     posts      │  │
       │  │ (Auth/Profiles)│ │ (Spaces/Roles) │ │ (Carousels/Mod)│  │
       │  └────────────────┘ └────────────────┘ └────────────────┘  │
       │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │
       │  │      chat      │ │ Tenant Security│ │ Media Pipeline │  │
       │  │  (DMs/Channels)│ │ Scoping Mixin  │ │ (Pillow/FFmpeg)│  │
       │  └────────────────┘ └────────────────┘ └────────────────┘  │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   Persistent Docker Volumes                 │
       │   • SQLite / PostgreSQL Database Engine                     │
       │   • Media Storage: Uploaded Photos, Videos & Thumbnails     │
       └─────────────────────────────────────────────────────────────┘
```

---

## 3. Key Architectural Innovations & Defense Points

### Innovation 1: Strict Multi-Tenant Data Isolation (Zero Criss-Crossing)
* **The Problem:** In multi-tenant systems, naive views like `Post.objects.all()` leak private company/college data.
* **The Solution:** We implemented the `get_isolated_home_feed(user)` service and `user_can_access_community(user, community)` security layer:
  - Private communities require a verified `CommunityMembership` record with `status='APPROVED'`.
  - Non-members hitting private URLs or attempting direct ID enumeration receive `403 Forbidden` or are routed to the gated landing page.
  - Queries are explicitly scoped to `community_id__in=approved_communities`.

### Innovation 2: Custom In-Feed Multi-Media Carousel Player
* **The Problem:** Default HTML5 `<video controls>` are clunky, display browser chrome, and clash with Instagram-like feeds.
* **The Solution:** A unified `PostMedia` model supporting ordered lists of photos and videos:
  - Custom JavaScript `carousel_player.js` with swipe support and dot indicators (`• • •`).
  - Videos are muted by default for browser compliance, with a floating tap-to-mute pill.
  - Single tap toggles play/pause with an animated pulsing indicator.
  - An `IntersectionObserver` automatically pauses video playback when scrolled out of view.

### Innovation 3: Dual Communication Engines
* **Engine A: In-Community Channels (Discord-Style):**
  - Topic-based channels (`#announcements`, `#general`, `#study-group`).
  - Announcement channels enforce `is_announcement=True`, restricting broadcasting to community administrators.
* **Engine B: Standalone DMs & Personal Groups (WhatsApp-Style):**
  - Independent `Conversation` and `ConversationParticipant` models.
  - Search any user by username to start an instant 1-on-1 thread or create a custom friend group chat unlinked from any community server.

### Innovation 4: Three-Pane Shell with Hover/Tap Accordion Drawer
* **Primary Icon Rail (68px):** Instant jump between joined community servers, Home, Explore, and DMs.
* **Secondary Sidebar (Accordion):**
  - Expands smoothly on mouse hover on desktop via CSS transitions.
  - Toggles on mobile via drawer touch button.
  - Shows community channels, rules charter, and member lists.

---

## 4. Top 10 Viva Questions & Winning Answers

### Q1: What design pattern does Django follow?
**Answer:** Django follows the **MTV (Model-Template-View)** pattern, which is a variant of MVC:
* **Model:** Handles data structure, relationships, and queries (`Community`, `Post`, `PostMedia`, `ChatMessage`).
* **Template:** Handles presentation and UI rendering (`base.html`, `detail.html`, `carousel.html`).
* **View:** Implements business logic, tenant scoping, and HTTP request/response processing (`views.py`).

### Q2: How did you ensure data doesn't leak between different college/company communities?
**Answer:** We enforce data scoping at both the ORM level and view decorators. For any private community, our `user_can_access_community` utility verifies that `CommunityMembership(user=request.user, community=comm, status='APPROVED')` exists. In feed aggregation, `get_isolated_home_feed` filters strictly on approved community IDs, preventing horizontal privilege escalation.

### Q3: Why didn't you just create a separate database for each community?
**Answer:** A single shared database with logical multi-tenancy (tenant-scoped foreign keys and UUIDs) provides the ideal balance:
1. It allows users to belong to multiple communities seamlessly with a single login.
2. It supports global discovery directories and cross-community direct messaging.
3. It uses a fraction of the memory and operational overhead compared to running hundreds of isolated PostgreSQL database instances.

### Q4: How is video processing handled when users upload clips?
**Answer:** When a video is uploaded, our processing pipeline invokes **FFmpeg** in a subprocess. It transcodes the video to standard H.264/AAC MP4 format for universal browser compatibility and automatically extracts an image frame as the poster thumbnail.

### Q5: How does your custom video player differ from default HTML5 controls?
**Answer:** Standard `<video controls>` show browser-specific timelines, fullscreen buttons, and volume sliders that look inconsistent and break feed aesthetics. Our custom player eliminates browser controls, enables tap-to-mute, tap-to-play/pause with a visual feedback ripple, and uses an `IntersectionObserver` to save device resources by pausing off-screen videos.

### Q6: How do users join private communities?
**Answer:** When visiting a private community, non-members see a gated overview with community rules and a *"Request Access"* button. Submitting creates a `CommunityMembership` with `status='PENDING'`. Community creators/admins receive these in their *"Manage Members"* queue to approve or decline with a single click.

### Q7: How does organic fact-checking work in your system?
**Answer:** Rather than relying on rigid top-down censorship, members organically discuss and challenge claims in comment threads and channel chats. Community admins also have one-click take-down permissions on any post within their space to eliminate harmful hoaxes or spam.

### Q8: How are standalone DMs separated from community channels?
**Answer:** They use completely separate relational models:
* Community channels use `CommunityChannel` and `ChannelMessage` tied to a `Community`.
* Direct messages use `Conversation` and `ConversationParticipant`, allowing arbitrary groups of friends or 1-on-1 pairs to chat without needing a parent community.

### Q9: Why is Docker beneficial for this project?
**Answer:** Docker containerizes the Python runtime, system dependencies (like `ffmpeg` and `libpq`), and persistent volumes. Using `docker compose up --build` ensures that any evaluator can run the application immediately with zero environment configuration bugs.

### Q10: What security measures protect user authentication?
**Answer:** We leverage Django's built-in security features:
* Passwords hashed using **PBKDF2 with SHA-256** iterations.
* **CSRF protection** tokens on all POST requests.
* **SQL Injection prevention** via Django's parameterized ORM queries.
* **XSS protection** via automated HTML escaping in the template engine.

---

## 5. 5-Minute Practical Demo Script

1. **Step 1: The Overview (1 min):**
   * Open `http://127.0.0.1:8000/`.
   * Log in as `alex_dev` (password: `password123`).
   * Show the primary rail (left icon bar) and hover over it to demonstrate the accordion sidebar expanding smoothly!
2. **Step 2: Community Spaces & Channels (1.5 min):**
   * Click on **"Campus Code Sanctuary"**.
   * Show the community header, member count, rules charter, and channels (`#announcements`, `#general`, `#dev-chat`).
   * Click on `#general` to show the peer discussion and organic debunking of rumors.
3. **Step 3: Multi-Media Carousel Player (1 min):**
   * Return to the community feed.
   * Show the carousel post: click the right chevron or swipe to navigate between slides.
   * Tap the video slide to demonstrate smooth custom play/pause and the bottom-right tap-to-mute pill!
4. **Step 4: Data Isolation & Private Join Requests (1 min):**
   * Open an incognito browser window or log in as `code_ninja`.
   * Visit `/communities/` and click on **"Silicon Tech Vault"** (Private).
   * Show the gated landing screen preventing unauthorized access.
   * Switch back to `sarah_creator` $\rightarrow$ open **"Manage Members"** $\rightarrow$ click **Approve** to demonstrate instant access granting.
5. **Step 5: Standalone Direct Messages & WhatsApp Group (30 sec):**
   * Click on the **Messages** icon on the primary rail.
   * Show the 1-on-1 DM thread and the personal group chat **"Weekend Hackers"**.
