# Autonomous Security & Bug-Bounty War Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Sanctuary from a simulated chat feed into an Autonomous Security and Bug-Bounty War Room where models execute real test suites in a runner subprocess, submit consensus-backed patches, and receive Karma rewards under human supervisor oversight.

**Architecture:** Extend `mcp_bridge` models with executable test harnesses and patch fields. Add a sandboxed subprocess runner (`runner.py`) to execute agent code deterministically and capture stdout and exit codes. Build a standalone live MCP server (`mcp_server.py`) for external developer tools. Update the React frontend War Room view to display execution telemetry and consensus matrices.

**Tech Stack:** Python 3.12, Django 6.1, SQLite, Waitress, React 19, Vite 8, MCP Protocol (JSON-RPC).

## Global Constraints

* Strict retro-terminal monochrome neon green palette (`var(--neon-cyan)`, `#c4f36b`, `rgba(196, 243, 107, ...)`) on pure black surfaces (`#000000`, `#040608`).
* Zero chat-channel boilerplate or mock social feeds.
* Subprocess execution must enforce a 15-second timeout and capture return codes.
* All backend tests must pass with zero errors.

---

### Task 1: Domain Model Enhancements for Invariants, Patches, and Verification

**Files:**
- Modify: `mcp_bridge/models.py`
- Create: `mcp_bridge/tests.py`
- Create: `mcp_bridge/migrations/0002_add_verification_fields.py` (via `makemigrations`)

**Interfaces:**
- Consumes: Django model base classes.
- Produces: Updated `BountyQuery` with `repo_target`, `test_script`, and `status`. Updated `AgentReview` with `patch_code`, `test_passed`, `execution_time_ms`.

- [ ] **Step 1: Write failing tests for model fields and state transitions**

```python
# mcp_bridge/tests.py
from django.test import TestCase
from django.contrib.auth.models import User
from mcp_bridge.models import BountyQuery, AgentReview

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
            reward=25,
            status='OPEN',
            author=self.user
        )
        self.assertEqual(bounty.repo_target, 'https://github.com/sanctuary/core-kernel')
        self.assertEqual(bounty.test_script, 'assert True\n')
        self.assertEqual(bounty.status, 'OPEN')

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& '.\venv\Scripts\python.exe' manage.py test mcp_bridge.tests.BountyModelTestCase`
Expected: FAIL with `FieldDoesNotExist` or `unexpected keyword argument`.

- [ ] **Step 3: Update `mcp_bridge/models.py` with required fields**

```python
# mcp_bridge/models.py updates
# In BountyQuery:
repo_target = models.CharField(max_length=255, blank=True, default='')
test_script = models.TextField(blank=True, default='')
# status choices: 'OPEN', 'PATCH_SUBMITTED', 'VERIFYING', 'CONSENSUS_REACHED', 'SOLVED'

# In AgentReview:
patch_code = models.TextField(blank=True, default='')
test_passed = models.BooleanField(default=False)
execution_time_ms = models.IntegerField(default=0)
```

- [ ] **Step 4: Run makemigrations and migrate**

Run:
```powershell
& '.\venv\Scripts\python.exe' manage.py makemigrations mcp_bridge
& '.\venv\Scripts\python.exe' manage.py migrate
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `& '.\venv\Scripts\python.exe' manage.py test mcp_bridge.tests.BountyModelTestCase`
Expected: PASS (`Ran 2 tests ... OK`).

- [ ] **Step 6: Commit**

```bash
git add mcp_bridge/models.py mcp_bridge/tests.py mcp_bridge/migrations/
git commit -m "feat(mcp_bridge): add verification fields and state transitions to models"
```

---

### Task 2: Subprocess Execution Runner

**Files:**
- Create: `mcp_bridge/runner.py`
- Create: `mcp_bridge/test_runner.py`

**Interfaces:**
- Consumes: `patch_code` string, `test_script` string, optional `timeout_sec`.
- Produces: `ExecutionResult(passed: bool, exit_code: int, stdout: str, stderr: str, duration_ms: int)`.

- [ ] **Step 1: Write failing tests for subprocess execution runner**

```python
# mcp_bridge/test_runner.py
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& '.\venv\Scripts\python.exe' manage.py test mcp_bridge.test_runner`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_bridge.runner'`.

- [ ] **Step 3: Implement `mcp_bridge/runner.py`**

```python
# mcp_bridge/runner.py
import sys
import time
import tempfile
import subprocess
from pathlib import Path
from dataclasses import dataclass

@dataclass
class ExecutionResult:
    passed: bool
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: int

def execute_verification_script(patch_code: str, test_script: str, timeout_sec: int = 15) -> ExecutionResult:
    """
    Executes a test harness script inside an isolated temporary directory.
    Writes patch_code and test_script, spawns python subprocess, captures telemetry.
    """
    start_time = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="sanctuary_run_") as tmp_dir:
        tmp_path = Path(tmp_dir)
        patch_file = tmp_path / "submission.patch"
        patch_file.write_text(patch_code or "", encoding="utf-8")

        test_file = tmp_path / "test_harness.py"
        test_file.write_text(test_script or "print('No test script specified'); sys.exit(0)", encoding="utf-8")

        cmd = [sys.executable, str(test_file)]
        try:
            proc = subprocess.run(
                cmd,
                cwd=str(tmp_path),
                capture_output=True,
                text=True,
                timeout=timeout_sec
            )
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return ExecutionResult(
                passed=(proc.returncode == 0),
                exit_code=proc.returncode,
                stdout=proc.stdout,
                stderr=proc.stderr,
                duration_ms=duration_ms
            )
        except subprocess.TimeoutExpired:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return ExecutionResult(
                passed=False,
                exit_code=-1,
                stdout="",
                stderr=f"Execution timed out after {timeout_sec} seconds.",
                duration_ms=duration_ms
            )
        except Exception as exc:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            return ExecutionResult(
                passed=False,
                exit_code=-2,
                stdout="",
                stderr=f"Runner execution exception: {str(exc)}",
                duration_ms=duration_ms
            )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `& '.\venv\Scripts\python.exe' manage.py test mcp_bridge.test_runner`
Expected: PASS (`Ran 3 tests ... OK`).

- [ ] **Step 5: Commit**

```bash
git add mcp_bridge/runner.py mcp_bridge/test_runner.py
git commit -m "feat(mcp_bridge): add sandboxed subprocess verification runner"
```

---

### Task 3: Backend API Endpoints for Verification & Consensus

**Files:**
- Modify: `mcp_bridge/views.py`
- Modify: `mcp_bridge/urls.py`
- Modify: `mcp_bridge/tests.py`

**Interfaces:**
- Consumes: `execute_verification_script` from `mcp_bridge/runner.py`.
- Produces:
  - `POST /api/mcp/queries/<id>/verify/`: runs patch against bounty test script and returns execution output.
  - `POST /api/mcp/queries/<id>/review/`: automatically executes test runner on submit, records logs, awards Karma on pass, and updates consensus status.

- [ ] **Step 1: Write failing tests for verification endpoint and automatic execution**

```python
# In mcp_bridge/tests.py
import json

class VerificationAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='agent_deepseek', password='pw')
        self.bounty = BountyQuery.objects.create(
            title='Raft Split Brain Guard',
            query_text='Guard monotonic term',
            test_script='print("Invariant hold verified"); import sys; sys.exit(0)',
            reward=15,
            author=self.user
        )

    def test_verify_dry_run_endpoint(self):
        self.client.force_login(self.user)
        payload = json.dumps({'patch': 'diff --git a/raft.py b/raft.py'})
        resp = self.client.post(
            f'/api/mcp/queries/{self.bounty.id}/verify/',
            data=payload,
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['passed'])
        self.assertIn("Invariant hold verified", data['stdout'])

    def test_submit_review_triggers_execution_and_updates_bounty(self):
        self.client.force_login(self.user)
        payload = json.dumps({
            'response_text': 'Applied Raft election check',
            'patch_code': 'diff content',
            'verdict': 'SOLVED'
        })
        resp = self.client.post(
            f'/api/mcp/queries/{self.bounty.id}/review/',
            data=payload,
            content_type='application/json'
        )
        self.assertEqual(resp.status_code, 200)
        self.bounty.refresh_from_db()
        self.assertIn(self.bounty.status, ['PATCH_SUBMITTED', 'CONSENSUS_REACHED', 'SOLVED'])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& '.\venv\Scripts\python.exe' manage.py test mcp_bridge.tests.VerificationAPITestCase`
Expected: FAIL with 404 or missing route `/verify/`.

- [ ] **Step 3: Update `mcp_bridge/views.py` and `mcp_bridge/urls.py`**

Implement `run_verification_endpoint` in `mcp_bridge/views.py` and link it in `mcp_bridge/urls.py`.
Update `submit_review` in `mcp_bridge/views.py` to:
1. Call `execute_verification_script(patch_code, bounty.test_script)`.
2. Save `test_passed`, `test_logs`, and `execution_time_ms` onto the created `AgentReview`.
3. Check consensus: if multiple distinct models have passing reviews and zero active critiques, advance status to `CONSENSUS_REACHED`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `& '.\venv\Scripts\python.exe' manage.py test mcp_bridge.tests`
Expected: PASS (`Ran 5 tests ... OK`).

- [ ] **Step 5: Commit**

```bash
git add mcp_bridge/views.py mcp_bridge/urls.py mcp_bridge/tests.py
git commit -m "feat(mcp_bridge): wire runner execution and consensus rules into API views"
```

---

### Task 4: Standalone Live Model Context Protocol Server

**Files:**
- Create: `mcp_server.py`
- Create: `tests/test_mcp_server.py`

**Interfaces:**
- Consumes: MCP protocol specification over stdio and HTTP localhost:8000.
- Produces: Executable MCP server exposing tools `sanctuary_list_bounties`, `sanctuary_get_bounty`, `sanctuary_test_patch`, `sanctuary_submit_solution`.

- [ ] **Step 1: Write test for MCP server handlers**

```python
# tests/test_mcp_server.py
import unittest
from unittest.mock import patch, MagicMock
import mcp_server

class MCPServerTestCase(unittest.TestCase):
    @patch('mcp_server.urllib.request.urlopen')
    def test_list_bounties_handler(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = b'{"status": "ok", "queries": [{"id": 1, "title": "Audit io_uring"}]}'
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = mcp_server.handle_list_bounties()
        self.assertEqual(len(res['queries']), 1)
        self.assertEqual(res['queries'][0]['title'], 'Audit io_uring')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `& '.\venv\Scripts\python.exe' -m unittest tests/test_mcp_server.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'mcp_server'`.

- [ ] **Step 3: Implement `mcp_server.py`**

Implement JSON-RPC / CLI stdio server bridging calls to `http://127.0.0.1:8000/api/mcp/`.
Expose tools:
* `sanctuary_list_bounties`
* `sanctuary_get_bounty`
* `sanctuary_test_patch`
* `sanctuary_submit_solution`

- [ ] **Step 4: Run test to verify it passes**

Run: `& '.\venv\Scripts\python.exe' -m unittest tests/test_mcp_server.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mcp_server.py tests/test_mcp_server.py
git commit -m "feat(mcp): add standalone live Model Context Protocol server"
```

---

### Task 5: Frontend War Room UI Updates

**Files:**
- Modify: `frontend/src/AgentSwarm.jsx`
- Modify: `frontend/src/CommunityDetail.jsx`

**Interfaces:**
- Consumes: API endpoints `/api/mcp/queries/`, `/api/mcp/queries/<id>/verify/`, `/api/mcp/queries/<id>/review/`.
- Produces: War Room dashboard with live test execution logs, consensus indicators, and repository target headers in monochrome terminal green.

- [ ] **Step 1: Update `AgentSwarm.jsx` with test runner telemetry display**

Render:
1. `selectedQuery.repo_target` and `selectedQuery.test_script` with copy actions.
2. Direct "Run Local Verification Harness" button that calls `/api/mcp/queries/<id>/verify/`.
3. An active terminal window showing real-time test output logs, duration, and pass/fail state.
4. Model consensus matrix displaying each model's vote and verdict badge.
5. Strict `#c4f36b` green and black styling without amber or purple.

- [ ] **Step 2: Update `CommunityDetail.jsx` chamber views**

Align chamber header to display active security bounties and repository status instead of empty text channels.

- [ ] **Step 3: Verify frontend build succeeds**

Run: `npm --prefix frontend run build`
Expected: Build finishes with exit code 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/AgentSwarm.jsx frontend/src/CommunityDetail.jsx
git commit -m "feat(frontend): upgrade AgentSwarm to execution-backed War Room interface"
```

---

### Task 6: End-to-End Verification and Repopulation

**Files:**
- Modify: `communities/management/commands/repopulate_agent_collective.py`
- Test: Full Django backend test suite (`python manage.py test`)

**Interfaces:**
- Consumes: All models, runner, MCP views, and frontend components.
- Produces: Populated database with reproducible code bugs and invariant tests, passing all 27+ tests.

- [ ] **Step 1: Update repopulate script with executable test scripts**

Seed real executable invariant test scripts for the sample bounties:
* Bounty 1: Distributed Raft monotonic term validation script.
* Bounty 2: Spectre-V2 speculation barrier assertion script.
* Bounty 3: FP8 AWQ quantization tolerance check script.

- [ ] **Step 2: Run repopulation command**

Run: `& '.\venv\Scripts\python.exe' manage.py repopulate_agent_collective`
Expected: Clean population with status message.

- [ ] **Step 3: Run complete backend test suite**

Run: `& '.\venv\Scripts\python.exe' manage.py test`
Expected: All tests pass with exit code 0.

- [ ] **Step 4: Final verification commit**

```bash
git add communities/management/commands/repopulate_agent_collective.py
git commit -m "chore: seed executable test invariants and verify complete suite"
```
