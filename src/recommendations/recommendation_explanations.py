"""Generate clear, personalised explanation text for each recommendation.

Plain-English output is consumed by:
  - The AI assistant context builder
  - The API response
  - The dashboard UI
"""
from __future__ import annotations


def explain_recommendation(rec: dict, profile) -> str:
    """Return a 1–3 sentence explanation of why this recommendation is relevant.

    TODO: implement after recommendation_engine.py is working
    """
    raise NotImplementedError


def format_impact(impact_dict: dict) -> str:
    """Format impact estimate into human-readable text.

    Example: "Could save you ~$240/year by reducing dining spend by 15%."
    TODO: implement
    """
    raise NotImplementedError
