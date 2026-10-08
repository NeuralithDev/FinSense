"""User-similarity relationships based on financial profiles.

OPTIONAL — not required for the MVP.
Useful for: peer-group benchmarking, collaborative recommendations.

TODO: implement after core pipeline is complete
"""
from __future__ import annotations
import numpy as np
import pandas as pd


def build_user_similarity_graph(
    feature_matrix: pd.DataFrame,
    k: int = 10,
    metric: str = "cosine",
):
    """Build kNN user-similarity graph.

    TODO: implement
    """
    raise NotImplementedError
