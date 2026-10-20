"""
What-If Scenario Simulation Engine for FinSense.

Answers FinSense Question 5: "What if I make a different decision?"
Simulates multi-month financial trajectories under hypothetical shocks or commitments:
- Career changes (income raises or salary cuts)
- Cost-of-living adjustments (rent or inflation increases)
- New recurring commitments (auto loans, mortgages, childcare)
- Unforeseen one-time expenses (medical emergencies, car repairs)
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


class ScenarioEngine:
    """
    Dynamic forward-looking financial simulator.
    """

    @classmethod
    def simulate_trajectory(
        cls,
        initial_savings: float,
        monthly_income: float,
        monthly_expenses: float,
        current_monthly_emi: float = 0.0,
        horizon_months: int = 12,
        income_delta_pct: float = 0.0,
        expense_delta_pct: float = 0.0,
        new_recurring_commitment: float = 0.0,
        one_time_expenses: Optional[Dict[int, float]] = None
    ) -> Dict[str, Any]:
        """
        Simulates month-by-month cash flow and reserve balance over the specified horizon.
        
        Args:
            initial_savings: Liquid buffer at month 0 ($)
            monthly_income: Base monthly take-home pay ($)
            monthly_expenses: Base non-debt monthly burn ($)
            current_monthly_emi: Existing debt payments ($)
            horizon_months: Number of months to project forward
            income_delta_pct: Percentage change to income (e.g., -0.10 for 10% pay cut)
            expense_delta_pct: Percentage change to living expenses (e.g., +0.15 for rent hike)
            new_recurring_commitment: Additional monthly cost (e.g., car loan payment)
            one_time_expenses: Map of {month_number: dollar_amount} for one-off shocks
        """
        shocks = one_time_expenses or {}
        records = []
        balance = float(initial_savings)

        adjusted_income = max(0.0, monthly_income * (1.0 + income_delta_pct))
        adjusted_expenses = max(0.0, monthly_expenses * (1.0 + expense_delta_pct))
        total_debt = current_monthly_emi + new_recurring_commitment

        deficit_months = 0
        min_balance = balance

        for m in range(1, horizon_months + 1):
            one_off = shocks.get(m, 0.0)
            total_outflow = adjusted_expenses + total_debt + one_off
            net_flow = adjusted_income - total_outflow
            balance += net_flow
            min_balance = min(min_balance, balance)

            runway = max(0.0, balance / max(total_outflow, 1.0))
            if net_flow < 0:
                deficit_months += 1

            records.append({
                "month": m,
                "income": round(adjusted_income, 2),
                "expenses": round(total_outflow, 2),
                "net_cash_flow": round(net_flow, 2),
                "ending_balance": round(balance, 2),
                "runway_months": round(runway, 1)
            })

        trajectory_df = pd.DataFrame(records)

        # Impact on financial health
        net_savings_change = balance - initial_savings
        is_solvent = balance > 0

        return {
            "horizon_months": horizon_months,
            "initial_savings": round(initial_savings, 2),
            "final_savings": round(balance, 2),
            "net_savings_change": round(net_savings_change, 2),
            "min_projected_balance": round(min_balance, 2),
            "deficit_months_count": deficit_months,
            "is_solvent": is_solvent,
            "trajectory": trajectory_df
        }
