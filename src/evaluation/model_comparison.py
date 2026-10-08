"""Side-by-side comparison of multiple model variants.

Produces comparison tables saved to experiments/forecasting/
and artifacts/metrics/
"""
from __future__ import annotations
import pandas as pd


def compare_models(results: dict[str, dict]) -> pd.DataFrame:
    """Return a DataFrame comparing all model metrics.

    TODO: implement after notebook 15_model_comparison.ipynb
    """
    raise NotImplementedError
