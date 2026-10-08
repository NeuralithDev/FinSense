"""Dimensionality reduction for user feature vectors.

Supports PCA and UMAP; produces low-dim embeddings used for
graph edge construction.
"""
from __future__ import annotations
import numpy as np


def fit_pca(X: np.ndarray, n_components: int = 32) -> tuple:
    """TODO: implement after notebook 10_user_embeddings.ipynb"""
    raise NotImplementedError


def fit_umap(X: np.ndarray, n_components: int = 32, **kwargs) -> tuple:
    """TODO: implement"""
    raise NotImplementedError
