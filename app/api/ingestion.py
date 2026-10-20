"""
Real Data Ingestion API Router (Plaid & India Account Aggregator).
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from app.services.model_registry import ModelRegistry

router = APIRouter(prefix="/api/ingestion", tags=["Data Ingestion & Open Banking"])


@router.post("/plaid/sync")
def sync_plaid_transactions(payload: Optional[Dict[str, Any]] = None):
    """
    Executes incremental cursor-based synchronization via Plaid Transactions Sync API (/transactions/sync).
    Returns added, modified (e.g. pending to posted), and removed transactions.
    """
    try:
        body = payload or {}
        access_token = body.get("access_token", "mock_plaid_token")
        cursor = body.get("cursor", None)
        count = int(body.get("count", 100))

        registry = ModelRegistry.get_instance()
        adapter = registry.plaid_adapter

        result = adapter.sync_transactions(access_token_or_handle=access_token, cursor=cursor, count=count)

        return {
            "status": "success",
            "provider": "plaid",
            "added_count": len(result.added),
            "modified_count": len(result.modified),
            "removed_count": len(result.removed),
            "next_cursor": result.next_cursor,
            "has_more": result.has_more,
            "added": [t.to_dict() for t in result.added],
            "modified": [t.to_dict() for t in result.modified],
            "removed": result.removed,
            "accounts": result.accounts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plaid sync error: {str(e)}")


@router.get("/plaid/accounts")
def get_plaid_accounts(access_token: str = "mock_plaid_token"):
    """
    Retrieves linked bank accounts, checking/savings balances, and limits.
    """
    try:
        registry = ModelRegistry.get_instance()
        adapter = registry.plaid_adapter
        accounts = adapter.get_accounts(access_token)
        return {
            "status": "success",
            "provider": "plaid",
            "accounts": accounts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account retrieval error: {str(e)}")


@router.post("/aa/sync")
def sync_india_account_aggregator(payload: Optional[Dict[str, Any]] = None):
    """
    Fetches and normalizes Indian bank statements using the RBI Account Aggregator (AA) ReBIT schema.
    """
    try:
        body = payload or {}
        consent_handle = body.get("consent_handle", "mock_aa_handle")
        cursor = body.get("cursor", None)

        registry = ModelRegistry.get_instance()
        adapter = registry.aa_adapter

        result = adapter.sync_transactions(access_token_or_handle=consent_handle, cursor=cursor)

        return {
            "status": "success",
            "provider": "account_aggregator",
            "added_count": len(result.added),
            "next_cursor": result.next_cursor,
            "has_more": result.has_more,
            "transactions": [t.to_dict() for t in result.added],
            "accounts": result.accounts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account Aggregator sync error: {str(e)}")


@router.get("/aa/accounts")
def get_aa_accounts(consent_handle: str = "mock_aa_handle"):
    """
    Returns linked Indian accounts (HDFC, ICICI, SBI) from Account Aggregator session.
    """
    try:
        registry = ModelRegistry.get_instance()
        adapter = registry.aa_adapter
        accounts = adapter.get_accounts(consent_handle)
        return {
            "status": "success",
            "provider": "account_aggregator",
            "accounts": accounts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AA Account retrieval error: {str(e)}")


# =============================================================================
# LIVE USER DATA PIPELINE & STATE MUTATION ENDPOINTS
# =============================================================================

from src.data.user_pipeline import UserDataPipeline


@router.get("/ledger")
def get_live_ledger():
    """
    Retrieves the complete stateful financial ledger, accounts, active goals,
    and anomaly alerts processed through the full data pipeline.
    """
    try:
        pipeline = UserDataPipeline.get_instance()
        return {
            "status": "success",
            "accounts": pipeline.accounts,
            "transactions": pipeline.raw_transactions,
            "goals": pipeline.goals,
            "anomalies": pipeline.anomalies,
            "pipeline_summary": pipeline.cached_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ledger retrieval error: {str(e)}")


@router.post("/upload")
def upload_statement(payload: Dict[str, Any]):
    """
    Ingests raw bank/credit card CSV or JSON statement data, routes it directly
    through data_cleaning.py -> feature_engineering.py -> models, and updates balances.
    """
    try:
        content = payload.get("content", "")
        file_type = payload.get("file_type", "csv")
        if not content:
            raise HTTPException(status_code=400, detail="Missing statement content string.")

        pipeline = UserDataPipeline.get_instance()
        results = pipeline.ingest_statement_file(content, file_type=file_type)

        return {
            "status": "success",
            "message": f"Successfully parsed and ingested statement data.",
            "total_transactions": len(pipeline.raw_transactions),
            "accounts": pipeline.accounts,
            "pipeline_summary": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statement ingestion error: {str(e)}")


@router.post("/transaction")
def add_live_transaction(payload: Dict[str, Any]):
    """
    Adds a single live transaction / swipe simulator entry and recalculates
    forecasts, anomalies, and health scores in real time.
    """
    try:
        merchant = payload.get("merchant", "Simulated Purchase")
        amount = float(payload.get("amount", 25.0))
        category = payload.get("category", None)
        is_income = bool(payload.get("is_income", False))
        is_recurring = bool(payload.get("is_recurring", False))

        pipeline = UserDataPipeline.get_instance()
        summary = pipeline.add_live_transaction(
            merchant=merchant,
            amount=amount,
            category=category,
            is_income=is_income,
            is_recurring=is_recurring
        )

        return {
            "status": "success",
            "transaction": pipeline.raw_transactions[0],
            "accounts": pipeline.accounts,
            "pipeline_summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live transaction error: {str(e)}")


@router.post("/sweep")
def execute_savings_sweep(payload: Optional[Dict[str, Any]] = None):
    """
    Executes a real animated savings sweep transfer from Checking to Savings,
    allocating funds to prioritized goals.
    """
    try:
        body = payload or {}
        amount = float(body.get("amount", 214.50))
        pipeline = UserDataPipeline.get_instance()
        result = pipeline.execute_savings_sweep(amount=amount)
        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result.get("error", "Sweep execution failed"))

        return {
            "status": "success",
            "transferred": result["transferred"],
            "checking_balance": result["checking_balance"],
            "savings_balance": result["savings_balance"],
            "goals": result["goals"],
            "accounts": pipeline.accounts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sweep error: {str(e)}")


@router.post("/subscription/action")
def subscription_action(payload: Dict[str, Any]):
    """
    Cancels or pauses a recurring subscription, removing it from projected monthly burn.
    """
    try:
        sub_id = payload.get("subscription_id", "")
        action = payload.get("action", "CANCEL")
        pipeline = UserDataPipeline.get_instance()
        result = pipeline.cancel_or_pause_subscription(sub_id, action)

        return {
            "status": "success",
            "action": result["action"],
            "cancelled_count": result["cancelled_count"],
            "paused_count": result["paused_count"],
            "pipeline_summary": pipeline.cached_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Subscription action error: {str(e)}")


@router.post("/anomaly/resolve")
def resolve_anomaly(payload: Dict[str, Any]):
    """
    Approves or flags/blocks an anomaly alert, dynamically updating the active alerts badge.
    """
    try:
        anom_id = payload.get("anomaly_id", "")
        resolution = payload.get("resolution", "APPROVED")
        pipeline = UserDataPipeline.get_instance()
        result = pipeline.resolve_anomaly_alert(anom_id, resolution)

        return {
            "status": "success",
            "resolved_id": result["resolved_id"],
            "resolution": result["status"],
            "pending_count": result["pending_count"],
            "anomalies": result["anomalies"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly resolution error: {str(e)}")


@router.post("/switch_profile")
def switch_profile(payload: Dict[str, Any]):
    """
    Switches between pre-configured sandbox profiles with live account data.
    """
    try:
        profile_key = payload.get("profile_key", "tech_pro")
        pipeline = UserDataPipeline.get_instance()
        result = pipeline.switch_account_profile(profile_key)

        return {
            "status": "success",
            "profile": result["profile"],
            "accounts": result["accounts"],
            "pipeline_summary": pipeline.cached_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile switch error: {str(e)}")

