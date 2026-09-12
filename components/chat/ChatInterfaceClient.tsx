"use client";

import dynamic from "next/dynamic";

const ChatInterface = dynamic(
  () => import("@/components/chat/ChatInterface").then((m) => m.ChatInterface),
  { ssr: false },
);

export default function ChatInterfaceClient() {
  return <ChatInterface />;
}