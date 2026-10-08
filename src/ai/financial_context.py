"""Build the context payload sent to the LLM assistant.

The context is assembled from the UserFinancialState and includes:
  - Plain-English summary of the user's financial health
  - Top recommendations with explanations
  - Spending forecast summary
  - Active anomalies
  - Recent scenario results (if any)

Responsible for staying within the configured token limit.
"""
from __future__ import annotations
from src.fusion.user_financial_state import UserFinancialState


def build_context(state: UserFinancialState, max_tokens: int = 4096) -> str:
    """Return a structured plain-text context for LLM input.

    TODO: implement after notebook 13_financial_intelligence.ipynb
    """
    raise NotImplementedError


def summarise_spending(state: UserFinancialState) -> str:
    """Produce a 2–3 sentence spending summary.  TODO: implement"""
    raise NotImplementedError


def summarise_health(state: UserFinancialState) -> str:
    """Produce a 2–3 sentence financial health summary.  TODO: implement"""
    raise NotImplementedError
