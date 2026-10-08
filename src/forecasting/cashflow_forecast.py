"""Cash-flow forecast: project net cash position over time.

Answers: "Will I run out of money before my next payday?"
         "What is my expected balance in 3 months?"

Combines income schedule + expected spending + debt obligations.
"""
from __future__ import annotations
import pandas as pd


class CashFlowForecaster:
    """Projects future cash position from income, spending, and debt.

    TODO: implement after notebook 10_cashflow_forecasting.ipynb
    """

    def __init__(self, config: dict):
        raise NotImplementedError

    def project(
        self,
        user_profile,
        spending_forecast: pd.DataFrame,
        horizon_months: int = 3,
    ) -> pd.DataFrame:
        """Return month-by-month projected cash balance.

        TODO: implement
        """
        raise NotImplementedError
