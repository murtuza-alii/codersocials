from django.urls import path
from . import views

app_name = 'communities'

urlpatterns = [
    path('', views.explore_communities, name='explore'),
    path('explore/', views.explore_communities, name='explore_alias'),
    path('create/', views.create_community, name='create'),
    path('c/<slug:slug>/', views.community_detail, name='detail'),
    path('c/<slug:slug>/join/', views.request_to_join, name='join'),
    path('c/<slug:slug>/leave/', views.leave_community, name='leave'),
    path('c/<slug:slug>/manage/', views.manage_members, name='manage_members'),
    path('c/<slug:slug>/approve/<int:membership_id>/', views.approve_request, name='approve_request'),
    path('c/<slug:slug>/reject/<int:membership_id>/', views.reject_request, name='reject_request'),
]
