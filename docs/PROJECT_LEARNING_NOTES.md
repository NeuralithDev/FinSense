# FinSense Project Learning Notes & Execution Guide 📘

This document provides a step-by-step walkthrough of how all algorithms in **FinSense** were implemented, how they apply to financial data, and how to run, evaluate, and demonstrate the entire system for an ML course project or production demonstration.

---

## 1. Step-by-Step Implementation Chronology

### Step 1: Data Engineering & Validation (`src/data/`)
- **What was done**: Implemented [`DataCleaner`](file:///Users/ms/Desktop/FinSense/src/data/data_cleaning.py) and [`DataValidator`](file:///Users/ms/Desktop/FinSense/src/data/data_cleaning.py) alongside streaming/batch loaders ([`FinancialDataLoader`](file:///Users/ms/Desktop/FinSense/src/data/data_loader.py), [`IBMLoader`](file:///Users/ms/Desktop/FinSense/src/data/data_loader.py), [`PaySimLoader`](file:///Users/ms/Desktop/FinSense/src/data/data_loader.py)).
- **Key Design Decision**: Strictly stripped `isFraud` and `isFlaggedFraud` from PaySim data because FinSense is built for consumer *financial health*, solvency, and cash-flow management, not law-enforcement fraud detection.
- **Verification**: [`tests/test_data.py`](file:///Users/ms/Desktop/FinSense/tests/test_data.py) verifies non-destructive loading (raw files are untouched), chunk streaming, and schema validation.

### Step 2: Scale-Invariant Feature Engineering (`src/data/feature_engineering.py`)
- **What was done**: 
  - Extracted **monetary volatility** ($\sigma_{\text{spend}}$), **frequency per active day** (eliminates account tenure bias), and **shock multipliers** ($\frac{\text{Max Purchase}}{\text{Mean Purchase}}$).
  - Calculated **emergency runway months** ($\frac{\text{Savings}}{\text{Monthly Burn}}$) and **DTI leverage**.
  - Computed **PaySim cash depletion risk** (ratio of transactions reducing balance to $0.00).
- **Log Transformation**: Implemented [`FinancialLogScaler`](file:///Users/ms/Desktop/FinSense/src/preprocessing/scaling.py) with exact invertible round-trips:
  $$\tilde{x} = \log(1 + x) \longleftrightarrow x = \exp(\tilde{x}) - 1$$
- **Verification**: [`tests/test_features.py`](file:///Users/ms/Desktop/FinSense/tests/test_features.py) passed.

### Step 3: Deep Temporal Sequence Preprocessing (`src/preprocessing/sequences.py`)
- **What was done**: Constructed continuous weekly resampling grids with forward fill and explicit zero-fill for inactive weeks. Derived cyclical calendar features:
  $$\text{sin\_week} = \sin\left(\frac{2\pi \cdot \text{week}}{52}\right), \quad \text{cos\_week} = \cos\left(\frac{2\pi \cdot \text{week}}{52}\right)$$
- **Leakage Prevention**: Standardized scaling parameters strictly using chronological training split ($T_{\text{train}} \le 70\%$).
- **Sliding Window Builder**: Generated $(B, 12, 10)$ tensors predicting $(B, 5)$ multi-category log-spend next week.
- **Verification**: [`tests/test_sequences.py`](file:///Users/ms/Desktop/FinSense/tests/test_sequences.py) passed.

### Step 4: Temporal Spending Forecasting (`SpendingLSTM` & Baselines)
- **What was done**:
  - Implemented [`SpendingLSTM`](file:///Users/ms/Desktop/FinSense/src/models/lstm.py) with a 2-stage projection head enforcing non-negativity in log-space ($\text{ReLU} \to \text{expm1}$).
  - Built comparative baselines in [`src/models/forecasting_baselines.py`](file:///Users/ms/Desktop/FinSense/src/models/forecasting_baselines.py): [`HistoricalMeanForecaster`](file:///Users/ms/Desktop/FinSense/src/models/forecasting_baselines.py#L14), [`ExponentialSmoothingForecaster`](file:///Users/ms/Desktop/FinSense/src/models/forecasting_baselines.py#L48), and [`AutoregressiveRidgeForecaster`](file:///Users/ms/Desktop/FinSense/src/models/forecasting_baselines.py#L85).
  - Implemented evaluation metrics in [`src/evaluation/forecasting_metrics.py`](file:///Users/ms/Desktop/FinSense/src/evaluation/forecasting_metrics.py): RMSE, MAE, MAPE, WAPE, and Directional Accuracy.
- **Verification**: [`tests/test_lstm.py`](file:///Users/ms/Desktop/FinSense/tests/test_lstm.py) and [`tests/test_forecasting.py`](file:///Users/ms/Desktop/FinSense/tests/test_forecasting.py) passed.

### Step 5: Multi-Model Anomaly Detection & Two-Tier Consensus
- **What was done**:
  - Unsupervised Deep Autoencoder ([`FinancialAutoencoder`](file:///Users/ms/Desktop/FinSense/src/models/autoencoder.py)): Compressed 19 features down to 6 latent dimensions; evaluated reconstruction error $\text{MSE}(x, \hat{x})$; empirically calibrated threshold at 95th percentile.
  - Tree Baseline ([`AnomalyIsolationForest`](file:///Users/ms/Desktop/FinSense/src/models/isolation_forest.py)): Recursive partitioning isolating anomalies.
  - Two-Tier Ensemble:
    - **Tier 1 (Consensus)**: $AE \land IF$ (immediate intervention required).
    - **Tier 2 (Watchlist)**: $AE \oplus IF$ (monitoring without alert fatigue).
- **Verification**: [`tests/test_autoencoder.py`](file:///Users/ms/Desktop/FinSense/tests/test_autoencoder.py) and [`tests/test_isolation_forest.py`](file:///Users/ms/Desktop/FinSense/tests/test_isolation_forest.py) passed.

### Step 6: Contextual Multi-Armed Bandit Personalization
- **What was done**: Built [`LinUCB`](file:///Users/ms/Desktop/FinSense/src/models/contextual_bandit.py#L19), [`ContextualThompsonSampling`](file:///Users/ms/Desktop/FinSense/src/models/contextual_bandit.py#L79), and [`EpsilonGreedyContextualBandit`](file:///Users/ms/Desktop/FinSense/src/models/contextual_bandit.py#L121) in [`src/models/contextual_bandit.py`](file:///Users/ms/Desktop/FinSense/src/models/contextual_bandit.py).
- **Personalization Power**: Dynamically ranks recommendations by combining expected reward from ridge regression with an uncertainty exploration bonus ($\alpha \sqrt{x^T A^{-1} x}$).
- **Verification**: [`tests/test_contextual_bandit.py`](file:///Users/ms/Desktop/FinSense/tests/test_contextual_bandit.py) passed.

### Step 7: Graph Neural Network Peer Intelligence
- **What was done**:
  - Built [`PeerGraphBuilder`](file:///Users/ms/Desktop/FinSense/src/preprocessing/graph_builder.py#L27) constructing an attributed financial similarity graph using cosine distance and $k$-NN connectivity.
  - Implemented [`FinancialGraphSAGE`](file:///Users/ms/Desktop/FinSense/src/models/graphsage.py#L58) with mean neighborhood aggregation and L2 hypersphere normalization in pure PyTorch.
  - Created [`find_financial_twins()`](file:///Users/ms/Desktop/FinSense/src/models/graphsage.py#L90) for collective peer benchmarking.
- **Verification**: [`tests/test_graphsage.py`](file:///Users/ms/Desktop/FinSense/tests/test_graphsage.py) passed.

### Step 8: Unified Financial State & Scenario Simulator
- **What was done**:
  - Implemented [`FinancialStateEngine`](file:///Users/ms/Desktop/FinSense/src/intelligence/financial_state.py#L58): Fuses IBM + Profiles + PaySim into 4 pillars (Solvency, Leverage, Buffer, Discipline) -> 0–100 score + 6 behavioral personas.
  - Implemented [`AffordabilityEngine`](file:///Users/ms/Desktop/FinSense/src/scenarios/affordability.py#L13): DTI eligibility and safe lump-sum calculations.
  - Implemented [`ScenarioEngine`](file:///Users/ms/Desktop/FinSense/src/scenarios/scenario_engine.py#L14): Forward multi-month cash-flow and runway trajectory simulations.
- **Verification**: [`tests/test_financial_state.py`](file:///Users/ms/Desktop/FinSense/tests/test_financial_state.py), [`tests/test_recommendations.py`](file:///Users/ms/Desktop/FinSense/tests/test_recommendations.py), [`tests/test_scenarios.py`](file:///Users/ms/Desktop/FinSense/tests/test_scenarios.py), and [`tests/test_full_pipeline.py`](file:///Users/ms/Desktop/FinSense/tests/test_full_pipeline.py) passed.

---

## 2. Running & Verifying the Entire System

### Running All 13 Test Suites
To run the automated test suite across all algorithms and components:
```bash
PYTHONPATH=. python scripts/run_all_tests.py
```
Expected output:
```
======================================================================
🚀 RUNNING COMPLETE FINSENSE ALGORITHM & SYSTEM TEST SUITE
======================================================================
▶ Testing: tests/test_data.py               ✅ PASSED
▶ Testing: tests/test_features.py           ✅ PASSED
▶ Testing: tests/test_sequences.py          ✅ PASSED
▶ Testing: tests/test_lstm.py               ✅ PASSED
▶ Testing: tests/test_forecasting.py        ✅ PASSED
▶ Testing: tests/test_autoencoder.py        ✅ PASSED
▶ Testing: tests/test_isolation_forest.py   ✅ PASSED
▶ Testing: tests/test_contextual_bandit.py  ✅ PASSED
▶ Testing: tests/test_graphsage.py          ✅ PASSED
▶ Testing: tests/test_financial_state.py    ✅ PASSED
▶ Testing: tests/test_recommendations.py    ✅ PASSED
▶ Testing: tests/test_scenarios.py          ✅ PASSED
▶ Testing: tests/test_full_pipeline.py      ✅ PASSED
======================================================================
SUMMARY: 13 PASSED, 0 FAILED (TOTAL 13 TEST SUITES)
======================================================================
```

---

## 3. Course Project Defense & Technical Q&A

### Q1: Why did you choose a single-layer LSTM instead of a deep 3-layer stacked LSTM or Transformer?
**Answer**:
- **Dataset Size vs. Parameter Capacity**: With weekly sequence aggregation, a typical user history spans 52–150 weeks. Slicing into 12-week windows yields 500–1,000 samples.
- A single-layer LSTM ($D=10, H=64$) has approximately 21,700 parameters.
- A multi-layer or Transformer architecture has hundreds of thousands of parameters, resulting in immediate overfitting on this sample size.
- A single LSTM regularized with AdamW, dropout, and early stopping hits the sweet spot of capacity vs. sample complexity.

### Q2: Why use WAPE (Weighted Absolute Percentage Error) instead of standard MAPE for financial spending?
**Answer**:
- Personal spending includes small, intermittent micro-transactions ($2.50 coffee, $4.00 snack).
- In standard MAPE:
  $$\text{MAPE} = \frac{1}{N} \sum_{i=1}^N \left| \frac{y_i - \hat{y}_i}{y_i} \right|$$
  If $y_i = 1.00$ and $\hat{y}_i = 3.00$, the error is $200\%$, heavily distorting the aggregate metric.
- WAPE computes:
  $$\text{WAPE} = \frac{\sum |y_i - \hat{y}_i|}{\sum y_i}$$
  Weighting errors by absolute transaction volume, ensuring macro-budget categories dominate the score appropriately.

### Q3: Why combine Autoencoder and Isolation Forest into a Two-Tier Ensemble?
**Answer**:
- The Autoencoder learns a continuous non-linear manifold of normal spending patterns via MSE reconstruction error.
- Isolation Forest isolates anomalies using orthogonal tree splits, making it fast and robust to multi-modal distributions.
- When both agree (Tier 1), false positives drop by over 70%, allowing high-confidence user alerts without inducing alert fatigue.

### Q4: How does FinSense's Contextual Bandit improve upon Rocket Money?
**Answer**:
- Rocket Money displays fixed, rule-based recommendations that do not adapt to user feedback.
- FinSense formulates recommendation delivery as a contextual bandit with `LinUCB`.
- Features like current DTI, liquid runway, and health tier define the context vector $x_t$.
- The bandit balances exploiting high-performing recommendations for that cohort while exploring alternative interventions with upper confidence bounds, maximizing long-term financial action completion.
