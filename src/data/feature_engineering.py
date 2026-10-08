import pandas as pd

def engineer_ibm_features(df: pd.DataFrame) -> pd.DataFrame:
    total_spending = df.groupby('User')['Amount'].sum()
    transaction_count = df.groupby('User')['Amount'].count()
    avg_transaction = df.groupby('User')['Amount'].mean()
    max_transaction = df.groupby('User')['Amount'].max()
    
    unique_merchants = df.groupby('User')['Merchant Name'].nunique()
    unique_cities = df.groupby('User')['Merchant City'].nunique()
    unique_mcc = df.groupby('User')['MCC'].nunique()
    
    
    # Temporal Feature Designing
    ## 1. Active Days 
    df['date'] = pd.to_datetime(dict(year=df['Year'],month=df['Month'],day=df['Day']))
    active_days = df.groupby('User')['date'].nunique()
    
    ## 2. Monthly Spending
    monthly_spending = df.groupby(['User','Month'])['Amount'].sum().groupby('User').mean()
    
    ## 3. Night spendings
    df['hour'] = pd.to_datetime(df['Time'], format="%H:%M").dt.hour
    df['is_night'] = ((df['hour'] >= 22) | (df['hour'] < 6))
    night_transaction_ratio = df.groupby('User')['is_night'].mean()
    
    ## 4. Weekend spending behaviour
    df['weekday'] = df['date'].dt.dayofweek # -> 0->monday 1-> tuesday...........
    df['is_weekend'] = (df['weekday'] > 4)
    weekend_transaction_ratio = df.groupby('User')['is_weekend'].mean()
    
    ## 5. Payment behaviour
    df['is_online'] = df['Use Chip'] == "Online Transaction"
    df['is_swipe'] = df['Use Chip'] == "Swipe Transaction"
    df['is_chip'] = df['Use Chip'] == "Chip Transaction"
    
    online_transaction_ratio = df.groupby('User')['is_online'].mean()
    swipe_transaction_ratio = df.groupby('User')['is_swipe'].mean()
    chip_transaction_ratio = df.groupby('User')['is_chip'].mean()
  
    ## 6. Spending Volatility
    spending_volatility = df.groupby('User')['Amount'].std() ## Standard deviation
    
    ## 7. Spending Concentration
    category_spending = df.groupby(['User','MCC'])['Amount'].sum()
    category_spending = category_spending.reset_index()
    
    category_spending['user_total'] = (category_spending['User'].map(total_spending))
    category_spending['category_share'] = (category_spending['Amount']/category_spending['user_total'])
    largest_category_share = category_spending.groupby('User')['category_share'].max()
    
    
    features = pd.DataFrame({
    "total_spending": total_spending,
    "transaction_count": transaction_count,
    "average_transaction": avg_transaction,
    "max_transaction": max_transaction,
    "unique_merchants": unique_merchants,
    "unique_cities": unique_cities,
    "unique_mcc": unique_mcc,
    "active_days": active_days,
    "monthly_spending": monthly_spending,
    "night_transaction_ratio":night_transaction_ratio,
    "weekend_transaction_ratio":weekend_transaction_ratio,
    "online_transaction_ratio":online_transaction_ratio,
    "swipe_transaction_ratio":swipe_transaction_ratio,
    "chip_transaction_ratio":chip_transaction_ratio,
    "largest_category_share": largest_category_share
    })
    features = features.reset_index()
    return features



def engineer_paysim_features(df: pd.DataFrame) -> pd.DataFrame:

    transaction_count = (
        df.groupby("nameOrig")["amount"].count()
    )
    total_transaction_amount = (
        df.groupby("nameOrig")["amount"].sum()
    )
    outflow = df[
        df["type"].isin(
            ["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT"]
        )
    ]

    total_outflow = (
        outflow.groupby("nameOrig")["amount"].sum().fillna(0)
    )

    inflow = df[
        df["type"] == "CASH_IN"
    ]

    total_inflow = (
        inflow.groupby("nameOrig")["amount"].sum().fillna(0)
    )

    net_cash_flow = total_inflow - total_outflow
    
   
    df['origin_balance_change'] = (df["newbalanceOrig"] - df["oldbalanceOrg"])
    
    df["destination_balance_change"] = (df["newbalanceDest"] - df["oldbalanceDest"])

    average_transaction = (df.groupby("nameOrig")["amount"].mean())
    
    max_transaction = (df.groupby("nameOrig")["amount"].max())
    
    transaction_volatility = (df.groupby("nameOrig")["amount"].std())
        
    df["is_payment"] = df["type"] == "PAYMENT"

    payment_ratio = (
        df.groupby("nameOrig")["is_payment"].mean()
    )
    df["is_transfer"] = df["type"] == "TRANSFER"
    df["is_cash_out"] = df["type"] == "CASH_OUT"
    df["is_debit"] = df["type"] == "DEBIT"
    df["is_cash_in"] = df["type"] == "CASH_IN"
    
    transfer_ratio = df.groupby("nameOrig")["is_transfer"].mean()

    cash_out_ratio = df.groupby("nameOrig")["is_cash_out"].mean()

    debit_ratio = df.groupby("nameOrig")["is_debit"].mean()

    cash_in_ratio = df.groupby("nameOrig")["is_cash_in"].mean()
    
    # large txn behaviour
    average_transaction = (
        df.groupby("nameOrig")["amount"].mean()  #### WE can use percentile based thresholds in future but for now we are on mean based version
    )
    df["user_average_transaction"] = (
        df["nameOrig"].map(average_transaction)
    )
    df["is_large_transaction"] = (
        df["amount"] > df["user_average_transaction"]
    )
    large_transaction_ratio = (
        df.groupby("nameOrig")["is_large_transaction"].mean()
    )
    
    df["absolute_balance_change"] = (
        df["origin_balance_change"].abs()
    )
    average_balance_change = (
        df.groupby("nameOrig")["absolute_balance_change"].mean()
    )
    
    df["balance_depleted"] = (
        df["newbalanceOrig"] == 0
    )
    
    balance_depletion_ratio = (
        df.groupby("nameOrig")["balance_depleted"].mean()
    )
    
    # txn activity over time
    active_steps = (
        df.groupby("nameOrig")["step"].nunique()
    )
    transaction_frequency = (
        transaction_count / active_steps
    )
    
    transactions_per_step = (
        df.groupby(["nameOrig", "step"])
        .size()
        .reset_index(name="transactions")
    )
    
    max_transactions_in_step = (
        transactions_per_step
        .groupby("nameOrig")["transactions"]
        .max()
    )
    
    # txn to balance ratio
    df["balance_before_transaction_ratio"] = (
        df["amount"] / df["oldbalanceOrg"].replace(0, pd.NA)
    )
    average_balance_utilization = (
        df.groupby("nameOrig")["balance_before_transaction_ratio"]
        .mean()
    )
    df["high_balance_utilization"] = (
        df["balance_before_transaction_ratio"] > 0.5
    )
    high_balance_utilization_ratio = (
        df.groupby("nameOrig")["high_balance_utilization"].mean()
    )
    
    df["expected_new_balance"] = (
        df["oldbalanceOrg"] - df["amount"]
    )
    df["balance_error"] = (
        df["newbalanceOrig"] - df["expected_new_balance"]
    ).abs()
    df["expected_new_balance"] = df["oldbalanceOrg"]

    outgoing = df["type"].isin(
        ["PAYMENT", "TRANSFER", "CASH_OUT", "DEBIT"]
    )

    incoming = df["type"] == "CASH_IN"

    df.loc[outgoing, "expected_new_balance"] = (
        df.loc[outgoing, "oldbalanceOrg"]
        - df.loc[outgoing, "amount"]
    )

    df.loc[incoming, "expected_new_balance"] = (
        df.loc[incoming, "oldbalanceOrg"]
        + df.loc[incoming, "amount"]
    )
    df["balance_error"] = (
        df["newbalanceOrig"]
        - df["expected_new_balance"]
    ).abs()
    average_balance_error = (
        df.groupby("nameOrig")["balance_error"].mean()
    )
    max_balance_error = (
        df.groupby("nameOrig")["balance_error"].max()
    )
    
    df["has_balance_mismatch"] = (
        df["balance_error"] > 0
    )
    balance_mismatch_ratio = (
        df.groupby("nameOrig")["has_balance_mismatch"].mean()
    )
    
    
    features = pd.DataFrame({
        "transaction_count": transaction_count,
        "total_transaction_amount": total_transaction_amount,
        "average_transaction": average_transaction,
        "max_transaction": max_transaction,
        "transaction_volatility": transaction_volatility,

        "total_outflow": total_outflow,
        "total_inflow": total_inflow,
        "net_cash_flow": net_cash_flow,

        "payment_ratio": payment_ratio,
        "transfer_ratio": transfer_ratio,
        "cash_out_ratio": cash_out_ratio,
        "debit_ratio": debit_ratio,
        "cash_in_ratio": cash_in_ratio,

        "large_transaction_ratio": large_transaction_ratio,
        "average_balance_change": average_balance_change,
        "balance_depletion_ratio": balance_depletion_ratio,
        "active_steps": active_steps,
        "transaction_frequency": transaction_frequency,
        "max_transactions_in_step": max_transactions_in_step,
        "average_balance_utilization": average_balance_utilization,
        "high_balance_utilization_ratio": high_balance_utilization_ratio,
        "average_balance_error": average_balance_error,
        "max_balance_error": max_balance_error,
        "balance_mismatch_ratio": balance_mismatch_ratio,
    })
    features = features.reset_index()
    features = features.fillna(0)

    features = features.replace(
        [float("inf"), float("-inf")],
        0
    )
    return features


def create_paysim_target(df: pd.DataFrame) -> pd.DataFrame:

    fraud_count = (
        df.groupby("nameOrig")["isFraud"].sum()
    )

    fraud_rate = (
        df.groupby("nameOrig")["isFraud"].mean()
    )

    target = pd.DataFrame({
        "fraud_count": fraud_count,
        "fraud_rate": fraud_rate,
        "is_fraud": (fraud_count > 0).astype(int)
    })

    return target.reset_index()
    