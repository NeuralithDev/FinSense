"""Build a structured financial profile for each user.

A Financial Profile is a richer object than a single score — it captures
income tier, spending archetype, debt load, savings habit, and health
score in one place, ready for recommendations and forecasting.
"""
from __future__ import annotations
from dataclasses import dataclass, field
import pandas as pd


@dataclass
class FinancialProfile:
    """Per-user financial profile snapshot."""
    user_id: str
    health_score: float = 0.0
    income_tier: str = "unknown"      # 'low' | 'mid' | 'high'
    spending_archetype: str = "unknown"
    savings_rate: float = 0.0
    debt_to_income: float = 0.0
    expense_to_income: float = 0.0
    credit_score: int = 0
    flags: list[str] = field(default_factory=list)  # e.g. ['high_dti', 'low_savings']

    @classmethod
    def from_row(cls, row: pd.Series) -> "FinancialProfile":
        """Construct from a DataFrame row.  TODO: implement"""
        raise NotImplementedError


def build_profiles(df: pd.DataFrame, health_scores: pd.Series) -> list[FinancialProfile]:
    """Build a FinancialProfile per user row.

    TODO: implement after notebook 08_financial_health.ipynb
    """
    raise NotImplementedError
