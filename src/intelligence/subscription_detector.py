"""
Recurring Subscription & Bill Detection Engine for FinSense.

Answers:
1. "What recurring commitments am I locked into?"
2. "Where is price creep draining my cash?"
3. "Which duplicate/overlapping subscriptions can I eliminate?"
4. "What exact bills are hitting my account in the next 30 days?"

Positioning:
Unlike Rocket Money which merely lists subscriptions for manual cancellation,
FinSense classifies essential vs. discretionary commitments, projects exact future
charge dates, calculates annualized creep impact, and directly feeds upcoming
outflows into the forward cash-flow forecasting engine.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple
import re
import numpy as np
import pandas as pd


class CadenceType(str, Enum):
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"
    MONTHLY_VARIABLE_UTILITY = "MONTHLY_VARIABLE_UTILITY"
    UNKNOWN = "UNKNOWN"


class SubscriptionCategory(str, Enum):
    VIDEO_STREAMING = "VIDEO_STREAMING"
    AUDIO_STREAMING = "AUDIO_STREAMING"
    CLOUD_STORAGE = "CLOUD_STORAGE"
    FITNESS = "FITNESS"
    DELIVERY_PASS = "DELIVERY_PASS"
    SOFTWARE_SAAS = "SOFTWARE_SAAS"
    GAMING = "GAMING"
    UTILITY = "UTILITY"
    TELECOM_INTERNET = "TELECOM_INTERNET"
    INSURANCE = "INSURANCE"
    MEMBERSHIP = "MEMBERSHIP"
    OTHER_DISCRETIONARY = "OTHER_DISCRETIONARY"
    OTHER_ESSENTIAL = "OTHER_ESSENTIAL"


@dataclass
class SubscriptionItem:
    """
    Structured representation of a detected recurring commitment.
    """
    subscription_id: str
    merchant_raw: str
    merchant_canonical: str
    category: SubscriptionCategory
    cadence: CadenceType
    amount: float                       # Most recent charged amount ($)
    previous_amount: Optional[float]     # Previous cycle amount if known ($)
    price_change_pct: float              # % change between last two cycles
    annualized_cost: float               # Projected annual outlay ($)
    annualized_creep_cost: float         # Added annual cost due to price creep ($)
    is_essential: bool                   # True = utility/insurance; False = discretionary
    is_price_crept: bool                 # True if price increased by >= 3%
    is_trial_conversion_risk: bool       # True if recent conversion or first full billing
    overlap_group: Optional[str]         # Identifies redundant categories (e.g., video streaming)
    confidence: float                    # 0.0 to 1.0 confidence score
    reason: str                          # Plain-language explanation of detection logic
    last_charge_date: str                # YYYY-MM-DD
    next_expected_date: str              # YYYY-MM-DD (feeds cash-flow forecast)
    cycle_days_median: float             # Median interval in days
    amount_cv: float                     # Coefficient of variation of amount
    charge_count: int                    # Number of historical occurrences observed

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['category'] = self.category.value
        data['cadence'] = self.cadence.value
        return data


@dataclass
class OverlapAlert:
    """
    Alert flagging redundant subscriptions in the same category cluster.
    """
    overlap_group: str
    category: str
    subscriptions: List[str]             # List of canonical merchant names
    total_monthly_cost: float
    total_annual_cost: float
    recommended_action: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SubscriptionAnalysisResult:
    """
    Comprehensive output of subscription and recurring commitment scan.
    """
    active_subscriptions: List[SubscriptionItem]
    price_creep_alerts: List[SubscriptionItem]
    overlap_alerts: List[OverlapAlert]
    trial_conversion_alerts: List[SubscriptionItem]
    total_monthly_commitment: float
    total_annual_commitment: float
    essential_monthly_cost: float
    discretionary_monthly_cost: float
    discretionary_annual_savings_potential: float
    next_30_day_projected_charges: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "active_subscriptions": [s.to_dict() for s in self.active_subscriptions],
            "price_creep_alerts": [s.to_dict() for s in self.price_creep_alerts],
            "overlap_alerts": [o.to_dict() for o in self.overlap_alerts],
            "trial_conversion_alerts": [t.to_dict() for t in self.trial_conversion_alerts],
            "total_monthly_commitment": round(self.total_monthly_commitment, 2),
            "total_annual_commitment": round(self.total_annual_commitment, 2),
            "essential_monthly_cost": round(self.essential_monthly_cost, 2),
            "discretionary_monthly_cost": round(self.discretionary_monthly_cost, 2),
            "discretionary_annual_savings_potential": round(self.discretionary_annual_savings_potential, 2),
            "next_30_day_projected_charges": self.next_30_day_projected_charges
        }


# =============================================================================
# MERCHANT NORMALIZATION & TAXONOMY CATALOG
# =============================================================================

KNOWN_SUBSCRIPTIONS = {
    # Video Streaming
    "netflix": ("Netflix", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "hulu": ("Hulu", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "disney plus": ("Disney+", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "disney+": ("Disney+", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "hbo max": ("Max (HBO)", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "max.com": ("Max (HBO)", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "paramount+": ("Paramount+", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "paramount plus": ("Paramount+", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "apple tv": ("Apple TV+", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "peacock": ("Peacock", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "prime video": ("Amazon Prime Video", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),
    "youtube tv": ("YouTube TV", SubscriptionCategory.VIDEO_STREAMING, False, "VIDEO_STREAMING"),

    # Audio Streaming
    "spotify": ("Spotify", SubscriptionCategory.AUDIO_STREAMING, False, "AUDIO_STREAMING"),
    "apple music": ("Apple Music", SubscriptionCategory.AUDIO_STREAMING, False, "AUDIO_STREAMING"),
    "pandora": ("Pandora", SubscriptionCategory.AUDIO_STREAMING, False, "AUDIO_STREAMING"),
    "tidal": ("Tidal", SubscriptionCategory.AUDIO_STREAMING, False, "AUDIO_STREAMING"),
    "audible": ("Audible", SubscriptionCategory.AUDIO_STREAMING, False, "AUDIO_STREAMING"),

    # Cloud Storage & Productivity
    "google one": ("Google One", SubscriptionCategory.CLOUD_STORAGE, False, "CLOUD_STORAGE"),
    "google storage": ("Google One", SubscriptionCategory.CLOUD_STORAGE, False, "CLOUD_STORAGE"),
    "icloud": ("Apple iCloud", SubscriptionCategory.CLOUD_STORAGE, False, "CLOUD_STORAGE"),
    "apple.com": ("Apple Services", SubscriptionCategory.SOFTWARE_SAAS, False, None),
    "apple bill": ("Apple Services", SubscriptionCategory.SOFTWARE_SAAS, False, None),
    "dropbox": ("Dropbox", SubscriptionCategory.CLOUD_STORAGE, False, "CLOUD_STORAGE"),
    "microsoft 365": ("Microsoft 365", SubscriptionCategory.SOFTWARE_SAAS, False, "OFFICE_SUITE"),
    "github": ("GitHub", SubscriptionCategory.SOFTWARE_SAAS, False, None),
    "chatgpt": ("OpenAI ChatGPT", SubscriptionCategory.SOFTWARE_SAAS, False, "AI_SUBSCRIPTION"),
    "claude.ai": ("Anthropic Claude", SubscriptionCategory.SOFTWARE_SAAS, False, "AI_SUBSCRIPTION"),
    "notion": ("Notion", SubscriptionCategory.SOFTWARE_SAAS, False, None),

    # Delivery & Retail Memberships
    "doordash": ("DoorDash DashPass", SubscriptionCategory.DELIVERY_PASS, False, "DELIVERY_PASS"),
    "dashpass": ("DoorDash DashPass", SubscriptionCategory.DELIVERY_PASS, False, "DELIVERY_PASS"),
    "uber one": ("Uber One", SubscriptionCategory.DELIVERY_PASS, False, "DELIVERY_PASS"),
    "ubereats": ("Uber One", SubscriptionCategory.DELIVERY_PASS, False, "DELIVERY_PASS"),
    "instacart": ("Instacart+", SubscriptionCategory.DELIVERY_PASS, False, "DELIVERY_PASS"),
    "walmart+": ("Walmart+", SubscriptionCategory.MEMBERSHIP, False, "RETAIL_MEMBERSHIP"),
    "walmart plus": ("Walmart+", SubscriptionCategory.MEMBERSHIP, False, "RETAIL_MEMBERSHIP"),
    "amazon prime": ("Amazon Prime", SubscriptionCategory.MEMBERSHIP, False, "RETAIL_MEMBERSHIP"),
    "amzn mktp": ("Amazon Prime", SubscriptionCategory.MEMBERSHIP, False, "RETAIL_MEMBERSHIP"),
    "amzn prime": ("Amazon Prime", SubscriptionCategory.MEMBERSHIP, False, "RETAIL_MEMBERSHIP"),
    "costco": ("Costco Membership", SubscriptionCategory.MEMBERSHIP, False, "WHOLESALE_CLUB"),

    # Fitness & Gym
    "planet fitness": ("Planet Fitness", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),
    "planet fit": ("Planet Fitness", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),
    "equinox": ("Equinox", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),
    "la fitness": ("LA Fitness", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),
    "peloton": ("Peloton", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),
    "anytime fitness": ("Anytime Fitness", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),
    "classpass": ("ClassPass", SubscriptionCategory.FITNESS, False, "GYM_FITNESS"),

    # Utilities (Essential)
    "conedison": ("ConEdison Utility", SubscriptionCategory.UTILITY, True, None),
    "pg&e": ("PG&E Electric & Gas", SubscriptionCategory.UTILITY, True, None),
    "pacific gas": ("PG&E Electric & Gas", SubscriptionCategory.UTILITY, True, None),
    "duke energy": ("Duke Energy", SubscriptionCategory.UTILITY, True, None),
    "national grid": ("National Grid", SubscriptionCategory.UTILITY, True, None),
    "water dept": ("Municipal Water Service", SubscriptionCategory.UTILITY, True, None),
    "city water": ("Municipal Water Service", SubscriptionCategory.UTILITY, True, None),

    # Telecom & Internet (Essential)
    "verizon": ("Verizon Wireless / Fios", SubscriptionCategory.TELECOM_INTERNET, True, None),
    "at&t": ("AT&T Mobility / Internet", SubscriptionCategory.TELECOM_INTERNET, True, None),
    "t-mobile": ("T-Mobile", SubscriptionCategory.TELECOM_INTERNET, True, None),
    "comcast": ("Xfinity Comcast Internet", SubscriptionCategory.TELECOM_INTERNET, True, None),
    "xfinity": ("Xfinity Comcast Internet", SubscriptionCategory.TELECOM_INTERNET, True, None),
    "charter": ("Spectrum Internet", SubscriptionCategory.TELECOM_INTERNET, True, None),
    "spectrum": ("Spectrum Internet", SubscriptionCategory.TELECOM_INTERNET, True, None),

    # Insurance (Essential)
    "geico": ("GEICO Auto/Home Insurance", SubscriptionCategory.INSURANCE, True, None),
    "state farm": ("State Farm Insurance", SubscriptionCategory.INSURANCE, True, None),
    "progressive": ("Progressive Insurance", SubscriptionCategory.INSURANCE, True, None),
    "allstate": ("Allstate Insurance", SubscriptionCategory.INSURANCE, True, None),
    "lemonade": ("Lemonade Insurance", SubscriptionCategory.INSURANCE, True, None)
}


class SubscriptionDetector:
    """
    Scans transaction ledgers to detect recurring subscriptions, cadence, price creep,
    and duplicate overlaps.
    """

    def __init__(
        self,
        min_occurrences: int = 2,
        max_amount_cv: float = 0.35,
        price_creep_threshold_pct: float = 3.0
    ):
        self.min_occurrences = min_occurrences
        self.max_amount_cv = max_amount_cv
        self.price_creep_threshold_pct = price_creep_threshold_pct

    @classmethod
    def normalize_merchant_name(cls, raw_name: str) -> str:
        """
        Cleans noisy billing strings (e.g., 'NETFLIX.COM* 866-579-7172 CA' -> 'Netflix').
        """
        if not raw_name or not isinstance(raw_name, str):
            return "Unknown Merchant"

        name = raw_name.lower().strip()

        # Remove common payment processor noise and web artifacts
        name = re.sub(r'https?://\S+|www\.\S+', '', name)
        name = re.sub(r'\b(llc|inc|corp|co|ltd|com|net|org)\b', '', name)
        # Remove phone numbers like 866-579-7172 or 8001234567
        name = re.sub(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', '', name)
        name = re.sub(r'\b\d{7,12}\b', '', name)
        # Remove terminal/store IDs like #1234, *1234, STORE 054
        name = re.sub(r'[#*]\S+', ' ', name)
        name = re.sub(r'\bstore\s+\d+\b', ' ', name)
        # Remove state abbreviations at the end like 'CA', 'NY', 'WA'
        name = re.sub(r'\s+[a-z]{2}$', '', name)
        # Remove trailing transaction location codes or asterisks
        name = re.sub(r'[^a-z0-9&+\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()

        # Check against known subscription catalog
        for keyword, meta in KNOWN_SUBSCRIPTIONS.items():
            if keyword in name:
                return meta[0]

        # Generic title case fallback
        return name.title() if name else "Uncategorized Merchant"

    @classmethod
    def classify_merchant(cls, canonical_name: str, mcc: Optional[int] = None) -> Tuple[SubscriptionCategory, bool, Optional[str]]:
        """
        Returns (category, is_essential, overlap_group)
        """
        low_name = canonical_name.lower()
        for keyword, meta in KNOWN_SUBSCRIPTIONS.items():
            if keyword in low_name or meta[0].lower() == low_name:
                return meta[1], meta[2], meta[3]

        # MCC Heuristics
        if mcc is not None:
            if mcc in [4900, 4911, 4922, 4931]:  # Utilities (electric, gas, water)
                return SubscriptionCategory.UTILITY, True, None
            if mcc in [4814, 4816, 4899]:         # Telecom / Cable
                return SubscriptionCategory.TELECOM_INTERNET, True, None
            if mcc in [6300]:                     # Insurance
                return SubscriptionCategory.INSURANCE, True, None

        # Generic fallback
        return SubscriptionCategory.OTHER_DISCRETIONARY, False, None

    @classmethod
    def determine_cadence(cls, intervals: List[float], amount_cv: float) -> Tuple[CadenceType, float]:
        """
        Determines the recurring interval type and typical cycle duration in days.
        """
        if not intervals:
            return CadenceType.UNKNOWN, 0.0

        median_interval = float(np.median(intervals))

        # Check Weekly (5 to 9 days)
        if 5.0 <= median_interval <= 9.0:
            return CadenceType.WEEKLY, 7.0

        # Check Bi-Weekly (12 to 17 days)
        if 12.0 <= median_interval <= 17.0:
            return CadenceType.BIWEEKLY, 14.0

        # Check Monthly (26 to 35 days)
        if 26.0 <= median_interval <= 35.0:
            if amount_cv > 0.15:
                return CadenceType.MONTHLY_VARIABLE_UTILITY, 30.0
            return CadenceType.MONTHLY, 30.0

        # Check Quarterly (80 to 100 days)
        if 80.0 <= median_interval <= 100.0:
            return CadenceType.QUARTERLY, 91.25

        # Check Annual (350 to 380 days)
        if 350.0 <= median_interval <= 380.0:
            return CadenceType.ANNUAL, 365.0

        # Check for skipped monthly charges (e.g. interval ~ 55 to 65 days with 1 missed charge)
        if 55.0 <= median_interval <= 65.0:
            return CadenceType.MONTHLY, 30.0

        return CadenceType.UNKNOWN, median_interval

    @classmethod
    def calculate_annualized_cost(cls, amount: float, cadence: CadenceType) -> float:
        """
        Converts recurring charge into annualized commitment.
        """
        if cadence == CadenceType.WEEKLY:
            return amount * 52.0
        elif cadence == CadenceType.BIWEEKLY:
            return amount * 26.0
        elif cadence in [CadenceType.MONTHLY, CadenceType.MONTHLY_VARIABLE_UTILITY]:
            return amount * 12.0
        elif cadence == CadenceType.QUARTERLY:
            return amount * 4.0
        elif cadence == CadenceType.ANNUAL:
            return amount * 1.0
        return amount * 12.0  # Default to monthly assumption

    def analyze_transactions(
        self,
        df_transactions: pd.DataFrame,
        reference_date: Optional[str] = None,
        currency_symbol: str = "₹"
    ) -> SubscriptionAnalysisResult:
        """
        Main entrypoint: Scans transaction history, detects all recurring charges,
        identifies price creep, detects duplicate overlaps, and projects the next 30 days.

        Args:
            df_transactions: DataFrame containing columns:
                - 'Merchant' or 'Merchant Name'
                - 'Amount' (float)
                - 'Date' or 'timestamp' (datetime or string YYYY-MM-DD)
                - 'MCC' (optional)
            reference_date: Optional reference date string (YYYY-MM-DD). Defaults to latest transaction date.
        """
        df = df_transactions.copy()

        # Standardize merchant column
        merchant_col = 'Merchant Name' if 'Merchant Name' in df.columns else ('Merchant' if 'Merchant' in df.columns else None)
        if merchant_col is None:
            raise ValueError("Transactions DataFrame must contain 'Merchant' or 'Merchant Name' column.")

        # Clean Amount
        if not pd.api.types.is_numeric_dtype(df['Amount']):
            df['Amount'] = (
                df['Amount'].astype(str)
                .str.replace('$', '', regex=False)
                .str.replace(',', '', regex=False)
                .str.strip()
            )
            df['Amount'] = pd.to_numeric(df['Amount'], errors='coerce').fillna(0.0)
        df['Amount'] = df['Amount'].astype(float).abs()

        # Standardize date
        if 'timestamp' not in df.columns:
            if 'Date' in df.columns:
                df['timestamp'] = pd.to_datetime(df['Date'], errors='coerce')
            elif {'Year', 'Month', 'Day'}.issubset(df.columns):
                df['timestamp'] = pd.to_datetime(dict(year=df['Year'], month=df['Month'], day=df['Day']), errors='coerce')
            else:
                raise ValueError("DataFrame must contain 'timestamp', 'Date', or 'Year'/'Month'/'Day' columns.")

        df = df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
        if df.empty:
            return self._empty_result()

        ref_dt = pd.to_datetime(reference_date) if reference_date else df['timestamp'].max()

        # Add canonical merchant name
        df['canonical_merchant'] = df[merchant_col].apply(self.normalize_merchant_name)

        active_subscriptions: List[SubscriptionItem] = []
        price_creep_alerts: List[SubscriptionItem] = []
        trial_alerts: List[SubscriptionItem] = []

        # Group by canonical merchant
        grouped = df.groupby('canonical_merchant')

        for canonical_name, group in grouped:
            if len(group) < self.min_occurrences:
                continue

            amounts = group['Amount'].values
            dates = group['timestamp'].dt.date.values
            mccs = group['MCC'].values if 'MCC' in group.columns else None
            mcc = int(mccs[-1]) if mccs is not None and pd.notna(mccs[-1]) else None

            # Calculate intervals between consecutive occurrences
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates) - 1)]
            intervals = [d for d in intervals if d > 0]  # Exclude same-day multiple purchases

            if not intervals:
                continue

            mean_amount = float(np.mean(amounts))
            std_amount = float(np.std(amounts))
            amount_cv = (std_amount / mean_amount) if mean_amount > 0 else 0.0

            cadence, cycle_days = self.determine_cadence(intervals, amount_cv)

            # If cadence cannot be established, skip
            if cadence == CadenceType.UNKNOWN:
                continue

            # Check variation filter: utilities can have higher CV, but fixed subs must be tight
            category, is_essential, overlap_group = self.classify_merchant(canonical_name, mcc)
            if category == SubscriptionCategory.UTILITY and cadence == CadenceType.MONTHLY and amount_cv > 0.05:
                cadence = CadenceType.MONTHLY_VARIABLE_UTILITY

            # Detect trial conversion pattern: verification / trial charge followed by full subscription
            is_trial = False
            if len(amounts) == 2 and amounts[0] <= 2.00 and amounts[1] >= 5.00:
                is_trial = True

            if not is_essential and not is_trial and amount_cv > self.max_amount_cv:
                continue

            latest_amount = float(amounts[-1])
            prev_amount = float(amounts[-2]) if len(amounts) >= 2 else None
            last_date = dates[-1]

            # Price creep calculation
            is_crept = False
            price_change_pct = 0.0
            annualized_creep = 0.0

            if prev_amount is not None and prev_amount > 0:
                price_change_pct = ((latest_amount - prev_amount) / prev_amount) * 100.0
                if price_change_pct >= self.price_creep_threshold_pct:
                    is_crept = True
                    annual_freq = 52.0 if cadence == CadenceType.WEEKLY else (
                        26.0 if cadence == CadenceType.BIWEEKLY else (
                            12.0 if cadence in [CadenceType.MONTHLY, CadenceType.MONTHLY_VARIABLE_UTILITY] else (
                                4.0 if cadence == CadenceType.QUARTERLY else 1.0
                            )
                        )
                    )
                    annualized_creep = (latest_amount - prev_amount) * annual_freq

            # Next expected date
            next_date = last_date + timedelta(days=int(cycle_days))
            # If next date has already passed, project forward to future cycle relative to ref_dt
            ref_date_only = ref_dt.date() if isinstance(ref_dt, pd.Timestamp) else ref_dt
            while next_date < ref_date_only:
                next_date += timedelta(days=int(cycle_days))

            # Confidence score calculation
            # Based on number of occurrences, low CV, and known merchant taxonomy match
            occurrences_score = min(1.0, len(group) / 4.0)
            cv_score = max(0.0, 1.0 - (amount_cv / self.max_amount_cv))
            is_known = 0.2 if canonical_name in [v[0] for v in KNOWN_SUBSCRIPTIONS.values()] else 0.0
            confidence = min(1.0, (occurrences_score * 0.5) + (cv_score * 0.3) + is_known)

            # Annualized commitment
            annualized_cost = self.calculate_annualized_cost(latest_amount, cadence)

            reason_str = (
                f"Detected {cadence.value.replace('_', ' ').lower()} charge of {currency_symbol}{latest_amount:.2f} "
                f"across {len(group)} cycles (CV: {amount_cv:.2f})."
            )
            if is_crept:
                reason_str += f" Price increased by +{price_change_pct:.1f}% (+{currency_symbol}{annualized_creep:.2f}/yr impact)."

            sub_item = SubscriptionItem(
                subscription_id=f"sub_{canonical_name.lower().replace(' ', '_')}",
                merchant_raw=str(group[merchant_col].iloc[-1]),
                merchant_canonical=canonical_name,
                category=category,
                cadence=cadence,
                amount=round(latest_amount, 2),
                previous_amount=round(prev_amount, 2) if prev_amount else None,
                price_change_pct=round(price_change_pct, 1),
                annualized_cost=round(annualized_cost, 2),
                annualized_creep_cost=round(annualized_creep, 2),
                is_essential=is_essential,
                is_price_crept=is_crept,
                is_trial_conversion_risk=is_trial,
                overlap_group=overlap_group,
                confidence=round(confidence, 2),
                reason=reason_str,
                last_charge_date=last_date.strftime("%Y-%m-%d"),
                next_expected_date=next_date.strftime("%Y-%m-%d"),
                cycle_days_median=round(cycle_days, 1),
                amount_cv=round(amount_cv, 3),
                charge_count=len(group)
            )

            active_subscriptions.append(sub_item)
            if is_crept:
                price_creep_alerts.append(sub_item)
            if is_trial:
                trial_alerts.append(sub_item)

        # Overlap / Duplicate detection across active discretionary subscriptions
        overlap_alerts: List[OverlapAlert] = []
        cluster_map: Dict[str, List[SubscriptionItem]] = {}
        for sub in active_subscriptions:
            if sub.overlap_group and not sub.is_essential:
                cluster_map.setdefault(sub.overlap_group, []).append(sub)

        for group_name, subs in cluster_map.items():
            if len(subs) > 1:
                monthly_total = sum(s.annualized_cost / 12.0 for s in subs)
                annual_total = sum(s.annualized_cost for s in subs)
                names = [s.merchant_canonical for s in subs]
                action = (
                    f"You have {len(subs)} overlapping {group_name.replace('_', ' ').lower()} subscriptions "
                    f"({', '.join(names)}) totaling {currency_symbol}{monthly_total:.2f}/mo. "
                    f"Consolidating to 1 service could save up to {currency_symbol}{(annual_total - (annual_total / len(subs))):.2f}/year."
                )
                overlap_alerts.append(OverlapAlert(
                    overlap_group=group_name,
                    category=subs[0].category.value,
                    subscriptions=names,
                    total_monthly_cost=round(monthly_total, 2),
                    total_annual_cost=round(annual_total, 2),
                    recommended_action=action
                ))

        # Sort subscriptions: essential first, then by annualized cost descending
        active_subscriptions.sort(key=lambda s: (not s.is_essential, -s.annualized_cost))

        # Financial totals
        total_annual = sum(s.annualized_cost for s in active_subscriptions)
        total_monthly = total_annual / 12.0
        essential_annual = sum(s.annualized_cost for s in active_subscriptions if s.is_essential)
        discretionary_annual = total_annual - essential_annual

        # 30-Day Forward Projections (feeds cash-flow forecast)
        next_30_days_charges = []
        ref_date = ref_dt.date() if isinstance(ref_dt, pd.Timestamp) else ref_dt
        window_end = ref_date + timedelta(days=30)

        for sub in active_subscriptions:
            curr_exp = datetime.strptime(sub.next_expected_date, "%Y-%m-%d").date()
            while curr_exp <= window_end:
                if curr_exp >= ref_date:
                    next_30_days_charges.append({
                        "subscription_id": sub.subscription_id,
                        "merchant": sub.merchant_canonical,
                        "amount": sub.amount,
                        "expected_date": curr_exp.strftime("%Y-%m-%d"),
                        "category": sub.category.value,
                        "is_essential": sub.is_essential
                    })
                curr_exp += timedelta(days=int(sub.cycle_days_median))

        next_30_days_charges.sort(key=lambda x: x["expected_date"])

        return SubscriptionAnalysisResult(
            active_subscriptions=active_subscriptions,
            price_creep_alerts=price_creep_alerts,
            overlap_alerts=overlap_alerts,
            trial_conversion_alerts=trial_alerts,
            total_monthly_commitment=round(total_monthly, 2),
            total_annual_commitment=round(total_annual, 2),
            essential_monthly_cost=round(essential_annual / 12.0, 2),
            discretionary_monthly_cost=round(discretionary_annual / 12.0, 2),
            discretionary_annual_savings_potential=round(discretionary_annual, 2),
            next_30_day_projected_charges=next_30_days_charges
        )

    def _empty_result(self) -> SubscriptionAnalysisResult:
        return SubscriptionAnalysisResult(
            active_subscriptions=[],
            price_creep_alerts=[],
            overlap_alerts=[],
            trial_conversion_alerts=[],
            total_monthly_commitment=0.0,
            total_annual_commitment=0.0,
            essential_monthly_cost=0.0,
            discretionary_monthly_cost=0.0,
            discretionary_annual_savings_potential=0.0,
            next_30_day_projected_charges=[]
        )
