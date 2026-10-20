"""
Data Loaders for FinSense Datasets.

Provides streaming and batch access to:
1. Cleaned Financial Profiles (`data/raw/financial/cleaned_financial_data.csv`)
2. IBM Credit Card Transactions (`data/raw/IBM/User0_credit_card_transactions.csv` and full dataset)
3. PaySim Mobile Money Transactions (`data/raw/paysim/PaySim.csv`)
"""

import os
from pathlib import Path
from typing import Optional, Iterator, Generator, List, Union
import pandas as pd
from src.data.data_cleaning import DataCleaner, DataValidator


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class FinancialDataLoader:
    """
    Loads and validates customer financial profile records.
    """
    DEFAULT_PATH = PROJECT_ROOT / "data" / "raw" / "financial" / "cleaned_financial_data.csv"

    @classmethod
    def load(cls, file_path: Optional[Union[str, Path]] = None) -> pd.DataFrame:
        path = Path(file_path) if file_path else cls.DEFAULT_PATH
        if not path.exists():
            raise FileNotFoundError(f"Financial profile dataset not found at {path}")

        # Read original dataset without in-place modification
        df = pd.read_csv(path)
        clean_df = DataCleaner.clean_financial_profiles(df)
        return clean_df


class IBMLoader:
    """
    Loads IBM credit card transactions with support for sample user files and chunked processing.
    """
    USER0_PATH = PROJECT_ROOT / "data" / "raw" / "IBM" / "User0_credit_card_transactions.csv"
    FULL_PATH = PROJECT_ROOT / "data" / "raw" / "IBM" / "credit_card_transactions-ibm_v2.csv"

    @classmethod
    def load_transactions(
        cls,
        file_path: Optional[Union[str, Path]] = None,
        nrows: Optional[int] = None
    ) -> pd.DataFrame:
        path = Path(file_path) if file_path else (cls.USER0_PATH if cls.USER0_PATH.exists() else cls.FULL_PATH)
        if not path.exists():
            raise FileNotFoundError(f"IBM transactions dataset not found at {path}")

        df = pd.read_csv(path, nrows=nrows)
        clean_df = DataCleaner.clean_ibm_transactions(df)
        return clean_df

    @classmethod
    def stream_chunks(
        cls,
        file_path: Optional[Union[str, Path]] = None,
        chunksize: int = 50_000
    ) -> Iterator[pd.DataFrame]:
        path = Path(file_path) if file_path else (cls.USER0_PATH if cls.USER0_PATH.exists() else cls.FULL_PATH)
        if not path.exists():
            raise FileNotFoundError(f"IBM transactions dataset not found at {path}")

        for chunk in pd.read_csv(path, chunksize=chunksize):
            yield DataCleaner.clean_ibm_transactions(chunk)


class PaySimLoader:
    """
    Loads PaySim cash flow transaction records.
    Ensures fraud flags are strictly stripped.
    """
    SAMPLE_PATH = PROJECT_ROOT / "data" / "raw" / "paysim" / "paysim_sample.csv"
    DEFAULT_PATH = PROJECT_ROOT / "data" / "raw" / "paysim" / "PaySim.csv"

    @classmethod
    def load(
        cls,
        file_path: Optional[Union[str, Path]] = None,
        nrows: Optional[int] = None,
        use_sample: bool = False
    ) -> pd.DataFrame:
        if file_path:
            path = Path(file_path)
        elif use_sample or (nrows is not None and nrows <= 100 and cls.SAMPLE_PATH.exists()):
            path = cls.SAMPLE_PATH
        else:
            path = cls.DEFAULT_PATH

        if not path.exists():
            raise FileNotFoundError(f"PaySim dataset not found at {path}")

        df = pd.read_csv(path, nrows=nrows)
        clean_df = DataCleaner.clean_paysim_transactions(df)
        return clean_df

    @classmethod
    def stream_chunks(
        cls,
        file_path: Optional[Union[str, Path]] = None,
        chunksize: int = 100_000
    ) -> Iterator[pd.DataFrame]:
        path = Path(file_path) if file_path else cls.DEFAULT_PATH
        if not path.exists():
            raise FileNotFoundError(f"PaySim dataset not found at {path}")

        for chunk in pd.read_csv(path, chunksize=chunksize):
            yield DataCleaner.clean_paysim_transactions(chunk)
