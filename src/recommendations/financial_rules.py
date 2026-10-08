"""Rule-based financial heuristics.

Encodes common personal-finance best practices as executable rules.
These rules are triggered by conditions in the user's financial profile
and produce candidate recommendations.

Example rules:
  IF savings_rate < 0.10 THEN recommend "Increase savings rate to 20%"
  IF dti > 0.40          THEN recommend "Reduce high-interest debt first"
  IF emergency_months < 3 THEN recommend "Build 3-month emergency fund"
"""
from __future__ import annotations
from src.financial_health.financial_profile import FinancialProfile


def apply_savings_rules(profile: FinancialProfile) -> list[dict]:
    """TODO: implement"""
    raise NotImplementedError


def apply_debt_rules(profile: FinancialProfile) -> list[dict]:
    """TODO: implement"""
    raise NotImplementedError


def apply_spending_rules(profile: FinancialProfile, anomalies: list | None = None) -> list[dict]:
    """TODO: implement"""
    raise NotImplementedError


def apply_goal_rules(profile: FinancialProfile, scenarios=None) -> list[dict]:
    """TODO: implement"""
    raise NotImplementedError
