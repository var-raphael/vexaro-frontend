"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Zap, CreditCard, Copy, Check,
  RefreshCw, Eye, EyeOff, Loader2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";
import { callBackend } from "@/lib/api";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  id, icon: Icon, title, desc, children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="bg-card border-border">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent border border-border flex items-center justify-center text-primary">
            <Icon size={15} />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-6">{children}</CardContent>
    </Card>
  );
}

// ── Bio ───────────────────────────────────────────────────────────────────────

function BioSection() {
  const { user } = useAuth();
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  async function handleSave() {
    setSaving(true);
    try {
      await callBackend(`/profile/update`, {
        method: "PATCH",
        body: JSON.stringify({ bio }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[bio] save error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section id="profile" icon={User} title="Profile" desc="Your public profile info.">
      <div className="flex items-center gap-4 mb-6">
       <Avatar className="w-14 h-14 border border-border">
  
  <AvatarFallback className="bg-accent text-primary text-lg font-semibold">
    {initials}
  </AvatarFallback>
</Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          {user?.username && (
            <p className="text-xs text-primary font-mono mt-0.5">@{user.username}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-5 max-w-lg">
        <label className="text-xs text-muted-foreground font-medium">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Tell others what you build with Vexaro..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <p className="text-[11px] text-muted-foreground/50 text-right">{bio.length}/500</p>
      </div>

      <Button
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-2"
      >
        {saving
          ? <><Loader2 size={12} className="animate-spin" /> Saving...</>
          : saved
          ? <><Check size={12} className="text-emerald-400" /> Saved</>
          : "Save Bio"
        }
      </Button>
    </Section>
  );
}

// ── MCP ───────────────────────────────────────────────────────────────────────

function MCPSection() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<"token" | "url" | null>(null);

  const mcpURL = token
    ? `${API}/mcp/${token}/sse`
    : null;

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await callBackend(`/mcp/token/view`);
        const data = await res.json();
        if (data.has_token && data.is_active) {
          setToken(data.token);
          setHasToken(true);
          if (data.last_used_at) setLastUsed(data.last_used_at);
        }
      } catch (err) {
        console.error("[mcp] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await callBackend(`/mcp/token`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok) {
        setToken(data.token);
        setHasToken(true);
        setRevealed(true);
      }
    } catch (err) {
      console.error("[mcp] generate error:", err);
    } finally {
      setGenerating(false);
    }
  }

  function copy(type: "token" | "url") {
    const val = type === "token" ? token : mcpURL;
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const maskedToken = token
    ? token.slice(0, 8) + "••••••••••••••••••••••••"
    : null;

  return (
    <Section id="mcp" icon={Zap} title="MCP Access" desc="Connect AI tools like Claude Desktop and Cursor to your datasets.">
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={13} className="animate-spin" /> Loading...
        </div>
      ) : !hasToken ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Generate an MCP token to connect your Vexaro datasets to any MCP-compatible AI client. Your token authenticates all dataset access over the MCP protocol.
          </p>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-2"
          >
            {generating
              ? <><Loader2 size={12} className="animate-spin" /> Generating...</>
              : <><Zap size={12} /> Generate MCP Token</>
            }
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Token row */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Token</label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-background border border-border">
              <p className="text-xs font-mono text-foreground flex-1 truncate">
                {revealed ? token : maskedToken}
              </p>
              <button
                onClick={() => setRevealed((p) => !p)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={() => copy("token")}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === "token"
                  ? <Check size={13} className="text-emerald-400" />
                  : <Copy size={13} />
                }
              </button>
            </div>
          </div>

          {/* MCP URL */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">MCP Server URL</label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-background border border-border">
              <p className="text-xs font-mono text-muted-foreground flex-1 truncate">
                {mcpURL}
              </p>
              <button
                onClick={() => copy("url")}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied === "url"
                  ? <Check size={13} className="text-emerald-400" />
                  : <Copy size={13} />
                }
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Paste this URL into your MCP client (Claude Desktop, Cursor, etc.)
            </p>
          </div>

          {lastUsed && (
            <p className="text-[11px] text-muted-foreground">
              Last used: {new Date(lastUsed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={generating}
              className="border-border hover:border-primary hover:text-primary bg-transparent text-xs gap-2"
            >
              {generating
                ? <><Loader2 size={12} className="animate-spin" /> Regenerating...</>
                : <><RefreshCw size={12} /> Regenerate Token</>
              }
            </Button>
            <a
              href="https://docs.vexaro.com/mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink size={11} /> MCP docs
            </a>
          </div>

          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-[11px] text-yellow-400/80 leading-relaxed">
              Regenerating invalidates your current token immediately. Update your MCP client after regenerating.
            </p>
          </div>
        </div>
      )}
    </Section>
  );
}

// ── Plan ──────────────────────────────────────────────────────────────────────

function PlanSection() {
  return (
    <Section id="plan" icon={CreditCard} title="Plan & Billing" desc="Your current plan and usage limits.">
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-accent/10 border border-border mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">Free Plan</p>
            <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              Active
            </span>
            <Link
              href="/pricing"
              className="text-xs font-mono text-muted-foreground bg-accent border border-border px-2 py-0.5 rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              View plans
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">$0/mo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "API Requests", value: "100/day" },
          { label: "Datasets", value: "3 active" },
          { label: "Nightly Refreshes", value: "1 dataset" },
          { label: "MCP Access", value: "Included" },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-lg bg-background border border-border">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-medium text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
      <AuthGuard />
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, MCP access, and plan.</p>
      </div>

      <div className="space-y-6">
        <BioSection />
        <MCPSection />
        <PlanSection />
      </div>
    </div>
  );
}