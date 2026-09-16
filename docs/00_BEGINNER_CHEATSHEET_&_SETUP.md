# Chapter 0: Beginner's Mental Model & Setup Guide

Welcome! If you are new to web development and Django, this guide is written specifically for you. It explains every core concept in plain English with zero confusing jargon.

---

## 1. The Core Mental Model: How Django Works

Think of Django as a well-organized restaurant:

```
[ Customer ]  ── (1) Enters URL ─────────────────────►  [ Receptionist / Host ]
  (Browser)                                                (urls.py)
                                                               │
                                                               │ (2) Hands ticket
                                                               ▼
[ Table / Plate ] ◄── (4) Plates the food ──  [ Chef / Kitchen Manager ]
 (Template HTML)                                       (views.py)
                                                               ▲
                                                               │ (3) Grabs ingredients
                                                               ▼
                                                      [ Pantry / Freezer ]
                                                         (models.py & DB)
```

1. **The Browser (Customer)** requests a web page (e.g., `http://127.0.0.1:8000/feed/`).
2. **`urls.py` (The Receptionist)** checks the address: *"Ah, `/feed/` belongs to the `feed_view`!"* and forwards the request.
3. **`views.py` (The Chef)** decides what to do: *"I need to fetch recent photos from the database!"*
4. **`models.py` (The Pantry/Database)** returns the requested posts to the view.
5. **`templates/*.html` (The Plate)** takes the data, formats it into clean HTML/CSS, and sends it back to the customer's browser.

This structure is called **MTV (Model - Template - View)**.

---

## 2. Django Project vs. Django App (What is the difference?)

Beginners often confuse these two:
- **Project (`config/`)**: The entire website container (like an entire shopping mall). It holds global settings (`settings.py`) and top-level routing (`urls.py`).
- **App (`accounts/`, `posts/`)**: A self-contained department or module inside the mall (like a clothing store or a food court).
  - `accounts`: Handles users, passwords, avatars, and following friends.
  - `posts`: Handles uploading photos, comments, likes, and timelines.

Keeping features separated into distinct apps makes your project clean, modular, and easy to explain.

---

## 3. Essential Terminal Commands (Cheat Sheet)

You will use these commands repeatedly. Always make sure your virtual environment is active!

### A. Activate Your Virtual Environment
```powershell
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
```
*(You will see `(venv)` appear at the start of your terminal prompt).*

### B. Starting the Local Server
```bash
python manage.py runserver
```
Visit `http://127.0.0.1:8000/` in your web browser. Press `Ctrl + C` in the terminal to stop the server.

### C. Making Database Changes (The 2-Step Dance)
Whenever you create or change a model in `models.py`, run:
```bash
# Step 1: Create the blueprint of changes
python manage.py makemigrations

# Step 2: Apply the blueprint to the actual database file
python manage.py migrate
```

### D. Creating an Admin Account
```bash
python manage.py createsuperuser
```
Follow the prompts (choose a username, email, and password). Then visit `http://127.0.0.1:8000/admin/` to log into the administrative control panel!

### E. Checking for Syntax & Configuration Errors
```bash
python manage.py check
```
If you make a typo in any setting or model, this command will immediately pinpoint the exact file and line number.

---

## 4. Next Step
Now proceed to [Chapter 1: System Architecture & Design](file:///e:/Networking%20Site/docs/01_SYSTEM_ARCHITECTURE.md).

