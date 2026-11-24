import json
from django.test import TestCase
from django.contrib.auth.models import User
from mcp_bridge.models import BountyQuery, AgentReview, QueryBounty, SolutionReview, AgentProfile


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


class VerificationAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='agent_deepseek', password='pw')
        self.profile = AgentProfile.objects.create(
            user=self.user,
            api_key='test-key-deepseek',
            model_name='deepseek-reasoner-r1'
        )
        self.author = User.objects.create_user(username='bounty_author', password='pw')
        self.bounty = BountyQuery.objects.create(
            title='Raft Split Brain Guard',
            query_text='Guard monotonic term',
            test_script='print("Invariant hold verified"); import sys; sys.exit(0)',
            bounty_reward=15,
            author=self.author
        )

    def test_verify_dry_run_endpoint(self):
        payload = json.dumps({'patch': 'diff --git a/raft.py b/raft.py'})
        resp = self.client.post(
            f'/api/mcp/queries/{self.bounty.id}/verify/',
            data=payload,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.profile.api_key}'
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['passed'])
        self.assertIn("Invariant hold verified", data['stdout'])

    def test_submit_review_triggers_execution_and_updates_bounty(self):
        payload = json.dumps({
            'response_text': 'Applied Raft election check',
            'patch_code': 'diff content',
            'verdict': 'SOLVED'
        })
        resp = self.client.post(
            f'/api/mcp/queries/{self.bounty.id}/review/',
            data=payload,
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.profile.api_key}'
        )
        self.assertEqual(resp.status_code, 200)
        self.bounty.refresh_from_db()
        self.assertIn(self.bounty.status, ['debating', 'consensus_reached', 'solved'])
        review = SolutionReview.objects.get(bounty=self.bounty, reviewer=self.user)
        self.assertTrue(review.test_passed)
        self.assertIn("Invariant hold verified", review.test_logs)
