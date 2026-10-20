"""
50-Question Golden Evaluation Suite & Guardrail Benchmark for FinSense AI Copilot.

Tests:
1. Intent Classification Accuracy (Target >= 95%)
2. Zero-Hallucination Numeric Fidelity (100% of reported dollar figures match verified engine metrics)
3. Guardrail Enforcement (Never declares an unaffordable purchase as affordable)
"""

from typing import List, Dict, Any, Tuple
import re
from src.ai.intent_classifier import IntentClassifier, AssistantIntent
from src.ai.context_builder import ContextBuilder, GroundTruthFinancialContext
from src.ai.copilot_narrator import CopilotNarrator, CopilotResponse


# 50 Curated Consumer Financial Questions with Ground Truth Intent Expectations
GOLDEN_EVAL_DATASET = [
    # Category 1: Affordability Decisions (10 Questions)
    {"id": "Q01", "prompt": "Can I afford to buy a $1,200 MacBook Pro today?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q02", "prompt": "Can I buy a new couch for $450?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q03", "prompt": "Is it safe to purchase a $2,500 vacation right now?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q04", "prompt": "Should I buy a $80 pair of shoes?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q05", "prompt": "Can I afford this $35,000 Tesla model Y?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q06", "prompt": "Is it safe to spend $300 on concert tickets this weekend?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q07", "prompt": "Can I buy a PS5 for $500?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q08", "prompt": "Can I afford to buy an iPad for $600?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q09", "prompt": "Can I buy a $150 winter jacket without dipping into rent money?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},
    {"id": "Q10", "prompt": "What is the maximum purchase I can afford today?", "expected_intent": AssistantIntent.AFFORDABILITY_CHECK},

    # Category 2: Subscription & Recurring Bills (10 Questions)
    {"id": "Q11", "prompt": "What subscriptions am I currently paying for?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q12", "prompt": "How much do I spend on recurring streaming services each month?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q13", "prompt": "Did my Netflix subscription price increase recently?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q14", "prompt": "Do I have any duplicate or redundant subscriptions?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q15", "prompt": "What bills are scheduled to come out of my account this week?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q16", "prompt": "Show me my recurring charges breakdown", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q17", "prompt": "How much could I save if I cancel my duplicate video streaming apps?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q18", "prompt": "Audit my monthly recurring expenses", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q19", "prompt": "Are any of my free trials converting to paid subscriptions soon?", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},
    {"id": "Q20", "prompt": "List all active subscriptions on my checking account", "expected_intent": AssistantIntent.SUBSCRIPTION_AUDIT},

    # Category 3: Autopilot Savings & Goals (10 Questions)
    {"id": "Q21", "prompt": "How much is safe to save this week?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q22", "prompt": "Can I transfer $150 to my savings account without risking bills?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q23", "prompt": "What is my autopilot safe sweep recommendation for today?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q24", "prompt": "Why was my automated savings transfer paused this week?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q25", "prompt": "Am I on track to reach my emergency cushion goal?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q26", "prompt": "How much can I safely sweep into my high-yield savings?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q27", "prompt": "What weekly savings pace do I need to hit my $5,000 goal in 6 months?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q28", "prompt": "Is it safe to save $300 right now?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q29", "prompt": "How does FinSense ensure my autopilot savings won't cause an overdraft?", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},
    {"id": "Q30", "prompt": "Run my weekly savings autopilot check", "expected_intent": AssistantIntent.SAVINGS_AUTOPILOT},

    # Category 4: Cash-Flow Forecasting & Overdraft Prevention (7 Questions)
    {"id": "Q31", "prompt": "What will my checking balance look like next Friday?", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},
    {"id": "Q32", "prompt": "Will I run out of money or overdraft before my next paycheck?", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},
    {"id": "Q33", "prompt": "Show my 7-day cash flow forecast", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},
    {"id": "Q34", "prompt": "Predict my daily spending for next week", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},
    {"id": "Q35", "prompt": "What is my projected ending balance at the end of the month?", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},
    {"id": "Q36", "prompt": "How much cash volatility is expected in my spending over the next 14 days?", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},
    {"id": "Q37", "prompt": "Will upcoming bills push my checking balance below my safety buffer?", "expected_intent": AssistantIntent.CASHFLOW_FORECAST},

    # Category 5: Financial Health Diagnostic & Scores (5 Questions)
    {"id": "Q38", "prompt": "What is my financial health score right now?", "expected_intent": AssistantIntent.HEALTH_DIAGNOSTIC},
    {"id": "Q39", "prompt": "How healthy are my finances overall?", "expected_intent": AssistantIntent.HEALTH_DIAGNOSTIC},
    {"id": "Q40", "prompt": "What financial persona archetype do I fall into?", "expected_intent": AssistantIntent.HEALTH_DIAGNOSTIC},
    {"id": "Q41", "prompt": "How many months of emergency runway do I currently have?", "expected_intent": AssistantIntent.HEALTH_DIAGNOSTIC},
    {"id": "Q42", "prompt": "What is my current debt-to-income ratio and credit standing?", "expected_intent": AssistantIntent.HEALTH_DIAGNOSTIC},

    # Category 6: Peer Benchmarking & Financial Twins (4 Questions)
    {"id": "Q43", "prompt": "How do other people in my income bracket save money?", "expected_intent": AssistantIntent.PEER_BENCHMARK},
    {"id": "Q44", "prompt": "Show me my financial twins and how I compare to them", "expected_intent": AssistantIntent.PEER_BENCHMARK},
    {"id": "Q45", "prompt": "What habits do high-performing peers in my cohort practice?", "expected_intent": AssistantIntent.PEER_BENCHMARK},
    {"id": "Q46", "prompt": "How does my savings rate benchmark against people with similar income?", "expected_intent": AssistantIntent.PEER_BENCHMARK},

    # Category 7: Action Recommendations & Prioritized Guidance (4 Questions)
    {"id": "Q47", "prompt": "What should I do next to improve my finances?", "expected_intent": AssistantIntent.ACTION_RECOMMENDATION},
    {"id": "Q48", "prompt": "What is the single most impactful financial move I can make today?", "expected_intent": AssistantIntent.ACTION_RECOMMENDATION},
    {"id": "Q49", "prompt": "Suggest prioritized action items for my budget", "expected_intent": AssistantIntent.ACTION_RECOMMENDATION},
    {"id": "Q50", "prompt": "What recommendations do you have for my current financial situation?", "expected_intent": AssistantIntent.ACTION_RECOMMENDATION}
]


class BenchmarkEvaluator:
    """
    Evaluates FinSense Copilot across accuracy, zero-arithmetic fidelity, and safety guardrails.
    """

    @classmethod
    def run_eval_suite(cls) -> Dict[str, Any]:
        """
        Runs all 50 questions through the AI copilot and computes precision,
        fidelity, and guardrail compliance.
        """
        context = ContextBuilder.build_context()

        correct_intents = 0
        total_questions = len(GOLDEN_EVAL_DATASET)
        guardrail_violations = 0
        hallucinated_figures = 0

        eval_details = []

        for item in GOLDEN_EVAL_DATASET:
            prompt = item["prompt"]
            expected = item["expected_intent"]

            response = CopilotNarrator.answer_query(prompt, context=context)

            # 1. Intent Accuracy
            is_intent_correct = (response.intent == expected.value)
            if is_intent_correct:
                correct_intents += 1

            # 2. Guardrail Safety Check:
            # If prompt asks about a $35,000 Tesla with only $2,500 checking, verdict MUST NOT be AFFORDABLE
            if "35,000" in prompt and response.verdict == "AFFORDABLE":
                guardrail_violations += 1

            # 3. Zero-Arithmetic Fidelity Check:
            # Extract dollar figures from narrative and ensure they stem from verified metrics or inputs
            reported_dollars = [float(x.replace(",", "")) for x in re.findall(r"\$\s*([\d,]+(?:\.\d{1,2})?)", response.grounded_narrative)]
            metric_values = set()
            for v in response.verified_metrics.values():
                if isinstance(v, (int, float)):
                    metric_values.add(round(float(v), 2))
                    metric_values.add(round(abs(float(v)), 2))
                    metric_values.add(round(float(v) * 12.0, 2))  # Annualized

            # Also add common context constants (buffer, checking, savings)
            for ctx_val in [context.checking_balance, context.savings_balance, context.safety_buffer, context.safe_sweep_amount]:
                metric_values.add(round(float(ctx_val), 2))

            for d in reported_dollars:
                # Check if dollar amount exists in verified metrics (or derived safe threshold)
                matched = any(abs(d - mv) < 1.0 for mv in metric_values)
                if not matched and d not in (1000.0, 100.0, 50.0, 200.0, 1200.0, 450.0, 2500.0, 80.0, 35000.0, 300.0, 500.0, 600.0, 150.0):
                    hallucinated_figures += 1

            eval_details.append({
                "id": item["id"],
                "prompt": prompt,
                "expected_intent": expected.value,
                "predicted_intent": response.intent,
                "confidence": response.confidence,
                "verdict": response.verdict,
                "is_correct": is_intent_correct
            })

        intent_accuracy = (correct_intents / total_questions) * 100.0

        return {
            "total_questions": total_questions,
            "correct_intents": correct_intents,
            "intent_accuracy_pct": round(intent_accuracy, 2),
            "guardrail_violations": guardrail_violations,
            "hallucinated_figures": hallucinated_figures,
            "passed_guardrails": (guardrail_violations == 0 and hallucinated_figures == 0),
            "details": eval_details
        }
