"""
Unit tests for DeepPersonaMLP (Residual Persona & Overdraft Risk Classifier).
"""

import numpy as np
import torch
from src.models.persona_mlp import DeepPersonaMLP, PERSONA_LABELS, RISK_TIERS


def test_persona_mlp_forward():
    batch_size = 4
    input_dim = 12
    model = DeepPersonaMLP(input_dim=input_dim, hidden_dim=32, num_personas=6, num_risk_tiers=4)
    
    x = torch.randn(batch_size, input_dim)
    p_logits, r_logits = model(x)
    assert p_logits.shape == (batch_size, 6)
    assert r_logits.shape == (batch_size, 4)


def test_persona_probabilities_sum_to_one():
    model = DeepPersonaMLP(input_dim=10, hidden_dim=32, num_personas=6, num_risk_tiers=4)
    x = torch.randn(3, 10)
    p_probs, r_probs = model.predict_probabilities(x)
    
    assert np.allclose(np.sum(p_probs, axis=1), 1.0, atol=1e-5)
    assert np.allclose(np.sum(r_probs, axis=1), 1.0, atol=1e-5)


def test_classify_profile():
    model = DeepPersonaMLP(input_dim=12, hidden_dim=32)
    feat = np.array([0.25, 0.35, 4.2, 750.0, 1.2, 0.45, 0.8, 0.1, 0.9, 0.2, 0.3, 0.5])
    diag = model.classify_profile(feat)
    
    assert "predicted_persona" in diag
    assert diag["predicted_persona"] in PERSONA_LABELS
    assert "predicted_risk_tier" in diag
    assert diag["predicted_risk_tier"] in RISK_TIERS
    assert len(diag["persona_distribution"]) == 6
    assert len(diag["risk_distribution"]) == 4


def test_persona_mlp_checkpoint(tmp_path):
    path = str(tmp_path / "test_persona.pt")
    model = DeepPersonaMLP(input_dim=8, hidden_dim=16)
    model.save_checkpoint(path)
    
    model.eval()
    loaded = DeepPersonaMLP.load_checkpoint(path)
    loaded.eval()
    x = torch.randn(1, 8)
    with torch.no_grad():
        p1, r1 = model(x)
        p2, r2 = loaded(x)
    assert np.allclose(p1.numpy(), p2.numpy(), atol=1e-5)
    assert np.allclose(r1.numpy(), r2.numpy(), atol=1e-5)


if __name__ == "__main__":
    test_persona_mlp_forward()
    test_persona_probabilities_sum_to_one()
    test_classify_profile()
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        from pathlib import Path
        test_persona_mlp_checkpoint(Path(td))
    print("ALL DEEP PERSONA MLP TESTS PASSED!")
