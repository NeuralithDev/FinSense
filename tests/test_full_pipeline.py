"""
End-to-end integration test for FinSense Feature Engineering, Thresholds,
Financial State Engine, and Recommendation Engine.
"""

import pandas as pd
import numpy as np

from src.data.feature_engineering import (
    engineer_ibm_features,
    engineer_financial_profile_features,
    engineer_paysim_features
)
from src.preprocessing.scaling import FinancialLogScaler
from src.intelligence.threshold_engine import FinancialThresholdEngine
from src.intelligence.financial_state import FinancialStateEngine, UserFinancialState
from src.intelligence.recommendation_engine import RecommendationEngine, ActionableRecommendation


def test_full_pipeline_flow():
    # 1. Feature Engineering Test
    ibm_sample = pd.DataFrame({
        "User": [0, 1],
        "total_spending": [50000.0, 12000.0],
        "transaction_count": [1000, 300],
        "average_transaction": [50.0, 40.0],
        "max_transaction": [1500.0, 3600.0],
        "unique_merchants": [120, 60],
        "unique_cities": [45, 20],
        "unique_mcc": [40, 25],
        "active_days": [365, 180],
        "monthly_spending": [4100.0, 2000.0],
        "night_transaction_ratio": [0.05, 0.22],
        "weekend_transaction_ratio": [0.28, 0.35],
        "online_transaction_ratio": [0.10, 0.45],
        "swipe_transaction_ratio": [0.60, 0.30],
        "chip_transaction_ratio": [0.30, 0.25],
        "largest_category_share": [0.18, 0.55]
    })
    feat_ibm = engineer_ibm_features(ibm_sample)
    assert "daily_frequency" in feat_ibm.columns
    assert "shock_ratio" in feat_ibm.columns
    assert "total_spending" not in feat_ibm.columns

    # 2. Scaling Test
    scaler = FinancialLogScaler()
    scaled = scaler.fit_transform(feat_ibm.drop(columns=['User']))
    assert scaled.shape == (2, len(feat_ibm.columns) - 1)

    # 3. Financial State Fusion Test
    user_0_state = FinancialStateEngine.fuse_and_score(
        user_id="User_0",
        ibm_features=feat_ibm.iloc[0].to_dict(),
        fin_profile={
            "credit_score": 760,
            "debt_to_income_ratio": 0.18,
            "monthly_income_usd": 6500.0,
            "monthly_expenses_usd": 4100.0,
            "savings_usd": 25000.0
        },
        paysim_features={
            "cash_depletion_risk": 0.02,
            "inflow_to_outflow_ratio": 1.25
        }
    )
    assert user_0_state.health_score > 75.0
    assert user_0_state.health_tier in ["STABLE", "EXCELLENT"]

    user_1_state = FinancialStateEngine.fuse_and_score(
        user_id="User_1",
        ibm_features=feat_ibm.iloc[1].to_dict(),
        fin_profile={
            "credit_score": 580,
            "debt_to_income_ratio": 0.48,
            "monthly_income_usd": 3000.0,
            "monthly_expenses_usd": 2800.0,
            "savings_usd": 1000.0
        },
        paysim_features={
            "cash_depletion_risk": 0.45,
            "inflow_to_outflow_ratio": 0.70
        }
    )
    assert user_1_state.health_score < 50.0
    assert user_1_state.health_tier in ["VULNERABLE", "CRITICAL"]

    # 4. Recommendation Engine Test
    recs_0 = RecommendationEngine.generate_recommendations(user_0_state)
    assert isinstance(recs_0, list)
    
    recs_1 = RecommendationEngine.generate_recommendations(user_1_state)
    assert len(recs_1) > 0
    # First recommendation for vulnerable user must be HIGH priority
    assert recs_1[0].priority == "HIGH"
    print("User 1 Top Recommendation:", recs_1[0].action)

    # 5. Batch Scoring Test
    batch_df = pd.DataFrame([
        {
            "User": "Batch_A",
            "credit_score": 750,
            "debt_to_income_ratio": 0.20,
            "monthly_spending": 2000.0,
            "runway_months": 5.0
        },
        {
            "User": "Batch_B",
            "credit_score": 620,
            "debt_to_income_ratio": 0.40,
            "monthly_spending": 3500.0,
            "runway_months": 1.0
        }
    ])
    batch_results = FinancialStateEngine.batch_score(batch_df)
    assert len(batch_results) == 2
    assert "health_score" in batch_results.columns

    print("\n>>> ALL PIPELINE MODULES VERIFIED & WORKING SEAMLESSLY! <<<")


if __name__ == '__main__':
    test_full_pipeline_flow()
