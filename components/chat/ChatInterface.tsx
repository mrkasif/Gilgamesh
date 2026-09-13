"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ApiError,
  createConversation,
  deleteConversationApi,
  deleteMessageApi,
  generateChat,
  getConversation,
  listConversations,
} from "@/lib/api-client";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { EmptyState } from "@/components/chat/EmptyState";
import { MessageList } from "@/components/chat/MessageList";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import {
  loadSettings,
  saveSettings,
  type Settings,
} from "@/lib/persistence";
import type { Conversation, Message, StarterPrompt } from "@/lib/types";
import { createId, deriveTitle } from "@/lib/utils";

interface ChatInterfaceProps {
  userEmail?: string;
  onLogout?: () => void;
}

export function ChatInterface({ userEmail, onLogout }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generatingConversationIdRef = useRef<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const loadedConversationIdsRef = useRef<Set<string>>(new Set());
  const messagesLoadingIdRef = useRef<string | null>(null);
  const pendingConversationsRef = useRef<Map<string, Promise<Conversation | null>>>(
    new Map(),
  );

  const resolveConversationId = useCallback(async (id: string): Promise<string> => {
    const pending = pendingConversationsRef.current.get(id);
    if (!pending) return id;
    const created = await pending;
    if (!created) throw new ApiError("Could not create conversation. Please try again.", 0);
    return created.id;
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.appearance = settings.appearance;
  }, [settings.appearance]);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        setError(err.message);
        onLogout?.();
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    },
    [onLogout],
  );

  useEffect(() => {
    let cancelled = false;
    listConversations()
      .then((list) => {
        if (cancelled) return;
        setConversations(list);
        setConversationsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setConversationsLoading(false);
        handleApiError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [handleApiError]);

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === activeConversationId,
    ) ?? null;

  const appendMessage = useCallback(
    (conversationId: string, message: Message) => {
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
    },
    [],
  );

  const replaceMessage = useCallback(
    (conversationId: string, tempId: string, message: Message) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((candidate) =>
                  candidate.id === tempId ? message : candidate,
                ),
              }
            : conversation,
        ),
      );
    },
    [],
  );

  const removeMessage = useCallback(
    (conversationId: string, messageId: string) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.filter(
                  (candidate) => candidate.id !== messageId,
                ),
              }
            : conversation,
        ),
      );
    },
    [],
  );

  const setConversationTitle = useCallback(
    (conversationId: string, title: string) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, title }
            : conversation,
        ),
      );
    },
    [],
  );

  const loadConversations = useCallback(async () => {
    try {
      const list = await listConversations();
      loadedConversationIdsRef.current.clear();
      setConversations(list);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const loadMessages = useCallback(
    async (id: string) => {
      if (loadedConversationIdsRef.current.has(id)) return;
      if (messagesLoadingIdRef.current === id) return;
      messagesLoadingIdRef.current = id;
      try {
        const conversation = await getConversation(id);
        if (messagesLoadingIdRef.current !== id) return;
        loadedConversationIdsRef.current.add(id);
        setConversations((prev) =>
          prev.map((candidate) =>
            candidate.id === id && generatingConversationIdRef.current !== id
              ? conversation
              : candidate,
          ),
        );
      } catch (err) {
        if (messagesLoadingIdRef.current !== id) return;
        handleApiError(err);
      } finally {
        if (messagesLoadingIdRef.current === id) {
          messagesLoadingIdRef.current = null;
        }
      }
    },
    [handleApiError],
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !activeConversation || isGenerating) return;

      const conversationId = activeConversation.id;
      const now = Date.now();
      const isFirstMessage = activeConversation.messages.length === 0;

      const userMessage: Message = {
        id: createId("msg"),
        role: "user",
        content: text,
        createdAt: now,
        status: "completed",
      };

      appendMessage(conversationId, userMessage);
      if (isFirstMessage) {
        setConversationTitle(conversationId, deriveTitle(text));
      }

      setIsGenerating(true);
      generatingConversationIdRef.current = conversationId;
      let effectiveId = conversationId;
      try {
        effectiveId = await resolveConversationId(conversationId);
        const result = await generateChat(effectiveId, {
          content: text,
          title: isFirstMessage ? deriveTitle(text) : undefined,
        });
        if (result.userMessage) {
          replaceMessage(effectiveId, userMessage.id, result.userMessage);
        }
        if (result.title) {
          setConversationTitle(effectiveId, result.title);
        }
        if (result.assistantMessage) {
          appendMessage(effectiveId, result.assistantMessage);
        } else if (result.error) {
          setError(result.error);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } catch (err) {
        removeMessage(effectiveId, userMessage.id);
        handleApiError(err);
        return;
      } finally {
        generatingConversationIdRef.current = null;
        setIsGenerating(false);
      }
    },
    [
      activeConversation,
      isGenerating,
      resolveConversationId,
      appendMessage,
      setConversationTitle,
      replaceMessage,
      removeMessage,
      handleApiError,
    ],
  );

  const handleStartConversation = useCallback((prompt: StarterPrompt) => {
    setDraft(prompt.message);
    setSidebarOpen(false);
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const handleNewConversation = useCallback(() => {
    const localId = createId("c");
    const now = Date.now();
    const optimistic: Conversation = {
      id: localId,
      title: "New chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    const created = createConversation()
      .then((conversation) => {
        pendingConversationsRef.current.delete(localId);
        loadedConversationIdsRef.current.delete(localId);
        loadedConversationIdsRef.current.add(conversation.id);
        setConversations((prev) =>
          prev.map((candidate) =>
            candidate.id === localId
              ? {
                  ...conversation,
                  messages: candidate.messages,
                  title:
                    candidate.title === "New chat"
                      ? conversation.title
                      : candidate.title,
                  updatedAt: Math.max(candidate.updatedAt, conversation.updatedAt),
                }
              : candidate,
          ),
        );
        setActiveConversationId((prev) =>
          prev === localId ? conversation.id : prev,
        );
        return conversation;
      })
      .catch((err: unknown) => {
        pendingConversationsRef.current.delete(localId);
        setConversations((prev) =>
          prev.filter((candidate) => candidate.id !== localId),
        );
        setActiveConversationId((prev) => (prev === localId ? null : prev));
        handleApiError(err);
        return null;
      });

    pendingConversationsRef.current.set(localId, created);
    setConversations((prev) => [optimistic, ...prev]);
    setActiveConversationId(localId);
    setSidebarOpen(false);
    setDraft("");
    requestAnimationFrame(() => composerRef.current?.focus());
  }, [handleApiError]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      setSidebarOpen(false);
      void loadMessages(id);
    },
    [loadMessages],
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      const effectiveId = await resolveConversationId(id).catch(() => id);
      pendingConversationsRef.current.delete(id);
      pendingConversationsRef.current.delete(effectiveId);

      if (
        generatingConversationIdRef.current === effectiveId ||
        generatingConversationIdRef.current === id
      ) {
        generatingConversationIdRef.current = null;
        setIsGenerating(false);
      }

      try {
        await deleteConversationApi(effectiveId);
      } catch (err) {
        handleApiError(err);
        void loadConversations();
        return;
      }

      loadedConversationIdsRef.current.delete(effectiveId);
      loadedConversationIdsRef.current.delete(id);

      const remaining = conversations.filter(
        (conversation) =>
          conversation.id !== effectiveId && conversation.id !== id,
      );
      setConversations(remaining);

      if (activeConversationId !== id && activeConversationId !== effectiveId) {
        return;
      }

      if (remaining.length === 0) {
        setActiveConversationId(null);
        return;
      }

      const next =
        [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0] ??
        remaining[0];
      setActiveConversationId(next.id);
      void loadMessages(next.id);
    },
    [
      conversations,
      activeConversationId,
      handleApiError,
      loadConversations,
      loadMessages,
      resolveConversationId,
    ],
  );

  const handleCopy = useCallback((message: Message) => {
    void navigator.clipboard.writeText(message.content);
  }, []);

  const handleClearConversations = useCallback(async () => {
    generatingConversationIdRef.current = null;
    setIsGenerating(false);

    try {
      const targets = await Promise.all(
        conversations.map((conversation) => {
          const pending = pendingConversationsRef.current.get(conversation.id);
          return pending
            ? pending.then(
                (created) => created ?? conversation,
                () => conversation,
              )
            : Promise.resolve(conversation);
        }),
      );
      pendingConversationsRef.current.clear();
      await Promise.all(
        targets.map((conversation) => deleteConversationApi(conversation.id)),
      );
      loadedConversationIdsRef.current.clear();
      setConversations([]);
      setActiveConversationId(null);
    } catch (err) {
      handleApiError(err);
      void loadConversations();
    }
  }, [conversations, handleApiError, loadConversations]);

  const handleRegenerate = useCallback(
    async (message: Message) => {
      if (isGenerating || !activeConversation) return;
      const index = activeConversation.messages.findIndex(
        (candidate) => candidate.id === message.id,
      );
      if (
        index === -1 ||
        activeConversation.messages[index].role !== "assistant"
      ) {
        return;
      }

      const conversationId = activeConversation.id;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.slice(0, index),
                updatedAt: Date.now(),
              }
            : conversation,
        ),
      );

      try {
        await deleteMessageApi(conversationId, message.id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return;
        handleApiError(err);
        return;
      }

      setIsGenerating(true);
      generatingConversationIdRef.current = conversationId;
      try {
        const result = await generateChat(conversationId, {
          content: "",
          regenerate: true,
        });
        if (result.assistantMessage) {
          appendMessage(conversationId, result.assistantMessage);
        } else if (result.error) {
          setError(result.error);
        } else {
          setError("Something went wrong. Please try again.");
        }
      } catch (err) {
        handleApiError(err);
      } finally {
        generatingConversationIdRef.current = null;
        setIsGenerating(false);
      }
    },
    [activeConversation, isGenerating, appendMessage, handleApiError],
  );

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const hasMessages = (activeConversation?.messages.length ?? 0) > 0;
  const composerDisabled = isGenerating || conversationsLoading;

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

        {error && (
          <div
            role="alert"
            className="mx-4 mt-3 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[13px] leading-5 text-red-300"
          >
            <p className="min-w-0 flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="shrink-0 rounded-md px-1 py-0.5 text-red-300/70 transition-colors duration-150 hover:bg-red-500/15 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {conversationsLoading ? (
            <div className="flex h-full min-h-40 items-center justify-center">
              <div
                className="animate-spin rounded-full border border-edge-strong border-t-accent"
                style={{ width: 24, height: 24 }}
                role="status"
                aria-label="Loading"
              />
            </div>
          ) : hasMessages ? (
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
          onSend={(value) => void sendMessage(value)}
          disabled={composerDisabled}
          enterToSend={settings.enterToSend}
          textareaRef={composerRef}
        />
      </div>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        conversationCount={conversations.length}
        onClearConversations={() => void handleClearConversations()}
        onClose={handleCloseSettings}
      />
    </div>
  );
}