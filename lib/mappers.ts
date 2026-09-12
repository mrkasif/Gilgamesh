import type { Conversation, Message } from "@/lib/types";

type MessageRow = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
};

type ConversationRow = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageRow[];
};

export function toClientMessage(row: MessageRow): Message {
  return {
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    createdAt: row.createdAt.getTime(),
    status: "completed",
  };
}

export function toClientConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    messages: row.messages?.map(toClientMessage) ?? [],
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}