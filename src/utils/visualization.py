"""Reusable matplotlib/seaborn helpers.

All plot functions save to reports/figures/ when a path is given.
"""
from __future__ import annotations
from pathlib import Path
import matplotlib.pyplot as plt


def save_fig(fig: plt.Figure, path: str | Path, dpi: int = 150) -> None:
    """Save figure to disk with tight layout."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=dpi, bbox_inches="tight")
    plt.close(fig)


def plot_time_series(series, title: str = "", save_path=None):
    """TODO: implement"""
    raise NotImplementedError


def plot_confusion_matrix(y_true, y_pred, labels=None, save_path=None):
    """TODO: implement"""
    raise NotImplementedError


def plot_reconstruction_error(errors, threshold: float, save_path=None):
    """TODO: implement"""
    raise NotImplementedError
