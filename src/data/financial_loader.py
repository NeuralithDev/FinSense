"""Load and pre-validate the financial profile dataset.

Source: data/raw/financial/cleaned_financial_data.csv
Responsibility: read the file, enforce expected dtypes, return a clean
DataFrame without modifying the original file.
"""
from __future__ import annotations
from pathlib import Path
import pandas as pd
from src.utils.logging import get_logger

logger = get_logger(__name__)


def load_financial_data(path: str | Path | None = None) -> pd.DataFrame:
    """Load cleaned_financial_data.csv.

    Returns:
        DataFrame with user financial profile records.

    TODO: implement after notebook 01_financial_eda.ipynb
    """
    raise NotImplementedError


def get_financial_columns() -> list[str]:
    """Return the expected column list (filled in after EDA).

    TODO: populate after notebook 01
    """
    return []
