"""CLI: Run the full end-to-end FinSense pipeline.

Stages (configurable in configs/config.yaml under stages):
  1. Feature engineering
  2. Model training
  3. Evaluation
  4. Report generation

Usage::

    python scripts/run_pipeline.py [--dry-run]

"""
import argparse


def parse_args():
    p = argparse.ArgumentParser(description="FinSense — Full pipeline")
    p.add_argument("--config", default="configs/config.yaml")
    p.add_argument("--dry-run", action="store_true", help="Print stages without executing")
    return p.parse_args()


def main():
    args = parse_args()
    # TODO: implement after all src/ modules are ready
    raise NotImplementedError


if __name__ == "__main__":
    main()
