"""Tests for src/data/ — loaders, validation, cleaning, aggregation."""
import pytest


class TestFinancialLoader:
    def test_load_returns_dataframe(self):
        pytest.skip("TODO: implement after financial_loader.py")

    def test_raw_file_not_modified(self):
        pytest.skip("TODO: verify raw file is unchanged after loading")


class TestIBMLoader:
    def test_load_transactions(self):
        pytest.skip("TODO: implement after ibm_loader.py")

    def test_chunked_load_matches_full_load(self):
        pytest.skip("TODO: implement")


class TestPaySimLoader:
    def test_fraud_cols_excluded(self):
        """isFraud and isFlaggedFraud must not appear in output."""
        pytest.skip("TODO: implement after paysim_loader.py")


class TestDataValidation:
    def test_validate_columns_passes(self):
        pytest.skip("TODO: implement")

    def test_validate_columns_raises_on_missing(self):
        pytest.skip("TODO: implement")


class TestDataCleaning:
    def test_drop_duplicates(self):
        pytest.skip("TODO: implement")

    def test_handle_missing_drop_strategy(self):
        pytest.skip("TODO: implement")
