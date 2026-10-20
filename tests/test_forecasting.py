"""
Unit tests for forecasting baselines, metrics, and SpendingLSTM.
"""

import numpy as np
import torch
import pytest

from src.models.forecasting_baselines import (
    HistoricalMeanForecaster,
    ExponentialSmoothingForecaster,
    AutoregressiveRidgeForecaster
)
from src.evaluation.forecasting_metrics import evaluate_forecast, rmse, mae, wape
from src.models.lstm import SpendingLSTM


class TestBaselines:
    def test_historical_mean_shape_and_non_negative(self):
        # 10 samples, 12 lookback weeks, 5 categories
        X = np.random.uniform(10, 100, (10, 12, 5))
        forecaster = HistoricalMeanForecaster()
        forecaster.fit(X)
        preds = forecaster.predict(X)
        assert preds.shape == (10, 5)
        assert (preds >= 0).all()

    def test_exponential_smoothing_recency_weight(self):
        # Verify that an upward trend produces higher predictions due to recency weighting
        # Time steps: 10, 20, 30, 40, 50, 60, 70, 80
        trend = np.linspace(10, 80, 8).reshape(1, 8, 1)
        ewma = ExponentialSmoothingForecaster(alpha=0.5)
        mean_model = HistoricalMeanForecaster()

        pred_ewma = ewma.predict(trend)[0, 0]
        pred_mean = mean_model.predict(trend)[0, 0]

        # EWMA should be noticeably higher than simple mean because it emphasizes recent steps
        assert pred_ewma > pred_mean

    def test_autoregressive_ridge(self):
        np.random.seed(42)
        X_train = np.random.uniform(50, 200, (30, 8, 4))
        y_train = np.random.uniform(50, 200, (30, 4))

        ridge = AutoregressiveRidgeForecaster(alpha=0.5)
        ridge.fit(X_train, y_train)

        preds = ridge.predict(X_train)
        assert preds.shape == (30, 4)
        assert (preds >= 0).all()


class TestForecastingMetrics:
    def test_metrics_zero_error(self):
        y = np.array([100.0, 200.0, 300.0])
        metrics = evaluate_forecast(y, y)
        assert metrics["rmse"] == 0.0
        assert metrics["mae"] == 0.0
        assert metrics["mape"] == 0.0
        assert metrics["wape"] == 0.0

    def test_metrics_computations(self):
        y_true = np.array([100.0, 200.0])
        y_pred = np.array([110.0, 180.0])
        res = evaluate_forecast(y_true, y_pred)
        assert res["mae"] == 15.0
        assert res["wape"] == 10.0  # (10 + 20) / 300 = 10%


class TestSpendingForecaster:
    def test_lstm_forward_and_dollar_space(self):
        model = SpendingLSTM(input_dim=10, hidden_dim=32, num_categories=5)
        x_tensor = torch.randn(4, 12, 10)
        preds = model.predict(x_tensor)
        assert isinstance(preds, np.ndarray)
        assert preds.shape == (4, 5)
        assert (preds >= 0).all()


if __name__ == "__main__":
    t_base = TestBaselines()
    t_base.test_historical_mean_shape_and_non_negative()
    t_base.test_exponential_smoothing_recency_weight()
    t_base.test_autoregressive_ridge()

    t_met = TestForecastingMetrics()
    t_met.test_metrics_zero_error()
    t_met.test_metrics_computations()

    t_lstm = TestSpendingForecaster()
    t_lstm.test_lstm_forward_and_dollar_space()

    print("ALL FORECASTING TESTS PASSED!")
