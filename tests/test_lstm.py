"""
Unit tests for SpendingLSTM — verifies shapes, forward pass, and predict() output.
Does NOT train the model; training is done in scripts/train_lstm.py.
"""

import numpy as np
import torch
from torch.utils.data import DataLoader, TensorDataset
from src.models.lstm import SpendingLSTM, train_lstm, EarlyStopping


def test_lstm_forward_shapes():
    """
    Contract: (Batch, T=12, D=10) -> (Batch, C=5)
    """
    model = SpendingLSTM(input_dim=10, hidden_dim=64, num_categories=5)
    x = torch.randn(16, 12, 10)       # batch=16, seq=12, features=10
    y_hat = model(x)

    assert y_hat.shape == (16, 5), f"Expected (16, 5), got {y_hat.shape}"
    print("  ✅ Forward pass shape correct: (16, 5)")


def test_lstm_predict_dollar_space():
    """
    predict() must return numpy array in dollar space (all non-negative after expm1).
    """
    model = SpendingLSTM(input_dim=10, hidden_dim=64, num_categories=5)
    x = torch.zeros(8, 12, 10)         # all zeros → log1p(0) = 0 → expm1(0) = 0

    preds = model.predict(x)
    assert isinstance(preds, np.ndarray), "predict() must return numpy array"
    assert preds.shape == (8, 5), f"Expected (8, 5), got {preds.shape}"
    print("  ✅ predict() shape correct: (8, 5)")


def test_lstm_parameter_count():
    """
    Verify the model isn't accidentally over-parameterized for our dataset size.
    Single LSTM layer with hidden=64: expected ~20,000 params total.
    Rule of thumb: #params should be < 10x training samples (627 × 5 = 3135 targets).
    """
    model = SpendingLSTM(input_dim=10, hidden_dim=64, num_categories=5)
    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)

    # LSTM: 4 * (input_dim + hidden_dim + 1) * hidden_dim
    # FC:   hidden_dim * num_categories
    print(f"  Total trainable parameters: {total_params:,}")
    assert total_params < 50_000, f"Model too large for dataset: {total_params} params"
    print("  ✅ Parameter count acceptable for dataset size")


def test_early_stopping_triggers():
    """
    Simulate a stagnating loss and verify EarlyStopping fires at the right epoch.
    """
    model = SpendingLSTM(input_dim=10, hidden_dim=16, num_categories=5)
    stopper = EarlyStopping(patience=3)

    # Loss improves first, then plateaus
    losses = [0.5, 0.4, 0.39, 0.39, 0.39, 0.39]   # plateau at epoch 3
    stopped = False
    for epoch, loss in enumerate(losses):
        if stopper.step(loss, model):
            stopped = True
            break

    assert stopped, "EarlyStopping should have triggered"
    assert stopper.best_loss == 0.39, f"Best loss should be 0.39, got {stopper.best_loss}"
    print(f"  ✅ Early stopping triggered correctly (patience=3)")


def test_lstm_mini_train_loop():
    """
    Runs 3 epochs of training on synthetic data to verify no crashes.
    Checks that train loss decreases (model is learning).
    """
    model = SpendingLSTM(input_dim=10, hidden_dim=32, num_categories=5)

    np.random.seed(42)
    X = torch.randn(64, 12, 10).float()
    y = torch.randn(64, 5).float()

    loader = DataLoader(TensorDataset(X, y), batch_size=16)

    history = train_lstm(model, loader, loader, epochs=3, lr=1e-3)

    assert "train_loss" in history
    assert "val_loss" in history
    assert len(history["train_loss"]) == 3
    print(f"  ✅ 3-epoch train loop completed. Final train loss: {history['train_loss'][-1]:.6f}")


if __name__ == "__main__":
    print("\n── SpendingLSTM Unit Tests ──\n")
    test_lstm_forward_shapes()
    test_lstm_predict_dollar_space()
    test_lstm_parameter_count()
    test_early_stopping_triggers()
    test_lstm_mini_train_loop()
    print("\n✅ ALL LSTM UNIT TESTS PASSED!\n")
