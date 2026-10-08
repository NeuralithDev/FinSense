"""Spending-pattern features derived from IBM transactions.

Covers: total spend, per-category share, rolling averages,
spend acceleration, deviation from personal baseline.
"""
from __future__ import annotations
import pandas as pd


def build_spending_features(df: pd.DataFrame, user_col: str, amount_col: str) -> pd.DataFrame:
    """Build user-level spending features.

    TODO: implement after notebook 06_transaction_features.ipynb
    """
    raise NotImplementedError


def compute_category_share(df: pd.DataFrame) -> pd.DataFrame:
    """Compute each category's share of total monthly spend per user.

    TODO: implement
    """
    raise NotImplementedError


def compute_rolling_spend(
    df: pd.DataFrame,
    windows: list[int] = [7, 30],
    amount_col: str = "amount",
) -> pd.DataFrame:
    """Compute rolling N-day spending totals per user.

    TODO: implement
    """
    raise NotImplementedError
