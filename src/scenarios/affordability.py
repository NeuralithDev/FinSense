"""
Affordability Assessment Engine for FinSense.

Answers:
- Can I afford this recurring EMI or loan?
- How long until I achieve my target emergency cushion?
- What is the maximum safe lump-sum purchase I can make today?
"""

from typing import Dict, Any, Optional
import numpy as np


class AffordabilityEngine:
    """
    Evaluates loan eligibility, credit limits, and purchase affordability.
    """
    DEFAULT_MAX_DTI: float = 0.36       # 36% standard mortgage / prime borrowing ceiling
    CRITICAL_MAX_DTI: float = 0.50      # 50% distressed debt ceiling

    @classmethod
    def can_afford_loan(
        cls,
        monthly_income: float,
        current_emi: float,
        proposed_emi: float,
        max_dti: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Determines whether a proposed new monthly debt obligation satisfies safe DTI constraints.
        """
        income = max(float(monthly_income), 1.0)
        current_dti = float(current_emi) / income
        total_emi = float(current_emi) + float(proposed_emi)
        projected_dti = total_emi / income

        dti_ceiling = max_dti if max_dti is not None else cls.DEFAULT_MAX_DTI
        is_affordable = projected_dti <= dti_ceiling

        return {
            "is_affordable": is_affordable,
            "monthly_income": monthly_income,
            "current_emi": current_emi,
            "proposed_emi": proposed_emi,
            "current_dti": round(current_dti, 4),
            "projected_dti": round(projected_dti, 4),
            "dti_ceiling": round(dti_ceiling, 4),
            "max_affordable_emi": max(0.0, round((dti_ceiling * income) - current_emi, 2)),
            "verdict": (
                f"Approved: Projected DTI of {projected_dti*100:.1f}% is within safe limit of {dti_ceiling*100:.1f}%."
                if is_affordable else
                f"Declined: Projected DTI of {projected_dti*100:.1f}% exceeds safe ceiling of {dti_ceiling*100:.1f}%."
            )
        }

    @classmethod
    def months_to_goal(
        cls,
        current_savings: float,
        target_savings: float,
        monthly_contribution: float
    ) -> Dict[str, Any]:
        """
        Calculates time required to reach a target emergency buffer or savings milestone.
        """
        current = max(0.0, float(current_savings))
        target = max(0.0, float(target_savings))
        contribution = float(monthly_contribution)

        if current >= target:
            return {
                "achieved": True,
                "months_required": 0.0,
                "remaining_deficit": 0.0,
                "message": "Savings goal already reached!"
            }

        deficit = target - current
        if contribution <= 0.0:
            return {
                "achieved": False,
                "months_required": float("inf"),
                "remaining_deficit": round(deficit, 2),
                "message": "Monthly contribution is zero or negative. Goal cannot be achieved without surplus cash flow."
            }

        months = deficit / contribution
        return {
            "achieved": False,
            "months_required": round(months, 1),
            "remaining_deficit": round(deficit, 2),
            "message": f"{months:.1f} months required to reach ${target:,.2f} at ${contribution:,.2f}/month."
        }

    @classmethod
    def max_safe_lump_sum_purchase(
        cls,
        liquid_savings: float,
        monthly_expenses: float,
        min_reserve_months: float = 3.0
    ) -> Dict[str, Any]:
        """
        Determines the maximum lump-sum outlay that can be spent today
        without dipping into the user's minimum emergency reserve buffer.
        """
        savings = max(0.0, float(liquid_savings))
        burn = max(1.0, float(monthly_expenses))
        required_reserve = burn * min_reserve_months
        max_safe_spend = max(0.0, savings - required_reserve)

        return {
            "liquid_savings": round(savings, 2),
            "required_reserve": round(required_reserve, 2),
            "min_reserve_months": min_reserve_months,
            "max_safe_spend": round(max_safe_spend, 2),
            "can_spend": max_safe_spend > 0.0
        }
