"""Debt and liability features.

Covers: debt-to-income ratio, EMI burden, loan remaining periods,
debt stress index.
"""
from __future__ import annotations
import pandas as pd


def build_debt_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build debt-related features.

    TODO: implement after notebook 08_financial_health.ipynb
    """
    raise NotImplementedError


def emi_burden(emi: pd.Series, income: pd.Series) -> pd.Series:
    """EMI as a fraction of income.  TODO: implement"""
    raise NotImplementedError
