#!/usr/bin/env python3
"""Shared read-only helpers for the Gilgamesh Python toolkit.

These tools never modify the database - they only SELECT. They live in their
own folder so the Next.js build, ESLint, and TypeScript never interact with
them.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    import psycopg
except ImportError:
    sys.exit("Missing driver. Run:  pip install \"psycopg[binary]\"")

ROOT = Path(__file__).resolve().parent.parent


def load_env(path: Path) -> None:
    """Load KEY=VALUE lines from a .env file without printing secrets."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key:
            os.environ.setdefault(key, value)


def load_project_env() -> None:
    for dotfile in (".env", ".env.local", ".env.example"):
        load_env(ROOT / dotfile)


def connect(scheme: str = "postgresql://") -> psycopg.Connection:
    direct = os.environ.get("DIRECT_URL")
    pooled = os.environ.get("DATABASE_URL")
    url = direct or pooled
    if not url:
        sys.exit("No DATABASE_URL / DIRECT_URL found in .env files.")
    if url.startswith("postgres://"):
        url = scheme + url[len("postgres://"):]
    return psycopg.connect(url)


def tables(conn: psycopg.Connection) -> list[str]:
    rows = conn.execute(
        "SELECT tablename FROM pg_tables "
        "WHERE schemaname = 'public' ORDER BY tablename"
    ).fetchall()
    return [r[0] for r in rows]


def user_rows(conn: psycopg.Connection) -> list[tuple]:
    return conn.execute(
        'SELECT "id", "email", "name", "createdAt", "updatedAt" FROM "User" ORDER BY "email"'
    ).fetchall()


def conversation_rows(conn: psycopg.Connection, user_id: str) -> list[tuple]:
    return conn.execute(
        'SELECT "id", "title", "createdAt", "updatedAt" FROM "Conversation" '
        'WHERE "userId" = %s ORDER BY "updatedAt" ASC', (user_id,)
    ).fetchall()


def message_rows(conn: psycopg.Connection, conversation_id: str) -> list[tuple]:
    return conn.execute(
        'SELECT "role", "content", "createdAt" FROM "Message" '
        'WHERE "conversationId" = %s ORDER BY "createdAt" ASC', (conversation_id,)
    ).fetchall()