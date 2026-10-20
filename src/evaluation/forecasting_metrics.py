"""
Evaluation Metrics for Spending & Cash-Flow Forecasting.

Implements standard time-series regression and financial metrics:
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- MAPE (Mean Absolute Percentage Error)
- WAPE (Weighted Absolute Percentage Error - industry gold standard for intermittent spend)
- Directional Accuracy (Hit rate on spending expansion vs contraction)
"""

from typing import Dict, Any, Union
import numpy as np


def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Computes Root Mean Squared Error."""
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Computes Mean Absolute Error."""
    return float(np.mean(np.abs(y_true - y_pred)))


def mape(y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1.0) -> float:
    """
    Computes Mean Absolute Percentage Error (with epsilon smoothing to prevent division by zero).
    Returns value in percentage (e.g. 15.2 for 15.2%).
    """
    denom = np.maximum(np.abs(y_true), epsilon)
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Weighted Absolute Percentage Error (WAPE).
    WAPE = sum(|y - y_hat|) / sum(y)
    Preferred in personal finance because it doesn't artificially explode on small $5 purchases.
    """
    total_actual = np.sum(np.abs(y_true))
    if total_actual < 1e-6:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / total_actual * 100.0)


def directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Measures how often the forecast correctly predicts the direction of change (up or down).
    Returns accuracy ratio between 0.0 and 1.0.
    """
    if len(y_true) < 2:
        return 1.0
    diff_true = np.diff(y_true, axis=0)
    diff_pred = np.diff(y_pred, axis=0)
    correct_direction = (diff_true * diff_pred) > 0
    return float(np.mean(correct_direction))


def evaluate_forecast(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Generates a full evaluation report for forecasting models.
    """
    y_true_arr = np.asarray(y_true, dtype=float)
    y_pred_arr = np.asarray(y_pred, dtype=float)

    return {
        "rmse": round(rmse(y_true_arr, y_pred_arr), 4),
        "mae": round(mae(y_true_arr, y_pred_arr), 4),
        "mape": round(mape(y_true_arr, y_pred_arr), 2),
        "wape": round(wape(y_true_arr, y_pred_arr), 2),
        "directional_accuracy": round(directional_accuracy(y_true_arr, y_pred_arr), 4)
    }
