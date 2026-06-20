"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, Trash2, Pencil,
  MoreVertical, Zap, CheckCircle2,
  Loader2, X, Globe, GitBranch, RefreshCw,
  Eye, Snowflake, RotateCcw, AlertTriangle, GitFork,
  MessageSquare, ArrowRight, Sparkles, Crown, Shield, Copy,
  Key, Moon, Database, Radio,
} from "lucide-react";
import { FaAmazon } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { callBackend } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "active" | "frozen" | "processing";
type DatasetType = "web" | "reddit" | "amazon";

interface Dataset {
  dataset_id: number;
  name: string;
  alias: string;
  tag: string;
  visibility: string;
  is_frozen: boolean;
  is_cloned: boolean;
  is_premium: boolean;
  nightly: boolean;
  status: Status;
  version: number;
  last_refresh: string;
  created_at: string;
  versions: number[];
  dataset_type: DatasetType;
  has_alt: boolean;
  ping_key: string;
  private_key: string;
  clone_count: number;
  api_hit_count: number;
  entity_count: number;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; class: string; dot: string }> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    class: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  frozen: {
    label: "Frozen",
    icon: Snowflake,
    class: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    class: "text-primary bg-primary/10 border-primary/20",
    dot: "bg-primary animate-pulse",
  },
};

// ── Dataset type config ───────────────────────────────────────────────────────

const DATASET_TYPE_CONFIG: Record<DatasetType, { label: string; class: string; icon: React.ElementType }> = {
  web: {
    label: "web-data",
    class: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    icon: Globe,
  },
  reddit: {
    label: "reddit-data",
    class: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    icon: MessageSquare,
  },
  amazon: {
    label: "amazon-data",
    class: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icon: FaAmazon,
  },
};

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function normalizeDatasetType(source: string): DatasetType {
  if (source === "reddit") return "reddit";
  if (source === "amazon") return "amazon";
  return "web";
}

function normalizeStatus(status: string): Status {
  if (status === "frozen" || status === "processing") return status;
  return "active";
}

// ── New Dataset Modal ─────────────────────────────────────────────────────────

function NewDatasetModal({
  onCancel,
  onSelect,
}: {
  onCancel: () => void;
  onSelect: (type: DatasetType) => void;
}) {
  const router = useRouter();

  const active = [
  {
    key: "web",
    icon: <Globe size={16} className="text-violet-400" />,
    iconBg: "bg-violet-500/10 border-violet-500/20",
    label: "Normal Web Data",
    desc: "Scrape and pipeline any public URL or web source",
    hover: "hover:border-violet-500/40 hover:bg-violet-500/5",
    arrowHover: "group-hover:text-violet-400",
    href: "/dataset/web-new",
  },
  {
    key: "amazon",
    icon: <FaAmazon size={16} className="text-amber-400" />,
    iconBg: "bg-amber-500/10 border-amber-500/20",
    label: "Amazon Data",
    desc: "Products, prices, reviews and listings from Amazon",
    hover: "hover:border-amber-500/40 hover:bg-amber-500/5",
    arrowHover: "group-hover:text-amber-400",
    href: "/dataset/amazon-new",
  },
];

const upcoming: never[] = [];

  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="bg-card border-border w-full max-w-md">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-sm">New Dataset</p>
              <p className="text-xs text-muted-foreground mt-0.5">Choose a data source to get started</p>
            </div>
            <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {active.map(({ key, icon, iconBg, label, desc, hover, arrowHover, href }) => (
              <button
                key={key}
                onClick={() => { onCancel(); router.push(href); }}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-xl border border-border bg-accent/20 transition-all duration-150 text-left",
                  hover
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors", iconBg)}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ArrowRight size={14} className={cn("text-muted-foreground transition-colors shrink-0", arrowHover)} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel,
}: {
  title: string; message: string; confirmLabel?: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="bg-card border-border w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", danger ? "bg-red-500/10" : "bg-primary/10")}>
              <AlertTriangle size={16} className={danger ? "text-red-400" : "text-primary"} />
            </div>
            <p className="font-semibold text-foreground text-sm">{title}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 text-xs border-border">Cancel</Button>
            <Button size="sm" onClick={onConfirm} className={cn("flex-1 text-xs", danger ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground")}>
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({
  dataset,
  onConfirm,
  onCancel,
}: {
  dataset: Dataset;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState("");
  const isPublic = dataset.visibility === "public";
  const hasClones = dataset.clone_count > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="bg-card border-border w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10">
              <Trash2 size={16} className="text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Delete Dataset</p>
              <p className="text-xs text-muted-foreground">{dataset.alias || dataset.name}</p>
            </div>
          </div>

          {/* Public warning with clones */}
          {isPublic && hasClones && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/5">
              <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300/90 leading-relaxed">
                <span className="font-semibold text-red-300">{dataset.clone_count} {dataset.clone_count === 1 ? "person has" : "people have"} cloned this dataset</span> and depend on it for live data. Deleting it will cut off their API access and nightly refreshes permanently.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            This action cannot be undone. Type{" "}
            <span className="font-mono text-foreground bg-accent/50 px-1 py-0.5 rounded">{dataset.name}</span>{" "}
            to confirm.
          </p>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dataset.name}
            className="bg-accent/30 border-border text-sm font-mono"
          />

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 text-xs border-border">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={input !== dataset.name}
              onClick={onConfirm}
              className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white disabled:opacity-40"
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Rollback Modal ────────────────────────────────────────────────────────────

function RollbackModal({
  dataset, onConfirm, onCancel,
}: {
  dataset: Dataset; onConfirm: (version: number, freeze: boolean) => void; onCancel: () => void;
}) {
  const [selected, setSelected] = useState<number>(dataset.versions[0] ?? 1);
  const [step, setStep] = useState<"select" | "freeze">("select");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="bg-card border-border w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          {step === "select" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                  <RotateCcw size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Rollback Version</p>
                  <p className="text-xs text-muted-foreground">{dataset.alias}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Select a version to roll back to.</p>
              <select
                value={selected}
                onChange={(e) => setSelected(Number(e.target.value))}
                className="w-full bg-accent/30 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              >
                {dataset.versions.map((v) => (
                  <option key={v} value={v}>v{v}{v === dataset.version ? " (current)" : ""}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} className="flex-1 text-xs border-border">Cancel</Button>
                <Button size="sm" onClick={() => setStep("freeze")} className="flex-1 text-xs bg-primary text-primary-foreground">Next</Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10">
                  <Snowflake size={16} className="text-blue-400" />
                </div>
                <p className="font-semibold text-foreground text-sm">Freeze at v{selected}?</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Do you want to freeze <span className="font-mono text-foreground">{dataset.alias}</span> at v{selected}? This will prevent any future refreshes.
              </p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => onConfirm(selected, false)} className="flex-1 text-xs border-border">No, just rollback</Button>
                <Button size="sm" onClick={() => onConfirm(selected, true)} className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white">Yes, freeze</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground mb-1">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ── Premium Badge ─────────────────────────────────────────────────────────────

function PremiumBadge({ isAdminCurated }: { isAdminCurated: boolean }) {
  if (isAdminCurated) {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-400/40 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 shrink-0">
        <Shield size={9} className="text-yellow-300" /> CURATED
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-yellow-500/25 bg-yellow-500/10 text-yellow-400 shrink-0">
      <Crown size={9} /> PREMIUM
    </span>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ value, icon: Icon, label, copiedLabel }: {
  value: string;
  icon: React.ElementType;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  function handle() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={label}
    >
      {copied
        ? <CheckCircle2 size={11} className="text-emerald-400" />
        : <Icon size={11} />
      }
      <span className={copied ? "text-emerald-400" : ""}>{copied ? copiedLabel : label}</span>
    </button>
  );
}

// ── Dataset Card ──────────────────────────────────────────────────────────────

function DatasetCard({
  dataset,
  onEdit, onDelete, onFreeze, onRefresh, onRollback,
  onRegeneratePingKey, onRegeneratePrivateKey,
}: {
  dataset: Dataset;
  onEdit: (d: Dataset) => void;
  onDelete: (d: Dataset) => void;
  onFreeze: (d: Dataset) => void;
  onRefresh: (d: Dataset) => void;
  onRollback: (d: Dataset) => void;
  onRegeneratePingKey: (d: Dataset) => void;
  onRegeneratePrivateKey: (d: Dataset) => void;
}) {
  const s = STATUS_CONFIG[normalizeStatus(dataset.status)] ?? STATUS_CONFIG["active"];
  const t = DATASET_TYPE_CONFIG[normalizeDatasetType(dataset.dataset_type)] ?? DATASET_TYPE_CONFIG["web"];
  const TypeIcon = t.icon;
  const isProcessing = dataset.status === "processing";
  const hasVersions = dataset.versions.length > 0;
  const isAdminCurated = dataset.is_premium && !dataset.is_cloned;
  const isPrivate = dataset.visibility === "private";

  const viewHref = dataset.dataset_type === "reddit"
    ? `/dataset/reddit-view/${dataset.dataset_id}`
    : `/dataset/web-view/${dataset.dataset_id}`;

  const altHref = dataset.dataset_type === "reddit"
    ? `/alternate/reddit-data/${dataset.dataset_id}?version=${dataset.version}`
    : `/alternate/web-data/${dataset.dataset_id}?version=${dataset.version}`;

  const pingURL = `${process.env.NEXT_PUBLIC_API_URL}/ping/${dataset.ping_key}`;

  return (
    <Card className={cn(
      "bg-card border-border hover:border-primary/30 transition-all duration-150 group",
      isAdminCurated && "hover:border-yellow-400/40",
      dataset.is_premium && dataset.is_cloned && "hover:border-yellow-500/30",
    )}>
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-md border flex items-center justify-center shrink-0 transition-colors",
              isAdminCurated
                ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/30 group-hover:border-yellow-400/50"
                : dataset.is_premium
                  ? "bg-yellow-500/10 border-yellow-500/20 group-hover:border-yellow-500/40"
                  : "bg-accent border-border group-hover:border-primary/40",
            )}>
              {isAdminCurated
                ? <Shield size={14} className="text-yellow-300" />
                : dataset.is_cloned
                  ? <GitFork size={14} className="text-primary" />
                  : <TypeIcon size={14} className="text-primary" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-mono font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {dataset.alias || dataset.name}
                </p>
                {dataset.is_premium && (
                  <PremiumBadge isAdminCurated={isAdminCurated} />
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <p className="text-xs text-muted-foreground font-mono truncate">{dataset.name}</p>
                {dataset.is_cloned && (
                  <span className="text-xs text-primary/60 font-mono shrink-0">· cloned</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border", s.class)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
              {s.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground hover:text-foreground">
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border w-44">
                <DropdownMenuItem onClick={() => onEdit(dataset)} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-2">
                  <Pencil size={13} /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => !isProcessing && onRefresh(dataset)}
                  disabled={isProcessing}
                  className={cn("text-xs cursor-pointer gap-2", isProcessing ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground")}
                >
                  <RefreshCw size={13} /> Refresh
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => hasVersions && onRollback(dataset)}
                  disabled={!hasVersions}
                  className={cn("text-xs cursor-pointer gap-2", !hasVersions ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground")}
                >
                  <RotateCcw size={13} /> Rollback
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => !isProcessing && onFreeze(dataset)}
                  disabled={isProcessing}
                  className={cn("text-xs cursor-pointer gap-2", isProcessing ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground")}
                >
                  <Snowflake size={13} /> {dataset.is_frozen ? "Unfreeze" : "Freeze"}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-border" />
<DropdownMenuItem
  onClick={() => onRegeneratePingKey(dataset)}
  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-2"
>
  <RefreshCw size={13} /> Regenerate Ping Key
</DropdownMenuItem>
{dataset.visibility === "private" && (
  <DropdownMenuItem
    onClick={() => onRegeneratePrivateKey(dataset)}
    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-2"
  >
    <Key size={13} /> Regenerate API Key
  </DropdownMenuItem>
)}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => onDelete(dataset)} className="text-xs text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 cursor-pointer gap-2">
                  <Trash2 size={13} /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Type pill + tags + badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border", t.class)}>
            <TypeIcon size={10} /> {t.label}
          </span>

          {dataset.nightly && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-400">
              <Moon size={9} /> nightly
            </span>
          )}

          {dataset.tag && dataset.tag.split(",").map((tg) => tg.trim()).filter(Boolean).map((tg) => (
            <span
              key={tg}
              className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border", tagColor(tg))}
            >
              {tg}
            </span>
          ))}

          {dataset.has_alt && dataset.version > 0 && (
            <Link href={altHref} onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/15 transition-colors cursor-pointer">
                <Sparkles size={9} /> alt v{dataset.version}
              </span>
            </Link>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {
              label: "Version",
              value: dataset.version > 0 ? `v${dataset.version}` : "—",
              sub: dataset.versions.length > 0 ? `${dataset.versions.length} total` : "pending",
              dim: dataset.version === 0,
            },
            {
              label: "Records",
              value: dataset.entity_count > 0 ? formatCount(dataset.entity_count) : "—",
              sub: "entities",
              dim: dataset.entity_count === 0,
            },
            {
              label: "API Hits",
              value: dataset.api_hit_count > 0 ? formatCount(dataset.api_hit_count) : "—",
              sub: "total calls",
              dim: dataset.api_hit_count === 0,
            },
          ].map(({ label, value, sub, dim }) => (
            <div key={label} className="bg-background border border-border rounded-md p-2 text-center">
              <p className={cn("text-xs font-medium tabular-nums", dim ? "text-muted-foreground/40" : "text-foreground")}>{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground/50">{sub}</p>
            </div>
          ))}
        </div>

        {/* Clone count row — public datasets only */}
        {dataset.visibility === "public" && dataset.clone_count > 0 && (
          <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-md bg-accent/20 border border-border">
            <GitFork size={10} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{dataset.clone_count}</span> {dataset.clone_count === 1 ? "clone" : "clones"}
            </p>
            <span className="text-border mx-1">·</span>
            <Radio size={10} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{formatCount(dataset.api_hit_count)}</span> API hits
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <GitBranch size={10} />
              {dataset.version > 0 ? `v${dataset.version}` : "pending"}
            </span>

            <span className="text-border">·</span>

            <span className="text-xs text-muted-foreground">
              {timeAgo(dataset.last_refresh)}
            </span>

            <span className="text-border">·</span>

            <CopyButton
              value={pingURL}
              icon={Copy}
              label="Ping"
              copiedLabel="Copied!"
            />

                  {isPrivate && (
                <>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-slate-500/30 bg-slate-500/10 text-slate-400">
               <Shield size={9} /> private
              </span>
           {dataset.private_key && (
                <CopyButton
                value={dataset.private_key}
                icon={Key}
                label="API key"
                copiedLabel="Copied!"
              />
          )}
  </>
                )}
          </div>

         <Link href={viewHref} onClick={(e) => dataset.status !== "active" && e.preventDefault()}>
  <Button
    size="sm"
    variant="outline"
    disabled={dataset.status !== "active"}
    className="h-7 text-xs gap-1.5 border-border hover:border-primary/40 hover:text-primary bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <Eye size={11} /> View
  </Button>
</Link>
        </div>

      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "none" }
  | { type: "new-dataset" }
  | { type: "delete"; dataset: Dataset }
  | { type: "refresh"; dataset: Dataset }
  | { type: "freeze"; dataset: Dataset }
  | { type: "rollback"; dataset: Dataset };

export default function DatasetsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const fetchDatasets = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await callBackend(`/datasets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const normalized = (data.datasets ?? []).map((d: any) => ({
        ...d,
        alias: d.alias || d.name,
        dataset_type: normalizeDatasetType(d.dataset_type),
        status: normalizeStatus(d.status),
        version: d.version ?? 0,
        versions: d.versions ?? [],
        has_alt: d.has_alt ?? false,
        is_premium: d.is_premium ?? false,
        nightly: d.nightly ?? false,
        ping_key: d.ping_key ?? "",
        private_key: d.private_key ?? "",
        clone_count: d.clone_count ?? 0,
        api_hit_count: d.api_hit_count ?? 0,
        entity_count: d.entity_count ?? 0,
      }));
      setDatasets(normalized);
    } catch (err) {
      console.error("fetch datasets error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
  fetchDatasets();
}, [fetchDatasets]);

useEffect(() => {
  const hasProcessing = datasets.some((d) => d.status === "processing");
  if (!hasProcessing) return;

  const interval = setInterval(fetchDatasets, 10000);
  return () => clearInterval(interval);
}, [datasets, fetchDatasets]);

  const active = datasets.filter((d) => d.status === "active").length;
  const cloned = datasets.filter((d) => d.is_cloned).length;
  const totalRecords = datasets.reduce((sum, d) => sum + (d.entity_count ?? 0), 0);
  const totalAPIHits = datasets.reduce((sum, d) => sum + (d.api_hit_count ?? 0), 0);

  const filtered = datasets.filter((d) =>
    (d.alias ?? d.name).toLowerCase().includes(search.toLowerCase()) ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.tag ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleNewDatasetSelect(type: DatasetType) {
    setModal({ type: "none" });
    if (type === "reddit") router.push("/dataset/reddit-new");
    else router.push("/dataset/web-new");
  }

  async function handleDelete(dataset: Dataset) {
    try {
      await callBackend(`/dataset/delete`, {
  method: "DELETE",
  body: JSON.stringify({ dataset_id: dataset.dataset_id }),
});
      setDatasets((prev) => prev.filter((d) => d.dataset_id !== dataset.dataset_id));
    } catch (err) {
      console.error("delete error:", err);
    } finally {
      setModal({ type: "none" });
    }
  }

  async function handleFreeze(dataset: Dataset) {
    try {
      await callBackend(`/dataset/freeze`, {
  method: "POST",
  body: JSON.stringify({ dataset_id: dataset.dataset_id, freeze: !dataset.is_frozen }),
});
      setDatasets((prev) =>
        prev.map((d) =>
          d.dataset_id === dataset.dataset_id
            ? { ...d, is_frozen: !d.is_frozen, status: !d.is_frozen ? "frozen" : "active" }
            : d
        )
      );
    } catch (err) {
      console.error("freeze error:", err);
    } finally {
      setModal({ type: "none" });
    }
  }

  async function handleRefresh(dataset: Dataset) {
    try {
      await callBackend(`/dataset/refresh`, {
  method: "POST",
  body: JSON.stringify({ dataset_id: dataset.dataset_id }),
});
      setDatasets((prev) =>
        prev.map((d) =>
          d.dataset_id === dataset.dataset_id ? { ...d, status: "processing" } : d
        )
      );
    } catch (err) {
      console.error("refresh error:", err);
    } finally {
      setModal({ type: "none" });
    }
  }

  async function handleRollback(dataset: Dataset, version: number, freeze: boolean) {
    try {
      // NEW
await callBackend(`/dataset/rollback`, {
  method: "POST",
  body: JSON.stringify({ dataset_id: dataset.dataset_id, version_number: version, freeze }),
});
      setDatasets((prev) =>
        prev.map((d) =>
          d.dataset_id === dataset.dataset_id
            ? { ...d, version, is_frozen: freeze, status: freeze ? "frozen" : d.status }
            : d
        )
      );
    } catch (err) {
      console.error("rollback error:", err);
    } finally {
      setModal({ type: "none" });
    }
  }


async function handleRegeneratePingKey(dataset: Dataset) {
  try {
    // NEW
const res = await callBackend(`/dataset/regenerate/ping-key`, {
  method: "POST",
  body: JSON.stringify({ dataset_id: dataset.dataset_id }),
});
    const data = await res.json();
    if (data.ok) {
      setDatasets((prev) =>
        prev.map((d) =>
          d.dataset_id === dataset.dataset_id ? { ...d, ping_key: data.ping_key } : d
        )
      );
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL}/ping/${data.ping_key}`);
    }
  } catch (err) {
    console.error("regenerate ping key error:", err);
  }
}

async function handleRegeneratePrivateKey(dataset: Dataset) {
  try {
    const res = await callBackend(`/dataset/regenerate/private-key`, {
  method: "POST",
  body: JSON.stringify({ dataset_id: dataset.dataset_id }),
});
    const data = await res.json();
    if (data.ok) {
      setDatasets((prev) =>
        prev.map((d) =>
          d.dataset_id === dataset.dataset_id ? { ...d, private_key: data.private_key } : d
        )
      );
      navigator.clipboard.writeText(data.private_key);
    }
  } catch (err) {
    console.error("regenerate private key error:", err);
  }
}
  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10">
      {modal.type === "new-dataset" && (
        <NewDatasetModal onCancel={() => setModal({ type: "none" })} onSelect={handleNewDatasetSelect} />
      )}
      {modal.type === "delete" && (
        <DeleteModal
          dataset={modal.dataset}
          onConfirm={() => handleDelete(modal.dataset)}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "refresh" && (
        <ConfirmModal
          title="Refresh Dataset"
          message={`Re-run the full pipeline for "${modal.dataset.alias || modal.dataset.name}"? This may take a while.`}
          confirmLabel="Yes, Refresh"
          onConfirm={() => handleRefresh(modal.dataset)}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "freeze" && (
        <ConfirmModal
          title={modal.dataset.is_frozen ? "Unfreeze Dataset" : "Freeze Dataset"}
          message={modal.dataset.is_frozen
            ? `Unfreeze "${modal.dataset.alias || modal.dataset.name}"? Nightly refreshes will resume.`
            : `Freeze "${modal.dataset.alias || modal.dataset.name}"? No further refreshes will run.`}
          confirmLabel={modal.dataset.is_frozen ? "Unfreeze" : "Freeze"}
          onConfirm={() => handleFreeze(modal.dataset)}
          onCancel={() => setModal({ type: "none" })}
        />
      )}
      {modal.type === "rollback" && (
        <RollbackModal
          dataset={modal.dataset}
          onConfirm={(version, freeze) => handleRollback(modal.dataset, version, freeze)}
          onCancel={() => setModal({ type: "none" })}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">My Datasets</h1>
          <p className="text-sm text-muted-foreground">Manage, refresh and version your datasets.</p>
        </div>
        <Button
          onClick={() => setModal({ type: "new-dataset" })}
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm gap-2 shadow-[0_0_16px_oklch(0.85_0.18_195_/_0.3)]"
        >
          <Plus size={15} /> New Dataset
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Datasets" value={String(datasets.length)} sub={`${active} active`} />
        <StatCard label="Total Records" value={formatCount(totalRecords)} sub="across all datasets" />
        <StatCard label="API Hits" value={formatCount(totalAPIHits)} sub="total calls served" />
        <StatCard label="Cloned" value={String(cloned)} sub="datasets from others" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search datasets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border focus:border-primary text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => (
<DatasetCard
  key={d.dataset_id}
  dataset={d}
  onEdit={(d) => {
    if (d.dataset_type === "reddit") router.push(`/dataset/reddit-edit/${d.dataset_id}`);
    else if (d.dataset_type === "amazon") router.push(`/dataset/amazon-edit/${d.dataset_id}`);
    else router.push(`/dataset/web-edit/${d.dataset_id}`);
  }}
  onDelete={(d) => setModal({ type: "delete", dataset: d })}
  onFreeze={(d) => setModal({ type: "freeze", dataset: d })}
  onRefresh={(d) => setModal({ type: "refresh", dataset: d })}
  onRollback={(d) => setModal({ type: "rollback", dataset: d })}
  onRegeneratePingKey={handleRegeneratePingKey}
  onRegeneratePrivateKey={handleRegeneratePrivateKey}
/>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Zap size={32} className="text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">
            {search ? "No datasets match your search" : "No datasets yet"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {search ? "Try a different keyword." : "Create your first dataset to get started."}
          </p>
          {!search && (
            <Button size="sm" onClick={() => setModal({ type: "new-dataset" })} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-2">
              <Plus size={13} /> New Dataset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}