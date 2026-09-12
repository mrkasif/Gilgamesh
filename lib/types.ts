export type MessageRole = "user" | "assistant";

export type MessageStatus = "streaming" | "completed";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface StarterPrompt {
  id: string;
  title: string;
  description: string;
  message: string;
}