"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { AuthScreen } from "@/components/auth/AuthScreen";
import ChatInterfaceClient from "@/components/chat/ChatInterfaceClient";
import { getSupabase } from "@/lib/supabase/client";

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const syncTokenRef = useRef<string | null>(null);

  const syncUser = useCallback(async (current: Session) => {
    if (syncTokenRef.current === current.access_token) return;
    syncTokenRef.current = current.access_token;
    try {
      const response = await fetch("/api/sync-user", {
        method: "POST",
        headers: { authorization: `Bearer ${current.access_token}` },
      });
      if (!response.ok) throw new Error("sync failed");
    } catch {
      syncTokenRef.current = null;
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const client = getSupabase();
    void client.auth.getSession().then(({ data }) => {
      if (disposed) return;
      setLoading(false);
      if (data.session) {
        setSession(data.session);
        void syncUser(data.session);
      }
    });
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, current) => {
      if (disposed) return;
      setSession(current);
      if (current) void syncUser(current);
    });
    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, [syncUser]);

  const handleLogout = useCallback(async () => {
    await getSupabase().auth.signOut();
    setSession(null);
  }, []);

  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div
            className="animate-spin rounded-full border border-edge-strong border-t-accent"
            style={{ width: 32, height: 32 }}
            aria-hidden
          />
          <p className="text-sm text-faint">Loading Gilgamesh...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <ChatInterfaceClient
      userEmail={session.user.email ?? undefined}
      onLogout={handleLogout}
    />
  );
}