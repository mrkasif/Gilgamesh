#!/usr/bin/env python3
"""Gilgamesh chat-history exporter (Python).

Reads the project's live Supabase Postgres (via Prisma's schema) and exports
a user's conversations to readable Markdown + a JSON backup.

Standalone tool - it does NOT touch or modify the Next.js application, the
database, or any configuration. Only read queries are executed.

Requirements:
    pip install "psycopg[binary]"

Usage:
    python python/export_chat.py                          # export every user
    python python/export_chat.py --email you@example.com  # export one user
    python python/export_chat.py --out ./exports          # custom output dir
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import threading
from datetime import datetime
from pathlib import Path

from db import connect, load_project_env, conversation_rows, message_rows, user_rows

ROOT = Path(__file__).resolve().parent.parent


def clean_title(title: str) -> str:
    safe = re.sub(r'[\\/:*?"<>|]', "_", title or "untitled")
    return safe.strip()[:60] or "untitled"


def format_timestamp(ts: datetime) -> str:
    return ts.astimezone().strftime("%Y-%m-%d %H:%M")


def export_user(conn, email: str, out_dir: Path) -> dict:
    user = conn.execute(
        'SELECT "id", "email", "name" FROM "User" WHERE "email" = %s', (email,)
    ).fetchone()
    if not user:
        print(f"  no user found for {email!r}; skipping")
        return {"email": email, "conversations": 0, "messages": 0}

    user_id, user_email, user_name = user
    history: dict = {"email": user_email, "name": user_name,
                     "exportedAt": datetime.now().astimezone().isoformat(),
                     "conversations": []}
    total_messages = 0
    user_dir = out_dir / (re.sub(r"[^A-Za-z0-9._-]+", "_", user_email) or "user")
    user_dir.mkdir(parents=True, exist_ok=True)

    for convo_id, title, created, updated in conversation_rows(conn, user_id):
        messages = message_rows(conn, convo_id)
        total_messages += len(messages)

        history["conversations"].append({
            "id": convo_id,
            "title": title,
            "createdAt": created.astimezone().isoformat(),
            "updatedAt": updated.astimezone().isoformat(),
            "messages": [
                {"role": role, "content": content,
                 "createdAt": ts.astimezone().isoformat()}
                for role, content, ts in messages
            ],
        })

        md = [f"# {title}", "",
              f"*Conversation {convo_id} — exported {format_timestamp(datetime.now())}*", ""]
        for role, content, ts in messages:
            prefix = "**You**" if role == "user" else "**Gilgamesh (Gemini)**"
            md += [f"#### {prefix} · {format_timestamp(ts)}", "", content, "", "---", ""]
        md_path = user_dir / f"{clean_title(title)}_{convo_id}.md"
        md_path.write_text("\n".join(md), encoding="utf-8")

    history["totals"] = {"conversations": len(history["conversations"]),
                         "messages": total_messages}
    (user_dir / "history.json").write_text(
        json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  {user_email}: {len(history['conversations'])} conversation(s), "
          f"{total_messages} message(s) -> {user_dir}")
    return {"email": user_email, **history["totals"]}


def main() -> int:
    parser = argparse.ArgumentParser(description="Export Gilgamesh chat history to Markdown + JSON.")
    parser.add_argument("--email", help="Export only this user's email (default: all users).")
    parser.add_argument("--out", default=str(ROOT / "exports"), help="Output folder (default: ./exports).")
    args = parser.parse_args()

    load_project_env()
    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Connecting to Supabase Postgres (read-only)...")
    conn = connect()
    try:
        all_users = user_rows(conn)
    finally:
        conn.close()

    if args.email:
        emails = [args.email]
    else:
        emails = [u[1] for u in all_users]

    if not emails:
        print("No users found in the database.")
        return 1

    print(f"Exporting {len(emails)} user(s) to {out_dir}")
    results: list[dict] = []

    def worker(email: str) -> None:
        c = connect()
        try:
            results.append(export_user(c, email, out_dir))
        finally:
            c.close()

    threads = [threading.Thread(target=worker, args=(email,)) for email in emails]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    grand = {"users": len(results),
             "conversations": sum(r["conversations"] for r in results),
             "messages": sum(r["messages"] for r in results)}
    print(f"Done. {grand['users']} user(s), {grand['conversations']} "
          f"conversation(s), {grand['messages']} message(s).")
    return 0 if results else 1


if __name__ == "__main__":
    raise SystemExit(main())