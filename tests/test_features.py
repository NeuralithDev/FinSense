"""Tests for src/features/ feature engineering modules."""
import pytest


class TestSpendingFeatures:
    def test_output_has_expected_columns(self):
        pytest.skip("TODO: implement after spending_features.py")

    def test_category_share_sums_to_one(self):
        pytest.skip("TODO: implement")


class TestBehavioralFeatures:
    def test_tx_frequency_non_negative(self):
        pytest.skip("TODO: implement after behavioral_features.py")


class TestTemporalFeatures:
    def test_is_weekend_is_boolean(self):
        pytest.skip("TODO: implement after temporal_features.py")

    def test_hour_in_range(self):
        pytest.skip("TODO: implement")


class TestFeaturePipeline:
    def test_pipeline_produces_user_level_df(self):
        pytest.skip("TODO: implement after feature_pipeline.py")
