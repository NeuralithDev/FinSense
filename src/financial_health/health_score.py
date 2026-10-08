"""Compute a composite Financial Health Score (0–100) per user.

The score aggregates four dimensions:
  - Savings adequacy (savings-to-income ratio vs. benchmark)
  - Debt safety (debt-to-income ratio)
  - Expense control (expense-to-income ratio)
  - Credit health (credit score normalised)

Weights are configurable via configs/config.yaml under
financial_health.weights.
"""
from __future__ import annotations
import pandas as pd


def compute_health_score(df: pd.DataFrame, weights: dict | None = None) -> pd.Series:
    """Return a scalar health score in [0, 100] per user row.

    TODO: implement after notebook 08_financial_health.ipynb
    """
    raise NotImplementedError


def score_savings_dimension(savings_ratio: pd.Series, threshold: float = 0.20) -> pd.Series:
    """Score savings adequacy sub-dimension.  TODO: implement"""
    raise NotImplementedError


def score_debt_dimension(dti: pd.Series, safe_threshold: float = 0.36) -> pd.Series:
    """Score debt safety sub-dimension.  TODO: implement"""
    raise NotImplementedError


def score_expense_dimension(expense_ratio: pd.Series, healthy: float = 0.70) -> pd.Series:
    """Score expense control sub-dimension.  TODO: implement"""
    raise NotImplementedError


def score_credit_dimension(credit_score: pd.Series) -> pd.Series:
    """Normalise credit score to [0, 1].  TODO: implement"""
    raise NotImplementedError
