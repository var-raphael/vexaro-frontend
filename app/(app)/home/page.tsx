"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Link2,
  Globe,
  Zap,
  Database,
  ArrowRight,
  GitBranch,
  Copy,
  CheckCircle2,
  Circle,
  TrendingUp,
  Clock,
  RefreshCw,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

const user = { name: "Raphael" }; // replace with session user

// ── Quick Stats ───────────────────────────────────────────────────────────────

const STATS = [
  { label: "Datasets", value: "7", icon: Database, delta: "2 added this week" },
  { label: "Last Refresh", value: "2h ago", icon: Clock, delta: "3 datasets updated" },
  { label: "Total Records", value: "1.2M", icon: TrendingUp, delta: "+340K from refresh" },
  { label: "Clones", value: "3", icon: GitBranch, delta: "From marketplace" },
];

function StatsSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map(({ label, value, icon: Icon, delta }) => (
        <Card key={label} className="bg-card border-border hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="w-7 h-7 rounded-md bg-accent border border-border flex items-center justify-center text-primary">
                <Icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mb-1">{value}</p>
            <p className="text-xs text-muted-foreground">{delta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    label: "New Datatset",
    desc: "Build a new custom dataset from any source",
    icon: Plus,
    href: "/dataset/new",
    primary: true,
  },
  {
  label: "View My Datasets",
  desc: "Manage, version and refresh your datasets",
  icon: Database,
  href: "/datasets",
  primary: false,
  },
  {
    label: "Browse Public Data",
    desc: "Explore community datasets",
    icon: Globe,
    href: "/public-data",
    primary: false,
  },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ACTIONS.map(({ label, desc, icon: Icon, href, primary }) => (
        <Link key={label} href={href}>
          <Card
            className={cn(
              "h-full border transition-all hover:-translate-y-0.5 duration-150 cursor-pointer group",
              primary
                ? "bg-accent/10 border-primary/40 hover:border-primary hover:shadow-[0_0_20px_oklch(0.85_0.18_195_/_0.15)]"
                : "bg-card border-border hover:border-primary/30"
            )}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div
                className={cn(
                  "w-9 h-9 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                  primary
                    ? "bg-primary/10 border-primary/40 text-primary group-hover:bg-primary/20"
                    : "bg-accent border-border text-primary group-hover:border-primary/40"
                )}
              >
                <Icon size={16} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold mb-0.5", primary ? "text-primary" : "text-foreground")}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ── Recent Activity ───────────────────────────────────────────────────────────

const ACTIVITY = [
  { type: "refresh", label: "crypto-prices endpoint refreshed", time: "2 min ago", icon: RefreshCw },
  { type: "create", label: "New Refresh endpoint: hacker-news-top created", time: "1 hr ago", icon: Plus },
  { type: "clone", label: "Cloned imdb-top-250 from public datasets", time: "3 hr ago", icon: Copy },
  { type: "version", label: "Version v4 saved for nba-scores", time: "Yesterday", icon: GitBranch },
  { type: "Dataset Purchased", label: "r/Programming dataset purchased @ 5$", time: "2 days ago", icon: Database },
];

function RecentActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-foreground">Recent Activity</CardTitle>
        <Link href="/dashboard" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col divide-y divide-border">
          {ACTIVITY.map(({ label, time, icon: Icon }, i) => (
            <div key={i} className="flex items-center gap-3 py-3 group">
              <div className="w-7 h-7 rounded-md bg-accent border border-border flex items-center justify-center text-primary shrink-0 group-hover:border-primary/30 transition-colors">
                <Icon size={13} />
              </div>
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed group-hover:text-foreground transition-colors">
                {label}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock size={11} />
                {time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Getting Started ───────────────────────────────────────────────────────────

const CHECKLIST = [
  { label: "Create your account", done: true },
  { label: "Build your first Dataset", done: true },
  { label: "Import a URL with your own schema", done: false },
  { label: "Create your first custom refresh url", done: false },
  { label: "Clone a public dataset", done: false },
];

function GettingStarted() {
  const completed = CHECKLIST.filter((c) => c.done).length;
  const percent = Math.round((completed / CHECKLIST.length) * 100);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-sm font-semibold text-foreground">Getting Started</CardTitle>
          <span className="text-xs font-mono text-primary">{completed}/{CHECKLIST.length}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col gap-1">
          {CHECKLIST.map(({ label, done }) => (
            <div
              key={label}
              className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-accent/20 transition-colors group"
            >
              {done ? (
                <CheckCircle2 size={15} className="text-primary shrink-0" />
              ) : (
                <Circle size={15} className="text-muted-foreground shrink-0" />
              )}
              <p className={cn("text-xs", done ? "text-muted-foreground line-through" : "text-foreground")}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Trending Public Datasets ───────────────────────────────────────────────────

const TRENDING = [
  { name: "crypto-prices", desc: "Live crypto prices from CoinGecko", clones: 142, icon: TrendingUp },
  { name: "r/MachineLearning", desc: "Top posts from ML community on Reddit", clones: 118, icon: Globe },
  { name: "hacker-news-top", desc: "Top stories from Hacker News", clones: 98, icon: Zap },
  { name: "r/wallstreetbets", desc: "WSB posts, flairs and sentiment data", clones: 89, icon: TrendingUp },
  { name: "imdb-top-250", desc: "IMDB top 250 movies with ratings", clones: 76, icon: Database },
  { name: "r/worldnews", desc: "Breaking news posts and top comments", clones: 71, icon: Globe },
  { name: "nba-scores", desc: "Live NBA game scores and stats", clones: 61, icon: Zap },
  { name: "github-trending", desc: "Trending repos across all languages", clones: 54, icon: Database },
];

function TrendingDatasets() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-foreground">Trending Public Datasets</CardTitle>
        <Link href="/public-data" className="text-xs text-primary hover:underline flex items-center gap-1">
          Browse all <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex flex-col divide-y divide-border">
          {TRENDING.map(({ name, desc, clones, icon: Icon }) => (
            <div key={name} className="flex items-center gap-3 py-3 group cursor-pointer">
              <div className="w-7 h-7 rounded-md bg-accent border border-border flex items-center justify-center text-primary shrink-0 group-hover:border-primary/30 transition-colors">
                <Icon size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Copy size={11} />
                {clones}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Welcome back, <span className="text-primary">{user.name}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your APIs today.
        </p>
      </div>

      {/* Stats */}
      <StatsSection />

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">Quick Actions</p>
        <QuickActions />
      </div>

      {/* Activity + Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity />
        <GettingStarted />
      </div>

      {/* Trending */}
      <TrendingDatasets />
    </div>
  );
}