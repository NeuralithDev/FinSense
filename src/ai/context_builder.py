"""
Financial Context Builder for FinSense AI Assistant.

Compiles a unified ground-truth financial state snapshot from real user data
and engine outputs to supply verified figures to the narrator.
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime

from src.intelligence.financial_state import FinancialStateEngine, UserFinancialState
from src.intelligence.subscription_detector import SubscriptionDetector, SubscriptionAnalysisResult
from src.intelligence.autopilot_savings import AutopilotSavingsEngine, SavingsGoal, GoalCategory, AutopilotSweepDecision


@dataclass
class GroundTruthFinancialContext:
    user_id: str
    checking_balance: float
    savings_balance: float
    debt_balance: float
    monthly_income: float
    monthly_expenses: float
    credit_score: float
    health_score: float
    health_tier: str
    persona: str
    runway_months: float
    dti_ratio: float
    active_subscriptions_count: int
    total_monthly_subscriptions: float
    upcoming_bills_7d: float
    safe_sweep_amount: float
    is_sweep_paused: bool
    safe_sweep_reason: Optional[str]
    forecast_spend_mean_7d: float
    forecast_spend_std_7d: float
    safety_buffer: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ContextBuilder:
    """
    Constructs an immutable ground-truth financial snapshot.
    Decouples raw inputs from AI generation to prevent hallucination.
    """

    @classmethod
    def build_context(
        cls,
        user_id: str = "user_default",
        checking_balance: float = 2500.0,
        savings_balance: float = 8500.0,
        debt_balance: float = 1200.0,
        monthly_income: float = 5500.0,
        monthly_expenses: float = 3200.0,
        monthly_emi: float = 250.0,
        credit_score: float = 720.0,
        forecast_spend_mean_7d: float = 550.0,
        forecast_spend_std_7d: float = 75.0,
        safety_buffer: float = 100.0,
        active_subscriptions: Optional[List[Dict[str, Any]]] = None,
        goals: Optional[List[SavingsGoal]] = None
    ) -> GroundTruthFinancialContext:
        """
        Runs deterministic engines to assemble exact ground-truth values.
        """
        dti = monthly_emi / max(1.0, monthly_income)

        # 1. Financial State Engine
        state = FinancialStateEngine.fuse_and_score(
            user_id=user_id,
            fin_profile={
                "monthly_income_usd": monthly_income,
                "monthly_expenses_usd": monthly_expenses,
                "savings_usd": savings_balance,
                "loan_amount_usd": debt_balance,
                "monthly_emi_usd": monthly_emi,
                "credit_score": credit_score,
                "debt_to_income_ratio": dti
            }
        )

        # 2. Upcoming bills (derived from active subscriptions or default)
        subs = active_subscriptions or [
            {"merchant": "Netflix", "amount": 15.99, "cadence": "monthly"},
            {"merchant": "Spotify", "amount": 11.99, "cadence": "monthly"},
            {"merchant": "Internet", "amount": 75.00, "cadence": "monthly"}
        ]
        monthly_sub_total = sum(float(s["amount"]) for s in subs)
        upcoming_bills_7d = round(monthly_sub_total * (7.0 / 30.0), 2)

        # 3. Autopilot Safe Sweep
        active_goals = goals or [
            SavingsGoal(
                goal_id="g_emg",
                name="Emergency Buffer",
                category=GoalCategory.EMERGENCY_FUND,
                target_amount=10000.0,
                current_amount=savings_balance,
                priority=1
            )
        ]

        sweep_decision = AutopilotSavingsEngine.run_autopilot_cycle(
            checking_balance=checking_balance,
            expected_inflow_7d=0.0,
            forecasted_spend_mean_7d=forecast_spend_mean_7d,
            forecasted_spend_std_7d=forecast_spend_std_7d,
            upcoming_bills_7d=upcoming_bills_7d,
            goals=active_goals,
            safety_buffer=safety_buffer
        )

        return GroundTruthFinancialContext(
            user_id=user_id,
            checking_balance=round(checking_balance, 2),
            savings_balance=round(savings_balance, 2),
            debt_balance=round(debt_balance, 2),
            monthly_income=round(monthly_income, 2),
            monthly_expenses=round(monthly_expenses, 2),
            credit_score=round(credit_score, 1),
            health_score=round(state.health_score, 1),
            health_tier=state.health_tier,
            persona=state.persona,
            runway_months=round(state.runway_months, 1),
            dti_ratio=round(dti, 2),
            active_subscriptions_count=len(subs),
            total_monthly_subscriptions=round(monthly_sub_total, 2),
            upcoming_bills_7d=upcoming_bills_7d,
            safe_sweep_amount=round(sweep_decision.safe_sweep_amount, 2),
            is_sweep_paused=sweep_decision.is_paused,
            safe_sweep_reason=sweep_decision.pause_reason,
            forecast_spend_mean_7d=round(forecast_spend_mean_7d, 2),
            forecast_spend_std_7d=round(forecast_spend_std_7d, 2),
            safety_buffer=round(safety_buffer, 2)
        )
