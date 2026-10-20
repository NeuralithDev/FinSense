"""
Temporal Sequence Preprocessing & Sliding Window Builder for FinSense.

Transforms irregular raw transaction logs into continuous weekly time-series tensors
for deep sequence modeling (LSTM / GRU), strictly preventing lookahead data leakage.
"""

from dataclasses import dataclass
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd
import torch


@dataclass
class SequenceDataset:
    """
    Container for temporal train/val/test splits and sequence metadata.
    """
    X_train: torch.Tensor       # Shape: (N_train, lookback_weeks, feature_dim)
    y_train: torch.Tensor       # Shape: (N_train, num_categories)
    X_val: torch.Tensor         # Shape: (N_val, lookback_weeks, feature_dim)
    y_val: torch.Tensor         # Shape: (N_val, num_categories)
    X_test: torch.Tensor        # Shape: (N_test, lookback_weeks, feature_dim)
    y_test: torch.Tensor        # Shape: (N_test, num_categories)
    feature_names: List[str]
    target_categories: List[str]
    scalers: Dict[str, Any]


class WeeklyTransactionAggregator:
    """
    Cleans raw transaction logs and aggregates spend into a regular, continuous weekly grid.
    """
    def __init__(self, top_k_categories: int = 5):
        self.top_k_categories = top_k_categories
        self.top_mccs: List[int] = []
        self.category_names: List[str] = []

    def clean_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parses dates, cleans currency strings, and removes non-financial noise."""
        clean_df = df.copy()

        # Clean Amount ($123.45 -> float)
        if not pd.api.types.is_numeric_dtype(clean_df['Amount']):
            clean_df['Amount'] = (
                clean_df['Amount']
                .astype(str)
                .str.replace('$', '', regex=False)
                .str.replace(',', '', regex=False)
                .str.strip()
            )
            clean_df['Amount'] = pd.to_numeric(clean_df['Amount'], errors='coerce').fillna(0.0)
        clean_df['Amount'] = clean_df['Amount'].astype(float)

        # Parse date
        if 'timestamp' not in clean_df.columns:
            clean_df['timestamp'] = pd.to_datetime({
                'year': clean_df['Year'],
                'month': clean_df['Month'],
                'day': clean_df['Day']
            })

        # Filter negative / refund spikes or zero entries if any
        clean_df['Amount'] = clean_df['Amount'].clip(lower=0.0)
        return clean_df.sort_values('timestamp').reset_index(drop=True)

    def fit_categories(self, clean_df: pd.DataFrame) -> List[int]:
        """Identifies top-K most frequent MCCs from training data."""
        top_counts = clean_df['MCC'].value_counts()
        self.top_mccs = top_counts.head(self.top_k_categories).index.tolist()
        self.category_names = [f"MCC_{mcc}" for mcc in self.top_mccs]
        return self.top_mccs

    def aggregate_weekly(self, clean_df: pd.DataFrame) -> pd.DataFrame:
        """
        Resamples transactions into a continuous weekly grid from min_date to max_date.
        Ensures no weeks are missing (weeks with $0 spending are explicitly filled with 0.0).
        """
        if not self.top_mccs:
            self.fit_categories(clean_df)

        # Map MCCs to top categories or 'Other'
        df = clean_df.copy()
        df['category'] = df['MCC'].apply(lambda x: f"MCC_{x}" if x in self.top_mccs else "MCC_Other")

        # Pivot to weekly spend per category
        weekly_cat = (
            df.pivot_table(
                index=pd.Grouper(key='timestamp', freq='W-MON'),
                columns='category',
                values='Amount',
                aggfunc='sum',
                fill_value=0.0
            )
        )

        # Guarantee all top category columns exist
        for cat in self.category_names + ["MCC_Other"]:
            if cat not in weekly_cat.columns:
                weekly_cat[cat] = 0.0

        # Total spend and transaction count
        weekly_summary = df.groupby(pd.Grouper(key='timestamp', freq='W-MON')).agg(
            total_spend=('Amount', 'sum'),
            tx_count=('Amount', 'count')
        )

        weekly_df = weekly_cat.join(weekly_summary).fillna(0.0)

        # Add cyclical temporal features (Week of year: 1 to 52)
        week_of_year = weekly_df.index.isocalendar().week.astype(float)
        weekly_df['sin_week'] = np.sin(2.0 * np.pi * week_of_year / 52.0)
        weekly_df['cos_week'] = np.cos(2.0 * np.pi * week_of_year / 52.0)

        return weekly_df


class TemporalSequenceBuilder:
    """
    Constructs sliding lookback windows and handles temporal train/val/test splits without leakage.
    """
    def __init__(
        self,
        lookback_weeks: int = 12,
        forecast_horizon: int = 1,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15
    ):
        self.lookback_weeks = lookback_weeks
        self.forecast_horizon = forecast_horizon
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio

    def create_sliding_windows(
        self,
        features: np.ndarray,
        targets: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates sliding window sequences:
        X[i] = features[i : i + lookback_weeks]
        y[i] = targets[i + lookback_weeks] (for 1-week ahead horizon)
        """
        num_samples = len(features) - self.lookback_weeks - self.forecast_horizon + 1
        if num_samples <= 0:
            raise ValueError(
                f"Dataset length ({len(features)}) is too short for lookback={self.lookback_weeks} "
                f"and horizon={self.forecast_horizon}."
            )

        X, y = [], []
        for i in range(num_samples):
            X.append(features[i : i + self.lookback_weeks])
            y.append(targets[i + self.lookback_weeks])

        return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)

    def prepare_dataset(
        self,
        weekly_df: pd.DataFrame,
        target_cols: List[str],
        feature_cols: Optional[List[str]] = None
    ) -> SequenceDataset:
        """
        Splits chronologically into Train (70%), Val (15%), Test (15%),
        fits log1p scaling ONLY on the training split, and generates PyTorch tensors.
        """
        feat_cols = feature_cols if feature_cols is not None else weekly_df.columns.tolist()

        # Chronological split indices
        n_total = len(weekly_df)
        n_train = int(n_total * self.train_ratio)
        n_val = int(n_total * self.val_ratio)

        df_train = weekly_df.iloc[:n_train].copy()
        df_val = weekly_df.iloc[n_train : n_train + n_val].copy()
        df_test = weekly_df.iloc[n_train + n_val :].copy()

        # Log1p transformation parameters calculated strictly on Train
        # log1p(x) = log(1 + x) compresses wide-tailed spending amounts
        spend_feature_cols = [c for c in feat_cols if c not in ['sin_week', 'cos_week']]
        
        # Scale features using train statistics: mean & std of log1p values
        train_log = np.log1p(df_train[spend_feature_cols].values)
        means = np.mean(train_log, axis=0)
        stds = np.std(train_log, axis=0) + 1e-6

        scalers = {
            'spend_cols': spend_feature_cols,
            'means': means,
            'stds': stds,
            'target_cols': target_cols
        }

        def transform(df_split: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
            feats = df_split[feat_cols].copy()
            # Normalize spend features
            log_vals = np.log1p(feats[spend_feature_cols].values)
            normed_vals = (log_vals - means) / stds
            for idx, col in enumerate(spend_feature_cols):
                feats[col] = normed_vals[:, idx]

            # Targets are log1p transformed (easier for MSE loss)
            targs = np.log1p(df_split[target_cols].values)
            return feats.values.astype(np.float32), targs.astype(np.float32)

        feat_train, targ_train = transform(df_train)
        feat_val, targ_val = transform(df_val)
        feat_test, targ_test = transform(df_test)

        X_train, y_train = self.create_sliding_windows(feat_train, targ_train)
        X_val, y_val = self.create_sliding_windows(feat_val, targ_val)
        X_test, y_test = self.create_sliding_windows(feat_test, targ_test)

        return SequenceDataset(
            X_train=torch.from_numpy(X_train),
            y_train=torch.from_numpy(y_train),
            X_val=torch.from_numpy(X_val),
            y_val=torch.from_numpy(y_val),
            X_test=torch.from_numpy(X_test),
            y_test=torch.from_numpy(y_test),
            feature_names=feat_cols,
            target_categories=target_cols,
            scalers=scalers
        )
