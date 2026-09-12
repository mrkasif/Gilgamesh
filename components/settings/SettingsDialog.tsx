"use client";

import { Check, Moon, Sun, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import type { Settings } from "@/lib/persistence";
import { cn } from "@/lib/utils";

const APPEARANCE_OPTIONS = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
] as const;

interface SettingsDialogProps {
  open: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  conversationCount: number;
  onClearConversations: () => void;
  onClose: () => void;
}

export function SettingsDialog({
  open,
  settings,
  onChange,
  conversationCount,
  onClearConversations,
  onClose,
}: SettingsDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusTimer = requestAnimationFrame(() => panelRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") && element.tabIndex >= 0,
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        className="relative flex max-h-[min(88dvh,640px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-edge-strong bg-panel shadow-[0_24px_64px_rgba(0,0,0,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-edge/70 px-4 py-3">
          <h2
            id="settings-title"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="icon-button"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {confirmClear ? (
            <section aria-labelledby="settings-clear-confirm-title">
              <h3
                id="settings-clear-confirm-title"
                className="text-[13px] leading-5 font-semibold text-foreground"
              >
                Clear all conversations?
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-faint">
                This permanently removes all{" "}
                {conversationCount === 0
                  ? "conversations"
                  : conversationCount === 1
                    ? "1 conversation"
                    : `${conversationCount} conversations`}{" "}
                stored in this browser. This cannot be undone.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="rounded-lg border border-edge-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearConversations();
                    onClose();
                  }}
                  className="rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-1.5 text-[13px] font-medium text-red-400 transition-colors duration-150 hover:bg-red-500/25 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400"
                >
                  Clear all
                </button>
              </div>
            </section>
          ) : (
            <div className="space-y-6">
              <section aria-labelledby="settings-appearance-title">
                <h3
                  id="settings-appearance-title"
                  className="text-[10px] font-semibold tracking-[0.18em] text-faint uppercase"
                >
                  Appearance
                </h3>
                <p className="mt-1 text-xs leading-5 text-faint">
                  How Gilgamesh looks. Dark is the default theme.
                </p>
                <div
                  role="radiogroup"
                  aria-label="Appearance"
                  className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-edge bg-surface p-1"
                >
                  {APPEARANCE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = settings.appearance === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange({ appearance: option.value })}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                          selected
                            ? "bg-surface-3 text-foreground"
                            : "text-faint hover:bg-surface-2 hover:text-muted",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            selected && "text-accent",
                          )}
                          aria-hidden
                        />
                        {option.label}
                        {selected && (
                          <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="settings-chat-title">
                <h3
                  id="settings-chat-title"
                  className="text-[10px] font-semibold tracking-[0.18em] text-faint uppercase"
                >
                  Chat
                </h3>
                <p className="mt-1 text-xs leading-5 text-faint">
                  How messages are sent.
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-edge bg-surface px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      Enter to send
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-faint">
                      When off, Enter starts a new line and you send with the
                      button.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.enterToSend}
                    aria-label="Enter to send"
                    onClick={() =>
                      onChange({ enterToSend: !settings.enterToSend })
                    }
                    className={cn(
                      "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      settings.enterToSend
                        ? "border-accent/40 bg-accent/10"
                        : "border-edge-strong bg-surface-2",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-[left,background-color] duration-150",
                        settings.enterToSend
                          ? "left-[20px] bg-accent"
                          : "left-0.5 bg-faint",
                      )}
                    />
                  </button>
                </div>
              </section>

              <section aria-labelledby="settings-about-title">
                <h3
                  id="settings-about-title"
                  className="text-[10px] font-semibold tracking-[0.18em] text-faint uppercase"
                >
                  About
                </h3>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface px-3.5 py-3">
                    <BrandMark className="h-9 w-9 rounded-lg" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-foreground">
                        Gilgamesh
                      </p>
                      <p className="mt-0.5 text-xs leading-4 text-faint">
                        Made by Kashif Sayyad
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-edge bg-surface px-3.5 py-3">
                    <p className="text-[13px] font-medium text-foreground">
                      AI engine
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-faint">
                      Powered by the free Google Gemini API.
                    </p>
                  </div>
                </div>
              </section>

              <section aria-labelledby="settings-data-title">
                <h3
                  id="settings-data-title"
                  className="text-[10px] font-semibold tracking-[0.18em] text-faint uppercase"
                >
                  Data
                </h3>
                <p className="mt-1 text-xs leading-5 text-faint">
                  Manage what Gilgamesh stores on this device.
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-edge bg-surface p-3.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      Clear conversations
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-faint">
                      {conversationCount === 0
                        ? "No conversations stored in this browser."
                        : conversationCount === 1
                          ? "1 conversation stored in this browser."
                          : `${conversationCount} conversations stored in this browser.`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    disabled={conversationCount === 0}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-edge-strong px-2.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-edge-strong disabled:hover:bg-transparent disabled:hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Clear
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}