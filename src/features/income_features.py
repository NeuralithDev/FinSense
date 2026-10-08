"""Income-side features from the financial profile dataset.

Covers: income brackets, income stability proxy, income growth.
"""
from __future__ import annotations
import pandas as pd


def build_income_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build income-related features.

    TODO: implement after notebook 08_financial_health.ipynb
    """
    raise NotImplementedError


def income_bracket(monthly_income: pd.Series) -> pd.Series:
    """Classify users into income brackets.

    TODO: implement — define brackets after EDA
    """
    raise NotImplementedError
