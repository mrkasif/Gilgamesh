import { getSupabase } from "@/lib/supabase/client";
import type { Conversation, Message } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  if (session?.access_token) {
    headers.set("authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new ApiError("Network error. Please check your connection.", 0);
  }

  const status = response.status;
  if (status === 401) {
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new ApiError(body?.error ?? `Request failed (${status})`, status, body);
  }
  return response.json();
}

export async function listConversations(): Promise<Conversation[]> {
  const data = (await request("/api/conversations")) as {
    conversations: Conversation[];
  };
  return data.conversations;
}

export async function createConversation(): Promise<Conversation> {
  const data = (await request("/api/conversations", {
    method: "POST",
    body: JSON.stringify({}),
  })) as { conversation: Conversation };
  return data.conversation;
}

export async function getConversation(id: string): Promise<Conversation> {
  const data = (await request(`/api/conversations/${id}`)) as {
    conversation: Conversation;
  };
  return data.conversation;
}

export async function updateConversationTitle(
  id: string,
  title: string,
): Promise<void> {
  await request(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversationApi(id: string): Promise<void> {
  await request(`/api/conversations/${id}`, { method: "DELETE" });
}

export async function createMessage(
  conversationId: string,
  input: { role: "user" | "assistant"; content: string; title?: string },
): Promise<{ message: Message; title?: string }> {
  const data = (await request(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  )) as { message: Message; title?: string };
  return data;
}

export async function deleteMessageApi(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await request(`/api/conversations/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
  });
}

export async function generateChat(
  conversationId: string,
  input: { content: string; title?: string; regenerate?: boolean },
): Promise<{
  userMessage?: Message;
  assistantMessage?: Message;
  title?: string;
  error?: string;
}> {
  try {
    return (await request(`/api/conversations/${conversationId}/chat`, {
      method: "POST",
      body: JSON.stringify(input),
    })) as {
      userMessage?: Message;
      assistantMessage?: Message;
      title?: string;
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 502) {
      const data = (err.data ?? {}) as {
        error?: string;
        userMessage?: Message;
        title?: string;
      };
      return {
        error: data.error ?? err.message,
        userMessage: data.userMessage,
        title: data.title,
      };
    }
    throw err;
  }
}