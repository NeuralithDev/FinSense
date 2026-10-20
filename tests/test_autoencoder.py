"""
Tests for FinancialAutoencoder in src/models/autoencoder.py
"""

import torch
import numpy as np
from torch.utils.data import DataLoader, TensorDataset
from src.models.autoencoder import FinancialAutoencoder, train_autoencoder


def test_autoencoder_forward_and_shapes():
    batch_size = 16
    input_dim = 19
    latent_dim = 6
    
    model = FinancialAutoencoder(input_dim=input_dim, latent_dim=latent_dim)
    dummy_input = torch.randn(batch_size, input_dim)
    
    # Check forward pass output shape
    reconstructed = model(dummy_input)
    assert reconstructed.shape == (batch_size, input_dim)
    
    # Check latent representation shape
    latent = model.encode(dummy_input)
    assert latent.shape == (batch_size, latent_dim)


def test_autoencoder_reconstruction_and_threshold():
    input_dim = 19
    model = FinancialAutoencoder(input_dim=input_dim)
    
    dummy_val = torch.randn(50, input_dim)
    errors = model.compute_reconstruction_error(dummy_val)
    assert errors.shape == (50,)
    assert (errors >= 0).all()
    
    # Calibrate threshold
    threshold = model.calibrate_threshold(dummy_val, percentile=90.0)
    assert isinstance(threshold, float)
    assert threshold > 0.0
    
    # Predict anomalies
    is_anomaly, raw_errors = model.predict_anomalies(dummy_val)
    assert len(is_anomaly) == 50
    # Exactly ~10% should be flagged as anomalies at 90th percentile
    assert 3 <= is_anomaly.sum() <= 7


def test_autoencoder_train_loop():
    input_dim = 19
    model = FinancialAutoencoder(input_dim=input_dim)
    
    X = torch.randn(64, input_dim)
    loader = DataLoader(TensorDataset(X, X), batch_size=16)
    
    history = train_autoencoder(model, loader, loader, epochs=3, lr=1e-3)
    assert "train_loss" in history
    assert "val_loss" in history
    assert len(history["train_loss"]) == 3


if __name__ == "__main__":
    test_autoencoder_forward_and_shapes()
    test_autoencoder_reconstruction_and_threshold()
    test_autoencoder_train_loop()
    print("ALL AUTOENCODER TESTS PASSED!")
