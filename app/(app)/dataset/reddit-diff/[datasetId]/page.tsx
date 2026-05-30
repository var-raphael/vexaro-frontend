"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRedirectToDashboard } from "@/hooks/useRedirectToDashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, GitBranch, ChevronDown, Loader2,
  AlertCircle, Plus, Minus, RefreshCw,
  Table2, Braces, Calendar, ChevronRight,
  ChevronLeft, ChevronsLeft, ChevronsRight,
  Database, ChevronUp, MessageSquare, ArrowUp,
  ExternalLink, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DatasetVersion {
  version_number: number;
  created_at: string;
  is_active: boolean;
  file_path: string;
}

type ChangeType = "added" | "subtracted" | "modified";
type Filter = "all" | ChangeType;
type ViewMode = "tabular" | "json";

interface FieldDiff {
  field: string;
  v1: unknown;
  v2: unknown;
}

interface RedditPost {
  title: string;
  body?: string;
  author: string;
  score: number;
  ups: number;
  downs: number;
  upvote_ratio: number;
  num_comments: number;
  subreddit: string;
  url: string;
  created_utc: number;
  comments?: unknown[];
  fetched_at?: string;
  [key: string]: unknown;
}

interface DiffRecord {
  id: string;
  change_type: ChangeType;
  source: string;
  v1: RedditPost | null;
  v2: RedditPost | null;
  field_diffs: FieldDiff[] | null;
}

interface DiffResult {
  added: number;
  subtracted: number;
  modified: number;
  total_v1: number;
  total_v2: number;
  records: DiffRecord[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const CHANGE_CONFIG: Record<ChangeType, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}> = {
  added:      { label: "Added",      color: "text-emerald-400", bg: "bg-emerald-500/5",  border: "border-emerald-500/20", icon: Plus },
  subtracted: { label: "Subtracted", color: "text-red-400",     bg: "bg-red-500/5",      border: "border-red-500/20",     icon: Minus },
  modified:   { label: "Modified",   color: "text-orange-400",  bg: "bg-orange-500/5",   border: "border-orange-500/20",  icon: RefreshCw },
};

const SKIP_FIELDS = new Set(["comments", "fetched_at", "_source"]);
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatUtc(utc: number): string {
  return new Date(utc * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val || "—";
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return `[${val.length} item${val.length !== 1 ? "s" : ""}]`;
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  return String(val);
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

function colLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── JSON Syntax Highlighter ───────────────────────────────────────────────────

function highlight(json: string): React.ReactNode[] {
  const tokens: { text: string; cls: string }[] = [];
  const re = /("(?:\\.|[^"\\])*"(?:\s*:)?)|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json)) !== null) {
    if (m.index > last) tokens.push({ text: json.slice(last, m.index), cls: "text-muted-foreground/40" });
    const raw = m[0];
    if (m[1]) {
      if (raw.endsWith(":")) {
        tokens.push({ text: raw.slice(0, -1), cls: "text-sky-400/80" });
        tokens.push({ text: ":", cls: "text-muted-foreground/40" });
      } else {
        tokens.push({ text: raw, cls: "text-amber-300/80" });
      }
    } else if (m[2]) {
      tokens.push({ text: raw, cls: raw === "null" ? "text-muted-foreground/40" : "text-purple-400/80" });
    } else if (m[3]) {
      tokens.push({ text: raw, cls: "text-emerald-400/80" });
    } else {
      tokens.push({ text: raw, cls: "text-muted-foreground/50" });
    }
    last = m.index + raw.length;
  }
  if (last < json.length) tokens.push({ text: json.slice(last), cls: "text-muted-foreground/40" });
  return tokens.map((t, i) => <span key={i} className={t.cls}>{t.text}</span>);
}

function JsonHighlight({ value, className }: { value: unknown; className?: string }) {
  const json = JSON.stringify(value, null, 2);
  return (
    <pre className={cn(
      "text-[11px] leading-relaxed font-mono overflow-x-auto rounded-md p-3",
      "bg-[#0d1117] border border-border/40",
      className
    )}>
      {highlight(json)}
    </pre>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, pageSize, total, onPage, onPageSize,
}: {
  page: number; totalPages: number; pageSize: number; total: number;
  onPage: (p: number) => void; onPageSize: (s: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 py-3 px-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Show</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border px-2">
              {pageSize} <ChevronDown size={10} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-card border-border min-w-0">
            {PAGE_SIZE_OPTIONS.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => { onPageSize(s); onPage(1); }}
                className={cn("text-xs cursor-pointer", s === pageSize ? "text-primary" : "text-muted-foreground")}
              >
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span>per page · {from}–{to} of {total}</span>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onPage(1)} disabled={page === 1}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronsLeft size={13} />
        </button>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
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
                className={cn(
                  "w-7 h-7 rounded text-xs transition-colors",
                  p === page
                    ? "bg-orange-500/80 text-white font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}>
                {p}
              </button>
            )
          )}

        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronRight size={13} />
        </button>
        <button onClick={() => onPage(totalPages)} disabled={page === totalPages}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Post Meta ─────────────────────────────────────────────────────────────────

function PostMeta({ post, side }: { post: RedditPost; side: "v1" | "v2" }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1">
        <User size={9} />
        {post.author}
      </span>
      <span className="flex items-center gap-1">
        <ArrowUp size={9} className={side === "v2" ? "text-orange-400" : ""} />
        {post.score}
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare size={9} />
        {post.num_comments}
      </span>
      <span className="text-muted-foreground/40">r/{post.subreddit}</span>
      {post.created_utc && (
        <span className="flex items-center gap-1">
          <Calendar size={9} />
          {formatUtc(post.created_utc)}
        </span>
      )}
    </div>
  );
}

// ── Tabular Diff Record ───────────────────────────────────────────────────────

function TabularRecord({ record, vA, vB }: { record: DiffRecord; vA: number; vB: number }) {
  const [open, setOpen] = useState(true);
  const cfg  = CHANGE_CONFIG[record.change_type];
  const Icon = cfg.icon;
  const post = (record.v2 ?? record.v1) as RedditPost;

  const rows: { field: string; v1: unknown; v2: unknown }[] = [];

  if (record.change_type === "modified") {
    for (const fd of record.field_diffs ?? []) {
      if (SKIP_FIELDS.has(fd.field)) continue;
      rows.push({ field: fd.field, v1: fd.v1, v2: fd.v2 });
    }
    const commentDiff = (record.field_diffs ?? []).find((f) => f.field === "comments");
    if (commentDiff) {
      const c1 = Array.isArray(commentDiff.v1) ? commentDiff.v1.length : 0;
      const c2 = Array.isArray(commentDiff.v2) ? commentDiff.v2.length : 0;
      rows.push({
        field: "comments",
        v1: `${c1} comment${c1 !== 1 ? "s" : ""}`,
        v2: `${c2} comment${c2 !== 1 ? "s" : ""}`,
      });
    }
  } else {
    const entity = post ?? {};
    const keys = Object.keys(entity).filter((k) => !SKIP_FIELDS.has(k));
    for (const f of keys) {
      rows.push({
        field: f,
        v1: record.change_type === "added" ? undefined : entity[f],
        v2: record.change_type === "subtracted" ? undefined : entity[f],
      });
    }
    const comments = entity.comments;
    if (Array.isArray(comments)) {
      const cnt = comments.length;
      rows.push({
        field: "comments",
        v1: record.change_type === "added" ? undefined : `${cnt} comment${cnt !== 1 ? "s" : ""}`,
        v2: record.change_type === "subtracted" ? undefined : `${cnt} comment${cnt !== 1 ? "s" : ""}`,
      });
    }
  }

  if (rows.length === 0) return null;

  const changedFields = (record.field_diffs ?? []).filter((f) => !SKIP_FIELDS.has(f.field));

  return (
    <div className={cn("rounded-md border overflow-hidden", cfg.border)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex flex-col gap-1.5 px-3 py-2.5 text-left transition-colors",
          cfg.bg,
          open ? cn("border-b", cfg.border) : ""
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0", cfg.color)}>
            <Icon size={10} /> {cfg.label}
          </span>
          {changedFields.length > 0 && (
            <div className="hidden sm:flex gap-1 flex-wrap">
              {changedFields.map((fd) => (
                <span key={fd.field} className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400/80 px-1.5 py-0.5 rounded font-mono">
                  {fd.field}
                </span>
              ))}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground/30 font-mono ml-auto shrink-0 truncate max-w-[160px]" title={record.id}>
            {shortUrl(record.id)}
          </span>
          {open
            ? <ChevronUp size={12} className="text-muted-foreground/40 shrink-0" />
            : <ChevronDown size={12} className="text-muted-foreground/40 shrink-0" />
          }
        </div>

        {post?.title && (
          <div className="flex flex-col gap-1 pl-0.5">
            <span className="text-[12px] text-foreground/80 font-medium leading-snug line-clamp-1">
              {post.title}
            </span>
            <PostMeta post={post} side={record.change_type === "added" ? "v2" : "v1"} />
          </div>
        )}
      </button>

      {open && (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider w-32">Field</th>
              <th className="text-left px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider w-1/2">
                v{vA} <span className="opacity-50 normal-case font-normal">(old)</span>
              </th>
              <th className="text-left px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider w-1/2">
                v{vB} <span className="opacity-50 normal-case font-normal">(new)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ field, v1, v2 }, idx) => (
              <tr key={field} className={cn("border-b border-border/20 last:border-0", idx % 2 === 1 && "bg-accent/10")}>
                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground/60 align-top">{field}</td>
                <td className="px-3 py-2 align-top max-w-[260px]">
                  {record.change_type === "added" ? (
                    <span className="text-muted-foreground/20 italic text-[11px]">—</span>
                  ) : (
                    <span className={cn(
                      "block break-words text-[12px] leading-relaxed",
                      record.change_type === "subtracted"
                        ? "text-red-300/80"
                        : "text-red-300/80 line-through decoration-red-400/40"
                    )}>
                      {renderValue(v1)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 align-top max-w-[260px]">
                  {record.change_type === "subtracted" ? (
                    <span className="text-muted-foreground/20 italic text-[11px]">—</span>
                  ) : (
                    <span className="block break-words text-[12px] leading-relaxed text-emerald-300/90">
                      {renderValue(v2)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── JSON Diff Record ──────────────────────────────────────────────────────────

function JsonRecord({ record, vA, vB }: { record: DiffRecord; vA: number; vB: number }) {
  const [open, setOpen] = useState(true);
  const cfg  = CHANGE_CONFIG[record.change_type];
  const Icon = cfg.icon;
  const post = (record.v2 ?? record.v1) as RedditPost;
  const changedSet = new Set((record.field_diffs ?? []).map((f) => f.field));
  const isAdded      = record.change_type === "added";
  const isSubtracted = record.change_type === "subtracted";
  const changedFields = (record.field_diffs ?? []).filter((f) => !SKIP_FIELDS.has(f.field));

  function renderPanel(obj: RedditPost | null, side: "v1" | "v2", empty: boolean) {
    if (empty || !obj) {
      return (
        <div className="flex items-center justify-center h-full min-h-[60px] text-muted-foreground/20 text-xs italic p-4">
          not present
        </div>
      );
    }
    const keys = Object.keys(obj).filter((k) => !SKIP_FIELDS.has(k));
    const displayKeys = record.change_type === "modified"
      ? keys.filter((k) => changedSet.has(k))
      : keys;

    return (
      <div className="font-mono text-[11px] leading-relaxed p-3 space-y-0.5 overflow-x-auto">
        {displayKeys.map((key) => {
          const val = obj[key as keyof RedditPost];
          const isChanged = changedSet.has(key);
          return (
            <div key={key} className={cn(
              "flex gap-1.5 rounded-sm px-1 -mx-1",
              isChanged && side === "v1" && "bg-red-500/10",
              isChanged && side === "v2" && "bg-emerald-500/10",
            )}>
              <span className="text-sky-400/70 shrink-0">&quot;{key}&quot;:</span>
              <span className={cn(
                "break-all",
                !isChanged      ? "text-muted-foreground/50"
                : side === "v1" ? "text-red-300/90"
                :                 "text-emerald-300/90"
              )}>
                {JSON.stringify(val)}
              </span>
            </div>
          );
        })}
        {Array.isArray(obj.comments) && (
          <div className="flex gap-1.5 rounded-sm px-1 -mx-1">
            <span className="text-sky-400/70 shrink-0">&quot;comments&quot;:</span>
            <span className="text-muted-foreground/40">[{obj.comments.length} items]</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border overflow-hidden", cfg.border)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex flex-col gap-1.5 px-3 py-2.5 text-left transition-colors",
          cfg.bg,
          open ? cn("border-b", cfg.border) : ""
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0", cfg.color)}>
            <Icon size={10} /> {cfg.label}
          </span>
          {changedFields.length > 0 && (
            <div className="hidden sm:flex gap-1 flex-wrap">
              {changedFields.map((fd) => (
                <span key={fd.field} className="text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-400/80 px-1.5 py-0.5 rounded font-mono">
                  {fd.field}
                </span>
              ))}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground/30 font-mono ml-auto shrink-0 truncate max-w-[160px]" title={record.id}>
            {shortUrl(record.id)}
          </span>
          {open
            ? <ChevronUp size={12} className="text-muted-foreground/40 shrink-0" />
            : <ChevronDown size={12} className="text-muted-foreground/40 shrink-0" />
          }
        </div>
        {post?.title && (
          <div className="flex flex-col gap-1 pl-0.5">
            <span className="text-[12px] text-foreground/80 font-medium leading-snug line-clamp-1">
              {post.title}
            </span>
            <PostMeta post={post} side={record.change_type === "added" ? "v2" : "v1"} />
          </div>
        )}
      </button>

      {open && (
        <div className="grid grid-cols-2 divide-x divide-border/40">
          <div className={cn(isAdded && "opacity-25 bg-accent/20")}>
            <div className="px-3 py-1.5 border-b border-border/30 bg-accent/10">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                v{vA} <span className="normal-case font-normal">(old)</span>
              </span>
            </div>
            {renderPanel(record.v1, "v1", isAdded)}
          </div>
          <div className={cn(isSubtracted && "opacity-25 bg-accent/20")}>
            <div className="px-3 py-1.5 border-b border-border/30 bg-accent/10">
              <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                v{vB} <span className="normal-case font-normal">(new)</span>
              </span>
            </div>
            {renderPanel(record.v2, "v2", isSubtracted)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dataset Viewer ────────────────────────────────────────────────────────────

interface DatasetViewerProps {
  versions: DatasetVersion[];
  activeVersion: number;
  datasetId: string;
}

function DatasetViewer({ versions, activeVersion, datasetId }: DatasetViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState(activeVersion);
  const [posts, setPosts]       = useState<RedditPost[]>([]);
  const [loading, setLoading]   = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("tabular");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const columns = useMemo(() => {
    const cols = new Set<string>();
    posts.slice(0, 50).forEach((p) =>
      Object.keys(p).forEach((k) => !SKIP_FIELDS.has(k) && cols.add(k))
    );
    return Array.from(cols);
  }, [posts]);

  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const pagePosts  = posts.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const ver = versions.find((v) => v.version_number === selectedVersion);
    if (!ver) return;
    setLoading(true);
    setPage(1);
    fetch(`${API}/dataset/reddit/result?dataset_id=${datasetId}&version_id=${ver.version_number}`)
      .then((r) => r.json())
      .then((data) => {
        const arr: RedditPost[] = Array.isArray(data)
          ? data
          : (data.posts ?? data.entities ?? []);
        setPosts(arr);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [selectedVersion, versions, datasetId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Dataset Posts</span>
          <span className="text-xs text-muted-foreground">({posts.length} posts)</span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs border-border gap-1.5 h-8">
                <GitBranch size={11} />
                v{selectedVersion}
                <ChevronDown size={10} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              {versions.map((v) => (
                <DropdownMenuItem
                  key={v.version_number}
                  onClick={() => setSelectedVersion(v.version_number)}
                  className={cn(
                    "text-xs cursor-pointer gap-2",
                    v.version_number === selectedVersion ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <GitBranch size={11} />
                  v{v.version_number}
                  {v.is_active && <span className="ml-auto text-emerald-400">active</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-1">
            <button
              onClick={() => setViewMode("tabular")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors",
                viewMode === "tabular"
                  ? "bg-background border border-border text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 size={11} /> Table
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors",
                viewMode === "json"
                  ? "bg-background border border-border text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Braces size={11} /> JSON
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
          No posts found for this version.
        </div>
      ) : viewMode === "tabular" ? (
        <>
          <div className="rounded-md border border-border overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead>
                <tr className="bg-accent/40 border-b border-border">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground/60 text-[10px] uppercase tracking-wider w-8">#</th>
                  {columns.map((col) => (
                    <th key={col} className="text-left px-3 py-2.5 font-medium text-muted-foreground/60 text-[10px] uppercase tracking-wider font-mono">
                      {colLabel(col)}
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground/60 text-[10px] uppercase tracking-wider">Comments</th>
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground/60 text-[10px] uppercase tracking-wider">Link</th>
                </tr>
              </thead>
              <tbody>
                {pagePosts.map((post, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors",
                      idx % 2 === 1 && "bg-accent/10"
                    )}
                  >
                    <td className="px-3 py-2 text-muted-foreground/30 text-[11px]">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-2 max-w-[220px] align-top">
                        <span
                          className="block truncate text-[12px] text-foreground/80"
                          title={renderValue(post[col as keyof RedditPost])}
                        >
                          {renderValue(post[col as keyof RedditPost])}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2 align-top">
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground/60">
                        <MessageSquare size={10} />
                        {Array.isArray(post.comments) ? post.comments.length : (post.num_comments ?? 0)}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {post.url && (
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-[11px] text-orange-400/70 hover:text-orange-400 transition-colors"
                        >
                          <ExternalLink size={10} /> open
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page} totalPages={totalPages} pageSize={pageSize} total={posts.length}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        </>
      ) : (
        <>
          <div className="space-y-2">
{pagePosts.map((post, idx) => (
  <div key={idx} className="rounded-md border border-border/40 overflow-hidden">
    {/* Header — title */}
    <div className="px-3 py-1.5 bg-accent/20 border-b border-border/30 flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground/40 font-mono">
        #{(page - 1) * pageSize + idx + 1}
      </span>
      <span className="text-[11px] text-foreground/60 truncate font-medium flex-1">
        {post.title}
      </span>
      {post.url && (
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-400/60 hover:text-orange-400 transition-colors shrink-0"
        >
          <ExternalLink size={11} />
        </a>
      )}
    </div>

    {/* Body — readable text */}
    {post.body && typeof post.body === "string" && post.body.trim().length > 0 && (
      <div className="px-4 py-3 border-b border-border/30 bg-background">
        <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium mb-1.5">
          post_body
        </p>
        <p className="text-[12px] text-foreground/70 leading-relaxed whitespace-pre-wrap">
          {post.body}
        </p>
      </div>
    )}

    {/* JSON — everything except title and body */}
    <JsonHighlight
      value={Object.fromEntries(
        Object.entries(post).filter(([k]) => k !== "title" && k !== "body")
      )}
    />
  </div>
))}
          </div>
          <Pagination
            page={page} totalPages={totalPages} pageSize={pageSize} total={posts.length}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}

// ── Version Picker ────────────────────────────────────────────────────────────

function VersionPicker({
  label, versions, selected, onChange, disabledVersion,
}: {
  label: string;
  versions: DatasetVersion[];
  selected: number;
  onChange: (v: number) => void;
  disabledVersion?: number;
}) {
  const current = versions.find((v) => v.version_number === selected);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs border-border gap-2 h-9 w-40 justify-between">
            <div className="flex items-center gap-1.5">
              <GitBranch size={12} />
              <span>v{selected}</span>
              {current?.is_active && <span className="text-emerald-400 text-[10px]">active</span>}
            </div>
            <ChevronDown size={11} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card border-border">
          {versions.map((v) => (
            <DropdownMenuItem
              key={v.version_number}
              disabled={v.version_number === disabledVersion}
              onClick={() => onChange(v.version_number)}
              className={cn(
                "text-xs cursor-pointer gap-2",
                v.version_number === selected ? "text-primary" : "text-muted-foreground hover:text-foreground",
                v.version_number === disabledVersion && "opacity-30 cursor-not-allowed"
              )}
            >
              <GitBranch size={11} />
              v{v.version_number}
              {v.is_active && <span className="ml-auto text-emerald-400">active</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {current && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar size={10} />
          {formatDate(current.created_at)}
        </span>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RedditDiffPage() {
  const params    = useParams();
  const router    = useRouter();
  const datasetId = params?.datasetId as string;
  useRedirectToDashboard();

  const [versions, setVersions]       = useState<DatasetVersion[]>([]);
  const [vA, setVA]                   = useState<number>(1);
  const [vB, setVB]                   = useState<number>(2);
  const [diff, setDiff]               = useState<DiffResult | null>(null);
  const [loading, setLoading]         = useState(true);
  const [diffLoading, setDiffLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<ViewMode>("tabular");
  const [filter, setFilter]           = useState<Filter>("all");
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(25);

  // ── fetch versions ─────────────────────────────────────────────────────────
  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dataset/reddit/view?dataset_id=${datasetId}`);
if (!res.ok) throw new Error(`status ${res.status}`);
const data = await res.json();
const vers: DatasetVersion[] = (data.versions ?? []).map((v: {
  version_number: number; created_at: string; is_active: boolean; file_path: string;
}) => ({
  version_number: v.version_number,
  created_at:     v.created_at,
  is_active:      v.is_active,
  file_path:      v.file_path,
}));

const activeNum = data.active_version ?? vers[vers.length - 1]?.version_number ?? 1;

const versWithActive = vers.map((v) => ({
  ...v,
  is_active: v.version_number === activeNum,
}));
setVersions(versWithActive);

const activeIdx = vers.findIndex((v) => v.version_number === activeNum);
const prevNum   = activeIdx > 0 ? vers[activeIdx - 1].version_number : vers[0].version_number;

if (vers.length >= 2) {
  setVA(prevNum);
  setVB(activeNum);
} else if (vers.length === 1) {
  setVA(vers[0].version_number);
  setVB(vers[0].version_number);
}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  // ── fetch diff ─────────────────────────────────────────────────────────────
  const fetchDiff = useCallback(async () => {
    if (vA === vB) return;
    setDiffLoading(true);
    setDiff(null);
    setPage(1);
    try {
      const res = await fetch(
        `${API}/dataset/reddit/diff?dataset_id=${datasetId}&v1=${vA}&v2=${vB}`
      );
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: DiffResult = await res.json();
      setDiff(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load diff");
    } finally {
      setDiffLoading(false);
    }
  }, [datasetId, vA, vB]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);
  useEffect(() => { if (!loading) fetchDiff(); }, [vA, vB, loading, fetchDiff]);

  // ── derived ────────────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() =>
    diff
      ? filter === "all" ? diff.records : diff.records.filter((r) => r.change_type === filter)
      : [],
    [diff, filter]
  );

  const totalPages  = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pageRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const FILTERS: { value: Filter; label: string; count: () => number }[] = [
    { value: "all",        label: "All",        count: () => diff?.records.length ?? 0 },
    { value: "added",      label: "Added",      count: () => diff?.added ?? 0 },
    { value: "subtracted", label: "Subtracted", count: () => diff?.subtracted ?? 0 },
    { value: "modified",   label: "Modified",   count: () => diff?.modified ?? 0 },
  ];

  useEffect(() => { setPage(1); }, [filter]);

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">Go Back</Button>
      </div>
    );
  }

  if (versions.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={28} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Need at least 2 versions to compare.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">Go Back</Button>
      </div>
    );
  }

  // ── insight card ───────────────────────────────────────────────────────────
  const InsightCard = () => {
    if (!diff) return null;
    const delta    = diff.total_v2 - diff.total_v1;
    const pct      = diff.total_v1 > 0 ? Math.abs(Math.round((delta / diff.total_v1) * 100)) : 0;
    const dominant =
      diff.added >= diff.subtracted && diff.added >= diff.modified ? "new posts"
      : diff.subtracted >= diff.modified ? "removed posts"
      : "updated posts";
    const affected = diff.total_v1 > 0
      ? Math.round(((diff.added + diff.subtracted + diff.modified) / diff.total_v1) * 100)
      : 0;
    const summary = delta === 0
      ? `v${vB} has the same post count as v${vA}. ${diff.modified} post${diff.modified !== 1 ? "s" : ""} were modified.`
      : `v${vB} is ${pct}% ${delta > 0 ? "larger" : "smaller"} than v${vA}, driven by ${dominant}. ${affected}% of v${vA}'s posts were affected.`;

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Insight</p>
          <p className="text-sm text-foreground leading-relaxed mb-4">{summary}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className={cn("text-lg font-bold", delta >= 0 ? "text-emerald-400" : "text-red-400")}>
                {delta >= 0 ? "+" : ""}{pct}%
              </p>
              <p className="text-[11px] text-muted-foreground">post delta</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{affected}%</p>
              <p className="text-[11px] text-muted-foreground">posts affected</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-400 capitalize">{dominant}</p>
              <p className="text-[11px] text-muted-foreground">top change</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            v{vA} <span className="text-foreground font-medium">{diff.total_v1}</span> posts
            {" → "}
            v{vB} <span className="text-foreground font-medium">{diff.total_v2}</span> posts
            {" · "}
            <span className={delta >= 0 ? "text-emerald-400" : "text-red-400"}>
              {delta >= 0 ? "+" : ""}{delta}
            </span>
          </p>
        </CardContent>
      </Card>
    );
  };

  const activeVersionNumber =
    versions.find((v) => v.is_active)?.version_number ??
    versions[versions.length - 1]?.version_number ?? 1;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-6">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Back to Dataset
      </button>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-mono mb-1">
          Reddit Version Diff
        </h1>
        <p className="text-sm text-muted-foreground">Compare two versions and inspect what changed across posts.</p>
      </div>

      {/* version picker */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-end gap-6 flex-wrap">
            <VersionPicker label="Base (from)" versions={versions} selected={vA} onChange={setVA} disabledVersion={vB} />
            <div className="flex items-center pb-1 text-muted-foreground/30 text-xl select-none">→</div>
            <VersionPicker label="Compare (to)" versions={versions} selected={vB} onChange={setVB} disabledVersion={vA} />
          </div>
        </CardContent>
      </Card>

      {/* stat cards */}
      {diff && !diffLoading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Added",      count: diff.added,      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Subtracted", count: diff.subtracted, color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
            { label: "Modified",   count: diff.modified,   color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={cn("rounded-md border p-4 text-center", bg)}>
              <p className={cn("text-2xl font-bold tracking-tight", color)}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {diff && !diffLoading && <InsightCard />}

      {/* diff section */}
      {diff && !diffLoading && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors whitespace-nowrap",
                    filter === f.value
                      ? "bg-background border border-border text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 text-muted-foreground/40">{f.count()}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-1">
              <button
                onClick={() => setViewMode("tabular")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors",
                  viewMode === "tabular"
                    ? "bg-background border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Table2 size={12} /> Tabular
              </button>
              <button
                onClick={() => setViewMode("json")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors",
                  viewMode === "json"
                    ? "bg-background border border-border text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Braces size={12} /> JSON
              </button>
            </div>
          </div>

          {filteredRecords.length > pageSize && (
            <Pagination
              page={page} totalPages={totalPages} pageSize={pageSize}
              total={filteredRecords.length}
              onPage={setPage}
              onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />
          )}

          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
              No posts match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {pageRecords.map((record) =>
                viewMode === "tabular" ? (
                  <TabularRecord key={record.id} record={record} vA={vA} vB={vB} />
                ) : (
                  <JsonRecord key={record.id} record={record} vA={vA} vB={vB} />
                )
              )}
            </div>
          )}

          {filteredRecords.length > 0 && (
            <Pagination
              page={page} totalPages={totalPages} pageSize={pageSize}
              total={filteredRecords.length}
              onPage={setPage}
              onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />
          )}
        </>
      )}

      {diffLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {!diffLoading && versions.length > 0 && (
        <div className="border-t border-border/40 pt-6">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <DatasetViewer
                versions={versions}
                activeVersion={activeVersionNumber}
                datasetId={datasetId}
              />
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}