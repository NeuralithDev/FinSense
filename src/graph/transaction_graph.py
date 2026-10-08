"""Build a user-merchant transaction graph from IBM data.

OPTIONAL — not required for the MVP.
Useful for: finding users with similar spending patterns,
merchant affinity networks, community detection.

Node types: User, Merchant
Edge type:  Transaction (with amount, date, category attributes)

TODO: implement after core pipeline is complete
"""
from __future__ import annotations
import pandas as pd


def build_transaction_graph(df: pd.DataFrame):
    """Build a bipartite user-merchant graph.

    TODO: implement — consider NetworkX or PyTorch Geometric
    """
    raise NotImplementedError
