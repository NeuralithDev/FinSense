"""CLI: Evaluate trained models and write metrics to artifacts/.

Usage::

    python scripts/evaluate_models.py [--model spending|cashflow|all]

Outputs written to artifacts/metrics/ and experiments/forecasting/
"""
import argparse


def parse_args():
    p = argparse.ArgumentParser(description="FinSense — Evaluate models")
    p.add_argument("--config", default="configs/config.yaml")
    p.add_argument("--model", choices=["spending", "cashflow", "all"], default="all")
    return p.parse_args()


def main():
    args = parse_args()
    # TODO: implement after src/evaluation/ is ready
    raise NotImplementedError


if __name__ == "__main__":
    main()
