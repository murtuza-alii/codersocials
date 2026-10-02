from django.contrib import admin
from .models import Post, PostMedia, Like, Comment


class PostMediaInline(admin.TabularInline):
    model = PostMedia
    extra = 1


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('author', 'community', 'media_type', 'tag', 'created_at', 'total_likes', 'total_comments')
    list_filter = ('community', 'media_type', 'created_at')
    search_fields = ('author__username', 'caption', 'tag')
    inlines = [PostMediaInline]


@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    list_display = ('post', 'media_type', 'order', 'created_at')
    list_filter = ('media_type',)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'post', 'created_at')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'text', 'created_at')
    search_fields = ('author__username', 'text')
