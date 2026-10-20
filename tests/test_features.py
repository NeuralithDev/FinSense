"""
Unit tests for Feature Engineering pipelines (IBM, Financial Profiles, PaySim, Scaling).
"""

import numpy as np
import pandas as pd
import pytest

from src.data.feature_engineering import (
    engineer_ibm_features,
    engineer_financial_profile_features,
    engineer_paysim_features
)
from src.preprocessing.scaling import FinancialLogScaler


class TestSpendingFeatures:
    def test_output_has_expected_columns(self):
        raw_ibm = pd.DataFrame({
            "User": [0],
            "total_spending": [10000.0],
            "transaction_count": [200],
            "average_transaction": [50.0],
            "max_transaction": [1200.0],
            "unique_merchants": [40],
            "unique_cities": [10],
            "unique_mcc": [15],
            "active_days": [100],
            "monthly_spending": [1000.0],
            "night_transaction_ratio": [0.08],
            "weekend_transaction_ratio": [0.25],
            "online_transaction_ratio": [0.15],
            "swipe_transaction_ratio": [0.55],
            "chip_transaction_ratio": [0.30],
            "largest_category_share": [0.22]
        })
        feats = engineer_ibm_features(raw_ibm)
        assert "daily_frequency" in feats.columns
        assert "shock_ratio" in feats.columns
        assert "is_concentrated_budget" in feats.columns
        assert "is_digital_shopper" in feats.columns
        assert "physical_channel_ratio" in feats.columns
        # Multi-collinear column pruned
        assert "total_spending" not in feats.columns

    def test_shock_ratio_computation(self):
        raw_ibm = pd.DataFrame({
            "User": [1],
            "transaction_count": [10],
            "average_transaction": [50.0],
            "max_transaction": [500.0],
            "active_days": [5],
            "largest_category_share": [0.3],
            "online_transaction_ratio": [0.1],
            "night_transaction_ratio": [0.05],
            "swipe_transaction_ratio": [0.5],
            "chip_transaction_ratio": [0.4]
        })
        feats = engineer_ibm_features(raw_ibm)
        # shock_ratio = 500 / 50 = 10.0
        assert np.isclose(feats["shock_ratio"].iloc[0], 10.0)


class TestFinancialProfileFeatures:
    def test_runway_and_solvency(self):
        df_fin = pd.DataFrame({
            "User": ["U1"],
            "monthly_income_usd": [6000.0],
            "monthly_expenses_usd": [3000.0],
            "savings_usd": [15000.0],
            "monthly_emi_usd": [600.0]
        })
        feats = engineer_financial_profile_features(df_fin)
        assert feats["runway_months"].iloc[0] == 5.0
        assert feats["expense_ratio"].iloc[0] == 0.50
        assert feats["disposable_income"].iloc[0] == 2400.0
        assert feats["is_cash_flow_positive"].iloc[0] == 1


class TestPaySimFeatures:
    def test_cash_flow_dynamics(self):
        df_pay = pd.DataFrame({
            "nameOrig": ["C123"],
            "total_inflow": [5000.0],
            "total_outflow": [4000.0],
            "balance_depletion_ratio": [0.20],
            "high_balance_utilization_ratio": [0.15],
            "transfer_ratio": [0.30],
            "cash_out_ratio": [0.40]
        })
        feats = engineer_paysim_features(df_pay)
        assert feats["inflow_to_outflow_ratio"].iloc[0] == 1.25
        assert "liquidity_stress_index" in feats.columns
        assert feats["transfer_dependency"].iloc[0] == 0.70


class TestScaling:
    def test_financial_log_scaler_roundtrip(self):
        df = pd.DataFrame({
            "monthly_spending": [100.0, 500.0, 2000.0],
            "monthly_income_usd": [2000.0, 5000.0, 15000.0]
        })
        scaler = FinancialLogScaler()
        scaled = scaler.fit_transform(df)
        unscaled = scaler.inverse_transform(scaled)
        assert np.allclose(df.values, unscaled.values, atol=1e-3)


if __name__ == "__main__":
    t_spend = TestSpendingFeatures()
    t_spend.test_output_has_expected_columns()
    t_spend.test_shock_ratio_computation()

    t_fin = TestFinancialProfileFeatures()
    t_fin.test_runway_and_solvency()

    t_pay = TestPaySimFeatures()
    t_pay.test_cash_flow_dynamics()

    t_scale = TestScaling()
    t_scale.test_financial_log_scaler_roundtrip()

    print("ALL FEATURE TESTS PASSED!")
