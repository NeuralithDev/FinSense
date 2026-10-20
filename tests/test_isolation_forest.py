"""
Tests for AnomalyIsolationForest in src/models/isolation_forest.py
"""

import numpy as np
from src.models.isolation_forest import AnomalyIsolationForest


def test_isolation_forest_fit_predict():
    np.random.seed(42)
    # 200 normal points + 10 extreme outliers
    normal = np.random.normal(0, 1, (200, 5))
    outliers = np.random.uniform(10, 15, (10, 5))
    X = np.vstack([normal, outliers])

    model = AnomalyIsolationForest(n_estimators=50, contamination=0.05)
    model.fit(X)

    is_anomaly, scores = model.predict_anomalies(X)
    assert len(is_anomaly) == 210
    assert len(scores) == 210
    assert is_anomaly.sum() > 0

    # Test ensemble evaluate
    dummy_ae = np.zeros(210, dtype=bool)
    dummy_ae[-10:] = True  # flags the last 10
    
    ensemble = AnomalyIsolationForest.ensemble_evaluate(dummy_ae, is_anomaly)
    assert "tier_1_consensus_count" in ensemble
    assert "jaccard_similarity" in ensemble


if __name__ == "__main__":
    test_isolation_forest_fit_predict()
    print("ALL ISOLATION FOREST TESTS PASSED!")
