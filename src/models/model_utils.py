"""Shared model utilities: serialisation, loading, device detection."""
from __future__ import annotations
from pathlib import Path


def detect_device() -> str:
    """Return the best available compute device string.

    Returns 'cuda', 'mps', or 'cpu'.
    """
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"


def save_artifact(obj, path: str | Path) -> None:
    """Pickle an arbitrary artifact.  TODO: implement"""
    raise NotImplementedError


def load_artifact(path: str | Path):
    """Load a pickled artifact.  TODO: implement"""
    raise NotImplementedError
