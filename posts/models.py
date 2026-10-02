from django.db import models
from django.contrib.auth.models import User
from communities.models import Community


class Post(models.Model):
    MEDIA_TYPE_CHOICES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('none', 'Text Only'),
    )

    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES, default='image')
    media_file = models.FileField(upload_to='posts/%Y/%m/', blank=True, null=True)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/', blank=True, null=True)
    caption = models.TextField(blank=True, default='')
    tag = models.CharField(max_length=50, blank=True, default='', help_text="e.g. #news, #question, #rant")
    shared_from = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='shares')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        comm_name = self.community.name if self.community else "General"
        return f"{self.author.username} in {comm_name} ({self.created_at.strftime('%Y-%m-%d')})"

    @property
    def is_video(self):
        return self.media_type == 'video'

    @property
    def is_image(self):
        return self.media_type == 'image'

    @property
    def total_likes(self):
        return self.likes.count()

    @property
    def total_comments(self):
        return self.comments.count()

    @property
    def has_carousel(self):
        return self.media_items.count() > 1

    @property
    def all_media(self):
        items = list(self.media_items.all())
        if not items and self.media_file:
            return [{'file': self.media_file, 'media_type': self.media_type, 'is_video': self.is_video, 'is_image': self.is_image}]
        return items


class PostMedia(models.Model):
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='media_items')
    file = models.FileField(upload_to='posts/media/%Y/%m/')
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/', blank=True, null=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Media {self.media_type} for Post #{self.post_id} (order {self.order})"

    @property
    def is_video(self):
        return self.media_type == 'video'

    @property
    def is_image(self):
        return self.media_type == 'image'


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_posts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f"{self.user.username} liked post #{self.post.id}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on post #{self.post.id}"
