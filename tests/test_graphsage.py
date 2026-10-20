"""
Unit tests for PeerGraphBuilder and FinancialGraphSAGE.
"""

import numpy as np
import pandas as pd
import torch

from src.preprocessing.graph_builder import PeerGraphBuilder, FinancialGraphData
from src.models.graphsage import FinancialGraphSAGE, train_graphsage_unsupervised


def test_peer_graph_builder():
    df_users = pd.DataFrame({
        "User": [f"User_{i}" for i in range(10)],
        "income": [3000, 3100, 8000, 8200, 3050, 8100, 5000, 5200, 5100, 3200],
        "expenses": [2500, 2600, 4000, 4100, 2550, 4050, 3500, 3600, 3550, 2650],
        "savings": [5000, 5200, 50000, 52000, 5100, 51000, 20000, 21000, 20500, 5300]
    })

    builder = PeerGraphBuilder(similarity_threshold=0.5, k_neighbors=3)
    graph_data = builder.build_graph_from_features(df_users, id_col="User")

    assert isinstance(graph_data, FinancialGraphData)
    assert graph_data.x.shape == (10, 3)
    assert graph_data.edge_index.shape[0] == 2
    assert graph_data.edge_index.shape[1] >= 10  # at least self loops
    assert len(graph_data.user_ids) == 10


def test_graphsage_forward_and_embeddings():
    num_nodes = 12
    in_dim = 6
    hidden_dim = 16
    emb_dim = 8

    x = torch.randn(num_nodes, in_dim)
    # Simple ring graph with self-loops
    src = list(range(num_nodes)) + list(range(num_nodes))
    dst = [(i + 1) % num_nodes for i in range(num_nodes)] + list(range(num_nodes))
    edge_index = torch.tensor([src, dst], dtype=torch.long)

    model = FinancialGraphSAGE(in_dim=in_dim, hidden_dim=hidden_dim, embedding_dim=emb_dim)
    out = model(x, edge_index)

    assert out.shape == (num_nodes, emb_dim)
    # Check L2 normalization (norm should be ~1.0)
    norms = torch.norm(out, p=2, dim=1)
    assert torch.allclose(norms, torch.ones(num_nodes), atol=1e-5)

    # Test twin discovery
    embeddings = model.get_embeddings(x, edge_index)
    user_ids = [f"U{i}" for i in range(num_nodes)]
    twins = FinancialGraphSAGE.find_financial_twins(target_idx=0, embeddings=embeddings, user_ids=user_ids, top_k=3)
    assert len(twins) == 3
    assert twins[0]["peer_user_id"] != "U0"


def test_graphsage_unsupervised_training():
    num_nodes = 8
    in_dim = 4
    x = torch.randn(num_nodes, in_dim)
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 0]], dtype=torch.long)

    model = FinancialGraphSAGE(in_dim=in_dim, hidden_dim=8, embedding_dim=4)
    loss_hist = train_graphsage_unsupervised(model, x, edge_index, epochs=3, lr=0.01)

    assert len(loss_hist) == 3
    assert all(np.isfinite(l) for l in loss_hist)


if __name__ == "__main__":
    test_peer_graph_builder()
    test_graphsage_forward_and_embeddings()
    test_graphsage_unsupervised_training()
    print("ALL GRAPHSAGE TESTS PASSED!")
