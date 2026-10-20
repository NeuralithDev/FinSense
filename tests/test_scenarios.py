"""
Unit tests for AffordabilityEngine and ScenarioEngine in src/scenarios/.
"""

import pandas as pd
import pytest

from src.scenarios.affordability import AffordabilityEngine
from src.scenarios.scenario_engine import ScenarioEngine


class TestAffordability:
    def test_can_afford_loan_below_dti_limit(self):
        # Income $6,000, current EMI $600 (10%), new EMI $500 -> total 18.3% < 36%
        result = AffordabilityEngine.can_afford_loan(
            monthly_income=6000.0,
            current_emi=600.0,
            proposed_emi=500.0
        )
        assert result["is_affordable"] is True
        assert result["projected_dti"] < 0.20
        assert result["max_affordable_emi"] > 0

    def test_declined_loan_above_dti_limit(self):
        # Income $4,000, current EMI $1,000 (25%), new EMI $800 -> total $1,800 = 45% > 36%
        result = AffordabilityEngine.can_afford_loan(
            monthly_income=4000.0,
            current_emi=1000.0,
            proposed_emi=800.0
        )
        assert result["is_affordable"] is False
        assert result["projected_dti"] == 0.45

    def test_months_to_goal_basic(self):
        res = AffordabilityEngine.months_to_goal(
            current_savings=2000.0,
            target_savings=10000.0,
            monthly_contribution=1000.0
        )
        assert res["achieved"] is False
        assert res["months_required"] == 8.0

    def test_max_safe_lump_sum_purchase(self):
        # $15,000 savings, $3,000 monthly burn, 3-month min buffer = $9,000
        # Safe to spend: $15,000 - $9,000 = $6,000
        res = AffordabilityEngine.max_safe_lump_sum_purchase(
            liquid_savings=15000.0,
            monthly_expenses=3000.0,
            min_reserve_months=3.0
        )
        assert res["can_spend"] is True
        assert res["max_safe_spend"] == 6000.0


class TestScenarioEngine:
    def test_scenario_output_shape(self):
        res = ScenarioEngine.simulate_trajectory(
            initial_savings=10000.0,
            monthly_income=5000.0,
            monthly_expenses=3500.0,
            horizon_months=6
        )
        assert res["horizon_months"] == 6
        assert isinstance(res["trajectory"], pd.DataFrame)
        assert len(res["trajectory"]) == 6
        assert res["final_savings"] > res["initial_savings"]

    def test_negative_override_reduces_balance(self):
        # 30% salary cut + $500 new monthly cost leads to monthly deficit
        res = ScenarioEngine.simulate_trajectory(
            initial_savings=5000.0,
            monthly_income=4000.0,
            monthly_expenses=3500.0,
            income_delta_pct=-0.30,       # income drops to $2,800
            new_recurring_commitment=500.0, # expenses rise to $4,000 -> deficit -$1,200/mo
            horizon_months=4
        )
        assert res["final_savings"] < res["initial_savings"]
        assert res["deficit_months_count"] == 4
        assert res["net_savings_change"] == -4800.0


if __name__ == "__main__":
    t_afford = TestAffordability()
    t_afford.test_can_afford_loan_below_dti_limit()
    t_afford.test_declined_loan_above_dti_limit()
    t_afford.test_months_to_goal_basic()
    t_afford.test_max_safe_lump_sum_purchase()

    t_scen = TestScenarioEngine()
    t_scen.test_scenario_output_shape()
    t_scen.test_negative_override_reduces_balance()

    print("ALL SCENARIO TESTS PASSED!")
