"""Schema and quality validation for all three datasets.

Run after loading; raises descriptive errors on data-quality issues
so problems are caught early rather than propagating silently.
"""
from __future__ import annotations
import pandas as pd


def validate_columns(df: pd.DataFrame, required: list[str], source: str = "") -> None:
    """Raise ValueError if any required column is missing.

    TODO: implement
    """
    raise NotImplementedError


def validate_no_nulls(df: pd.DataFrame, columns: list[str]) -> None:
    """Raise ValueError if any listed column contains nulls.

    TODO: implement
    """
    raise NotImplementedError


def validate_date_range(
    df: pd.DataFrame,
    date_col: str,
    min_date: str | None = None,
    max_date: str | None = None,
) -> None:
    """Raise ValueError if dates fall outside expected bounds.

    TODO: implement
    """
    raise NotImplementedError


def validate_positive_amounts(df: pd.DataFrame, amount_col: str) -> None:
    """Warn (do not raise) if negative amounts are present.

    TODO: implement
    """
    raise NotImplementedError
