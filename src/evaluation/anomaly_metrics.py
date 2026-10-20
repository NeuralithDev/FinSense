"""
Evaluation Metrics for Financial Anomaly Detection.

Computes distribution statistics, consensus agreement metrics,
and outlier rates across unsupervised anomaly detectors.
"""

from typing import Dict, Any, Tuple
import numpy as np


def compute_reconstruction_stats(errors: np.ndarray) -> Dict[str, float]:
    """
    Computes statistical distribution parameters of autoencoder reconstruction errors.
    """
    err = np.asarray(errors, dtype=float)
    return {
        "mean_error": round(float(np.mean(err)), 6),
        "std_error": round(float(np.std(err)), 6),
        "median_error": round(float(np.median(err)), 6),
        "p90_cutoff": round(float(np.percentile(err, 90.0)), 6),
        "p95_cutoff": round(float(np.percentile(err, 95.0)), 6),
        "p99_cutoff": round(float(np.percentile(err, 99.0)), 6),
        "max_error": round(float(np.max(err)), 6)
    }


def compute_ensemble_agreement(
    model_a_flags: np.ndarray,
    model_b_flags: np.ndarray
) -> Dict[str, Any]:
    """
    Evaluates agreement and Jaccard similarity between two binary anomaly detectors
    (e.g., Deep Autoencoder vs Isolation Forest).
    """
    a = np.asarray(model_a_flags, dtype=bool)
    b = np.asarray(model_b_flags, dtype=bool)

    if len(a) != len(b):
        raise ValueError(f"Arrays must have same length: {len(a)} vs {len(b)}")

    both_flagged = a & b
    a_only = a & (~b)
    b_only = (~a) & b
    neither = (~a) & (~b)
    union = a | b

    jaccard = float(both_flagged.sum() / union.sum()) if union.sum() > 0 else 1.0
    overall_agreement = float((both_flagged.sum() + neither.sum()) / len(a))

    return {
        "total_samples": len(a),
        "model_a_flagged": int(a.sum()),
        "model_b_flagged": int(b.sum()),
        "consensus_tier_1_count": int(both_flagged.sum()),
        "watchlist_tier_2_count": int(a_only.sum() + b_only.sum()),
        "model_a_only": int(a_only.sum()),
        "model_b_only": int(b_only.sum()),
        "jaccard_similarity": round(jaccard, 4),
        "raw_agreement_rate": round(overall_agreement, 4)
    }
