from django.urls import path
from . import views

urlpatterns = [
    path('', views.feed_view, name='feed'),
    path('explore/', views.explore_view, name='explore'),
    path('create/', views.create_post_view, name='create_post'),
    path('post/<int:pk>/', views.post_detail_view, name='post_detail'),
    path('post/<int:pk>/like/', views.like_toggle_view, name='like_toggle'),
    path('post/<int:pk>/comment/', views.add_comment_view, name='add_comment'),
]
