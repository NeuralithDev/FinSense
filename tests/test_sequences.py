"""
Unit tests for WeeklyTransactionAggregator and TemporalSequenceBuilder.
"""

import numpy as np
import pandas as pd
import torch
from src.preprocessing.sequences import WeeklyTransactionAggregator, TemporalSequenceBuilder, SequenceDataset


def test_weekly_aggregator_cleaning_and_grid():
    # Synthetic transaction log spanning 3 weeks with 2 MCCs
    raw_df = pd.DataFrame({
        "User": [0, 0, 0, 0],
        "Year": [2020, 2020, 2020, 2020],
        "Month": [1, 1, 1, 1],
        "Day": [1, 3, 10, 22],
        "Amount": ["$50.00", "$30.50", "$120.00", "$15.00"],
        "MCC": [5411, 5411, 5812, 5411]
    })

    aggregator = WeeklyTransactionAggregator(top_k_categories=2)
    clean_df = aggregator.clean_transactions(raw_df)
    
    # Check cleaning
    assert clean_df['Amount'].dtype in [np.float64, np.float32]
    assert (clean_df['Amount'].values == [50.0, 30.5, 120.0, 15.0]).all()

    # Aggregate to weekly
    weekly_df = aggregator.aggregate_weekly(clean_df)
    assert isinstance(weekly_df, pd.DataFrame)
    assert "MCC_5411" in weekly_df.columns
    assert "MCC_5812" in weekly_df.columns
    assert "total_spend" in weekly_df.columns
    assert "sin_week" in weekly_df.columns
    assert "cos_week" in weekly_df.columns

    # Verify no NaN values in weekly grid
    assert not weekly_df.isna().any().any()


def test_temporal_sequence_builder_shapes_and_splits():
    # Generate 100 continuous synthetic weekly periods
    np.random.seed(42)
    dates = pd.date_range(start="2018-01-01", periods=100, freq="W-MON")
    mock_weekly = pd.DataFrame({
        "MCC_5411": np.random.uniform(50, 300, 100),
        "MCC_5912": np.random.uniform(20, 100, 100),
        "MCC_5300": np.random.uniform(0, 150, 100),
        "MCC_5541": np.random.uniform(30, 80, 100),
        "MCC_5311": np.random.uniform(0, 200, 100),
        "MCC_Other": np.random.uniform(10, 50, 100),
        "total_spend": np.random.uniform(200, 800, 100),
        "tx_count": np.random.randint(5, 25, 100),
        "sin_week": np.sin(np.linspace(0, 2*np.pi, 100)),
        "cos_week": np.cos(np.linspace(0, 2*np.pi, 100))
    }, index=dates)

    target_cols = ["MCC_5411", "MCC_5912", "MCC_5300", "MCC_5541", "MCC_5311"]
    lookback = 8

    builder = TemporalSequenceBuilder(
        lookback_weeks=lookback,
        forecast_horizon=1,
        train_ratio=0.70,
        val_ratio=0.15
    )

    dataset = builder.prepare_dataset(mock_weekly, target_cols=target_cols)

    assert isinstance(dataset, SequenceDataset)
    # Check dimensions
    # X shape: (N_samples, lookback=8, feature_dim=10)
    # y shape: (N_samples, targets=5)
    assert dataset.X_train.ndim == 3
    assert dataset.X_train.shape[1] == lookback
    assert dataset.X_train.shape[2] == len(mock_weekly.columns)
    assert dataset.y_train.ndim == 2
    assert dataset.y_train.shape[1] == len(target_cols)

    # Check validation and test shapes
    assert dataset.X_val.shape[1] == lookback
    assert dataset.y_val.shape[1] == len(target_cols)
    assert dataset.X_test.shape[1] == lookback
    assert dataset.y_test.shape[1] == len(target_cols)

    # Check tensor types
    assert isinstance(dataset.X_train, torch.Tensor)
    assert dataset.X_train.dtype == torch.float32

    print("\n✅ SEQUENCE PREPROCESSING TESTS PASSED!")


if __name__ == "__main__":
    test_weekly_aggregator_cleaning_and_grid()
    test_temporal_sequence_builder_shapes_and_splits()
