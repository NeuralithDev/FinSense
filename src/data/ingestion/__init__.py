"""
FinSense Data Ingestion Package.

Provides provider-agnostic transaction data pipelines, live Plaid delta-sync adapters,
and India Account Aggregator ReBIT connectors.
"""

from src.data.ingestion.base_adapter import (
    StandardTransaction,
    SyncResult,
    TransactionProviderAdapter
)
from src.data.ingestion.transaction_normalizer import TransactionNormalizer
from src.data.ingestion.plaid_adapter import PlaidAdapter
from src.data.ingestion.account_aggregator_adapter import (
    IndiaAccountAggregatorAdapter,
    AAConsentRequest,
    AAConsentStatus
)

__all__ = [
    "StandardTransaction",
    "SyncResult",
    "TransactionProviderAdapter",
    "TransactionNormalizer",
    "PlaidAdapter",
    "IndiaAccountAggregatorAdapter",
    "AAConsentRequest",
    "AAConsentStatus"
]
