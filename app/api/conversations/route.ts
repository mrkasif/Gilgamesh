import { NextResponse } from "next/server";

import { getAuthenticatedApplicationUser } from "@/lib/auth";
import { toClientConversation } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getAuthenticatedApplicationUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    conversations: conversations.map(toClientConversation),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedApplicationUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawTitle = await request.json().then(
    (body: unknown) => (body as { title?: unknown })?.title,
    () => undefined,
  );
  const title =
    typeof rawTitle === "string" && rawTitle.trim().length > 0
      ? rawTitle.trim()
      : "New chat";

  const conversation = await prisma.conversation.create({
    data: { userId: user.id, title },
  });

  return NextResponse.json(
    { conversation: toClientConversation(conversation) },
    { status: 201 },
  );
}