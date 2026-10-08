"""Load PaySim mobile-money simulation dataset.

Source: data/raw/paysim/PaySim.csv
Responsibility: provide chunked access to PaySim for transaction-level
behavioral and cash-flow feature engineering.

NOTE: isFraud / isFlaggedFraud columns are excluded by default.
PaySim is used for behavioral pattern engineering, NOT fraud detection.
"""
from __future__ import annotations
from pathlib import Path
from typing import Iterator
import pandas as pd
from src.utils.logging import get_logger

logger = get_logger(__name__)

# Columns excluded from feature engineering (not the project objective)
_EXCLUDE_COLS = ["isFraud", "isFlaggedFraud"]


def load_paysim(
    path: str | Path | None = None,
    chunksize: int | None = 100_000,
    drop_fraud_cols: bool = True,
) -> pd.DataFrame | Iterator[pd.DataFrame]:
    """Load PaySim.csv, dropping fraud labels by default.

    TODO: implement after notebook 03_paysim_eda.ipynb
    """
    raise NotImplementedError
