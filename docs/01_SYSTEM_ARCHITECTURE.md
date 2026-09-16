# System Architecture & Design Principles

## 1. Executive Summary

This project is an Instagram-inspired social networking platform built with **Python** and **Django**. It enables users to create profiles, publish media posts, follow other users, view personalized feeds, and interact through likes and comments.

---

## 2. Why Django for a Social Media Network?

When justifying your framework choice to professors and examiners, highlight these key factors:

1. **Proven at Instagram Scale**:
   - Instagram was originally prototyped and built using Django and Python.
   - Instagram continues to run one of the largest Django deployments in existence today.
2. **Built-in Security Defaults**:
   - **Cross-Site Request Forgery (CSRF)**: Automatically protected using `{% csrf_token %}` tokens.
   - **SQL Injection**: Django's Object-Relational Mapper (ORM) automatically parameterizes all SQL queries.
   - **Password Security**: Stores passwords using PBKDF2 with SHA-256 password hashing by default.
   - **Cross-Site Scripting (XSS)**: Templates automatically escape unsafe HTML variables.
3. **Batteries-Included Tooling**:
   - Built-in `User` authentication system (sessions, login, logout, password validation).
   - Built-in administrative dashboard (`/admin`) for inspecting tables and moderating content.
   - Built-in file upload handling for avatars and multimedia posts.

---

## 3. The MTV (Model - Template - View) Architecture

Django implements a variant of MVC known as **MTV**:

```
                       ┌─────────────────────────────────────┐
                       │           HTTP Request              │
                       └──────────────────┬──────────────────┘
                                          │
                                          ▼
                                     urls.py
                               (URL Routing Engine)
                                          │
                                          ▼
                                     views.py
                              (Controller / Logic)
                                  ▲              │
                        Queries / │              │ Passes Context
                        Saves Data│              ▼
                                  ▼         templates/
                              models.py    (HTML Presentation)
                           (Database ORM)        │
                                                 ▼
                                           HTTP Response
```

### Component Roles:
- **Model (`models.py`)**: Defines your application data structure, constraints, and relationships. It acts as the single source of truth for your database schema.
- **Template (`templates/`)**: Handles presentation and user interface. Contains standard HTML plus Django Template Language (DTL) tags like `{% for %}`, `{% if %}`, and `{{ variable }}`.
- **View (`views.py`)**: Implements business logic. It handles incoming requests, queries the models via ORM, and renders the requested template with data context.
- **URL Dispatcher (`urls.py`)**: Maps incoming HTTP requests to the appropriate view function.

---

## 4. Modular App Structure

The codebase separates concerns into two standalone Django applications:

| App | Responsibility |
|---|---|
| **`accounts`** | User registration, authentication, user profiles, avatars, bios, and the follow/unfollow social graph. |
| **`posts`** | Photo uploads, captions, like/comment interactions, the explore grid, and the personalized chronological feed. |
| **`config`** | Global project settings (`settings.py`), routing hub (`urls.py`), and WSGI/ASGI entrypoints. |

---

## 5. Next Step
Proceed to [Chapter 2: Database Models Step-by-Step](file:///e:/Networking%20Site/docs/02_DATABASE_MODELS_STEP_BY_STEP.md).

