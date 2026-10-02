# Sanctuary OS — Architecture Audit & System Inventory

**Application**: Sanctuary OS (SocialConnect)  
**Host**: `127.0.0.1:8000` (Django API) / `127.0.0.1:5173` (Vite + React Frontend)  
**Date**: September 28, 2026  
**Phase**: Phase 0 — Project Setup & System Audit  

---

## 1. Executive Summary & Migration Mandate

Sanctuary OS is being migrated from a Django-rendered template frontend to a modern **React (Vite) Single Page Application (SPA)** while **strictly preserving the existing Django backend, database schema, ORM models, business logic, and security guarantees**. 

### Node / Toolchain Boundary
* **Node.js** (`v24.19.0`) and **Vite** (`v8.3.0`) are utilized **strictly for the client-side toolchain, dev server, and production bundle pipeline**.
* No Node.js backend server or BFF (Backend-for-Frontend) is introduced. The backend remains 100% Python/Django.
* All data flows directly between the React client and Django endpoints using session cookies (`csrftoken`, `sessionid`) and JSON/FormData payloads.

### UI Revamp Mandate
The existing UI suffers from common AI-generated sloppy design traits:
1. **Meaningless jargon copy**: Phrases like *"QUANTUM STREAM RELAY"*, *"SECURE TRANSMISSION STREAM"*, *"Inspect Matrix"*, *"QUANTUM BLOBS ACTIVATED"*, and *"Sanctuary Mesh Protocol v2.4"* will be replaced with crisp, specific product labels.
2. **"//" Eyebrow overuse**: The `//` prefix will be restricted to at most once or twice in the entire application (e.g. system status HUD), not plastered across every card and header.
3. **Rounded cards and soft gray fills**: Pill-shaped cards and gray surfaces (`#1a1e29`) are eliminated in favor of pure black (`#000000`) and near-black surfaces (`#050505`), delineated by 1px dim neon borders.
4. **Soft blurry glows**: Blurry radial shadows are replaced by high-contrast 1px bright edges and mechanical hard offset shadows (`2px 2px 0px ...`).
5. **Uniform circular icons**: Replaced by sharp, chamfered tiles or borderless geometric iconography using `@phosphor-icons/react`.
6. **Test-pattern placeholder video**: Replaced with clean media players featuring authentic poster frames and real video controls.
7. **Horizontal overflow bug**: Eliminated by establishing strict flexbox/grid minimum sizing (`min-width: 0`), Discord-density column containers, and global `overflow-x: hidden`.

---

## 2. Route & View Inventory (Preserved Endpoints)

Every existing route and view in the Django backend is cataloged below and must be completely supported and accessible in the React client.

### A. Authentication & User Profile (`accounts`)

| URL Pattern | Route Name | HTTP Method | Django View | Purpose & Data Contract |
|---|---|---|---|---|
| `/accounts/login/` | `login` | `GET`, `POST` | `accounts.views.login_view` | Authenticates user with username & password; sets `sessionid`. |
| `/accounts/register/` | `register` | `GET`, `POST` | `accounts.views.register_view` | Creates new user with username, email, password, and profile. |
| `/accounts/logout/` | `logout` | `POST` / `GET` | `accounts.views.logout_view` | Destroys current user session. |
| `/accounts/profile/<username>/` | `profile` | `GET` | `accounts.views.profile_view` | User profile details: bio, avatar, post count, followers count, following count, post grid. |
| `/accounts/edit-profile/` | `edit_profile` | `GET`, `POST` | `accounts.views.edit_profile_view` | Updates user avatar image (`multipart/form-data`) and bio text. |
| `/accounts/follow/<username>/` | `follow_toggle` | `POST` | `accounts.views.follow_toggle_view` | Toggles follower relationship between active user and target user. |

### B. Posts, Feed & Content Stream (`posts`)

| URL Pattern | Route Name | HTTP Method | Django View | Purpose & Data Contract |
|---|---|---|---|---|
| `/` | `feed` | `GET` | `posts.views.feed_view` | Chronological feed isolated to posts from approved communities + public communities. Returns posts, likes status, and user communities. |
| `/explore/` | `explore` | `GET` | `posts.views.explore_view` | Global explore grid displaying public posts and posts from user's accessible spaces. |
| `/create/` | `create_post` | `GET`, `POST` | `posts.views.create_post_view` | Creates new post with caption, target community, and single/multiple media uploads (images/videos). Processes video with FFmpeg and images with Pillow. |
| `/post/<int:pk>/` | `post_detail` | `GET`, `POST` | `posts.views.post_detail_view` | Single post view: full media items, comments list, comment submission, takedown capability check. |
| `/post/<int:pk>/like/` | `like_toggle` | `POST` | `posts.views.like_toggle_view` | Toggles like status on a post for the authenticated user. |
| `/post/<int:pk>/comment/` | `add_comment` | `POST` | `posts.views.add_comment_view` | Submits a quick comment from the feed or post card. |
| `/post/<int:pk>/takedown/` | `takedown_post` | `POST` | `posts.views.takedown_post_view` | Removes/deletes a post; permitted only for post author or community admin. |
| `/post/<int:pk>/share/` | `share_post` | `POST` | `posts.views.share_post_view` | Re-shares / quotes an accessible post into an approved target community with a note. |

### C. Communities & Spaces (`communities`)

| URL Pattern | Route Name | HTTP Method | Django View | Purpose & Data Contract |
|---|---|---|---|---|
| `/communities/` & `/communities/explore/` | `communities:explore` | `GET` | `communities.views.explore_communities` | Hub listing all communities with search query `?q=`, privacy badge (`PUBLIC`/`PRIVATE`), member count, and join/pending state. |
| `/communities/create/` | `communities:create` | `GET`, `POST` | `communities.views.create_community` | Creates new space with name, description, rules, privacy, avatar, banner. Assigns creator as `ADMIN`. |
| `/communities/c/<slug>/` | `communities:detail` | `GET` | `communities.views.community_detail` | Community space detail: banner, description, channel list, posts stream, admin actions. Renders gated view if user has no access. |
| `/communities/c/<slug>/join/` | `communities:join` | `POST` | `communities.views.request_to_join` | Requests to join space: immediate approval for `PUBLIC`, creates `PENDING` request for `PRIVATE`. |
| `/communities/c/<slug>/leave/` | `communities:leave` | `POST` | `communities.views.leave_community` | Leaves a community membership (blocked for creator). |
| `/communities/c/<slug>/manage/` | `communities:manage_members` | `GET` | `communities.views.manage_members` | Admin dashboard: review pending join requests, manage approved member roles. |
| `/communities/c/<slug>/approve/<int:membership_id>/` | `communities:approve_request` | `POST` | `communities.views.approve_request` | Approves pending community join request. |
| `/communities/c/<slug>/reject/<int:membership_id>/` | `communities:reject_request` | `POST` | `communities.views.reject_request` | Declines/deletes pending community join request. |

### D. Real-Time Chat & Direct Messaging (`chat`)

| URL Pattern | Route Name | HTTP Method | Django View | Purpose & Data Contract |
|---|---|---|---|---|
| `/chat/inbox/` | `chat:inbox` | `GET` | `chat.views.inbox_view` | List of all 1-on-1 conversations and group chats for current user, sorted by recency. |
| `/chat/dm/<username>/` | `chat:start_dm` | `POST` / `GET` | `chat.views.start_dm_view` | Finds or initiates a direct message thread with specified user. |
| `/chat/t/<uuid:conversation_id>/` | `chat:conversation_detail` | `GET`, `POST` | `chat.views.conversation_detail_view` | Messaging view for a DM or group chat: message history, file attachments, AJAX send endpoint. |
| `/chat/new-group/` | `chat:create_group` | `GET`, `POST` | `chat.views.create_group_chat_view` | Creates a multi-user personal group chat with title and selected member list. |
| `/chat/c/<slug:community_slug>/new-channel/` | `chat:create_channel` | `GET`, `POST` | `chat.views.create_channel_view` | Creates a new text or announcement channel in a community. Admin only. |
| `/chat/c/<slug:community_slug>/<slug:channel_slug>/` | `chat:channel_chat` | `GET`, `POST` | `chat.views.channel_chat_view` | Community channel chat room: message stream, announcement posting permissions, file attachments, AJAX send support. |

---

## 3. UI Component Inventory & Architecture

The React frontend replaces all Django templates with modular, reusable components adhering to the sharp cyberpunk design language and GSAP motion standards.

### Core Layout & Foundation
1. **`tokens.css`** (Phase 2):
   * CSS custom properties defining the color palette (true black `#000000`, surface off-black `#050505`, acid cyan `#00F0FF`, hot magenta `#FF0055`, warning amber `#FFB800`, border dim cyan `rgba(0, 240, 255, 0.18)`), hard offset shadow tokens, monospace and angular display font definitions.
2. **`motion.js`** (Phase 3):
   * Centralized GSAP motion library: standard easings (`expo.out`, `power4.out`, `power2.in`), micro-durations (120ms - 240ms), spring setups, `quickTo` coordinate tracking utilities, and `prefers-reduced-motion` detection.
3. **`AsciiCursor.jsx`** (Phase 4):
   * Signature canvas effect: full-screen fixed `<canvas>` with `pointer-events: none`.
   * Draws a dense, proximity-fading particle cloud of shifting ASCII glyphs around the cursor in a single `requestAnimationFrame` loop.
   * Auto-disabled on touch devices (`(pointer: coarse)`) and for reduced-motion settings.
4. **`Button.jsx`** (Phase 5):
   * Sharp geometric buttons with 0px border-radius or chamfered clip-path corners (`polygon(...)`).
   * 1px neon border on pure black background.
   * Hover: Inverts to solid neon fill with pure black text.
   * Active: Mechanical 2px offset shift with tacky hard shadow (`box-shadow: 2px 2px 0px ...`).
   * Variants: `primary` (cyan), `accent` (magenta), `warning` (amber), `ghost` (dim border).
5. **`BlobFlipCard.jsx`** (Phase 6):
   * Interactive card with 3D flip on hover.
   * Front face: Structured metadata and actionable badges.
   * Back face: Fluid SVG / layered radial gradient blobs in acid cyan and hot magenta that morph and pulsate on hover, replacing flat stock image pop-ins.
6. **`Popup.jsx`** (Phase 7):
   * Unified component for Modals, Dropdowns, Context Menus, and Tooltips.
   * Motion: Entrance via GSAP timeline (fast scale from `0.96`, opacity, clip-path reveal with `expo.out`) and rapid exit (`power2.in`).
   * Clean portal rendering into `#modal-root`.
7. **`AppShell.jsx`** (Phase 8):
   * 4-tier Discord-inspired information architecture:
     * **Primary Rail (64px)**: Sanctuary brand icon, joined spaces avatars with active pill indicators, Create Space (+), Discover Spaces (compass), Direct Messages, and Profile/Settings.
     * **Channel / Sub-Nav Column (240px)**: Community channels list (`#announcements`, `#general`), DM conversation threads, or space categories.
     * **Header / Top Bar (52px)**: Current channel / space name, status indicator, action buttons, search shortcut.
     * **Main Content Stage**: Central feed or chat view with strict `overflow-x: hidden` and `min-width: 0` to permanently eliminate the horizontal overflow bug.

### Content & Interactive Components
8. **`Feed.jsx` & Post Cards** (Phase 9):
   * Real post cards with sharp borders and brightness-contrast hover states.
   * Integrated Multi-Media Carousel (Instagram/Cyber player):
     * Video player with custom play/pause indicators, volume mute toggles, and legitimate poster frames (eliminating the synthetic test pattern).
     * Image gallery with pagination indicators and slide controls.
   * Real-time like counter, comment count, share modal trigger, takedown confirmation modal.
   * Inline fast-comment input with keyboard shortcut support.
9. **Page Modules (Subsequent Phases)**:
   * `PostDetail.jsx` (Threaded discussion, media viewer, admin moderation).
   * `CreatePost.jsx` (Rich upload form, multi-file drop zone, tag selector).
   * `DiscoverSpaces.jsx` (Community search, blob flip preview cards, instant join).
   * `CommunityDetail.jsx` (Banner, member roster, channel switch, space feed).
   * `GatedLanding.jsx` (Private space lockdown landing with request-to-join trigger).
   * `ManageMembers.jsx` (Admin panel for pending requests and role adjustments).
   * `ChannelChat.jsx` & `DirectMessages.jsx` (High-density message stream, file attachments, announcement restrictions).
   * `Profile.jsx` & `EditProfile.jsx` (User stats, bio editor, avatar uploader, posts grid).
   * `AuthLogin.jsx` & `AuthRegister.jsx` (High-contrast, sharp authentication forms).

---

## 4. API Integration & Data Flow Contract

To preserve the backend without rewriting models or business logic:
* The React app proxies requests to Django at `http://127.0.0.1:8000` via `vite.config.js`.
* Django views handle authentication via standard session cookies (`credentials: "same-origin"` or `include`).
* JSON-enabled views:
  * For views that currently return HTML or redirects, we provide JSON serializing endpoints or content negotiation headers (`Accept: application/json` or dedicated `/api/` routing wrappers) that call the exact same ORM queries and service functions (`get_isolated_home_feed`, `user_can_access_community`, etc.).
  * Media files (`/media/*`) and static uploads are served directly from Django's media pipeline.

---

## 5. Phase 0 Verification Checklist

- [x] Node.js and Vite scaffolded in `frontend/`.
- [x] Installed production dependencies: `react`, `react-dom`, `gsap`, `@gsap/react`, `@phosphor-icons/react`.
- [x] All 20+ Django routes, views, and data contracts cataloged.
- [x] Specific sloppy AI design issues identified with concrete engineering remedies.
- [x] Exact phase deliverables defined (Phases 1 through 9+).
