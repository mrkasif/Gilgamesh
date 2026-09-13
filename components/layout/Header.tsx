"use client";

import { Menu, Plus } from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";

interface HeaderProps {
  title: string | null;
  onOpenSidebar: () => void;
  onNewChat: () => void;
}

export function Header({ title, onOpenSidebar, onNewChat }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-edge/70 bg-background px-3 sm:px-5">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
        className="icon-button -ml-1 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex items-center gap-2 md:hidden">
        <BrandMark className="h-6 w-6 rounded-md" />
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Gilgamesh
        </span>
      </div>

      <div className="hidden h-4 w-px bg-edge md:block" aria-hidden />

      <h1 className="truncate text-sm text-muted md:text-[15px]">
        {title ?? "New chat"}
      </h1>

      <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-edge/80 bg-surface/70 py-1 pr-2.5 pl-2 text-[10px] font-medium tracking-[0.14em] text-faint uppercase sm:inline-flex">
        <span className="h-1.5 w-1.5 rounded-full bg-accent/80" aria-hidden />
        Gemini API
      </span>

      <button
        type="button"
        onClick={onNewChat}
        aria-label="New chat"
        className="icon-button sm:hidden"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </header>
  );
}