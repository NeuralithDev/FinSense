"""
Single-Layer LSTM for Per-Category Weekly Spending Forecasting.

Architecture Decision (justified):
  - Single LSTM layer with hidden_dim units.
  - Why NOT stacked? Only 627 training windows. A 2-layer stacked LSTM would
    have ~2x the parameters with a high risk of overfitting — we'd need
    at least 5,000+ sequences to benefit from depth.
  - Dropout applied to the LSTM output before the projection head.
  - Linear projection head: (hidden_dim) → (num_categories).

Input Contract:
  X : Tensor of shape (Batch, Sequence=12, Features=10)
      Log-normalized weekly spending features per timestep.

Output Contract:
  y_hat : Tensor of shape (Batch, 5)
      Log-space predictions of next-week spend for each category.
      Caller must expm1() to recover dollar values.

Training:
  - Loss     : MSELoss on log1p-scaled targets
  - Optimizer: AdamW with weight decay
  - Schedule : ReduceLROnPlateau on validation loss (patience=10)
  - Stopping : Early stopping if val loss does not improve for 15 epochs
"""

from typing import Dict, Any, Optional, Tuple
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


class SpendingLSTM(nn.Module):
    """
    Single-layer LSTM forecaster for multi-category weekly spending.
    """
    def __init__(
        self,
        input_dim: int = 10,
        hidden_dim: int = 64,
        num_categories: int = 5,
        dropout_rate: float = 0.25
    ):
        """
        Args:
            input_dim      : Number of input features per time step (D=10).
            hidden_dim     : Number of LSTM hidden units.
            num_categories : Number of spending categories to predict (C=5).
            dropout_rate   : Dropout probability applied after LSTM output.
        """
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_categories = num_categories

        # ── LSTM Layer ────────────────────────────────────────────────────────
        # batch_first=True means input shape is (Batch, Seq, Features)
        # rather than PyTorch's default (Seq, Batch, Features)
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            dropout=0.0   # dropout only applies between layers; irrelevant for 1 layer
        )

        # ── Refined 2-Stage Forecasting Head ─────────────────────────────────
        # 2-stage non-linear projection with intermediate bottleneck and ReLU.
        # Enforces non-negativity in log space so the model never predicts negative spending.
        self.head = nn.Sequential(
            nn.Dropout(p=dropout_rate),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, num_categories),
            nn.ReLU()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x : (Batch, Seq=12, input_dim=10)

        Returns:
            y_hat : (Batch, num_categories=5) non-negative log-space spend predictions
        """
        lstm_out, (h_n, c_n) = self.lstm(x)

        # Take only the last time step's hidden state
        # h_n shape: (num_layers=1, Batch, hidden_dim) → squeeze to (Batch, hidden_dim)
        last_hidden = h_n.squeeze(0)     # (Batch, hidden_dim)
        y_hat = self.head(last_hidden)   # (Batch, num_categories)
        return y_hat

    def predict(self, x: torch.Tensor) -> np.ndarray:
        """
        Inference-mode prediction returning dollar-space values.
        Applies expm1() with zero-guard to recover valid dollar values.

        Args:
            x : (Batch, Seq, input_dim) — scaled input tensor

        Returns:
            np.ndarray of shape (Batch, num_categories) in dollar units (>= 0.0)
        """
        self.eval()
        with torch.no_grad():
            log_preds = self.forward(x)
        return np.maximum(0.0, np.expm1(log_preds.cpu().numpy()))


class EarlyStopping:
    """
    Stops training when validation loss stops improving.
    Saves best model weights at the improvement epoch.
    """
    def __init__(self, patience: int = 15, min_delta: float = 1e-5):
        self.patience = patience
        self.min_delta = min_delta
        self.best_loss = float('inf')
        self.counter = 0
        self.best_weights: Optional[Dict[str, Any]] = None
        self.triggered = False

    def step(self, val_loss: float, model: nn.Module) -> bool:
        """
        Returns True if training should stop.
        """
        if val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter = 0
            self.best_weights = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.triggered = True
        return self.triggered

    def restore_best(self, model: nn.Module) -> None:
        """Loads best-seen weights back into the model."""
        if self.best_weights is not None:
            model.load_state_dict(self.best_weights)


def train_lstm(
    model: SpendingLSTM,
    train_loader: DataLoader,
    val_loader: DataLoader,
    epochs: int = 150,
    lr: float = 1e-3,
    weight_decay: float = 1e-4,
    loss_type: str = "smooth_l1",
    device: str = "cpu"
) -> Dict[str, Any]:
    """
    Training loop for SpendingLSTM with AdamW optimizer,
    ReduceLROnPlateau scheduler, and early stopping.

    Args:
        loss_type: 'smooth_l1' (Huber loss, robust to bulk spending spikes) or 'mse'.

    Returns:
        history dict with 'train_loss', 'val_loss', 'stopped_epoch'
    """
    model.to(device)
    if loss_type == "smooth_l1":
        criterion: nn.Module = nn.SmoothL1Loss(beta=1.0)
    elif loss_type == "mse":
        criterion = nn.MSELoss()
    else:
        raise ValueError(f"Unknown loss_type: {loss_type}. Choose 'smooth_l1' or 'mse'.")

    optimizer = torch.optim.AdamW(
        model.parameters(), lr=lr, weight_decay=weight_decay
    )
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=10
    )
    stopper = EarlyStopping(patience=15)
    history: Dict[str, Any] = {'train_loss': [], 'val_loss': [], 'stopped_epoch': epochs}

    for epoch in range(1, epochs + 1):
        # ── Training Phase ──────────────────────────────────────────
        model.train()
        epoch_train_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch = X_batch.to(device)
            y_batch = y_batch.to(device)
            optimizer.zero_grad()
            y_hat = model(X_batch)
            loss = criterion(y_hat, y_batch)
            loss.backward()
            # Gradient clipping prevents exploding gradients in RNNs
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            epoch_train_loss += loss.item() * X_batch.size(0)

        avg_train = epoch_train_loss / len(train_loader.dataset)

        # ── Validation Phase ────────────────────────────────────────
        model.eval()
        epoch_val_loss = 0.0
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch = X_batch.to(device)
                y_batch = y_batch.to(device)
                y_hat = model(X_batch)
                loss = criterion(y_hat, y_batch)
                epoch_val_loss += loss.item() * X_batch.size(0)

        avg_val = epoch_val_loss / len(val_loader.dataset)
        scheduler.step(avg_val)

        history['train_loss'].append(avg_train)
        history['val_loss'].append(avg_val)

        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:>4d}/{epochs} | "
                  f"Train Loss: {avg_train:.6f} | "
                  f"Val Loss: {avg_val:.6f}")

        if stopper.step(avg_val, model):
            print(f"\n  Early stopping triggered at epoch {epoch}.")
            history['stopped_epoch'] = epoch
            break

    stopper.restore_best(model)
    print(f"  Best Val Loss: {stopper.best_loss:.6f}")
    return history


def evaluate_lstm(
    model: SpendingLSTM,
    X_test: torch.Tensor,
    y_test_log: torch.Tensor,
    target_cols: list
) -> Dict[str, Any]:
    """
    Evaluates trained LSTM on test set and computes RMSE/MAE/R² in dollar space.
    Compares against the locked Baseline A targets.

    Args:
        model       : Trained SpendingLSTM.
        X_test      : (N_test, Seq, Features) scaled input tensor.
        y_test_log  : (N_test, C) log-space ground truth tensor.
        target_cols : List of category names for reporting.

    Returns:
        Dict of per-category and aggregate metrics.
    """
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

    # BASELINE A targets (locked from compute_baseline_metrics.py run)
    BASELINE_RMSE = 183.39
    BASELINE_MAE  = 146.56
    BASELINE_R2   = -0.04

    # Recover dollar values (inverse of log1p is expm1)
    preds_dollars  = model.predict(X_test)                            # (N_test, C)
    actual_dollars = np.expm1(y_test_log.cpu().numpy())               # (N_test, C)

    print("\n" + "="*65)
    print("  LSTM Evaluation vs. Baseline A (Rolling 4-Week Mean)")
    print("="*65)
    print(f"\n{'Category':<15} {'RMSE ($)':>10} {'MAE ($)':>10} {'R²':>8}")
    print("-" * 47)

    all_metrics = {}
    for i, cat in enumerate(target_cols):
        y_true = actual_dollars[:, i]
        y_pred = preds_dollars[:, i]
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        mae  = float(mean_absolute_error(y_true, y_pred))
        r2   = float(r2_score(y_true, y_pred))
        all_metrics[cat] = {'rmse': rmse, 'mae': mae, 'r2': r2}
        print(f"{cat:<15} {rmse:>10.2f} {mae:>10.2f} {r2:>8.4f}")

    agg_rmse = float(np.sqrt(mean_squared_error(actual_dollars.flatten(), preds_dollars.flatten())))
    agg_mae  = float(mean_absolute_error(actual_dollars.flatten(), preds_dollars.flatten()))
    agg_r2   = float(r2_score(actual_dollars.flatten(), preds_dollars.flatten()))

    print("-" * 47)
    print(f"{'LSTM AGGREGATE':<15} {agg_rmse:>10.2f} {agg_mae:>10.2f} {agg_r2:>8.4f}")

    # Compare vs Baseline A
    print(f"\n{'BASELINE A':<15} {BASELINE_RMSE:>10.2f} {BASELINE_MAE:>10.2f} {BASELINE_R2:>8.4f}")
    beat_rmse = agg_rmse < BASELINE_RMSE
    beat_mae  = agg_mae  < BASELINE_MAE
    beat_r2   = agg_r2   > BASELINE_R2

    print(f"\n  Beats Baseline RMSE : {'✅ YES' if beat_rmse else '❌ NO'}")
    print(f"  Beats Baseline MAE  : {'✅ YES' if beat_mae  else '❌ NO'}")
    print(f"  Beats Baseline R²   : {'✅ YES' if beat_r2   else '❌ NO'}")
    print("="*65)

    all_metrics['aggregate'] = {'rmse': agg_rmse, 'mae': agg_mae, 'r2': agg_r2}
    return all_metrics
