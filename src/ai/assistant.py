"""AI Financial Assistant: natural-language Q&A over the user's finances.

Answers questions like:
  "Why did my savings drop this month?"
  "Am I on track to afford a house in 3 years?"
  "What is the single most impactful thing I can do right now?"

Provider-agnostic: reads `ai.provider` from configs/config.yaml.
Supports: OpenAI, Anthropic, or a local model (e.g. Ollama).
"""
from __future__ import annotations
from src.fusion.user_financial_state import UserFinancialState


class FinancialAssistant:
    """LLM-powered assistant grounded in the user's real financial data.

    TODO: implement after notebook 13_financial_intelligence.ipynb
    """

    def __init__(self, config: dict):
        raise NotImplementedError

    def ask(self, question: str, state: UserFinancialState) -> str:
        """Answer a natural-language financial question.

        Returns a plain-text answer grounded in *state*.
        TODO: implement
        """
        raise NotImplementedError

    def summarise(self, state: UserFinancialState) -> str:
        """Return a proactive monthly financial summary.  TODO: implement"""
        raise NotImplementedError
