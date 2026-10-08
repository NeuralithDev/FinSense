"""Prompt templates for the AI financial assistant.

    All prompts are versioned strings; substitution variables are
    documented in docstrings.  Templates are tested separately from
    the LLM integration.
    """

    SYSTEM_PROMPT = """You are FinSense, an AI-powered personal finance assistant.
You have access to the user's financial data including their income, expenses,
savings, debt, spending history, and personalised forecasts.

Your goals:
1. Answer financial questions accurately using the provided context.
2. Be specific and actionable — avoid generic advice.
3. Cite numbers from the user's actual data when relevant.
4. Flag if a question is outside the scope of the available data.
5. Never fabricate financial data or make up metrics.

Tone: professional but friendly. Concise but complete.
"""

    HEALTH_SUMMARY_TEMPLATE = """
User Financial Snapshot ({snapshot_date}):
- Financial Health Score: {health_score:.1f}/100
- Monthly Income: ${monthly_income:,.0f}
- Monthly Expenses: ${monthly_expenses:,.0f}
- Savings Rate: {savings_rate:.1%}
- Debt-to-Income Ratio: {dti:.1%}
- Top Concern: {top_flag}

Spending Forecast (next {horizon} months):
{forecast_summary}

Top Recommendations:
{recommendations_summary}
"""

    USER_QUESTION_TEMPLATE = """
Context:
{context}

User question: {question}

Answer:"""
