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
