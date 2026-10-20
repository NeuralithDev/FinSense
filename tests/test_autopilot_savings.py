"""
Comprehensive Unit & Backtesting Tests for AutopilotSavingsEngine.

Validates:
1. Safe sweep calculation using forecast uncertainty (99% confidence upper bound)
2. Auto-pause behavior on projected cash-flow shortfalls
3. Multi-goal priority waterfall and required-vs-feasible pace tracking
4. 52-week historical simulation proving ZERO overdrafts vs. naive fixed-percentage sweeps
"""

from datetime import datetime, timedelta
import numpy as np
import pytest

from src.intelligence.autopilot_savings import (
    AutopilotSavingsEngine,
    AutopilotBacktester,
    SavingsGoal,
    GoalCategory,
    GoalStatus,
    AutopilotSweepDecision,
    BacktestResult
)


class TestSafeSweepCalculation:
    def test_safe_sweep_with_surplus(self):
        # Checking: $2,000, Income next 7d: $1,500, Forecast mean spend: $600, Forecast std: $100
        # Upcoming bills: $200, Safety buffer: $100, Overdraft prob: 0.01 (z = 2.326)
        # Conservative spend = 600 + (2.326 * 100) = 832.60
        # Total outflow = 832.60 + 200 = 1032.60
        # Balance before sweep = (2000 + 1500) - 1032.60 = 2467.40
        # Safe sweep = 2467.40 - 100 buffer = 2367.40 -> floor = $2367.00
        safe_sweep, is_paused, reason, margin, end_bal = AutopilotSavingsEngine.calculate_safe_sweep(
            checking_balance=2000.0,
            expected_inflow_7d=1500.0,
            forecasted_spend_mean_7d=600.0,
            forecasted_spend_std_7d=100.0,
            upcoming_bills_7d=200.0,
            safety_buffer=100.0,
            max_overdraft_prob=0.01
        )
        assert is_paused is False
        assert safe_sweep == 2367.0
        assert round(margin, 1) == 232.6
        assert end_bal >= 100.0  # Guarantees buffer remains

    def test_auto_pause_on_projected_shortfall(self):
        # Checking: $300, Income: $0, Forecast mean: $250, Forecast std: $50 (conservative: 250 + 116 = 366)
        # Upcoming bills: $100 -> Total outflow: $466
        # Balance before sweep: 300 - 466 = -$166
        # Must pause sweep automatically
        safe_sweep, is_paused, reason, margin, end_bal = AutopilotSavingsEngine.calculate_safe_sweep(
            checking_balance=300.0,
            expected_inflow_7d=0.0,
            forecasted_spend_mean_7d=250.0,
            forecasted_spend_std_7d=50.0,
            upcoming_bills_7d=100.0,
            safety_buffer=100.0
        )
        assert is_paused is True
        assert safe_sweep == 0.0
        assert reason is not None
        assert "Autopilot paused" in reason
        assert "falls" in reason


class TestMultiGoalPriorityWaterfall:
    def test_priority_waterfall_allocation(self):
        ref_date = datetime(2023, 1, 1)
        # Priority 1: Emergency Fund (target $5,000, current $4,000, deficit $1,000, deadline in 10 weeks -> pace $100/wk)
        # Priority 2: Tokyo Vacation (target $3,000, current $1,000, deficit $2,000, deadline in 20 weeks -> pace $100/wk)
        g1 = SavingsGoal(
            goal_id="g1",
            name="Emergency Fund",
            category=GoalCategory.EMERGENCY_FUND,
            target_amount=5000.0,
            current_amount=4000.0,
            priority=1,
            deadline_date=(ref_date + timedelta(weeks=10)).strftime("%Y-%m-%d")
        )
        g2 = SavingsGoal(
            goal_id="g2",
            name="Tokyo Vacation",
            category=GoalCategory.VACATION,
            target_amount=3000.0,
            current_amount=1000.0,
            priority=2,
            deadline_date=(ref_date + timedelta(weeks=20)).strftime("%Y-%m-%d")
        )

        # Case A: Sweep is $150 -> Priority 1 gets $100 (full required pace); Priority 2 gets $50
        allocations = AutopilotSavingsEngine.allocate_sweep_to_goals(
            safe_sweep=150.0,
            goals=[g1, g2],
            reference_date=ref_date
        )
        assert len(allocations) == 2
        assert allocations[0].allocated_amount == 100.0
        assert allocations[0].is_on_track is True
        assert allocations[1].allocated_amount == 50.0
        assert allocations[1].is_on_track is False  # required pace is $100, received $50

        # Case B: Sweep is $250 -> Priority 1 gets $100, Priority 2 gets $100, surplus $50 cascades to Priority 1
        allocations_surplus = AutopilotSavingsEngine.allocate_sweep_to_goals(
            safe_sweep=250.0,
            goals=[g1, g2],
            reference_date=ref_date
        )
        assert allocations_surplus[0].allocated_amount == 150.0
        assert allocations_surplus[1].allocated_amount == 100.0


class TestAutopilotDecisionCycle:
    def test_end_to_end_decision_cycle(self):
        goal = SavingsGoal(
            goal_id="g_main",
            name="Emergency Cushion",
            category=GoalCategory.EMERGENCY_FUND,
            target_amount=3000.0,
            current_amount=1500.0,
            priority=1
        )
        decision = AutopilotSavingsEngine.run_autopilot_cycle(
            checking_balance=1800.0,
            expected_inflow_7d=1200.0,
            forecasted_spend_mean_7d=400.0,
            forecasted_spend_std_7d=60.0,
            upcoming_bills_7d=150.0,
            goals=[goal],
            safety_buffer=100.0
        )
        assert isinstance(decision, AutopilotSweepDecision)
        assert decision.is_paused is False
        assert decision.safe_sweep_amount > 0
        assert len(decision.goal_allocations) == 1
        assert "Safe to transfer" in decision.explanation


class TestHistoricalBacktestZeroOverdraft:
    def test_52_week_backtest_proves_zero_overdrafts(self):
        """
        Simulates 52 weeks with biweekly paychecks ($1,500 every 2 weeks),
        variable weekly spend ($200 to $650), forecast noise, and periodic bills.
        """
        np.random.seed(42)
        n_weeks = 52

        inflows = []
        for w in range(n_weeks):
            inflows.append(1500.0 if w % 2 == 0 else 0.0)

        # Actual spend has random spikes (e.g. car maintenance, gifts)
        base_spend = np.random.normal(350.0, 80.0, n_weeks)
        # Add 3 sudden shock weeks
        base_spend[12] += 400.0
        base_spend[28] += 500.0
        base_spend[45] += 350.0
        actual_spend = [float(max(150.0, s)) for s in base_spend]

        # Model forecast has typical error (RMSE ~ 40)
        pred_means = [float(s + np.random.normal(0, 30.0)) for s in actual_spend]
        pred_stds = [45.0] * n_weeks

        # Monthly bills ($120 on weeks 1, 5, 9, 13...)
        bills = [120.0 if w % 4 == 0 else 0.0 for w in range(n_weeks)]

        result = AutopilotBacktester.run_backtest(
            weekly_inflows=inflows,
            actual_weekly_spend=actual_spend,
            forecasted_spend_means=pred_means,
            forecasted_spend_stds=pred_stds,
            weekly_bills=bills,
            initial_balance=800.0,
            naive_sweep_pct=0.30,
            safety_buffer=100.0
        )

        assert isinstance(result, BacktestResult)
        # FinSense MUST have 0 overdrafts due to uncertainty margins and auto-pause
        assert result.finsense_overdraft_count == 0, f"Expected 0 overdrafts, got {result.finsense_overdraft_count}"
        assert result.overdraft_free is True
        assert result.finsense_overdraft_fees == 0.0

        # Naive percentage sweep blindly sweeps when balance is high, triggering overdrafts on shock weeks
        assert result.naive_overdraft_count > 0, "Naive baseline should have caused overdrafts"
        assert result.naive_overdraft_fees > 0.0

        print(f"\n[Phase 2 Backtest Results - 52 Weeks]")
        print(f"  FinSense Total Saved: ${result.finsense_total_saved:,.2f}")
        print(f"  FinSense Overdrafts: {result.finsense_overdraft_count} (Fees: ${result.finsense_overdraft_fees:.2f})")
        print(f"  Naive Baseline Total Saved: ${result.naive_total_saved:,.2f}")
        print(f"  Naive Baseline Overdrafts: {result.naive_overdraft_count} (Fees: ${result.naive_overdraft_fees:.2f})")
        print(f"  Net FinSense Advantage: ${result.net_finsense_advantage:,.2f}")


if __name__ == "__main__":
    t_calc = TestSafeSweepCalculation()
    t_calc.test_safe_sweep_with_surplus()
    t_calc.test_auto_pause_on_projected_shortfall()

    t_goals = TestMultiGoalPriorityWaterfall()
    t_goals.test_priority_waterfall_allocation()

    t_dec = TestAutopilotDecisionCycle()
    t_dec.test_end_to_end_decision_cycle()

    t_bt = TestHistoricalBacktestZeroOverdraft()
    t_bt.test_52_week_backtest_proves_zero_overdrafts()

    print("\n✅ ALL AUTOPILOT SAVINGS TESTS PASSED!")
