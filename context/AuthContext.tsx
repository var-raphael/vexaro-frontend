"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username: string;
  createdAt: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ── Mock Google user — replace with Supabase later ───────────────────────────

const MOCK_GOOGLE_USER: User = {
  id: "usr_raphael_001",
  name: "Raphael Samuel",
  email: "raphael@vexaro.dev",
  avatar: "",
  username: "raphael",
  createdAt: new Date().toISOString(),
  is_admin: true,
};

const STORAGE_KEY = "vexaro_user";

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Always merge with MOCK_GOOGLE_USER so dev changes are reflected immediately
        const parsed = JSON.parse(stored);
        setUser({ ...MOCK_GOOGLE_USER, createdAt: parsed.createdAt });
      }
    } catch {}
    setLoading(false);
  }, []);

  // Simulate Google OAuth
  // When you wire Supabase: replace this with supabase.auth.signInWithOAuth({ provider: "google" })
  async function signInWithGoogle() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    const stored = localStorage.getItem(STORAGE_KEY);
    const sessionUser: User = {
      ...MOCK_GOOGLE_USER,
      createdAt: stored
        ? JSON.parse(stored).createdAt
        : new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setLoading(false);
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}