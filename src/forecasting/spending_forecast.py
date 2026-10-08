"""Spending forecast model: predict future monthly spending per user.

Answers: "What is my expected spend next month / next quarter?"

Primary model target: total monthly spending by category.
Model options (configured in configs/config.yaml):
  - Prophet (recommended for MVP — handles seasonality out of the box)
  - LSTM (for advanced iteration)
  - ARIMA (baseline comparison)
"""
from __future__ import annotations
import pandas as pd


class SpendingForecaster:
    """Forecasts future monthly spending per user.

    Usage::

        forecaster = SpendingForecaster(config)
        forecaster.fit(train_df)
        predictions = forecaster.predict(horizon=3)

    TODO: implement after notebook 09_spending_forecasting.ipynb
    """

    def __init__(self, config: dict):
        raise NotImplementedError

    def fit(self, df: pd.DataFrame) -> "SpendingForecaster":
        """Train on historical user spending data.  TODO: implement"""
        raise NotImplementedError

    def predict(self, horizon: int = 3) -> pd.DataFrame:
        """Return spending forecasts for the next *horizon* months.

        TODO: implement
        """
        raise NotImplementedError

    def save(self, path) -> None:
        """Persist model to models/trained/.  TODO: implement"""
        raise NotImplementedError

    @classmethod
    def load(cls, path) -> "SpendingForecaster":
        """Load model from checkpoint.  TODO: implement"""
        raise NotImplementedError
