"""Savings-behaviour features.

Covers: savings rate, savings-to-income ratio, savings trend,
emergency fund coverage months.
"""
from __future__ import annotations
import pandas as pd


def build_savings_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build savings-related features.

    TODO: implement after notebook 08_financial_health.ipynb
    """
    raise NotImplementedError


def savings_rate(savings: pd.Series, income: pd.Series) -> pd.Series:
    """savings / income per user.  TODO: implement"""
    raise NotImplementedError


def emergency_fund_months(savings: pd.Series, monthly_expenses: pd.Series) -> pd.Series:
    """How many months of expenses the savings covers.  TODO: implement"""
    raise NotImplementedError
