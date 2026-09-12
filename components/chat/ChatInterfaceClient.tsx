"use client";

import dynamic from "next/dynamic";

const ChatInterface = dynamic(
  () => import("@/components/chat/ChatInterface").then((m) => m.ChatInterface),
  { ssr: false },
);

interface ChatInterfaceClientProps {
  userEmail?: string;
  onLogout?: () => void;
}

export default function ChatInterfaceClient({
  userEmail,
  onLogout,
}: ChatInterfaceClientProps) {
  return <ChatInterface userEmail={userEmail} onLogout={onLogout} />;
}