"""Chunked processing helpers for large CSV files.

Used by IBM and PaySim loaders to avoid OOM errors.
"""
from __future__ import annotations
from typing import Callable, Iterator
import pandas as pd


def process_chunks(
    reader: Iterator[pd.DataFrame],
    transform: Callable[[pd.DataFrame], pd.DataFrame],
) -> pd.DataFrame:
    """Apply *transform* to each chunk and concatenate results.

    TODO: implement
    """
    raise NotImplementedError
