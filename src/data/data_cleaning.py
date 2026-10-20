"""
Data Cleaning and Validation Engine for FinSense.

Performs robust cleaning, deduplication, schema validation, and outlier handling
across all three primary financial datasets:
1. Financial Profiles (Income, savings, debt, credit score)
2. IBM Credit Card Transactions (Merchant, MCC, card spend)
3. PaySim Mobile Cash Flow (Inflows, outflows, balance changes)
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd


class DataCleaner:
    """
    Standardizes raw financial data formats, handles missing values,
    and removes duplicate records without modifying source datasets.
    """

    @staticmethod
    def clean_financial_profiles(df: pd.DataFrame) -> pd.DataFrame:
        """
        Cleans user financial demographic and profile records.
        Ensures monetary values are positive and ratios are within logical boundaries.
        """
        df_clean = df.copy()

        # Deduplicate
        df_clean = df_clean.drop_duplicates().reset_index(drop=True)

        # Ensure numeric fields
        numeric_cols = [
            'monthly_income_usd', 'monthly_expenses_usd', 'savings_usd',
            'loan_amount_usd', 'monthly_emi_usd', 'credit_score'
        ]
        for col in numeric_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')

        # Handle credit score boundaries [300, 850]
        if 'credit_score' in df_clean.columns:
            df_clean['credit_score'] = df_clean['credit_score'].fillna(680.0)
            df_clean['credit_score'] = df_clean['credit_score'].clip(lower=300.0, upper=850.0)

        # Floor non-negative financial amounts
        for col in ['monthly_income_usd', 'monthly_expenses_usd', 'savings_usd']:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].fillna(0.0).clip(lower=0.0)

        # Calculate debt to income if loan / income available
        if 'monthly_income_usd' in df_clean.columns:
            income_safe = np.maximum(df_clean['monthly_income_usd'].values, 1.0)
            if 'monthly_emi_usd' in df_clean.columns:
                df_clean['debt_to_income_ratio'] = df_clean['monthly_emi_usd'].fillna(0.0).values / income_safe
            elif 'debt_to_income_ratio' in df_clean.columns:
                df_clean['debt_to_income_ratio'] = df_clean['debt_to_income_ratio'].fillna(0.20)
                df_clean['debt_to_income_ratio'] = df_clean['debt_to_income_ratio'].clip(0.0, 2.0)

        return df_clean

    @staticmethod
    def clean_ibm_transactions(df: pd.DataFrame) -> pd.DataFrame:
        """
        Cleans raw credit card transaction logs.
        Parses currency formatting, dates, card identifiers, and removes invalid records.
        """
        df_clean = df.copy()

        # Deduplicate
        df_clean = df_clean.drop_duplicates().reset_index(drop=True)

        # Parse Amount from '$123.45' format
        if 'Amount' in df_clean.columns:
            if not pd.api.types.is_numeric_dtype(df_clean['Amount']):
                df_clean['Amount'] = (
                    df_clean['Amount']
                    .astype(str)
                    .str.replace('$', '', regex=False)
                    .str.replace(',', '', regex=False)
                    .str.strip()
                )
                df_clean['Amount'] = pd.to_numeric(df_clean['Amount'], errors='coerce').fillna(0.0)
            df_clean['Amount'] = df_clean['Amount'].astype(float).clip(lower=0.0)

        # Parse datetime if Year, Month, Day exist
        if {'Year', 'Month', 'Day'}.issubset(df_clean.columns):
            df_clean['timestamp'] = pd.to_datetime(
                {
                    'year': df_clean['Year'],
                    'month': df_clean['Month'],
                    'day': df_clean['Day']
                },
                errors='coerce'
            )

        # Standardize Chip / Payment Method strings
        if 'Use Chip' in df_clean.columns:
            df_clean['Use Chip'] = df_clean['Use Chip'].fillna('Swipe Transaction').astype(str)

        # MCC code validation (standard MCC is 4-digit integer)
        if 'MCC' in df_clean.columns:
            df_clean['MCC'] = pd.to_numeric(df_clean['MCC'], errors='coerce').fillna(0).astype(int)

        return df_clean

    @staticmethod
    def clean_paysim_transactions(df: pd.DataFrame) -> pd.DataFrame:
        """
        Cleans mobile money transactions.
        STRICT REQUIREMENT: Drops isFraud and isFlaggedFraud columns because
        FinSense is focused on personal financial health, not fraud surveillance.
        """
        df_clean = df.copy()

        # Drop fraud detection columns
        fraud_cols = ['isFraud', 'isFlaggedFraud']
        df_clean = df_clean.drop(columns=[col for col in fraud_cols if col in df_clean.columns], errors='ignore')

        # Drop duplicates
        df_clean = df_clean.drop_duplicates().reset_index(drop=True)

        # Ensure amounts and balances are numeric
        balance_cols = ['amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']
        for col in balance_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(0.0).clip(lower=0.0)

        # Standardize transaction type
        if 'type' in df_clean.columns:
            df_clean['type'] = df_clean['type'].astype(str).str.upper().str.strip()

        return df_clean


class DataValidator:
    """
    Validates data integrity, required schema columns, and value ranges.
    """

    @staticmethod
    def validate_columns(df: pd.DataFrame, required_columns: List[str]) -> Tuple[bool, List[str]]:
        """
        Checks whether all required columns exist in the DataFrame.
        Returns: (is_valid, missing_columns)
        """
        missing = [col for col in required_columns if col not in df.columns]
        return len(missing) == 0, missing

    @staticmethod
    def validate_positive_values(df: pd.DataFrame, columns: List[str]) -> Tuple[bool, Dict[str, int]]:
        """
        Validates that designated monetary columns contain no negative values.
        """
        violations = {}
        for col in columns:
            if col in df.columns:
                neg_count = int((df[col] < 0).sum())
                if neg_count > 0:
                    violations[col] = neg_count
        return len(violations) == 0, violations
