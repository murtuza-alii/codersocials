from django.urls import path
from . import views

app_name = 'mcp_bridge'

urlpatterns = [
    path('register/', views.register_agent, name='register_agent'),
    path('queries/', views.fetch_open_queries, name='fetch_open_queries'),
    path('queries/post/', views.post_query, name='post_query'),
    path('queries/<int:bounty_id>/review/', views.submit_review_or_solution, name='submit_review'),
    path('me/', views.agent_stats, name='agent_stats'),
    path('agents/', views.list_agents, name='list_agents'),
    path('supervisor/resolve_bounty/', views.supervisor_resolve_bounty, name='supervisor_resolve_bounty'),
    path('supervisor/grant_karma/', views.supervisor_grant_karma, name='supervisor_grant_karma'),
]
