# FinSense — Project Learning Notes

> Personal notes on design decisions, lessons learned, and open questions.
> Updated as implementation progresses.

## Why these datasets?

- **Financial profiles** give us the static financial DNA of each user —
  income, debt, savings structure. Without this, all behavioral signals
  are context-free.
- **IBM transactions** give us the behavioral pulse — what people actually
  buy, when, and how their habits drift over time.
- **PaySim** is a large-scale simulation that lets us stress-test the
  feature pipeline at scale without personally identifiable data.

## Design Decisions

### Why NOT fraud detection?
Every public fintech ML demo targets fraud. FinSense targets financial
*health* — a more interesting and underexplored problem. The datasets
contain fraud labels but we explicitly exclude them from our objective.

### Why a Health Score?
A composite score gives users one number they can track over time.
The 4-dimension breakdown (savings, debt, expense, credit) maps to
real financial planning frameworks (e.g., the 50/30/20 rule, DTI caps).

### Why FastAPI over Streamlit?
Streamlit is great for notebook-style demos. FastAPI gives us a
production-ready API that a frontend can consume. Both can coexist —
Streamlit calls the FastAPI endpoints in the final demo.

## Open Questions

- [ ] What is the unit of the `amount` column in IBM — dollars? Cents?
- [ ] Are negative amounts in IBM refunds or debits?
- [ ] Does financial dataset have multiple records per user (time series)?
- [ ] Is PaySim amounts in USD or local currency?
- [ ] What LLM provider to use for the assistant (OpenAI vs. local Ollama)?

## Milestones

- [ ] Week 1, Day 1: EDA on all 3 datasets (notebooks 00–03)
- [ ] Week 1, Day 2: Data validation + cleaning (04–05)
- [ ] Week 1, Day 3: Feature engineering (06–08)
- [ ] Week 1, Day 4: Forecasting models (09–10)
- [ ] Week 1, Day 5: Anomaly + scenario + recommendations (11–14)
- [ ] Week 1, Day 6: AI assistant + API (13)
- [ ] Week 1, Day 7: Integration, demo, polishing (16)
