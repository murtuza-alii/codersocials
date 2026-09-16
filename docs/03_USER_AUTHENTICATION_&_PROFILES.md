# Chapter 2: User Authentication & Profiles Step-by-Step

In this chapter, you will build user sign-up, sign-in, logout, and the user profile page.

---

## 1. What are Django ModelForms?

Instead of manually checking `if request.POST['username'] == ''` in every view, Django provides **ModelForms**.
A `ModelForm` automatically:
1. Inspects your model fields and generates the matching HTML `<input>` tags.
2. Validates incoming data (e.g. checks if username is already taken, checks email format).
3. Saves clean data directly into the database.

---

## 2. Writing Forms (`accounts/forms.py`)

Open `accounts/forms.py` and write:

```python
from django import forms
from django.contrib.auth.models import User
from .models import Profile


class UserRegisterForm(forms.ModelForm):
    # Password fields with password masking widget
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Password'}))
    password_confirm = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': 'Confirm Password'}))

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': 'Username'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Email address'}),
        }

    # Custom validation: ensure both passwords match
    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get('password')
        password_confirm = cleaned_data.get('password_confirm')
        if password and password_confirm and password != password_confirm:
            self.add_error('password_confirm', "Passwords do not match!")
        return cleaned_data


class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['avatar', 'bio']
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 3, 'placeholder': 'Write your bio here...'}),
        }
```

---

## 3. Writing Views (`accounts/views.py`)

Open `accounts/views.py`. Here is how the business logic works:

```python
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from .models import Profile, Follow
from .forms import UserRegisterForm, ProfileUpdateForm


# 1. User Sign Up
def register_view(request):
    if request.user.is_authenticated:
        return redirect('feed')

    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            # CRITICAL: set_password hashes the password using PBKDF2
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, f"Welcome {user.username}! Your account has been created.")
            return redirect('login')
    else:
        form = UserRegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


# 2. User Sign In
def login_view(request):
    if request.user.is_authenticated:
        return redirect('feed')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)  # Starts session cookie
                return redirect('feed')
            else:
                messages.error(request, "Invalid username or password.")
        else:
            messages.error(request, "Invalid credentials.")
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/login.html', {'form': form})


# 3. User Sign Out
@login_required
def logout_view(request):
    logout(request)  # Clears session cookie
    messages.info(request, "You have been logged out.")
    return redirect('login')


# 4. User Profile Page
@login_required
def profile_view(request, username):
    # Fetch the user whose profile is being viewed
    target_user = get_object_or_404(User, username=username)
    user_posts = target_user.posts.all()

    # Check if the logged-in user is currently following this target user
    is_following = Follow.objects.filter(follower=request.user, following=target_user).exists()

    context = {
        'target_user': target_user,
        'profile': target_user.profile,
        'posts': user_posts,
        'is_following': is_following,
        'followers_count': target_user.followers_set.count(),
        'following_count': target_user.following_set.count(),
        'posts_count': user_posts.count(),
    }
    return render(request, 'accounts/profile.html', context)


# 5. Edit Profile (Avatar & Bio)
@login_required
def edit_profile_view(request):
    profile = request.user.profile
    if request.method == 'POST':
        # NOTE: request.FILES is required to handle uploaded image files!
        form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, "Your profile has been updated!")
            return redirect('profile', username=request.user.username)
    else:
        form = ProfileUpdateForm(instance=profile)
    return render(request, 'accounts/edit_profile.html', {'form': form})
```

---

## 4. Connecting URL Routes (`accounts/urls.py`)

Open `accounts/urls.py` and register the endpoints:

```python
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('edit-profile/', views.edit_profile_view, name='edit_profile'),
    path('profile/<str:username>/', views.profile_view, name='profile'),
]
```

And verify `config/urls.py` includes it:
```python
path('accounts/', include('accounts.urls')),
```

---

## 5. Next Step
Proceed to [Chapter 4: Posts, Media Uploads & Feed Algorithm](file:///e:/Networking%20Site/docs/04_POSTS_UPLOADS_&_FEED_ALGORITHM.md).

