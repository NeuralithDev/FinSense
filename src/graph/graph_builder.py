"""Build user-similarity graph (nodes = users, edges = similarity).

Produces node/edge tables written to data/processed/graph_*.parquet.
"""
from __future__ import annotations
import numpy as np
import pandas as pd


def build_knn_graph(
    embeddings: np.ndarray,
    user_ids: list,
    k: int = 10,
    metric: str = "cosine",
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (node_df, edge_df).  TODO: implement after notebook 11_graph_construction.ipynb"""
    raise NotImplementedError
