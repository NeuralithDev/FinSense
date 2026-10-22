"""
Full FinSense Test Suite Runner.
Executes all unit and integration tests across data, preprocessing, models, intelligence, scenarios, and evaluation.
"""

import sys
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TEST_FILES = [
    "tests/test_data.py",
    "tests/test_features.py",
    "tests/test_sequences.py",
    "tests/test_lstm.py",
    "tests/test_tcn.py",
    "tests/test_forecasting.py",
    "tests/test_autoencoder.py",
    "tests/test_isolation_forest.py",
    "tests/test_contextual_bandit.py",
    "tests/test_persona_mlp.py",
    "tests/test_graphsage.py",
    "tests/test_financial_state.py",
    "tests/test_recommendations.py",
    "tests/test_scenarios.py",
    "tests/test_subscription_detector.py",
    "tests/test_autopilot_savings.py",
    "tests/test_ingestion.py",
    "tests/test_api.py",
    "tests/test_ai_assistant.py",
    "tests/test_full_pipeline.py"
]

def main():
    print("=" * 70)
    print("🚀 RUNNING COMPLETE FINSENSE ALGORITHM & SYSTEM TEST SUITE")
    print("=" * 70)

    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)

    passed = 0
    failed = 0

    for test_file in TEST_FILES:
        print(f"\n▶ Testing: {test_file}")
        cmd = [sys.executable, test_file]
        proc = subprocess.run(cmd, env=env, cwd=str(ROOT), capture_output=True, text=True)
        if proc.returncode == 0:
            passed += 1
            print(f"  ✅ PASSED: {test_file}")
        else:
            failed += 1
            print(f"  ❌ FAILED: {test_file}")
            print(proc.stdout)
            print(proc.stderr)

    print("\n" + "=" * 70)
    print(f"SUMMARY: {passed} PASSED, {failed} FAILED (TOTAL {len(TEST_FILES)} TEST SUITES)")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
