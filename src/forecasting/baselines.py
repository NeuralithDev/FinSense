"""Naive and statistical forecasting baselines.

These are the benchmarks all ML models must beat:
  - Last-value (naive persistence)
  - Rolling mean
  - Seasonal naive (same month last year)

Results saved to experiments/baselines/
"""
from __future__ import annotations
import pandas as pd


def last_value(series: pd.Series, horizon: int = 1) -> pd.Series:
    """Persist last observed value for *horizon* steps.  TODO: implement"""
    raise NotImplementedError


def rolling_mean(series: pd.Series, window: int = 3, horizon: int = 1) -> pd.Series:
    """Use rolling mean of last *window* periods.  TODO: implement"""
    raise NotImplementedError


def seasonal_naive(series: pd.Series, period: int = 12, horizon: int = 1) -> pd.Series:
    """Use value from same period one year ago.  TODO: implement"""
    raise NotImplementedError


def evaluate_baselines(actual: pd.Series, predictions: dict[str, pd.Series]) -> pd.DataFrame:
    """Return a comparison table of MAE, RMSE, MAPE for each baseline.

    TODO: implement after notebook 09_spending_forecasting.ipynb
    """
    raise NotImplementedError
