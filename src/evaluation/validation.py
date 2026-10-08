"""Cross-validation and hold-out evaluation framework.

Ensures time-based splits (no data leakage) for all models.
"""
from __future__ import annotations
import pandas as pd


def time_series_cv_split(
    df: pd.DataFrame,
    date_col: str,
    n_splits: int = 5,
) -> list[tuple[pd.DataFrame, pd.DataFrame]]:
    """Generate expanding-window time-series CV splits.

    TODO: implement after notebook 09_spending_forecasting.ipynb
    """
    raise NotImplementedError
