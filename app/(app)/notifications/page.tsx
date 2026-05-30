"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifType =
  | "refresh"
  | "version"
  | "clone"
  | "download"
  | "limit"
  | "announcement";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotifType,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  refresh: {
    icon: RefreshCw,
    label: "Dataset Refresh",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  version: {
    icon: GitBranch,
    label: "New Version",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  clone: {
    icon: Copy,
    label: "Clone Activity",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  download: {
    icon: Download,
    label: "Download",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
  limit: {
    icon: AlertTriangle,
    label: "Plan Limit",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  announcement: {
    icon: Megaphone,
    label: "Announcement",
    color: "text-primary",
    bg: "bg-accent border-primary/20",
  },
};

// ── Mock data — replace with real fetch ───────────────────────────────────────

const INITIAL: Notification[] = [
  {
    id: "1", type: "limit", read: false,
    title: "You're approaching your dataset limit",
    desc: "You have 1 dataset slot remaining on your current plan. Upgrade to Pro for unlimited datasets.",
    time: "10 min ago",
  },
  {
    id: "2", type: "refresh", read: false,
    title: "crypto-prices refreshed successfully",
    desc: "Your dataset was updated with the latest data. 47 records changed since the last version.",
    time: "2 hours ago",
  },
  {
    id: "3", type: "version", read: false,
    title: "New version saved — nba-scores v5",
    desc: "Version v5 was automatically saved after detecting changes in 12 fields.",
    time: "5 hours ago",
  },
  {
    id: "4", type: "clone", read: false,
    title: "Someone cloned your github-trending dataset",
    desc: "Your public dataset github-trending was cloned by another user. It now has 120 clones.",
    time: "Yesterday",
  },
  {
    id: "5", type: "download", read: true,
    title: "Your dataset download is ready",
    desc: "crypto-prices v12 has been packaged and is ready to download as JSON.",
    time: "2 days ago",
  },
  {
    id: "6", type: "refresh", read: true,
    title: "hacker-news-top refreshed successfully",
    desc: "Your dataset was updated. 23 new stories added, 8 removed since the last version.",
    time: "2 days ago",
  },
  {
    id: "7", type: "announcement", read: true,
    title: "Vexaro is now live 🎉",
    desc: "Welcome to Vexaro! We're officially out of development. Explore public datasets, build your own, and share your data with the community.",
    time: "3 days ago",
  },
  {
    id: "8", type: "version", read: true,
    title: "New version saved — hacker-news-top v8",
    desc: "Version v8 was automatically saved after detecting changes in 23 fields.",
    time: "4 days ago",
  },
  {
    id: "9", type: "clone", read: true,
    title: "Someone cloned your crypto-prices dataset",
    desc: "Your public dataset crypto-prices was cloned. It now has 143 clones total.",
    time: "6 days ago",
  },
  {
    id: "10", type: "refresh", read: true,
    title: "imdb-top-250 refreshed successfully",
    desc: "Your dataset was updated. 3 new titles added, ratings updated across 18 records.",
    time: "1 week ago",
  },
];

// ── Notification Row ──────────────────────────────────────────────────────────

function NotifRow({ notif }: { notif: Notification }) {
  const { icon: Icon, color, bg, label } = TYPE_CONFIG[notif.type];

  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-lg border transition-colors",
      notif.read ? "bg-card border-border" : "bg-accent/10 border-primary/20"
    )}>
      {/* Icon */}
      <div className={cn("w-9 h-9 rounded-md border flex items-center justify-center shrink-0 mt-0.5", bg)}>
        <Icon size={15} className={color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">{notif.title}</p>
            {!notif.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{notif.time}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{notif.desc}</p>
        <span className="inline-block mt-2 text-xs font-mono text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-full">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const unread = notifs.filter((n) => !n.read);
  const read = notifs.filter((n) => n.read);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
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
            <p className="text-sm font-medium text-foreground mb-1">No notifications yet</p>
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
                {unread.map((n) => <NotifRow key={n.id} notif={n} />)}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                Earlier
              </p>
              <div className="flex flex-col gap-2">
                {read.map((n) => <NotifRow key={n.id} notif={n} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
