"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RefreshCw,
  GitBranch,
  Copy,
  AlertTriangle,
  Megaphone,
  Bell,
  CheckCheck,
  Download,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import { callBackend } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifKind =
  | "refresh_complete"
  | "new_version"
  | "dataset_created"
  | "first_dataset"
  | "clone_created"
  | "dataset_cloned"
  | "dataset_deleted"
  | "announcement";

interface Notification {
  notification_id: number;
  user_id: string;
  dataset_id: number | null;
  kind: NotifKind;
  message: string;
  is_read: boolean;
  emailed: boolean;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<
  NotifKind,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  refresh_complete: {
    icon: RefreshCw,
    label: "Dataset Refresh",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  new_version: {
    icon: GitBranch,
    label: "New Version",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  dataset_created: {
    icon: Plus,
    label: "Dataset Created",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  first_dataset: {
    icon: Plus,
    label: "First Dataset",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  clone_created: {
    icon: Copy,
    label: "Clone Created",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  dataset_cloned: {
    icon: Copy,
    label: "Clone Activity",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  dataset_deleted: {
    icon: Trash2,
    label: "Dataset Deleted",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
};

const FALLBACK_CONFIG = {
  icon: Bell,
  label: "Notification",
  color: "text-primary",
  bg: "bg-accent border-primary/20",
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// ── Notification Row ──────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onMarkRead,
}: {
  notif: Notification;
  onMarkRead: (id: number) => void;
}) {
  const config = KIND_CONFIG[notif.kind] ?? FALLBACK_CONFIG;
  const { icon: Icon, color, bg, label } = config;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer",
        notif.is_read
          ? "bg-card border-border"
          : "bg-accent/10 border-primary/20"
      )}
      onClick={() => !notif.is_read && onMarkRead(notif.notification_id)}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-9 h-9 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
          bg
        )}
      >
        <Icon size={15} className={color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">
              {notif.message}
            </p>
            {!notif.is_read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTime(notif.created_at)}
          </span>
        </div>
        <span className="inline-block mt-2 text-xs font-mono text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-full">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await callBackend(`/notifications`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (err) {
      console.error("[notifications] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markRead(notificationID: number) {
    // Optimistic update
    setNotifs((prev) =>
      prev.map((n) =>
        n.notification_id === notificationID ? { ...n, is_read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await callBackend(`/notifications/read`, {
  method: "POST",
  body: JSON.stringify({ notification_id: notificationID }),
});
    } catch (err) {
      console.error("[notifications] mark read error:", err);
    }
  }

  async function markAllRead() {
    // Optimistic update
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await callBackend(`/notifications/read`, {
  method: "POST",
  body: JSON.stringify({}),
});
    } catch (err) {
      console.error("[notifications] mark all read error:", err);
    }
  }

  const unread = notifs.filter((n) => !n.is_read);
  const read = notifs.filter((n) => n.is_read);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
        <div className="h-8 w-48 bg-accent rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-accent rounded animate-pulse mb-8" />
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-accent rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
              : "You're all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="border-border hover:border-primary hover:text-primary bg-transparent text-muted-foreground text-xs gap-2"
          >
            <CheckCheck size={14} /> Mark all as read
          </Button>
        )}
      </div>

      {/* Empty state */}
      {notifs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-24 text-center">
            <Bell size={32} className="text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              No notifications yet
            </p>
            <p className="text-xs text-muted-foreground">
              We'll notify you when something happens with your datasets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {unread.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                Unread · {unread.length}
              </p>
              <div className="flex flex-col gap-2">
                {unread.map((n) => (
                  <NotifRow key={n.notification_id} notif={n} onMarkRead={markRead} />
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                Earlier
              </p>
              <div className="flex flex-col gap-2">
                {read.map((n) => (
                  <NotifRow key={n.notification_id} notif={n} onMarkRead={markRead} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}