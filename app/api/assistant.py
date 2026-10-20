"""
AI Financial Copilot Assistant API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

from src.ai.intent_classifier import IntentClassifier, AssistantIntent
from src.ai.context_builder import ContextBuilder, GroundTruthFinancialContext
from src.ai.copilot_narrator import CopilotNarrator, CopilotResponse
from src.ai.eval_benchmarks import BenchmarkEvaluator

router = APIRouter(prefix="/api/assistant", tags=["AI Financial Assistant"])


class ChatQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=2, description="Natural language question (e.g. 'Can I afford a $1,200 MacBook?')")
    user_id: Optional[str] = "user_default"
    checking_balance: Optional[float] = Field(default=None, ge=0.0)
    savings_balance: Optional[float] = Field(default=None, ge=0.0)
    monthly_income: Optional[float] = Field(default=None, ge=0.0)
    monthly_expenses: Optional[float] = Field(default=None, ge=0.0)


class ChatQueryResponse(BaseModel):
    intent: str
    confidence: float
    verdict: Optional[str] = None
    grounded_narrative: str
    verified_metrics: Optional[Dict[str, Any]] = None
    suggested_followups: Optional[List[str]] = None
    action_card: Optional[Dict[str, Any]] = None


@router.post("/chat", response_model=ChatQueryResponse)
def chat_with_copilot(request: ChatQueryRequest):
    """
    Conversational financial intelligence endpoint.
    Translates user questions into engine calls and provides zero-arithmetic grounded explanations.
    """
    try:
        from src.data.user_pipeline import UserDataPipeline
        pipeline = UserDataPipeline.get_instance()

        # Build context with live pipeline store defaults and user overrides
        chk_bal = request.checking_balance if request.checking_balance is not None else float(pipeline.accounts.get("checking", {}).get("balance", 10754.62))
        sav_bal = request.savings_balance if request.savings_balance is not None else float(pipeline.accounts.get("savings", {}).get("balance", 0.0))
        curr = pipeline.accounts.get("checking", {}).get("currency", "INR")
        feat = pipeline.cached_results.get("user_features", {})
        default_income = 25000.0 if curr == "INR" else 2500.0
        default_expenses = float(feat.get("monthly_spending", 15000.0 if curr == "INR" else 1500.0))

        ctx_kwargs: Dict[str, Any] = {
            "user_id": request.user_id or "live_user",
            "checking_balance": chk_bal,
            "savings_balance": sav_bal,
            "monthly_income": request.monthly_income if request.monthly_income is not None else default_income,
            "monthly_expenses": request.monthly_expenses if request.monthly_expenses is not None else default_expenses
        }

        context = ContextBuilder.build_context(**ctx_kwargs)
        response = CopilotNarrator.answer_query(request.prompt, context=context)

        return ChatQueryResponse(
            intent=response.intent,
            confidence=response.confidence,
            verdict=response.verdict,
            grounded_narrative=response.grounded_narrative,
            verified_metrics=response.verified_metrics,
            suggested_followups=response.suggested_followups or [],
            action_card=getattr(response, "action_card", None)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant chat error: {str(e)}")


@router.get("/benchmark")
def run_benchmark():
    """
    Runs the 50-question golden evaluation suite and returns accuracy, fidelity, and safety scores.
    """
    try:
        results = BenchmarkEvaluator.run_eval_suite()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution error: {str(e)}")
