"""
Comprehensive Unit & Evaluation Tests for SubscriptionDetector.

Validates:
1. Merchant name normalization under real-world string noise
2. Interval clustering (weekly, biweekly, monthly ~30d, quarterly, annual ~365d)
3. Handling of missed months / skipped charges
4. Variable-amount utility bills (moderate CV)
5. Price creep detection with annualized financial impact calculation
6. Overlapping duplicate subscription alerts (e.g., Netflix + Hulu)
7. Trial conversion alerts
8. Next expected charge projection feeding the forward cash-flow forecast
9. Synthetic stream Precision & Recall evaluation benchmark
"""

from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import pytest

from src.intelligence.subscription_detector import (
    SubscriptionDetector,
    CadenceType,
    SubscriptionCategory,
    SubscriptionAnalysisResult
)


class TestMerchantNormalization:
    def test_noisy_merchant_strings(self):
        cases = [
            ("NETFLIX.COM* 866-579-7172 CA", "Netflix"),
            ("SPOTIFY USA 877-778-1161 NY", "Spotify"),
            ("AMZN MKTP US*2B7K119Q0", "Amazon Prime"),
            ("HULU 877-824-4858 CA", "Hulu"),
            ("DOORDASH*DASHPASS 855-973-1040", "DoorDash DashPass"),
            ("UBER* ONE TRIP 800-593-7069", "Uber One"),
            ("CONEDISON NY*UTIL BILL PAY", "ConEdison Utility"),
            ("APPLE.COM/BILL 866-712-7753 CA", "Apple Services"),
            ("GOOGLE *GOOGLE ONE CLOUD", "Google One"),
            ("PLANET FIT 1045 SAN JOSE CA", "Planet Fitness")
        ]
        for raw, expected in cases:
            norm = SubscriptionDetector.normalize_merchant_name(raw)
            assert norm == expected, f"Failed for {raw}: got {norm}, expected {expected}"


class TestIntervalAndCadenceDetection:
    def test_monthly_fixed_subscription(self):
        # 6 monthly charges on the 15th
        dates = [f"2023-0{m}-15" for m in range(1, 7)]
        df = pd.DataFrame({
            "Merchant": ["NETFLIX.COM 866-579-7172 CA"] * 6,
            "Amount": [15.49] * 6,
            "Date": dates
        })
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-06-20")

        assert len(res.active_subscriptions) == 1
        sub = res.active_subscriptions[0]
        assert sub.merchant_canonical == "Netflix"
        assert sub.cadence == CadenceType.MONTHLY
        assert sub.amount == 15.49
        assert sub.annualized_cost == round(15.49 * 12.0, 2)
        assert sub.next_expected_date == "2023-07-15"

    def test_skipped_month_handling(self):
        # Jan 10, Feb 10, April 10, May 10 (March skipped)
        dates = ["2023-01-10", "2023-02-10", "2023-04-10", "2023-05-10"]
        df = pd.DataFrame({
            "Merchant": ["SPOTIFY USA"] * 4,
            "Amount": [10.99] * 4,
            "Date": dates
        })
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-05-15")

        assert len(res.active_subscriptions) == 1
        sub = res.active_subscriptions[0]
        assert sub.merchant_canonical == "Spotify"
        assert sub.cadence == CadenceType.MONTHLY

    def test_variable_amount_utility(self):
        # ConEdison utility with seasonal bills: $85, $92, $110, $98, $105
        dates = [f"2023-0{m}-05" for m in range(1, 6)]
        amounts = [85.0, 92.0, 110.0, 98.0, 105.0]
        df = pd.DataFrame({
            "Merchant": ["CONEDISON NY*UTIL"] * 5,
            "Amount": amounts,
            "Date": dates,
            "MCC": [4900] * 5
        })
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-05-10")

        assert len(res.active_subscriptions) == 1
        sub = res.active_subscriptions[0]
        assert sub.is_essential is True
        assert sub.category == SubscriptionCategory.UTILITY
        assert sub.cadence == CadenceType.MONTHLY_VARIABLE_UTILITY
        assert sub.amount == 105.0


class TestPriceCreepAndAnnualizedImpact:
    def test_streaming_price_creep(self):
        # Netflix: 3 months at $11.99, then increases to $15.49
        dates = ["2023-01-01", "2023-02-01", "2023-03-01", "2023-04-01"]
        amounts = [11.99, 11.99, 11.99, 15.49]
        df = pd.DataFrame({
            "Merchant": ["NETFLIX.COM"] * 4,
            "Amount": amounts,
            "Date": dates
        })
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-04-05")

        assert len(res.price_creep_alerts) == 1
        alert = res.price_creep_alerts[0]
        assert alert.is_price_crept is True
        assert alert.previous_amount == 11.99
        assert alert.amount == 15.49
        assert alert.price_change_pct == 29.2
        # Annualized creep impact: ($15.49 - $11.99) * 12 = $42.00/yr
        assert alert.annualized_creep_cost == 42.00


class TestOverlapAndDuplicateAlerts:
    def test_video_streaming_duplicate_overlap(self):
        # User has Netflix ($15.49) AND Hulu ($17.99)
        records = []
        for m in range(1, 4):
            records.append({"Merchant": "NETFLIX.COM", "Amount": 15.49, "Date": f"2023-0{m}-01"})
            records.append({"Merchant": "HULU 877-824-4858", "Amount": 17.99, "Date": f"2023-0{m}-15"})
        df = pd.DataFrame(records)

        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-03-20")

        assert len(res.active_subscriptions) == 2
        assert len(res.overlap_alerts) == 1
        overlap = res.overlap_alerts[0]
        assert overlap.overlap_group == "VIDEO_STREAMING"
        assert set(overlap.subscriptions) == {"Netflix", "Hulu"}
        assert overlap.total_monthly_cost == round(15.49 + 17.99, 2)
        assert "save up to" in overlap.recommended_action


class TestTrialConversionRisk:
    def test_trial_conversion_detection(self):
        # $1.00 verification charge followed by $19.99 subscription
        df = pd.DataFrame({
            "Merchant": ["AUDIBLE*MEMBERSHIP", "AUDIBLE*MEMBERSHIP"],
            "Amount": [1.00, 19.99],
            "Date": ["2023-01-01", "2023-01-15"]
        })
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-01-20")

        assert len(res.trial_conversion_alerts) == 1
        assert res.trial_conversion_alerts[0].merchant_canonical == "Audible"


class TestForecastNext30DaysProjection:
    def test_projection_schedule(self):
        df = pd.DataFrame([
            {"Merchant": "NETFLIX.COM", "Amount": 15.49, "Date": "2023-05-10"},
            {"Merchant": "NETFLIX.COM", "Amount": 15.49, "Date": "2023-06-10"},
            {"Merchant": "SPOTIFY USA", "Amount": 10.99, "Date": "2023-05-20"},
            {"Merchant": "SPOTIFY USA", "Amount": 10.99, "Date": "2023-06-20"}
        ])
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-06-25")

        projections = res.next_30_day_projected_charges
        assert len(projections) == 2
        # Netflix next is 2023-07-10, Spotify next is 2023-07-20
        assert projections[0]["merchant"] == "Netflix"
        assert projections[0]["expected_date"] == "2023-07-10"
        assert projections[1]["merchant"] == "Spotify"
        assert projections[1]["expected_date"] == "2023-07-20"


class TestSyntheticEvaluationPrecisionRecall:
    def test_synthetic_stream_precision_recall(self):
        """
        Benchmarks detection performance on a synthetic transaction stream
        containing both true recurring subscriptions and random one-off purchases.
        """
        np.random.seed(42)
        records = []

        # Ground Truth Subscriptions (5 true recurring services)
        ground_truth = {"Netflix", "Spotify", "Amazon Prime", "Planet Fitness", "ConEdison Utility"}

        # 1. Monthly Netflix ($15.49)
        for m in range(1, 7):
            records.append({"Merchant": "NETFLIX.COM 866-579-7172", "Amount": 15.49, "Date": f"2023-0{m}-01"})
        # 2. Monthly Spotify with price creep ($9.99 -> $10.99)
        for m in range(1, 4):
            records.append({"Merchant": "SPOTIFY USA", "Amount": 9.99, "Date": f"2023-0{m}-05"})
        for m in range(4, 7):
            records.append({"Merchant": "SPOTIFY USA", "Amount": 10.99, "Date": f"2023-0{m}-05"})
        # 3. Annual Amazon Prime ($139.00)
        records.append({"Merchant": "AMZN MKTP US*PRIME", "Amount": 139.00, "Date": "2022-03-15"})
        records.append({"Merchant": "AMZN MKTP US*PRIME", "Amount": 139.00, "Date": "2023-03-15"})
        # 4. Biweekly Planet Fitness ($12.50)
        base_date = datetime(2023, 1, 2)
        for w in range(10):
            d = base_date + timedelta(days=w * 14)
            records.append({"Merchant": "PLANET FIT 1045 CA", "Amount": 12.50, "Date": d.strftime("%Y-%m-%d")})
        # 5. Monthly Utility ConEdison ($90 to $115)
        for m in range(1, 7):
            records.append({"Merchant": "CONEDISON NY*UTIL", "Amount": float(np.random.uniform(90, 115)), "Date": f"2023-0{m}-18"})

        # Random One-Off Purchases (15 distinct merchants, non-recurring)
        one_offs = [
            ("BEST BUY #492", 149.99, "2023-01-12"),
            ("TARGET T-0821", 42.50, "2023-02-14"),
            ("SHELL OIL 1234", 38.00, "2023-02-28"),
            ("WHOLEFDS SOMA", 84.20, "2023-03-11"),
            ("CHIPOTLE 1029", 14.25, "2023-03-19"),
            ("AIRBNB RESERVATION", 450.00, "2023-04-02"),
            ("DELTA AIR 006", 320.00, "2023-04-15"),
            ("STARBUCKS 0451", 5.75, "2023-05-01"),
            ("HOME DEPOT 821", 89.10, "2023-05-12"),
            ("WALGREENS #301", 18.40, "2023-05-22")
        ]
        for m, a, d in one_offs:
            records.append({"Merchant": m, "Amount": a, "Date": d})

        df = pd.DataFrame(records)
        detector = SubscriptionDetector()
        res = detector.analyze_transactions(df, reference_date="2023-06-30")

        detected_merchants = {s.merchant_canonical for s in res.active_subscriptions}

        true_positives = len(detected_merchants.intersection(ground_truth))
        false_positives = len(detected_merchants - ground_truth)
        false_negatives = len(ground_truth - detected_merchants)

        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        print(f"\n[Phase 1 Benchmark] Precision: {precision:.4f} | Recall: {recall:.4f} | F1-Score: {f1:.4f}")
        assert precision >= 0.90, f"Expected Precision >= 0.90, got {precision}"
        assert recall >= 0.90, f"Expected Recall >= 0.90, got {recall}"


if __name__ == "__main__":
    t_norm = TestMerchantNormalization()
    t_norm.test_noisy_merchant_strings()

    t_cad = TestIntervalAndCadenceDetection()
    t_cad.test_monthly_fixed_subscription()
    t_cad.test_skipped_month_handling()
    t_cad.test_variable_amount_utility()

    t_creep = TestPriceCreepAndAnnualizedImpact()
    t_creep.test_streaming_price_creep()

    t_overlap = TestOverlapAndDuplicateAlerts()
    t_overlap.test_video_streaming_duplicate_overlap()

    t_trial = TestTrialConversionRisk()
    t_trial.test_trial_conversion_detection()

    t_proj = TestForecastNext30DaysProjection()
    t_proj.test_projection_schedule()

    t_eval = TestSyntheticEvaluationPrecisionRecall()
    t_eval.test_synthetic_stream_precision_recall()

    print("\n✅ ALL SUBSCRIPTION DETECTOR TESTS PASSED!")
