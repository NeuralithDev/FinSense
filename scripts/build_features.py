"""CLI: Run the full feature engineering pipeline.

Usage::

    python scripts/build_features.py [--config configs/config.yaml]

Reads from data/raw/, writes to data/processed/
"""
import argparse


def parse_args():
    p = argparse.ArgumentParser(description="FinSense — Build feature matrix")
    p.add_argument("--config", default="configs/config.yaml")
    p.add_argument("--dataset", choices=["financial", "ibm", "paysim", "all"], default="all")
    return p.parse_args()


def main():
    args = parse_args()
    # TODO: wire up FeaturePipeline once src/features/feature_pipeline.py is ready
    raise NotImplementedError


if __name__ == "__main__":
    main()
