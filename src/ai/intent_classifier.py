"""
Intent Classifier & Financial Entity Extractor for FinSense AI Assistant.

Maps user natural language prompts to deterministic financial intelligence engines:
- AFFORDABILITY_CHECK -> AffordabilityEngine
- SUBSCRIPTION_AUDIT -> SubscriptionDetector
- SAVINGS_AUTOPILOT -> AutopilotSavingsEngine
- CASHFLOW_FORECAST -> Forecast Engine
- HEALTH_DIAGNOSTIC -> FinancialStateEngine
- PEER_BENCHMARK -> Financial Twins (GraphSAGE)
- ACTION_RECOMMENDATION -> Bandit Action Ranking
"""

import re
from enum import Enum
from typing import Dict, Any, Optional, Tuple, List
from dataclasses import dataclass


class AssistantIntent(str, Enum):
    AFFORDABILITY_CHECK = "AFFORDABILITY_CHECK"
    SUBSCRIPTION_AUDIT = "SUBSCRIPTION_AUDIT"
    SAVINGS_AUTOPILOT = "SAVINGS_AUTOPILOT"
    CASHFLOW_FORECAST = "CASHFLOW_FORECAST"
    HEALTH_DIAGNOSTIC = "HEALTH_DIAGNOSTIC"
    PEER_BENCHMARK = "PEER_BENCHMARK"
    ACTION_RECOMMENDATION = "ACTION_RECOMMENDATION"
    GENERAL_QUERY = "GENERAL_QUERY"


@dataclass
class ExtractedEntities:
    amount: Optional[float] = None
    item_name: Optional[str] = None
    merchant: Optional[str] = None
    time_horizon_days: Optional[int] = None
    goal_name: Optional[str] = None


class IntentClassifier:
    """
    Classifies user financial queries and extracts key numerical and entity parameters.
    """

    # Keyword and pattern rules for financial intents
    INTENT_PATTERNS = {
        AssistantIntent.AFFORDABILITY_CHECK: [
            r"\b(can i afford|should i buy|can i buy|safe to buy|afford to buy|purchase|buying|buy)\b",
            r"\b(afford a|afford an|afford this)\b",
            r"\b(worth buying|is it safe to spend|maximum purchase i can afford)\b"
        ],
        AssistantIntent.SUBSCRIPTION_AUDIT: [
            r"\b(subscription|subscriptions|recurring|cancel|streaming|netflix|spotify|hulu|gym membership|bill creep|price increase)\b",
            r"\b(what bills do i have|how much am i spending on subscriptions|recurring charges|scheduled bills|bills are scheduled)\b"
        ],
        AssistantIntent.SAVINGS_AUTOPILOT: [
            r"\b(save|savings|sweep|autopilot|emergency fund|goal|save this week|transfer to savings|safe sweep)\b",
            r"\b(how much can i save|am i on track for my goal|safe to save|emergency cushion|savings transfer|weekly savings pace)\b"
        ],
        AssistantIntent.CASHFLOW_FORECAST: [
            r"\b(forecast|predict|next week|next month|overdraft|balance next|will i run out of money|cash flow)\b",
            r"\b(projected balance|how much will i have|ending balance|cash projection|balance look like|volatility|safety buffer)\b"
        ],
        AssistantIntent.HEALTH_DIAGNOSTIC: [
            r"\b(health score|financial health|how am i doing|score|persona|grade|dti|runway)\b",
            r"\b(rate my finances|how healthy are my finances|what is my financial status|debt-to-income|credit standing)\b"
        ],
        AssistantIntent.PEER_BENCHMARK: [
            r"\b(peers|twins|compare|people like me|benchmark|cohort|others in my income|other people|income bracket|similar income)\b",
            r"\b(how do other people save|how do i compare|benchmark against)\b"
        ],
        AssistantIntent.ACTION_RECOMMENDATION: [
            r"\b(what should i do|recommend|recommendation|recommendations|advice|next step|action item|how to improve|what to do with)\b",
            r"\b(suggest|best move|action card|impactful financial move|move i can make)\b"
        ]
    }

    @classmethod
    def classify_intent(cls, prompt: str) -> Tuple[AssistantIntent, float]:
        """
        Classifies prompt into one of the canonical financial intents with a confidence score.
        """
        text = prompt.strip().lower()

        scores: Dict[AssistantIntent, int] = {intent: 0 for intent in AssistantIntent}

        for intent, patterns in cls.INTENT_PATTERNS.items():
            for pat in patterns:
                matches = re.findall(pat, text)
                scores[intent] += len(matches) * 2

        # Priority resolution for specific disambiguations:
        if any(k in text for k in ["autopilot", "safe sweep", "transfer to savings", "to my savings"]):
            scores[AssistantIntent.SAVINGS_AUTOPILOT] += 15

        if any(k in text for k in ["other people", "income bracket", "similar income", "benchmark", "twins"]):
            scores[AssistantIntent.PEER_BENCHMARK] += 12

        if any(k in text for k in ["cancel", "streaming", "duplicate", "subscriptions", "subscription"]) and "autopilot" not in text:
            scores[AssistantIntent.SUBSCRIPTION_AUDIT] += 12

        if ("save" in text or "sweep" in text) and not any(k in text for k in ["other people", "cancel", "streaming", "bracket"]):
            scores[AssistantIntent.SAVINGS_AUTOPILOT] += 6

        if any(k in text for k in ["recommend", "recommendation", "recommendations", "impactful financial move", "what should i do next"]) and "safe sweep" not in text and "autopilot" not in text:
            scores[AssistantIntent.ACTION_RECOMMENDATION] += 10

        if any(k in text for k in ["balance look like", "volatility", "safety buffer"]):
            scores[AssistantIntent.CASHFLOW_FORECAST] += 10

        if any(k in text for k in ["debt-to-income", "credit standing"]):
            scores[AssistantIntent.HEALTH_DIAGNOSTIC] += 10

        if ("can i afford" in text or "can i buy" in text) and not ("save" in text or "subscription" in text):
            scores[AssistantIntent.AFFORDABILITY_CHECK] += 14

        best_intent = max(scores, key=scores.get)
        max_score = scores[best_intent]

        if max_score == 0:
            return AssistantIntent.GENERAL_QUERY, 0.50

        confidence = min(0.98, 0.70 + (max_score * 0.05))
        return best_intent, round(confidence, 2)

    @classmethod
    def extract_entities(cls, prompt: str) -> ExtractedEntities:
        """
        Extracts monetary amounts, item names, merchants, and timeframes.
        """
        text = prompt.strip()
        entities = ExtractedEntities()

        # 1. Extract dollar amounts (e.g. "$1,200", "$45.50", "500 dollars", "300 bucks")
        amount_match = re.search(r"\$\s*([\d,]+(?:\.\d{1,2})?)|\b([\d,]+(?:\.\d{1,2})?)\s*(?:dollars|usd|bucks)\b", text, re.IGNORECASE)
        if amount_match:
            raw_amt = amount_match.group(1) or amount_match.group(2)
            try:
                entities.amount = float(raw_amt.replace(",", ""))
            except ValueError:
                pass
        else:
            # Fallback bare number if preceded by buy/purchase/save
            bare_num = re.search(r"\b(?:buy|purchase|save|spend|cost|afford)\s+(?:a\s+)?(?:[a-zA-Z\s]{0,20})?\s*(\d+)\b", text, re.IGNORECASE)
            if bare_num:
                try:
                    entities.amount = float(bare_num.group(1))
                except ValueError:
                    pass

        # 2. Extract purchase item name (e.g. "$1,200 MacBook Pro", "buy a couch for $450")
        # Case A: After dollar amount: e.g. "$1,200 MacBook Pro" or "$35,000 Tesla model Y"
        m1 = re.search(r"\$\s*[\d,]+(?:\.\d{1,2})?\s+(?:(?:worth of|pair of)\s+)?([A-Za-z0-9\s\-]+?)(?:\s+(?:today|now|right|this|next|without|at|from)|$|\?|\.)", text, re.IGNORECASE)
        if m1:
            cand = m1.group(1).strip()
            if len(cand) > 1 and cand.lower() not in {"today", "now", "dollars", "bucks", "to", "it"}:
                entities.item_name = cand.title()

        # Case B: Before dollar amount: e.g. "buy an iPad for $600" or "buy a PS5 for $500"
        if not entities.item_name:
            m2 = re.search(r"\b(?:(?:afford\s+to\s+)?(?:buy|purchase|get)|afford)\s+(?:(?:a|an|this|the)\b\s*)?([A-Za-z0-9\s\-]+?)\s+(?:for|costing|at)\s+\$?\s*[\d,]+", text, re.IGNORECASE)
            if m2:
                cand = m2.group(1).strip()
                if len(cand) > 1 and cand.lower() not in {"to", "it", "this", "that"}:
                    entities.item_name = cand.title()

        # Case C: After buy/purchase without price
        if not entities.item_name:
            m3 = re.search(r"\b(?:buy|purchase|get)\s+(?:(?:a|an|this|the)\b\s*)?([A-Za-z0-9\s\-]+?)(?:\s+(?:today|now|right|this|next)|$|\?|\.)", text, re.IGNORECASE)
            if m3:
                cand = m3.group(1).strip()
                if len(cand) > 1 and cand.lower() not in {"to", "it", "this", "that"}:
                    entities.item_name = cand.title()

        if not entities.item_name and entities.amount:
            entities.item_name = "Target Purchase"

        # 3. Extract merchant names
        known_merchants = ["netflix", "spotify", "hulu", "amazon", "apple", "disney", "gym", "planet fitness", "whole foods", "starbucks"]
        for m in known_merchants:
            if m in text.lower():
                entities.merchant = m.title()
                break

        # 4. Extract horizon days
        day_match = re.search(r"\b(\d+)\s*(?:days|day)\b", text, re.IGNORECASE)
        if day_match:
            entities.time_horizon_days = int(day_match.group(1))
        elif "next week" in text.lower():
            entities.time_horizon_days = 7
        elif "next month" in text.lower() or "30 days" in text.lower():
            entities.time_horizon_days = 30

        return entities
