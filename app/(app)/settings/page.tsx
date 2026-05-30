"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Key, Plus, Eye, EyeOff, Copy, Trash2,
  User, Lock, CreditCard, AlertTriangle, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Mock user — replace with session ─────────────────────────────────────────

const MOCK_USER = {
  name: "Raphael Samuel",
  email: "raphael@vexaro.dev",
  avatar: "",
  plan: "Free" as "Free" | "Pro" | "Business" | "Custom",
};

const PLAN_DETAILS = {
  Free:     { price: "$0/mo",  requests: "100/day",    endpoints: "1 custom (7-day trial)" },
  Pro:      { price: "$9/mo",  requests: "10,000/day", endpoints: "5 custom" },
  Business: { price: "$19/mo", requests: "50,000/day", endpoints: "12 custom" },
  Custom:   { price: "Custom", requests: "Unlimited",  endpoints: "Unlimited" },
};

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

// ── Profile ───────────────────────────────────────────────────────────────────

function ProfileSection() {
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <Section id="profile" icon={User} title="Profile" desc="Update your name, email, and avatar.">
      <div className="flex items-center gap-4 mb-6">
        <Avatar className="w-14 h-14 border border-border">
          <AvatarImage src={MOCK_USER.avatar} />
          <AvatarFallback className="bg-accent text-primary text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm" className="border-border hover:border-primary hover:text-primary bg-transparent text-xs gap-2">
          <Upload size={13} /> Upload Avatar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Full Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-background border-border focus:border-primary text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Email Address</label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background border-border focus:border-primary text-sm"
          />
        </div>
      </div>

      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
        Save Changes
      </Button>
    </Section>
  );
}

// ── Password ──────────────────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  return (
    <Section id="password" icon={Lock} title="Change Password" desc="Use a strong password you don't use elsewhere.">
      <div className="space-y-4 max-w-sm">
        {/* Current */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Current Password</label>
          <div className="relative">
            <Input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="bg-background border-border focus:border-primary text-sm pr-10"
            />
            <button
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* New */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">New Password</label>
          <div className="relative">
            <Input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="bg-background border-border focus:border-primary text-sm pr-10"
            />
            <button
              onClick={() => setShowNext((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNext ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Confirm New Password</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cn(
              "bg-background border-border focus:border-primary text-sm",
              confirm && next !== confirm && "border-red-500/50 focus:border-red-500"
            )}
          />
          {confirm && next !== confirm && (
            <p className="text-xs text-red-400">Passwords do not match.</p>
          )}
        </div>

        <Button
          size="sm"
          disabled={!current || !next || next !== confirm}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs disabled:opacity-40"
        >
          Update Password
        </Button>
      </div>
    </Section>
  );
}

// ── API Tokens ────────────────────────────────────────────────────────────────

interface Token { id: string; name: string; token: string; created: string; }

const MOCK_TOKENS: Token[] = [
  { id: "1", name: "Production", token: "vx_prod_a1b2c3d4e5f6", created: "Mar 12, 2025" },
  { id: "2", name: "Development", token: "vx_dev_9z8y7x6w5v4", created: "Apr 1, 2025" },
];

function TokensSection() {
  const [tokens, setTokens] = useState<Token[]>(MOCK_TOKENS);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  function toggleReveal(id: string) {
    setRevealed((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
  }

  function revokeToken(id: string) {
    setTokens((p) => p.filter((t) => t.id !== id));
  }

  function createToken() {
    if (!newName.trim()) return;
    const fake: Token = {
      id: String(Date.now()),
      name: newName.trim(),
      token: `vx_${Math.random().toString(36).slice(2, 14)}`,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setTokens((p) => [...p, fake]);
    setNewName("");
    setCreating(false);
  }

  return (
    <Section id="tokens" icon={Key} title="API Tokens" desc="Manage your vx_ tokens for authenticating API requests.">
      <div className="space-y-3 mb-5">
        {tokens.length === 0 && (
          <p className="text-xs text-muted-foreground">No tokens yet. Create one below.</p>
        )}
        {tokens.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border group">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground mb-0.5">{t.name}</p>
              <p className="text-xs font-mono text-muted-foreground truncate">
                {revealed.includes(t.id) ? t.token : t.token.slice(0, 8) + "••••••••••••"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Created {t.created}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleReveal(t.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={revealed.includes(t.id) ? "Hide" : "Reveal"}
              >
                {revealed.includes(t.id) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                onClick={() => copyToken(t.token)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Copy token"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => revokeToken(t.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Revoke token"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {creating ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Token name e.g. Production"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createToken()}
            className="bg-background border-border focus:border-primary text-sm max-w-xs"
            autoFocus
          />
          <Button size="sm" onClick={createToken} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
            Create
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCreating(false)} className="border-border bg-transparent text-xs">
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreating(true)}
          className="border-border hover:border-primary hover:text-primary bg-transparent text-xs gap-2"
        >
          <Plus size={13} /> New Token
        </Button>
      )}
    </Section>
  );
}

// ── Plan & Billing ────────────────────────────────────────────────────────────

function BillingSection() {
  const plan = MOCK_USER.plan;
  const details = PLAN_DETAILS[plan];

  return (
    <Section id="billing" icon={CreditCard} title="Plan & Billing" desc="Your current plan and usage limits.">
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-accent/10 border border-primary/20 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">{plan} Plan</p>
            <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{details.price}</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs shrink-0">
          Upgrade Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "API Requests", value: details.requests },
          { label: "Custom Endpoints", value: details.endpoints },
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

// ── Danger Zone ───────────────────────────────────────────────────────────────

function DangerSection() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  return (
    <>
      <Card id="danger" className="bg-card border-red-500/20">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertTriangle size={15} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-red-400">Danger Zone</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Irreversible actions. Proceed with caution.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-foreground mb-0.5">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account, all endpoints, datasets, and tokens. This cannot be undone.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 text-xs shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-red-500/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} /> Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will permanently delete your account, all API endpoints, datasets, clones, and tokens. This action <span className="text-foreground font-medium">cannot be undone</span>.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Type <span className="font-mono text-foreground">delete my account</span> to confirm
              </label>
              <Input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-background border-red-500/30 focus:border-red-500 text-sm"
                placeholder="delete my account"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setOpen(false); setConfirm(""); }}
                className="flex-1 border-border bg-transparent text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={confirm !== "delete my account"}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs disabled:opacity-40"
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, tokens, and billing.</p>
      </div>

      <div className="space-y-6">
        <ProfileSection />
        <PasswordSection />
        <TokensSection />
        <BillingSection />
        <DangerSection />
      </div>
    </div>
  );
}