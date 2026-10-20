"""
Transaction Normalizer for FinSense.

Provides robust string cleaning, processor prefix removal, UPI narration extraction,
and taxonomy harmonization to map raw statements into FinSense canonical categories.
"""

import re
from typing import Tuple, Optional, List, Union


class TransactionNormalizer:
    """
    Cleans raw transaction descriptions and categorizes transactions consistently.
    """

    # Known payment processor / gateway prefixes to strip
    PROCESSOR_PREFIXES = [
        r"^SQUARE\s*\*\s*",
        r"^SQ\s*\*\s*",
        r"^TST\s*\*\s*",             # Toast POS
        r"^PAYPAL\s*\*\s*",
        r"^AMZN\s*MKTP\s*(US\*)?\s*",
        r"^AMAZON\.COM\*\s*",
        r"^SP\s*\*\s*",              # Shopify
        r"^GOOGLE\s*\*\s*",
        r"^APPLE\.COM/BILL\s*",
        r"^APL\*\s*",
        r"^VENMO\s*\*\s*",
        r"^STRIPE\s*\*\s*",
        r"^CHECKCARD\s+\d+\s*",
        r"^POS\s+PURCHASE\s*",
        r"^DEBIT\s+CARD\s+PURCHASE\s*",
        r"^ACH\s+DEBIT\s*",
        r"^ACH\s+ELECTRONIC\s+CREDIT\s*",
    ]

    # Trailing noise patterns (store numbers, phone numbers, state codes)
    TRAILING_NOISE_PATTERNS = [
        r"\s*#\s*\d+",                          # #1234
        r"\s+STORE\s+\d+",                      # STORE 456
        r"\s+LOC\s*#?\s*\d+",                   # LOC 789
        r"\s+\d{3}-\d{3}-\d{4}",                # 800-123-4567
        r"\s+[A-Z]{2}\s+\d{5}(-\d{4})?$",       # CA 94103
        r"\s+[A-Z]{2}\s*$",                     # State code at end: CA, NY, TX
        r"\.COM(\s+|$)",                        # .COM
    ]

    # Category keyword heuristic mapping
    CATEGORY_KEYWORDS = {
        "Income": [
            "payroll", "direct dep", "salary", "stipend", "bonus", "dividend",
            "interest earned", "tax refund", "irs treas", "reimbursement"
        ],
        "Housing & Rent": [
            "rent", "mortgage", "apartments", "realty", "hoa fee", "leasing", "property mgmt"
        ],
        "Utilities & Bills": [
            "electric", "water", "gas service", "pge", "coned", "national grid",
            "at&t", "verizon", "t-mobile", "comcast", "xfinity", "spectrum", "internet", "trash"
        ],
        "Subscriptions": [
            "netflix", "spotify", "hulu", "disney", "apple music", "youtube premium",
            "gym", "fitness", "planet fitness", "equinox", "nyt", "audible", "icloud",
            "amazon prime", "patreon", "substack", "hbo", "peacock"
        ],
        "Food & Dining": [
            "restaurant", "cafe", "coffee", "starbucks", "dunkin", "mcdonald", "chipotle",
            "burger", "pizza", "doordash", "ubereats", "grubhub", "postmates", "instacart",
            "grocery", "supermarket", "whole foods", "trader joe", "kroger", "safeway", "swiggy", "zomato"
        ],
        "Transportation": [
            "uber", "lyft", "taxi", "metro", "transit", "subway", "train", "amtrak",
            "gas station", "shell", "chevron", "bp oil", "exxon", "mobil", "parking", "toll"
        ],
        "Shopping & Personal": [
            "target", "walmart", "amazon", "best buy", "costco", "cvs", "walgreens",
            "pharmacy", "clothing", "apparel", "zara", "nike", "sephora", "ulta"
        ],
        "Financial & Transfers": [
            "transfer", "wire", "atm withdrawal", "credit card payment", "venmo transfer",
            "cash app", "zelle", "brokerage", "fidelity", "vanguard", "schwab", "robinhood"
        ]
    }

    @classmethod
    def clean_merchant_name(cls, raw_text: str) -> str:
        """
        Extracts clean merchant name from raw statement string.
        Handles US card processor syntax and Indian UPI strings.
        """
        if not raw_text or not isinstance(raw_text, str):
            return "Unknown Merchant"

        text = raw_text.strip()

        # 1. Handle Indian UPI narration formats:
        # e.g., "UPI/4123891283/Zomato/zomato@hdfcbank/UPI" or "UPI-ZOMATO-PAYTM..." or "UPI/DOMINOSPIZ/..."
        if text.upper().startswith("UPI/") or text.upper().startswith("UPI-"):
            parts = [p.strip() for p in re.split(r"[/_-]", text) if p.strip()]
            for p in parts[1:]:
                p_clean = p.strip()
                if len(p_clean) >= 3 and not p_clean.isdigit() and "@" not in p_clean and not re.match(r"^(UPI|PAYTM|INTENT|REMARKS|NO REMARKS|PAID|SENT|YES|HDFC|ICICI|SBI|CANARA|FEDERAL|INDIAN BAN|AIRTEL|AXIS)$", p_clean, re.IGNORECASE):
                    # Check known brands
                    p_up = p_clean.upper()
                    if "DOMINOS" in p_up: return "Domino's Pizza"
                    if "BLINKIT" in p_up: return "Blinkit Grocery"
                    if "ZERODHA" in p_up: return "Zerodha Broking"
                    if "SWIGGY" in p_up: return "Swiggy"
                    if "ZOMATO" in p_up: return "Zomato"
                    if "AWS" in p_up or "AMAZON WE" in p_up: return "AWS Cloud"
                    if "APPLE" in p_up: return "Apple Services"
                    if "VELAN" in p_up: return "Velan Fruits & Groceries"
                    if "EVERGREEN" in p_up: return "Evergreen Store"
                    if "BALAJI" in p_up: return "Balaji Provisions"
                    if "NIRMALA" in p_up: return "Nirmala Store"
                    if "RAFIA" in p_up: return "Rafia Sultana"
                    if "AKSHAT" in p_up: return "Akshat Sharma"
                    if "VAISHNA" in p_up: return "Vaishnav"
                    if "SUPERMONEY" in p_up: return "Supermoney"
                    if "REBEL" in p_up: return "Rebel Foods (Faasos)"
                    return cls._capitalize_title(p_clean)
            # If only numbers
            for p in parts[1:]:
                if p.isdigit() and len(p) >= 10:
                    return f"UPI Transfer (Phone ••{p[-4:]})"

        upi_match = re.search(r"UPI[/_-](?:\d+[/_-])?([A-Za-z0-9\s]+?)(?:[/_-][a-zA-Z0-9@.-]+|$)", text, re.IGNORECASE)
        if upi_match:
            candidate = upi_match.group(1).strip()
            if len(candidate) > 2 and not candidate.isdigit():
                return cls._capitalize_title(candidate)

        # 2. Handle Indian NEFT/IMPS/RTGS narrations (e.g. "NEFT-INFOSYS LIMITED-SALARY-AUG23")
        if re.match(r"^(NEFT|IMPS|RTGS)[/_-]", text, re.IGNORECASE):
            if "ZERODHA" in text.upper():
                return "Zerodha Broking"
            parts = [p.strip() for p in re.split(r"[/_-]", text) if p.strip()]
            for p in parts[1:]:
                if len(p) >= 3 and not p.isdigit() and not re.match(r"^(SALARY|PAYROLL|RENT|[A-Z]{3}\d+|\d+|TRANSFER|CMS)$", p, re.IGNORECASE):
                    return cls._capitalize_title(p)

        # 3. Handle Salary prefix format (e.g. "SALARY/ACME CORP/DEC")
        salary_match = re.search(r"(?:SALARY|PAYROLL)[/_-]([A-Za-z0-9\s]+?)(?:[/_-]|$)", text, re.IGNORECASE)
        if salary_match:
            candidate = salary_match.group(1).strip()
            if len(candidate) > 2 and not candidate.isdigit():
                return cls._capitalize_title(candidate)

        # 4. Known platform direct billing matches
        if re.search(r"\b(APPLE\.COM/BILL|APL\*|ITUNES\.COM|APPLE MEDI)\b", text, re.IGNORECASE):
            return "Apple Services"
        if re.match(r"^(AMZN\s*MKTP|AMAZON\.COM|AMAZON\s+PRIME)", text, re.IGNORECASE):
            return "Amazon"
        if re.match(r"^GOOGLE\s*\*\s*(SERVICES|PLAY|CLOUD|PAYMENT)?\b", text, re.IGNORECASE):
            remainder = re.sub(r"^GOOGLE\s*\*\s*", "", text, flags=re.IGNORECASE).strip()
            if not remainder or remainder.lower() in {"services", "play", "cloud", "payment"}:
                return "Google"

        # 5. Strip payment processor prefixes
        cleaned = text
        for pat in cls.PROCESSOR_PREFIXES:
            cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)

        # 6. Strip trailing noise (store numbers, phone numbers, state codes)
        for pat in cls.TRAILING_NOISE_PATTERNS:
            cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)

        # Clean remaining punctuation and whitespace
        cleaned = re.sub(r"[*_\-#]", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()

        if not cleaned:
            return cls._capitalize_title(text[:30])

        return cls._capitalize_title(cleaned)

    @classmethod
    def categorize_transaction(cls, text: str) -> str:
        """Helper to get single canonical category string from text."""
        cat, _ = cls.normalize_category(provider_category=None, raw_description=text)
        return cat

    @classmethod
    def normalize_category(
        cls,
        provider_category: Optional[Union[str, List[str]]] = None,
        raw_description: str = ""
    ) -> Tuple[str, Optional[str]]:
        """
        Maps provider-specific categories and description text into
        FinSense's 8 canonical financial categories.
        """
        detailed = None

        # If provider gave categories (e.g. Plaid list: ["Food and Drink", "Restaurants", "Coffee Shop"])
        if provider_category:
            if isinstance(provider_category, list):
                detailed = " > ".join(str(c) for c in provider_category)
                cat_str = " ".join(str(c) for c in provider_category).lower()
            else:
                detailed = str(provider_category)
                cat_str = str(provider_category).lower()

            # Plaid v2 Personal Finance Category mapping
            if "income" in cat_str or "payroll" in cat_str:
                return "Income", detailed
            if "rent_and_utilities" in cat_str or "housing" in cat_str or "rent" in cat_str:
                return "Housing & Rent", detailed
            if "utilities" in cat_str or "telecommunication" in cat_str:
                return "Utilities & Bills", detailed
            if "food_and_drink" in cat_str or "restaurant" in cat_str or "groceries" in cat_str:
                return "Food & Dining", detailed
            if "transportation" in cat_str or "travel" in cat_str or "gas" in cat_str:
                return "Transportation", detailed
            if "entertainment" in cat_str or "subscription" in cat_str:
                return "Subscriptions", detailed
            if "general_merchandise" in cat_str or "personal_care" in cat_str or "shopping" in cat_str:
                return "Shopping & Personal", detailed
            if "transfer" in cat_str or "loan" in cat_str or "bank_fees" in cat_str:
                return "Financial & Transfers", detailed

        # Keyword fallback based on raw statement text
        lower_desc = (raw_description or "").lower()
        for canonical, keywords in cls.CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in lower_desc:
                    return canonical, detailed or canonical

        return "Shopping & Personal", detailed or "General Spending"

    @staticmethod
    def _capitalize_title(s: str) -> str:
        """Capitalizes merchant names nicely while preserving acronyms."""
        words = s.split()
        capitalized = []
        for w in words:
            if w.upper() in {"IBM", "AT&T", "AMC", "BP", "CVS", "UPS", "USPS", "NYT", "HBO", "POS", "UPI", "NEFT"}:
                capitalized.append(w.upper())
            else:
                capitalized.append(w.capitalize())
        return " ".join(capitalized)
