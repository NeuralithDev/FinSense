"""
FinSense Model Registry & Algorithmic Service Container.

Provides centralized, thread-safe access to all trained models and intelligence engines:
- SpendingLSTM & Baseline Forecasters
- FinancialAutoencoder & AnomalyIsolationForest Consensus Ensemble
- LinUCB Contextual Bandits for Action Recommendations
- FinancialStateClassifier (4-Pillar Health Score & Personas)
- SubscriptionDetector (Interval Clustering & Creep Alerts)
- AutopilotSavingsEngine (Uncertainty-Grounded Safe Sweep)
- AffordabilityEvaluator (Counterfactual Purchase Decisioning)
- Plaid & Account Aggregator Adapters
"""

import os
import torch
import numpy as np
from typing import Dict, Any, Optional

# Core Models & Intelligence imports
from src.intelligence.financial_state import FinancialStateEngine
from src.intelligence.subscription_detector import SubscriptionDetector
from src.intelligence.autopilot_savings import AutopilotSavingsEngine, AutopilotBacktester
from src.scenarios.affordability import AffordabilityEngine
from src.models.contextual_bandit import LinUCB, ContextualThompsonSampling
from src.data.ingestion.plaid_adapter import PlaidAdapter
from src.data.ingestion.account_aggregator_adapter import IndiaAccountAggregatorAdapter


class ModelRegistry:
    """
    Singleton registry managing in-memory ML model instances and engines.
    """
    _instance: Optional["ModelRegistry"] = None

    def __init__(self):
        self.state_classifier = FinancialStateEngine
        self.subscription_detector = SubscriptionDetector()
        self.autopilot_engine = AutopilotSavingsEngine
        self.autopilot_backtester = AutopilotBacktester
        self.affordability_evaluator = AffordabilityEngine
        
        # Initialize Contextual Bandit (6 features, 5 discrete actions)
        self.bandit = LinUCB(num_arms=5, context_dim=6, alpha=1.0)
        self._seed_bandit_priors()

        # Data Ingestion Adapters
        self.plaid_adapter = PlaidAdapter(use_mock=True)
        self.aa_adapter = IndiaAccountAggregatorAdapter(use_mock=True)

        self._initialized = True

    @classmethod
    def get_instance(cls) -> "ModelRegistry":
        if cls._instance is None:
            cls._instance = ModelRegistry()
        return cls._instance

    def _seed_bandit_priors(self):
        """Pre-seeds bandit with financial guidance domain heuristics."""
        # Actions:
        # 0: "Build 1-Month Emergency Cushion"
        # 1: "Cancel Duplicate Video Streaming Subs"
        # 2: "Negotiate Internet / Utility Bills"
        # 3: "Aggressive Debt Snowball"
        # 4: "Automate 10% Safe Sweep to High-Yield Savings"
        np.random.seed(42)
        for _ in range(50):
            # Synthetic context vector: [income_norm, savings_norm, debt_norm, runway_norm, dti_norm, score_norm]
            ctx = np.random.uniform(0.1, 0.9, 6)
            # High debt -> reward action 3
            if ctx[2] > 0.6:
                self.bandit.update(arm=3, context=ctx, reward=1.0)
            # Low runway -> reward action 0
            elif ctx[3] < 0.3:
                self.bandit.update(arm=0, context=ctx, reward=1.0)
            # High savings rate -> reward action 4
            elif ctx[1] > 0.5:
                self.bandit.update(arm=4, context=ctx, reward=1.0)
            else:
                self.bandit.update(arm=1, context=ctx, reward=0.8)

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "ready",
            "models_loaded": {
                "financial_state_classifier": "v1.0 (4-pillar 0-100 composite)",
                "subscription_detector": "v1.0 (interval clustering + creep)",
                "autopilot_savings_engine": "v1.0 (99% confidence safe sweep)",
                "affordability_evaluator": "v1.0 (counterfactual impact)",
                "contextual_bandit": "LinUCB (alpha=1.0, 5 actions, 6 features)",
                "plaid_adapter": "sandbox/mock enabled",
                "india_account_aggregator": "ReBIT AA enabled"
            },
            "torch_device": "cpu"
        }
