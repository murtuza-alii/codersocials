from django.contrib import admin
from .models import CommunityChannel, ChannelMessage, Conversation, ConversationParticipant, DirectMessage


@admin.register(CommunityChannel)
class CommunityChannelAdmin(admin.ModelAdmin):
    list_display = ('name', 'community', 'is_announcement', 'created_at')
    list_filter = ('community', 'is_announcement')


@admin.register(ChannelMessage)
class ChannelMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'channel', 'created_at')
    search_fields = ('sender__username', 'message')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_group', 'title', 'updated_at')
    list_filter = ('is_group',)


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'conversation', 'is_admin', 'joined_at')


@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'conversation', 'created_at')
    search_fields = ('sender__username', 'message')
