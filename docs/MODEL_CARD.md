# FinSense Model Cards

> **Status:** Placeholder — fill in as models are trained.

## Spending Forecast Model

| Field | Value |
|---|---|
| Model type | TBD (Prophet / LSTM) |
| Task | Monthly spending regression |
| Input | 6-month spending history + user features |
| Output | Next N months predicted spend |
| Evaluation metrics | MAE, RMSE, MAPE |
| Training data | IBM credit card transactions |
| Baseline to beat | Rolling 3-month mean |
| Status | ⬜ Not yet trained |

## Cash Flow Model

| Field | Value |
|---|---|
| Model type | TBD |
| Task | Net cash position projection |
| Status | ⬜ Not yet trained |

## Financial Health Score

| Field | Value |
|---|---|
| Model type | Rule-based weighted composite |
| Dimensions | Savings (25%), Debt (25%), Expenses (25%), Credit (25%) |
| Output range | 0 – 100 |
| Status | ⬜ Not yet implemented |
