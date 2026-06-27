"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  createdAt: string;
  is_admin: boolean;
  bio: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function syncUser(session: Session): Promise<User> {
  const res = await fetch("https://quorel.onrender.com/auth/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata?.full_name ?? "",
    }),
  });

  if (!res.ok) throw new Error("auth sync failed");

  const data = await res.json();
  return {
    id: data.user_id,
    name: session.user.user_metadata?.full_name ?? "",
    email: data.email,
    username: data.username,
    createdAt: data.created_at,
    is_admin: data.is_admin,
    bio: data.bio ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // No session in localStorage — flip loading immediately
        // AuthGuard handles the redirect from here
        setLoading(false);
        return;
      }

      // Session exists — sync with backend
      try {
        const u = await syncUser(session);
        setUser(u);
      } catch {
        setUser(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          const u = await syncUser(session);
          setUser(u);
        } catch {
          setUser(null);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}