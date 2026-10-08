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

## Running the Pipeline (once implemented)

```bash
# Build feature matrix
python scripts/build_features.py

# Train forecasting models
python scripts/train_models.py --model spending

# Evaluate
python scripts/evaluate_models.py

# Run full pipeline
python scripts/run_pipeline.py

# Start API
uvicorn app.main:app --reload --port 8000
```

---

## Tests

```bash
pytest tests/ -v
# All tests skip until the corresponding src/ modules are implemented
```

---

## Documentation

| File | Contents |
|---|---|
| `docs/ARCHITECTURE.md` | System diagram, module responsibilities, data flow |
| `docs/DATA_NOTES.md` | Dataset details, column notes, known issues |
| `docs/FEATURE_CATALOG.md` | All features, sources, descriptions |
| `docs/MODEL_CARD.md` | Model details, metrics, training status |
| `docs/PROJECT_LEARNING_NOTES.md` | Design rationale, open questions, milestones |

---

## Status

> **Phase:** Skeleton — `src/` modules raise `NotImplementedError` until implemented notebook-by-notebook.
