"""
Comprehensive Integration Test Suite for FinSense FastAPI Backend (Phase 4).

Tests all 8 API router modules and endpoints via TestClient.
"""

from fastapi.testclient import TestClient
import pytest
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["platform"] == "FinSense"
    assert "Forecast-Grounded" in data["tagline"]


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "models_loaded" in data["registry"]
    assert "subscription_detector" in data["registry"]["models_loaded"]


def test_health_score_endpoint():
    payload = {
        "checking_balance": 2500.0,
        "monthly_income": 6500.0,
        "monthly_expenses": 3200.0,
        "savings_balance": 12000.0,
        "debt_balance": 1500.0,
        "monthly_emi": 250.0,
        "credit_score": 740.0
    }
    resp = client.post("/api/health-score", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert 0.0 <= data["composite_score"] <= 100.0
    assert data["score_grade"] in ["Excellent", "Good", "Fair", "Vulnerable", "Critical"]
    assert len(data["persona"]) > 0
    assert data["runway_months"] >= 3.0


def test_forecast_endpoint():
    history = [120.0, 85.5, 92.0, 110.0, 145.0, 210.0, 190.0, 95.0, 105.0, 130.0]
    payload = {
        "historical_spending": history,
        "horizon_days": 7,
        "expected_inflows": [0.0, 0.0, 0.0, 0.0, 1500.0, 0.0, 0.0]
    }
    resp = client.post("/api/forecast", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["horizon_days"] == 7
    assert len(data["daily_forecasts"]) == 7
    assert data["total_forecasted_spend_mean"] > 0
    assert data["total_forecasted_spend_upper_95"] >= data["total_forecasted_spend_mean"]


def test_subscriptions_detect_endpoint():
    txs = [
        {"merchant": "Netflix", "amount": 15.99, "date": "2023-08-01"},
        {"merchant": "Netflix", "amount": 15.99, "date": "2023-09-01"},
        {"merchant": "Netflix", "amount": 15.99, "date": "2023-10-01"},
        {"merchant": "Hulu", "amount": 14.99, "date": "2023-08-10"},
        {"merchant": "Hulu", "amount": 14.99, "date": "2023-09-10"},
        {"merchant": "Hulu", "amount": 14.99, "date": "2023-10-10"},
        {"merchant": "Whole Foods", "amount": 82.50, "date": "2023-10-05"},
    ]
    resp = client.post("/api/subscriptions/detect", json={"transactions": txs})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_active_subscriptions"] >= 2
    assert data["total_monthly_commitment"] >= 30.0
    # Redundant video streaming should trigger overlap alert
    assert len(data["overlap_alerts"]) >= 1
    assert "VIDEO_STREAMING" in data["overlap_alerts"][0]["overlap_group"]


def test_autopilot_evaluate_endpoint():
    payload = {
        "checking_balance": 2500.0,
        "expected_inflow_7d": 1500.0,
        "forecasted_spend_mean_7d": 600.0,
        "forecasted_spend_std_7d": 80.0,
        "upcoming_bills_7d": 200.0,
        "safety_buffer": 100.0,
        "goals": [
            {
                "goal_id": "g1",
                "name": "Emergency Cushion",
                "target_amount": 5000.0,
                "current_amount": 3500.0,
                "priority": 1
            }
        ]
    }
    resp = client.post("/api/autopilot/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_paused"] is False
    assert data["safe_sweep_amount"] > 0
    assert data["goal_allocations"][0]["allocated_amount"] == 1500.0
    assert data["safe_sweep_amount"] == 2913.0


def test_autopilot_backtest_endpoint():
    payload = {
        "weekly_inflows": [1500.0 if w % 2 == 0 else 0.0 for w in range(12)],
        "actual_weekly_spend": [350.0] * 12,
        "forecasted_spend_means": [350.0] * 12,
        "forecasted_spend_stds": [40.0] * 12,
        "weekly_bills": [100.0 if w % 4 == 0 else 0.0 for w in range(12)],
        "initial_balance": 800.0,
        "naive_sweep_pct": 0.30,
        "safety_buffer": 100.0
    }
    resp = client.post("/api/autopilot/backtest", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_weeks"] == 12
    assert data["finsense_overdraft_count"] == 0
    assert data["overdraft_free"] is True


def test_scenarios_afford_endpoint():
    payload = {
        "item_name": "MacBook Pro",
        "purchase_amount": 1200.0,
        "checking_balance": 3500.0,
        "savings_balance": 8000.0,
        "monthly_income": 5000.0,
        "monthly_fixed_bills": 1500.0,
        "forecasted_monthly_spend_mean": 1200.0,
        "forecasted_monthly_spend_std": 100.0,
        "safety_buffer": 200.0
    }
    resp = client.post("/api/scenarios/afford", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] in ["AFFORDABLE", "STRETCH", "UNAFFORDABLE"]
    assert data["max_safe_purchase"] > 0
    assert "MacBook Pro" in data["recommendation"]


def test_recommendations_rank_endpoint():
    payload = {
        "user_state_vector": [0.8, 0.3, 0.7, 0.4, 0.3, 0.6],
        "top_k": 3
    }
    resp = client.post("/api/recommendations/rank", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) == 3
    assert "LinUCB" in data["bandit_model"]


def test_twins_peers_endpoint():
    payload = {
        "user_feature_vector": [5000.0, 2500.0, 10000.0, 0.25],
        "top_k": 3
    }
    resp = client.post("/api/twins/peers", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["twins"]) == 3
    assert data["peer_benchmark_savings_rate"] > 0


def test_ingestion_plaid_endpoint():
    resp = client.post("/api/ingestion/plaid/sync", json={"access_token": "mock_token"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["provider"] == "plaid"
    assert data["added_count"] > 0


def test_ingestion_aa_endpoint():
    resp = client.post("/api/ingestion/aa/sync", json={"consent_handle": "mock_handle"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["provider"] == "account_aggregator"
    assert data["added_count"] > 0


if __name__ == "__main__":
    test_root_endpoint()
    test_health_endpoint()
    test_health_score_endpoint()
    test_forecast_endpoint()
    test_subscriptions_detect_endpoint()
    test_autopilot_evaluate_endpoint()
    test_autopilot_backtest_endpoint()
    test_scenarios_afford_endpoint()
    test_recommendations_rank_endpoint()
    test_twins_peers_endpoint()
    test_ingestion_plaid_endpoint()
    test_ingestion_aa_endpoint()
    print("\n✅ ALL FASTAPI BACKEND API TESTS PASSED!")
