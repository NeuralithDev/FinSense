"""Calendar and temporal features derived from timestamps.

Used across IBM and PaySim datasets.
"""
from __future__ import annotations
import pandas as pd


def build_temporal_features(df: pd.DataFrame, date_col: str) -> pd.DataFrame:
    """Add hour, day_of_week, is_weekend, week_of_year, month columns.

    TODO: implement after notebook 06_transaction_features.ipynb
    """
    raise NotImplementedError


def flag_weekends(df: pd.DataFrame, date_col: str) -> pd.Series:
    """Return boolean Series indicating weekend transactions.  TODO: implement"""
    raise NotImplementedError
