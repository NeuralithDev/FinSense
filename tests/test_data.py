"""
Unit tests for src/data/ — loaders, validation, cleaning, aggregation.
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.data.data_cleaning import DataCleaner, DataValidator
from src.data.data_loader import FinancialDataLoader, IBMLoader, PaySimLoader


class TestFinancialLoader:
    def test_load_returns_dataframe(self):
        df = FinancialDataLoader.load()
        assert isinstance(df, pd.DataFrame)
        assert len(df) > 0
        assert "monthly_income_usd" in df.columns

    def test_raw_file_not_modified(self):
        mtime_before = os.path.getmtime(FinancialDataLoader.DEFAULT_PATH)
        _ = FinancialDataLoader.load()
        mtime_after = os.path.getmtime(FinancialDataLoader.DEFAULT_PATH)
        assert mtime_before == mtime_after


class TestIBMLoader:
    def test_load_transactions(self):
        df = IBMLoader.load_transactions(nrows=50)
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 50
        assert "Amount" in df.columns
        assert pd.api.types.is_numeric_dtype(df["Amount"])
        assert (df["Amount"] >= 0).all()

    def test_chunked_load_matches_full_load(self):
        gen = IBMLoader.stream_chunks(chunksize=25)
        first_chunk = next(gen)
        assert len(first_chunk) == 25
        assert isinstance(first_chunk, pd.DataFrame)


class TestPaySimLoader:
    def test_fraud_cols_excluded(self):
        """isFraud and isFlaggedFraud must not appear in output."""
        df = PaySimLoader.load(nrows=50)
        assert "isFraud" not in df.columns
        assert "isFlaggedFraud" not in df.columns
        assert "amount" in df.columns


class TestDataValidation:
    def test_validate_columns_passes(self):
        df = pd.DataFrame({"col_a": [1], "col_b": [2]})
        valid, missing = DataValidator.validate_columns(df, ["col_a", "col_b"])
        assert valid is True
        assert len(missing) == 0

    def test_validate_columns_raises_on_missing(self):
        df = pd.DataFrame({"col_a": [1]})
        valid, missing = DataValidator.validate_columns(df, ["col_a", "col_c"])
        assert valid is False
        assert missing == ["col_c"]


class TestDataCleaning:
    def test_drop_duplicates(self):
        df_dups = pd.DataFrame({
            "monthly_income_usd": [5000.0, 5000.0],
            "monthly_expenses_usd": [3000.0, 3000.0],
            "savings_usd": [10000.0, 10000.0]
        })
        clean = DataCleaner.clean_financial_profiles(df_dups)
        assert len(clean) == 1

    def test_handle_missing_drop_strategy(self):
        df_with_nan = pd.DataFrame({
            "monthly_income_usd": [np.nan, 4000.0],
            "credit_score": [np.nan, 720.0]
        })
        clean = DataCleaner.clean_financial_profiles(df_with_nan)
        assert clean["monthly_income_usd"].iloc[0] == 0.0
        assert clean["credit_score"].iloc[0] == 680.0  # Default median credit score


if __name__ == "__main__":
    t_fin = TestFinancialLoader()
    t_fin.test_load_returns_dataframe()
    t_fin.test_raw_file_not_modified()

    t_ibm = TestIBMLoader()
    t_ibm.test_load_transactions()
    t_ibm.test_chunked_load_matches_full_load()

    t_pay = TestPaySimLoader()
    t_pay.test_fraud_cols_excluded()

    t_val = TestDataValidation()
    t_val.test_validate_columns_passes()
    t_val.test_validate_columns_raises_on_missing()

    t_clean = TestDataCleaning()
    t_clean.test_drop_duplicates()
    t_clean.test_handle_missing_drop_strategy()

    print("ALL DATA TESTS PASSED!")
