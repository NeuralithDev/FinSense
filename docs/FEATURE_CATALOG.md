# FinSense Feature Catalog

> **Status:** Placeholder — fill in during notebooks 06–08.
> Column names should be verified against actual data in notebooks 01–03.

## Financial Profile Features (from cleaned_financial_data.csv)

| Feature | Type | Source Column | Description |
|---|---|---|---|
| `monthly_income_usd` | float | `monthly_income_usd` | Monthly gross income |
| `monthly_expenses_usd` | float | `monthly_expenses_usd` | Total monthly expenses |
| `savings_usd` | float | `savings_usd` | Current savings balance |
| `savings_rate` | float | derived | savings / income |
| `debt_to_income_ratio` | float | `debt_to_income_ratio` | Total debt payments / income |
| `credit_score` | int | `credit_score` | Credit score (300–850) |
| `expense_to_income` | float | derived | expenses / income |
| `emergency_fund_months` | float | derived | savings / monthly_expenses |
| `financial_health_score` | float | derived | Composite 0–100 score |

## Spending Features (from IBM transactions)

| Feature | Type | Description |
|---|---|---|
| `total_monthly_spend` | float | Total spend in month |
| `category_spend_{cat}` | float | Spend by merchant category |
| `category_share_{cat}` | float | Category fraction of total |
| `rolling_7d_spend` | float | 7-day rolling spend |
| `rolling_30d_spend` | float | 30-day rolling spend |
| `spend_z_score` | float | Deviation from user's own mean |

## Behavioral Features (from IBM + PaySim)

| Feature | Type | Description |
|---|---|---|
| `tx_count_7d` | int | Transactions in last 7 days |
| `tx_count_30d` | int | Transactions in last 30 days |
| `unique_merchants_30d` | int | Unique merchants visited |
| `night_tx_ratio` | float | Fraction of transactions after 10pm |
| `weekend_spend_ratio` | float | Weekend spending fraction |
| `recurring_tx_count` | int | Estimated recurring payments |

## Target Variables

| Target | Task | Module |
|---|---|---|
| `next_month_spend` | Regression | `src/forecasting/spending_forecast.py` |
| `cashflow_3m` | Time series | `src/forecasting/cashflow_forecast.py` |
| `is_anomalous_month` | Binary | `src/anomaly/spending_anomaly.py` |
| `health_score` | Regression | `src/financial_health/health_score.py` |
