#!/usr/bin/env python3
"""Regenerate the Gilgamesh report PDFs in ./progress from their HTML sources.

Standalone helper - does not touch the Next.js application, database, or env.

Usage:
    python generate_reports.py             # rebuild all three PDFs
    python generate_reports.py 01          # rebuild only 01-structural-diagrams
    python generate_reports.py 01 03       # rebuild a few
"""

from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

BASE = Path(__file__).resolve().parent

REPORTS = {
    "01": ("01-structural-diagrams.html", "01-structural-diagrams.pdf"),
    "02": ("02-project-progress.html", "02-project-progress.pdf"),
    "03": ("03-project-report.html", "03-project-report.pdf"),
}


def find_browser():
    """Locate a Chromium-based browser to render HTML -> PDF (headless)."""
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ]
    for path in candidates:
        if Path(path).exists():
            return path
    found = shutil.which("msedge") or shutil.which("chrome")
    return found


def build_one(key: str) -> bool:
    if key not in REPORTS:
        print(f"Unknown report '{key}'. Choose from: {', '.join(REPORTS)}")
        return False

    html, pdf = REPORTS[key]
    html_path = BASE / html
    pdf_path = BASE / pdf

    if not html_path.exists():
        print(f"Missing source: {html_path}")
        return False

    browser = find_browser()
    if not browser:
        print("No Chromium-based browser found; install Edge or Chrome to render PDFs.")
        return False

    with tempfile.TemporaryDirectory(prefix="gilgamesh-pdf-") as tmp:
        cmd = [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--user-data-dir={tmp}",
            f"--print-to-pdf={pdf_path}",
            html_path.as_uri(),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

    if pdf_path.exists() and pdf_path.stat().st_size > 0:
        print(f"Built {pdf} ({pdf_path.stat().st_size:,} bytes)")
        return True

    print(f"Failed to build {pdf}")
    tail = (result.stdout or result.stderr or "").strip()[-2000:]
    if tail:
        print(tail)
    return False


def main():
    targets = sys.argv[1:] or list(REPORTS)
    ok = True
    for t in targets:
        ok = build_one(t) and ok
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()