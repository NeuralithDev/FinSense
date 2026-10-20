"""
Final Unified Financial State & Health Scoring Engine for FinSense.

Fuses three complementary data dimensions:
1. IBM Credit Card Behavior (Spending volatility, merchant category diversity, digital/swipe habits)
2. Financial Profiles (FICO score, income, debt-to-income, liquid emergency savings)
3. PaySim Cash-Flow Dynamics (Account depletion rate, inflow/outflow replenishment, liquidity stress)

Answers the 5 core FinSense questions:
- What happened to my money?
- Why is it happening?
- How healthy is my financial posture (0-100 score)?
- What spending persona do I belong to?
- What active risks/anomalies require attention?
"""

from dataclasses import dataclass, asdict, field
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

@dataclass
class UserFinancialState:
    """
    Unified, explainable representation of a user's complete financial posture.
    """
    user_id: str
    health_score: float                     # 0 to 100 overall composite score
    health_tier: str                       # EXCELLENT, STABLE, VULNERABLE, CRITICAL
    
    # 4 Foundational Pillars (0 to 25 points each)
    credit_pillar: float                   # Solvency: FICO / Credit Score
    debt_pillar: float                     # Leverage: Debt-To-Income (DTI) ratio
    liquidity_pillar: float                # Buffer: Emergency savings runway months
    discipline_pillar: float               # Stability: Budget diversity, shock control & cash replenishment
    
    # Core Financial Metrics
    monthly_income: float                  # Monthly income ($)
    monthly_burn_rate: float               # Monthly expenses / card spending ($)
    net_cash_flow: float                   # Monthly cash flow surplus/deficit ($)
    runway_months: float                   # Emergency fund cushion (months)
    
    # Behavioral & Cash-Flow Risk Indicators
    largest_category_share: float          # Spending concentration in top MCC
    shock_ratio: float                     # Max purchase / average ticket
    cash_depletion_risk: float             # Rate of draining account balance to $0
    inflow_replenishment_ratio: float      # Inflows / Outflows replenishment rate
    
    # Classification & Actionable Triggers
    persona: str                           # Inferred behavioral persona archetype
    risk_alerts: List[str] = field(default_factory=list)  # Triggered warnings for recommendations
    explanations: List[str] = field(default_factory=list) # Plain-language explanations for AI assistant

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class FinancialStateEngine:
    """
    Unified Multi-Dataset Scoring & State Assembly Engine.
    """

    @classmethod
    def fuse_and_score(
        cls,
        user_id: str,
        ibm_features: Optional[Dict[str, Any]] = None,
        fin_profile: Optional[Dict[str, Any]] = None,
        paysim_features: Optional[Dict[str, Any]] = None
    ) -> UserFinancialState:
        """
        Fuses data from IBM, Financial Profile, and PaySim into a single UserFinancialState.
        Handles missing components gracefully with reasonable defaults.
        """
        ibm = ibm_features or {}
        fin = fin_profile or {}
        pay = paysim_features or {}

        risk_alerts = []
        explanations = []

        # =========================================================================
        # PILLAR 1: Solvency & Credit Profile (0 - 25 points)
        # =========================================================================
        raw_credit = float(fin.get("credit_score", fin.get("FICO Score", 680)))
        credit_norm = np.clip((raw_credit - 300.0) / (850.0 - 300.0), 0.0, 1.0)
        credit_pts = float(credit_norm * 25.0)

        if raw_credit >= 740:
            explanations.append(f"Excellent credit score ({int(raw_credit)}) secures prime borrowing rates.")
        elif raw_credit < 580:
            risk_alerts.append("POOR_CREDIT_SCORE")
            explanations.append(f"Credit score ({int(raw_credit)}) is in subprime territory, restricting credit access.")

        # =========================================================================
        # PILLAR 2: Leverage & Debt Burden (0 - 25 points)
        # =========================================================================
        dti = float(fin.get("debt_to_income_ratio", 0.20))
        # 0% DTI = 25 pts; 36% DTI = 7 pts; >= 50% DTI = 0 pts
        dti_factor = np.clip(1.0 - (dti / 0.50), 0.0, 1.0)
        debt_pts = float(dti_factor * 25.0)

        if dti > 0.43:
            risk_alerts.append("CRITICAL_DEBT_BURDEN")
            explanations.append(f"Debt-to-Income ratio of {dti*100:.1f}% exceeds healthy lending standards (max 36%).")
        elif dti <= 0.20:
            explanations.append(f"Low debt obligation ({dti*100:.1f}% DTI) provides strong borrowing flexibility.")

        # =========================================================================
        # PILLAR 3: Liquidity & Emergency Cushion (0 - 25 points)
        # =========================================================================
        monthly_income = float(fin.get("monthly_income_usd", 4500.0))
        monthly_expenses = float(fin.get("monthly_expenses_usd", ibm.get("monthly_spending", 3200.0)))
        savings = float(fin.get("savings_usd", 12000.0))
        
        runway_months = savings / max(monthly_expenses, 1.0)
        liquidity_norm = np.clip(runway_months / 6.0, 0.0, 1.0)  # Capped at 6 months
        liquidity_pts = float(liquidity_norm * 25.0)

        if runway_months < 1.0:
            risk_alerts.append("LIQUIDITY_DEFICIT")
            explanations.append(f"Critical liquidity risk: Emergency fund only covers {runway_months:.1f} months of expenses.")
        elif runway_months >= 6.0:
            explanations.append(f"Robust liquidity cushion: {runway_months:.1f} months of expenses saved.")

        # =========================================================================
        # PILLAR 4: Behavioral Discipline & Cash-Flow Stability (0 - 25 points)
        # Fuses IBM spending patterns with PaySim cash depletion & replenishment
        # =========================================================================
        discipline_pts = 25.0

        # A. IBM Category Concentration Check
        category_share = float(ibm.get("largest_category_share", 0.16))
        if category_share > 0.50:
            discipline_pts -= 5.0
            risk_alerts.append("CATEGORY_CONCENTRATION_ALERT")
            explanations.append(f"High budget risk: {category_share*100:.1f}% of spending concentrated in a single category.")
        elif category_share > 0.35:
            discipline_pts -= 2.5

        # B. IBM Shock Multiplier Check
        avg_tx = float(ibm.get("average_transaction", 40.0))
        max_tx = float(ibm.get("max_transaction", 1000.0))
        shock_ratio = float(ibm.get("shock_ratio", max_tx / max(avg_tx, 1.0)))
        if shock_ratio > 60.0:
            discipline_pts -= 5.0
            risk_alerts.append("HIGH_SPENDING_VOLATILITY")
            explanations.append(f"Spending volatility: Max purchase is {shock_ratio:.1f}x higher than average ticket.")
        elif shock_ratio > 35.0:
            discipline_pts -= 2.5

        # C. PaySim Cash-Flow Depletion Check (Zero-Balance Crisis)
        depletion_risk = float(pay.get("cash_depletion_risk", pay.get("balance_depletion_ratio", 0.05)))
        if depletion_risk > 0.30:
            discipline_pts -= 5.0
            risk_alerts.append("CHRONIC_CASH_DEPLETION")
            explanations.append(f"PaySim liquidity alert: {depletion_risk*100:.1f}% of transactions deplete balance to $0.")
        elif depletion_risk > 0.15:
            discipline_pts -= 2.5

        # D. PaySim Inflow Replenishment Check
        inflow_ratio = float(pay.get("inflow_to_outflow_ratio", 1.05))
        if inflow_ratio < 0.85:
            discipline_pts -= 5.0
            risk_alerts.append("INFLOW_DEFICIT")
            explanations.append(f"Cash replenishment warning: Inflows cover only {inflow_ratio*100:.1f}% of cash outflows.")

        discipline_pts = float(np.clip(discipline_pts, 0.0, 25.0))

        # =========================================================================
        # Composite Score & Tier
        # =========================================================================
        total_score = round(credit_pts + debt_pts + liquidity_pts + discipline_pts, 1)

        if total_score >= 80.0:
            tier = "EXCELLENT"
        elif total_score >= 60.0:
            tier = "STABLE"
        elif total_score >= 40.0:
            tier = "VULNERABLE"
        else:
            tier = "CRITICAL"

        # =========================================================================
        # Inferred Behavioral Persona
        # =========================================================================
        online_ratio = float(ibm.get("online_transaction_ratio", 0.06))
        daily_freq = float(ibm.get("daily_frequency", 2.6))
        net_cash_flow = round(monthly_income - monthly_expenses, 2)

        if depletion_risk > 0.30 or runway_months < 1.5:
            persona = "Cash-Flow Constrained"
        elif online_ratio >= 0.20:
            persona = "Digital E-Commerce Native"
        elif daily_freq >= 5.0:
            persona = "High-Velocity Daily Spender"
        elif avg_tx >= 75.0:
            persona = "Bulk / Large-Ticket Spender"
        elif runway_months >= 6.0 and dti < 0.25:
            persona = "Asset-Rich Steady Conservative"
        else:
            persona = "Balanced Household Spender"

        return UserFinancialState(
            user_id=str(user_id),
            health_score=total_score,
            health_tier=tier,
            credit_pillar=round(credit_pts, 1),
            debt_pillar=round(debt_pts, 1),
            liquidity_pillar=round(liquidity_pts, 1),
            discipline_pillar=round(discipline_pts, 1),
            monthly_income=round(monthly_income, 2),
            monthly_burn_rate=round(monthly_expenses, 2),
            net_cash_flow=net_cash_flow,
            runway_months=round(runway_months, 1),
            largest_category_share=round(category_share, 3),
            shock_ratio=round(shock_ratio, 1),
            cash_depletion_risk=round(depletion_risk, 3),
            inflow_replenishment_ratio=round(inflow_ratio, 2),
            persona=persona,
            risk_alerts=risk_alerts,
            explanations=explanations
        )

    @classmethod
    def batch_score(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Scores an entire DataFrame of users in vectorised / batch mode.
        Returns a DataFrame of UserFinancialState records.
        """
        states = []
        for _, row in df.iterrows():
            user_id = row.get("User", row.get("user_id", row.get("nameOrig", "Unknown")))
            state = cls.fuse_and_score(
                user_id=str(user_id),
                ibm_features=row.to_dict(),
                fin_profile=row.to_dict(),
                paysim_features=row.to_dict()
            )
            states.append(state.to_dict())
        return pd.DataFrame(states)
