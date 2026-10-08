"""Assemble the unified User Financial State vector.

The User Financial State is the single object that downstream
components (forecasting, recommendations, AI assistant, API)
consume.  It brings together:
  - Financial profile (static attributes)
  - Financial health score and sub-scores
  - Spending features (behavioural signals)
  - Forecast trajectory
  - Open anomalies

This is the "source of truth" for a user at a given point in time.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any
import pandas as pd
from src.financial_health.financial_profile import FinancialProfile


@dataclass
class UserFinancialState:
    """Complete financial state for one user at one point in time."""
    user_id: str
    snapshot_date: str
    profile: FinancialProfile | None = None
    spending_features: dict[str, Any] = field(default_factory=dict)
    forecast: dict[str, Any] = field(default_factory=dict)      # {month: predicted_spend}
    anomalies: list[dict] = field(default_factory=list)
    recommendations: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Serialise to a plain dict for API responses.  TODO: implement"""
        raise NotImplementedError


def build_user_state(
    user_id: str,
    profile: FinancialProfile,
    spending_df: pd.DataFrame | None = None,
    forecast_df: pd.DataFrame | None = None,
    anomalies: list | None = None,
) -> UserFinancialState:
    """Assemble a complete UserFinancialState.

    TODO: implement after all upstream modules are ready
    """
    raise NotImplementedError
