"""Evaluation utilities for all forecasting models.

Metrics: MAE, RMSE, MAPE, R², directional accuracy.
Results written to experiments/forecasting/
"""
from __future__ import annotations
import numpy as np
import pandas as pd


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error.  TODO: implement"""
    raise NotImplementedError


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error.  TODO: implement"""
    raise NotImplementedError


def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Percentage Error.  TODO: implement"""
    raise NotImplementedError


def forecast_report(
    actuals: pd.DataFrame,
    predictions: pd.DataFrame,
    model_name: str = "model",
) -> pd.DataFrame:
    """Return a summary metrics table and save to experiments/forecasting/.

    TODO: implement after notebook 09_spending_forecasting.ipynb
    """
    raise NotImplementedError
