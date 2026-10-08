# Data Notes

## Datasets Overview

| Dataset | Location | Rows (approx.) | Purpose |
|---|---|---|---|
| Financial Profiles | `data/raw/financial/cleaned_financial_data.csv` | TBD after EDA | User financial health, income, debt, savings |
| IBM Credit Card Transactions | `data/raw/IBM/credit_card_transactions-ibm_v2.csv` | Large (>1M) | Spending behavior, merchant patterns, temporal features |
| IBM Users | `data/raw/IBM/sd254_users.csv` | ~2K | User demographics |
| IBM Cards | `data/raw/IBM/sd254_cards.csv` | ~6K | Card metadata |
| PaySim | `data/raw/paysim/PaySim.csv` | ~6M | Cash-flow behavioral features, large-scale processing |

## Data Rules

1. **Raw data is read-only.** Never write to `data/raw/`.
2. **Cleaned data** goes to `data/interim/` per dataset.
3. **Feature matrices** go to `data/processed/`.
4. Large files must be processed in chunks (see `configs/config.yaml → data.chunk_size`).
5. `isFraud` / `isFlaggedFraud` from PaySim are **excluded** — not the project objective.

## Known Issues / Observations

> Fill in during EDA (notebooks 00–05)

### Financial Dataset
- [ ] Confirm exact column names
- [ ] Check for missing values in credit_score, loan columns
- [ ] Validate date range of record_date

### IBM Transactions
- [ ] Confirm user/card join keys
- [ ] Check amount sign convention (debits vs. credits)
- [ ] Identify MCC code mapping

### PaySim
- [ ] Confirm time step unit (hours)
- [ ] Check balance consistency (oldbalance + amount = newbalance?)
- [ ] Identify dominant transaction types
