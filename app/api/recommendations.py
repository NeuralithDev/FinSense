"""
Personalized Action Recommendations API Router (LinUCB Bandits).
Dynamically ground action cards in real Indian banking context and cast all numpy types to python native types.
"""

from fastapi import APIRouter, HTTPException
import numpy as np
from app.schemas import RecommendationRequest, RecommendationResponse, ActionCard
from app.services.model_registry import ModelRegistry
from src.data.user_pipeline import UserDataPipeline

router = APIRouter(prefix="/api/recommendations", tags=["Action Recommendations"])


def get_action_catalog(curr: str = "INR"):
    sym = "₹" if curr == "INR" else "$"
    if curr == "INR":
        return {
            0: {
                "title": "Build 1-Month Emergency Cushion",
                "category": "Liquidity",
                "action_type": "AUTOMATE_SAVINGS",
                "impact_metric": "+₹15,000 Safety Buffer",
                "description": "Your current checking runway is 2.4 months. Prioritize an initial ₹15,000 liquid buffer in your Semester Safety Goal."
            },
            1: {
                "title": "Consolidate Tech Subscriptions",
                "category": "Subscriptions",
                "action_type": "CANCEL_SUBSCRIPTION",
                "impact_metric": "+₹224/mo Cash Recovery",
                "description": "You have recurring commitments for Apple iCloud and streaming. Reviewing unused tiers keeps money in your checking."
            },
            2: {
                "title": "Pace Daily Campus Micro-Spends",
                "category": "Budgeting",
                "action_type": "HABIT_DEFENSE",
                "impact_metric": "+₹1,200/mo Retained",
                "description": "Frequent transactions at local marts and quick commerce add up quickly. Cap daily discretionary spend at ₹300."
            },
            3: {
                "title": "Automate Safe Sweep to Savings Buffer",
                "category": "Wealth Building",
                "action_type": "AUTOMATE_SWEEP",
                "impact_metric": "0% Overdraft Risk",
                "description": "Your cash flow is steady. Automate weekly autopilot sweeps of ₹500 into your savings goals without any overdraft risk."
            },
            4: {
                "title": "Micro-Habit Guard for Daily Swipes",
                "category": "Spending Habits",
                "action_type": "HABIT_DEFENSE",
                "impact_metric": "-₹1,200/mo Impulse Outflow",
                "description": "Gateway purchases at local stores often lead to instant delivery sprees within 3 hours. Set a cooling-off reminder."
            }
        }
    else:
        return {
            0: {
                "title": "Build 1-Month Emergency Cushion",
                "category": "Liquidity",
                "action_type": "AUTOMATE_SAVINGS",
                "impact_metric": "+$1,000 Safety Buffer",
                "description": "Your current runway is below 30 days. Prioritize an initial $1,000 liquid safety buffer before aggressive investing."
            },
            1: {
                "title": "Consolidate Duplicate Streaming Services",
                "category": "Subscriptions",
                "action_type": "CANCEL_SUBSCRIPTION",
                "impact_metric": "+$31.98/mo Cash Recovery",
                "description": "You have active subscriptions with overlap. Cancelling redundant tiers recovers $383 annually."
            },
            2: {
                "title": "Audit Telecom & Utility Creep",
                "category": "Bills",
                "action_type": "BILL_NEGOTIATION",
                "impact_metric": "+$240/yr Saved",
                "description": "Switch to promotional rate to save $240 annually on utility and cloud expenses."
            },
            3: {
                "title": "Automate Safe Sweep to High-Yield Savings",
                "category": "Wealth Building",
                "action_type": "AUTOMATE_SWEEP",
                "impact_metric": "+4.5% APY Compounding",
                "description": "Automate weekly autopilot sweeps to capture 4.5% APY compounding return with 0 overdraft risk."
            },
            4: {
                "title": "Accelerate High-APR Debt Snowball",
                "category": "Debt",
                "action_type": "PAYOFF_ACCELERATION",
                "impact_metric": "-24.9% APR Drag",
                "description": "Focus extra cash flow on highest APR credit card to eliminate compounding interest charges."
            }
        }


@router.get("")
def get_bandit_recommendations(user_id: str = "0", top_k: int = 5):
    """
    Returns dynamically ranked financial guidance cards from LinUCB contextual bandit.
    """
    try:
        pipeline = UserDataPipeline.get_instance()
        curr = pipeline.accounts.get("checking", {}).get("currency", "INR")
        catalog = get_action_catalog(curr)

        registry = ModelRegistry.get_instance()
        bandit = registry.bandit

        ctx = np.array([0.7, 0.6, 0.2, 0.65, 0.25, 0.78], dtype=float)
        ranked_arms = bandit.rank_arms(ctx)
        _, p_scores = bandit.select_arm(ctx)

        recommendations = []
        for arm_id in ranked_arms[:top_k]:
            idx = int(arm_id)
            card = catalog.get(idx, catalog[0])
            recommendations.append({
                "action_id": idx,
                "title": card["title"],
                "category": card["category"],
                "action_type": card["action_type"],
                "impact_metric": card.get("impact_metric", "+Health Score"),
                "predicted_reward_ucb": round(float(p_scores[idx]), 3),
                "description": card["description"]
            })

        return {
            "user_id": user_id,
            "bandit_algorithm": "LinUCB (Disjoint Linear Models, alpha=1.0)",
            "context_dimension": 6,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bandit recommendations error: {str(e)}")


@router.post("/rank", response_model=RecommendationResponse)
def rank_recommendations(request: RecommendationRequest):
    """
    Ranks personalized financial guidance cards using a Contextual Bandit (LinUCB).
    """
    try:
        pipeline = UserDataPipeline.get_instance()
        curr = pipeline.accounts.get("checking", {}).get("currency", "INR")
        catalog = get_action_catalog(curr)

        registry = ModelRegistry.get_instance()
        bandit = registry.bandit

        ctx = np.array(request.user_state_vector, dtype=float)
        if len(ctx) != 6:
            if len(ctx) < 6:
                ctx = np.pad(ctx, (0, 6 - len(ctx)), 'constant', constant_values=0.5)
            else:
                ctx = ctx[:6]

        _, p_scores = bandit.select_arm(ctx)
        scores = [(int(a), float(p_scores[a])) for a in range(bandit.num_arms)]
        scores.sort(key=lambda item: item[1], reverse=True)

        k = min(request.top_k, len(scores))
        cards = []
        for rank_idx in range(k):
            action_id, ucb_score = scores[rank_idx]
            info = catalog.get(action_id, catalog[0])
            cards.append(ActionCard(
                action_id=int(action_id),
                title=info["title"],
                category=info["category"],
                predicted_impact_score=round(ucb_score, 3),
                action_type=info["action_type"],
                description=info["description"]
            ))

        return RecommendationResponse(
            recommendations=cards,
            bandit_model="LinUCB Contextual Exploration (alpha=1.0)"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bandit ranking error: {str(e)}")
