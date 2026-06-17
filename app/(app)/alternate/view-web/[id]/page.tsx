"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Loader2, Database, ExternalLink,
  Table2, Code2, GitFork, Sparkles,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DataView = "table" | "json";

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
        if (/:$/.test(match)) return `<span style="color:#79b8ff">${match}</span>`;
        return `<span style="color:#9ecbff">${match}</span>`;
      }
      if (/true|false/.test(match)) return `<span style="color:#79c0ff">${match}</span>`;
      if (/null/.test(match)) return `<span style="color:#6e7681">${match}</span>`;
      return `<span style="color:#f97316">${match}</span>`;
    }
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page <= 3) {
      pages.push(2, 3, 4, "ellipsis", totalPages);
    } else if (page >= totalPages - 2) {
      pages.push("ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total.toLocaleString()} entities
      </span>
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => onChange(1)}
            disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={12} />
          </button>
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={12} />
          </button>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground/50">
                ···
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p as number)}
                className={cn(
                  "w-7 h-7 text-xs rounded border transition-colors",
                  p === page
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={12} />
          </button>
          <button
            onClick={() => onChange(totalPages)}
            disabled={page === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AltViewWebPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const datasetId = params?.id as string;
  const version = Number(searchParams.get("version") ?? "1");
  const [dataName, setDataName] = useState<string>("");
  const [entities, setEntities] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DataView>("table");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dataset/alternate/result?dataset_id=${datasetId}&version_id=${version}&page=${page}&limit=25`
        );
        if (!res.ok) return;
        const data = await res.json();
        setEntities(data.entities ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.total_pages ?? 1);
        setDataName(data.data_name ?? `Dataset ${datasetId}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [datasetId, version, page]);

  useEffect(() => {
    setPage(1);
  }, [version]);

  const tableColumns = entities.length > 0
    ? Object.keys(entities[0]).filter(
        (k) => !["body", "comments", "images", "files", "links", "_source"].includes(k)
      )
    : [];

  function formatCell(key: string, val: unknown): React.ReactNode {
    if (val === null || val === undefined)
      return <span className="text-muted-foreground/30">—</span>;
    if (typeof val === "boolean") return val ? "yes" : "no";
    if (typeof val === "object")
      return (
        <span className="text-muted-foreground/60">
          {JSON.stringify(val).slice(0, 40)}…
        </span>
      );
    const str = String(val);
    if (str.startsWith("http")) {
      return (
        <a
          href={str}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1"
        >
          {truncate(str, 30)} <ExternalLink size={9} />
        </a>
      );
    }
    return (
      <span className="truncate block" title={str}>
        {truncate(str, 60)}
      </span>
    );
  }

  const highlightedJSON =
    view === "json" && entities.length > 0
      ? highlightJSON(JSON.stringify(entities, null, 2))
      : "";

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft size={13} /> Back
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {dataName ?? ""}
            </h1>
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border text-purple-400 bg-purple-500/10 border-purple-500/20">
            <Sparkles size={10} /> alt
          </span>
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border text-primary bg-primary/10 border-primary/20">
            <GitFork size={10} /> v{version}
          </span>
          <span className="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded-full border border-border bg-accent">
            read-only
          </span>
        </div>

          {!loading && (
           <p className="text-sm text-muted-foreground mt-1">
          {total.toLocaleString()} entities · {dataName || `Dataset ${datasetId}`}
            </p>
          )}
      </div>

      {/* Content */}
      {loading ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Loading...</span>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Data Preview
              </span>
              <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-background">
                <button
                  onClick={() => setView("table")}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors",
                    view === "table"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Table2 size={11} /> Table
                </button>
                <button
                  onClick={() => setView("json")}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors",
                    view === "json"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Code2 size={11} /> JSON
                </button>
              </div>
            </div>

            {/* Data */}
            {entities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <Database size={18} className="text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">No entities found.</p>
              </div>
            ) : view === "table" ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-accent/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-8">
                        #
                      </th>
                      {tableColumns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity, i) => (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-border last:border-0 hover:bg-accent/20 transition-colors",
                          i % 2 !== 0 && "bg-accent/10"
                        )}
                      >
                        <td className="px-3 py-2 text-muted-foreground/50 font-mono">
                          {(page - 1) * 25 + i + 1}
                        </td>
                        {tableColumns.map((col) => (
                          <td
                            key={col}
                            className="px-3 py-2 text-muted-foreground max-w-[200px]"
                          >
                            {formatCell(col, entity[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="rounded-md border border-border overflow-auto bg-[#0d1117]"
                style={{ maxHeight: "500px" }}
              >
                <pre
                  className="text-[11px] font-mono leading-relaxed p-4"
                  dangerouslySetInnerHTML={{ __html: highlightedJSON }}
                />
              </div>
            )}

            {/* Single pagination at the bottom */}
            <PaginationBar
              page={page}
              totalPages={totalPages}
              total={total}
              onChange={setPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}