"use client";

import {
  ArrowUpRight,
  BookOpen,
  Code2,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { STARTER_PROMPTS } from "@/lib/mock-data";
import type { StarterPrompt } from "@/lib/types";

const PROMPT_ICONS: Record<string, LucideIcon> = {
  explain: BookOpen,
  code: Code2,
  analyze: Lightbulb,
  study: GraduationCap,
};

interface EmptyStateProps {
  onStartConversation: (prompt: StarterPrompt) => void;
}

export function EmptyState({ onStartConversation }: EmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-14 sm:px-6">
      <div className="flex max-w-xl flex-col items-center text-center">
        <BrandMark className="h-12 w-12 rounded-2xl shadow-xl shadow-black/40 ring-1 ring-edge" />
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          How can I help you today?
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          Ask a question, explore an idea, or start building something.
        </p>
      </div>

      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {STARTER_PROMPTS.map((prompt) => {
          const Icon = PROMPT_ICONS[prompt.id] ?? BookOpen;
          return (
            <button
              key={prompt.id}
              type="button"
              onClick={() => onStartConversation(prompt)}
              className="group/starter flex items-start gap-3 rounded-xl border border-edge bg-surface px-3.5 py-3 text-left transition-[border-color,background-color] duration-150 hover:border-edge-strong hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors duration-150 group-hover/starter:bg-accent/15">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-5 font-medium text-foreground">
                  {prompt.title}
                </span>
                <span className="mt-0.5 block text-xs leading-4 text-muted">
                  {prompt.description}
                </span>
              </span>
              <ArrowUpRight
                className="mt-1 h-4 w-4 shrink-0 text-faint opacity-0 transition-[color,opacity] duration-150 group-hover/starter:opacity-100 group-hover/starter:text-accent"
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}