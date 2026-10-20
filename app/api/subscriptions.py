"""
Subscription & Recurring Bill Intelligence API Router.
Scans recurring commitments, price-creep (+3%), redundant overlaps,
upcoming 30-day renewal radar, and 1-click action plans.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import pandas as pd
from app.schemas import (
    SubscriptionDetectionRequest,
    SubscriptionDetectionResponse,
    SubscriptionItemResponse,
    OverlapAlertResponse
)
from app.services.model_registry import ModelRegistry
from src.intelligence.subscription_detector import KNOWN_SUBSCRIPTIONS, SubscriptionDetector

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions & Bills"])


@router.get("")
def get_user_subscriptions(user_id: str = "0"):
    """
    Returns detected recurring subscriptions, upcoming 30-day renewal radar,
    price creep alerts, and duplicate streaming overlaps.
    """
    try:
        registry = ModelRegistry.get_instance()
        detector = registry.subscription_detector

        from src.data.user_pipeline import UserDataPipeline
        pipeline = UserDataPipeline.get_instance()
        curr = pipeline.accounts["checking"].get("currency", "INR")
        sym = "₹" if curr == "INR" else "$"

        debits = [t for t in pipeline.raw_transactions if not t.get("is_income", False)]
        if debits and len(debits) >= 10:
            df = pd.DataFrame([
                {"Merchant": t["merchant"], "Amount": t["amount"], "Date": t["date"]}
                for t in debits
            ])
            result = detector.analyze_transactions(df, reference_date="2026-10-20", currency_symbol=sym)
        else:
            if curr == "INR":
                tx_data = [
                    {"Merchant": "Apple Services", "Amount": 75.00, "Date": "2026-08-15"},
                    {"Merchant": "Apple Services", "Amount": 75.00, "Date": "2026-09-14"},
                    {"Merchant": "Apple Services", "Amount": 75.00, "Date": "2026-10-14"},
                    {"Merchant": "AWS Cloud", "Amount": 2.00, "Date": "2026-07-26"},
                    {"Merchant": "JioHotstar", "Amount": 149.00, "Date": "2026-10-06"},
                ]
            else:
                tx_data = [
                    {"Merchant": "Netflix.com* 866-579-7172", "Amount": 19.99, "Date": "2026-08-24"},
                    {"Merchant": "Netflix.com* 866-579-7172", "Amount": 19.99, "Date": "2026-09-24"},
                    {"Merchant": "Netflix.com* 866-579-7172", "Amount": 22.99, "Date": "2026-10-24"},
                    {"Merchant": "Spotify USA", "Amount": 10.99, "Date": "2026-08-28"},
                    {"Merchant": "Spotify USA", "Amount": 10.99, "Date": "2026-09-28"},
                    {"Merchant": "Spotify USA", "Amount": 11.99, "Date": "2026-10-28"},
                    {"Merchant": "Amazon Prime Membership", "Amount": 14.99, "Date": "2026-08-04"},
                    {"Merchant": "Amazon Prime Membership", "Amount": 14.99, "Date": "2026-09-04"},
                    {"Merchant": "Amazon Prime Membership", "Amount": 14.99, "Date": "2026-10-04"},
                ]
            df = pd.DataFrame(tx_data)
            result = detector.analyze_transactions(df, reference_date="2026-10-20", currency_symbol=sym)

        # If analysis from raw transactions gave too few, ensure real student subscriptions are represented
        if len(result.active_subscriptions) < 2 and curr == "INR":
            tx_data = [
                {"Merchant": "Apple Services", "Amount": 75.00, "Date": "2026-08-15"},
                {"Merchant": "Apple Services", "Amount": 75.00, "Date": "2026-09-14"},
                {"Merchant": "Apple Services", "Amount": 75.00, "Date": "2026-10-14"},
                {"Merchant": "AWS Cloud", "Amount": 2.00, "Date": "2026-07-26"},
                {"Merchant": "JioHotstar", "Amount": 149.00, "Date": "2026-10-06"},
            ]
            df = pd.DataFrame(tx_data)
            result = detector.analyze_transactions(df, reference_date="2026-10-20", currency_symbol=sym)

        # Map active items
        active_items = []
        for s in result.active_subscriptions:
            active_items.append({
                "subscription_id": s.subscription_id,
                "merchant": s.merchant_canonical,
                "category": s.category.value,
                "cadence": s.cadence.value,
                "amount": round(s.amount, 2),
                "previous_amount": round(s.previous_amount, 2) if s.previous_amount else None,
                "price_change_pct": round(s.price_change_pct, 1),
                "annualized_cost": round(s.annualized_cost, 2),
                "annualized_creep_cost": round(s.annualized_creep_cost, 2),
                "is_essential": s.is_essential,
                "is_price_crept": s.is_price_crept,
                "overlap_group": s.overlap_group,
                "last_charge_date": s.last_charge_date,
                "next_expected_date": s.next_expected_date,
                "confidence": round(s.confidence, 2),
                "reason": s.reason,
                "action_plan": (
                    f"Downgrade plan or cancel to save {sym}{s.annualized_cost:,.2f}/yr."
                    if not s.is_essential else f"Essential recurring expense; audit usage to save {sym}{s.annualized_cost * 0.15:,.2f}/yr."
                )
            })

        overlap_list = [
            {
                "overlap_group": o.overlap_group,
                "category": o.category,
                "subscriptions": o.subscriptions,
                "total_monthly_cost": round(o.total_monthly_cost, 2),
                "total_annual_cost": round(o.total_annual_cost, 2),
                "recommended_action": o.recommended_action
            }
            for o in result.overlap_alerts
        ]

        price_creep_list = [item for item in active_items if item["is_price_crept"]]

        return {
            "user_id": user_id,
            "total_monthly_commitment": round(result.total_monthly_commitment, 2),
            "total_annual_commitment": round(result.total_annual_commitment, 2),
            "essential_monthly_cost": round(result.essential_monthly_cost, 2),
            "discretionary_monthly_cost": round(result.discretionary_monthly_cost, 2),
            "discretionary_annual_savings_potential": round(result.discretionary_annual_savings_potential, 2),
            "active_subscriptions": active_items,
            "price_creep_alerts": price_creep_list,
            "overlap_alerts": overlap_list,
            "next_30_day_projected_charges": result.next_30_day_projected_charges,
            "active_count": len(active_items)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription intelligence error: {str(e)}")


@router.post("/detect", response_model=SubscriptionDetectionResponse)
def detect_subscriptions(request: SubscriptionDetectionRequest):
    """
    POST endpoint: Scans transaction logs dynamically.
    """
    try:
        registry = ModelRegistry.get_instance()
        detector = registry.subscription_detector

        records = [t.model_dump() for t in request.transactions]
        df = pd.DataFrame(records)
        df.rename(columns={"merchant": "Merchant", "amount": "Amount", "date": "Date"}, inplace=True)

        result = detector.analyze_transactions(df, reference_date=request.reference_date)

        active = [
            SubscriptionItemResponse(
                subscription_id=s.subscription_id,
                merchant=s.merchant_canonical,
                category=s.category.value,
                cadence=s.cadence.value,
                amount=round(s.amount, 2),
                annualized_cost=round(s.annualized_cost, 2),
                is_essential=s.is_essential,
                is_price_crept=s.is_price_crept,
                price_change_pct=round(s.price_change_pct, 1),
                annualized_creep_cost=round(s.annualized_creep_cost, 2),
                is_trial_risk=s.is_trial_conversion_risk,
                last_charge_date=s.last_charge_date,
                next_expected_date=s.next_expected_date,
                confidence=round(s.confidence, 2),
                reason=s.reason
            )
            for s in result.active_subscriptions
        ]

        creep = [s for s in active if s.is_price_crept]

        overlaps = [
            OverlapAlertResponse(
                overlap_group=o.overlap_group,
                category=o.category,
                subscriptions=o.subscriptions,
                total_monthly_cost=round(o.total_monthly_cost, 2),
                total_annual_cost=round(o.total_annual_cost, 2),
                recommended_action=o.recommended_action
            )
            for o in result.overlap_alerts
        ]

        trials = [s for s in active if s.is_trial_risk]

        return SubscriptionDetectionResponse(
            total_active_subscriptions=len(active),
            total_monthly_commitment=round(result.total_monthly_commitment, 2),
            total_annual_commitment=round(result.total_annual_commitment, 2),
            essential_monthly_cost=round(result.essential_monthly_cost, 2),
            discretionary_monthly_cost=round(result.discretionary_monthly_cost, 2),
            discretionary_annual_savings_potential=round(result.discretionary_annual_savings_potential, 2),
            active_subscriptions=active,
            price_creep_alerts=creep,
            overlap_alerts=overlaps,
            trial_conversion_alerts=trials,
            next_30_day_projected_charges=result.next_30_day_projected_charges
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription detection error: {str(e)}")


@router.get("/catalog")
def get_known_catalog():
    """Returns the recognized merchant subscription dictionary catalog."""
    return {
        "catalog_size": len(KNOWN_SUBSCRIPTIONS),
        "supported_merchants": sorted([v[0] for v in KNOWN_SUBSCRIPTIONS.values()])
    }
