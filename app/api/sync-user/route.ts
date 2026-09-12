import { NextResponse } from "next/server";

import { verifySupabaseToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await verifySupabaseToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email ?? "";
  const metadata = user.user_metadata ?? {};
  const name =
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    email.split("@")[0] ??
    null;

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: { email, name },
    create: {
      supabaseId: user.id,
      email,
      name,
    },
  });

  return NextResponse.json({ user: dbUser });
}