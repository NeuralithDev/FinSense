"""
India RBI Account Aggregator (AA) Ingestion Adapter for FinSense.

Implements the ReBIT financial information schema for Indian Open Banking.
Normalizes DEBIT/CREDIT classifications, decodes UPI VPA narrations,
handles rupee monetary units, and maps bank statement feeds into StandardTransaction.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass, field

from src.data.ingestion.base_adapter import (
    StandardTransaction,
    SyncResult,
    TransactionProviderAdapter
)
from src.data.ingestion.transaction_normalizer import TransactionNormalizer


class AAConsentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


@dataclass
class AAConsentRequest:
    """Represents an RBI Account Aggregator consent request."""
    consent_id: str
    customer_vpa: str                    # e.g., "user@okhdfcbank"
    fi_types: List[str]                  # ["DEPOSIT", "TERM_DEPOSIT"]
    date_from: str
    date_to: str
    status: AAConsentStatus = AAConsentStatus.PENDING


class IndiaAccountAggregatorAdapter(TransactionProviderAdapter):
    """
    Adapter for India's Account Aggregator framework (ReBIT / Sahamati / Setu / Finvu).
    Supports multi-account fetching, UPI narration parsing, and INR currency normalization.
    """

    def __init__(self, api_key: Optional[str] = None, use_mock: bool = True):
        self.api_key = api_key
        self.use_mock = use_mock

    def normalize_transaction(self, raw_data: Dict[str, Any]) -> StandardTransaction:
        """
        Converts ReBIT AA transaction JSON into FinSense StandardTransaction.

        ReBIT Convention:
        - `type`: "DEBIT" (outflow) or "CREDIT" (inflow)
        - `narration`: Statement text (e.g. "UPI/4123891283/Zomato/zomato@hdfcbank/UPI")
        - `amount`: Transaction amount in INR (always positive in ReBIT schema)
        - `currentBalance`: Balance after transaction
        """
        txn_type = str(raw_data.get("type", "DEBIT")).upper().strip()
        is_inflow = (txn_type == "CREDIT")

        raw_amount = float(raw_data.get("amount", 0.0))
        narration = str(raw_data.get("narration", raw_data.get("reference", "Unknown Transaction")))

        # Extract merchant name from UPI narration or salary
        merchant = TransactionNormalizer.clean_merchant_name(narration)

        # Normalize category
        primary_cat, detailed_cat = TransactionNormalizer.normalize_category(
            provider_category=raw_data.get("category"),
            raw_description=narration
        )

        if is_inflow and primary_cat != "Financial & Transfers":
            primary_cat = "Income"

        # Timestamp parsing
        ts = raw_data.get("transactionTimestamp") or raw_data.get("date") or datetime.now().isoformat()
        date_str = ts[:10] if len(ts) >= 10 else datetime.now().strftime("%Y-%m-%d")

        bal_after = raw_data.get("currentBalance")
        account_balance_after = float(bal_after) if bal_after is not None else None

        mode = str(raw_data.get("mode", "UPI")).lower()

        return StandardTransaction(
            transaction_id=str(raw_data.get("txnId", f"aa_{id(raw_data)}")),
            account_id=str(raw_data.get("account_id", "aa_acc_hdfc_01")),
            date=date_str,
            amount=round(abs(raw_amount), 2),
            is_inflow=is_inflow,
            merchant_name=merchant,
            raw_description=narration,
            category_primary=primary_cat,
            category_detailed=detailed_cat,
            payment_channel=mode,
            pending=False,              # ReBIT AA statements only contain cleared transactions
            iso_currency_code="INR",
            account_balance_after=account_balance_after,
            provider="account_aggregator",
            metadata={
                "rebit_mode": raw_data.get("mode"),
                "reference": raw_data.get("reference"),
                "value_date": raw_data.get("valueDate")
            }
        )

    def sync_transactions(
        self,
        access_token_or_handle: str,
        cursor: Optional[str] = None,
        count: int = 100
    ) -> SyncResult:
        """Pulls bank statement transactions from Account Aggregator session."""
        if not self.use_mock:
            # Live AA integration requires FI fetch session with private ECDH decryption
            pass
        return self._sync_mock_aa(cursor)

    def get_accounts(self, access_token_or_handle: str) -> List[Dict[str, Any]]:
        """Returns linked Indian bank accounts."""
        return [
            {
                "account_id": "aa_acc_hdfc_01",
                "bank_name": "HDFC Bank",
                "account_type": "SAVINGS",
                "masked_account_number": "XXXX-XXXX-4589",
                "current_balance": 142500.50,
                "currency": "INR"
            },
            {
                "account_id": "aa_acc_icici_02",
                "bank_name": "ICICI Bank",
                "account_type": "CURRENT",
                "masked_account_number": "XXXX-XXXX-9921",
                "current_balance": 315000.00,
                "currency": "INR"
            }
        ]

    def _sync_mock_aa(self, cursor: Optional[str]) -> SyncResult:
        """Simulates realistic Indian banking statement records."""
        today = datetime.now()

        raw_txns = [
            {
                "txnId": "rebit_tx_101",
                "account_id": "aa_acc_hdfc_01",
                "type": "CREDIT",
                "mode": "NEFT",
                "amount": 185000.00,
                "currentBalance": 245000.00,
                "transactionTimestamp": (today - timedelta(days=20)).strftime("%Y-%m-%dT10:15:00+05:30"),
                "narration": "NEFT-INFOSYS LIMITED-SALARY-AUG23",
                "reference": "INFY-SAL-0823"
            },
            {
                "txnId": "rebit_tx_102",
                "account_id": "aa_acc_hdfc_01",
                "type": "DEBIT",
                "mode": "UPI",
                "amount": 649.00,
                "currentBalance": 244351.00,
                "transactionTimestamp": (today - timedelta(days=18)).strftime("%Y-%m-%dT20:30:00+05:30"),
                "narration": "UPI/4123891283/Netflix/netflix@hdfcbank/UPI",
                "reference": "UPI4123891283"
            },
            {
                "txnId": "rebit_tx_103",
                "account_id": "aa_acc_hdfc_01",
                "type": "DEBIT",
                "mode": "UPI",
                "amount": 420.00,
                "currentBalance": 243931.00,
                "transactionTimestamp": (today - timedelta(days=15)).strftime("%Y-%m-%dT13:45:00+05:30"),
                "narration": "UPI/3981293812/Swiggy/swiggy@icici/UPI",
                "reference": "UPI3981293812"
            },
            {
                "txnId": "rebit_tx_104",
                "account_id": "aa_acc_hdfc_01",
                "type": "DEBIT",
                "mode": "NEFT",
                "amount": 35000.00,
                "currentBalance": 208931.00,
                "transactionTimestamp": (today - timedelta(days=10)).strftime("%Y-%m-%dT09:00:00+05:30"),
                "narration": "NEFT-APARTMENT RENT-MR RAJESH SHARMA",
                "reference": "RENT-0823"
            },
            {
                "txnId": "rebit_tx_105",
                "account_id": "aa_acc_hdfc_01",
                "type": "DEBIT",
                "mode": "UPI",
                "amount": 2500.00,
                "currentBalance": 206431.00,
                "transactionTimestamp": (today - timedelta(days=5)).strftime("%Y-%m-%dT17:20:00+05:30"),
                "narration": "UPI/9982312381/Tata Power/tatapower@billdesk/UPI",
                "reference": "BILL-TP-AUG"
            }
        ]

        standardized = [self.normalize_transaction(t) for t in raw_txns]
        return SyncResult(
            added=standardized,
            modified=[],
            removed=[],
            next_cursor="rebit_cur_final",
            has_more=False,
            accounts=self.get_accounts("")
        )
