"""
Unit tests for TemporalSpendTCN (Dilated Causal 1D-CNN Forecaster).
"""

import numpy as np
import torch
from src.models.tcn_forecaster import TemporalSpendTCN, Chomp1d, TemporalBlock


def test_chomp1d():
    x = torch.randn(2, 4, 15)
    chomp = Chomp1d(chomp_size=3)
    out = chomp(x)
    assert out.shape == (2, 4, 12)


def test_tcn_forward_and_non_negative():
    batch_size = 4
    seq_len = 12
    num_inputs = 10
    output_dim = 5
    
    model = TemporalSpendTCN(
        num_inputs=num_inputs,
        num_channels=[16, 32],
        output_dim=output_dim,
        kernel_size=3
    )
    
    x = torch.randn(batch_size, seq_len, num_inputs)
    out = model(x)
    assert out.shape == (batch_size, output_dim)
    # Output must be non-negative in log-space
    assert torch.all(out >= 0.0)


def test_tcn_dollar_predictions():
    model = TemporalSpendTCN(num_inputs=8, num_channels=[16, 32], output_dim=4)
    x = torch.randn(2, 10, 8)
    dollars = model.predict_dollars(x)
    assert dollars.shape == (2, 4)
    assert np.all(dollars >= 0.0)


def test_ensemble_forecasting():
    lstm_preds = np.array([[100.0, 50.0], [200.0, 75.0]])
    tcn_preds = np.array([[120.0, 40.0], [180.0, 85.0]])
    
    ens = TemporalSpendTCN.ensemble_forecast(lstm_preds, tcn_preds, lstm_weight=0.5)
    expected = np.array([[110.0, 45.0], [190.0, 80.0]])
    assert np.allclose(ens, expected)


def test_tcn_checkpoint_roundtrip(tmp_path):
    path = str(tmp_path / "test_tcn.pt")
    model = TemporalSpendTCN(num_inputs=6, num_channels=[16], output_dim=3)
    model.save_checkpoint(path)
    
    model.eval()
    loaded = TemporalSpendTCN.load_checkpoint(path)
    loaded.eval()
    x = torch.randn(1, 8, 6)
    with torch.no_grad():
        out1 = model(x).numpy()
        out2 = loaded(x).numpy()
    assert np.allclose(out1, out2, atol=1e-5)


if __name__ == "__main__":
    test_chomp1d()
    test_tcn_forward_and_non_negative()
    test_tcn_dollar_predictions()
    test_ensemble_forecasting()
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        from pathlib import Path
        test_tcn_checkpoint_roundtrip(Path(td))
    print("ALL TEMPORAL SPEND TCN TESTS PASSED!")
