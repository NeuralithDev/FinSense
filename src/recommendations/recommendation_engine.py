"""Generate personalized, actionable financial recommendations.

Answers: "What should I do to improve my financial health?"

Recommendations are derived from:
  - Financial health score and its sub-dimensions
  - Spending anomalies detected
  - Forecast trajectory (improving or worsening?)
  - User-specific context (income tier, debt load, life stage)

Each recommendation includes: action, impact estimate, priority score,
and a plain-English explanation.
"""
from __future__ import annotations
from src.financial_health.financial_profile import FinancialProfile


class RecommendationEngine:
    """Produce ranked, personalised financial action recommendations.

    TODO: implement after notebook 14_recommendation_engine.ipynb
    """

    def __init__(self, config: dict):
        raise NotImplementedError

    def generate(
        self,
        profile: FinancialProfile,
        spending_forecast=None,
        anomalies=None,
    ) -> list[dict]:
        """Return sorted list of recommendation dicts.

        Each dict: {'action', 'category', 'priority', 'impact', 'explanation'}
        TODO: implement
        """
        raise NotImplementedError
