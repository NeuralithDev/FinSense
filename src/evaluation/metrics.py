"""Core evaluation metrics used across all modules.

Regression: MAE, RMSE, MAPE, R²
Classification: Precision, Recall, F1, AUROC, AUPRC
Financial: custom metrics like \'recommendation uptake rate\'
"""
from __future__ import annotations
import numpy as np


# ── Regression ───────────────────────────────────────────────────
def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error.  TODO: implement"""
    raise NotImplementedError

def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error.  TODO: implement"""
    raise NotImplementedError

def mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Percentage Error.  TODO: implement"""
    raise NotImplementedError

def r2(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Coefficient of determination.  TODO: implement"""
    raise NotImplementedError

# ── Classification ───────────────────────────────────────────────
def precision_recall_f1(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """TODO: implement"""
    raise NotImplementedError
