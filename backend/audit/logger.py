"""
SQLite-backed Audit Logger — Enterprise Readiness proof.
Every agent action is logged with timestamp, agent name, action taken,
data source, decision, confidence, model used, and estimated cost.
Append-only. Never deleted during a session.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audit_trail.db")


class AuditLogger:
    """Thread-safe SQLite audit logger for multi-agent pipeline."""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                session_id TEXT,
                agent_name TEXT NOT NULL,
                action TEXT NOT NULL,
                data_source TEXT,
                input_summary TEXT,
                decision TEXT,
                output_summary TEXT,
                confidence REAL,
                model_used TEXT,
                cost_estimate REAL,
                duration_ms REAL,
                status TEXT DEFAULT 'success',
                error_message TEXT
            )
        """)
        conn.commit()
        conn.close()

    def log(
        self,
        agent_name: str,
        action: str,
        data_source: str = "",
        input_summary: str = "",
        decision: str = "",
        output_summary: str = "",
        confidence: float = 0.0,
        model_used: str = "",
        cost_estimate: float = 0.0,
        duration_ms: float = 0.0,
        status: str = "success",
        error_message: str = "",
        session_id: str = "",
    ):
        """Log a single agent action to the audit trail."""
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """
            INSERT INTO audit_log 
            (timestamp, session_id, agent_name, action, data_source, input_summary,
             decision, output_summary, confidence, model_used, cost_estimate,
             duration_ms, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.utcnow().isoformat() + "Z",
                session_id,
                agent_name,
                action,
                data_source,
                input_summary[:500],  # Truncate to avoid bloat
                decision,
                output_summary[:500],
                confidence,
                model_used,
                cost_estimate,
                duration_ms,
                status,
                error_message,
            ),
        )
        conn.commit()
        conn.close()

    def get_logs(
        self,
        limit: int = 50,
        agent_name: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> list[dict]:
        """Retrieve recent audit logs."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row

        query = "SELECT * FROM audit_log"
        params = []
        conditions = []

        if agent_name:
            conditions.append("agent_name = ?")
            params.append(agent_name)
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
        conn.close()

        return [dict(row) for row in reversed(rows)]  # Chronological order

    def get_pipeline_run(self, session_id: str) -> list[dict]:
        """Get all logs for a specific pipeline run."""
        return self.get_logs(limit=100, session_id=session_id)

    def get_cost_summary(self) -> dict:
        """Get aggregated cost data for the cost dashboard."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row

        rows = conn.execute("""
            SELECT 
                model_used,
                COUNT(*) as call_count,
                SUM(cost_estimate) as total_cost,
                AVG(duration_ms) as avg_duration
            FROM audit_log 
            WHERE model_used != ''
            GROUP BY model_used
        """).fetchall()

        conn.close()

        summary = {
            "models": [dict(r) for r in rows],
            "total_cost": sum(r["total_cost"] or 0 for r in rows),
            "total_calls": sum(r["call_count"] for r in rows),
        }
        return summary


# Singleton
_logger_instance = None

def get_audit_logger() -> AuditLogger:
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = AuditLogger()
    return _logger_instance
