"""Load IBM synthetic credit-card transaction dataset files.

Sources (all read-only):
  - credit_card_transactions-ibm_v2.csv   (main transaction log)
  - sd254_users.csv                        (user demographics)
  - sd254_cards.csv                        (card metadata)
  - User0_credit_card_transactions.csv     (single-user sample)

Responsibility: provide chunked or full-load access to IBM data for
behavioral feature engineering.  Fraud fields are not the focus.
"""
from __future__ import annotations
from pathlib import Path
from typing import Iterator
import pandas as pd
from src.utils.logging import get_logger

logger = get_logger(__name__)


def load_transactions(
    path: str | Path | None = None,
    chunksize: int | None = 100_000,
) -> pd.DataFrame | Iterator[pd.DataFrame]:
    """Load IBM transaction CSV, optionally in chunks.

    Args:
        path: Override default path from configs/config.yaml.
        chunksize: If set, returns a chunk iterator (memory-safe).

    TODO: implement after notebook 02_ibm_eda.ipynb
    """
    raise NotImplementedError


def load_users(path: str | Path | None = None) -> pd.DataFrame:
    """Load sd254_users.csv.  TODO: implement."""
    raise NotImplementedError


def load_cards(path: str | Path | None = None) -> pd.DataFrame:
    """Load sd254_cards.csv.  TODO: implement."""
    raise NotImplementedError
