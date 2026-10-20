"""
Base Transaction Provider Adapter & Canonical Schema for FinSense.

Defines the normalized transaction format and abstract synchronization interface
for third-party financial data providers (Plaid, India Account Aggregator, etc.).
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Union


@dataclass
class StandardTransaction:
    """
    Unified, provider-agnostic financial transaction representation.
    
    Rocket Money and competing apps often fail when provider schemas change.
    FinSense uses an invariant internal standard transaction schema that decouples
    core forecasting and ML engines from specific data aggregator quirks.
    """
    transaction_id: str
    account_id: str
    date: str                                   # ISO format: YYYY-MM-DD
    amount: float                               # Non-negative monetary magnitude
    is_inflow: bool                             # True for income/deposit, False for spend/outflow
    merchant_name: str                          # Cleaned, standardized merchant name
    raw_description: str                        # Original bank statement text
    category_primary: str                       # High-level category (e.g. 'Food & Dining')
    category_detailed: Optional[str] = None     # Sub-category (e.g. 'Fast Food')
    payment_channel: str = "online"             # online, in_store, upi, ach, etc.
    pending: bool = False                       # True if unsettled/pending
    iso_currency_code: str = "USD"              # USD, INR, EUR, etc.
    account_balance_after: Optional[float] = None
    provider: str = "mock"                      # plaid, account_aggregator, mock, manual
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def signed_amount(self) -> float:
        """
        Returns signed cash flow: positive for money entering account (+inflow),
        negative for money exiting account (-outflow).
        """
        return self.amount if self.is_inflow else -self.amount

    def to_dict(self) -> Dict[str, Any]:
        """Serializes transaction to standard dictionary format."""
        d = asdict(self)
        d["signed_amount"] = self.signed_amount
        return d


@dataclass
class SyncResult:
    """
    Result of an incremental cursor-based synchronization cycle.
    Directly mirrors modern delta-sync protocols (e.g., Plaid /transactions/sync).
    """
    added: List[StandardTransaction]
    modified: List[StandardTransaction]
    removed: List[str]                          # List of deleted transaction IDs
    next_cursor: str                            # Cursor to store for the next delta sync
    has_more: bool                              # True if more pages must be fetched immediately
    accounts: List[Dict[str, Any]] = field(default_factory=list)


class TransactionProviderAdapter(ABC):
    """
    Abstract interface for financial data aggregators.
    """

    @abstractmethod
    def sync_transactions(
        self,
        access_token_or_handle: str,
        cursor: Optional[str] = None,
        count: int = 100
    ) -> SyncResult:
        """
        Pulls incremental transaction updates using cursor-based pagination.
        """
        pass

    @abstractmethod
    def get_accounts(self, access_token_or_handle: str) -> List[Dict[str, Any]]:
        """
        Retrieves linked account balances, types, and institutions.
        """
        pass

    @abstractmethod
    def normalize_transaction(self, raw_data: Dict[str, Any]) -> StandardTransaction:
        """
        Converts aggregator-specific transaction JSON into StandardTransaction.
        """
        pass
