"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Database, ChevronUp,
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

interface DiffRecord {
  id: string;
  change_type: ChangeType;
  source: string;
  v1: Record<string, unknown> | null;
  v2: Record<string, unknown> | null;
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
  modified:   { label: "Modified",   color: "text-yellow-400",  bg: "bg-yellow-500/5",   border: "border-yellow-500/20",  icon: RefreshCw },
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "string") return val || "—";
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item) =>
        typeof item === "object" && item !== null
          ? Object.values(item as Record<string, unknown>).join(" · ")
          : String(item)
      )
      .join(", ");
  }
  if (typeof val === "object") {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
  }
  return String(val);
}

function shortSource(source: string): string {
  try {
    const u = new URL(source);
    return u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return source;
  }
}

// ── JSON Syntax Highlighter ───────────────────────────────────────────────────
// Tokenizes JSON into colored spans without any external dependency.

function highlight(json: string): React.ReactNode[] {
  const tokens: { text: string; cls: string }[] = [];
  const re = /("(?:\\.|[^"\\])*"(?:\s*:)?)|(\b(?:true|false|null)\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json)) !== null) {
    if (m.index > last) tokens.push({ text: json.slice(last, m.index), cls: "text-muted-foreground/40" });
    const raw = m[0];
    if (m[1]) {
      // string — key vs value
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

// ── Pagination Controls ───────────────────────────────────────────────────────

function Pagination({
  page, totalPages, pageSize, total,
  onPage, onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

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
        <button
          onClick={() => onPage(1)}
          disabled={page === 1}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsLeft size={13} />
        </button>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={13} />
        </button>

        {/* page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && typeof arr[i - 1] === "number" && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground/40">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={cn(
                  "w-7 h-7 rounded text-xs transition-colors",
                  p === page
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {p}
              </button>
            )
          )}

        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={13} />
        </button>
        <button
          onClick={() => onPage(totalPages)}
          disabled={page === totalPages}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Collapsible Tabular Record ─────────────────────────────────────────────────

function TabularRecord({ record, vA, vB }: { record: DiffRecord; vA: number; vB: number }) {
  const [open, setOpen] = useState(true);
  const cfg = CHANGE_CONFIG[record.change_type];
  const Icon = cfg.icon;
  const entity = record.v2 ?? record.v1 ?? {};

  const rows: { field: string; v1: unknown; v2: unknown }[] = [];
  if (record.change_type === "modified") {
    for (const fd of record.field_diffs ?? []) {
      rows.push({ field: fd.field, v1: fd.v1, v2: fd.v2 });
    }
  } else {
    const fields = Object.keys(entity).filter((k) => k !== "_source");
    for (const f of fields) {
      rows.push({
        field: f,
        v1: record.change_type === "added" ? undefined : entity[f],
        v2: record.change_type === "subtracted" ? undefined : entity[f],
      });
    }
  }

  if (rows.length === 0) return null;

  return (
    <div className={cn("rounded-md border overflow-hidden", cfg.border)}>
      {/* header — clickable to collapse */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
          cfg.bg,
          open ? cn("border-b", cfg.border) : ""
        )}
      >
        <span className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0", cfg.color)}>
          <Icon size={10} /> {cfg.label}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono truncate" title={record.source}>
          {shortSource(record.source)}
        </span>
        {record.field_diffs && record.field_diffs.length > 0 && (
          <div className="hidden sm:flex gap-1 flex-wrap ml-1">
            {record.field_diffs.map((fd) => (
              <span key={fd.field} className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/80 px-1.5 py-0.5 rounded font-mono">
                {fd.field}
              </span>
            ))}
          </div>
        )}
        <span className="text-[10px] text-muted-foreground/30 font-mono ml-auto shrink-0">{record.id}</span>
        {open ? <ChevronUp size={12} className="text-muted-foreground/40 shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground/40 shrink-0" />}
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
                      record.change_type === "subtracted" ? "text-red-300/80" : "text-red-300/80 line-through decoration-red-400/40"
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

// ── Collapsible JSON Record ────────────────────────────────────────────────────

function JsonRecord({ record, vA, vB }: { record: DiffRecord; vA: number; vB: number }) {
  const [open, setOpen] = useState(true);
  const cfg = CHANGE_CONFIG[record.change_type];
  const Icon = cfg.icon;
  const changedSet = new Set((record.field_diffs ?? []).map((f) => f.field));
  const isAdded      = record.change_type === "added";
  const isSubtracted = record.change_type === "subtracted";

  function renderPanel(obj: Record<string, unknown> | null, side: "v1" | "v2", empty: boolean) {
    if (empty || !obj) {
      return (
        <div className="flex items-center justify-center h-full min-h-[60px] text-muted-foreground/20 text-xs italic p-4">
          not present
        </div>
      );
    }
    const keys = Object.keys(obj).filter((k) => k !== "_source");
    const displayKeys = record.change_type === "modified" ? keys.filter((k) => changedSet.has(k)) : keys;
    return (
      <div className="font-mono text-[11px] leading-relaxed p-3 space-y-0.5 overflow-x-auto">
        {displayKeys.map((key) => {
          const val = obj[key];
          const isChanged = changedSet.has(key);
          return (
            <div
              key={key}
              className={cn(
                "flex gap-1.5 rounded-sm px-1 -mx-1",
                isChanged && side === "v1" && "bg-red-500/10",
                isChanged && side === "v2" && "bg-emerald-500/10",
              )}
            >
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
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border overflow-hidden", cfg.border)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
          cfg.bg,
          open ? cn("border-b", cfg.border) : ""
        )}
      >
        <span className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest shrink-0", cfg.color)}>
          <Icon size={10} /> {cfg.label}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono truncate" title={record.source}>
          {shortSource(record.source)}
        </span>
        {record.field_diffs && record.field_diffs.length > 0 && (
          <div className="hidden sm:flex gap-1 flex-wrap ml-1">
            {record.field_diffs.map((fd) => (
              <span key={fd.field} className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/80 px-1.5 py-0.5 rounded font-mono">
                {fd.field}
              </span>
            ))}
          </div>
        )}
        <span className="text-[10px] text-muted-foreground/30 font-mono ml-auto shrink-0">{record.id}</span>
        {open ? <ChevronUp size={12} className="text-muted-foreground/40 shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground/40 shrink-0" />}
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

// ── Dataset Full Viewer ───────────────────────────────────────────────────────

interface EntityViewerProps {
  versions: DatasetVersion[];
  activeVersion: number;
  datasetId: string;
}

function DatasetViewer({ versions, activeVersion, datasetId }: EntityViewerProps) {
  const [selectedVersion, setSelectedVersion] = useState(activeVersion);
  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("tabular");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // derive columns from entities
  const columns = useMemo(() => {
    const cols = new Set<string>();
    entities.slice(0, 50).forEach((e) => Object.keys(e).forEach((k) => k !== "_source" && cols.add(k)));
    return Array.from(cols);
  }, [entities]);

  const totalPages = Math.max(1, Math.ceil(entities.length / pageSize));
  const pageEntities = entities.slice((page - 1) * pageSize, page * pageSize);

  // fetch result file for selected version via API
  useEffect(() => {
    const ver = versions.find((v) => v.version_number === selectedVersion);
    if (!ver) return;
    setLoading(true);
    setPage(1);
    // We fetch via a dedicated endpoint — adjust path to match your backend
    fetch(`${API}/dataset/result?dataset_id=${datasetId}&version_id=${ver.version_number}`)
      .then((r) => r.json())
      .then((data) => {
        // backend returns { entities: [...] }
        const arr = Array.isArray(data) ? data : (data.entities ?? []);
        setEntities(arr);
      })
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, [selectedVersion, versions]);

  return (
    <div className="space-y-4">
      {/* header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Database size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Dataset Result</span>
          <span className="text-xs text-muted-foreground">({entities.length} entities)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* version selector */}
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

          {/* view toggle */}
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
      ) : entities.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
          No entities found for this version.
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
                      {col}
                    </th>
                  ))}
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground/60 text-[10px] uppercase tracking-wider">Source</th>
                </tr>
              </thead>
              <tbody>
                {pageEntities.map((entity, idx) => (
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
                        <span className="block truncate text-[12px] text-foreground/80" title={renderValue(entity[col])}>
                          {renderValue(entity[col])}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2 max-w-[180px] align-top">
                      <span
                        className="block truncate text-[11px] text-muted-foreground/50 font-mono"
                        title={entity["_source"] as string}
                      >
                        {shortSource(entity["_source"] as string ?? "")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={entities.length}
            onPage={setPage}
            onPageSize={(s) => { setPageSize(s); setPage(1); }}
          />
        </>
      ) : (
        <>
          <div className="space-y-2">
            {pageEntities.map((entity, idx) => (
              <div key={idx} className="rounded-md border border-border/40 overflow-hidden">
                <div className="px-3 py-1.5 bg-accent/20 border-b border-border/30 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/40 font-mono">
                    #{(page - 1) * pageSize + idx + 1}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 font-mono truncate">
                    {shortSource(entity["_source"] as string ?? "")}
                  </span>
                </div>
                <JsonHighlight value={entity} />
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={entities.length}
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

export default function DiffPage() {
  const params  = useParams();
  const router  = useRouter();
  const datasetId = params?.datasetId as string;

  const [versions, setVersions]         = useState<DatasetVersion[]>([]);
  const [vA, setVA]                     = useState<number>(1);
  const [vB, setVB]                     = useState<number>(2);
  const [diff, setDiff]                 = useState<DiffResult | null>(null);
  const [loading, setLoading]           = useState(true);
  const [diffLoading, setDiffLoading]   = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [viewMode, setViewMode]         = useState<ViewMode>("tabular");
  const [filter, setFilter]             = useState<Filter>("all");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  // ── fetch versions ─────────────────────────────────────────────────────────
  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dataset/view?dataset_id=${datasetId}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      const vers: DatasetVersion[] = (data.versions ?? []).map((v: {
  version_number: number; created_at: string; is_active: boolean; file_path: string;
}) => ({
  version_number: v.version_number,
  created_at: v.created_at,
  is_active: v.is_active,
  file_path: v.file_path,
}));

const activeNum = data.active_version ?? vers[vers.length - 1]?.version_number ?? 1;

const versWithActive = vers.map((v) => ({
  ...v,
  is_active: v.version_number === activeNum,
}));

setVersions(versWithActive);

if (vers.length >= 2) {
  const activeIdx = vers.findIndex((v) => v.version_number === activeNum);
  const prevNum = activeIdx > 0 ? vers[activeIdx - 1].version_number : vers[0].version_number;
  setVA(prevNum);
  setVB(activeNum);
}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  // ── fetch diff ─────────────────────────────────────────────────────────────
  const fetchDiff = useCallback(async () => {
    setDiffLoading(true);
    setDiff(null);
    setPage(1);
    try {
      const res = await fetch(`${API}/dataset/diff?dataset_id=${datasetId}&v1=${vA}&v2=${vB}`);
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

  const totalPages   = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pageRecords  = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const FILTERS: { value: Filter; label: string; count: () => number }[] = [
    { value: "all",        label: "All",        count: () => diff?.records.length ?? 0 },
    { value: "added",      label: "Added",      count: () => diff?.added ?? 0 },
    { value: "subtracted", label: "Subtracted", count: () => diff?.subtracted ?? 0 },
    { value: "modified",   label: "Modified",   count: () => diff?.modified ?? 0 },
  ];

  // reset to page 1 when filter changes
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

  // ── insight ────────────────────────────────────────────────────────────────
  const InsightCard = () => {
    if (!diff) return null;
    const delta    = diff.total_v2 - diff.total_v1;
    const pct      = diff.total_v1 > 0 ? Math.abs(Math.round((delta / diff.total_v1) * 100)) : 0;
    const dominant =
      diff.added >= diff.subtracted && diff.added >= diff.modified ? "additions"
      : diff.subtracted >= diff.modified ? "subtractions"
      : "modifications";
    const affected = diff.total_v1 > 0
      ? Math.round(((diff.added + diff.subtracted + diff.modified) / diff.total_v1) * 100)
      : 0;
    const summary  = delta === 0
      ? `v${vB} has the same entity count as v${vA}. ${diff.modified} record${diff.modified !== 1 ? "s" : ""} were modified.`
      : `v${vB} is ${pct}% ${delta > 0 ? "larger" : "smaller"} than v${vA}, driven by ${dominant}. ${affected}% of v${vA}'s records were affected.`;

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
              <p className="text-[11px] text-muted-foreground">entity delta</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{affected}%</p>
              <p className="text-[11px] text-muted-foreground">records affected</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground capitalize">{dominant}</p>
              <p className="text-[11px] text-muted-foreground">top change</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            v{vA} <span className="text-foreground font-medium">{diff.total_v1}</span> entities
            {" → "}
            v{vB} <span className="text-foreground font-medium">{diff.total_v2}</span> entities
            {" · "}
            <span className={delta >= 0 ? "text-emerald-400" : "text-red-400"}>
              {delta >= 0 ? "+" : ""}{delta}
            </span>
          </p>
        </CardContent>
      </Card>
    );
  };

  // ── active version number ──────────────────────────────────────────────────
  const activeVersionNumber = versions.find((v) => v.is_active)?.version_number ?? versions[versions.length - 1]?.version_number ?? 1;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-6">

      {/* back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Back to Dataset
      </button>

      {/* title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-mono mb-1">
          Version Diff
        </h1>
        <p className="text-sm text-muted-foreground">Compare two versions and inspect what changed.</p>
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
            { label: "Modified",   count: diff.modified,   color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={cn("rounded-md border p-4 text-center", bg)}>
              <p className={cn("text-2xl font-bold tracking-tight", color)}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* insight */}
      {diff && !diffLoading && <InsightCard />}

      {/* ── diff section ── */}
      {diff && !diffLoading && (
        <>
          {/* filters + view toggle */}
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

          {/* pagination top */}
          {filteredRecords.length > pageSize && (
            <Pagination
              page={page} totalPages={totalPages} pageSize={pageSize}
              total={filteredRecords.length}
              onPage={setPage}
              onPageSize={(s) => { setPageSize(s); setPage(1); }}
            />
          )}

          {/* records */}
          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
              No records match this filter.
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

          {/* pagination bottom */}
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

      {/* ── full dataset viewer ── */}
      {!diffLoading && versions.length > 0 && (
        <>
          <div className="border-t border-border/40 pt-6">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <DatasetViewer versions={versions} activeVersion={activeVersionNumber}
                 datasetId={datasetId}/>
              </CardContent>
            </Card>
          </div>
        </>
      )}

    </div>
  );
}
