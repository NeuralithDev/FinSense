"""
Forecasting Baselines for Spending & Cash-Flow Benchmarking.

Provides essential comparative baselines required for ML course project evaluation:
1. HistoricalMeanForecaster: Moving average across historical lookback windows.
2. ExponentialSmoothingForecaster: Exponentially weighted moving average giving higher weight to recency.
3. AutoregressiveRidgeForecaster: L2-regularized linear autoregression with temporal lag features.
"""

from typing import Dict, Any, Optional, Tuple, List
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge


class HistoricalMeanForecaster:
    """
    Predicts next period's spending as the unweighted rolling mean of the lookback window.
    Acts as the classic naive baseline for time-series evaluation.
    """
    def __init__(self, window_size: Optional[int] = None):
        self.window_size = window_size
        self.fitted_means_: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> "HistoricalMeanForecaster":
        """
        X shape: (N_samples, lookback_weeks, num_features)
        Computes mean across time dimension (axis=1) or fits overall category averages.
        """
        if y is not None:
            self.fitted_means_ = np.mean(y, axis=0)
        else:
            self.fitted_means_ = np.mean(X, axis=(0, 1))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        X shape: (N_samples, lookback_weeks, num_features)
        Returns: (N_samples, num_targets) non-negative predictions.
        """
        if X.ndim == 3:
            # If window_size is specified, take only the last k timesteps
            if self.window_size is not None and self.window_size < X.shape[1]:
                window = X[:, -self.window_size:, :]
            else:
                window = X
            preds = np.mean(window, axis=1)
        elif X.ndim == 2:
            preds = np.tile(self.fitted_means_, (len(X), 1))
        else:
            raise ValueError(f"Unsupported input shape: {X.shape}")

        return np.maximum(0.0, preds)


class ExponentialSmoothingForecaster:
    """
    Exponentially Weighted Moving Average (EWMA) baseline.
    Decays weights exponentially: w_t = (1 - alpha)^t
    """
    def __init__(self, alpha: float = 0.3):
        self.alpha = float(np.clip(alpha, 0.01, 1.0))
        self.fitted_mean_: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> "ExponentialSmoothingForecaster":
        if y is not None:
            self.fitted_mean_ = np.mean(y, axis=0)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        X shape: (N_samples, lookback_weeks, num_features)
        Applies exponential weights along the time dimension (axis=1).
        """
        if X.ndim != 3:
            raise ValueError(f"Expected 3D tensor (Batch, Time, Features), got {X.shape}")

        batch_size, seq_len, num_feats = X.shape
        # Timesteps 0, 1, ..., seq_len - 1
        # More recent steps (at seq_len - 1) have higher weight
        time_lags = np.arange(seq_len)[::-1]  # [seq_len-1, ..., 0]
        weights = (1.0 - self.alpha) ** time_lags
        weights /= weights.sum()  # Normalize to sum = 1

        # Reshape weights for broadcasting: (1, seq_len, 1)
        weights = weights.reshape(1, seq_len, 1)
        preds = np.sum(X * weights, axis=1)
        return np.maximum(0.0, preds)


class AutoregressiveRidgeForecaster:
    """
    Autoregressive linear model with L2 regularization.
    Flattens the temporal sequence into lag vectors:
    y_t = W * [x_{t-1}, x_{t-2}, ..., x_{t-L}] + b
    """
    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.model = Ridge(alpha=alpha, positive=True)
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> "AutoregressiveRidgeForecaster":
        """
        X shape: (N_samples, lookback_weeks, num_features)
        y shape: (N_samples, num_targets)
        """
        N, T, D = X.shape
        X_flat = X.reshape(N, T * D)
        self.model.fit(X_flat, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted. Call fit() first.")

        N, T, D = X.shape
        X_flat = X.reshape(N, T * D)
        preds = self.model.predict(X_flat)
        return np.maximum(0.0, preds)
