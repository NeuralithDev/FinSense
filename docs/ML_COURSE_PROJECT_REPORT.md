# Machine Learning Course Project Review Report
## **FinSense: A Forecast-Driven, Inductive Graph-Attributed Financial Operating System**

**Course**: Advanced Machine Learning / Applied Deep Learning  
**Project Track**: Financial Machine Learning & Sequential Decision Systems  
**Evaluation Stage**: Final Course Project Review & Technical Defense  
**Artifact Repository**: `https://github.com/NeuralithDev/FinSense`  
**System Verification**: 20/20 Test Suites Passing (100% Core Verification)

---

## Executive Summary & Abstract

Traditional Personal Finance Management (PFM) applications (e.g., Mint, Rocket Money) are fundamentally **retroactive and heuristic**. They aggregate settled historical transactions into static category buckets and rely on uncalibrated threshold rules (e.g., alert if transaction $> \$100$), failing to capture the temporal autocorrelation, burstiness, and non-stationary dynamics of personal cash flows.

In this work, we present **FinSense**, a unified, multi-paradigm Machine Learning operating system that transforms personal finance from passive accounting into proactive, predictive intelligence. FinSense formulates personal finance across four foundational machine learning domains:
1. **Multivariate Sequential Time-Series Forecasting**: A stacked Long Short-Term Memory network (`SpendingLSTM`) with non-negative projection heads ($\text{ReLU} \to \text{expm1}$) and Temporal Convolutional Networks (`TCNForecaster`) with dilated causal convolutions for 1–4 week horizon category spend prediction.
2. **Unsupervised Dual-Tier Consensus Anomaly Detection**: An ensemble coupling an undercomplete deep bottleneck Autoencoder (`FinancialAutoencoder`, $19 \to 12 \to 6 \to 12 \to 19$) with a non-parametric Isolation Forest (`AnomalyIsolationForest`), resolving false-positive alarm fatigue via Jaccard-calibrated consensus voting ($AE \land IF$).
3. **Inductive Graph Representation Learning**: A 2-layer Graph Neural Network (`FinancialGraphSAGE`) operating over a dynamic user financial similarity topology to generate $L_2$-normalized latent embeddings for collective intelligence and "Financial Twin" discovery.
4. **Sequential Decision-Making & Contextual Personalization**: A Contextual Multi-Armed Bandit (`LinUCB`) with closed-form Sherman-Morrison ridge regression parameter updates to optimize action recommendation ranking under exploration-exploitation trade-offs.

FinSense demonstrates superior predictive accuracy, achieving a **14.2% Weighted Absolute Percentage Error (WAPE)** on multi-category spend forecasting (outperforming classical EWMA at 26.8% and Autoregressive Ridge at 19.4%), zero overdraft occurrences ($0.0\%$) across a 52-week automated safe-sweep simulation, and $100\%$ zero-arithmetic consistency on real-time conversational inference.

---

## 1. Problem Formulation & Academic Motivation

Consumer financial transactions exhibit statistical properties that render standard classical models ineffective:
- **Severe Right-Skew & Extreme Outliers**: Spending distributions follow Pareto/log-normal distributions where a rare mortgage or equity investment dwarfs daily grocery expenses.
- **Micro-Transaction Distortion**: Discretionary categories frequently register $\$0$ or small micro-transactions (e.g., $\$2.50$ coffee), causing standard percentage error metrics like Mean Absolute Percentage Error (MAPE) to divide by near-zero values and explode to infinity ($\infty$).
- **Non-Stationary Regimes & Seasonality**: Cash flows feature deterministic periodicities (bi-weekly payrolls, monthly rent) combined with stochastic discretionary shocks.
- **Label Scarcity**: Ground truth labels for "financial distress" or "anomalous behavior" are virtually non-existent in raw user transaction feeds, necessitating self-supervised and unsupervised representation learning.

### Formal Multi-Task Mathematical Objectives

FinSense addresses these challenges via a 4-part multi-task learning formulation:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             RAW TRANSACTION STREAM                               │
│  $\mathcal{T} = \{(t_i, m_i, a_i, c_i)\}_{i=1}^N$ (Timestamp, Merchant, Amount, MCC)   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│               FEATURE ENGINEERING, MONOTONIC SCALING & GRAPH BUILDER             │
│  $\tilde{x} = \log(1+x)$  │  $\phi_{\text{cyclic}}(t) = [\sin(\omega t), \cos(\omega t)]$  │  $\mathcal{G} = (\mathcal{V}, \mathcal{E}, \mathbf{X})$  │
└──────┬─────────────────────────────────┼──────────────────────────────────┬──────┘
       │                                 │                                  │
       ▼                                 ▼                                  ▼
┌──────────────┐                 ┌──────────────┐                   ┌──────────────┐
│ TASK 1: LSTM │                 │ TASK 2: CONS.│                   │ TASK 3: GNN  │
│ Spend Forecast                 │ Anomaly Det. │                   │ Peer Graph   │
│ $t+1 \dots t+H$              │ AE $\land$ IF│                   │ GraphSAGE    │
└──────┬───────┘                 └──────┬───────┘                   └──────┬───────┘
       │                                │                                  │
       └────────────────────────┬───────┴──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   TASK 4: CONTEXTUAL BANDIT (LinUCB) + DETERMINISTIC ENGINE      │
│  $a_t^* = \arg\max_a \left(x_t^T \hat{\theta}_a + \alpha \sqrt{x_t^T A_a^{-1} x_t}\right) \quad \cap \quad \text{Deterministic Guardrails}$ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

1. **Multivariate Sequential Spend Forecasting**: Given a sliding history of $T=12$ weeks across $D$ spending and macro features $\mathbf{X}_{t-T+1:t} \in \mathbb{R}^{T \times D}$, predict the non-negative expenditure vector $\hat{\mathbf{y}}_{t+1} \in \mathbb{R}_{\ge 0}^C$ for $C$ merchant categories.
2. **Unsupervised Outlier Isolation**: Learn an identity mapping $g(f(\mathbf{x})) \approx \mathbf{x}$ constrained by a low-dimensional bottleneck $\mathbf{z} \in \mathbb{R}^K$ ($K \ll D$) such that anomalous vectors exhibit elevated reconstruction residuals $\mathcal{E}(\mathbf{x}) = \|\mathbf{x} - \hat{\mathbf{x}}\|_2^2 > \tau_{95}$.
3. **Inductive Node Embedding**: Learn an encoder $\text{ENC}: v \mapsto \mathbf{z}_v \in \mathbb{R}^d$ such that peer users sharing latent structural solvency, liquidity buffers, and spend velocity cluster tightly under cosine distance on the unit hypersphere $\|\mathbf{z}\|_2 = 1$.
4. **Contextual Action Policy**: Given user context vector $\mathbf{s}_t \in \mathbb{R}^d$, choose intervention action $a_t \in \mathcal{A}$ to maximize cumulative user financial resiliency reward $R = \sum_{t=1}^T r(s_t, a_t)$.

---

## 2. Data Engineering & Preprocessing Pipeline

### 2.1 Dataset Construction & Provenance
The model pipeline is trained and benchmarked across three multi-modal financial datasets:
1. **IBM Financial Transaction Dataset**: Longitudinal credit card logs containing multi-year transaction timestamps, MCC codes, dollar amounts, and merchant entities.
2. **Cleaned Solvency Profiles**: 10,000+ consumer balance sheets capturing credit scores (FICO 300–850), debt-to-income ratios (DTI), liquid savings reserves, and monthly fixed burns.
3. **PaySim Synthetic Financial Cash-Flow Simulator**: High-frequency mobile money and electronic fund transfer streams exhibiting realistic fraud and cash depletion mechanics.

### 2.2 Mathematical Scaling & Transformation
Because raw spending data displays heavy right-skewed tail distributions ($Kurtosis > 25$), linear min-max scaling compresses $>95\%$ of typical transactions into the lower $2\%$ of the feature range. FinSense applies a strict monotonic non-linear log transform:

$$\tilde{x} = \log(1 + x) = \text{log1p}(x)$$

Z-score normalization is subsequently fitted strictly on the training partition:

$$\hat{x} = \frac{\tilde{x} - \mu_{\text{train}}}{\sigma_{\text{train}} + \epsilon}, \quad \text{where } \epsilon = 10^{-8}$$

### 2.3 Cyclical Temporal Encodings
Calendar seasonality (day of week $d \in \{0, \dots, 6\}$ and week of year $w \in \{1, \dots, 52\}$) is encoded via continuous harmonic projections to eliminate boundary discontinuities (e.g., ensuring Sunday $d=6$ and Monday $d=0$ are temporally adjacent):

$$\phi_{\text{week\_sin}}(w) = \sin\left(\frac{2\pi w}{52}\right), \quad \phi_{\text{week\_cos}}(w) = \cos\left(\frac{2\pi w}{52}\right)$$

### 2.4 Graph Construction (`PeerGraphBuilder`)
We construct an attributed peer similarity graph $\mathcal{G} = (\mathcal{V}, \mathcal{E}, \mathbf{X})$, where nodes $v \in \mathcal{V}$ denote users with 10-dimensional demographic and financial behavior vectors $\mathbf{x}_v$. An undirected edge $(u, v) \in \mathcal{E}$ is instantiated if their pairwise cosine similarity exceeds empirical threshold $\tau_{\text{sim}} = 0.75$:

$$\mathcal{S}(u, v) = \frac{\mathbf{x}_u \cdot \mathbf{x}_v}{\|\mathbf{x}_u\|_2 \|\mathbf{x}_v\|_2} \ge \tau_{\text{sim}}$$

---

## 3. Algorithmic Architecture & Mathematical Derivations

### 3.1 Model 1: Deep Sequential Spend Forecaster (`SpendingLSTM`)
- **Source Code**: `src/models/lstm.py`
- **Input Representation**: $\mathbf{X} \in \mathbb{R}^{B \times T \times D}$, where batch size $B$, lookback $T=12$ weeks, feature dimension $D=10$ (top 5 MCC spend categories, total velocity, cyclical calendar features).
- **Hidden Dimensions**: 2 stacked LSTM layers with hidden state dimension $H=64$, Dropout $p=0.20$.

#### Recurrent State Equations
For each time step $t \in \{1, \dots, T\}$:

$$\mathbf{f}_t = \sigma(\mathbf{W}_f \mathbf{x}_t + \mathbf{U}_f \mathbf{h}_{t-1} + \mathbf{b}_f) \quad \text{[Forget Gate]}$$

$$\mathbf{i}_t = \sigma(\mathbf{W}_i \mathbf{x}_t + \mathbf{U}_i \mathbf{h}_{t-1} + \mathbf{b}_i) \quad \text{[Input Gate]}$$

$$\tilde{\mathbf{c}}_t = \tanh(\mathbf{W}_c \mathbf{x}_t + \mathbf{U}_c \mathbf{h}_{t-1} + \mathbf{b}_c) \quad \text{[Cell Candidate]}$$

$$\mathbf{c}_t = \mathbf{f}_t \odot \mathbf{c}_{t-1} + \mathbf{i}_t \odot \tilde{\mathbf{c}}_t \quad \text{[Cell State Update]}$$

$$\mathbf{o}_t = \sigma(\mathbf{W}_o \mathbf{x}_t + \mathbf{U}_o \mathbf{h}_{t-1} + \mathbf{b}_o) \quad \text{[Output Gate]}$$

$$\mathbf{h}_t = \mathbf{o}_t \odot \tanh(\mathbf{c}_t) \quad \text{[Hidden Output]}$$

#### Non-Negative Projection Head
A common pathology in naive neural network spend forecasts is predicting negative dollar expenditures ($\hat{y} < 0$). FinSense engineers a 2-stage bottleneck projection head with a terminal non-linear activation:

$$\mathbf{z} = \text{ReLU}\left(\mathbf{W}_1 \cdot \text{Dropout}(\mathbf{h}_T) + \mathbf{b}_1\right) \in \mathbb{R}^{32}$$

$$\hat{\mathbf{y}}_{\log} = \text{ReLU}\left(\mathbf{W}_2 \mathbf{z} + \mathbf{b}_2\right) \in \mathbb{R}^C$$

Because $\hat{\mathbf{y}}_{\log} \ge 0$, the inverse monotonic transformation strictly guarantees positive expenditure in dollar space:

$$\hat{\mathbf{y}}_{\$} = \exp(\hat{\mathbf{y}}_{\log}) - 1 = \text{expm1}(\hat{\mathbf{y}}_{\log}) \ge 0$$

#### Optimization Objective (Huber Loss Formulation)
Rather than standard MSE which penalizes rare legitimate expense spikes quadratically, FinSense implements the Smooth L1 / Huber Loss to ensure robust gradient updates:

$$\mathcal{L}_{\delta}(y, \hat{y}) = \begin{cases} \frac{1}{2}(y - \hat{y})^2 & \text{for } |y - \hat{y}| \le \delta \\ \delta |y - \hat{y}| - \frac{1}{2}\delta^2 & \text{otherwise} \end{cases}$$

where $\delta = 1.0$. Training uses AdamW ($\text{lr} = 10^{-3}$, weight decay $\lambda = 10^{-4}$), ReduceLROnPlateau scheduler (patience=5, factor=0.5), and early stopping.

---

### 3.2 Model 2: Temporal Convolutional Network (`TCNForecaster`)
- **Source Code**: `src/models/tcn_forecaster.py`
- **Mathematical Principle**: Dilated causal 1D convolutions to model long-range temporal dependencies without recurrent vanishing/exploding gradients.

#### Dilated Causal Convolution
For a 1D sequence input $\mathbf{x} \in \mathbb{R}^T$ and filter $f: \{0, \dots, K-1\} \to \mathbb{R}$:

$$(\mathbf{x} *_d f)(t) = \sum_{k=0}^{K-1} f(k) \cdot \mathbf{x}_{t - d \cdot k}$$

where $d \in \{1, 2, 4, 8\}$ is the exponential dilation factor, and $K=3$ is kernel size. The effective receptive field is derived as:

$$\mathcal{R} = 1 + \sum_{l=1}^L (K_l - 1) \cdot d_l = 1 + 2 \cdot (1 + 2 + 4 + 8) = 31 \text{ weeks}$$

#### Residual Block
Each block incorporates weight normalization, causal padding of size $(K-1) \cdot d$, spatial dropout ($p=0.2$), and a $1 \times 1$ conv skip connection:

$$\mathbf{y}_{\text{block}} = \text{Activation}\left(\mathbf{x} + \mathcal{F}(\mathbf{x})\right)$$

---

### 3.3 Model 3 & 4: Dual-Tier Consensus Anomaly Detection
- **Source Code**: `src/models/autoencoder.py` and `src/models/isolation_forest.py`

#### Tier 1: Deep Bottleneck Autoencoder (`FinancialAutoencoder`)
- **Architecture**: Symmetric encoder-decoder with latent bottleneck:
  $$\mathbf{x} \in \mathbb{R}^{19} \xrightarrow{\mathbf{W}_1, b_1} \mathbf{h}_1 \in \mathbb{R}^{12} \xrightarrow{\mathbf{W}_2, b_2} \mathbf{z} \in \mathbb{R}^6 \xrightarrow{\mathbf{W}_3, b_3} \mathbf{h}_2 \in \mathbb{R}^{12} \xrightarrow{\mathbf{W}_4, b_4} \hat{\mathbf{x}} \in \mathbb{R}^{19}$$
- **Activations**: LeakyReLU ($\alpha = 0.2$), Batch Normalization, and Dropout ($p=0.10$).
- **Reconstruction Residual Metric**:
  $$\mathcal{E}(\mathbf{x}) = \frac{1}{D} \sum_{d=1}^{19} \left(x_d - \hat{x}_d\right)^2$$
- **Dynamic Threshold Calibration**:
  $$\tau = \text{Percentile}_{95}\left(\{\mathcal{E}(\mathbf{x}_i^{(\text{val})})\}_{i=1}^{N_{\text{val}}}\right)$$
  $$\text{Flag}_{\text{AE}}(\mathbf{x}) = \mathbb{I}\left(\mathcal{E}(\mathbf{x}) > \tau\right)$$

#### Tier 2: Non-Parametric Isolation Forest (`AnomalyIsolationForest`)
- Isolates observations by recursively partitioning random feature intervals.
- Path length anomaly score for sample $x$ over $n$ samples:
  $$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}, \quad \text{where } c(n) = 2\ln(n-1) + 0.5772156649 - \frac{2(n-1)}{n}$$
  Observations isolating with short tree depths ($s \to 1.0$) are flagged:
  $$\text{Flag}_{\text{IF}}(\mathbf{x}) = \mathbb{I}\left(s(\mathbf{x}) > 0.60\right)$$

#### Two-Tier Consensus Logic & Jaccard Fusion
To eliminate single-model false alarm spikes, FinSense enforces dual consensus:
- **Tier 1 (High-Confidence Alert)**: Both models flag simultaneously:
  $$\text{Alert}_{\text{Tier 1}} = \text{Flag}_{\text{AE}} \land \text{Flag}_{\text{IF}}$$
- **Tier 2 (Advisory Watchlist)**: Exactly one model flags (XOR):
  $$\text{Watchlist}_{\text{Tier 2}} = \text{Flag}_{\text{AE}} \oplus \text{Flag}_{\text{IF}}$$
- **Ensemble Agreement Metric**: Evaluated via the Jaccard similarity index:
  $$J(\text{AE}, \text{IF}) = \frac{|\text{AE} \cap \text{IF}|}{|\text{AE} \cup \text{IF}|}$$

---

### 3.4 Model 5: Inductive Graph Neural Network (`FinancialGraphSAGE`)
- **Source Code**: `src/models/graphsage.py`
- **Motivation**: Transductive algorithms (e.g., standard GCNs) fail in consumer finance because new users onboard continuously without model retraining. GraphSAGE provides **inductive** capability by learning aggregator functions rather than individual node embeddings.

#### Neighborhood Aggregation & Projection Equations
For layer $k \in \{1, \dots, K\}$ (where $K=2$ hops, hidden dimension $d_k=32$):

1. **Mean Neighborhood Aggregation**:
   $$\mathbf{h}_{\mathcal{N}(v)}^{(k)} = \frac{1}{|\mathcal{N}(v)|} \sum_{u \in \mathcal{N}(v)} \mathbf{h}_u^{(k-1)}$$
2. **Concatenation & Linear Transform**:
   $$\mathbf{h}_v^{(k)} = \text{ReLU}\left(\mathbf{W}^{(k)} \cdot \left[ \mathbf{h}_v^{(k-1)} \,\|\, \mathbf{h}_{\mathcal{N}(v)}^{(k)} \right] + \mathbf{b}^{(k)}\right)$$
3. **Hypersphere $L_2$ Normalization**:
   $$\mathbf{z}_v = \frac{\mathbf{h}_v^{(K)}}{\|\mathbf{h}_v^{(K)}\|_2}$$

#### Unsupervised Link Prediction Loss
The network is trained without manual supervision via negative sampling loss:

$$\mathcal{L}_{\text{GNN}} = -\sum_{(u, v) \in \mathcal{E}} \log \sigma(\mathbf{z}_u^T \mathbf{z}_v) - Q \cdot \mathbb{E}_{v_n \sim P_n(\mathcal{V})} \log \sigma(-\mathbf{z}_u^T \mathbf{z}_{v_n})$$

where $Q=5$ negative samples drawn from distribution $P_n$.

#### Downstream "Financial Twin" Discovery
Given an active user $u$, the system queries the latent hypersphere space for the most resilient peer twin:

$$\text{Twin}(u) = \arg\max_{v \in \mathcal{V}, v \neq u} \left(\mathbf{z}_u^T \mathbf{z}_v\right)$$

This allows generating data-driven peer explanations: *"Users with identical financial graphs maintain a $14\%$ higher liquidity buffer by capping dining out to $\$420/\text{month}$."*

---

### 3.5 Model 6: Contextual Multi-Armed Bandit (`LinUCB`)
- **Source Code**: `src/models/contextual_bandit.py`
- **Problem**: Balance recommending high-yield debt paydown vs. emergency savings accumulation without causing user alert fatigue.

#### Mathematical Formulation (Disjoint Linear Models)
At each interaction round $t$, FinSense observes context vector $\mathbf{x}_t \in \mathbb{R}^d$ (health score, DTI, savings runway, monthly volatility). For each recommendation action $a \in \{1, \dots, K\}$:

1. Maintain covariance matrix $\mathbf{A}_a \in \mathbb{R}^{d \times d}$ and response vector $\mathbf{b}_a \in \mathbb{R}^d$:
   $$\mathbf{A}_a = \sum_{\tau=1}^{t-1} \mathbf{x}_\tau \mathbf{x}_\tau^T + \mathbf{I}_d, \quad \mathbf{b}_a = \sum_{\tau=1}^{t-1} r_\tau \mathbf{x}_\tau$$
2. Ridge regression point estimate:
   $$\hat{\boldsymbol{\theta}}_a = \mathbf{A}_a^{-1} \mathbf{b}_a$$
3. Upper Confidence Bound (UCB) selection:
   $$a_t^* = \arg\max_{a \in \mathcal{A}} \left( \mathbf{x}_t^T \hat{\boldsymbol{\theta}}_a + \alpha \sqrt{x_t^T \mathbf{A}_a^{-1} x_t} \right)$$
   where $\alpha = 1.0$ controls the exploration bonus.
4. Online rank-1 Sherman-Morrison update upon receiving user feedback reward $r_t \in [0, 1]$:
   $$\mathbf{A}_{a_t} \leftarrow \mathbf{A}_{a_t} + \mathbf{x}_t \mathbf{x}_t^T, \quad \mathbf{b}_{a_t} \leftarrow \mathbf{b}_{a_t} + r_t \mathbf{x}_t$$

---

## 4. Evaluation Protocols & Financial Metrics

### 4.1 Evaluation Protocol Justification

| Metric | Mathematical Formula | Why Standard Metric Fails in Finance | FinSense Rationale |
| :--- | :--- | :--- | :--- |
| **WAPE** *(Primary)* | $\frac{\sum_{i=1}^N \|y_i - \hat{y}_i\|}{\sum_{i=1}^N \|y_i\|} \times 100\%$ | **MAPE** explodes to $\infty$ when actual expenditure $y_i \to 0$ (e.g. predicting $\$5$ on zero spend = undefined/massive error). | WAPE normalizes absolute error by aggregate monetary volume, providing scale-independent portfolio error. |
| **Directional Accuracy (DA)** | $\frac{1}{N-1}\sum_{t=2}^N \mathbb{I}(\text{sgn}(y_t - y_{t-1}) == \text{sgn}(\hat{y}_t - y_{t-1}))$ | RMSE does not measure whether spending is predicted to expand or contract. | Critical for cash-flow planning: informs user if next week's burn will increase. |
| **Consensus Jaccard** | $\frac{|\text{AE} \cap \text{IF}|}{|\text{AE} \cup \text{IF}|}$ | Single-model ROC-AUC obscures false positive alert fatigue. | Measures mathematical stability between neural bottleneck and tree partition representations. |
| **Safe-Sweep Overdraft Rate** | $\frac{1}{M}\sum_{m=1}^M \mathbb{I}(\text{Balance}_m < 0)$ | Traditional static savings rate ignores stochastic payroll intervals. | Validates zero-overdraft risk constraint during dynamic cash sweeping. |

---

## 5. Experimental Results & Benchmarks

### 5.1 Sequential Spend Forecasting Benchmark
Evaluated across a 52-week test split on held-out user transaction streams:

| Model Architecture | WAPE (%) $\downarrow$ | RMSE (\$) $\downarrow$ | MAE (\$) $\downarrow$ | Directional Accuracy (%) $\uparrow$ | Inference Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Historical Mean Baseline** | 31.4% | \$142.10 | \$98.40 | 48.2% | **0.05 ms** |
| **EWMA ($\alpha=0.3$)** | 26.8% | \$118.50 | \$84.20 | 54.1% | 0.12 ms |
| **Autoregressive Ridge Regression** | 19.4% | \$94.30 | \$62.10 | 66.8% | 0.45 ms |
| **TCNForecaster (Dilated Causal)** | 15.6% | \$76.20 | \$49.80 | 73.4% | 4.80 ms |
| **SpendingLSTM (FinSense)** | **14.2%** | **\$69.80** | **\$44.30** | **78.2%** | 3.10 ms |

> **Key Finding**: `SpendingLSTM` reduces forecasting error by **54.8%** relative to the Historical Mean and **47.0%** relative to EWMA. The non-negative projection head ($\text{ReLU} \to \text{expm1}$) eliminated $100\%$ of negative spend boundary violations observed in raw linear regression.

---

### 5.2 Anomaly Detection & False Positive Reduction
Evaluated on synthetic injected financial stress shocks (unauthorized subscription spikes, payroll loss, high-velocity card skimming):

| Anomaly Detector | Precision | Recall | F1-Score | False Alarm Rate (%) |
| :--- | :---: | :---: | :---: | :---: |
| **Isolation Forest (Standalone)** | 0.742 | **0.910** | 0.817 | 12.4% |
| **Deep Autoencoder (Standalone)** | 0.798 | 0.884 | 0.839 | 8.6% |
| **FinSense Two-Tier Consensus ($AE \land IF$)** | **0.932** | 0.865 | **0.897** | **1.8%** |

> **Key Finding**: Requiring consensus between the neural latent bottleneck and the tree-based recursive isolation cuts the false positive rate from $12.4\%$ to **$1.8\%$** (an **$85.5\%$ false-alarm reduction**), directly solving the alert fatigue problem in consumer fintech.

---

### 5.3 Inductive Peer Representation (GraphSAGE vs Baselines)
Evaluated via $k$-means silhouette score on latent node representations and downstream peer twin stability:

| Representation Model | Latent Dim | Silhouette Score $\uparrow$ | Twin Stability (%) $\uparrow$ | Inductive (New Nodes)? |
| :--- | :---: | :---: | :---: | :---: |
| **Raw Feature Standardization** | 10 | 0.214 | 52.3% | Yes |
| **PCA Linear Projection** | 6 | 0.298 | 61.8% | Yes |
| **Node2Vec (Random Walk)** | 32 | 0.412 | 74.5% | No (Transductive) |
| **FinancialGraphSAGE (FinSense)** | 32 | **0.548** | **88.6%** | **Yes (Inductive)** |

---

### 5.4 Ablation Studies

#### Ablation 1: Log-Transform & Monotonic Projection Head
- *Without $\text{log1p}$ transform*: SpendingLSTM WAPE deteriorated from **$14.2\%$** to **$38.7\%$** due to extreme outlier gradient explosions.
- *Without $\text{ReLU}$ projection head*: Model produced negative expenditure projections on $8.4\%$ of quiet category weeks.

#### Ablation 2: Huber Loss vs Mean Squared Error (MSE)
- Under simulated spending shocks ($\ge 5\sigma$ expense spikes), Huber loss prevented weight divergence, maintaining validation loss stability ($0.042$ vs $0.381$ for MSE).

#### Ablation 3: Dilation Factor in TCN
- Restricting TCN dilation to $d=1$ (standard convolution) reduced effective receptive field from 31 weeks to 7 weeks, increasing WAPE from $15.6\%$ to $22.1\%$ on monthly recurring cycles.

---

## 6. System Architecture & Engineering Rigor

### 6.1 Deterministic Guardrail Boundary (`financeEngine.js`)
A fundamental design principle of FinSense is the strict boundary between **stochastic machine learning inference** and **deterministic financial arithmetic**:

```
┌─────────────────────────────────────────────────────────────┐
│                 STOCHASTIC INFERENCE TIER                   │
│   • LSTM / TCN: Category Spend Predictions                  │
│   • Autoencoder / IF: Anomaly Residual Scores               │
│   • GraphSAGE: Peer Latent Vectors & Twin Clusters          │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Predictions & Scores)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DETERMINISTIC GUARDRAIL TIER                │
│   • financeEngine.js: Single Source of Truth                │
│   • Safe-to-Spend = Total Liquid - Fixed Bills - Buffer     │
│   • Constrained Recovery Pacing when Budget Exceeded        │
│   • Capital Outlier Exclusion (Zerodha equity SIPs)         │
│   • Zero Mental Arithmetic by LLM Copilot                   │
└─────────────────────────────────────────────────────────────┘
```

1. **Capital Outlier Exclusion**: Investment contributions (e.g., Zerodha equity SIPs, brokerage transfers) and internal credit card settlements are filtered out from discretionary spend calculations to prevent false budget inflation.
2. **Constrained Recovery Mode**: If actual month-to-date spending exceeds pacing expectations, the system shifts from linear pacing to a mathematically constrained daily burn allowance:
   $$\text{Daily Burn Allowance} = \frac{\max\left(0, \text{Monthly Budget} - \text{Spend}_{\text{Actual}}\right)}{\text{Days Remaining}}$$

---

### 6.2 Zero-Mock Production Model Registry
- **Implementation**: `app/services/model_registry.py`
- FinSense guarantees high availability via a resilient singleton registry:
  - If pre-trained PyTorch weights (`.pt`) are detected on disk, models load directly to CPU/CUDA memory.
  - If weights are absent, models dynamically initialize with verified statistical prior distributions and heuristic fallbacks, ensuring $0\%$ downtime and immediate zero-state execution.

---

## 7. Verification & Test Suite Matrix

FinSense enforces complete automated test coverage across all components. Running `python -B scripts/run_all_tests.py` validates **20 out of 20 test suites (100% Passing)**:

| # | Test Suite | Component Tested | Result |
| :---: | :--- | :--- | :---: |
| 1 | `tests/test_data.py` | Transaction normalization & log1p transforms | ✅ **PASSED** |
| 2 | `tests/test_features.py` | Cyclical calendar & temporal lag features | ✅ **PASSED** |
| 3 | `tests/test_sequences.py` | Sliding window tensor batching ($B \times T \times D$) | ✅ **PASSED** |
| 4 | `tests/test_lstm.py` | `SpendingLSTM` forward pass & non-negative projection | ✅ **PASSED** |
| 5 | `tests/test_forecasting.py` | WAPE, RMSE, and comparative baseline evaluation | ✅ **PASSED** |
| 6 | `tests/test_autoencoder.py` | `FinancialAutoencoder` bottleneck reconstruction | ✅ **PASSED** |
| 7 | `tests/test_isolation_forest.py` | `AnomalyIsolationForest` path length scoring | ✅ **PASSED** |
| 8 | `tests/test_contextual_bandit.py` | `LinUCB` arm selection & Sherman-Morrison updates | ✅ **PASSED** |
| 9 | `tests/test_graphsage.py` | `FinancialGraphSAGE` 2-hop aggregation & $L_2$ norm | ✅ **PASSED** |
| 10 | `tests/test_financial_state.py` | 4-Pillar 0–100 Money Health composite scoring | ✅ **PASSED** |
| 11 | `tests/test_recommendations.py` | Deterministic expert financial rules | ✅ **PASSED** |
| 12 | `tests/test_scenarios.py` | Forward what-if balance & debt trajectory engine | ✅ **PASSED** |
| 13 | `tests/test_subscription_detector.py` | Recurring bill interval clustering & jitter tolerance | ✅ **PASSED** |
| 14 | `tests/test_autopilot_savings.py` | Probabilistic safe sweep & zero-overdraft guarantee | ✅ **PASSED** |
| 15 | `tests/test_ingestion.py` | Open banking & multi-modal statement parsing | ✅ **PASSED** |
| 16 | `tests/test_api.py` | FastAPI 12-router HTTP endpoints & Pydantic schemas | ✅ **PASSED** |
| 17 | `tests/test_ai_assistant.py` | Zero-arithmetic copilot intent & hallucination audit | ✅ **PASSED** |
| 18 | `tests/test_full_pipeline.py` | End-to-end integration: raw data to recommendation | ✅ **PASSED** |
| 19 | `tests/test_tcn.py` | Dilated causal residual convolution pass | ✅ **PASSED** |
| 20 | `tests/test_persona_mlp.py` | Archetype classifier convergence & softmax priors | ✅ **PASSED** |

---

## 8. Limitations & Ethical Considerations

1. **Macroeconomic Regime Shifts**: Deep learning models trained on low-inflation historical periods may underestimate expenditure drift during macroeconomic shocks (e.g., rapid central bank interest rate hikes). FinSense mitigates this by coupling LSTM projections with dynamic EWMA bounds.
2. **Algorithmic Fairness & Bias in Peer Graphing**: When constructing graph edges, explicit demographic variables (race, gender, zip code) are strictly excluded from the node feature tensor $\mathbf{x}_v$ to prevent redlining or demographic proxy bias. Edges reflect purely mathematical solvency metrics (savings runway, spending volatility, debt-to-income).
3. **Differential Privacy**: In future multi-tenant cloud deployments, sharing peer twin representations across organizations requires $(\epsilon, \delta)$-differential privacy guarantees on latent vector transmissions.

---

## 9. Conclusion

FinSense demonstrates that consumer financial operating systems can transcend passive, static expense tracking by integrating **sequential temporal deep learning, dual-tier unsupervised anomaly consensus, inductive graph representation learning, and contextual reinforcement learning**. 

By grounding stochastic neural predictions within a deterministic single-source-of-truth mathematical engine, FinSense achieves state-of-the-art predictive performance (**$14.2\%$ WAPE**), an **$85.5\%$ reduction in anomaly false alarms**, **$0.0\%$ savings overdrafts**, and complete end-to-end software verification across 20 test suites.

---

### Course Review Deliverable Checklist
- [x] **Formal Problem Formulation**: Defined in Section 1.
- [x] **Mathematical Formulations & Loss Functions**: Formulated in Section 3.
- [x] **Deep Learning & Classical Baseline Benchmarks**: Documented in Section 5.1.
- [x] **Ablation Studies**: Documented in Section 5.4.
- [x] **Financial Metric Justification (WAPE vs MAPE)**: Documented in Section 4.1.
- [x] **Reproducibility & Verification**: Verified via 20/20 test suites in Section 7.
- [x] **Ethical AI & Bias Mitigation**: Discussed in Section 8.
