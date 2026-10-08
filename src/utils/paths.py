"""Central path registry for the FinSense project.

Import from here instead of hardcoding paths anywhere else.

Example::

    from src.utils.paths import DATA_RAW, MODELS_DIR
"""
from pathlib import Path

ROOT           = Path(__file__).resolve().parents[2]
DATA_RAW       = ROOT / "data" / "raw"
DATA_INTERIM   = ROOT / "data" / "interim"
DATA_PROCESSED = ROOT / "data" / "processed"

FINANCIAL_RAW  = DATA_RAW / "financial" / "cleaned_financial_data.csv"
IBM_DIR        = DATA_RAW / "IBM"
PAYSIM_RAW     = DATA_RAW / "paysim" / "PaySim.csv"

MODELS_DIR     = ROOT / "models"
ARTIFACTS_DIR  = ROOT / "artifacts"
EXPERIMENTS    = ROOT / "experiments"
CONFIGS_DIR    = ROOT / "configs"
DOCS_DIR       = ROOT / "docs"
