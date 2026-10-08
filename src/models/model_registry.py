"""Registry for tracking trained model versions and metadata.

Stores: model type, version, training date, data hash, evaluation
metrics, and artifact path.  Saved to models/metadata/.
"""
from __future__ import annotations
from pathlib import Path
import json


class ModelRegistry:
    """Track and retrieve trained model metadata.

    TODO: implement after first models are trained
    """

    def __init__(self, registry_dir: str | Path = "models/metadata"):
        raise NotImplementedError

    def register(self, name: str, version: str, metadata: dict) -> None:
        """Register a model entry.  TODO: implement"""
        raise NotImplementedError

    def get_latest(self, name: str) -> dict:
        """Retrieve the latest registered version of a model.  TODO: implement"""
        raise NotImplementedError

    def list_models(self) -> list[dict]:
        """List all registered models.  TODO: implement"""
        raise NotImplementedError
