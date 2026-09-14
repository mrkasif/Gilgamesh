#!/usr/bin/env python3
"""Gilgamesh chat analytics (Python, read-only).

Computes usage statistics from the live Supabase Postgres and prints a table,
optionally writing a CSV report.

Standalone tool - never modifies the database or the application.

Usage:
    python python/analyze_chat.py            # per-user + overall stats
    python python/analyze_chat.py --csv out  # also write CSVs into out/
    python python/analyze_chat.py --top 5    # only the busiest 5 users
"""

from __future__ import annotations

import argparse
import csv
from collections import Counter
from datetime import datetime
from pathlib import Path

from db import connect, load_project_env, conversation_rows, message_rows, user_rows

ROLE_LABELS = {"user": "You", "assistant": "Gilgamesh"}


def estimate_tokens(text: str) -> int:
    """Rough token estimate (~4 chars per token), good enough for reports."""
    return max(1, round(len(text) / 4))


def analyze() -> list[dict]:
    conn = connect()
    stats = []
    try:
        for user_id, email, name, created_at, _ in user_rows(conn):
            user_stat = {
                "email": email,
                "name": name or "",
                "joined": created_at.astimezone().strftime("%Y-%m-%d"),
                "conversations": 0,
                "messages": 0,
                "user_messages": 0,
                "assistant_messages": 0,
                "user_words": 0,
                "assistant_words": 0,
                "estimated_tokens": 0,
                "longest_reply_chars": 0,
                "busiest_day": "",
                "conversation_lengths": [],
            }
            daily = Counter()
            for _cid, title, _c, _u in conversation_rows(conn, user_id):
                messages = message_rows(conn, _cid)
                user_stat["conversations"] += 1
                conversation_turns = 0
                for role, content, ts in messages:
                    user_stat["messages"] += 1
                    conversation_turns += 1
                    words = len(content.split())
                    if role == "user":
                        user_stat["user_messages"] += 1
                        user_stat["user_words"] += words
                    else:
                        user_stat["assistant_messages"] += 1
                        user_stat["assistant_words"] += words
                        user_stat["longest_reply_chars"] = max(
                            user_stat["longest_reply_chars"], len(content))
                    user_stat["estimated_tokens"] += estimate_tokens(content)
                    daily[ts.astimezone().strftime("%Y-%m-%d")] += 1
                user_stat["conversation_lengths"].append(conversation_turns)
            if daily:
                user_stat["busiest_day"] = daily.most_common(1)[0][0]
            stats.append(user_stat)
    finally:
        conn.close()

    avg_turns = [sum(s["conversation_lengths"]) / len(s["conversation_lengths"])
                 for s in stats if s["conversation_lengths"]]
    overall = {
        "users": len(stats),
        "conversations": sum(s["conversations"] for s in stats),
        "messages": sum(s["messages"] for s in stats),
        "user_messages": sum(s["user_messages"] for s in stats),
        "assistant_messages": sum(s["assistant_messages"] for s in stats),
        "estimated_tokens": sum(s["estimated_tokens"] for s in stats),
        "avg_conversation_length": (round(sum(avg_turns) / len(avg_turns), 2)
                                    if avg_turns else 0),
    }
    return [stats, overall]


def print_report(stats: list[dict], overall: dict, top: int) -> None:
    print("=" * 78)
    print("GILGAMESH - CHAT ANALYTICS (read-only)")
    print("=" * 78)
    print(f"Total: {overall['users']} user(s) · {overall['conversations']} conversation(s) "
          f"· {overall['messages']} message(s) · avg {overall['avg_conversation_length']} "
          f"turns/conversation · ~{overall['estimated_tokens']:,} tokens")
    print("-" * 78)

    ordered = sorted(stats, key=lambda s: s["messages"], reverse=True)
    for s in ordered[:top] if top else ordered:
        conv = (round(sum(s["conversation_lengths"]) / len(s["conversation_lengths"]), 2)
                if s["conversation_lengths"] else 0)
        print(f"\n{s['email']}  (joined {s['joined']})")
        print(f"  conversations: {s['conversations']:>4}   messages: {s['messages']:>4}  "
              f"(user {s['user_messages']} / assistant {s['assistant_messages']})")
        print(f"  words: user {s['user_words']:,} / assistant {s['assistant_words']:,}  "
              f"~{s['estimated_tokens']:,} tokens  avg {conv} turns/conv")
        print(f"  longest assistant reply: {s['longest_reply_chars']:,} chars  "
              f"busiest day: {s['busiest_day']}")


def write_csv(stats: list[dict], out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"chat_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    fields = ["email", "name", "joined", "conversations", "messages", "user_messages",
              "assistant_messages", "user_words", "assistant_words", "estimated_tokens",
              "longest_reply_chars", "busiest_day"]
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for s in stats:
            writer.writerow({k: s[k] for k in fields})
    return path


def main() -> int:
    parser = argparse.ArgumentParser(description="Gilgamesh chat analytics (read-only).")
    parser.add_argument("--top", type=int, default=0, help="Show only the top N busiest users.")
    parser.add_argument("--csv", default="", help="Optional folder to write a CSV report into.")
    args = parser.parse_args()

    load_project_env()
    stats, overall = analyze()
    if not stats:
        print("No users found in the database.")
        return 1

    print_report(stats, overall, args.top)
    if args.csv:
        path = write_csv(stats, Path(args.csv))
        print(f"\nCSV written: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())