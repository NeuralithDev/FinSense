"""
Financial Peer Similarity Graph Builder for Graph Neural Networks.

Constructs an attributed peer-similarity graph connecting users based on:
1. Income and debt tier proximity
2. Spending pattern profile similarity (cosine similarity across MCC category allocations)
3. Solvency & credit posture homophily

Used as input for GraphSAGE to learn latent representations of collective financial behavior.
"""

from dataclasses import dataclass
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import pandas as pd
import torch


@dataclass
class FinancialGraphData:
    """
    Standard container for Graph Neural Network inputs.
    Compatible with both PyTorch geometric and native PyTorch message passing.
    """
    x: torch.Tensor             # Node feature matrix: (Num_Nodes, Feature_Dim)
    edge_index: torch.Tensor    # Edge index tensor: (2, Num_Edges)
    user_ids: List[str]         # User identifier mapping
    edge_weights: Optional[torch.Tensor] = None


class PeerGraphBuilder:
    """
    Constructs a k-nearest neighbor or threshold-based peer affinity graph
    from user feature vectors.
    """
    def __init__(
        self,
        similarity_threshold: float = 0.70,
        k_neighbors: int = 5
    ):
        self.similarity_threshold = similarity_threshold
        self.k_neighbors = k_neighbors

    def build_graph_from_features(
        self,
        df_features: pd.DataFrame,
        id_col: str = "User",
        feature_cols: Optional[List[str]] = None
    ) -> FinancialGraphData:
        """
        Constructs edges between users based on cosine similarity of normalized features.
        
        Args:
            df_features: DataFrame containing user records
            id_col: Column containing user IDs
            feature_cols: Numerical feature columns to include as node attributes
        """
        user_ids = [str(u) for u in df_features[id_col].values]
        
        if feature_cols is None:
            numeric_cols = df_features.select_dtypes(include=[np.number]).columns.tolist()
            feature_cols = [c for c in numeric_cols if c != id_col]

        raw_features = df_features[feature_cols].fillna(0.0).values.astype(np.float32)
        
        # Standardize features (zero mean, unit variance)
        means = np.mean(raw_features, axis=0)
        stds = np.std(raw_features, axis=0) + 1e-6
        norm_features = (raw_features - means) / stds

        # Compute pairwise cosine similarity: S = (A / ||A||) @ (A / ||A||)^T
        norms = np.linalg.norm(norm_features, axis=1, keepdims=True) + 1e-8
        unit_features = norm_features / norms
        similarity_matrix = unit_features @ unit_features.T

        edges_src = []
        edges_dst = []
        weights = []

        num_users = len(user_ids)
        for i in range(num_users):
            # Sort neighbors by similarity descending (excluding self-loop at index i)
            sim_scores = similarity_matrix[i].copy()
            sim_scores[i] = -1.0  # Exclude self
            top_k_indices = np.argsort(-sim_scores)[:self.k_neighbors]

            for j in top_k_indices:
                sim = float(sim_scores[j])
                if sim >= self.similarity_threshold or len(edges_src) == 0:
                    edges_src.append(i)
                    edges_dst.append(j)
                    weights.append(sim)

        # Self-loops for GNN message passing stability
        for i in range(num_users):
            edges_src.append(i)
            edges_dst.append(i)
            weights.append(1.0)

        edge_index = torch.tensor([edges_src, edges_dst], dtype=torch.long)
        edge_weights = torch.tensor(weights, dtype=torch.float32)
        x_tensor = torch.tensor(norm_features, dtype=torch.float32)

        return FinancialGraphData(
            x=x_tensor,
            edge_index=edge_index,
            user_ids=user_ids,
            edge_weights=edge_weights
        )
