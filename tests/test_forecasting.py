"""Tests for src/forecasting/ spending and cash-flow models."""
import pytest


class TestBaselines:
    def test_last_value_output_length(self):
        pytest.skip("TODO: implement after baselines.py")

    def test_rolling_mean_nan_handling(self):
        pytest.skip("TODO: implement")


class TestSpendingForecaster:
    def test_fit_predict_shape(self):
        pytest.skip("TODO: implement after spending_forecast.py")

    def test_predictions_non_negative(self):
        pytest.skip("TODO: implement")


class TestCashFlowForecaster:
    def test_projection_length(self):
        pytest.skip("TODO: implement after cashflow_forecast.py")
