from __future__ import annotations

from typing import Callable, Iterator
import pandas as pd


def process_chunks(
    reader: Iterator[pd.DataFrame],
    transform: Callable[[pd.DataFrame], pd.DataFrame],
) -> list[pd.DataFrame]:

    results = []

    for i, chunk in enumerate(reader):

        print(f"Processing chunk {i + 1}...")

        transformed = transform(chunk)

        if not transformed.empty:
            results.append(transformed)

    return results