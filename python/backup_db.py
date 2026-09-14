#!/usr/bin/env python3
"""Gilgamesh database backup (Python, read-only).

Dumps the entire chat dataset (Users, Conversations, Messages) to a versioned
JSON backup file. The dump is purely a SELECT from the live Supabase Postgres;
nothing is modified.

Usage:
    python python/backup_db.py                # backups/gilgamesh_<timestamp>.json
    python python/backup_db.py --out ./saves  # custom output folder
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from db import connect, load_project_env, conversation_rows, message_rows, user_rows

ROOT = Path(__file__).resolve().parent.parent


def build_dump(conn) -> dict:
    users = []
    for user_id, email, name, created_at, updated_at in user_rows(conn):
        conversations = []
        for cid, title, c_created, c_updated in conversation_rows(conn, user_id):
            messages = message_rows(conn, cid)
            conversations.append({
                "id": cid,
                "title": title,
                "createdAt": c_created.astimezone().isoformat(),
                "updatedAt": c_updated.astimezone().isoformat(),
                "messages": [
                    {"role": role, "content": content,
                     "createdAt": ts.astimezone().isoformat()}
                    for role, content, ts in messages
                ],
            })
        users.append({
            "id": user_id,
            "email": email,
            "name": name,
            "createdAt": created_at.astimezone().isoformat(),
            "updatedAt": updated_at.astimezone().isoformat(),
            "conversations": conversations,
        })
    return {
        "app": "Gilgamesh",
        "source": "Supabase Postgres (Prisma schema: User/Conversation/Message)",
        "backedUpAt": datetime.now().astimezone().isoformat(),
        "totals": {
            "users": len(users),
            "conversations": sum(len(u["conversations"]) for u in users),
            "messages": sum(len(c["messages"]) for u in users for c in u["conversations"]),
        },
        "users": users,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Backup Gilgamesh data to JSON (read-only).")
    parser.add_argument("--out", default=str(ROOT / "backups"),
                        help="Output folder (default: ./backups).")
    args = parser.parse_args()

    load_project_env()
    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest = out_dir / f"gilgamesh_{stamp}.json"

    print("Dumping all chat data (read-only)...")
    conn = connect()
    try:
        dump = build_dump(conn)
    finally:
        conn.close()

    dest.write_text(json.dumps(dump, ensure_ascii=False, indent=2), encoding="utf-8")
    t = dump["totals"]
    print(f"Backed up {t['users']} user(s), {t['conversations']} conversation(s), "
          f"{t['messages']} message(s) -> {dest} ({dest.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())