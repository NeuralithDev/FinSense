"""
What-If Scenarios & Purchase Affordability API Router.
Grounded directly in the user's live checking & savings balances.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
import numpy as np
from app.schemas import AffordabilityRequest, AffordabilityResponse
from src.scenarios.affordability import AffordabilityEngine
from src.scenarios.scenario_engine import ScenarioEngine
from src.data.user_pipeline import UserDataPipeline

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios & Affordability"])


@router.post("/afford", response_model=AffordabilityResponse)
def evaluate_purchase_affordability(request: AffordabilityRequest):
    """
    Answers FinSense Question 4: "Can I afford it?"
    Simulates the counterfactual impact of an immediate purchase on:
    - Checking cushion vs safety buffer
    - Remaining emergency runway
    - Overdraft risk under forecast volatility
    """
    try:
        pipeline = UserDataPipeline.get_instance()
        curr = pipeline.accounts.get("checking", {}).get("currency", "INR")
        sym = "₹" if curr == "INR" else "$"

        cost = float(request.purchase_amount)
        # Pull real account balances from pipeline if defaults passed
        checking = float(pipeline.accounts.get("checking", {}).get("balance", request.checking_balance))
        savings = float(pipeline.accounts.get("savings", {}).get("balance", 0.0))
        buffer = float(request.safety_buffer or 2000.0)
        
        # Monthly burn rate
        burn = max(1000.0, float(request.monthly_fixed_bills + request.forecasted_monthly_spend_mean))

        # Conservative monthly spend including 95% variance
        conservative_outflow = request.monthly_fixed_bills + request.forecasted_monthly_spend_mean + (1.96 * request.forecasted_monthly_spend_std)
        monthly_net_surplus = max(100.0, request.monthly_income - conservative_outflow)

        # Max safe spend directly from checking account while preserving safety buffer
        max_safe_checking = max(0.0, checking - buffer)
        
        # Max safe lump sum purchase across liquid savings without compromising 1.5-month minimum reserve
        res = AffordabilityEngine.max_safe_lump_sum_purchase(
            liquid_savings=savings + checking,
            monthly_expenses=burn,
            min_reserve_months=1.5
        )
        max_safe_total = res["max_safe_spend"]
        max_safe = max(max_safe_checking, min(max_safe_total, 35000.0 if curr == "INR" else 1500.0))

        # Calculate checking balance after immediate purchase
        checking_remaining = checking - cost
        cushion_above_buffer = checking_remaining - buffer

        # Pre-purchase and post-purchase runway
        total_liquid_before = checking + savings
        total_liquid_after = max(0.0, total_liquid_before - cost)
        runway_before_weeks = (total_liquid_before / burn) * 4.33
        runway_after_weeks = (total_liquid_after / burn) * 4.33
        runway_impact = max(0.0, runway_before_weeks - runway_after_weeks)

        # Verdict logic
        if checking_remaining >= buffer:
            verdict = "AFFORDABLE"
            rec = (
                f"Yes, you can comfortably afford {request.item_name} ({sym}{cost:,.2f}) directly from checking. "
                f"Your checking cushion will stay at {sym}{checking_remaining:,.2f} (above your {sym}{buffer:,.2f} safety buffer)."
            )
            alt = None
        elif checking_remaining >= 0.0:
            verdict = "STRETCH"
            rec = (
                f"{request.item_name} ({sym}{cost:,.2f}) is a stretch purchase. "
                f"It leaves only {sym}{checking_remaining:,.2f} in checking (dips into your {sym}{buffer:,.2f} safety buffer). "
                f"Upcoming daily expenses may cause cashflow friction before your next income credit."
            )
            weeks_wait = max(1, int(np.ceil(cost / monthly_net_surplus)))
            alt = f"Consider waiting {weeks_wait} week{'s' if weeks_wait > 1 else ''} to cash-flow this from monthly surplus."
        elif total_liquid_after >= burn and savings > 0:
            verdict = "STRETCH"
            rec = (
                f"{request.item_name} ({sym}{cost:,.2f}) exceeds your current checking balance ({sym}{checking:,.2f}) by {sym}{abs(checking_remaining):,.2f}. "
                f"You have {sym}{savings:,.2f} in liquid reserves to back it, but spending today will require an inter-account reserve transfer."
            )
            alt = f"Maximum safe debit from checking today is {sym}{max_safe_checking:,.2f}. Transfer {sym}{abs(checking_remaining):,.2f} from reserves or set a savings goal."
        else:
            verdict = "UNAFFORDABLE"
            rec = (
                f"Not recommended right now: Purchasing {request.item_name} ({sym}{cost:,.2f}) exceeds checking balance ({sym}{checking:,.2f}) by {sym}{abs(checking_remaining):,.2f} "
                f"and drops total reserves below your safe minimum cushion."
            )
            alt = f"Safe checking spend limit today is {sym}{max_safe_checking:,.2f}. We recommend setting a savings goal for this purchase."

        return AffordabilityResponse(
            item_name=request.item_name,
            purchase_amount=round(cost, 2),
            verdict=verdict,
            max_safe_purchase=round(max_safe, 2),
            projected_checking_remaining=round(max(0.0, checking_remaining), 2),
            cushion_above_buffer=round(cushion_above_buffer, 2),
            runway_impact_weeks=round(runway_impact, 1),
            recommendation=rec,
            alternative_suggestion=alt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Affordability calculation error: {str(e)}")


@router.post("/simulate")
def simulate_scenario(payload: Dict[str, Any]):
    """
    Simulates multi-month financial trajectories under hypothetical shocks or commitments.
    """
    try:
        trajectory = ScenarioEngine.simulate_trajectory(
            initial_savings=float(payload.get("initial_savings", 5000.0)),
            monthly_income=float(payload.get("monthly_income", 4000.0)),
            monthly_expenses=float(payload.get("monthly_expenses", 2500.0)),
            current_monthly_emi=float(payload.get("current_monthly_emi", 300.0)),
            horizon_months=int(payload.get("horizon_months", 12)),
            income_delta_pct=float(payload.get("income_delta_pct", 0.0)),
            expense_delta_pct=float(payload.get("expense_delta_pct", 0.0)),
            new_recurring_commitment=float(payload.get("new_recurring_commitment", 0.0)),
            one_time_expenses=payload.get("one_time_expenses")
        )
        return trajectory
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario simulation error: {str(e)}")
