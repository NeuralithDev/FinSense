"""
Comprehensive Test Suite for FinSense AI Assistant (Phase 5).

Validates:
1. Intent classification & entity extraction
2. Zero-arithmetic context narration
3. 50-Question Golden Evaluation Benchmark (Accuracy >= 95%, 0 guardrail violations)
4. Assistant FastAPI endpoints (/api/assistant/chat, /api/assistant/benchmark)
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from src.ai.intent_classifier import IntentClassifier, AssistantIntent
from src.ai.context_builder import ContextBuilder
from src.ai.copilot_narrator import CopilotNarrator
from src.ai.eval_benchmarks import BenchmarkEvaluator, GOLDEN_EVAL_DATASET

client = TestClient(app)


class TestIntentClassification:
    def test_affordability_intent_and_entities(self):
        prompt = "Can I afford to buy a $1,200 MacBook Pro today?"
        intent, conf = IntentClassifier.classify_intent(prompt)
        assert intent == AssistantIntent.AFFORDABILITY_CHECK
        assert conf >= 0.80

        entities = IntentClassifier.extract_entities(prompt)
        assert entities.amount == 1200.0
        assert "Macbook" in entities.item_name

    def test_subscriptions_intent(self):
        prompt = "Did my Netflix subscription price increase?"
        intent, conf = IntentClassifier.classify_intent(prompt)
        assert intent == AssistantIntent.SUBSCRIPTION_AUDIT
        entities = IntentClassifier.extract_entities(prompt)
        assert entities.merchant == "Netflix"

    def test_savings_autopilot_intent(self):
        prompt = "How much can I safely save this week?"
        intent, conf = IntentClassifier.classify_intent(prompt)
        assert intent == AssistantIntent.SAVINGS_AUTOPILOT


class TestZeroArithmeticNarrator:
    def test_affordable_purchase_narration(self):
        # User with $4,000 checking asking for $200 headphones
        ctx = ContextBuilder.build_context(checking_balance=4000.0, savings_balance=10000.0)
        res = CopilotNarrator.answer_query("Can I buy $200 headphones?", context=ctx)
        assert res.verdict == "AFFORDABLE"
        assert "$200.00" in res.grounded_narrative
        assert res.verified_metrics["purchase_amount"] == 200.0
        assert res.verified_metrics["checking_remaining"] == 3800.0

    def test_unaffordable_purchase_narration(self):
        # User with $500 checking asking for a $25,000 car
        ctx = ContextBuilder.build_context(checking_balance=500.0, savings_balance=1000.0)
        res = CopilotNarrator.answer_query("Can I afford to buy a $25,000 car?", context=ctx)
        assert res.verdict == "UNAFFORDABLE"
        assert res.verified_metrics["checking_remaining"] < 0
        assert "Unaffordable" in res.grounded_narrative


class Test50QuestionGoldenBenchmark:
    def test_benchmark_accuracy_and_guardrails(self):
        results = BenchmarkEvaluator.run_eval_suite()
        print(f"\n[AI Copilot 50-Question Golden Evaluation]")
        print(f"  Total Questions: {results['total_questions']}")
        print(f"  Correct Intents: {results['correct_intents']} / {results['total_questions']}")
        print(f"  Intent Accuracy: {results['intent_accuracy_pct']}% (Target >= 95.0%)")
        print(f"  Guardrail Violations: {results['guardrail_violations']} (Target 0)")
        print(f"  Hallucinated Figures: {results['hallucinated_figures']} (Target 0)")
        print(f"  Passed All Guardrails: {results['passed_guardrails']}")

        assert results["intent_accuracy_pct"] >= 95.0, f"Expected >= 95% accuracy, got {results['intent_accuracy_pct']}%"
        assert results["guardrail_violations"] == 0, f"Expected 0 violations, got {results['guardrail_violations']}"
        assert results["hallucinated_figures"] == 0, f"Expected 0 hallucinated figures, got {results['hallucinated_figures']}"
        assert results["passed_guardrails"] is True


class TestAssistantAPIEndpoints:
    def test_chat_endpoint(self):
        payload = {
            "prompt": "Can I afford to buy a $400 television?",
            "checking_balance": 2000.0,
            "savings_balance": 5000.0
        }
        resp = client.post("/api/assistant/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["intent"] == "AFFORDABILITY_CHECK"
        assert data["verdict"] in ["AFFORDABLE", "STRETCH"]
        assert len(data["grounded_narrative"]) > 0
        assert len(data["suggested_followups"]) >= 1

    def test_benchmark_endpoint(self):
        resp = client.get("/api/assistant/benchmark")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_questions"] == 50
        assert data["intent_accuracy_pct"] >= 95.0


if __name__ == "__main__":
    t_intent = TestIntentClassification()
    t_intent.test_affordability_intent_and_entities()
    t_intent.test_subscriptions_intent()
    t_intent.test_savings_autopilot_intent()

    t_narrator = TestZeroArithmeticNarrator()
    t_narrator.test_affordable_purchase_narration()
    t_narrator.test_unaffordable_purchase_narration()

    t_bench = Test50QuestionGoldenBenchmark()
    t_bench.test_benchmark_accuracy_and_guardrails()

    t_api = TestAssistantAPIEndpoints()
    t_api.test_chat_endpoint()
    t_api.test_benchmark_endpoint()

    print("\n✅ ALL AI ASSISTANT TESTS PASSED!")
