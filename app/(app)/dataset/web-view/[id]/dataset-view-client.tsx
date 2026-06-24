"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Download, GitCompare, Globe,
  CheckCircle2, Loader2, Clock, Calendar,
  GitBranch, ChevronDown, AlertCircle,
  Moon, Database, Layers, ExternalLink, Hash,
  ChevronRight, ChevronUp,
  LogIn, Globe2, MessageSquare,
  GitFork, Copy, Check, Pencil, Sparkles,
  Table2, Code2, ChevronLeft,
  ChevronsLeft, ChevronsRight, Info,
  FileJson, FileText, FileSpreadsheet,
  FileCode2, File, Braces,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type Status = "active" | "frozen" | "processing";
type SourceType = "serp" | "import" | "reddit";
type DataView = "table" | "json";
type QueueStatus =
  | "pending" | "crawling" | "proceed-clean" | "proceed-format"
  | "proceed-extract" | "proceed-version" | "done" | "failed";

interface SchemaField {
  type: string;
  description: string;
}

interface DatasetURL {
  dataset_url_id: number;
  url: string;
  source_type: SourceType;
  queue_status: QueueStatus;
  folder_path: string | null;
}

interface DatasetVersion {
  version_number: number;
  file_path: string;
  alt_file_path?: string | null;
  created_at: string;
  is_active: boolean;
  entity_count: number;
  file_size_bytes: number;
}

interface DatasetDetail {
  dataset_id: number;
  name: string;
  description: string;
  intent: string;
  extract_intent: string;
  tag: string;
  visibility: string;
  is_frozen: boolean;
  is_cloned: boolean;
  status: Status;
  active_version: number;
  nightly: boolean;
  created_at: string;
  last_refresh: string;
  schema: Record<string, SchemaField>;
  versions: DatasetVersion[];
  urls: DatasetURL[];
  entity_count: number;
  file_size_bytes: number;
  user_id: string;
  dataset_type: "web" | "amazon";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; class: string; dot: string }> = {
  active: {
    label: "Active",
    class: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  frozen: {
    label: "Frozen",
    class: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
  },
  processing: {
    label: "Processing",
    class: "text-primary bg-primary/10 border-primary/20",
    dot: "bg-primary animate-pulse",
  },
};

const SOURCE_ICON: Record<SourceType, React.ElementType> = {
  serp: Globe2,
  import: LogIn,
  reddit: MessageSquare,
};

const EXPORT_FORMATS = ["JSON", "JSONL", "CSV", "TSV", "XML", "Excel", "Parquet"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

const FORMAT_META: Record<ExportFormat, {
  icon: React.ElementType;
  color: string;
  ext: string;
  description: string;
}> = {
  JSON:    { icon: FileJson,        color: "text-yellow-400",  ext: "json",    description: "Standard JSON array" },
  JSONL:   { icon: Braces,          color: "text-orange-400",  ext: "jsonl",   description: "One JSON object per line" },
  CSV:     { icon: FileSpreadsheet, color: "text-emerald-400", ext: "csv",     description: "Comma-separated values" },
  TSV:     { icon: FileText,        color: "text-cyan-400",    ext: "tsv",     description: "Tab-separated values" },
  XML:     { icon: FileCode2,       color: "text-blue-400",    ext: "xml",     description: "Structured XML format" },
  Excel:   { icon: FileSpreadsheet, color: "text-green-400",   ext: "xlsx",    description: "Microsoft Excel workbook" },
  Parquet: { icon: File,            color: "text-purple-400",  ext: "parquet", description: "Columnar binary format" },
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

function parseTags(raw: string): string[] {
  if (!raw) return [];
  return raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function simplifyStatus(status: QueueStatus): { label: string; color: string } {
  if (status === "done") return { label: "done", color: "text-emerald-400" };
  if (status === "failed") return { label: "failed", color: "text-red-400" };
  return { label: "processing", color: "text-yellow-400" };
}

function truncate(str: string, n: number) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function highlightJSON(json: string): string {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#85c46c">${match}</span>`;
return `<span style="color:#ce9e6a">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span style="color:#79c0ff">${match}</span>`;
      if (/null/.test(match)) return `<span style="color:#6e7681">${match}</span>`;
      return `<span style="color:#f97316">${match}</span>`;
    }
  );
}

// ── Download Source Modal ─────────────────────────────────────────────────────

function DownloadSourceModal({
  format, versionNum, onSelect, onCancel,
}: {
  format: ExportFormat; versionNum: number;
  onSelect: (source: "original" | "alt" | "both") => void;
  onCancel: () => void;
}) {
  const meta = FORMAT_META[format];
  const Icon = meta.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Download size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Download v{versionNum}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This version has an alternate. Which would you like to download as{" "}
              <span className={cn("font-mono font-medium", meta.color)}>.{meta.ext}</span>?
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {([
            { source: "original" as const, label: "Original", desc: "The unmodified result file" },
            { source: "alt" as const, label: "Alternate", desc: "Your curated version" },
            { source: "both" as const, label: "Both as ZIP", desc: "Original + alternate in one archive" },
          ]).map(({ source, label, desc }) => (
            <button
              key={source}
              onClick={() => onSelect(source)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
            >
              <Icon size={14} className={meta.color} />
              <div>
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-8 border-border">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip_({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-1"
        tabIndex={0}
        type="button"
      >
        <Info size={11} />
      </button>
      {visible && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-56 px-3 py-2 rounded-md bg-card border border-border text-xs text-muted-foreground leading-relaxed shadow-lg pointer-events-none whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}

// ── Intent Card ───────────────────────────────────────────────────────────────

function IntentCard({ title, value, tooltip }: { title: string; value: string; tooltip: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  if (!value) return null;
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</h2>
            <Tooltip_ text={tooltip} />
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {copied
              ? <><Check size={12} className="text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Create Alternate Modal ────────────────────────────────────────────────────

function CreateAlternateModal({ version, onConfirm, onCancel }: {
  version: number; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <GitFork size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Create alternate version?</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This will create an editable copy of{" "}
              <span className="text-foreground font-mono">v{version}</span> that
              you can modify independently. The original version will not be affected.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-8 border-border">Cancel</Button>
          <Button size="sm" onClick={onConfirm} className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
            <GitFork size={12} /> Create alternate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-md bg-accent border border-border flex items-center justify-center">
            <Icon size={13} className={accent ?? "text-muted-foreground"} />
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className={cn("text-xl font-bold tracking-tight", accent ?? "text-foreground")}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

// ── Data Viewer ───────────────────────────────────────────────────────────────

function DataViewer({ entities, page, totalPages, total, onPageChange }: {
  entities: Record<string, unknown>[];
  page: number; totalPages: number; total: number;
  onPageChange: (p: number) => void;
}) {
  const [view, setView] = useState<DataView>("table");

  const tableColumns = entities.length > 0
    ? Object.keys(entities[0]).filter((k) => !["body", "comments", "images", "files", "links", "_source"].includes(k))
    : [];

  function formatCellValue(_key: string, val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "yes" : "no";
    if (typeof val === "object") return JSON.stringify(val).slice(0, 40) + "…";
    return truncate(String(val), 60);
  }

  const highlightedJSON = view === "json" ? highlightJSON(JSON.stringify(entities, null, 2)) : "";

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <SectionHeader title={`Data Preview (${total} entities)`}>
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-background">
            <button
              onClick={() => setView("table")}
              className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors",
                view === "table" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Table2 size={11} /> Table
            </button>
            <button
              onClick={() => setView("json")}
              className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors",
                view === "json" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <Code2 size={11} /> JSON
            </button>
          </div>
        </SectionHeader>

        {entities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <Database size={18} className="text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No data available for this version.</p>
          </div>
        ) : (
          <>
            {view === "table" && (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-accent/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-8 shrink-0">#</th>
                      {tableColumns.map((col) => (
                        <th key={col} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity, i) => (
                      <tr key={i} className={cn("border-b border-border last:border-0 hover:bg-accent/20 transition-colors", i % 2 !== 0 && "bg-accent/10")}>
                        <td className="px-3 py-2 text-muted-foreground/50 font-mono">{(page - 1) * 25 + i + 1}</td>
                        {tableColumns.map((col) => {
                          const val = entity[col];
                          return (
                            <td key={col} className="px-3 py-2 text-muted-foreground max-w-[200px]">
                              {col === "url" || (typeof val === "string" && val.startsWith("http")) ? (
                                <a href={String(val)} target="_blank" rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1">
                                  {truncate(String(val), 30)} <ExternalLink size={9} />
                                </a>
                              ) : (
                                <span className="truncate block" title={String(val ?? "")}>
                                  {formatCellValue(col, val)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === "json" && (
              <div className="rounded-md border border-border overflow-auto bg-[#0d1117]" style={{ maxHeight: "500px" }}>
                <pre className="text-[11px] font-mono leading-relaxed p-4" dangerouslySetInnerHTML={{ __html: highlightedJSON }} />
              </div>
            )}

            {totalPages > 1 && (
  <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
    <span className="text-xs text-muted-foreground shrink-0">
      {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total} entities
    </span>
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(1)} disabled={page === 1}
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronsLeft size={12} />
      </button>
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft size={12} />
      </button>
      {(() => {
        const pages: (number | "ellipsis")[] = [];
        if (totalPages <= 3) {
          for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
          if (page <= 2) pages.push(1, 2, 3, "ellipsis", totalPages);
          else if (page >= totalPages - 1) pages.push(1, "ellipsis", totalPages - 2, totalPages - 1, totalPages);
          else pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
        }
        // Dedupe ellipsis
        return pages
          .filter((p, i, arr) => !(p === "ellipsis" && arr[i - 1] === "ellipsis"))
          .map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="w-6 h-7 flex items-center justify-center text-xs text-muted-foreground/50">·</span>
            ) : (
              <button key={p} onClick={() => onPageChange(p as number)}
                className={cn("w-7 h-7 text-xs rounded border transition-colors",
                  p === page ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                {p}
              </button>
            )
          );
      })()}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight size={12} />
      </button>
      <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages}
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronsRight size={12} />
      </button>
    </div>
  </div>
)}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page Client ───────────────────────────────────────────────────────────────

interface DatasetViewClientProps {
  id: string;
  initialDataset: DatasetDetail | null;
}

export function DatasetViewClient({ id, initialDataset }: DatasetViewClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const datasetId = id;

  const [dataset, setDataset] = useState<DatasetDetail | null>(initialDataset);
  const [loading, setLoading] = useState(!initialDataset);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(
    initialDataset?.active_version ?? null
  );
  const [exportFormat, setExportFormat] = useState<ExportFormat>("JSON");
  const [downloading, setDownloading] = useState(false);
  const [urlsExpanded, setUrlsExpanded] = useState(false);

  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitiesPage, setEntitiesPage] = useState(1);
  const [entitiesTotalPages, setEntitiesTotalPages] = useState(1);
  const [entitiesTotal, setEntitiesTotal] = useState(0);

  const [alternateModalVersion, setAlternateModalVersion] = useState<DatasetVersion | null>(null);
  const [downloadSourceModal, setDownloadSourceModal] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  const fetchDataset = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/dataset/view?dataset_id=${datasetId}`);
      if (!res.ok) {
        setError((await res.text()) || "Failed to load dataset");
        return;
      }
      const data: DatasetDetail = await res.json();
      setDataset(data);
      setSelectedVersion(data.active_version || null);
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    if (!initialDataset) fetchDataset();
  }, [fetchDataset, initialDataset]);

  useEffect(() => {
    if (!selectedVersion) return;
    async function loadEntities() {
      setEntitiesLoading(true);
      setEntities([]);
      try {
        const res = await fetch(
          `${API}/dataset/result?dataset_id=${datasetId}&version_id=${selectedVersion}&page=${entitiesPage}&limit=25`
        );
        if (!res.ok) return;
        const data = await res.json();
        setEntities(data.entities ?? []);
        setEntitiesTotal(data.total ?? 0);
        setEntitiesTotalPages(data.total_pages ?? 1);
      } catch { /* silently fail */ }
      finally { setEntitiesLoading(false); }
    }
    loadEntities();
  }, [datasetId, selectedVersion, entitiesPage]);

  useEffect(() => { setEntitiesPage(1); }, [selectedVersion]);

  useEffect(() => {
    if (authLoading || !dataset) return;
    if (dataset.visibility !== "private") return;
    if (user === null || user.id !== dataset.user_id) router.push("/dashboard");
  }, [dataset, user, authLoading, router]);

  async function triggerDownload(source: "original" | "alt" | "both") {
    if (!dataset || !selectedVersion) return;
    setDownloading(true);
    setDownloadSourceModal(false);
    try {
      const url = `${API}/dataset/download?dataset_id=${datasetId}&version_id=${selectedVersion}&format=${exportFormat.toLowerCase()}&source=${source}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const meta = FORMAT_META[exportFormat];
      const suffix = source === "both" ? ".zip" : source === "alt" ? `-alt.${meta.ext}` : `.${meta.ext}`;
      a.download = `${dataset.name}-v${selectedVersion}${suffix}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloading(false);
    }
  }

  function handleDownloadClick() {
    if (!dataset || !selectedVersion) return;
    const selectedVersionData = dataset.versions.find((v) => v.version_number === selectedVersion);
    const hasAlt = !!selectedVersionData?.alt_file_path;
    if (hasAlt) {
      setDownloadSourceModal(true);
    } else {
      triggerDownload("original");
    }
  }

  function handleAlternateClick(e: React.MouseEvent, v: DatasetVersion) {
    e.preventDefault();
    e.stopPropagation();
    if (v.alt_file_path) {
      router.push(`/alternate/web-data/${datasetId}?version=${v.version_number}`);
    } else {
      setAlternateModalVersion(v);
    }
  }

  function handleModalConfirm() {
    if (!alternateModalVersion) return;
    router.push(`/alternate/web-data/${datasetId}?version=${alternateModalVersion.version_number}`);
    setAlternateModalVersion(null);
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={28} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error ?? "Dataset not found."}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/datasets")} className="text-xs">Back to Datasets</Button>
      </div>
    );
  }

  const isOwner = user !== null && user.id === dataset.user_id;
  const s = STATUS_CONFIG[dataset.status];
  const schemaFields = Object.entries(dataset.schema);
  const doneCount = dataset.urls.filter((u) => u.queue_status === "done").length;
  const failedCount = dataset.urls.filter((u) => u.queue_status === "failed").length;
  const processingCount = dataset.urls.length - doneCount - failedCount;

  const selectedVersionData = dataset.versions.find((v) => v.version_number === selectedVersion);
  const hasAltOnSelected = !!selectedVersionData?.alt_file_path;

  const displayEntityCount = selectedVersion === dataset.active_version
    ? dataset.entity_count
    : (selectedVersionData?.entity_count ?? 0);

  const displayFileSize = selectedVersion === dataset.active_version
    ? dataset.file_size_bytes
    : (selectedVersionData?.file_size_bytes ?? 0);

  const sortedVersions = [...dataset.versions].sort((a, b) => a.version_number - b.version_number).slice(-5);

  const chartData = sortedVersions.map((v, i) => {
    const count = v.version_number === dataset.active_version ? dataset.entity_count : v.entity_count;
    const prevCount = i === 0 ? 0
      : sortedVersions[i - 1].version_number === dataset.active_version
        ? dataset.entity_count
        : sortedVersions[i - 1].entity_count;
    return { label: `v${v.version_number}`, entities: count, change: i === 0 ? 0 : count - prevCount };
  });

  const tags = parseTags(dataset.tag);
  const currentFormatMeta = FORMAT_META[exportFormat];
  const CurrentFormatIcon = currentFormatMeta.icon;

  return (
    <>
      {alternateModalVersion && (
        <CreateAlternateModal
          version={alternateModalVersion.version_number}
          onConfirm={handleModalConfirm}
          onCancel={() => setAlternateModalVersion(null)}
        />
      )}

      {downloadSourceModal && selectedVersion && (
        <DownloadSourceModal
          format={exportFormat}
          versionNum={selectedVersion}
          onSelect={triggerDownload}
          onCancel={() => setDownloadSourceModal(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-8">

        {/* Back + Header */}
        <div>
          <button
            onClick={() => router.push("/datasets")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft size={13} /> Back to Datasets
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {dataset.name}
                </h1>
                <span className={cn("flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border", s.class)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                  {s.label}
                </span>
                {dataset.is_cloned && (
                  <span className="text-xs text-primary/60 font-mono border border-primary/20 px-2 py-0.5 rounded-full">cloned</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{dataset.description}</p>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Globe size={11} /> {dataset.visibility}
                </span>
                {dataset.nightly && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Moon size={11} /> Nightly
                  </span>
                )}
                <span className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                  dataset.dataset_type === "amazon"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-sky-400 bg-sky-500/10 border-sky-500/20"
                )}>
                  {dataset.dataset_type === "amazon" ? "Amazon" : "Web"}
                </span>
                {tags.map((tag) => (
                  <span key={tag} className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border", tagColor(tag))}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwner && (
               <Link href={`/dataset/${dataset.dataset_type === "amazon" ? "amazon-edit" : "web-edit"}/${datasetId}`}>
  <Button variant="outline" size="sm" className="text-xs border-border gap-1.5 h-8 hover:border-primary/40 hover:text-primary">
    <Pencil size={12} /> Edit
  </Button>
</Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs border-border gap-1.5 h-8">
                    <GitBranch size={12} />
                    {selectedVersion ? `v${selectedVersion}` : "—"}
                    <ChevronDown size={11} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  {dataset.versions.length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">No versions yet</DropdownMenuItem>
                  ) : (
                    dataset.versions.map((v) => (
                      <DropdownMenuItem
                        key={v.version_number}
                        onClick={() => setSelectedVersion(v.version_number)}
                        className={cn("text-xs cursor-pointer gap-2",
                          v.version_number === selectedVersion ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                      >
                        <GitBranch size={11} />
                        v{v.version_number}
                        {v.version_number === dataset.active_version && <span className="ml-auto text-emerald-400">active</span>}
                        {v.alt_file_path && (
                          <span className="text-purple-400 flex items-center gap-0.5"><Sparkles size={9} /> alt</span>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {dataset.versions.length > 1 && (
                <Link href={`/dataset/web-diff/${dataset.dataset_id}`}>
                  <Button variant="outline" size="sm" className="text-xs border-border gap-1.5 h-8 hover:border-primary/40 hover:text-primary">
                    <GitCompare size={12} /> Diff
                  </Button>
                </Link>
              )}

              {/* Download split button */}
              <div className="flex items-center">
                <Button
                  size="sm"
                  onClick={handleDownloadClick}
                  disabled={downloading || dataset.versions.length === 0}
                  className="text-xs h-8 rounded-r-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 pr-2.5"
                >
                  {downloading
                    ? <Loader2 size={12} className="animate-spin" />
                    : <CurrentFormatIcon size={12} className={currentFormatMeta.color} />}
                  {exportFormat}
                  {hasAltOnSelected && (
                    <span className="ml-1 text-[10px] text-primary-foreground/60">▾ alt</span>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="text-xs h-8 rounded-l-none border-l border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 px-2"
                    >
                      <ChevronDown size={11} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border w-52">
                    {EXPORT_FORMATS.map((fmt) => {
                      const m = FORMAT_META[fmt];
                      const FmtIcon = m.icon;
                      return (
                        <DropdownMenuItem
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={cn("text-xs cursor-pointer gap-2.5",
                            fmt === exportFormat ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                        >
                          <FmtIcon size={13} className={m.color} />
                          <span className="flex-1">{fmt}</span>
                          <span className="text-muted-foreground/40 font-mono text-[10px]">.{m.ext}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Meta cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetaCard icon={Hash} label="Entities" value={displayEntityCount.toLocaleString()} sub={selectedVersion ? `v${selectedVersion}` : undefined} accent="text-primary" />
          <MetaCard icon={Database} label="File Size" value={formatBytes(displayFileSize)} sub={selectedVersion ? `v${selectedVersion}` : "result JSON"} />
          <MetaCard icon={Calendar} label="Created" value={formatDate(dataset.created_at)} />
          <MetaCard icon={Clock} label="Last Refresh" value={timeAgo(dataset.last_refresh)} sub={formatDate(dataset.last_refresh)} />
        </div>

        {/* SERP Intent */}
        {dataset.intent && (
          <IntentCard title="SERP Intent" value={dataset.intent} tooltip="The search query used to discover URLs for this dataset." />
        )}

        {/* Extract Intent */}
        {dataset.extract_intent && (
          <IntentCard title="Extract Intent" value={dataset.extract_intent} tooltip="Instructions telling the AI what specific data to extract from each page." />
        )}

        {/* Version growth graph */}
        {sortedVersions.length >= 2 && (
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <SectionHeader title="Version Growth">
                <span className="text-xs text-muted-foreground">last {sortedVersions.length} versions</span>
              </SectionHeader>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="entities" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="change" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <ReferenceLine yAxisId="change" y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                    formatter={(value, name) => [
  value ?? 0,
  name === "entities" ? "Entities" : "Net Change",
]}
                  />
                  <Line yAxisId="entities" type="monotone" dataKey="entities" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  <Line yAxisId="change" type="monotone" dataKey="change" stroke="#34d399" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4.5, fill: "#34d399", strokeWidth: 0 }} activeDot={{ r: 6.5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-5 h-0.5 bg-primary inline-block rounded" /> Entities
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-5 h-0.5 inline-block rounded opacity-80"
                    style={{ backgroundImage: "repeating-linear-gradient(90deg, #34d399 0, #34d399 5px, transparent 5px, transparent 8px)" }} />
                  Net change
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Viewer */}
        {entitiesLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-5 flex items-center justify-center h-32 gap-2">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading data...</span>
            </CardContent>
          </Card>
        ) : (
          <DataViewer entities={entities} page={entitiesPage} totalPages={entitiesTotalPages} total={entitiesTotal} onPageChange={setEntitiesPage} />
        )}

        {/* Schema */}
      <Card className="bg-card border-border">
  <CardContent className="p-5">
    <SectionHeader title="Schema" />
    {schemaFields.length === 0 ? (
      <p className="text-xs text-muted-foreground">No schema defined.</p>
    ) : (
      <div className="border border-border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[400px]">
            <thead>
              <tr className="bg-accent/50 border-b border-border">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[30%]">Field</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-[25%]">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {schemaFields.map(([key, field], i) => (
                <tr key={key} className={cn("border-b border-border last:border-0", i % 2 !== 0 && "bg-accent/20")}>
                  <td className="px-4 py-2.5 font-mono text-foreground break-all">{key}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded break-all">{field.type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </CardContent>
</Card>

        {/* URL Sources */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionHeader title={`URL Sources (${dataset.urls.length})`}>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400">{doneCount} done</span>
                {processingCount > 0 && <span className="text-yellow-400">{processingCount} processing</span>}
                {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
                <button onClick={() => setUrlsExpanded((p) => !p)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  {urlsExpanded ? <><ChevronUp size={13} /> Collapse</> : <><ChevronRight size={13} /> Expand</>}
                </button>
              </div>
            </SectionHeader>
            {urlsExpanded && (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {dataset.urls.map((u) => {
                  const Icon = SOURCE_ICON[u.source_type];
                  const { label, color } = simplifyStatus(u.queue_status);
                  return (
                    <div key={u.dataset_url_id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-border group">
                      <Icon size={11} className="text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{u.url}</span>
                      <span className={cn("text-xs shrink-0", color)}>{label}</span>
                      <a href={u.url} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={11} className="text-muted-foreground hover:text-foreground" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Version history */}
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <SectionHeader title="Version History" />
            {dataset.versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <Layers size={18} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No versions yet — processing may still be running.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...dataset.versions].sort((a, b) => b.version_number - a.version_number).map((v) => {
                  const count = v.version_number === dataset.active_version ? dataset.entity_count : v.entity_count;
                  const hasAlt = !!v.alt_file_path;
                  return (
                    <div
                      key={v.version_number}
                      onClick={() => setSelectedVersion(v.version_number)}
                      className={cn(
                        "flex flex-col gap-2 px-3 py-2.5 rounded-md border transition-colors cursor-pointer",
                        v.version_number === selectedVersion ? "border-primary/30 bg-primary/5" : "border-border bg-background hover:border-border/80"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                          v.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-accent text-muted-foreground")}>
                          {v.version_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-foreground shrink-0">v{v.version_number}</span>
                            {v.is_active && (
                              <span className="text-xs text-emerald-400 flex items-center gap-1 shrink-0">
                                <CheckCircle2 size={10} /> active
                              </span>
                            )}
                            {hasAlt && (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0">
                                <Sparkles size={9} /> alt
                              </span>
                            )}
                            {count > 0 && (
                              <span className="text-xs text-muted-foreground shrink-0">{count.toLocaleString()} entities</span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{timeAgo(v.created_at)}</span>
                      </div>

{(hasAlt || isOwner) && (
  <div className="flex items-center gap-1.5 flex-wrap pl-9" onClick={(e) => e.stopPropagation()}>
    {hasAlt && (
      <Button
        variant="outline" size="sm"
        onClick={() => router.push(`/alternate/view-web/${datasetId}?version=${v.version_number}`)}
        className="text-xs h-7 px-2.5 gap-1 border-purple-500/30 text-purple-400 hover:border-purple-500/50 hover:text-purple-300 whitespace-nowrap"
      >
        <Sparkles size={11} /> View Alt
      </Button>
    )}
    {isOwner && (
      dataset.status === "processing" || dataset.status === "frozen" ? (
        <span className="flex items-center text-xs h-7 px-2.5 gap-1 text-muted-foreground/50 whitespace-nowrap">
          <GitFork size={11} />
          {hasAlt ? "Replace Alt" : "Create Alt"}
          <Tooltip_
            text={
              dataset.status === "frozen"
                ? "Unfreeze this dataset before creating or replacing an alternate."
                : "Dataset is currently processing — alternates can't be created until it completes."
            }
          />
        </span>
      ) : (
        <Button
          variant="outline" size="sm"
          onClick={(e) => handleAlternateClick(e, v)}
          className="text-xs h-7 px-2.5 gap-1 border-border hover:border-primary/40 hover:text-primary whitespace-nowrap"
        >
          <GitFork size={11} />
          {hasAlt ? "Replace Alt" : "Create Alt"}
        </Button>
      )
    )}
  </div>
)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  );
}