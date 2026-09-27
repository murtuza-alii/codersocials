import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from communities.models import Community


class CommunityChannel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='channels')
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=60)
    topic = models.CharField(max_length=255, blank=True)
    is_announcement = models.BooleanField(default=False, help_text="Only admins/moderators can post if True")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('community', 'slug')
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name) or 'general'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"#{self.name} in {self.community.name}"


class ChannelMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    channel = models.ForeignKey(CommunityChannel, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='channel_messages')
    message = models.TextField()
    attachment = models.FileField(upload_to='chat/attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username} in #{self.channel.name}: {self.message[:30]}"


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_group = models.BooleanField(default=False)
    title = models.CharField(max_length=100, blank=True, help_text="Group chat title")
    avatar = models.ImageField(upload_to='conversations/avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        if self.is_group:
            return f"Group: {self.title or 'Unnamed Group'}"
        usernames = list(self.participants.values_list('user__username', flat=True))
        return f"DM: {', '.join(usernames)}"

    def get_recipient(self, current_user):
        """For 1-on-1 DMs, get the other user."""
        other = self.participants.exclude(user=current_user).first()
        return other.user if other else None


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    is_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('conversation', 'user')

    def __str__(self):
        return f"{self.user.username} in {self.conversation}"


class DirectMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_direct_messages')
    message = models.TextField()
    attachment = models.FileField(upload_to='dms/attachments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.message[:30]}"
