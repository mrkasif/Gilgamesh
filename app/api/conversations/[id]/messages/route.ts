import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { getAuthenticatedApplicationUser } from "@/lib/auth";
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
  const role: Role =
    (body as { role?: string } | null)?.role === "assistant"
      ? Role.assistant
      : Role.user;
  const content =
    typeof (body as { content?: string } | null)?.content === "string" &&
    (body as { content: string }).content.trim().length > 0
      ? (body as { content: string }).content.trim()
      : null;
  if (!content) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 },
    );
  }

  const message = await prisma.message.create({
    data: { conversationId: id, role, content },
  });

  let updatedTitle: string | undefined;
  if (conversation._count.messages === 0) {
    const rawTitle = (body as { title?: string } | null)?.title;
    if (typeof rawTitle === "string" && rawTitle.trim().length > 0) {
      await prisma.conversation.update({
        where: { id },
        data: { title: rawTitle.trim() },
      });
      updatedTitle = rawTitle.trim();
    }
  }

  return NextResponse.json(
    { message: toClientMessage(message), title: updatedTitle ?? conversation.title },
    { status: 201 },
  );
}