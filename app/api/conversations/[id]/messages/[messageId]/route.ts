import { NextResponse } from "next/server";

import { getAuthenticatedApplicationUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = Promise<{ id: string; messageId: string }>;

export async function DELETE(
  request: Request,
  { params }: { params: RouteParams },
) {
  const user = await getAuthenticatedApplicationUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.message.deleteMany({
    where: { id: messageId, conversationId: id },
  });

  return NextResponse.json({ ok: true });
}