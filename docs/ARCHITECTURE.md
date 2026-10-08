# FinSense Architecture

## System Overview

```
Raw Financial Data (3 datasets)
        │
        ▼
┌─────────────────────────────┐
│      Data Engineering       │  src/data/
│  Load → Validate → Clean    │
│  → Aggregate → Chunk        │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│    Feature Engineering      │  src/features/
│  Spending · Income          │
│  Savings · Debt             │
│  Behavioral · Temporal      │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   Financial Health Score    │  src/financial_health/
│   + Financial Profile       │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  User Financial State       │  src/fusion/
│  (unified representation)   │
└─────────────────────────────┘
    /       |       \
   ▼        ▼        ▼
Forecast  Anomaly  Scenario     src/forecasting/
(spending  (spend   (what-if    src/anomaly/
cashflow)  patterns) analysis)  src/scenarios/
   \       |       /
    ▼      ▼      ▼
┌─────────────────────────────┐
│   Recommendation Engine     │  src/recommendations/
│   + Financial Rules         │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│     AI Financial Assistant  │  src/ai/
│   (LLM grounded in state)   │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│      API / Dashboard        │  app/
│  FastAPI + Streamlit/React  │
└─────────────────────────────┘
```

## Module Responsibilities

| Module | File | Answers |
|---|---|---|
| Data Engineering | `src/data/` | Load, validate, clean, chunk all 3 datasets |
| Feature Engineering | `src/features/` | Build spending, behavioral, income, debt features |
| Financial Health | `src/financial_health/` | Score + profile + explain user's financial wellness |
| Forecasting | `src/forecasting/` | Predict future spending and cash flow |
| Anomaly Detection | `src/anomaly/` | Flag unusual spending vs personal baseline |
| Scenario Analysis | `src/scenarios/` | Model what-if financial decisions |
| Recommendations | `src/recommendations/` | Generate prioritized, actionable financial advice |
| Fusion | `src/fusion/` | Assemble unified UserFinancialState |
| AI Assistant | `src/ai/` | LLM Q&A grounded in real user data |
| Graph (optional) | `src/graph/` | User similarity, peer benchmarking |
| Models | `src/models/` | Registry, utils, device management |
| Evaluation | `src/evaluation/` | Metrics, validation, model comparison |
| API | `app/` | FastAPI endpoints + service layer |

## Data Flow

```
cleaned_financial_data.csv ──► financial_loader ──► financial features
                                                 ──► health score
                                                 ──► profile

credit_card_transactions.csv ──► ibm_loader (chunked) ──► spending features
                                                       ──► behavioral features
                                                       ──► temporal features

PaySim.csv ──► paysim_loader (chunked) ──► cash-flow features
                                       ──► behavioral features
```

## MVP Scope (Week 1)

Priority order:
1. Data pipeline (all 3 datasets loading + cleaning)
2. Feature engineering (spending + behavioral + financial health)
3. Financial Health Score
4. Spending Forecast (Prophet baseline first)
5. Cash Flow Projection
6. Scenario Analysis (affordability module)
7. Recommendations (rule-based first)
8. AI Assistant (LLM with context)
9. API + Demo

Graph module is post-MVP.
