"""
Tests for Final Unified FinancialStateEngine and UserFinancialState.
"""

from src.intelligence.financial_state import FinancialStateEngine, UserFinancialState


def test_excellent_user_state():
    """Verify an asset-rich user gets high score and appropriate tier."""
    state = FinancialStateEngine.fuse_and_score(
        user_id="U_EXCELLENT_1",
        ibm_features={
            "monthly_spending": 2500.0,
            "average_transaction": 45.0,
            "max_transaction": 900.0,
            "shock_ratio": 20.0,
            "largest_category_share": 0.15,
            "online_transaction_ratio": 0.08,
            "daily_frequency": 2.2
        },
        fin_profile={
            "credit_score": 790,
            "debt_to_income_ratio": 0.12,
            "monthly_income_usd": 7000.0,
            "monthly_expenses_usd": 2500.0,
            "savings_usd": 30000.0
        },
        paysim_features={
            "cash_depletion_risk": 0.01,
            "inflow_to_outflow_ratio": 1.4
        }
    )

    assert isinstance(state, UserFinancialState)
    assert state.health_score >= 80.0
    assert state.health_tier == "EXCELLENT"
    assert state.persona == "Asset-Rich Steady Conservative"
    assert len(state.risk_alerts) == 0
    assert state.runway_months >= 6.0


def test_vulnerable_user_state():
    """Verify high debt, low runway, and high PaySim depletion trigger alerts."""
    state = FinancialStateEngine.fuse_and_score(
        user_id="U_VULNERABLE_1",
        ibm_features={
            "monthly_spending": 3800.0,
            "average_transaction": 35.0,
            "max_transaction": 3200.0,
            "shock_ratio": 91.4,
            "largest_category_share": 0.58,  # > 50% concentration
            "online_transaction_ratio": 0.35,
            "daily_frequency": 3.8
        },
        fin_profile={
            "credit_score": 590,
            "debt_to_income_ratio": 0.46,    # High DTI
            "monthly_income_usd": 4000.0,
            "monthly_expenses_usd": 3800.0,
            "savings_usd": 1200.0            # < 1 month runway
        },
        paysim_features={
            "cash_depletion_risk": 0.42,     # High depletion
            "inflow_to_outflow_ratio": 0.75  # Deficit
        }
    )

    assert state.health_score < 60.0
    assert state.health_tier in ["VULNERABLE", "CRITICAL"]
    assert "LIQUIDITY_DEFICIT" in state.risk_alerts
    assert "CATEGORY_CONCENTRATION_ALERT" in state.risk_alerts
    assert "HIGH_SPENDING_VOLATILITY" in state.risk_alerts
    assert "CHRONIC_CASH_DEPLETION" in state.risk_alerts
    assert "INFLOW_DEFICIT" in state.risk_alerts
    assert state.persona == "Cash-Flow Constrained"


def test_state_to_dict_serializable():
    """Verify the state can be converted to JSON-ready dictionary for API."""
    state = FinancialStateEngine.fuse_and_score(user_id="U_TEST")
    data = state.to_dict()
    assert isinstance(data, dict)
    assert "health_score" in data
    assert "credit_pillar" in data
    assert "debt_pillar" in data
    assert "liquidity_pillar" in data
    assert "discipline_pillar" in data
    assert "persona" in data


if __name__ == '__main__':
    test_excellent_user_state()
    test_vulnerable_user_state()
    test_state_to_dict_serializable()
    print("ALL TESTS PASSED!")

