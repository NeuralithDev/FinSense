"""YAML configuration loader with dot-access support.

Usage::

    from src.utils.config import load_config
    cfg = load_config()              # loads configs/config.yaml
    features = load_config("features")  # loads configs/features.yaml
"""
from __future__ import annotations
from pathlib import Path
import yaml
from src.utils.paths import CONFIGS_DIR


def load_config(name: str = "config") -> dict:
    """Load and return a YAML config file as a plain dict."""
    path = CONFIGS_DIR / f"{name}.yaml"
    with open(path) as f:
        return yaml.safe_load(f)
