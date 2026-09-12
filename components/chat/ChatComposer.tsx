"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import { useRef, type RefObject } from "react";

import { cn } from "@/lib/utils";

const MAX_HEIGHT = 200;

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
  enterToSend?: boolean;
  placeholder?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  enterToSend = true,
  placeholder = "Message Gilgamesh...",
  textareaRef,
}: ChatComposerProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = textareaRef ?? internalRef;
  const canSend = value.trim().length > 0 && !disabled;

  const resize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  };

  const submit = () => {
    const text = value.trim();
    if (!canSend || disabled) return;
    onSend(text);
    onChange("");
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.value = "";
      el.style.height = "auto";
      el.focus();
    });
  };

  return (
    <div className="relative border-t border-edge/70">
      <div
        className="pointer-events-none h-5 bg-gradient-to-t from-background/95 to-transparent"
        aria-hidden
      />
      <div className="bg-background px-3 pb-4 pt-1 sm:px-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="mx-auto w-full max-w-[760px]"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-edge-strong bg-surface-2 py-2 pl-2 pr-2 shadow-[0_6px_24px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] duration-200 focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/10">
            <button
              type="button"
              disabled
              aria-label="Attach files (coming soon)"
              title="Attachments are not available yet"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint opacity-60"
            >
              <Paperclip className="h-[18px] w-[18px]" aria-hidden />
            </button>
            <textarea
              ref={inputRef}
              rows={1}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                resize();
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Enter" && enterToSend && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-label="Message"
              placeholder={placeholder}
              className="max-h-[200px] min-h-[38px] flex-1 resize-none overflow-y-auto bg-transparent px-1 py-2 text-[15px] leading-6 text-foreground placeholder:text-faint focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-all duration-150 hover:bg-accent hover:text-foreground hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-foreground disabled:hover:text-background disabled:hover:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.95]"
            >
              <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
          <p
            className={cn(
              "mt-2.5 text-center text-[11px] text-faint transition-opacity duration-150",
              disabled && "opacity-60",
            )}
          >
            {disabled
              ? "Gilgamesh is thinking..."
              : "Gilgamesh can make mistakes. Verify important information."}
          </p>
        </form>
      </div>
    </div>
  );
}