"""
Build Model-Ready Dataset for Deep Learning & ML.

Fuses:
1. data/processed/full_ibm_features.csv (2,000 users, transaction behavior)
2. data/raw/IBM/sd254_users.csv (2,000 users, demographics, FICO, Income, Debt)
3. Feature Engineering pipeline (rates, ratios, risk flags)
4. Financial State Engine (health score, tier, persona)

Outputs:
data/processed/model_ready/financial_master_features.csv
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd

from src.data.feature_engineering import engineer_ibm_features
from src.intelligence.financial_state import FinancialStateEngine


def build_master_dataset():
    root = Path("/Users/ms/Desktop/FinSense")
    ibm_features_path = root / "data" / "processed" / "full_ibm_features.csv"
    users_path = root / "data" / "raw" / "IBM" / "sd254_users.csv"
    output_dir = root / "data" / "processed" / "model_ready"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "financial_master_features.csv"

    print("▶ Loading datasets...")
    df_ibm = pd.read_csv(ibm_features_path)
    df_users = pd.read_csv(users_path)
    
    # Clean demographic currency strings
    for col in ['Per Capita Income - Zipcode', 'Yearly Income - Person', 'Total Debt']:
        if col in df_users.columns:
            df_users[col] = df_users[col].astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False)
            df_users[col] = pd.to_numeric(df_users[col], errors='coerce').fillna(0.0)

    # Add 0-indexed User ID to demographics
    df_users['User'] = df_users.index

    # Compute financial profile variables
    df_users['monthly_income_usd'] = df_users['Yearly Income - Person'] / 12.0
    income_safe = np.maximum(df_users['Yearly Income - Person'].values, 1.0)
    df_users['debt_to_income_ratio'] = df_users['Total Debt'].values / income_safe
    df_users['credit_score'] = df_users['FICO Score']

    # Merge IBM behavioral features with demographic profiles
    print("▶ Merging IBM features with User demographics...")
    merged = pd.merge(df_ibm, df_users, on='User', how='inner')

    # Apply feature engineering
    print("▶ Running feature engineering pipeline...")
    engineered = engineer_ibm_features(merged)

    # Estimate liquidity cushion & savings runway
    # Estimated savings as 20% of net annual equity / liquid cushion
    estimated_savings = np.maximum(0.0, df_users['Yearly Income - Person'] * 0.15)
    burn_safe = np.maximum(engineered['monthly_spending'].values, 1.0)
    engineered['runway_months'] = estimated_savings / burn_safe
    engineered['net_cash_flow'] = engineered['monthly_income_usd'] - engineered['monthly_spending']
    engineered['savings_rate'] = engineered['net_cash_flow'] / np.maximum(engineered['monthly_income_usd'], 1.0)

    # Compute unified Financial Health Score & Persona for each user
    print("▶ Computing Financial Health Scores and Personas...")
    scored_states = []
    for _, row in engineered.iterrows():
        state = FinancialStateEngine.fuse_and_score(
            user_id=str(row['User']),
            ibm_features=row.to_dict(),
            fin_profile=row.to_dict(),
            paysim_features={"cash_depletion_risk": 0.05, "inflow_to_outflow_ratio": 1.1}
        )
        scored_states.append({
            "health_score": state.health_score,
            "health_tier": state.health_tier,
            "credit_pillar": state.credit_pillar,
            "debt_pillar": state.debt_pillar,
            "liquidity_pillar": state.liquidity_pillar,
            "discipline_pillar": state.discipline_pillar,
            "persona": state.persona,
            "num_risk_alerts": len(state.risk_alerts)
        })

    df_scored = pd.DataFrame(scored_states)
    master_df = pd.concat([engineered, df_scored], axis=1)

    # Save to model-ready
    master_df.to_csv(output_file, index=False)
    print(f"\n✅ Master Dataset built successfully!")
    print(f"   Saved to: {output_file}")
    print(f"   Shape: {master_df.shape} (2000 users x {master_df.shape[1]} features)")
    return master_df


if __name__ == "__main__":
    build_master_dataset()
