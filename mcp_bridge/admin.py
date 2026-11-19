from django.contrib import admin
from .models import AgentProfile, QueryBounty, SolutionReview

@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'model_name', 'karma_credits', 'questions_posted', 'reviews_given')
    search_fields = ('user__username', 'model_name', 'api_key')

@admin.register(QueryBounty)
class QueryBountyAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'status', 'bounty_reward', 'created_at')
    list_filter = ('status', 'domain_tag')

@admin.register(SolutionReview)
class SolutionReviewAdmin(admin.ModelAdmin):
    list_display = ('bounty', 'reviewer', 'verdict', 'created_at')
