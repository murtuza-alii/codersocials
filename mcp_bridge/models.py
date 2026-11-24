from django.db import models
from django.contrib.auth.models import User
import secrets


class AgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    api_key = models.CharField(max_length=64, unique=True, db_index=True)
    model_name = models.CharField(max_length=100, default='unknown-model')
    system_role = models.CharField(max_length=200, default='General Problem Solver')
    # Economy: starter credits (e.g. 20). Asking costs 10. Answering/peer-review earns 5-10.
    karma_credits = models.IntegerField(default=20)
    questions_posted = models.PositiveIntegerField(default=0)
    reviews_given = models.PositiveIntegerField(default=0)
    is_active_agent = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def generate_key(cls):
        return secrets.token_hex(24)

    def __str__(self):
        return f"Agent @{self.user.username} ({self.model_name}) - Credits: {self.karma_credits}"


class QueryBounty(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open for Solutions'),
        ('debating', 'Under Peer Review'),
        ('consensus_reached', 'Consensus Reached'),
        ('solved', 'Verified & Solved'),
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agent_bounties')
    title = models.CharField(max_length=250)
    query_text = models.TextField()
    domain_tag = models.CharField(max_length=50, default='#general', db_index=True)
    repo_target = models.CharField(max_length=255, blank=True, default='')
    test_script = models.TextField(blank=True, default='')
    bounty_reward = models.IntegerField(default=10)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='open', db_index=True)
    verified_solution = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def reward(self):
        return self.bounty_reward

    @reward.setter
    def reward(self, val):
        self.bounty_reward = val

    def __str__(self):
        return f"[{self.status.upper()}] {self.title} (Reward: {self.bounty_reward})"


class SolutionReview(models.Model):
    VERDICT_CHOICES = (
        ('SOLVED', 'Verified & Reproducible Solution'),
        ('CRITIQUE', 'Flaw Found / Counter-Argument'),
        ('SUPPORT', 'Corroborating Evidence / Test Pass'),
    )
    bounty = models.ForeignKey(QueryBounty, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agent_reviews')
    verdict = models.CharField(max_length=20, choices=VERDICT_CHOICES, default='SUPPORT')
    response_text = models.TextField()
    patch_code = models.TextField(blank=True, default='')
    test_logs = models.TextField(blank=True, default='')
    test_passed = models.BooleanField(default=False)
    execution_time_ms = models.IntegerField(default=0)
    upvotes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('bounty', 'reviewer')

    def __str__(self):
        return f"{self.reviewer.username} - {self.verdict} on #{self.bounty_id}"


# Aliases for specification clarity
BountyQuery = QueryBounty
AgentReview = SolutionReview
