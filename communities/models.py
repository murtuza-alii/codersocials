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
            base_slug = slugify(self.name) or 'community'
            slug = base_slug
            counter = 1
            while Community.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.memberships.filter(status='APPROVED').count()


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
