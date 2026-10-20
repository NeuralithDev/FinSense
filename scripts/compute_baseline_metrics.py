"""
Baseline A: Rolling 4-Week Historical Mean Forecaster.

Establishes the performance floor the LSTM must beat.
Evaluated on the held-out test partition (last 15% of User 0's timeline, ~126 weeks).

Metrics:
  - RMSE  : Root Mean Squared Error (penalizes large misses heavily)
  - MAE   : Mean Absolute Error (dollar-level interpretable)
  - R²    : Coefficient of Determination (how much variance is explained)
  - MAPE  : Mean Absolute Percentage Error (scale-invariant, % format)
"""

import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from src.preprocessing.sequences import WeeklyTransactionAggregator, TemporalSequenceBuilder

# ─────────────────────────────────────────────────
# 1. Build Weekly Series for User 0
# ─────────────────────────────────────────────────
print("="*60)
print("  FinSense Baseline A: Rolling 4-Week Mean Forecaster")
print("="*60)

print("\n[1] Loading and aggregating User 0 transactions...")
raw_df = pd.read_csv('data/raw/IBM/User0_credit_card_transactions.csv')
agg = WeeklyTransactionAggregator(top_k_categories=5)
clean_df = agg.clean_transactions(raw_df)
weekly_df = agg.aggregate_weekly(clean_df)
target_cols = [f'MCC_{m}' for m in agg.top_mccs]

print(f"  Weekly series length : {len(weekly_df)} weeks")
print(f"  Date range           : {weekly_df.index.min().date()} → {weekly_df.index.max().date()}")
print(f"  Target categories    : {target_cols}")

# ─────────────────────────────────────────────────
# 2. Chronological Split (no scaling needed for baseline)
# ─────────────────────────────────────────────────
n = len(weekly_df)
n_train = int(n * 0.70)
n_val   = int(n * 0.15)

# Raw (unscaled) target spend values for interpretable dollar-level metrics
raw_targets = weekly_df[target_cols].values   # shape (n_weeks, 5)

train_raw  = raw_targets[:n_train]
val_raw    = raw_targets[n_train : n_train + n_val]
test_raw   = raw_targets[n_train + n_val :]

print(f"\n[2] Chronological split:")
print(f"  Train weeks : {n_train}  ({weekly_df.index[0].date()} → {weekly_df.index[n_train-1].date()})")
print(f"  Val weeks   : {n_val}   ({weekly_df.index[n_train].date()} → {weekly_df.index[n_train+n_val-1].date()})")
print(f"  Test weeks  : {len(test_raw)}  ({weekly_df.index[n_train+n_val].date()} → {weekly_df.index[-1].date()})")

# ─────────────────────────────────────────────────
# 3. Baseline A: Rolling 4-Week Mean Applied to Test Set
#
# For each test week t, the prediction is the mean of the 4 weeks
# immediately before t — using only observed history (no lookahead).
# ─────────────────────────────────────────────────
WINDOW = 4

print(f"\n[3] Computing rolling {WINDOW}-week mean predictions on test set...")

# We need the 4 weeks before the first test week.
# The last 4 weeks of val serve as the initial lookback buffer.
buffer_start = n_train + n_val - WINDOW
lookback_buffer = raw_targets[buffer_start : n_train + n_val]  # (4, 5)

# Build predictions by sliding the window across test weeks
all_history = np.vstack([lookback_buffer, test_raw])   # buffer + test for rolling
predictions = []
for i in range(len(test_raw)):
    window_slice = all_history[i : i + WINDOW]         # 4 weeks before week t
    predictions.append(window_slice.mean(axis=0))

preds = np.array(predictions)   # (n_test, 5)
actuals = test_raw               # (n_test, 5)

# ─────────────────────────────────────────────────
# 4. Compute Metrics (Per-Category + Aggregate)
# ─────────────────────────────────────────────────
def mape(y_true: np.ndarray, y_pred: np.ndarray, eps: float = 1.0) -> float:
    """MAPE with epsilon guard to avoid division-by-zero on zero-spend weeks."""
    return float(np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + eps))) * 100.0)

print("\n[4] Per-Category Baseline Metrics (Rolling 4-Week Mean):")
print(f"\n{'Category':<15} {'RMSE ($)':>10} {'MAE ($)':>10} {'R²':>8} {'MAPE (%)':>10}")
print("-" * 58)

cat_metrics = {}
for i, cat in enumerate(target_cols):
    y_true = actuals[:, i]
    y_pred = preds[:, i]
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mae  = float(mean_absolute_error(y_true, y_pred))
    r2   = float(r2_score(y_true, y_pred))
    mpe  = mape(y_true, y_pred)
    cat_metrics[cat] = {'rmse': rmse, 'mae': mae, 'r2': r2, 'mape': mpe}
    print(f"{cat:<15} {rmse:>10.2f} {mae:>10.2f} {r2:>8.4f} {mpe:>10.2f}")

# Aggregate (flatten all categories)
agg_rmse = float(np.sqrt(mean_squared_error(actuals.flatten(), preds.flatten())))
agg_mae  = float(mean_absolute_error(actuals.flatten(), preds.flatten()))
agg_r2   = float(r2_score(actuals.flatten(), preds.flatten()))
agg_mape = mape(actuals.flatten(), preds.flatten())

print("-" * 58)
print(f"{'AGGREGATE':<15} {agg_rmse:>10.2f} {agg_mae:>10.2f} {agg_r2:>8.4f} {agg_mape:>10.2f}")

# ─────────────────────────────────────────────────
# 5. Baseline B: Naive Persistence (for comparison)
# ─────────────────────────────────────────────────
persist_preds = all_history[WINDOW-1:-1]   # last week's value = naive prediction

p_rmse = float(np.sqrt(mean_squared_error(actuals.flatten(), persist_preds.flatten())))
p_mae  = float(mean_absolute_error(actuals.flatten(), persist_preds.flatten()))
p_r2   = float(r2_score(actuals.flatten(), persist_preds.flatten()))
p_mape = mape(actuals.flatten(), persist_preds.flatten())

print(f"\n{'NAIVE PERSIST':<15} {p_rmse:>10.2f} {p_mae:>10.2f} {p_r2:>8.4f} {p_mape:>10.2f}")
print("  (Naive Persistence shown for reference only; Baseline A is the official bar)\n")

# ─────────────────────────────────────────────────
# 6. Final Summary for DA Review
# ─────────────────────────────────────────────────
print("="*60)
print("  OFFICIAL BASELINE TARGETS (LSTM must beat these):")
print("="*60)
print(f"  RMSE  : {agg_rmse:.2f}")
print(f"  MAE   : {agg_mae:.2f}")
print(f"  R²    : {agg_r2:.4f}")
print(f"  MAPE  : {agg_mape:.2f}%")
print()
print("  NOTE: R² < 0 means even the rolling mean fails to explain")
print("  variance better than a flat average — LSTM has room to win.")
print("="*60)
