"""Transaction-behavioral features from IBM and PaySim datasets.

Covers: transaction frequency, merchant diversity, time-of-day
patterns, category switching, recurring behaviour signals.
"""
from __future__ import annotations
import pandas as pd


def build_behavioral_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build user behavioral features from transaction log.

    TODO: implement after notebook 07_user_behavior_features.ipynb
    """
    raise NotImplementedError


def transaction_frequency(
    df: pd.DataFrame,
    user_col: str,
    date_col: str,
    windows: list[int] = [7, 30],
) -> pd.DataFrame:
    """Count transactions per user in rolling windows.  TODO: implement"""
    raise NotImplementedError


def merchant_diversity(df: pd.DataFrame, user_col: str, merchant_col: str) -> pd.Series:
    """Unique merchant count per user per month.  TODO: implement"""
    raise NotImplementedError


def detect_recurring_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """Identify likely subscriptions / recurring payments.

    TODO: implement — look for near-identical amounts at regular intervals
    """
    raise NotImplementedError
