"""
Financial Scaling and Preprocessing Transformers.

Handles heavy right-skewed distributions in financial transactions and profiles
using logarithmic transformations combined with standard scaling.
"""

from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, RobustScaler


class FinancialLogScaler(BaseEstimator, TransformerMixin):
    """
    Custom Scikit-Learn compatible transformer designed for financial metrics.
    
    Why:
    Financial variables (spending, income, max transactions) exhibit extreme right-skewness 
    (log-normal or power-law). Standard z-score scaling without log-transformation is 
    distorted by extreme outliers ($4M spenders). 
    
    This transformer applies log1p (log(1 + x)) to specified monetary columns 
    to compress the scale into a Gaussian-like distribution, followed by standard scaling.
    """
    
    DEFAULT_LOG_COLS = [
        'total_spending',
        'monthly_spending',
        'average_transaction',
        'max_transaction',
        'monthly_income_usd',
        'monthly_expenses_usd',
        'savings_usd',
        'loan_amount_usd',
        'monthly_emi_usd'
    ]

    def __init__(self, log_columns: Optional[List[str]] = None, use_robust: bool = False):
        self.log_columns = log_columns or self.DEFAULT_LOG_COLS
        self.use_robust = use_robust
        self.scaler = RobustScaler() if use_robust else StandardScaler()
        self.columns_in_fit_ = []

    def fit(self, X: pd.DataFrame, y=None):
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)
        self.columns_in_fit_ = X.columns.tolist()
        
        X_trans = X.copy()
        for col in self.log_columns:
            if col in X_trans.columns:
                # Clip negative values if any to 0 before log1p
                X_trans[col] = np.log1p(np.maximum(0.0, X_trans[col].astype(float)))
                
        self.scaler.fit(X_trans)
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.columns_in_fit_)
            
        X_trans = X.copy()
        for col in self.log_columns:
            if col in X_trans.columns:
                X_trans[col] = np.log1p(np.maximum(0.0, X_trans[col].astype(float)))
                
        scaled_array = self.scaler.transform(X_trans)
        return pd.DataFrame(scaled_array, columns=X.columns, index=X.index)

    def inverse_transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Inverse transformation to recover dollar scale for interpretable outputs."""
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=self.columns_in_fit_)
            
        unscaled_array = self.scaler.inverse_transform(X)
        X_orig = pd.DataFrame(unscaled_array, columns=X.columns, index=X.index)
        
        for col in self.log_columns:
            if col in X_orig.columns:
                X_orig[col] = np.expm1(X_orig[col])
                
        return X_orig
