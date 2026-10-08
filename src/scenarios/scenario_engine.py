"""Scenario analysis engine.

Answers: "What happens to my finances if I...
          ...buy a car with a $500/month EMI?"
          ...increase my savings rate by 5%?"
          ...lose my job for 3 months?"
          ...pay off my highest-APR loan first?"

Each scenario is a set of financial parameter overrides applied on
top of the user's current profile, projected over a time horizon.
"""
from __future__ import annotations
from dataclasses import dataclass
import pandas as pd


@dataclass
class Scenario:
    """A what-if financial scenario."""
    name: str
    description: str
    overrides: dict   # e.g. {"monthly_expenses_usd": "+500", "emi_amount": "+500"}
    horizon_months: int = 12


class ScenarioEngine:
    """Run financial scenarios against a user's projected cash flow.

    TODO: implement after notebook 12_scenario_analysis.ipynb
    """

    def __init__(self, config: dict):
        raise NotImplementedError

    def run(self, user_profile, base_cashflow: pd.DataFrame, scenario: Scenario) -> pd.DataFrame:
        """Return projected cash flow under the given scenario.

        TODO: implement
        """
        raise NotImplementedError

    def compare(
        self,
        base: pd.DataFrame,
        scenarios: list[tuple[str, pd.DataFrame]],
    ) -> pd.DataFrame:
        """Compare base case vs. multiple scenarios side-by-side.

        TODO: implement
        """
        raise NotImplementedError
