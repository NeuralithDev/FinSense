"""
Comprehensive Feature Engineering Module for FinSense.

Combines:
1. Raw transaction aggregation algorithms (IBM credit card logs & PaySim mobile cash-flow)
   recovered from .archive_old/src_backup/data/feature_engineering.py.
2. Financial profile ratios (disposable income, expense ratio, debt burden, runway months).
3. Advanced modeling & behavioral features derived from EDA (de-biasing cohort age,
   relative shock ratios, category concentration, liquidity stress, and multicollinearity pruning).
"""

from typing import Optional, Dict, Any
import numpy as np
import pandas as pd


# =============================================================================
# 1. RAW DATA AGGREGATION ENGINES (From .archive_old)
# =============================================================================

def aggregate_raw_ibm_transactions(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates raw individual IBM transaction logs into user-level behavioral metrics.
    
    Processes:
    - Monetary volume: total, count, average, max, std (volatility)
    - Diversity: unique merchants, cities, MCCs
    - Temporal: active days, monthly average, night ratio, weekend ratio
    - Payment channels: online, swipe, chip ratios
    - Concentration: largest single MCC category spending share
    """
    df = df_raw.copy()

    total_spending = df.groupby('User')['Amount'].sum()
    transaction_count = df.groupby('User')['Amount'].count()
    avg_transaction = df.groupby('User')['Amount'].mean()
    max_transaction = df.groupby('User')['Amount'].max()
    spending_volatility = df.groupby('User')['Amount'].std().fillna(0.0)

    unique_merchants = df.groupby('User')['Merchant Name'].nunique()
    unique_cities = df.groupby('User')['Merchant City'].nunique()
    unique_mcc = df.groupby('User')['MCC'].nunique()

    # Temporal feature calculations
    if {'Year', 'Month', 'Day'}.issubset(df.columns):
        df['date'] = pd.to_datetime(dict(year=df['Year'], month=df['Month'], day=df['Day']))
        active_days = df.groupby('User')['date'].nunique()
        monthly_spending = df.groupby(['User', 'Month'])['Amount'].sum().groupby('User').mean()
        df['weekday'] = df['date'].dt.dayofweek
        df['is_weekend'] = (df['weekday'] > 4).astype(float)
        weekend_transaction_ratio = df.groupby('User')['is_weekend'].mean()
    else:
        active_days = pd.Series(1, index=total_spending.index)
        monthly_spending = total_spending
        weekend_transaction_ratio = pd.Series(0.286, index=total_spending.index)

    # Night spending (10 PM to 6 AM)
    if 'Time' in df.columns:
        df['hour'] = pd.to_datetime(df['Time'], format="%H:%M", errors='coerce').dt.hour
        df['is_night'] = ((df['hour'] >= 22) | (df['hour'] < 6)).astype(float)
        night_transaction_ratio = df.groupby('User')['is_night'].mean()
    else:
        night_transaction_ratio = pd.Series(0.10, index=total_spending.index)

    # Channel ratios
    if 'Use Chip' in df.columns:
        df['is_online'] = (df['Use Chip'] == "Online Transaction").astype(float)
        df['is_swipe'] = (df['Use Chip'] == "Swipe Transaction").astype(float)
        df['is_chip'] = (df['Use Chip'] == "Chip Transaction").astype(float)
        online_transaction_ratio = df.groupby('User')['is_online'].mean()
        swipe_transaction_ratio = df.groupby('User')['is_swipe'].mean()
        chip_transaction_ratio = df.groupby('User')['is_chip'].mean()
    else:
        online_transaction_ratio = pd.Series(0.06, index=total_spending.index)
        swipe_transaction_ratio = pd.Series(0.60, index=total_spending.index)
        chip_transaction_ratio = pd.Series(0.34, index=total_spending.index)

    # Spending Concentration (Top category share)
    category_spending = df.groupby(['User', 'MCC'])['Amount'].sum().reset_index()
    category_spending['user_total'] = category_spending['User'].map(total_spending)
    category_spending['category_share'] = category_spending['Amount'] / np.maximum(category_spending['user_total'], 1.0)
    largest_category_share = category_spending.groupby('User')['category_share'].max()

    features = pd.DataFrame({
        "User": total_spending.index,
        "total_spending": total_spending.values,
        "transaction_count": transaction_count.values,
        "average_transaction": avg_transaction.values,
        "max_transaction": max_transaction.values,
        "spending_volatility": spending_volatility.values,
        "unique_merchants": unique_merchants.values,
        "unique_cities": unique_cities.values,
        "unique_mcc": unique_mcc.values,
        "active_days": active_days.values,
        "monthly_spending": monthly_spending.values,
        "night_transaction_ratio": night_transaction_ratio.fillna(0.0).values,
        "weekend_transaction_ratio": weekend_transaction_ratio.fillna(0.0).values,
        "online_transaction_ratio": online_transaction_ratio.fillna(0.0).values,
        "swipe_transaction_ratio": swipe_transaction_ratio.fillna(0.0).values,
        "chip_transaction_ratio": chip_transaction_ratio.fillna(0.0).values,
        "largest_category_share": largest_category_share.fillna(0.0).values
    })

    return features.reset_index(drop=True)


def aggregate_raw_paysim_transactions(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregates raw individual PaySim mobile transaction logs into customer-level cash flow metrics.
    
    Processes:
    - Outflows vs Inflows and Net Cash Flow
    - Transaction Type Ratios (Payment, Transfer, Cash-Out, Debit, Cash-In)
    - Zero-Balance Depletion Rate and Balance Utilization
    - Accounting Balance Discrepancies and Velocity
    """
    df = df_raw.copy()

    transaction_count = df.groupby("nameOrig")["amount"].count()
    total_transaction_amount = df.groupby("nameOrig")["amount"].sum()
    average_transaction = df.groupby("nameOrig")["amount"].mean()
    max_transaction = df.groupby("nameOrig")["amount"].max()
    transaction_volatility = df.groupby("nameOrig")["amount"].std().fillna(0.0)

    # Inflows vs Outflows
    outflow_mask = df["type"].isin(["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT"])
    total_outflow = df[outflow_mask].groupby("nameOrig")["amount"].sum().reindex(transaction_count.index, fill_value=0.0)

    inflow_mask = df["type"] == "CASH_IN"
    total_inflow = df[inflow_mask].groupby("nameOrig")["amount"].sum().reindex(transaction_count.index, fill_value=0.0)
    net_cash_flow = total_inflow - total_outflow

    # Transaction types
    payment_ratio = df.groupby("nameOrig")[df["type"] == "PAYMENT"].mean().reindex(transaction_count.index, fill_value=0.0)
    transfer_ratio = df.groupby("nameOrig")[df["type"] == "TRANSFER"].mean().reindex(transaction_count.index, fill_value=0.0)
    cash_out_ratio = df.groupby("nameOrig")[df["type"] == "CASH_OUT"].mean().reindex(transaction_count.index, fill_value=0.0)
    debit_ratio = df.groupby("nameOrig")[df["type"] == "DEBIT"].mean().reindex(transaction_count.index, fill_value=0.0)
    cash_in_ratio = df.groupby("nameOrig")[df["type"] == "CASH_IN"].mean().reindex(transaction_count.index, fill_value=0.0)

    # Balance Depletion (Rate of draining account balance to zero)
    balance_depleted = (df["newbalanceOrig"] == 0) & (df["oldbalanceOrg"] > 0)
    balance_depletion_ratio = df.groupby("nameOrig")[balance_depleted].mean().reindex(transaction_count.index, fill_value=0.0)

    # Balance Utilization: amount / oldbalance
    old_bal_safe = df["oldbalanceOrg"].replace(0, np.nan)
    utilization = (df["amount"] / old_bal_safe).fillna(0.0)
    average_balance_utilization = df.groupby("nameOrig")[utilization].mean().reindex(transaction_count.index, fill_value=0.0)
    high_utilization = (utilization > 0.50).astype(float)
    high_balance_utilization_ratio = df.groupby("nameOrig")[high_utilization].mean().reindex(transaction_count.index, fill_value=0.0)

    # Temporal Steps & Velocity
    active_steps = df.groupby("nameOrig")["step"].nunique()
    transaction_frequency = transaction_count / np.maximum(active_steps, 1)

    features = pd.DataFrame({
        "nameOrig": transaction_count.index,
        "transaction_count": transaction_count.values,
        "total_transaction_amount": total_transaction_amount.values,
        "average_transaction": average_transaction.values,
        "max_transaction": max_transaction.values,
        "transaction_volatility": transaction_volatility.values,
        "total_outflow": total_outflow.values,
        "total_inflow": total_inflow.values,
        "net_cash_flow": net_cash_flow.values,
        "payment_ratio": payment_ratio.values,
        "transfer_ratio": transfer_ratio.values,
        "cash_out_ratio": cash_out_ratio.values,
        "debit_ratio": debit_ratio.values,
        "cash_in_ratio": cash_in_ratio.values,
        "balance_depletion_ratio": balance_depletion_ratio.values,
        "active_steps": active_steps.values,
        "transaction_frequency": transaction_frequency.values,
        "average_balance_utilization": average_balance_utilization.values,
        "high_balance_utilization_ratio": high_balance_utilization_ratio.values
    }).reset_index(drop=True)

    return features.fillna(0.0).replace([np.inf, -np.inf], 0.0)


# =============================================================================
# 2. FINANCIAL PROFILE RATIOS & SOLVENCY FEATURES
# =============================================================================

def engineer_financial_profile_features(df_fin: pd.DataFrame) -> pd.DataFrame:
    """
    Computes liquidity, debt service, disposable income, and cash flow health indicators.
    Combines legacy features from archive with modern financial health indicators.
    """
    features = df_fin.copy()

    # Safe denominators
    income_safe = np.maximum(features['monthly_income_usd'].values, 1.0)
    expenses_safe = np.maximum(features['monthly_expenses_usd'].values, 1.0)
    savings_safe = np.maximum(features['savings_usd'].values, 0.0)
    emi_safe = features['monthly_emi_usd'].fillna(0.0).values if 'monthly_emi_usd' in features.columns else np.zeros(len(features))

    # Core Liquidity & Runway (Emergency Fund Months)
    features['emergency_fund_months'] = savings_safe / expenses_safe
    features['runway_months'] = features['emergency_fund_months']

    # Budget & Expense Ratios
    features['expense_ratio'] = features['monthly_expenses_usd'].values / income_safe
    features['emi_ratio'] = emi_safe / income_safe
    features['debt_burden_ratio'] = features['emi_ratio']

    # Disposable Income & Net Cash Flow
    features['disposable_income'] = features['monthly_income_usd'].values - features['monthly_expenses_usd'].values - emi_safe
    features['net_cash_flow'] = features['monthly_income_usd'].values - features['monthly_expenses_usd'].values
    features['savings_rate'] = features['net_cash_flow'].values / income_safe

    # Solvency Indicator
    features['is_cash_flow_positive'] = (features['net_cash_flow'] > 0).astype(int)

    return features


# =============================================================================
# 3. DOWNSTREAM MODELING & BEHAVIORAL FEATURES (EDA-Calibrated)
# =============================================================================

def engineer_ibm_features(df_ibm: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms user-level aggregated IBM features into scale-invariant behavioral signals.
    De-biases cohort tenure, computes shock ratios, and prunes multicollinearity.
    """
    df = df_ibm.copy()

    # 1. Frequency per active day (removes account tenure age bias)
    active_days_safe = np.maximum(df['active_days'].values, 1.0)
    df['daily_frequency'] = df['transaction_count'].values / active_days_safe

    # 2. Shock ratio (Max transaction relative to user's average purchase size)
    avg_tx_safe = np.maximum(df['average_transaction'].values, 1e-3)
    df['shock_ratio'] = df['max_transaction'].values / avg_tx_safe

    # 3. Behavioral segmentation flags
    df['is_concentrated_budget'] = (df['largest_category_share'] > 0.50).astype(int)
    df['is_digital_shopper'] = (df['online_transaction_ratio'] > 0.20).astype(int)
    df['is_night_spender'] = (df['night_transaction_ratio'] > 0.15).astype(int)

    # 4. Multi-channel balance: Physical vs Digital
    df['physical_channel_ratio'] = df['swipe_transaction_ratio'] + df['chip_transaction_ratio']

    # 5. Drop collinear redundancies identified during correlation EDA
    redundant_cols = ['total_spending', 'unique_cities']
    df = df.drop(columns=[col for col in redundant_cols if col in df.columns], errors='ignore')

    return df


def engineer_paysim_features(df_paysim: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts cash-flow dynamics, liquidity stress, and account balance depletion
    from aggregated PaySim customer features.
    """
    df = df_paysim.copy()

    # Inflow vs Outflow replenishment ratio
    if 'total_inflow' in df.columns and 'total_outflow' in df.columns:
        outflow_safe = np.maximum(df['total_outflow'].values, 1.0)
        df['inflow_to_outflow_ratio'] = df['total_inflow'].values / outflow_safe

    # Account Depletion Risk (Draining account to zero)
    if 'balance_depletion_ratio' in df.columns:
        df['cash_depletion_risk'] = df['balance_depletion_ratio'].values

    # Combined Liquidity Stress Index
    if 'balance_depletion_ratio' in df.columns and 'high_balance_utilization_ratio' in df.columns:
        df['liquidity_stress_index'] = (
            df['balance_depletion_ratio'].values * 0.6 +
            df['high_balance_utilization_ratio'].values * 0.4
        )

    # Transfer vs Merchant Dependency
    if 'transfer_ratio' in df.columns and 'cash_out_ratio' in df.columns:
        df['transfer_dependency'] = df['transfer_ratio'].values + df['cash_out_ratio'].values

    # Depletion Stress Indicator (> 30% of transactions zero the balance)
    df['is_depletion_stressed'] = (df.get('cash_depletion_risk', 0.0) > 0.30).astype(int)

    return df
