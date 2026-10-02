from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('inbox/', views.inbox_view, name='inbox'),
    path('new-group/', views.create_group_chat_view, name='create_group'),
    path('dm/<str:username>/', views.start_dm_view, name='start_dm'),
    path('t/<uuid:conversation_id>/', views.conversation_detail_view, name='conversation_detail'),
    path('c/<slug:community_slug>/new-channel/', views.create_channel_view, name='create_channel'),
    path('c/<slug:community_slug>/<slug:channel_slug>/', views.channel_chat_view, name='channel_chat'),
]
