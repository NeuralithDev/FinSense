"""CLI: Train forecasting and financial health models.

Usage::

    python scripts/train_models.py [--model spending|cashflow|all]

Saves checkpoints to models/trained/
"""
import argparse


def parse_args():
    p = argparse.ArgumentParser(description="FinSense — Train models")
    p.add_argument("--config", default="configs/config.yaml")
    p.add_argument("--model", choices=["spending", "cashflow", "all"], default="all")
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


def main():
    args = parse_args()
    # TODO: implement after src/forecasting/ is ready
    raise NotImplementedError


if __name__ == "__main__":
    main()
