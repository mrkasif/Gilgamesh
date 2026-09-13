"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  onCopy?: (message: Message) => void;
  onRegenerate?: (message: Message) => void;
}

export function MessageBubble({
  message,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void onCopy?.(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="message-in max-w-[85%] rounded-lg border border-edge-strong bg-composer px-3.5 py-2 text-[14.5px] leading-6 whitespace-pre-wrap text-foreground sm:max-w-[70%]">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="group/message">
      <div className="flex items-start gap-3">
        <BrandMark className="mt-0.5 h-7 w-7 shrink-0 rounded-md shadow-md shadow-black/25 ring-1 ring-edge" />
        <div className="message-in min-w-0 flex-1 pt-0.5 text-[15px] leading-[1.75] text-foreground text-pretty">
          <MarkdownContent content={message.content} />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-0.5 pl-10 transition-opacity duration-150 md:opacity-0 md:group-hover/message:opacity-100 md:focus-within:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy message"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          <span className={cn(copied && "text-accent")}>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onRegenerate?.(message)}
          aria-label="Regenerate response"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  );
}