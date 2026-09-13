"use client";

import { useEffect, useRef } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { MessageBubble } from "@/components/chat/MessageBubble";
import type { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  onCopy?: (message: Message) => void;
  onRegenerate?: (message: Message) => void;
}

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3" aria-label="Gilgamesh is thinking" role="status">
      <BrandMark className="mt-0.5 h-7 w-7 shrink-0 rounded-md shadow-md shadow-black/25 ring-1 ring-edge" />
      <div className="flex h-9 items-center gap-1.5 rounded-full border border-edge bg-surface px-3.5">
        <span className="thinking-dot" aria-hidden />
        <span className="thinking-dot" aria-hidden />
        <span className="thinking-dot" aria-hidden />
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  isGenerating,
  onCopy,
  onRegenerate,
}: MessageListProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const container = root.closest("main");
    if (!container) return;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distance < 240) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isGenerating]);

  return (
    <div
      ref={rootRef}
      aria-live="polite"
      className="mx-auto w-full max-w-[760px] space-y-6 px-4 pt-8 pb-6 sm:px-6"
    >
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
        />
      ))}
      {isGenerating && (
        <div className="typing-in">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}