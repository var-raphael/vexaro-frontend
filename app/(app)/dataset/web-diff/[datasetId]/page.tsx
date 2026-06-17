"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, GitBranch, ChevronDown, Loader2,
  AlertCircle, Plus, Minus, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronUp, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DatasetVersion {
  version_number: number;
  created_at: string;
  is_active: boolean;
}

type ChangeType = "added" | "subtracted" | "modified";
type Filter = "all" | ChangeType;

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
  records: DiffRecord[] | null;
}

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
  if (typeof val === "boolean") return val ? "yes" : "no";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return val || "—";
  if (Array.isArray(val)) {
    return val.map((item) => renderValue(item)).join(", ");
  }
  if (typeof val === "object") {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${renderValue(v)}`)
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

// ── Diff Record Row ───────────────────────────────────────────────────────────

function DiffRow({ record, vA, vB }: { record: DiffRecord; vA: number; vB: number }) {
  const [open, setOpen] = useState(false);

  const isAdded      = record.change_type === "added";
  const isSubtracted = record.change_type === "subtracted";
  const isModified   = record.change_type === "modified";

  const borderColor = isAdded ? "border-l-emerald-500" : isSubtracted ? "border-l-red-500" : "border-l-yellow-500";
  const labelColor  = isAdded ? "text-emerald-400" : isSubtracted ? "text-red-400" : "text-yellow-400";
  const labelBg     = isAdded ? "bg-emerald-500/10" : isSubtracted ? "bg-red-500/10" : "bg-yellow-500/10";
  const Icon        = isAdded ? Plus : isSubtracted ? Minus : RefreshCw;
  const label       = isAdded ? "Added" : isSubtracted ? "Removed" : "Modified";

  const entity = record.v2 ?? record.v1 ?? {};
  const fields = isModified
    ? (record.field_diffs ?? [])
    : Object.keys(entity).filter((k) => k !== "_source").map((k) => ({
        field: k,
        v1: record.v1?.[k],
        v2: record.v2?.[k],
      }));

  return (
    <div className={cn("border border-border/40 border-l-2 rounded-md overflow-hidden bg-card", borderColor)}>
      {/* Row header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors text-left"
      >
        <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0", labelColor, labelBg)}>
          <Icon size={9} /> {label}
        </span>
        <span className="text-xs text-muted-foreground font-mono truncate flex-1" title={record.source}>
          {shortSource(record.source)}
        </span>
        {isModified && !open && (record.field_diffs ?? []).length > 0 && (
          <div className="hidden sm:flex gap-1 shrink-0">
            {(record.field_diffs ?? []).slice(0, 3).map((fd) => (
              <span key={fd.field} className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/70 px-1.5 py-0.5 rounded font-mono">
                {fd.field}
              </span>
            ))}
            {(record.field_diffs ?? []).length > 3 && (
              <span className="text-[9px] text-muted-foreground/40">+{(record.field_diffs ?? []).length - 3}</span>
            )}
          </div>
        )}
        {open
          ? <ChevronUp size={12} className="text-muted-foreground/40 shrink-0" />
          : <ChevronDown size={12} className="text-muted-foreground/40 shrink-0" />
        }
      </button>

      {/* Expanded diff lines */}
      {open && (
        <div className="border-t border-border/30 divide-y divide-border/20">
          {isModified ? (
  (record.field_diffs ?? []).map((fd) => (
    <div key={fd.field} className="flex flex-col gap-1 px-4 py-2.5 text-xs font-mono">
      <span className="text-muted-foreground/50">{fd.field}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-red-400/80 line-through decoration-red-500/30 break-all" title={renderValue(fd.v1)}>
          {renderValue(fd.v1)}
        </span>
        <span className="text-muted-foreground/30 shrink-0">→</span>
        <span className="text-emerald-400/90 break-all" title={renderValue(fd.v2)}>
          {renderValue(fd.v2)}
        </span>
      </div>
    </div>
  ))
) : (
  (fields as { field: string; v1: unknown; v2: unknown }[]).map(({ field, v1, v2 }) => (
    <div key={field} className="flex flex-col gap-1 px-4 py-2.5 text-xs font-mono">
      <span className="text-muted-foreground/50">{field}</span>
      <span className={cn("break-all", isAdded ? "text-emerald-400/90" : "text-red-400/80")} title={renderValue(isAdded ? v2 : v1)}>
        {renderValue(isAdded ? v2 : v1)}
      </span>
    </div>
  ))
)}
        </div>
      )}
    </div>
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
    <div className="flex items-center justify-between flex-wrap gap-3 py-2">
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
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={cn(
                  "w-7 h-7 rounded text-xs transition-colors",
                  p === page ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {p}
              </button>
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

// ── Version Picker ────────────────────────────────────────────────────────────

function VersionPicker({
  label, versions, selected, onChange, disabledVersion,
}: {
  label: string; versions: DatasetVersion[]; selected: number;
  onChange: (v: number) => void; disabledVersion?: number;
}) {
  const current = versions.find((v) => v.version_number === selected);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs border-border gap-2 h-9 w-36 justify-between">
            <div className="flex items-center gap-1.5">
              <GitBranch size={11} />
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
              <GitBranch size={11} /> v{v.version_number}
              {v.is_active && <span className="ml-auto text-emerald-400">active</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {current && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar size={10} /> {formatDate(current.created_at)}
        </span>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiffPage() {
  const params    = useParams();
  const router    = useRouter();
  const datasetId = params?.datasetId as string;

  const [datasetName, setDatasetName]   = useState<string>("");
  const [versions, setVersions]         = useState<DatasetVersion[]>([]);
  const [vA, setVA]                     = useState<number>(1);
  const [vB, setVB]                     = useState<number>(2);
  const [diff, setDiff]                 = useState<DiffResult | null>(null);
  const [loading, setLoading]           = useState(true);
  const [diffLoading, setDiffLoading]   = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [filter, setFilter]             = useState<Filter>("all");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(25);

  // ── fetch versions ─────────────────────────────────────────────────────────
  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dataset/view?dataset_id=${datasetId}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();

      // alias takes priority over data_name
      setDatasetName(data.name ?? `Dataset ${datasetId}`);

      const vers: DatasetVersion[] = (data.versions ?? []).map((v: {
        version_number: number; created_at: string; is_active: boolean;
      }) => ({
        version_number: v.version_number,
        created_at: v.created_at,
        is_active: v.is_active,
      }));

      const activeNum = data.active_version ?? vers[vers.length - 1]?.version_number ?? 1;
      const versWithActive = vers.map((v) => ({ ...v, is_active: v.version_number === activeNum }));
      setVersions(versWithActive);

      if (vers.length >= 2) {
        const activeIdx = vers.findIndex((v) => v.version_number === activeNum);
        const prevNum   = activeIdx > 0 ? vers[activeIdx - 1].version_number : vers[0].version_number;
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
  useEffect(() => { setPage(1); }, [filter]);

  // ── derived ────────────────────────────────────────────────────────────────
  const filteredRecords = useMemo(() =>
  diff?.records
    ? filter === "all" ? diff.records : diff.records.filter((r) => r.change_type === filter)
    : [],
  [diff, filter]
);

  const totalPages  = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pageRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

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
  const delta     = diff ? diff.total_v2 - diff.total_v1 : 0;
  const pct       = diff && diff.total_v1 > 0 ? Math.abs(Math.round((delta / diff.total_v1) * 100)) : 0;
  const affected  = diff && diff.total_v1 > 0
    ? Math.round(((diff.added + diff.subtracted + diff.modified) / diff.total_v1) * 100)
    : 0;
  const dominant  = diff
    ? diff.added >= diff.subtracted && diff.added >= diff.modified ? "additions"
      : diff.subtracted >= diff.modified ? "subtractions"
      : "modifications"
    : "—";

  const FILTERS: { value: Filter; label: string; count: number }[] = [
  { value: "all",        label: "All",      count: diff?.records?.length ?? 0 },
  { value: "added",      label: "Added",    count: diff?.added ?? 0 },
  { value: "subtracted", label: "Removed",  count: diff?.subtracted ?? 0 },
  { value: "modified",   label: "Modified", count: diff?.modified ?? 0 },
];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 space-y-6">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* Title */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {datasetName || `Dataset ${datasetId}`}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-accent font-mono">
            version diff
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Compare two versions and inspect what changed.</p>
      </div>

      {/* Version picker */}
      <div className="flex items-end gap-6 flex-wrap p-4 rounded-md border border-border bg-card">
        <VersionPicker label="Base (from)" versions={versions} selected={vA} onChange={setVA} disabledVersion={vB} />
        <div className="flex items-center pb-3 text-muted-foreground/30 text-lg select-none">→</div>
        <VersionPicker label="Compare (to)" versions={versions} selected={vB} onChange={setVB} disabledVersion={vA} />
      </div>

      {/* Insight card — anchored, not floating */}
      {diff && !diffLoading && (
        <div className="rounded-md border border-border bg-card p-5 space-y-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Summary</p>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-xl font-bold text-emerald-400">{diff.added}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Added</p>
            </div>
            <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 text-center">
              <p className="text-xl font-bold text-red-400">{diff.subtracted}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Removed</p>
            </div>
            <div className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
              <p className="text-xl font-bold text-yellow-400">{diff.modified}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Modified</p>
            </div>
          </div>

          {/* Insight text */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            v{vB} is{" "}
            <span className={cn("font-medium", delta >= 0 ? "text-emerald-400" : "text-red-400")}>
              {delta >= 0 ? "+" : ""}{pct}%
            </span>{" "}
            {delta >= 0 ? "larger" : "smaller"} than v{vA}, driven by{" "}
            <span className="text-foreground font-medium">{dominant}</span>.{" "}
            <span className="text-foreground font-medium">{affected}%</span> of v{vA}&apos;s records were affected.
          </p>

          {/* Entity count line */}
          <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
            v{vA}{" "}
            <span className="text-foreground font-medium font-mono">{diff.total_v1}</span> entities
            {" → "}
            v{vB}{" "}
            <span className="text-foreground font-medium font-mono">{diff.total_v2}</span> entities
            {" · "}
            <span className={cn("font-medium font-mono", delta >= 0 ? "text-emerald-400" : "text-red-400")}>
              {delta >= 0 ? "+" : ""}{delta}
            </span>
          </p>
        </div>
      )}

      {diffLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Diff records */}
      {diff && !diffLoading && (
        <div className="space-y-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-1 w-fit">
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
                <span className="ml-1.5 text-muted-foreground/40">{f.count}</span>
              </button>
            ))}
          </div>

          {filteredRecords.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-xs text-muted-foreground">
              No records match this filter.
            </div>
          ) : (
            <>
              <Pagination
                page={page} totalPages={totalPages} pageSize={pageSize}
                total={filteredRecords.length}
                onPage={setPage}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
              />
              <div className="space-y-2">
                {pageRecords.map((record) => (
                  <DiffRow key={record.id} record={record} vA={vA} vB={vB} />
                ))}
              </div>
              <Pagination
                page={page} totalPages={totalPages} pageSize={pageSize}
                total={filteredRecords.length}
                onPage={setPage}
                onPageSize={(s) => { setPageSize(s); setPage(1); }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}