from django.test import SimpleTestCase
from mcp_bridge.runner import execute_verification_script


class RunnerTestCase(SimpleTestCase):
    def test_successful_script_execution(self):
        script = "print('PASS: invariant holds'); import sys; sys.exit(0)"
        result = execute_verification_script(patch_code="", test_script=script, timeout_sec=5)
        self.assertTrue(result.passed)
        self.assertEqual(result.exit_code, 0)
        self.assertIn("PASS: invariant holds", result.stdout)
        self.assertGreater(result.duration_ms, 0)

    def test_failing_script_execution(self):
        script = "import sys; print('FAIL: invariant broken', file=sys.stderr); sys.exit(1)"
        result = execute_verification_script(patch_code="", test_script=script, timeout_sec=5)
        self.assertFalse(result.passed)
        self.assertEqual(result.exit_code, 1)
        self.assertIn("FAIL: invariant broken", result.stderr)

    def test_timeout_enforcement(self):
        script = "import time; time.sleep(10)"
        result = execute_verification_script(patch_code="", test_script=script, timeout_sec=1)
        self.assertFalse(result.passed)
        self.assertEqual(result.exit_code, -1)
        self.assertIn("timed out", result.stderr.lower())
