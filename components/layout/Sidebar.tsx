"use client";

import {
  MessageSquare,
  Search,
  Settings,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import type { Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  open: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  open,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
  onClose,
}: SidebarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const titleMatch = conversation.title.toLowerCase().includes(q);
      const contentMatch = conversation.messages.some((message) =>
        message.content.toLowerCase().includes(q),
      );
      return titleMatch || contentMatch;
    });
  }, [conversations, query]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        aria-label="Conversations"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] shrink-0 flex-col border-r border-edge bg-panel transition-transform duration-200 ease-out md:static md:w-64 md:translate-x-0 lg:w-72",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <BrandMark className="h-9 w-9 rounded-xl shadow-lg shadow-black/30" />
          <div className="min-w-0">
            <p className="text-[15px] leading-tight font-semibold tracking-tight text-foreground">
              Gilgamesh
            </p>
            <p className="truncate text-[10px] tracking-[0.18em] text-faint uppercase">
              AI Workspace
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="icon-button ml-auto md:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={onNewConversation}
            className="flex h-10 w-full items-center gap-2 rounded-xl border border-edge-strong bg-surface-2 px-3 text-[13px] font-medium text-foreground transition-[background-color,border-color] duration-150 hover:border-accent/30 hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.99]"
          >
            <SquarePen className="h-4 w-4 text-accent" aria-hidden />
            New chat
          </button>
        </div>

        <div className="px-3 pt-1 pb-2">
          <label className="sr-only" htmlFor="sidebar-search">
            Search conversations
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint"
              aria-hidden
            />
            <input
              id="sidebar-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              className="w-full rounded-xl border border-transparent bg-background/60 py-2 pr-3 pl-10 text-[13px] text-foreground placeholder:text-faint transition-[border-color,background-color] duration-150 hover:border-edge hover:bg-background focus:border-edge-strong focus:bg-background focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>

        <div className="mx-3 border-t border-edge/60" aria-hidden />

        <div className="flex min-h-0 flex-1 flex-col pt-3">
          <h2 className="px-4 pb-1.5 text-[10px] font-semibold tracking-[0.18em] text-faint uppercase">
            Recent conversations
          </h2>
          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            {filtered.map((conversation) => {
              const active = conversation.id === activeConversationId;
              const preview = conversation.messages.at(-1)?.content;
              return (
                <div
                  key={conversation.id}
                  className="group/conversation relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectConversation(conversation.id);
                      onClose();
                    }}
                    aria-current={active ? "page" : undefined}
                    title={conversation.title}
                    className={cn(
                      "relative flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 pr-9 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                      active
                        ? "bg-surface-2 text-foreground"
                        : "text-muted hover:bg-surface/70 hover:text-foreground",
                    )}
                  >
                    {active && (
                      <span
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent"
                        aria-hidden
                      />
                    )}
                    <MessageSquare
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 transition-colors duration-150",
                        active
                          ? "text-accent"
                          : "text-faint group-hover:group-hover:text-muted",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] leading-5 font-medium">
                        {conversation.title}
                      </span>
                      {preview && (
                        <span className="mt-0.5 block truncate text-[11px] leading-4 text-faint">
                          {preview}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation.id)}
                    aria-label={`Delete "${conversation.title}" conversation`}
                    title="Delete conversation"
                    className="absolute top-1/2 right-1.5 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-faint transition-[color,background-color,opacity] duration-150 hover:bg-surface-3 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent active:scale-95 sm:opacity-0 sm:group-hover/conversation:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-2.5 py-2 text-[13px] text-faint">
                {query.trim() ? "No conversations found." : "No conversations yet."}
              </p>
            )}
          </nav>
        </div>

        <div className="border-t border-edge/60 px-2 py-2.5">
          <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-1">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted ring-1 ring-edge"
              aria-hidden
            >
              GS
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-tight font-medium text-foreground">
                Guest
              </p>
              <p className="truncate text-[11px] leading-snug text-faint">
                Local session
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              title="Settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onNewConversation}
              aria-label="New chat"
              title="New chat"
              className="icon-button hidden md:flex"
            >
              <SquarePen className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}