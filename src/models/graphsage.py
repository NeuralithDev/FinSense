"""
GraphSAGE Neural Network for Peer Financial Intelligence.

Learns low-dimensional continuous embeddings for users across an attributed
peer similarity graph, enabling collective intelligence:
1. "Financial Twin" Discovery: Identifies users with similar income and life stages
   who maintain superior financial health.
2. Peer Benchmarking: Shows how resilient peers allocate discretionary spending.
3. Collaborative Recommendations: Propagates effective interventions between similar peers.

Architecture follows Hamilton et al. (NeurIPS 2017) with Mean Neighborhood Aggregation,
implemented in pure PyTorch for universal compatibility and zero runtime dependencies.
"""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F


class GraphSAGELayer(nn.Module):
    """
    Single GraphSAGE Layer with Mean Neighborhood Aggregator.
    
    Update Equation:
        h_N(v) = Mean_{u in N(v)} (h_u)
        h_v^{(l)} = ReLU( W_self * h_v^{(l-1)} + W_neigh * h_N(v) )
    """
    def __init__(self, in_features: int, out_features: int, dropout: float = 0.1):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features

        self.linear_self = nn.Linear(in_features, out_features, bias=False)
        self.linear_neigh = nn.Linear(in_features, out_features, bias=True)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Node feature tensor (Num_Nodes, in_features)
            edge_index: Tensor of shape (2, Num_Edges)
        """
        num_nodes = x.size(0)
        src, dst = edge_index[0], edge_index[1]

        # 1. Neighborhood aggregation (Mean)
        # Allocate accumulator tensor
        neigh_sum = torch.zeros(num_nodes, self.in_features, device=x.device, dtype=x.dtype)
        degrees = torch.zeros(num_nodes, 1, device=x.device, dtype=x.dtype)

        # Vectorized scatter-add
        neigh_sum.index_add_(0, dst, x[src])
        ones = torch.ones(src.size(0), 1, device=x.device, dtype=x.dtype)
        degrees.index_add_(0, dst, ones)

        # Avoid divide-by-zero for isolated nodes
        degrees = torch.clamp(degrees, min=1.0)
        neigh_mean = neigh_sum / degrees

        # 2. Combine self representation with neighborhood representation
        h_self = self.linear_self(x)
        h_neigh = self.linear_neigh(neigh_mean)

        out = F.relu(h_self + h_neigh)
        out = self.dropout(out)
        return out


class FinancialGraphSAGE(nn.Module):
    """
    2-Layer Deep GraphSAGE model for financial user embeddings.
    """
    def __init__(
        self,
        in_dim: int = 15,
        hidden_dim: int = 32,
        embedding_dim: int = 16,
        dropout: float = 0.1
    ):
        super().__init__()
        self.in_dim = in_dim
        self.hidden_dim = hidden_dim
        self.embedding_dim = embedding_dim

        self.conv1 = GraphSAGELayer(in_dim, hidden_dim, dropout=dropout)
        self.conv2 = GraphSAGELayer(hidden_dim, embedding_dim, dropout=0.0)

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Forward pass producing L2-normalized node embeddings.
        """
        h = self.conv1(x, edge_index)
        z = self.conv2(h, edge_index)
        # Normalize to unit hypersphere for cosine distance stability
        z = F.normalize(z, p=2, dim=-1)
        return z

    def get_embeddings(self, x: torch.Tensor, edge_index: torch.Tensor) -> np.ndarray:
        """Inference helper returning numpy array of user embeddings."""
        self.eval()
        with torch.no_grad():
            emb = self(x, edge_index)
        return emb.cpu().numpy()

    @staticmethod
    def find_financial_twins(
        target_idx: int,
        embeddings: np.ndarray,
        user_ids: List[str],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Discovers the top-k nearest financial peers using cosine similarity in the latent embedding space.
        """
        target_emb = embeddings[target_idx]
        # Cosine similarity is simply dot product on L2-normalized embeddings
        sims = np.dot(embeddings, target_emb)

        # Mask out self
        sims[target_idx] = -1.0

        top_indices = np.argsort(-sims)[:top_k]
        twins = []
        for idx in top_indices:
            twins.append({
                "peer_index": int(idx),
                "peer_user_id": user_ids[idx],
                "similarity_score": round(float(sims[idx]), 4)
            })

        return twins


def train_graphsage_unsupervised(
    model: FinancialGraphSAGE,
    x: torch.Tensor,
    edge_index: torch.Tensor,
    epochs: int = 40,
    lr: float = 0.01
) -> List[float]:
    """
    Unsupervised contrastive link prediction training loop.
    Maximizes similarity between true connected peers and minimizes similarity with random negative nodes.
    """
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    loss_history = []
    num_nodes = x.size(0)

    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()

        z = model(x, edge_index)

        # Positive pairs from edge_index
        src, dst = edge_index[0], edge_index[1]
        pos_sim = torch.sum(z[src] * z[dst], dim=-1)
        pos_loss = -torch.log(torch.sigmoid(pos_sim) + 1e-15).mean()

        # Random negative pairs
        neg_dst = torch.randint(0, num_nodes, (src.size(0),), device=x.device)
        neg_sim = torch.sum(z[src] * z[neg_dst], dim=-1)
        neg_loss = -torch.log(torch.sigmoid(-neg_sim) + 1e-15).mean()

        loss = pos_loss + neg_loss
        loss.backward()
        optimizer.step()

        loss_history.append(float(loss.item()))

    return loss_history
