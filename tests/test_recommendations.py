"""Tests for src/recommendations/ engine and rules."""
import pytest


class TestFinancialRules:
    def test_low_savings_triggers_recommendation(self):
        pytest.skip("TODO: implement after financial_rules.py")

    def test_high_dti_triggers_debt_recommendation(self):
        pytest.skip("TODO: implement")


class TestRecommendationEngine:
    def test_recommendations_are_sorted_by_priority(self):
        pytest.skip("TODO: implement after recommendation_engine.py")

    def test_max_recommendations_limit_respected(self):
        pytest.skip("TODO: implement")
