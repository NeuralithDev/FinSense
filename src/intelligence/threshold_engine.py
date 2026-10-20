"""
Threshold Engine for FinSense.

Encapsulates empirical cutoffs and rule-based logic derived from EDA across:
1. IBM Credit Card Transactions (Spending volatility & category concentration)
2. Financial Profiles (DTI, Credit, and Emergency Runway)
3. PaySim Mobile Money (Cash-flow replenishment & account depletion risk)
"""

from typing import Dict, Any


class FinancialThresholdEngine:
    """
    Evaluates transactions, budget diversity, emergency reserves, and cash-flow depletion.
    """

    # --- IBM Spending & Anomaly Thresholds ---
    SHOCK_ANOMALY_THRESHOLD: float = 30.0       # > 30x user average transaction
    SHOCK_SEVERE_THRESHOLD: float = 60.0        # > 60x user average transaction
    CATEGORY_CONCENTRATION_WARN: float = 0.35   # > 35% in single MCC
    CATEGORY_CONCENTRATION_ALERT: float = 0.50  # > 50% in single MCC
    ONLINE_SHOPPER_CUTOFF: float = 0.20         # Top quartile online spending

    # --- Financial Profile & Solvency Thresholds ---
    MIN_HEALTHY_RUNWAY_MONTHS: float = 3.0      # 3 months buffer
    OPTIMAL_RUNWAY_MONTHS: float = 6.0          # 6 months buffer
    MAX_HEALTHY_DTI: float = 0.36               # 36% standard mortgage/credit limit
    CRITICAL_DTI: float = 0.50                  # 50% distressed debt ceiling

    # --- PaySim Cash-Flow & Liquidity Stress Thresholds ---
    DEPLETION_ALERT_THRESHOLD: float = 0.30     # > 30% of txs drain account to $0
    DEPLETION_SEVERE_THRESHOLD: float = 0.60    # > 60% chronic depletion
    LIQUIDITY_STRESS_THRESHOLD: float = 0.40    # High balance utilization + depletion
    INFLOW_DEFICIT_THRESHOLD: float = 0.85      # Inflows cover less than 85% of outflows

    @classmethod
    def evaluate_transaction(cls, amount: float, user_avg_tx: float) -> Dict[str, Any]:
        """Evaluates a single transaction against the user's historical spending baseline."""
        baseline = max(float(user_avg_tx), 1.0)
        shock = float(amount) / baseline

        is_anomaly = shock >= cls.SHOCK_ANOMALY_THRESHOLD
        severity = "NORMAL"
        if shock >= cls.SHOCK_SEVERE_THRESHOLD:
            severity = "SEVERE"
        elif shock >= cls.SHOCK_ANOMALY_THRESHOLD:
            severity = "MODERATE"

        return {
            "amount": amount,
            "user_average": round(baseline, 2),
            "shock_multiplier": round(shock, 2),
            "is_anomaly": is_anomaly,
            "severity": severity,
            "message": (
                f"Transaction of ${amount:.2f} is {shock:.1f}x higher than your average of ${baseline:.2f}."
                if is_anomaly else "Transaction within expected range."
            )
        }

    @classmethod
    def evaluate_budget_diversity(cls, largest_category_share: float) -> Dict[str, Any]:
        """Evaluates category concentration risk."""
        share = float(largest_category_share)
        if share >= cls.CATEGORY_CONCENTRATION_ALERT:
            status = "CONCENTRATION_ALERT"
            desc = f"Single category consumes {share*100:.1f}% of total budget. High concentration risk."
        elif share >= cls.CATEGORY_CONCENTRATION_WARN:
            status = "MODERATE_CONCENTRATION"
            desc = f"Single category consumes {share*100:.1f}% of total budget. Moderate concentration."
        else:
            status = "WELL_DIVERSIFIED"
            desc = f"Top category is {share*100:.1f}%. Healthy diversification across spending categories."

        return {
            "largest_category_share": round(share, 3),
            "status": status,
            "description": desc
        }

    @classmethod
    def evaluate_runway(cls, runway_months: float) -> Dict[str, Any]:
        """Evaluates liquidity buffer and emergency fund health."""
        months = float(runway_months)
        if months >= cls.OPTIMAL_RUNWAY_MONTHS:
            status = "EXCELLENT"
            desc = f"Strong financial cushion with {months:.1f} months of expenses saved."
        elif months >= cls.MIN_HEALTHY_RUNWAY_MONTHS:
            status = "ADEQUATE"
            desc = f"{months:.1f} months runway covers the recommended 3-month baseline."
        elif months >= 1.0:
            status = "VULNERABLE"
            desc = f"{months:.1f} months runway is below the recommended 3-month safety net."
        else:
            status = "CRITICAL"
            desc = f"Less than 1 month ({months:.1f} months) of living expenses saved. Immediate liquidity risk."

        return {
            "runway_months": round(months, 1),
            "status": status,
            "description": desc
        }

    @classmethod
    def evaluate_cash_flow_liquidity(cls, depletion_risk: float, inflow_outflow_ratio: float = 1.0) -> Dict[str, Any]:
        """
        Evaluates PaySim-derived account depletion and cash-flow sustainability.
        """
        depletion = float(depletion_risk)
        ratio = float(inflow_outflow_ratio)

        is_stressed = depletion >= cls.DEPLETION_ALERT_THRESHOLD or ratio < cls.INFLOW_DEFICIT_THRESHOLD
        severity = "NORMAL"

        if depletion >= cls.DEPLETION_SEVERE_THRESHOLD or ratio < 0.60:
            severity = "SEVERE"
            desc = f"Chronic cash depletion ({depletion*100:.1f}% of txs zero the account) and negative cash flow."
        elif is_stressed:
            severity = "MODERATE"
            desc = f"Elevated liquidity stress: {depletion*100:.1f}% zero-balance rate or cash replenishment deficit."
        else:
            desc = "Healthy cash-flow replenishment with low account depletion."

        return {
            "depletion_rate": round(depletion, 3),
            "replenishment_ratio": round(ratio, 2),
            "is_stressed": is_stressed,
            "severity": severity,
            "description": desc
        }
