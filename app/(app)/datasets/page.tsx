"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Copy, GitBranch, Clock, Globe,
  X, ExternalLink, Lock, Crown, Database,
  MessageSquare, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Sparkles,
  Zap, Check, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/auth-guard";
import { callBackend } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Dataset {
  dataset_id: number;
  name: string;
  description: string;
  extract_intent: string;
  tag: string;
  dataset_type: "web" | "reddit" | "amazon";
  active_version: number;
  has_alt: boolean;
  entity_count: number;
  is_premium: boolean;
  price: number;
  created_at: string;
  clone_count: number;
  api_hit_count: number;
}

const PAGE_SIZE = 8;

// ── Tag colors ────────────────────────────────────────────────────────────────

const TAG_PALETTES = [
  "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  "text-lime-400 bg-lime-500/10 border-lime-500/20",
  "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
];

function tagColor(tag: string): string {
  if (!tag) return TAG_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_PALETTES[Math.abs(hash) % TAG_PALETTES.length];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatHits(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s\-_]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getApiURL(dataset: Dataset): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  const slug = slugify(dataset.name);
  const alt = dataset.has_alt ? "alt/" : "";
  return `${base}/api/${dataset.dataset_id}/${slug}/active/${alt}`;
}

function typeBadgeClass(type: Dataset["dataset_type"]): string {
  if (type === "reddit") return "text-orange-400/80 bg-orange-500/10 border-orange-500/20";
  if (type === "amazon") return "text-amber-400/80 bg-amber-500/10 border-amber-500/20";
  return "text-sky-400/80 bg-sky-500/10 border-sky-500/20";
}

// ── Clone Modal ───────────────────────────────────────────────────────────────

interface CloneModalProps {
  dataset: Dataset | null;
  open: boolean;
  onClose: () => void;
}

function CloneModal({ dataset, open, onClose }: CloneModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [extractDescription, setExtractDescription] = useState("");
  const [tag, setTag] = useState("");
  const [nightly, setNightly] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [confirmWord, setConfirmWord] = useState("");
  const [cloning, setCloning] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const EXTRACT_MIN = 20;
  const EXTRACT_MAX = 500;

  useEffect(() => {
    if (open && dataset) {
      setDescription(dataset.description ?? "");
      setExtractDescription(dataset.extract_intent ?? "");
    }
    if (!open) {
      setStep("form");
      setName("");
      setDescription("");
      setExtractDescription("");
      setTag("");
      setNightly(false);
      setVisibility("private");
      setConfirmWord("");
      setCloning(false);
      setExtractError(null);
    }
  }, [open, dataset]);

  if (!dataset) return null;

  const isAmazon = dataset.dataset_type === "amazon";
  const requiredWord = dataset.name;
  const confirmMatch = confirmWord === requiredWord;

  function validateForm(): boolean {
    if (isAmazon) return true;
    const len = extractDescription.trim().length;
    if (len === 0) {
      setExtractError("Extract description is required");
      return false;
    }
    if (len < EXTRACT_MIN) {
      setExtractError(`Must be at least ${EXTRACT_MIN} characters (${len}/${EXTRACT_MIN})`);
      return false;
    }
    if (len > EXTRACT_MAX) {
      setExtractError(`Must be at most ${EXTRACT_MAX} characters (${len}/${EXTRACT_MAX})`);
      return false;
    }
    setExtractError(null);
    return true;
  }

  async function handleClone() {
    if (!dataset) return;
    setCloning(true);
    try {
      const res = await callBackend(`/dataset/clone`, {
  method: "POST",
  body: JSON.stringify({
    source_dataset_id: dataset.dataset_id,
    name: name.trim(),
    description: description.trim(),
    extract_description: extractDescription.trim(),
    tag: tag.trim(),
    nightly: nightly ? "yes" : "no",
    visibility,
  }),
});
      const data = await res.json();
      if (!res.ok) { console.error("clone failed:", data); return; }

      onClose();
      window.location.href = dataset.dataset_type === "reddit"
        ? `/dataset/reddit-view/${data.new_dataset_id}`
        : `/dataset/web-view/${data.new_dataset_id}`;
    } catch (err) {
      console.error("clone error:", err);
    } finally {
      setCloning(false);
    }
  }

  const extractLen = extractDescription.trim().length;
  const extractCountColor =
    extractLen > EXTRACT_MAX ? "text-destructive"
    : extractLen > 0 && extractLen < EXTRACT_MIN ? "text-yellow-400"
    : "text-muted-foreground/50";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-mono text-foreground">
            <GitBranch size={14} className="text-primary" />
            Clone <span className="text-primary">{dataset.name}</span>
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4 mt-2">
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-md bg-yellow-500/5 border border-yellow-500/20">
              <AlertTriangle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-400/80 leading-relaxed">
                Cloning uses <span className="font-semibold">1 dataset slot</span> from your plan.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", typeBadgeClass(dataset.dataset_type))}>
                {dataset.dataset_type}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {dataset.dataset_type === "reddit"
                  ? "Reddit dataset — refreshes from subreddits"
                  : dataset.dataset_type === "amazon"
                  ? "Amazon dataset — refreshes from ASINs"
                  : "Web dataset — refreshes from URLs"}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Dataset Name <span className="text-primary text-[10px]">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${dataset.name}-copy`}
                className="bg-background border-border text-sm h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this dataset for?"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {!isAmazon && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">
                  Extract Description <span className="text-primary text-[10px]">*</span>
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Describe what to extract from each page. Pre-filled from source.
                </p>
                <textarea
                  value={extractDescription}
                  onChange={(e) => {
                    setExtractDescription(e.target.value);
                    setExtractError(null);
                  }}
                  placeholder="e.g. Extract the job title, company name, location and salary from each posting."
                  rows={4}
                  className={cn(
                    "w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none",
                    extractError ? "border-destructive focus:ring-destructive" : "border-border"
                  )}
                />
                <div className="flex items-center justify-between">
                  {extractError
                    ? <p className="text-[11px] text-destructive flex items-center gap-1"><AlertTriangle size={10} /> {extractError}</p>
                    : <span />
                  }
                  <p className={cn("text-[11px] tabular-nums ml-auto", extractCountColor)}>
                    {extractLen}/{EXTRACT_MAX}
                    {extractLen > 0 && extractLen < EXTRACT_MIN && ` — ${EXTRACT_MIN - extractLen} more needed`}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Tag</label>
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Finance, Crypto"
                className="bg-background border-border text-sm h-9"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground font-medium">Nightly refresh</p>
                <p className="text-[11px] text-muted-foreground">Auto-refresh dataset every night</p>
              </div>
              <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-0.5">
                <button
                  onClick={() => setNightly(false)}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors",
                    !nightly ? "bg-background border border-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >Off</button>
                <button
                  onClick={() => setNightly(true)}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors",
                    nightly ? "bg-background border border-border text-cyan-400 shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >On</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Visibility</label>
              <div className="flex gap-2">
                {(["private", "public"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-xs border transition-colors capitalize",
                      visibility === v
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-background border-border text-muted-foreground hover:border-primary/30",
                    )}
                  >{v}</button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 border-border text-sm" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                onClick={() => { if (validateForm()) setStep("confirm"); }}
                disabled={!name.trim()}
              >
                <GitBranch size={13} className="mr-1.5" /> Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 mt-2">
            <div className="rounded-md border border-border bg-background px-4 py-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">Cloning as</p>
              <p className="text-sm font-mono font-medium text-foreground">{name}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", typeBadgeClass(dataset.dataset_type))}>
                  {dataset.dataset_type}
                </span>
                <span className="text-[11px] text-muted-foreground capitalize">{visibility}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">Nightly {nightly ? "on" : "off"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Type <span className="font-mono font-semibold text-foreground">{requiredWord}</span> to confirm. This action is permanent.
              </p>
              <Input
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                placeholder={requiredWord}
                className={cn(
                  "bg-background border-border text-sm h-9 font-mono",
                  confirmWord.length > 0 && (confirmMatch
                    ? "border-emerald-500/40 focus:border-emerald-500/60"
                    : "border-red-500/40 focus:border-red-500/60")
                )}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 border-border text-sm" onClick={() => setStep("form")} disabled={cloning}>
                Back
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                onClick={handleClone}
                disabled={!confirmMatch || cloning}
              >
                {cloning
                  ? <><Loader2 size={13} className="mr-1.5 animate-spin" /> Cloning...</>
                  : <><GitBranch size={13} className="mr-1.5" /> Clone Dataset</>
                }
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Unlock Modal ──────────────────────────────────────────────────────────────

interface UnlockModalProps {
  dataset: Dataset | null;
  open: boolean;
  onClose: () => void;
}

function UnlockModal({ dataset, open, onClose }: UnlockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setLoading(false); setError(null); }
  }, [open]);

  if (!dataset) return null;

  async function handleCheckout() {
    if (!dataset) return;
    setLoading(true);
    setError(null);
    try {
      const res = await callBackend(`/dataset/clone`, {
  method: "POST",
  body: JSON.stringify({
    source_dataset_id: dataset.dataset_id,
    name: dataset.name,
    description: dataset.description,
    tag: dataset.tag,
    nightly: "yes",
    visibility: "private",
    is_premium_clone: true,
    payment_ref: `test-ref-${Date.now()}`,
  }),
});

      const data = await res.json();
      if (!res.ok) { setError("Clone failed. Try again."); setLoading(false); return; }

      onClose();
      window.location.href = dataset.dataset_type === "reddit"
        ? `/dataset/reddit-view/${data.new_dataset_id}`
        : `/dataset/web-view/${data.new_dataset_id}`;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-mono text-foreground">
            <Crown size={14} className="text-yellow-400" />
            Unlock Premium Dataset
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono font-medium text-foreground">{dataset.name}</p>
              {dataset.has_alt && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Sparkles size={9} /> alt
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{dataset.description}</p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><GitBranch size={10} /> v{dataset.active_version}</span>
              <span className="flex items-center gap-1">
                <Database size={10} /> {dataset.entity_count.toLocaleString()} {dataset.dataset_type === "reddit" ? "posts" : "entities"}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-[11px] uppercase tracking-wider">What you get:</p>
            {[
              "Full access to view all dataset records",
              "Clone to your account (private)",
              "All future versions included",
              "One-time payment, no subscription",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">✦</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border/40">
            <span className="text-xs text-muted-foreground">One-time price</span>
            <span className="text-lg font-bold text-yellow-400">${dataset.price}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-border text-sm" onClick={onClose} disabled={loading}>Cancel</Button>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1 relative overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors shimmer-btn disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="flex items-center justify-center gap-1.5"><Loader2 size={13} className="animate-spin" /> Processing...</span>
                : <span className="flex items-center justify-center gap-1.5"><Lock size={13} /> Pay ${dataset.price}</span>
              }
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ dataset }: { dataset: Dataset }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(getApiURL(dataset));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy API URL: ${getApiURL(dataset)}`}
      className={cn(
        "flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border transition-all",
        copied
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "copied" : dataset.has_alt ? `alt/active` : `active`}
    </button>
  );
}

// ── Dataset Card ──────────────────────────────────────────────────────────────

interface DatasetCardProps {
  dataset: Dataset;
  onClone: (d: Dataset) => void;
  onUnlock: (d: Dataset) => void;
}

function DatasetCard({ dataset, onClone, onUnlock }: DatasetCardProps) {
  return (
    <Card className={cn(
      "bg-card border-border hover:border-primary/30 transition-all hover:-translate-y-0.5 duration-150 group flex flex-col",
      dataset.is_premium && "hover:border-yellow-500/30"
    )}>
      <CardContent className="p-5 flex flex-col h-full">

        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <p className="text-sm font-mono font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {dataset.name}
              </p>
              {dataset.is_premium && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded-full shrink-0">
                  <Crown size={9} /> PREMIUM
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", typeBadgeClass(dataset.dataset_type))}>
                {dataset.dataset_type}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                v{dataset.active_version}
              </span>
              {dataset.has_alt && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Sparkles size={9} /> alt
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-2">
          {dataset.description}
        </p>

        {dataset.tag && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {dataset.tag.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
              <span key={t} className={cn("inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border", tagColor(t))}>
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            {dataset.dataset_type === "reddit" ? <MessageSquare size={10} /> : <Database size={10} />}
            {dataset.entity_count.toLocaleString()} {dataset.dataset_type === "reddit" ? "posts" : "entities"}
          </span>
          <span className="flex items-center gap-1"><GitBranch size={10} /> {dataset.clone_count} clones</span>
          <span className="flex items-center gap-1"><Zap size={10} /> {formatHits(dataset.api_hit_count)} hits</span>
          <span className="flex items-center gap-1 ml-auto"><Clock size={10} /> {formatDate(dataset.created_at)}</span>
        </div>

        {!dataset.is_premium && (
          <div className="flex items-center gap-1.5 mb-3 p-2 rounded-md bg-background border border-border/60">
            <span className="text-[10px] text-muted-foreground/50 font-mono truncate flex-1">
              {getApiURL(dataset)}
            </span>
            <CopyButton dataset={dataset} />
          </div>
        )}

        {dataset.is_premium ? (
          <button
            onClick={() => onUnlock(dataset)}
            className="unlock-btn w-full relative overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors shimmer-btn"
          >
            <span className="flex items-center justify-center gap-1.5">
              <Lock size={13} /> Unlock for ${dataset.price}
            </span>
          </button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs border-border hover:border-primary hover:text-primary bg-transparent" asChild>
              <a href={dataset.dataset_type === "reddit"
                ? `/dataset/reddit-view/${dataset.dataset_id}`
                : `/dataset/web-view/${dataset.dataset_id}`}
              >
                <ExternalLink size={11} className="mr-1" /> View
              </a>
            </Button>
            <Button
              size="sm"
              className="clone-btn flex-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onClone(dataset)}
            >
              <GitBranch size={11} className="mr-1" /> Clone
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, onPage }: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 py-3 px-1">
      <p className="text-xs text-muted-foreground font-mono">
        Page {page} of {totalPages} · {total} datasets
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(1)} disabled={page === 1} className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronsLeft size={13} />
        </button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-1 text-xs text-muted-foreground/40">…</span>
            ) : (
              <button key={p} onClick={() => onPage(p as number)}
                className={cn("w-7 h-7 rounded text-xs transition-colors",
                  p === page ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >{p}</button>
            )
          )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={13} />
        </button>
        <button onClick={() => onPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cloneTarget, setCloneTarget] = useState<Dataset | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<Dataset | null>(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dataset-market`);
        const data = await res.json();
        setDatasets(data.datasets);
      } catch (err) {
        console.error("market fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMarket();
  }, []);

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.description.toLowerCase().includes(search.toLowerCase()) ||
    d.tag.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(val: string) { setSearch(val); setPage(1); }
  function handleClone(d: Dataset) { setCloneTarget(d); setCloneOpen(true); }
  function handleUnlock(d: Dataset) { setUnlockTarget(d); setUnlockOpen(true); }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground font-mono animate-pulse">Loading datasets...</p>
      </div>
    );
  }

  return (
    <>
      <AuthGuard modal={[".clone-btn", ".unlock-btn"]} />
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">Public Datasets</h1>
          <p className="text-sm text-muted-foreground">Browse, clone, and hit community datasets via API. Updated in real time.</p>
        </div>

        <div className="relative max-w-md mb-8">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, tag, or description..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 bg-card border-border focus:border-primary text-sm"
          />
          {search && (
            <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground font-mono mb-4">
          {filtered.length} dataset{filtered.length !== 1 ? "s" : ""} found
        </p>

        {paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {paginated.map((d) => (
                <DatasetCard key={d.dataset_id} dataset={d} onClone={handleClone} onUnlock={handleUnlock} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} total={filtered.length} onPage={setPage} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Globe size={32} className="text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">No datasets found</p>
            <p className="text-xs text-muted-foreground">Try a different search term.</p>
          </div>
        )}
      </div>

      <CloneModal dataset={cloneTarget} open={cloneOpen} onClose={() => setCloneOpen(false)} />
      <UnlockModal dataset={unlockTarget} open={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </>
  );
}