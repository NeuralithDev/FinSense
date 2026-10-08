"""End-to-end feature pipeline: raw data → model-ready feature matrix.

Orchestrates: spending + income + savings + debt + behavioral + temporal
feature builders into a single user-level feature DataFrame.
"""
from __future__ import annotations
import pandas as pd


class FeaturePipeline:
    """Compose all feature builders into one callable pipeline.

    Usage::

        pipeline = FeaturePipeline(config)
        features = pipeline.run(financial_df, ibm_df, paysim_df)

    TODO: implement after all individual feature modules are ready
    """

    def __init__(self, config: dict):
        raise NotImplementedError

    def run(
        self,
        financial_df: pd.DataFrame,
        ibm_df: pd.DataFrame | None = None,
        paysim_df: pd.DataFrame | None = None,
    ) -> pd.DataFrame:
        """Return unified user-level feature matrix.

        TODO: implement
        """
        raise NotImplementedError
