"""
Pydantic Request & Response Schemas for FinSense API.

Enforces strict input validation, non-negative monetary constraints,
and explicit error bounds across all API surfaces.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# FINANCIAL STATE & HEALTH SCORE SCHEMAS
# =============================================================================

class FinancialProfileInput(BaseModel):
    checking_balance: float = Field(..., ge=0.0, description="Current checking balance in USD")
    monthly_income: float = Field(..., ge=0.0, description="Net monthly income in USD")
    monthly_expenses: float = Field(..., ge=0.0, description="Total monthly living expenses in USD")
    savings_balance: float = Field(default=0.0, ge=0.0, description="Liquid savings balance in USD")
    debt_balance: float = Field(default=0.0, ge=0.0, description="Total consumer/revolving debt in USD")
    monthly_emi: float = Field(default=0.0, ge=0.0, description="Monthly required debt payments in USD")
    credit_score: float = Field(default=700.0, ge=300.0, le=850.0, description="FICO/Vantage credit score")
    monthly_discretionary_spend: Optional[float] = Field(default=None, ge=0.0)


class HealthScoreResponse(BaseModel):
    composite_score: float = Field(..., ge=0.0, le=100.0, description="0-100 overall financial health score")
    score_grade: str = Field(..., description="Excellent, Good, Fair, Vulnerable, Critical")
    persona: str = Field(..., description="High-earner-poor-saver, Paycheck-to-paycheck, Debt-constrained, etc.")
    liquidity_score: float = Field(..., ge=0.0, le=100.0)
    savings_score: float = Field(..., ge=0.0, le=100.0)
    debt_score: float = Field(..., ge=0.0, le=100.0)
    volatility_score: float = Field(..., ge=0.0, le=100.0)
    runway_months: float = Field(..., ge=0.0, description="Months of expenses covered by liquid reserves")
    dti_ratio: float = Field(..., ge=0.0, description="Debt to income ratio")
    actionable_summary: str = Field(..., description="Plain-language diagnostic summary")


# =============================================================================
# CASH-FLOW FORECASTING SCHEMAS
# =============================================================================

class ForecastRequest(BaseModel):
    historical_spending: List[float] = Field(..., min_length=7, description="Recent daily spending history (min 7 days)")
    horizon_days: int = Field(default=7, ge=1, le=30, description="Forecast horizon in days (default 7, max 30)")
    expected_inflows: Optional[List[float]] = Field(default=None, description="Known future income per day")


class DailyForecast(BaseModel):
    day_offset: int
    date: str
    predicted_spend_mean: float
    predicted_spend_upper_95: float
    predicted_spend_lower_95: float
    expected_inflow: float


class ForecastResponse(BaseModel):
    horizon_days: int
    total_forecasted_spend_mean: float
    total_forecasted_spend_upper_95: float
    daily_forecasts: List[DailyForecast]
    model_name: str
    model_confidence_score: float


# =============================================================================
# SUBSCRIPTION & BILL DETECTION SCHEMAS
# =============================================================================

class TransactionInput(BaseModel):
    merchant: str = Field(..., min_length=1)
    amount: float = Field(..., ge=0.0)
    date: str = Field(..., description="YYYY-MM-DD")
    category: Optional[str] = None
    account_id: Optional[str] = None


class SubscriptionDetectionRequest(BaseModel):
    transactions: List[TransactionInput] = Field(..., min_length=3)
    reference_date: Optional[str] = None


class SubscriptionItemResponse(BaseModel):
    subscription_id: str
    merchant: str
    category: str
    cadence: str
    amount: float
    annualized_cost: float
    is_essential: bool
    is_price_crept: bool
    price_change_pct: float
    annualized_creep_cost: float
    is_trial_risk: bool
    last_charge_date: str
    next_expected_date: str
    confidence: float
    reason: str


class OverlapAlertResponse(BaseModel):
    overlap_group: str
    category: str
    subscriptions: List[str]
    total_monthly_cost: float
    total_annual_cost: float
    recommended_action: str


class SubscriptionDetectionResponse(BaseModel):
    total_active_subscriptions: int
    total_monthly_commitment: float
    total_annual_commitment: float
    essential_monthly_cost: float
    discretionary_monthly_cost: float
    discretionary_annual_savings_potential: float
    active_subscriptions: List[SubscriptionItemResponse]
    price_creep_alerts: List[SubscriptionItemResponse]
    overlap_alerts: List[OverlapAlertResponse]
    trial_conversion_alerts: List[SubscriptionItemResponse]
    next_30_day_projected_charges: List[Dict[str, Any]]


# =============================================================================
# AUTOPILOT SAVINGS & GOALS SCHEMAS
# =============================================================================

class SavingsGoalInput(BaseModel):
    goal_id: str
    name: str
    category: str = "EMERGENCY_FUND"
    target_amount: float = Field(..., gt=0.0)
    current_amount: float = Field(default=0.0, ge=0.0)
    priority: int = Field(default=1, ge=1, le=10)
    deadline_date: Optional[str] = None


class AutopilotEvaluateRequest(BaseModel):
    checking_balance: float = Field(..., ge=0.0)
    expected_inflow_7d: float = Field(default=0.0, ge=0.0)
    forecasted_spend_mean_7d: float = Field(..., ge=0.0)
    forecasted_spend_std_7d: float = Field(default=50.0, ge=0.0)
    upcoming_bills_7d: float = Field(default=0.0, ge=0.0)
    goals: List[SavingsGoalInput] = Field(default_factory=list)
    safety_buffer: float = Field(default=100.0, ge=0.0)
    max_overdraft_prob: float = Field(default=0.01, ge=0.001, le=0.10)
    days_until_next_inflow: int = Field(default=7, ge=1, le=30)
    upcoming_bills_horizon: Optional[float] = None


class GoalAllocationResponse(BaseModel):
    goal_id: str
    goal_name: str
    allocated_amount: float
    required_weekly_pace: Optional[float]
    feasible_weekly_pace: float
    is_on_track: bool
    status_message: str


class AutopilotEvaluateResponse(BaseModel):
    safe_sweep_amount: float
    is_paused: bool
    pause_reason: Optional[str]
    checking_balance: float
    safety_buffer: float
    projected_variable_spend_7d: float
    forecast_uncertainty_buffer: float
    upcoming_bills_7d: float
    projected_ending_balance: float
    overdraft_risk_probability: float
    goal_allocations: List[GoalAllocationResponse]
    explanation: str


class BacktestRequest(BaseModel):
    weekly_inflows: List[float] = Field(..., min_length=4)
    actual_weekly_spend: List[float] = Field(..., min_length=4)
    forecasted_spend_means: List[float] = Field(..., min_length=4)
    forecasted_spend_stds: List[float] = Field(..., min_length=4)
    weekly_bills: List[float] = Field(..., min_length=4)
    initial_balance: float = Field(default=1000.0, ge=0.0)
    naive_sweep_pct: float = Field(default=0.30, ge=0.05, le=0.50)
    safety_buffer: float = Field(default=100.0, ge=0.0)


class BacktestResponse(BaseModel):
    total_weeks: int
    finsense_total_saved: float
    finsense_overdraft_count: int
    finsense_overdraft_fees: float
    naive_total_saved: float
    naive_overdraft_count: int
    naive_overdraft_fees: float
    net_finsense_advantage: float
    overdraft_free: bool


# =============================================================================
# SCENARIOS & AFFORDABILITY SCHEMAS
# =============================================================================

class AffordabilityRequest(BaseModel):
    item_name: str = Field(..., min_length=1)
    purchase_amount: float = Field(..., gt=0.0)
    checking_balance: float = Field(..., ge=0.0)
    savings_balance: float = Field(default=0.0, ge=0.0)
    monthly_income: float = Field(..., ge=0.0)
    monthly_fixed_bills: float = Field(..., ge=0.0)
    forecasted_monthly_spend_mean: float = Field(..., ge=0.0)
    forecasted_monthly_spend_std: float = Field(default=100.0, ge=0.0)
    safety_buffer: float = Field(default=200.0, ge=0.0)


class AffordabilityResponse(BaseModel):
    item_name: str
    purchase_amount: float
    verdict: str                        # AFFORDABLE, STRETCH, UNAFFORDABLE
    max_safe_purchase: float
    projected_checking_remaining: float
    cushion_above_buffer: float
    runway_impact_weeks: float
    recommendation: str
    alternative_suggestion: Optional[str]


# =============================================================================
# RECOMMENDATIONS (BANDITS) SCHEMAS
# =============================================================================

class RecommendationRequest(BaseModel):
    user_state_vector: List[float] = Field(..., min_length=4, max_length=10)
    top_k: int = Field(default=3, ge=1, le=5)


class ActionCard(BaseModel):
    action_id: int
    title: str
    category: str
    predicted_impact_score: float
    action_type: str
    description: str


class RecommendationResponse(BaseModel):
    recommendations: List[ActionCard]
    bandit_model: str


# =============================================================================
# FINANCIAL TWINS (GRAPHSAGE) SCHEMAS
# =============================================================================

class TwinDiscoveryRequest(BaseModel):
    user_feature_vector: List[float] = Field(..., min_length=4, max_length=15)
    top_k: int = Field(default=5, ge=1, le=20)


class TwinProfile(BaseModel):
    twin_id: str
    similarity_score: float
    savings_rate: float
    debt_reduction_velocity: float
    top_winning_habits: List[str]


class TwinDiscoveryResponse(BaseModel):
    cluster_name: str
    twins: List[TwinProfile]
    peer_benchmark_savings_rate: float
    peer_benchmark_runway_months: float
