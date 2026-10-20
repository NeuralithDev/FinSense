"""
Comprehensive Test Suite for Real Data Ingestion (Phase 3).

Validates:
1. Transaction normalizer string cleaning & taxonomy harmonization
2. Plaid inverted amount rules (negative = inflow, positive = outflow)
3. Plaid multi-batch cursor delta sync (added, modified, removed)
4. India Account Aggregator ReBIT DEBIT/CREDIT normalization and UPI parsing
5. End-to-end integration: Ingested transactions -> SubscriptionDetector & AutopilotSavingsEngine
"""

import pytest
from datetime import datetime
from src.data.ingestion.base_adapter import StandardTransaction, SyncResult
from src.data.ingestion.transaction_normalizer import TransactionNormalizer
from src.data.ingestion.plaid_adapter import PlaidAdapter
from src.data.ingestion.account_aggregator_adapter import IndiaAccountAggregatorAdapter
from src.intelligence.subscription_detector import SubscriptionDetector
from src.intelligence.autopilot_savings import AutopilotSavingsEngine, SavingsGoal, GoalCategory


class TestTransactionNormalizer:
    def test_strip_processor_prefixes(self):
        cases = [
            ("SQUARE *BLUE BOTTLE COFFEE SAN FRANCISCO CA", "Blue Bottle Coffee"),
            ("TST* SWEETGREEN NEW YORK NY", "Sweetgreen"),
            ("PAYPAL *EBAY PURCHASE", "Ebay Purchase"),
            ("AMZN Mktp US* 9X12B3 SEATTLE WA", "Amazon"),
            ("SP * GYMSHARK CLOTHING", "Gymshark Clothing"),
            ("APPLE.COM/BILL 800-275-2273 CA", "Apple"),
        ]
        for raw, expected in cases:
            cleaned = TransactionNormalizer.clean_merchant_name(raw)
            assert expected.lower() in cleaned.lower(), f"Failed on '{raw}': got '{cleaned}', expected '{expected}'"

    def test_upi_narration_cleaning(self):
        cases = [
            ("UPI/4123891283/Zomato/zomato@hdfcbank/UPI", "Zomato"),
            ("UPI/9981293812/Swiggy/swiggy@icici/UPI", "Swiggy"),
            ("UPI/1122334455/Tata Power/tatapower@billdesk/UPI", "Tata Power"),
            ("NEFT-INFOSYS LIMITED-SALARY-AUG23", "Infosys Limited"),
        ]
        for raw, expected in cases:
            cleaned = TransactionNormalizer.clean_merchant_name(raw)
            assert expected.lower() in cleaned.lower(), f"Failed on '{raw}': got '{cleaned}', expected '{expected}'"

    def test_category_harmonization(self):
        cat1, _ = TransactionNormalizer.normalize_category(["INCOME", "INCOME_WAGES"], "DIRECT DEP ACME")
        assert cat1 == "Income"

        cat2, _ = TransactionNormalizer.normalize_category(["RENT_AND_UTILITIES", "RENT"], "AVALON BAY")
        assert cat2 == "Housing & Rent"

        cat3, _ = TransactionNormalizer.normalize_category(["FOOD_AND_DRINK", "GROCERIES"], "TRADER JOE'S")
        assert cat3 == "Food & Dining"

        cat4, _ = TransactionNormalizer.normalize_category(["ENTERTAINMENT", "STREAMING"], "NETFLIX")
        assert cat4 == "Subscriptions"


class TestPlaidAdapter:
    def test_amount_sign_normalization(self):
        adapter = PlaidAdapter(use_mock=True)

        # Plaid Inflow: amount is -2250.00
        raw_inflow = {
            "transaction_id": "tx_in",
            "account_id": "act_chk",
            "amount": -2250.00,
            "name": "DIRECT DEP ACME CORP",
            "personal_finance_category": {"primary": "INCOME", "detailed": "INCOME_WAGES"}
        }
        tx_in = adapter.normalize_transaction(raw_inflow)
        assert tx_in.is_inflow is True
        assert tx_in.amount == 2250.00
        assert tx_in.signed_amount == 2250.00
        assert tx_in.category_primary == "Income"

        # Plaid Outflow: amount is 15.99
        raw_outflow = {
            "transaction_id": "tx_out",
            "account_id": "act_chk",
            "amount": 15.99,
            "name": "NETFLIX.COM",
            "merchant_name": "Netflix"
        }
        tx_out = adapter.normalize_transaction(raw_outflow)
        assert tx_out.is_inflow is False
        assert tx_out.amount == 15.99
        assert tx_out.signed_amount == -15.99
        assert tx_out.merchant_name == "Netflix"

    def test_cursor_delta_synchronization(self):
        adapter = PlaidAdapter(use_mock=True)

        # Batch 1: Initial sync (cursor is None)
        sync1 = adapter.sync_transactions("mock_token", cursor=None)
        assert isinstance(sync1, SyncResult)
        assert len(sync1.added) == 5
        assert sync1.has_more is True
        assert sync1.next_cursor == "plaid_cur_1"

        # Batch 2: Next page
        sync2 = adapter.sync_transactions("mock_token", cursor="plaid_cur_1")
        assert len(sync2.added) == 4
        assert sync2.has_more is False
        assert sync2.next_cursor == "plaid_cur_2"

        # Batch 3: Delta sync (transaction cleared from pending to posted + 1 removed)
        sync3 = adapter.sync_transactions("mock_token", cursor="plaid_cur_2")
        assert len(sync3.added) == 0
        assert len(sync3.modified) == 1
        assert sync3.modified[0].pending is False
        assert sync3.removed == ["plaid_tx_009_cancelled"]
        assert sync3.has_more is False

    def test_get_accounts(self):
        adapter = PlaidAdapter(use_mock=True)
        accounts = adapter.get_accounts("mock_token")
        assert len(accounts) == 3
        types = {a["subtype"] for a in accounts}
        assert "checking" in types
        assert "savings" in types
        assert "credit card" in types


class TestAccountAggregatorAdapter:
    def test_rebit_normalization(self):
        adapter = IndiaAccountAggregatorAdapter(use_mock=True)
        sync = adapter.sync_transactions("aa_consent_handle_01")

        assert isinstance(sync, SyncResult)
        assert len(sync.added) == 5
        assert sync.has_more is False

        # First transaction should be salary credit (185,000 INR)
        salary_tx = sync.added[0]
        assert salary_tx.is_inflow is True
        assert salary_tx.amount == 185000.00
        assert salary_tx.signed_amount == 185000.00
        assert salary_tx.iso_currency_code == "INR"
        assert "Infosys" in salary_tx.merchant_name
        assert salary_tx.category_primary == "Income"

        # Second transaction should be Netflix debit (649 INR)
        netflix_tx = sync.added[1]
        assert netflix_tx.is_inflow is False
        assert netflix_tx.amount == 649.00
        assert netflix_tx.signed_amount == -649.00
        assert "Netflix" in netflix_tx.merchant_name


class TestEndToEndPipelineWithIngestedData:
    def test_feed_ingested_plaid_into_intelligence_engines(self):
        """
        Tests the complete pipeline:
        Plaid Sync -> StandardTransactions -> SubscriptionDetector & AutopilotSavingsEngine
        """
        adapter = PlaidAdapter(use_mock=True)

        # 1. Fetch both pages of Plaid transactions
        page1 = adapter.sync_transactions("token", cursor=None)
        page2 = adapter.sync_transactions("token", cursor=page1.next_cursor)
        all_transactions = page1.added + page2.added

        # Synthesize 3 recurring monthly Netflix charges to test SubscriptionDetector
        from datetime import timedelta
        base_dt = datetime.now()
        recurring_stream = [t.to_dict() for t in all_transactions]
        for m in [1, 2, 3]:
            recurring_stream.append({
                "transaction_id": f"netflix_month_{m}",
                "account_id": "act_checking_001",
                "date": (base_dt - timedelta(days=27 + 30 * m)).strftime("%Y-%m-%d"),
                "amount": 15.99,
                "is_inflow": False,
                "merchant_name": "Netflix",
                "raw_description": "NETFLIX.COM",
                "category_primary": "Subscriptions",
                "payment_channel": "online",
                "pending": False,
                "iso_currency_code": "USD"
            })

        # 2. Feed into SubscriptionDetector
        import pandas as pd
        df_feed = pd.DataFrame({
            "Merchant": [t["merchant_name"] for t in recurring_stream],
            "Amount": [t["amount"] for t in recurring_stream],
            "Date": [t["date"] for t in recurring_stream]
        })
        detector = SubscriptionDetector()
        analysis = detector.analyze_transactions(df_feed)
        assert len(analysis.active_subscriptions) >= 1
        netflix_sub = next((s for s in analysis.active_subscriptions if "netflix" in s.merchant_canonical.lower()), None)
        assert netflix_sub is not None
        assert netflix_sub.amount == 15.99
        assert netflix_sub.cadence.value.lower() == "monthly"

        # 3. Feed account balance into AutopilotSavingsEngine
        accounts = adapter.get_accounts("token")
        checking_bal = next(a["balances"]["available"] for a in accounts if a["subtype"] == "checking")
        assert checking_bal == 2450.75

        goal = SavingsGoal(
            goal_id="g_live",
            name="Emergency Fund",
            category=GoalCategory.EMERGENCY_FUND,
            target_amount=5000.0,
            current_amount=2000.0,
            priority=1
        )

        decision = AutopilotSavingsEngine.run_autopilot_cycle(
            checking_balance=checking_bal,
            expected_inflow_7d=0.0,
            forecasted_spend_mean_7d=300.0,
            forecasted_spend_std_7d=50.0,
            upcoming_bills_7d=netflix_sub.amount,
            goals=[goal],
            safety_buffer=100.0
        )

        assert decision.is_paused is False
        assert decision.safe_sweep_amount > 0.0
        assert decision.goal_allocations[0].allocated_amount == decision.safe_sweep_amount
        print(f"\n[End-to-End Ingestion Integration Test]")
        print(f"  Ingested {len(recurring_stream)} transactions from Plaid Adapter.")
        print(f"  Detected subscription: {netflix_sub.merchant_canonical} (${netflix_sub.amount}/mo)")
        print(f"  Checking balance: ${checking_bal:,.2f}")
        print(f"  Autopilot Safe Sweep: ${decision.safe_sweep_amount:,.2f}")


if __name__ == "__main__":
    t_norm = TestTransactionNormalizer()
    t_norm.test_strip_processor_prefixes()
    t_norm.test_upi_narration_cleaning()
    t_norm.test_category_harmonization()

    t_plaid = TestPlaidAdapter()
    t_plaid.test_amount_sign_normalization()
    t_plaid.test_cursor_delta_synchronization()
    t_plaid.test_get_accounts()

    t_aa = TestAccountAggregatorAdapter()
    t_aa.test_rebit_normalization()

    t_e2e = TestEndToEndPipelineWithIngestedData()
    t_e2e.test_feed_ingested_plaid_into_intelligence_engines()

    print("\n✅ ALL INGESTION TESTS PASSED!")
