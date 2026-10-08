"""Generate human-readable explanations for a user's health score.

Produces natural-language summaries like:
  "Your savings rate of 8% is below the recommended 20%.
   Reducing dining expenses by $150/month would close this gap
   in approximately 4 months."

Used by the AI assistant and recommendation engine.
"""
from __future__ import annotations
from src.financial_health.financial_profile import FinancialProfile


def explain_health_score(profile: FinancialProfile) -> str:
    """Return a plain-English explanation of the health score.

    TODO: implement after health_score.py and financial_profile.py
    """
    raise NotImplementedError


def generate_priority_flags(profile: FinancialProfile) -> list[str]:
    """Return a ranked list of financial concern flags.

    Example output: ['high_dti', 'low_savings', 'no_emergency_fund']
    TODO: implement
    """
    raise NotImplementedError
