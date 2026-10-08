"""
Data cleaning utilities.

Applies after validation.
Never modifies the original raw files.
Results are saved to data/interim/.
"""

from __future__ import annotations

import pandas as pd


def clean_ibm_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
    """
    Clean one IBM credit-card transaction chunk.

    Converts Amount values such as '$134.09'
    into numeric values such as 134.09.
    """

    chunk = chunk.copy()

    chunk["Amount"] = (
        chunk["Amount"]
        .astype(str)
        .str.replace("$", "", regex=False)
        .str.replace(",", "", regex=False)
    )

    chunk["Amount"] = pd.to_numeric(
        chunk["Amount"],
        errors="coerce"
    )

    # Remove rows where Amount could not be converted.
    chunk = chunk.dropna(subset=["Amount"])

    return chunk


def drop_duplicates(
    df: pd.DataFrame,
    subset: list[str] | None = None
) -> pd.DataFrame:
    """Remove duplicate rows."""

    return df.drop_duplicates(subset=subset).copy()


def standardise_dtypes(
    df: pd.DataFrame,
    schema: dict[str, str]
) -> pd.DataFrame:
    """Cast columns to the types specified in schema."""

    df = df.copy()

    for column, dtype in schema.items():
        if column in df.columns:
            df[column] = df[column].astype(dtype)

    return df