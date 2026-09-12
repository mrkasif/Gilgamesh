import type { Conversation, Message, MessageRole, MessageStatus } from "./types";

const CHAT_STORAGE_KEY = "gilgamesh-chat-state-v1";
const SETTINGS_STORAGE_KEY = "gilgamesh-settings-v1";
const STORAGE_VERSION = 1;

export interface PersistedChatState {
  version: number;
  activeConversationId: string | null;
  conversations: Conversation[];
}

export interface Settings {
  appearance: "dark" | "light";
  enterToSend: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  appearance: "dark",
  enterToSend: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeMessage(raw: unknown): Message | null {
  if (!isRecord(raw)) return null;
  const { id, role, content, createdAt, status } = raw;
  if (typeof id !== "string" || id.length === 0) return null;
  if (role !== "user" && role !== "assistant") return null;
  if (typeof content !== "string") return null;
  const safeStatus: MessageStatus =
    status === "streaming" || status === "completed" ? status : "completed";
  const safeRole: MessageRole = role;
  return {
    id,
    role: safeRole,
    content,
    createdAt: typeof createdAt === "number" ? createdAt : Date.now(),
    status: safeStatus,
  };
}

function sanitizeConversation(raw: unknown): Conversation | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  if (typeof id !== "string" || id.length === 0) return null;
  if (!Array.isArray(raw.messages)) return null;
  const messages = raw.messages
    .map(sanitizeMessage)
    .filter((message): message is Message => message !== null);
  const now = Date.now();
  return {
    id,
    title:
      typeof raw.title === "string" && raw.title.trim().length > 0
        ? raw.title
        : "New chat",
    messages,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
  };
}

function sanitizeChatState(raw: unknown): PersistedChatState | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== STORAGE_VERSION) return null;
  if (!Array.isArray(raw.conversations)) return null;

  const seen = new Set<string>();
  const conversations: Conversation[] = [];
  for (const item of raw.conversations) {
    const conversation = sanitizeConversation(item);
    if (conversation !== null && !seen.has(conversation.id)) {
      seen.add(conversation.id);
      conversations.push(conversation);
    }
  }

  const activeId = raw.activeConversationId;
  const activeConversationId =
    typeof activeId === "string" && seen.has(activeId) ? activeId : null;

  return { version: STORAGE_VERSION, activeConversationId, conversations };
}

export function loadChatState(): PersistedChatState | null {
  try {
    if (typeof window === "undefined") return null;
    const serialized = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!serialized) return null;
    return sanitizeChatState(JSON.parse(serialized));
  } catch {
    return null;
  }
}

export function saveChatState(
  state: Omit<PersistedChatState, "version">,
): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, ...state }),
    );
  } catch {
    // Quota/security errors are ignored; persistence is best-effort.
  }
}

export function loadSettings(): Settings {
  try {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const serialized = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!serialized) return DEFAULT_SETTINGS;
    const raw: unknown = JSON.parse(serialized);
    if (!isRecord(raw) || raw.version !== STORAGE_VERSION) {
      return DEFAULT_SETTINGS;
    }
    return {
      appearance: raw.appearance === "light" ? "light" : "dark",
      enterToSend:
        typeof raw.enterToSend === "boolean" ? raw.enterToSend : true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, ...settings }),
    );
  } catch {
    // Ignored.
  }
}