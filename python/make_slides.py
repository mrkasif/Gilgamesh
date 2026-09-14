#!/usr/bin/env python3
"""Generate the Gilgamesh project presentation (PPTX) via python-pptx.

Standalone tool - does not touch the Next.js application. It only writes one
PowerPoint deck: progress/Gilgamesh_Project_Slides.pptx

Usage:
    pip install python-pptx
    python python/make_slides.py            # default: progress/Gilgamesh_Project_Slides.pptx
    python python/make_slides.py --out x.pptx
"""

from __future__ import annotations

import argparse
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent.parent

BLACK = RGBColor(0x00, 0x00, 0x00)
PANEL = RGBColor(0x11, 0x11, 0x11)
EDGE = RGBColor(0x22, 0x22, 0x22)
BRONZE = RGBColor(0xC9, 0xA8, 0x76)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0xB3, 0xB3, 0xB3)
FAINT = RGBColor(0x77, 0x77, 0x77)
MONO = "Consolas"
SANS = "Century Gothic"


def new_deck() -> Presentation:
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    return prs


def add_slide(prs: Presentation):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, prs.slide_height)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BLACK
    bg.line.fill.background()
    bg.shadow.inherit = False
    return slide


def textbox(slide, left, top, width, height):
    return slide.shapes.add_textbox(left, top, width, height).text_frame


def accent(slide, left, top, width=Inches(2.2), height=Pt(3.5)):
    bar = slide.shapes.add_shape(1, left, top, width, height)
    bar.fill.solid()
    bar.fill.fore_color.rgb = BRONZE
    bar.line.fill.background()
    bar.shadow.inherit = False


def title(slide, text, kicker=""):
    if kicker:
        tf = textbox(slide, Inches(0.7), Inches(0.45), Inches(11.9), Inches(0.5))
        p = tf.paragraphs[0]
        p.text = kicker
        run = p.runs[0]
        run.font.color.rgb = BRONZE
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.name = SANS
    tf = textbox(slide, Inches(0.7), Inches(0.9), Inches(11.9), Inches(0.9))
    p = tf.paragraphs[0]
    p.text = text
    run = p.runs[0]
    run.font.color.rgb = WHITE
    run.font.size = Pt(32)
    run.font.bold = True
    run.font.name = SANS
    accent(slide, Inches(0.75), Inches(1.72), Inches(1.6), Pt(4))
    return tf


def bullets(slide, items, left=Inches(0.8), top=Inches(2.15), width=Inches(11.7), height=Inches(4.9),
            size=Pt(16), gap=Pt(10)):
    tf = textbox(slide, left, top, width, height)
    first = True
    for text, sub in items:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.text = f"\u25AA  {text}"
        run = p.runs[0]
        if sub:
            run.font.color.rgb = MUTED
        else:
            run.font.color.rgb = WHITE
        run.font.size = size if not sub else Pt(size.pt - 2)
        run.font.name = SANS
        p.space_after = gap if not sub else Pt(2)
    return tf


def footer(slide, prs, number):
    tf = textbox(slide, Inches(12.4), Inches(7.05), Inches(0.7), Inches(0.35))
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    p.text = str(number)
    run = p.runs[0]
    run.font.color.rgb = FAINT
    run.font.size = Pt(10)
    run.font.name = SANS


def build(prs: Presentation) -> None:
    # ---- Slide 1: Title ----
    s = add_slide(prs)
    accent(s, Inches(0.7), Inches(2.15), Inches(2.4), Pt(6))
    tf = textbox(s, Inches(0.7), Inches(2.4), Inches(12), Inches(1.4))
    p = tf.paragraphs[0]
    p.text = "GILGAMESH"
    p.runs[0].font.color.rgb = WHITE
    p.runs[0].font.size = Pt(66)
    p.runs[0].font.bold = True
    p.runs[0].font.name = SANS
    p2 = tf.add_paragraph()
    p2.text = "A Modern AI Chat Workspace"
    p2.runs[0].font.color.rgb = BRONZE
    p2.runs[0].font.size = Pt(28)
    p2.runs[0].font.name = SANS
    tf2 = textbox(s, Inches(0.7), Inches(4.1), Inches(12), Inches(0.8))
    p3 = tf2.paragraphs[0]
    p3.text = "Next.js + React 19  \u00b7  Supabase Postgres & Auth  \u00b7  Google Gemini AI  \u00b7  Python data toolkit"
    p3.runs[0].font.color.rgb = MUTED
    p3.runs[0].font.size = Pt(15)
    p3.runs[0].font.name = SANS
    footer(s, prs, 1)

    # ---- Slide 2: Introduction & Problem ----
    s = add_slide(prs)
    title(s, "Introduction & Problem", "THE SITUATION")
    bullets(s, [
        ("Introduction", True),
        ("A personal, owned AI chat workspace \u2014 real accounts, per-user chat history, live Gemini replies.", False),
        ("Rich Markdown answers, a pitch-black focused UI, and instant-feeling interactions.", False),
        ("Problem", True),
        ("Walled-garden AI tools lock users into one interface; history is scattered or ephemeral.", False),
        ("Heavy, cluttered visuals distract from the conversation; round-trips make actions feel slow.", False),
        ("Plain-text LLM output wastes formatting (headings, lists, tables, code).", False),
        ("Reliability: timeouts, rate limits and failures must degrade gracefully.", False),
    ], size=Pt(17), gap=Pt(12))
    footer(s, prs, 2)

    # ---- Slide 3: Features & Objectives ----
    s = add_slide(prs)
    title(s, "Features & Objectives")
    bullets(s, [
        ("Supabase email/password auth with JWT-gated API routes (expired sessions \u2192 401).", False),
        ("Conversation management: create, list, switch, rename, delete, clear-all, regenerate.", False),
        ("Live multi-turn replies via Google Gemini (gemini-3.6-flash, 30s timeout, safe errors).", False),
        ("Markdown rendering with tables and copyable code blocks.", False),
        ("Pitch-black theme (#000 / #111 / #222) with bronze accents \u2014 no visual noise.", False),
        ("Instant UX: optimistic New Chat, background hydration, no full-page spinner.", False),
        ("Reduced-motion support; responsive from desktop to 360px.", False),
        ("Quality gates: TypeScript, ESLint and production build all pass.", False),
    ], size=Pt(17), gap=Pt(12))
    footer(s, prs, 3)

    # ---- Slide 4: System Architecture ----
    s = add_slide(prs)
    title(s, "System Architecture", "HOW IT FITS TOGETHER")
    bullets(s, [
        ("Client (React 19 + Tailwind v4)", True),
        ("AuthScreen, ChatInterface, Sidebar, ChatComposer, MessageList, MarkdownContent", False),
        ("Server (Next.js 16 App Router)", True),
        ("/api/conversations\u00b7[id]  |  /chat  |  /sync-user     lib/auth \u00b7 lib/gemini \u00b7 lib/prisma", False),
        ("Data & AI services", True),
        ("Supabase Auth \u00b7 PostgreSQL via Prisma ORM \u00b7 Google Gemini API", False),
        ("Request flow", True),
        ("Browser \u2192 API route \u2192 owner check + Postgres \u2192 Gemini \u2192 persist \u2192 JSON back to UI", False),
    ], size=Pt(16), gap=Pt(9))
    footer(s, prs, 4)

    # ---- Slide 5: Data Model ----
    s = add_slide(prs)
    title(s, "Data Model (Prisma / PostgreSQL)", "STORAGE")
    bullets(s, [
        ("User", True),
        ("id, supabaseId (unique), email (unique), name, timestamps", False),
        ("Conversation", True),
        ("id, userId FK \u2192 User, title, createdAt, updatedAt  \u2014 indexed on userId + updatedAt", False),
        ("Message", True),
        ("id, conversationId FK \u2192 Conversation, role (user|assistant), content, createdAt", False),
        ("Relations & integrity", True),
        ("1 User \u2194 N Conversations; 1 Conversation \u2194 N Messages; cascade deletes on both relations", False),
        ("Composite index (conversationId, createdAt) keeps ordered history reads fast.", False),
    ], size=Pt(16), gap=Pt(9))
    footer(s, prs, 5)

    # ---- Slide 6: Technologies & Tools ----
    s = add_slide(prs)
    title(s, "Technologies & Tools")
    rows = [
        ("Framework", "Next.js 16.3.5 (App Router, Turbopack)"),
        ("UI", "React 19.2.8 \u00b7 Tailwind CSS v4 \u00b7 lucide-react"),
        ("Language", "TypeScript 5 (strict) \u00b7 React 19"),
        ("Database", "PostgreSQL (Supabase) \u00b7 Prisma ORM 6.19.3"),
        ("Auth", "Supabase Auth (email/password, JWT)"),
        ("AI", "Google Gemini \u2014 gemini-3.6-flash (@google/genai 2.22)"),
        ("Rendering", "react-markdown 10 \u00b7 remark-gfm 4"),
        ("Quality", "tsc \u00b7 ESLint \u00b7 next build"),
        ("Python toolkit", "Python 3.14 \u00b7 psycopg 3: export, analytics, backups, PDF reports"),
    ]
    top = Inches(2.1)
    for i, (k, v) in enumerate(rows):
        tf = textbox(s, Inches(0.8), top + Inches(i * 0.56), Inches(3.4), Inches(0.55))
        p = tf.paragraphs[0]
        p.text = k
        p.runs[0].font.color.rgb = BRONZE
        p.runs[0].font.size = Pt(15)
        p.runs[0].font.bold = True
        p.runs[0].font.name = SANS
        tf2 = textbox(s, Inches(4.4), top + Inches(i * 0.56), Inches(8.1), Inches(0.55))
        p2 = tf2.paragraphs[0]
        p2.text = v
        p2.runs[0].font.color.rgb = WHITE if i != len(rows) - 1 else MUTED
        p2.runs[0].font.size = Pt(15)
        p2.runs[0].font.name = SANS
    footer(s, prs, 6)

    # ---- Slide 7: Python Tooling ----
    s = add_slide(prs)
    title(s, "Python Tooling (Read-only, Standalone)", "PYTHON IN THE PROJECT")
    bullets(s, [
        ("python/db.py", True),
        ("Shared connection + read-only queries against the live Supabase Postgres", False),
        ("python/export_chat.py", True),
        ("Exports every user's conversations to readable Markdown + history.json", False),
        ("python/analyze_chat.py", True),
        ("Usage analytics: messages, words, ~tokens, busiest day, CSV export", False),
        ("python/backup_db.py", True),
        ("Timestamped JSON backup of all chat data (SELECT only)", False),
        ("progress/generate_reports.py", True),
        ("Rebuilds the project report PDFs from their HTML sources in seconds", False),
        ("Never touches the Next.js build, the database, or server-side API keys.", True),
    ], size=Pt(16), gap=Pt(9))
    footer(s, prs, 7)

    # ---- Slide 8: Conclusion & Future Scope ----
    s = add_slide(prs)
    title(s, "Conclusion & Future Scope")
    bullets(s, [
        ("Conclusion", True),
        ("Complete production-shaped stack: real accounts, relational persistence, live LLM, rich Markdown, instant UX.", False),
        ("Verified every step with TypeScript, ESLint and production builds; browser-tested 1280\u2192360px.", False),
        ("Future scope", True),
        ("Streaming responses and in-flight cancellation \u00b7 model picker \u00b7 image/voice input", False),
        ("In-app export, full-text search and pinned conversations \u00b7 sharing", False),
        ("Offline mode / PWA and native mobile wrappers.", False),
    ], size=Pt(16), gap=Pt(10))
    footer(s, prs, 8)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate the Gilgamesh project slides (PPTX).")
    parser.add_argument("--out", default=str(ROOT / "progress" / "slides" / "Gilgamesh_Project_Slides.pptx"),
                        help="Output .pptx path (default: progress/slides/Gilgamesh_Project_Slides.pptx)")
    args = parser.parse_args()

    prs = new_deck()
    build(prs)
    dest = Path(args.out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    prs.save(dest)
    print(f"Saved {dest} with {len(prs.slides)} slides")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())