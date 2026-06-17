"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthGuardProps {
  hide?: string[];
  modal?: string[];
}

export function AuthGuard({ hide, modal }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Fast session check — reads from local storage, no network call
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && !hide?.length && !modal?.length) {
        router.push("/auth");
      }
    });
  }, []);

  // CSS injection for hide
  useEffect(() => {
    if (user || loading) return;
    if (!hide?.length) return;
    const style = document.createElement("style");
    style.id = "auth-guard-hide";
    style.innerHTML = hide.map((cls) => `${cls} { display: none !important; }`).join("\n");
    document.head.appendChild(style);
    return () => {
      document.getElementById("auth-guard-hide")?.remove();
    };
  }, [user, loading, hide]);

  // Click intercept for modal
  useEffect(() => {
    if (user || loading) return;
    if (!modal?.length) return;
    const handlers: { el: Element; fn: (e: Event) => void }[] = [];
    modal.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        const fn = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        };
        el.addEventListener("click", fn, true);
        handlers.push({ el, fn });
      });
    });
    return () => {
      handlers.forEach(({ el, fn }) => el.removeEventListener("click", fn, true));
    };
  }, [user, loading, modal]);

  // Early returns AFTER all hooks
  if (loading) return null;
  if (!user && !hide?.length && !modal?.length) return null;
  if (user) return null;

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Sign in required</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You need an account to perform this action.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button asChild className="w-full">
            <Link href="/auth">Sign in / Sign up</Link>
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}