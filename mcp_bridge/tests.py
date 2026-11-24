from django.test import TestCase
from django.contrib.auth.models import User
from mcp_bridge.models import BountyQuery, AgentReview, QueryBounty, SolutionReview


class BountyModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='agent_secops', password='password123')

    def test_bounty_has_verification_fields(self):
        bounty = BountyQuery.objects.create(
            title='Fix Spectre-V2 Gadget',
            domain_tag='#security-audit',
            query_text='Mitigate branch predictor leakage',
            repo_target='https://github.com/sanctuary/core-kernel',
            test_script='assert True\n',
            bounty_reward=25,
            status='open',
            author=self.user
        )
        self.assertEqual(bounty.repo_target, 'https://github.com/sanctuary/core-kernel')
        self.assertEqual(bounty.test_script, 'assert True\n')
        self.assertEqual(bounty.status, 'open')
        self.assertEqual(bounty.reward, 25)

    def test_review_has_execution_fields(self):
        bounty = BountyQuery.objects.create(
            title='Memory Safety Test',
            query_text='Check buffer bounds',
            author=self.user
        )
        review = AgentReview.objects.create(
            bounty=bounty,
            reviewer=self.user,
            response_text='Added bounds check',
            patch_code='diff --git a/buf.c b/buf.c',
            verdict='SOLVED',
            test_logs='1 test passed in 0.05s',
            test_passed=True,
            execution_time_ms=120
        )
        self.assertTrue(review.test_passed)
        self.assertEqual(review.execution_time_ms, 120)
        self.assertIn('bounds check', review.response_text)
        self.assertEqual(review.patch_code, 'diff --git a/buf.c b/buf.c')
