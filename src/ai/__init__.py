"""
FinSense AI Financial Assistant Package.

Provides zero-arithmetic conversational copilot, intent classification,
context-grounded narration, and benchmark evaluation.
"""

from src.ai.intent_classifier import IntentClassifier, AssistantIntent, ExtractedEntities
from src.ai.context_builder import ContextBuilder, GroundTruthFinancialContext
from src.ai.copilot_narrator import CopilotNarrator, CopilotResponse
from src.ai.eval_benchmarks import BenchmarkEvaluator, GOLDEN_EVAL_DATASET

__all__ = [
    "IntentClassifier",
    "AssistantIntent",
    "ExtractedEntities",
    "ContextBuilder",
    "GroundTruthFinancialContext",
    "CopilotNarrator",
    "CopilotResponse",
    "BenchmarkEvaluator",
    "GOLDEN_EVAL_DATASET"
]
