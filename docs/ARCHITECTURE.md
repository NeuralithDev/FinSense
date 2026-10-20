# FinSense System Architecture & Engineering Blueprint 🏛️

This document describes the high-level architecture, module decomposition, and data pipelines powering **FinSense**.

---

## 1. End-to-End System Pipeline

```mermaid
flowchart TD
    subgraph Data Layer
        A1[IBM Credit Card Logs\n2.3GB CSV / User0 Sample] --> B1[Data Ingestion & Cleaning\nsrc/data/data_cleaning.py]
        A2[PaySim Mobile Money\n493MB Cash-Flow Logs] --> B1
        A3[Cleaned Financial Profiles\nDemographics & Balances] --> B1
    end

    subgraph Feature Engineering
        B1 --> C1[Scale-Invariant Feature Pipeline\nsrc/data/feature_engineering.py]
        C1 --> C2[Financial Log Scaler\nsrc/preprocessing/scaling.py]
        C1 --> C3[Temporal Sliding Window Builder\nsrc/preprocessing/sequences.py]
        C1 --> C4[Peer Graph Builder\nsrc/preprocessing/graph_builder.py]
    end

    subgraph ML & Intelligence Core
        C3 --> D1[SpendingLSTM Forecaster\nsrc/models/lstm.py]
        C2 --> D2[FinancialAutoencoder\nsrc/models/autoencoder.py]
        C2 --> D3[AnomalyIsolationForest\nsrc/models/isolation_forest.py]
        C4 --> D4[FinancialGraphSAGE\nsrc/models/graphsage.py]
    end

    subgraph Fusion & Decision Engines
        D1 & D2 & D3 & D4 --> E1[FinancialStateEngine\nsrc/intelligence/financial_state.py]
        E1 --> F1[RecommendationEngine\nsrc/intelligence/recommendation_engine.py]
        E1 --> F2[LinUCB Contextual Bandit\nsrc/models/contextual_bandit.py]
        E1 --> F3[ScenarioEngine & Affordability\nsrc/scenarios/scenario_engine.py]
    end

    subgraph Application & Presentation Layer
        F1 & F2 & F3 --> G1[FastAPI Service\napp/]
        G1 --> G2[Interactive Web Dashboard / Mobile Client]
```

---

## 2. Component Directory Reference

```
FinSense/
├── docs/
│   ├── ALGORITHMS.md                # Mathematical formulations, loss functions & specs
│   ├── ARCHITECTURE.md              # System architecture & component data flows
│   └── PROJECT_LEARNING_NOTES.md    # Step-by-step walkthrough & defense Q&A
├── src/
│   ├── data/
│   │   ├── data_cleaning.py         # Cleaning & schema validation
│   │   ├── data_loader.py           # Streaming/batch dataset loaders
│   │   └── feature_engineering.py   # Ratios, shock multipliers, behavioral flags
│   ├── preprocessing/
│   │   ├── scaling.py               # FinancialLogScaler (log1p + standard/robust)
│   │   ├── sequences.py             # Temporal sliding windows & weekly aggregation
│   │   └── graph_builder.py         # Financial peer similarity graph construction
│   ├── models/
│   │   ├── lstm.py                  # SpendingLSTM forecaster with non-negative projection
│   │   ├── forecasting_baselines.py # Moving average, EWMA, Autoregressive Ridge
│   │   ├── autoencoder.py           # Deep Bottleneck Financial Autoencoder
│   │   ├── isolation_forest.py      # Isolation Forest & 2-Tier Consensus Ensemble
│   │   ├── contextual_bandit.py     # LinUCB, Thompson Sampling, Epsilon-Greedy
│   │   └── graphsage.py             # Inductive GraphSAGE GNN & Financial Twin discovery
│   ├── intelligence/
│   │   ├── financial_state.py       # 4-Pillar Financial Health Score (0–100) & Personas
│   │   ├── threshold_engine.py      # Empirical risk limits & concentration cutoffs
│   │   ├── recommendation_engine.py # Comprehensive rule-based action generation
│   │   ├── subscription_detector.py # Interval clustering, price creep & overlap detection
│   │   └── autopilot_savings.py     # Probabilistic safe sweep, horizon scaling & waterfall
│   ├── data/
│   │   ├── data_cleaning.py         # Cleaning & schema validation
│   │   ├── data_loader.py           # Streaming/batch dataset loaders
│   │   ├── feature_engineering.py   # Ratios, shock multipliers, behavioral flags
│   │   └── ingestion/               # Plaid & ReBIT Account Aggregator adapters & normalizer
│   ├── ai/
│   │   ├── intent_classifier.py     # 7 financial intents & disambiguation
│   │   ├── context_builder.py       # Ground-truth financial state compilation
│   │   ├── copilot_narrator.py      # Zero-arithmetic financial dialogue narrator
│   │   └── eval_benchmarks.py       # 50-question golden evaluation benchmark
│   ├── scenarios/
│   │   ├── affordability.py         # DTI loan approval & safe lump-sum purchase limits
│   │   └── scenario_engine.py       # Multi-month forward trajectory cash-flow simulation
│   └── evaluation/
│       ├── forecasting_metrics.py   # RMSE, MAE, MAPE, WAPE, Directional Accuracy
│       ├── anomaly_metrics.py       # Reconstruction stats, Jaccard consensus agreement
│       └── model_comparison.py      # Leaderboard generator & benchmarking suite
├── app/
│   ├── main.py                      # FastAPI entrypoint & router orchestration
│   ├── schemas.py                   # Canonical Pydantic API data models
│   ├── api/                         # 8 REST routers (health, forecast, subs, autopilot, etc.)
│   ├── services/                    # Thread-safe ModelRegistry service container
│   └── frontend/                    # Vite + React Executive Cockpit & Copilot Dashboard
├── scripts/
│   ├── run_all_tests.py             # Master test suite runner executing all 18 suites
│   ├── train_lstm.py                # Standalone LSTM training script
│   ├── build_model_ready_dataset.py # Pipeline building interim/processed features
│   └── compute_baseline_metrics.py  # Baseline benchmark execution script
└── tests/                           # 18 comprehensive pytest/unittest suites
```

---

## 3. The 5 Core Questions Answered by FinSense

1. **What happened to my money?**
   - Answered by `src/data/feature_engineering.py` & weekly category aggregation in `src/preprocessing/sequences.py`.
2. **Why is it happening?**
   - Answered by `FinancialStateEngine` (4 Pillars: Solvency, Leverage, Buffer, Discipline) + `Two-Tier Anomaly Ensemble`.
3. **What is likely to happen next?**
   - Answered by `SpendingLSTM` multi-category weekly spending forecasts.
4. **What should I do?**
   - Answered by `RecommendationEngine` prioritized expert rules + `LinUCB` contextual bandit personalization.
5. **What if I make a different decision?**
   - Answered by `ScenarioEngine` & `AffordabilityEngine` forward-looking simulations.
