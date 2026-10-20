# FinSense 💸

**AI-Powered Personal Finance Intelligence System**

FinSense goes beyond traditional finance dashboards by answering five questions
every person has about their money:

| # | Question | Capability |
|---|---|---|
| 1 | What happened to my money? | Spending analysis & behavioral features |
| 2 | Why is it happening? | Financial health scoring & anomaly detection |
| 3 | What is likely to happen next? | Spending & cash-flow forecasting |
| 4 | What should I do? | Personalised, rule-based + ML recommendations |
| 5 | What if I make a different decision? | Scenario analysis & affordability engine |

An **AI Financial Assistant** ties it all together — answering natural-language
questions grounded in the user's real financial data.

---

## Architecture

```
Raw Financial Data (3 datasets)
        │
        ▼
Data Engineering (src/data/)
        │
        ▼
Feature Engineering (src/features/)
        │
        ▼
Financial Health Score + Profile (src/financial_health/)
        │
        ▼
User Financial State — unified (src/fusion/)
     /      |      \
    ▼       ▼       ▼
Forecast  Anomaly  Scenario (src/forecasting/ · src/anomaly/ · src/scenarios/)
     \      |      /
        ▼
Recommendation Engine (src/recommendations/)
        │
        ▼
AI Financial Assistant (src/ai/)
        │
        ▼
FastAPI / Dashboard (app/)
```

---

## Datasets

| Dataset | Path | Purpose |
|---|---|---|
| Financial Profiles | `data/raw/financial/cleaned_financial_data.csv` | Income, savings, debt, credit health |
| IBM Credit Card Transactions | `data/raw/IBM/credit_card_transactions-ibm_v2.csv` | Spending behavior, temporal & merchant patterns |
| PaySim | `data/raw/paysim/PaySim.csv` | Cash-flow behavior, large-scale processing |

> **Rule:** Raw data is read-only. `isFraud`/`isFlaggedFraud` are excluded — this project is about financial *health*, not fraud detection.

---

## Project Structure

```
FinSense/
├── configs/                    # Master config + feature catalog
├── data/
│   ├── raw/                    # Original datasets (gitignored)
│   ├── interim/                # Cleaned intermediates (gitignored)
│   └── processed/              # Model-ready features (gitignored)
├── notebooks/                  # 00–16 progressive experiment notebooks
├── src/
│   ├── data/                   # Loaders, cleaning, validation, aggregation
│   ├── features/               # Spending, income, savings, debt, behavioral, temporal
│   ├── financial_health/       # Health score, profile, explanations
│   ├── forecasting/            # Spending & cash-flow forecasting
│   ├── anomaly/                # Spending anomaly detection
│   ├── scenarios/              # What-if scenario engine & affordability
│   ├── recommendations/        # Recommendation engine & rules
│   ├── fusion/                 # UserFinancialState assembly
│   ├── ai/                     # LLM assistant, context builder, prompts
│   ├── models/                 # Registry & model utilities
│   ├── evaluation/             # Metrics, validation, model comparison
│   ├── graph/                  # [Optional, post-MVP] User similarity graph
│   └── utils/                  # Config, logging, paths, seed
├── app/
│   ├── main.py                 # FastAPI entrypoint
│   ├── api/                    # Route handlers (users, insights, forecasts, scenarios)
│   └── services/               # Service layer bridging API ↔ src/
├── models/                     # Trained model artifacts (gitignored)
├── artifacts/                  # Figures, metrics, reports (gitignored)
├── experiments/                # Experiment result CSVs (gitignored)
├── scripts/                    # CLI pipeline scripts
├── tests/                      # pytest test suite
└── docs/                       # Architecture, feature catalog, model cards, notes
```

---

## Setup

```bash
# Activate the existing virtual environment
source .venv/bin/activate

# Copy environment template
cp .env.example .env
# Edit .env — add your OpenAI / Anthropic key for the AI assistant

# Verify setup
python -c "from src.utils.paths import ROOT; print('Root:', ROOT)"
```

---

## Notebook Roadmap (Week 1 Plan)

| Day | Notebooks | Focus |
|---|---|---|
| 1 | 00–03 | EDA on all three datasets |
| 2 | 04–05 | Validation + cleaning → `data/interim/` |
| 3 | 06–08 | Feature engineering → financial health score |
| 4 | 09–10 | Spending + cash-flow forecasting |
| 5 | 11–14 | Anomaly, scenario, recommendations |
| 6 | 13 | AI assistant + context builder |
| 7 | 15–16 | Model comparison + final demo |

---

---

## Running FinSense

### 1. Launch FastAPI Backend
```bash
# Option A: One-click script
./run_api.sh

# Option B: Direct with Anaconda Python
env PYTHONPATH=. /opt/anaconda3/bin/python -B app/main.py

# Option C: Uvicorn live reload
env PYTHONPATH=. /opt/anaconda3/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation (Swagger): `http://localhost:8000/docs`
- Embedded Dashboard: `http://localhost:8000/dashboard/`

### 2. Launch Vite React Frontend (Dev Server)
```bash
# Option A: One-click script
./run_dashboard.sh

# Option B: Direct with npm
cd app/frontend && npm run dev
```
- Interactive Copilot Cockpit: `http://localhost:5173`

---

## Complete Test Suite Verification

Run the master test runner across all 18 unit, model, intelligence, API, and AI assistant test suites:
```bash
env PYTHONPATH=. python -B scripts/run_all_tests.py
```

### Verification Matrix (18/18 Passing)
| Suite | Component | Status |
|---|---|---|
| `test_data.py` | Multi-dataset ingestion & cleaning | ✅ PASSED |
| `test_features.py` | Ratios, shock multipliers, cyclical features | ✅ PASSED |
| `test_sequences.py` | Sliding temporal window builders | ✅ PASSED |
| `test_lstm.py` | `SpendingLSTM` deep forecaster | ✅ PASSED |
| `test_forecasting.py` | EWMA, AR-Ridge, baselines & benchmarks | ✅ PASSED |
| `test_autoencoder.py` | Bottleneck `FinancialAutoencoder` | ✅ PASSED |
| `test_isolation_forest.py` | `AnomalyIsolationForest` & consensus | ✅ PASSED |
| `test_contextual_bandit.py` | `LinUCB` & Thompson Sampling personalization | ✅ PASSED |
| `test_graphsage.py` | `FinancialGraphSAGE` & peer twin embeddings | ✅ PASSED |
| `test_financial_state.py` | 4-Pillar composite score & behavioral personas | ✅ PASSED |
| `test_recommendations.py` | Rule-based engine & prioritized actions | ✅ PASSED |
| `test_scenarios.py` | Counterfactual affordability & balance simulation | ✅ PASSED |
| `test_subscription_detector.py` | Interval clustering, price creep & redundancy | ✅ PASSED |
| `test_autopilot_savings.py` | Safe sweep, 14-day horizon & 52-week backtesting | ✅ PASSED |
| `test_ingestion.py` | Plaid delta sync & ReBIT Account Aggregator | ✅ PASSED |
| `test_api.py` | FastAPI 12-endpoint REST service | ✅ PASSED |
| `test_ai_assistant.py` | 50-question golden AI assistant benchmark | ✅ PASSED |
| `test_full_pipeline.py` | End-to-end integration & inference pipeline | ✅ PASSED |

---

## Status

> **Phase:** 🚀 Production-Ready & Verified. All 7 Core Phases Completed (18/18 test suites passing, zero arithmetic hallucination, Vite frontend live).

