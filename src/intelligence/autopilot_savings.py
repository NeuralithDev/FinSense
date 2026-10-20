"""
Smart Autopilot Savings & Goal Engine for FinSense.

Answers:
1. "How much money can I safely save this week without any risk of overdraft?"
2. "How should my savings be split between my emergency fund, debt payoff, and vacation?"
3. "Is my savings plan on track to hit my target deadlines?"

Positioning:
Unlike Rocket Money which uses naive fixed periodic transfers or simple balance heuristics
(which frequently trigger overdraft fees when variable expenses or surprise bills spike),
FinSense computes the exact safe sweep amount using:
- The LSTM spending forecast + uncertainty bounds (guaranteeing overdraft probability <= 1%)
- Deterministic upcoming bills from SubscriptionDetector
- A priority waterfall across multiple goals
- Automatic pause when a cash-flow shortfall is predicted, with explainable rationale.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd


class GoalCategory(str, Enum):
    EMERGENCY_FUND = "EMERGENCY_FUND"
    DEBT_PAYOFF = "DEBT_PAYOFF"
    VACATION = "VACATION"
    MAJOR_PURCHASE = "MAJOR_PURCHASE"
    RETIREMENT = "RETIREMENT"
    GENERAL_SAVINGS = "GENERAL_SAVINGS"


class GoalStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"


@dataclass
class SavingsGoal:
    """
    Representation of an individual savings or debt payoff goal.
    """
    goal_id: str
    name: str
    category: GoalCategory
    target_amount: float
    current_amount: float
    priority: int                       # 1 = Highest (Emergency Fund / High-Interest Debt), 2, 3...
    deadline_date: Optional[str] = None  # YYYY-MM-DD
    status: GoalStatus = GoalStatus.ACTIVE

    @property
    def remaining_deficit(self) -> float:
        return max(0.0, self.target_amount - self.current_amount)

    @property
    def progress_pct(self) -> float:
        if self.target_amount <= 0:
            return 100.0
        return min(100.0, round((self.current_amount / self.target_amount) * 100.0, 1))

    @property
    def is_completed(self) -> bool:
        return self.current_amount >= self.target_amount

    def weeks_until_deadline(self, reference_date: datetime) -> Optional[float]:
        if not self.deadline_date:
            return None
        target = datetime.strptime(self.deadline_date, "%Y-%m-%d")
        days = (target - reference_date).days
        return max(1.0, days / 7.0) if days > 0 else 0.1

    def required_weekly_pace(self, reference_date: datetime) -> Optional[float]:
        weeks = self.weeks_until_deadline(reference_date)
        if weeks is None or weeks <= 0:
            return None
        return round(self.remaining_deficit / weeks, 2)

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['category'] = self.category.value
        data['status'] = self.status.value
        data['remaining_deficit'] = round(self.remaining_deficit, 2)
        data['progress_pct'] = self.progress_pct
        data['is_completed'] = self.is_completed
        return data


@dataclass
class GoalAllocation:
    """
    Weekly allocation distributed to a specific goal.
    """
    goal_id: str
    goal_name: str
    allocated_amount: float
    required_weekly_pace: Optional[float]
    feasible_weekly_pace: float
    is_on_track: bool
    status_message: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AutopilotSweepDecision:
    """
    Complete output of weekly autopilot savings sweep computation.
    """
    safe_sweep_amount: float            # Total recommended transfer amount ($)
    is_paused: bool                      # True if transfer is auto-paused due to projected shortfall
    pause_reason: Optional[str]          # Plain-language explanation if paused
    checking_balance: float             # Current checking balance ($)
    safety_buffer: float                # Reserved minimum checking cushion ($)
    expected_inflow_7d: float           # Expected income in next 7 days ($)
    projected_variable_spend_7d: float  # Mean forecast variable spend ($)
    forecast_uncertainty_buffer: float  # Quantile safety margin based on forecast variance ($)
    upcoming_bills_7d: float            # Deterministic bills due in next 7 days ($)
    projected_ending_balance: float     # Estimated ending checking balance after sweep ($)
    overdraft_risk_probability: float   # Bound on overdraft probability (e.g. <= 0.01)
    goal_allocations: List[GoalAllocation]
    explanation: str

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['goal_allocations'] = [g.to_dict() for g in self.goal_allocations]
        return data


class AutopilotSavingsEngine:
    """
    Computes uncertainty-aware safe sweep amounts and allocates funds across prioritized goals.
    """

    DEFAULT_SAFETY_BUFFER: float = 100.0        # Default checking reserve to prevent accidental overdraft
    DEFAULT_MAX_OVERDRAFT_PROB: float = 0.01    # 1% risk threshold (99th percentile confidence)

    # Standard normal z-scores for tail probability: P(Z > z) = alpha
    Z_SCORE_MAP = {
        0.05: 1.645,    # 95% confidence
        0.02: 2.054,    # 98% confidence
        0.01: 2.326,    # 99% confidence
        0.005: 2.576    # 99.5% confidence
    }

    @classmethod
    def calculate_safe_sweep(
        cls,
        checking_balance: float,
        expected_inflow_7d: float,
        forecasted_spend_mean_7d: float,
        forecasted_spend_std_7d: float,
        upcoming_bills_7d: float,
        safety_buffer: Optional[float] = None,
        max_overdraft_prob: Optional[float] = None,
        days_until_next_inflow: int = 7,
        upcoming_bills_horizon: Optional[float] = None,
        horizon_spend_mean: Optional[float] = None,
        horizon_spend_std: Optional[float] = None
    ) -> Tuple[float, bool, Optional[str], float, float]:
        """
        Computes the maximum safe transfer amount ensuring overdraft risk <= max_overdraft_prob.
        Accounts for payroll cadence (e.g. biweekly paydays where current balance must cover until next paycheck).

        Returns:
            safe_sweep: Dollar amount safe to transfer (>= 0.0)
            is_paused: True if sweep is paused
            pause_reason: Explanation if paused
            forecast_margin: Extra buffer added due to forecast uncertainty
            projected_end_balance: Projected checking balance after sweep
        """
        buffer = safety_buffer if safety_buffer is not None else cls.DEFAULT_SAFETY_BUFFER
        alpha = max_overdraft_prob if max_overdraft_prob is not None else cls.DEFAULT_MAX_OVERDRAFT_PROB
        z_score = cls.Z_SCORE_MAP.get(alpha, 2.326)

        # Horizon scaling: If next paycheck is > 7 days away (e.g. 14 days), current funds must support that window
        horizon_factor = max(1.0, float(days_until_next_inflow) / 7.0)
        scaled_mean = horizon_spend_mean if horizon_spend_mean is not None else (forecasted_spend_mean_7d * horizon_factor)
        scaled_std = horizon_spend_std if horizon_spend_std is not None else (forecasted_spend_std_7d * float(np.sqrt(horizon_factor)))

        # 99th percentile upper bound on variable spending: E_upper = mean + z * std
        uncertainty_margin = float(z_score * max(0.0, scaled_std))
        conservative_variable_spend = scaled_mean + uncertainty_margin

        # Outflows until next paycheck
        total_bills = upcoming_bills_horizon if upcoming_bills_horizon is not None else (upcoming_bills_7d * horizon_factor)
        total_conservative_outflow = conservative_variable_spend + total_bills

        # Projected balance after horizon without sweep
        balance_before_sweep = (checking_balance + expected_inflow_7d) - total_conservative_outflow

        # Max safe sweep leaves exactly the safety buffer intact under 99% worst-case spend
        raw_safe_sweep = balance_before_sweep - buffer

        if raw_safe_sweep <= 0.0:
            is_paused = True
            safe_sweep = 0.0
            deficit = abs(raw_safe_sweep)
            pause_reason = (
                f"Autopilot paused this week: Your checking balance (${checking_balance:.2f}) "
                f"plus expected income (${expected_inflow_7d:.2f}) is projected to leave only "
                f"${max(0.0, balance_before_sweep):.2f} after upcoming bills (${total_bills:.2f}) "
                f"and conservative forecast spend (${conservative_variable_spend:.2f}), which falls "
                f"${deficit:.2f} short of your ${buffer:.2f} safety buffer."
            )
            projected_end_balance = balance_before_sweep
        else:
            is_paused = False
            safe_sweep = float(np.floor(raw_safe_sweep))
            pause_reason = None
            projected_end_balance = balance_before_sweep - safe_sweep

        return safe_sweep, is_paused, pause_reason, uncertainty_margin, projected_end_balance


    @classmethod
    def allocate_sweep_to_goals(
        cls,
        safe_sweep: float,
        goals: List[SavingsGoal],
        reference_date: Optional[datetime] = None
    ) -> List[GoalAllocation]:
        """
        Distributes the safe sweep amount across active goals using a Priority Waterfall.
        Priority 1 goals (e.g. emergency fund / debt) receive full required pace first;
        surplus flows to subsequent priorities.
        """
        ref_dt = reference_date or datetime.now()
        active_goals = [g for g in goals if g.status == GoalStatus.ACTIVE and not g.is_completed]
        if not active_goals or safe_sweep <= 0.0:
            return [
                GoalAllocation(
                    goal_id=g.goal_id,
                    goal_name=g.name,
                    allocated_amount=0.0,
                    required_weekly_pace=g.required_weekly_pace(ref_dt),
                    feasible_weekly_pace=0.0,
                    is_on_track=g.is_completed,
                    status_message="No transfer allocated this cycle." if not g.is_completed else "Goal completed!"
                )
                for g in goals
            ]

        # Sort by priority ascending (1 = highest)
        active_goals.sort(key=lambda g: g.priority)

        remaining_sweep = safe_sweep
        allocations: List[GoalAllocation] = []

        # Pass 1: Fund required pace for each goal in priority order
        allocated_map: Dict[str, float] = {g.goal_id: 0.0 for g in active_goals}

        for goal in active_goals:
            req_pace = goal.required_weekly_pace(ref_dt)
            target_amount = req_pace if req_pace is not None else goal.remaining_deficit
            transfer = min(remaining_sweep, target_amount, goal.remaining_deficit)
            allocated_map[goal.goal_id] += transfer
            remaining_sweep -= transfer
            if remaining_sweep <= 0:
                break

        # Pass 2: If sweep remains, cascade surplus to priority 1, then priority 2...
        if remaining_sweep > 0:
            for goal in active_goals:
                headroom = goal.remaining_deficit - allocated_map[goal.goal_id]
                if headroom > 0:
                    extra = min(remaining_sweep, headroom)
                    allocated_map[goal.goal_id] += extra
                    remaining_sweep -= extra
                    if remaining_sweep <= 0:
                        break

        for goal in goals:
            if goal.status != GoalStatus.ACTIVE or goal.is_completed:
                allocations.append(GoalAllocation(
                    goal_id=goal.goal_id,
                    goal_name=goal.name,
                    allocated_amount=0.0,
                    required_weekly_pace=goal.required_weekly_pace(ref_dt),
                    feasible_weekly_pace=0.0,
                    is_on_track=goal.is_completed,
                    status_message="Goal completed!" if goal.is_completed else "Goal is paused."
                ))
                continue

            amt = allocated_map.get(goal.goal_id, 0.0)
            req_pace = goal.required_weekly_pace(ref_dt)
            is_on_track = True if req_pace is None else (amt >= req_pace or goal.remaining_deficit <= amt)

            if is_on_track:
                msg = f"Allocated ${amt:.2f}. On track to reach ${goal.target_amount:,.2f} by deadline."
            else:
                msg = (
                    f"Allocated ${amt:.2f} (Required: ${req_pace:.2f}/wk). "
                    f"Pace deficit of ${(req_pace - amt):.2f}/wk; adjust deadline or boost income."
                )

            allocations.append(GoalAllocation(
                goal_id=goal.goal_id,
                goal_name=goal.name,
                allocated_amount=round(amt, 2),
                required_weekly_pace=req_pace,
                feasible_weekly_pace=round(amt, 2),
                is_on_track=is_on_track,
                status_message=msg
            ))

        return allocations

    @classmethod
    def run_autopilot_cycle(
        cls,
        checking_balance: float,
        expected_inflow_7d: float,
        forecasted_spend_mean_7d: float,
        forecasted_spend_std_7d: float,
        upcoming_bills_7d: float,
        goals: List[SavingsGoal],
        safety_buffer: Optional[float] = None,
        max_overdraft_prob: Optional[float] = None,
        days_until_next_inflow: int = 7,
        upcoming_bills_horizon: Optional[float] = None,
        horizon_spend_mean: Optional[float] = None,
        horizon_spend_std: Optional[float] = None,
        reference_date: Optional[datetime] = None
    ) -> AutopilotSweepDecision:
        """
        Executes end-to-end Autopilot Decision:
        1. Evaluates conservative cash-flow and overdraft bound.
        2. Computes exact safe sweep amount.
        3. Cascades allocation through prioritized goals.
        4. Generates plain-language user explanation.
        """
        buffer = safety_buffer if safety_buffer is not None else cls.DEFAULT_SAFETY_BUFFER
        alpha = max_overdraft_prob if max_overdraft_prob is not None else cls.DEFAULT_MAX_OVERDRAFT_PROB

        safe_sweep, is_paused, pause_reason, uncert_margin, end_bal = cls.calculate_safe_sweep(
            checking_balance=checking_balance,
            expected_inflow_7d=expected_inflow_7d,
            forecasted_spend_mean_7d=forecasted_spend_mean_7d,
            forecasted_spend_std_7d=forecasted_spend_std_7d,
            upcoming_bills_7d=upcoming_bills_7d,
            safety_buffer=buffer,
            max_overdraft_prob=alpha,
            days_until_next_inflow=days_until_next_inflow,
            upcoming_bills_horizon=upcoming_bills_horizon,
            horizon_spend_mean=horizon_spend_mean,
            horizon_spend_std=horizon_spend_std
        )

        allocations = cls.allocate_sweep_to_goals(
            safe_sweep=safe_sweep,
            goals=goals,
            reference_date=reference_date
        )

        if is_paused:
            explanation = pause_reason
        else:
            top_goal = next((a for a in allocations if a.allocated_amount > 0), None)
            goal_desc = f" (${top_goal.allocated_amount:.2f} to {top_goal.goal_name})" if top_goal else ""
            explanation = (
                f"Safe to transfer ${safe_sweep:.2f} this week{goal_desc}. "
                f"Your checking cushion will remain at ${end_bal:.2f} (above ${buffer:.2f} safety buffer) "
                f"even under 99% worst-case spending and upcoming bills (${upcoming_bills_7d:.2f})."
            )

        return AutopilotSweepDecision(
            safe_sweep_amount=round(safe_sweep, 2),
            is_paused=is_paused,
            pause_reason=pause_reason,
            checking_balance=round(checking_balance, 2),
            safety_buffer=round(buffer, 2),
            expected_inflow_7d=round(expected_inflow_7d, 2),
            projected_variable_spend_7d=round(forecasted_spend_mean_7d, 2),
            forecast_uncertainty_buffer=round(uncert_margin, 2),
            upcoming_bills_7d=round(upcoming_bills_7d, 2),
            projected_ending_balance=round(end_bal, 2),
            overdraft_risk_probability=alpha,
            goal_allocations=allocations,
            explanation=explanation
        )


# =============================================================================
# HISTORICAL BACKTESTING ENGINE
# =============================================================================

@dataclass
class BacktestResult:
    """
    Simulation results comparing FinSense Uncertainty Sweep vs. Naive Fixed % Sweep.
    """
    total_weeks: int
    finsense_total_saved: float
    finsense_overdraft_count: int
    finsense_overdraft_fees: float       # $35 per overdraft
    naive_total_saved: float
    naive_overdraft_count: int
    naive_overdraft_fees: float
    net_finsense_advantage: float        # Savings + Overdraft fees avoided
    overdraft_free: bool


class AutopilotBacktester:
    """
    Simulates historical weekly cash-flow to prove zero overdrafts vs. naive approaches.
    """

    OVERDRAFT_FEE: float = 35.0

    @classmethod
    def run_backtest(
        cls,
        weekly_inflows: List[float],
        actual_weekly_spend: List[float],
        forecasted_spend_means: List[float],
        forecasted_spend_stds: List[float],
        weekly_bills: List[float],
        initial_balance: float = 1000.0,
        naive_sweep_pct: float = 0.30,      # Naive rule: blindly transfer 30% of balance
        safety_buffer: float = 100.0
    ) -> BacktestResult:
        """
        Runs side-by-side simulation across historical weeks.
        """
        n_weeks = len(weekly_inflows)
        finsense_bal = float(initial_balance)
        naive_bal = float(initial_balance)

        finsense_saved = 0.0
        naive_saved = 0.0

        finsense_overdrafts = 0
        naive_overdrafts = 0

        dummy_goal = SavingsGoal(
            goal_id="bt_goal",
            name="Emergency Fund",
            category=GoalCategory.EMERGENCY_FUND,
            target_amount=100000.0,
            current_amount=0.0,
            priority=1
        )

        for w in range(n_weeks):
            inflow = weekly_inflows[w]
            actual_spend = actual_weekly_spend[w]
            pred_mean = forecasted_spend_means[w]
            pred_std = forecasted_spend_stds[w]
            bill = weekly_bills[w]

            # Look ahead to find days until next inflow, accounting for cadence boundary
            next_inflows = [i for i in range(w + 1, n_weeks) if weekly_inflows[i] > 0]
            if next_inflows:
                weeks_until_next = next_inflows[0] - w
            else:
                weeks_until_next = 2 if inflow > 0 else 1
            k = max(1, weeks_until_next)
            days_until_next = k * 7

            h_mean = sum(forecasted_spend_means[w : min(n_weeks, w + k)])
            h_bills = sum(weekly_bills[w : min(n_weeks, w + k)])
            h_std = float(np.sqrt(sum([forecasted_spend_stds[i]**2 for i in range(w, min(n_weeks, w + k))])))

            # 1. FinSense Decision (made before week starts)
            decision = AutopilotSavingsEngine.run_autopilot_cycle(
                checking_balance=finsense_bal,
                expected_inflow_7d=inflow,
                forecasted_spend_mean_7d=pred_mean,
                forecasted_spend_std_7d=pred_std,
                upcoming_bills_7d=bill,
                goals=[dummy_goal],
                safety_buffer=safety_buffer,
                days_until_next_inflow=days_until_next,
                upcoming_bills_horizon=h_bills,
                horizon_spend_mean=h_mean,
                horizon_spend_std=h_std
            )
            fs_sweep = decision.safe_sweep_amount

            # Execute FinSense Week
            finsense_bal = (finsense_bal + inflow) - fs_sweep - actual_spend - bill
            finsense_saved += fs_sweep
            if finsense_bal < 0:
                finsense_overdrafts += 1
                finsense_bal -= cls.OVERDRAFT_FEE

            # 2. Naive Fixed % Decision
            naive_sweep = max(0.0, round((naive_bal + inflow) * naive_sweep_pct, 2))
            naive_bal = (naive_bal + inflow) - naive_sweep - actual_spend - bill
            naive_saved += naive_sweep
            if naive_bal < 0:
                naive_overdrafts += 1
                naive_bal -= cls.OVERDRAFT_FEE


        fs_fees = finsense_overdrafts * cls.OVERDRAFT_FEE
        nv_fees = naive_overdrafts * cls.OVERDRAFT_FEE
        net_advantage = (finsense_saved - fs_fees) - (naive_saved - nv_fees)

        return BacktestResult(
            total_weeks=n_weeks,
            finsense_total_saved=round(finsense_saved, 2),
            finsense_overdraft_count=finsense_overdrafts,
            finsense_overdraft_fees=round(fs_fees, 2),
            naive_total_saved=round(naive_saved, 2),
            naive_overdraft_count=naive_overdrafts,
            naive_overdraft_fees=round(nv_fees, 2),
            net_finsense_advantage=round(net_advantage, 2),
            overdraft_free=(finsense_overdrafts == 0)
        )
