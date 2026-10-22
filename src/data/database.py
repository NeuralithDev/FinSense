"""
Persistent SQLite Database Layer for FinSense Production.

Backs user statements, accounts, transactions, executed auto-save sweeps,
subscription actions, anomaly feedback, and AI chat histories in data/finsense_prod.db.
Survives backend server restarts with zero external service dependencies.
"""

import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = ROOT / "data" / "finsense_prod.db"


class FinSenseDB:
    _instance: Optional["FinSenseDB"] = None

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_tables()

    @classmethod
    def get_instance(cls) -> "FinSenseDB":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # 1. Accounts Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS accounts (
                account_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                account_name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                balance REAL NOT NULL,
                currency TEXT NOT NULL,
                institution TEXT NOT NULL,
                is_primary INTEGER DEFAULT 0,
                updated_at TEXT NOT NULL
            )
            """)

            # 2. Transactions Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                account_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                merchant TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                is_income INTEGER NOT NULL,
                raw_description TEXT,
                currency TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """)

            # 3. Auto-Save Sweeps Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS auto_save_sweeps (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL,
                target_goal TEXT NOT NULL,
                currency TEXT NOT NULL
            )
            """)

            # 4. Subscriptions Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                merchant TEXT NOT NULL,
                amount REAL NOT NULL,
                cadence TEXT NOT NULL,
                status TEXT NOT NULL,
                redundancy_group TEXT,
                currency TEXT NOT NULL
            )
            """)

            # 5. Anomaly Resolutions Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS anomaly_resolutions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                tx_id TEXT NOT NULL,
                status TEXT NOT NULL,
                notes TEXT,
                resolved_at TEXT NOT NULL
            )
            """)

            # 6. Chat Messages Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                intent TEXT,
                timestamp TEXT NOT NULL
            )
            """)

            conn.commit()

    # -------------------------------------------------------------------------
    # Account & Transaction Operations
    # -------------------------------------------------------------------------
    def upsert_account(self, account: Dict[str, Any]) -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            acc_id = account.get("account_id") or account.get("id", "acc_default")
            cursor.execute("""
            INSERT OR REPLACE INTO accounts (
                account_id, user_id, account_name, account_type, balance, currency, institution, is_primary, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                acc_id,
                account.get("user_id", "0"),
                account.get("account_name", "Primary Account"),
                account.get("account_type", "checking"),
                float(account.get("balance", 0.0)),
                account.get("currency", "INR"),
                account.get("institution", "Bank"),
                1 if account.get("is_primary", True) else 0,
                datetime.utcnow().isoformat()
            ))
            conn.commit()

    def get_accounts(self, user_id: str = "0") -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM accounts WHERE user_id = ?", (user_id,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def insert_transactions(self, txs: List[Dict[str, Any]], user_id: str = "0") -> int:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            count = 0
            for t in txs:
                cursor.execute("""
                INSERT OR REPLACE INTO transactions (
                    id, account_id, user_id, date, merchant, category, amount, is_income, raw_description, currency, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t["id"],
                    t.get("account_id", "acc_default"),
                    user_id,
                    str(t.get("date", "")),
                    t.get("merchant", "Merchant"),
                    t.get("category", "General"),
                    float(t.get("amount", 0.0)),
                    1 if t.get("is_income", False) else 0,
                    t.get("raw_description", ""),
                    t.get("currency", "INR"),
                    datetime.utcnow().isoformat()
                ))
                count += 1
            conn.commit()
            return count

    def get_transactions(self, user_id: str = "0", account_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if account_id:
                cursor.execute("SELECT * FROM transactions WHERE user_id = ? AND account_id = ? ORDER BY date DESC", (user_id, account_id))
            else:
                cursor.execute("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC", (user_id,))
            rows = cursor.fetchall()
            txs = []
            for r in rows:
                d = dict(r)
                d["is_income"] = bool(d["is_income"])
                txs.append(d)
            return txs

    # -------------------------------------------------------------------------
    # Auto-Save Sweeps Operations
    # -------------------------------------------------------------------------
    def record_sweep(self, sweep: Dict[str, Any], user_id: str = "0") -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO auto_save_sweeps (
                id, user_id, amount, date, status, target_goal, currency
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                sweep["id"],
                user_id,
                float(sweep["amount"]),
                sweep.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                sweep.get("status", "EXECUTED"),
                sweep.get("target_goal", "Emergency Fund"),
                sweep.get("currency", "INR")
            ))
            conn.commit()

    def get_sweeps(self, user_id: str = "0") -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM auto_save_sweeps WHERE user_id = ? ORDER BY date DESC", (user_id,))
            return [dict(r) for r in cursor.fetchall()]

    # -------------------------------------------------------------------------
    # Subscription Actions
    # -------------------------------------------------------------------------
    def update_subscription_status(self, sub_id: str, status: str, user_id: str = "0") -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            UPDATE subscriptions SET status = ? WHERE id = ? AND user_id = ?
            """, (status, sub_id, user_id))
            conn.commit()

    # -------------------------------------------------------------------------
    # Anomaly Resolutions
    # -------------------------------------------------------------------------
    def save_anomaly_resolution(self, tx_id: str, status: str, notes: str = "", user_id: str = "0") -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            res_id = f"res_{tx_id}"
            cursor.execute("""
            INSERT OR REPLACE INTO anomaly_resolutions (
                id, user_id, tx_id, status, notes, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                res_id,
                user_id,
                tx_id,
                status,
                notes,
                datetime.utcnow().isoformat()
            ))
            conn.commit()

    def get_anomaly_resolutions(self, user_id: str = "0") -> Dict[str, str]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT tx_id, status FROM anomaly_resolutions WHERE user_id = ?", (user_id,))
            return {row["tx_id"]: row["status"] for row in cursor.fetchall()}

    # -------------------------------------------------------------------------
    # AI Chat Messages
    # -------------------------------------------------------------------------
    def log_chat_message(self, role: str, content: str, intent: Optional[str] = None, user_id: str = "0") -> None:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO chat_messages (user_id, role, content, intent, timestamp)
            VALUES (?, ?, ?, ?, ?)
            """, (user_id, role, content, intent or "GENERAL", datetime.utcnow().isoformat()))
            conn.commit()

    def get_chat_history(self, user_id: str = "0", limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT role, content, intent, timestamp FROM chat_messages
            WHERE user_id = ? ORDER BY id ASC LIMIT ?
            """, (user_id, limit))
            return [dict(r) for r in cursor.fetchall()]
