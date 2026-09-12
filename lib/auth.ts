import { createClient } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

export type VerifiedSupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export async function verifySupabaseToken(
  token: string,
): Promise<VerifiedSupabaseUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email ?? undefined,
    user_metadata: user.user_metadata as Record<string, unknown> | undefined,
  };
}

export async function getAuthenticatedApplicationUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabaseUser = await verifySupabaseToken(token);
  if (!supabaseUser) return null;
  return prisma.user.findUnique({ where: { supabaseId: supabaseUser.id } });
}