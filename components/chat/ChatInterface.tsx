"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { EmptyState } from "@/components/chat/EmptyState";
import { MessageList } from "@/components/chat/MessageList";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { DEMO_RESPONSE, MOCK_CONVERSATIONS } from "@/lib/mock-data";
import {
  loadChatState,
  loadSettings,
  saveChatState,
  saveSettings,
  type Settings,
} from "@/lib/persistence";
import type { Conversation, Message, StarterPrompt } from "@/lib/types";
import { createId, deriveTitle } from "@/lib/utils";

const REPLY_DELAY_MS = 1_000;

interface ChatInterfaceProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function ChatInterface({ userEmail, onLogout }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = loadChatState();
    return saved ? saved.conversations : MOCK_CONVERSATIONS;
  });
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(() => {
    const saved = loadChatState();
    return saved ? saved.activeConversationId : null;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatingConversationIdRef = useRef<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    saveChatState({ conversations, activeConversationId });
  }, [conversations, activeConversationId]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.appearance = settings.appearance;
  }, [settings.appearance]);

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ??
    null;

  const scheduleReply = useCallback((conversationId: string) => {
    setIsGenerating(true);
    generatingConversationIdRef.current = conversationId;
    replyTimerRef.current = setTimeout(() => {
      generatingConversationIdRef.current = null;
      const message: Message = {
        id: createId("msg"),
        role: "assistant",
        content: DEMO_RESPONSE,
        createdAt: Date.now(),
        status: "completed",
      };
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, message],
                updatedAt: message.createdAt,
              }
            : conversation,
        ),
      );
      setIsGenerating(false);
    }, REPLY_DELAY_MS);
  }, []);

  const sendMessage = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || isGenerating) return;

      const now = Date.now();
      const userMessage: Message = {
        id: createId("msg"),
        role: "user",
        content: text,
        createdAt: now,
        status: "completed",
      };

      const active =
        conversations.find(
          (conversation) => conversation.id === activeConversationId,
        ) ?? null;

      if (active && active.messages.length === 0) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === active.id
              ? {
                  ...conversation,
                  title: deriveTitle(text),
                  messages: [userMessage],
                  updatedAt: now,
                }
              : conversation,
          ),
        );
        scheduleReply(active.id);
        return;
      }

      if (active && active.messages.length > 0) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === active.id
              ? {
                  ...conversation,
                  messages: [...conversation.messages, userMessage],
                  updatedAt: now,
                }
              : conversation,
          ),
        );
        scheduleReply(active.id);
        return;
      }

      const conversation: Conversation = {
        id: createId("conv"),
        title: deriveTitle(text),
        messages: [userMessage],
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      scheduleReply(conversation.id);
    },
    [conversations, activeConversationId, isGenerating, scheduleReply],
  );

  const handleStartConversation = useCallback((prompt: StarterPrompt) => {
    setDraft(prompt.message);
    setSidebarOpen(false);
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const handleNewConversation = useCallback(() => {
    const now = Date.now();
    const conversation: Conversation = {
      id: createId("conv"),
      title: "New chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conversation, ...prev]);
    setActiveConversationId(conversation.id);
    setSidebarOpen(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      if (generatingConversationIdRef.current === id) {
        generatingConversationIdRef.current = null;
        if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
        replyTimerRef.current = null;
        setIsGenerating(false);
      }

      const remaining = conversations.filter((conversation) => conversation.id !== id);
      setConversations(remaining);

      if (activeConversationId !== id) return;

      if (remaining.length === 0) {
        setActiveConversationId(null);
        return;
      }

      const next =
        [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? remaining[0];
      setActiveConversationId(next.id);
    },
    [conversations, activeConversationId],
  );

  const handleCopy = useCallback((message: Message) => {
    void navigator.clipboard.writeText(message.content);
  }, []);

  const handleClearConversations = useCallback(() => {
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    replyTimerRef.current = null;
    generatingConversationIdRef.current = null;
    setIsGenerating(false);
    setConversations([]);
    setActiveConversationId(null);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleRegenerate = useCallback(
    (message: Message) => {
      if (isGenerating || !activeConversation) return;
      const index = activeConversation.messages.findIndex(
        (candidate) => candidate.id === message.id,
      );
      if (index === -1 || activeConversation.messages[index].role !== "assistant") {
        return;
      }
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                messages: conversation.messages.slice(0, index),
                updatedAt: Date.now(),
              }
            : conversation,
        ),
      );
      scheduleReply(activeConversation.id);
    },
    [activeConversation, isGenerating, scheduleReply],
  );

  const hasMessages = (activeConversation?.messages.length ?? 0) > 0;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background font-sans text-foreground">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        open={sidebarOpen}
        userEmail={userEmail}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={onLogout}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={activeConversation?.title ?? null}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={handleNewConversation}
        />

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {hasMessages ? (
            <MessageList
              messages={activeConversation?.messages ?? []}
              isGenerating={isGenerating}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
            />
          ) : (
            <EmptyState onStartConversation={handleStartConversation} />
          )}
        </main>

        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={sendMessage}
          disabled={isGenerating}
          enterToSend={settings.enterToSend}
          textareaRef={composerRef}
        />
      </div>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        conversationCount={conversations.length}
        onClearConversations={handleClearConversations}
        onClose={handleCloseSettings}
      />
    </div>
  );
}