"""Detect unusual / anomalous spending patterns for a user.

Answers: "Did something unusual happen to my spending this month?"
         "Is this transaction out of character for me?"

Approach: Statistical deviation from personal baseline
(z-score, IQR), NOT fraud detection.

NOTE: This module is about personal finance intelligence, not security.
Flagged transactions alert the user to unexpected behaviour in their
own patterns (e.g., subscription creep, unusually high restaurant spend).
"""
from __future__ import annotations
import pandas as pd
import numpy as np


def flag_anomalous_months(
    user_monthly_spend: pd.DataFrame,
    z_threshold: float = 2.5,
) -> pd.DataFrame:
    """Flag months where spend deviates strongly from user's own baseline.

    Returns the input DataFrame with an added 'is_anomalous' boolean column.
    TODO: implement after notebook 11_anomaly_detection.ipynb
    """
    raise NotImplementedError


def flag_anomalous_transactions(
    user_transactions: pd.DataFrame,
    method: str = "zscore",
) -> pd.DataFrame:
    """Flag individual transactions that are unusual for this user.

    method: 'zscore' | 'iqr'
    TODO: implement
    """
    raise NotImplementedError


def explain_anomaly(transaction_row: pd.Series, user_baseline: dict) -> str:
    """Return a plain-English reason why a transaction/month is anomalous.

    TODO: implement
    """
    raise NotImplementedError
