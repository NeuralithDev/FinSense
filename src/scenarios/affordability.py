"""Affordability calculators.

Answers: "Can I afford to take on this loan?"
         "What monthly savings rate do I need to reach my goal?"
         "How long until I can afford X?"
"""
from __future__ import annotations


def can_afford_loan(
    monthly_income: float,
    current_expenses: float,
    current_emi: float,
    new_emi: float,
    dti_limit: float = 0.36,
) -> dict:
    """Assess whether adding a new EMI keeps DTI within safe limits.

    Returns: {'affordable': bool, 'new_dti': float, 'surplus': float}
    TODO: implement
    """
    raise NotImplementedError


def months_to_goal(
    current_savings: float,
    monthly_savings: float,
    goal_amount: float,
) -> int:
    """Return number of months to reach a savings goal.  TODO: implement"""
    raise NotImplementedError


def required_savings_rate(
    current_balance: float,
    monthly_income: float,
    goal_amount: float,
    months: int,
) -> float:
    """Return required monthly savings fraction.  TODO: implement"""
    raise NotImplementedError
