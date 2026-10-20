"""
Isolation Forest Baseline for Financial Spending Anomaly Detection.

Implements an ensemble of Isolation Trees (iTrees) to isolate abnormal spending patterns
via random recursive axis-aligned partitioning.
"""

from typing import Tuple, Optional, Dict, Any, List
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


class AnomalyIsolationForest:
    """
    Scikit-Learn Isolation Forest wrapper with production persistence and ensemble integration.
    """
    def __init__(
        self,
        n_estimators: int = 150,
        contamination: float = 0.05,
        random_state: int = 42
    ):
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray) -> "AnomalyIsolationForest":
        """Fits the ensemble of isolation trees."""
        self.model.fit(X)
        self.is_fitted = True
        return self

    def predict_anomalies(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Scores input records.
        Returns:
            is_anomaly: Boolean array (True = anomaly)
            anomaly_scores: Continuous anomaly score (higher = more anomalous)
        """
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted yet. Call fit() first.")
        
        # Scikit-learn outputs -1 for anomaly and +1 for normal
        raw_preds = self.model.predict(X)
        is_anomaly = (raw_preds == -1)
        
        # Invert decision function: higher value = more anomalous
        scores = -self.model.decision_function(X)
        return is_anomaly, scores

    def save_model(self, file_path: str) -> None:
        """Serializes trained model artifact to disk."""
        joblib.dump(self.model, file_path)

    @classmethod
    def load_model(cls, file_path: str) -> "AnomalyIsolationForest":
        """Loads serialized model artifact."""
        instance = cls()
        instance.model = joblib.load(file_path)
        instance.is_fitted = True
        return instance

    @staticmethod
    def ensemble_evaluate(
        autoencoder_anomalies: np.ndarray,
        iso_forest_anomalies: np.ndarray
    ) -> Dict[str, Any]:
        """
        Combines Autoencoder and Isolation Forest into a Two-Tier Ensemble:
        - Tier 1 (High Confidence): Both models agree (Intersection)
        - Tier 2 (Advisory Watchlist): Exactly one model flags (XOR)
        """
        both_agreed = autoencoder_anomalies & iso_forest_anomalies
        ae_only = autoencoder_anomalies & (~iso_forest_anomalies)
        iso_only = (~autoencoder_anomalies) & iso_forest_anomalies
        union = autoencoder_anomalies | iso_forest_anomalies
        
        jaccard = (both_agreed.sum() / union.sum()) if union.sum() > 0 else 0.0

        return {
            "tier_1_consensus_count": int(both_agreed.sum()),
            "autoencoder_only_count": int(ae_only.sum()),
            "iso_forest_only_count": int(iso_only.sum()),
            "jaccard_similarity": round(float(jaccard), 4),
            "tier_1_mask": both_agreed,
            "tier_2_mask": ae_only | iso_only
        }
