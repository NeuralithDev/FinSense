"""
Tests for RecommendationEngine and Contextual Multi-Armed Bandit recommendation ranking.
"""

import numpy as np
import pytest

from src.intelligence.financial_state import FinancialStateEngine, UserFinancialState
from src.intelligence.recommendation_engine import RecommendationEngine, ActionableRecommendation
from src.models.contextual_bandit import LinUCB


class TestFinancialRules:
    def test_low_savings_triggers_emergency_recommendation(self):
        state = FinancialStateEngine.fuse_and_score(
            user_id="U_LOW_SAVINGS",
            fin_profile={
                "monthly_income_usd": 4000.0,
                "monthly_expenses_usd": 3800.0,
                "savings_usd": 500.0,  # runway < 1 month
                "debt_to_income_ratio": 0.20
            }
        )
        recs = RecommendationEngine.generate_recommendations(state)
        actions = [r.action for r in recs]
        assert any("Emergency Buffer" in a or "Starter Emergency Buffer" in a for a in actions)
        top_rec = recs[0]
        assert top_rec.priority == "HIGH"

    def test_high_dti_triggers_debt_recommendation(self):
        state = FinancialStateEngine.fuse_and_score(
            user_id="U_HIGH_DEBT",
            fin_profile={
                "monthly_income_usd": 5000.0,
                "monthly_expenses_usd": 3000.0,
                "savings_usd": 20000.0,
                "debt_to_income_ratio": 0.48  # High DTI > 36%
            }
        )
        recs = RecommendationEngine.generate_recommendations(state)
        categories = [r.category for r in recs]
        assert "DEBT" in categories


class TestRecommendationEngine:
    def test_recommendations_are_sorted_by_priority(self):
        state = FinancialStateEngine.fuse_and_score(
            user_id="U_MIXED",
            fin_profile={
                "credit_score": 570,
                "monthly_income_usd": 3500.0,
                "monthly_expenses_usd": 3400.0,
                "savings_usd": 300.0,
                "debt_to_income_ratio": 0.45
            }
        )
        recs = RecommendationEngine.generate_recommendations(state)
        priority_map = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        priorities = [priority_map[r.priority] for r in recs]
        # Must be monotonically non-decreasing (0s, then 1s, then 2s)
        assert priorities == sorted(priorities)

    def test_contextual_bandit_reranks_recommendations(self):
        # 4 actions
        bandit = LinUCB(num_arms=4, context_dim=4, alpha=0.5)
        # Context: [health_score/100, dti, runway_months/12, net_cash_flow/1000]
        context = np.array([0.45, 0.48, 0.1, 0.1])

        ranked_arms = bandit.rank_arms(context)
        assert len(ranked_arms) == 4
        assert set(ranked_arms) == {0, 1, 2, 3}


if __name__ == "__main__":
    t_rules = TestFinancialRules()
    t_rules.test_low_savings_triggers_emergency_recommendation()
    t_rules.test_high_dti_triggers_debt_recommendation()

    t_engine = TestRecommendationEngine()
    t_engine.test_recommendations_are_sorted_by_priority()
    t_engine.test_contextual_bandit_reranks_recommendations()

    print("ALL RECOMMENDATION TESTS PASSED!")
