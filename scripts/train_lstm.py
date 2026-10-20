"""
FinSense: Train Single-Layer SpendingLSTM on User 0 Spending Sequences.

Workflow:
1. Load User 0 transactions from data/raw/IBM/User0_credit_card_transactions.csv.
2. Clean and aggregate transactions to a weekly time grid using WeeklyTransactionAggregator.
3. Build sliding window sequence tensors (T=12 lookback, horizon=1) with zero-leakage scaling.
4. Train single-layer SpendingLSTM using train_lstm() with early stopping and LR scheduler.
5. Evaluate on held-out test split (dollar space) and benchmark against Baseline A.
6. Save best trained model weights to models/trained/lstm_user0.pt.
"""

import os
from pathlib import Path
import json
import torch
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np

from src.preprocessing.sequences import WeeklyTransactionAggregator, TemporalSequenceBuilder
from src.models.lstm import SpendingLSTM, train_lstm, evaluate_lstm


def run_training():
    torch.manual_seed(42)
    np.random.seed(42)
    print("=" * 65)
    print("  FinSense SpendingLSTM Training & Evaluation Pipeline")
    print("=" * 65)

    root = Path("/Users/ms/Desktop/FinSense")
    raw_path = root / "data" / "raw" / "IBM" / "User0_credit_card_transactions.csv"
    save_dir = root / "models" / "trained"
    save_dir.mkdir(parents=True, exist_ok=True)
    save_path = save_dir / "lstm_user0.pt"

    # ─────────────────────────────────────────────────────────────
    # 1. Load and aggregate raw transactions
    # ─────────────────────────────────────────────────────────────
    print("\n[1] Loading User 0 transactions...")
    raw_df = pd.read_csv(raw_path)
    agg = WeeklyTransactionAggregator(top_k_categories=5)
    clean_df = agg.clean_transactions(raw_df)
    weekly_df = agg.aggregate_weekly(clean_df)
    target_cols = [f"MCC_{m}" for m in agg.top_mccs]

    print(f"  Raw transactions: {len(raw_df):,}")
    print(f"  Weekly continuous intervals: {len(weekly_df)} weeks")
    print(f"  Target categories: {target_cols}")

    # ─────────────────────────────────────────────────────────────
    # 2. Build Sequence Tensors (70% train / 15% val / 15% test)
    # ─────────────────────────────────────────────────────────────
    print("\n[2] Building sliding window sequences (T=12 lookback)...")
    builder = TemporalSequenceBuilder(lookback_weeks=12, forecast_horizon=1)
    dataset = builder.prepare_dataset(weekly_df, target_cols=target_cols)

    print(f"  Train: X={dataset.X_train.shape}, y={dataset.y_train.shape}")
    print(f"  Val:   X={dataset.X_val.shape}, y={dataset.y_val.shape}")
    print(f"  Test:  X={dataset.X_test.shape}, y={dataset.y_test.shape}")

    # Create PyTorch DataLoaders
    batch_size = 16
    train_loader = DataLoader(
        TensorDataset(dataset.X_train, dataset.y_train),
        batch_size=batch_size,
        shuffle=True
    )
    val_loader = DataLoader(
        TensorDataset(dataset.X_val, dataset.y_val),
        batch_size=batch_size,
        shuffle=False
    )

    # ─────────────────────────────────────────────────────────────
    # 3. Model Architecture & Initialization
    # ─────────────────────────────────────────────────────────────
    input_dim = dataset.X_train.shape[2]  # 10
    num_categories = dataset.y_train.shape[1]  # 5
    hidden_dim = 64
    dropout_rate = 0.25

    print(f"\n[3] Initializing SpendingLSTM (D={input_dim}, Hidden={hidden_dim}, C={num_categories})...")
    model = SpendingLSTM(
        input_dim=input_dim,
        hidden_dim=hidden_dim,
        num_categories=num_categories,
        dropout_rate=dropout_rate
    )
    total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Trainable parameters: {total_params:,}")

    # ─────────────────────────────────────────────────────────────
    # 4. Training Loop
    # ─────────────────────────────────────────────────────────────
    print("\n[4] Training SpendingLSTM with Early Stopping...")
    history = train_lstm(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=150,
        lr=1e-3,
        weight_decay=1e-4,
        device="cpu"
    )

    # ─────────────────────────────────────────────────────────────
    # 5. Evaluate on Out-of-Time Test Set
    # ─────────────────────────────────────────────────────────────
    print("\n[5] Evaluating on held-out test split (126 weeks)...")
    metrics = evaluate_lstm(
        model=model,
        X_test=dataset.X_test,
        y_test_log=dataset.y_test,
        target_cols=target_cols
    )

    # ─────────────────────────────────────────────────────────────
    # 6. Save Model Checkpoint & Training Metadata
    # ─────────────────────────────────────────────────────────────
    checkpoint = {
        "model_state_dict": model.state_dict(),
        "input_dim": input_dim,
        "hidden_dim": hidden_dim,
        "num_categories": num_categories,
        "dropout_rate": dropout_rate,
        "target_cols": target_cols,
        "history": history,
        "test_metrics": metrics
    }
    torch.save(checkpoint, save_path)
    print(f"\n✅ Model checkpoint saved to: {save_path}")

    # Save summary metrics JSON
    metrics_path = save_dir / "lstm_user0_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"✅ Metrics saved to: {metrics_path}\n")

    return metrics


if __name__ == "__main__":
    run_training()
