import { NextResponse } from "next/server";

import { getAuthenticatedApplicationUser } from "@/lib/auth";
import {
  generateAssistantReply,
  GeminiError,
  type GeminiMessage,
} from "@/lib/gemini";
import { toClientMessage } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{ id: string }>;

export async function POST(
  request: Request,
  { params }: { params: RouteParams },
) {
  const user = await getAuthenticatedApplicationUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { messages: true } } },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const regenerate =
    (body as { regenerate?: unknown } | null)?.regenerate === true;
  const content =
    typeof (body as { content?: unknown } | null)?.content === "string" &&
    (body as { content: string }).content.trim().length > 0
      ? (body as { content: string }).content.trim()
      : null;

  if (!regenerate && !content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  let savedUserMessage:
    | { id: string; role: string; content: string; createdAt: Date }
    | undefined;
  let updatedTitle: string | undefined;

  if (!regenerate) {
    const isFirstMessage = conversation._count.messages === 0;
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        role: "user",
        content: content as string,
      },
    });
    savedUserMessage = message;

    if (isFirstMessage) {
      const rawTitle = (body as { title?: unknown } | null)?.title;
      if (typeof rawTitle === "string" && rawTitle.trim().length > 0) {
        await prisma.conversation.update({
          where: { id },
          data: { title: rawTitle.trim() },
        });
        updatedTitle = rawTitle.trim();
      }
    }
  }

  const previousMessages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });
  const history: GeminiMessage[] = previousMessages.map((previousMessage) => ({
    role: previousMessage.role === "assistant" ? "assistant" : "user",
    content: previousMessage.content,
  }));

  let assistantText: string;
  try {
    assistantText = await generateAssistantReply(history);
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json(
        {
          error: err.message,
          userMessage: savedUserMessage
            ? toClientMessage(savedUserMessage)
            : undefined,
          title: updatedTitle,
        },
        { status: 502 },
      );
    }
    throw err;
  }

  const assistantMessage = await prisma.message.create({
    data: { conversationId: id, role: "assistant", content: assistantText },
  });

  return NextResponse.json(
    {
      userMessage: savedUserMessage
        ? toClientMessage(savedUserMessage)
        : undefined,
      assistantMessage: toClientMessage(assistantMessage),
      title: updatedTitle,
    },
    { status: 201 },
  );
}