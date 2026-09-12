import { NextResponse } from "next/server";

import { getAuthenticatedApplicationUser } from "@/lib/auth";
import { toClientConversation } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{ id: string }>;

async function getAuthorizedConversation(
  request: Request,
  params: RouteParams,
) {
  const user = await getAuthenticatedApplicationUser(request);
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
  });
  if (!conversation) {
    return {
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    } as const;
  }
  return { user, conversation, id } as const;
}

export async function GET(
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
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    conversation: toClientConversation(conversation),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: RouteParams },
) {
  const auth = await getAuthorizedConversation(request, params);
  if ("error" in auth) return auth.error;

  const raw = await request.json().catch(() => null);
  const title =
    typeof (raw as { title?: unknown } | null)?.title === "string"
      ? (raw as { title: string }).title.trim()
      : null;
  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 },
    );
  }

  const updated = await prisma.conversation.update({
    where: { id: auth.id },
    data: { title },
  });

  return NextResponse.json({ conversation: toClientConversation(updated) });
}

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams },
) {
  const auth = await getAuthorizedConversation(request, params);
  if ("error" in auth) return auth.error;

  await prisma.conversation.delete({ where: { id: auth.id } });

  return NextResponse.json({ ok: true });
}