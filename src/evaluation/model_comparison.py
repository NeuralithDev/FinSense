"""
Model Comparison and Benchmarking Suite for FinSense.

Produces standardized comparative tables and leaderboards to evaluate
model trade-offs (accuracy, inference latency, parameter count, explainability)
for both forecasting and anomaly detection domains.
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from src.evaluation.forecasting_metrics import evaluate_forecast
from src.evaluation.anomaly_metrics import compute_ensemble_agreement


class ForecastingBenchmark:
    """
    Compares multiple time-series forecasters on identical test sets.
    """
    def __init__(self):
        self.results: List[Dict[str, Any]] = []

    def evaluate_model(
        self,
        model_name: str,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        param_count: Optional[int] = None,
        latency_ms: Optional[float] = None
    ) -> Dict[str, Any]:
        metrics = evaluate_forecast(y_true, y_pred)
        entry = {
            "model": model_name,
            **metrics,
            "params": param_count if param_count is not None else "N/A",
            "latency_ms": round(latency_ms, 2) if latency_ms is not None else "N/A"
        }
        self.results.append(entry)
        return entry

    def summary_table(self) -> pd.DataFrame:
        """Returns leaderboard sorted by lowest WAPE and RMSE."""
        df = pd.DataFrame(self.results)
        if not df.empty and "wape" in df.columns:
            df = df.sort_values(by=["wape", "rmse"]).reset_index(drop=True)
        return df


class AnomalyBenchmark:
    """
    Compares unsupervised anomaly detection architectures and ensemble behavior.
    """
    def __init__(self):
        self.model_summaries: List[Dict[str, Any]] = []

    def log_model(
        self,
        name: str,
        flag_rate: float,
        threshold: float,
        description: str
    ) -> None:
        self.model_summaries.append({
            "model": name,
            "outlier_rate_pct": round(flag_rate * 100.0, 2),
            "calibrated_threshold": round(threshold, 4),
            "description": description
        })

    def summary_table(self) -> pd.DataFrame:
        return pd.DataFrame(self.model_summaries)
