"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Save,
  ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, GitFork,
  Trash2, ChevronsLeft, ChevronsRight, Loader2,
  Upload, FileJson, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-json";
import "prismjs/themes/prism-tomorrow.css";
import { callBackend } from "@/lib/api";

interface Entity {
  [key: string]: unknown;
}

interface WebDataset {
  dataset_id: number;
  data_name: string;
  total: number;
  created_at: string;
  generated_at: string;
  entities: Entity[];
}

type DatasetStatus = "active" | "frozen" | "processing";

const PAGE_SIZE = 25;

function DeleteAltModal({
  datasetName,
  version,
  deleting,
  onConfirm,
  onCancel,
}: {
  datasetName: string;
  version: number;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Trash2 size={14} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Delete alternate version?</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This will permanently delete the alternate for{" "}
              <span className="text-foreground font-mono">{datasetName}</span>{" "}
              v{version} and clear any local edits. The original version will not be affected.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={deleting} className="text-xs h-8 border-border">
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={deleting} className="text-xs h-8 bg-red-500 hover:bg-red-600 text-white gap-1.5">
            {deleting
              ? <><Loader2 size={12} className="animate-spin" /> Deleting...</>
              : <><Trash2 size={12} /> Delete alternate</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UploadModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (entities: Entity[]) => void;
  onCancel: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Entity[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFile(f: File) {
    setFile(f);
    setParseError(null);
    setParsed(null);
    setParsing(true);

    if (!f.name.endsWith(".json")) {
      setParseError("Only .json files are accepted.");
      setParsing(false);
      return;
    }

    try {
      const text = await f.text();
      const data = JSON.parse(text);

      const entities = Array.isArray(data) 
  ? data 
  : Array.isArray(data?.entities) 
  ? data.entities 
  : [data];
  
      if (entities.length === 0) {
        setParseError("'entities' array is empty — must contain at least one entity.");
        setParsing(false);
        return;
      }
      if (!entities.every((item: unknown) => typeof item === "object" && item !== null && !Array.isArray(item))) {
        setParseError("Every item in 'entities' must be a JSON object.");
        setParsing(false);
        return;
      }

      setParsed(entities as Entity[]);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON.");
    } finally {
      setParsing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  function clearFile() {
    setFile(null);
    setParsed(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Upload size={14} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Upload alternate JSON</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Upload a Vexaro result file. The <span className="font-mono text-foreground">entities</span> array
                will fully replace the current alternate.
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={cn(
            "relative rounded-md border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 py-8 px-4",
            dragOver
              ? "border-primary/60 bg-primary/5"
              : file
              ? "border-border bg-accent/30 cursor-default"
              : "border-border hover:border-primary/40 cursor-pointer"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileInput}
          />

          {parsing ? (
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          ) : file ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <FileJson size={16} className="text-primary shrink-0" />
                <span className="text-xs text-foreground font-mono truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={20} className="text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground text-center">
                Drop a <span className="text-foreground font-mono">.json</span> result file here or click to browse
              </p>
            </>
          )}
        </div>

        {/* Parse result */}
        {parsed && !parseError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400">
              {parsed.length.toLocaleString()} entities ready to upload
            </p>
          </div>
        )}

        {parseError && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-red-950/60 border border-red-500/30">
            <AlertCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400 font-mono break-all">{parseError}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-8 border-border">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => parsed && onConfirm(parsed)}
            disabled={!parsed || !!parseError}
            className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 disabled:opacity-50"
          >
            <Upload size={12} /> Upload & Replace
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 5) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    if (page <= 2) {
      pages.push(1, 2, 3, "ellipsis", totalPages - 1);
    } else if (page >= totalPages - 3) {
      pages.push("ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      pages.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages - 1);
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => onChange(0)}
            disabled={page === 0}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft size={12} />
          </button>
          <button
            onClick={() => onChange(page - 1)}
            disabled={page === 0}
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
                onClick={() => onChange(p)}
                className={cn(
                  "w-7 h-7 text-xs rounded border transition-colors",
                  p === page
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {p + 1}
              </button>
            )
          )}

          <button
            onClick={() => onChange(page + 1)}
            disabled={page === totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={12} />
          </button>
          <button
            onClick={() => onChange(totalPages - 1)}
            disabled={page === totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WebAlternatePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const datasetId = params?.id as string;
  const version = Number(searchParams.get("version") ?? "1");

  const [dataset, setDataset] = useState<WebDataset | null>(null);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [page, setPage] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [status, setStatus] = useState<DatasetStatus | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const storageKey = `alternate-web-${datasetId}-v${version}`;
  const totalPages = Math.ceil(allEntities.length / PAGE_SIZE);
  const isLocked = status === "processing" || status === "frozen";

  const lockReason =
    status === "frozen"
      ? "Dataset is frozen — unfreeze it from the dashboard to save."
      : status === "processing"
      ? "Dataset is currently processing — please wait until it completes."
      : null;

  // Fetch status first — the load effect below needs to know this before
  // deciding whether it's safe to auto-create an alt on a 404.
  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await callBackend(`/dataset/view?dataset_id=${datasetId}`);
        if (res.ok) {
          const data = await res.json();
          setStatus(data.status ?? null);
        }
      } catch (e) {
        console.error("Network error loading dataset status:", e);
      } finally {
        setStatusLoaded(true);
      }
    }
    loadStatus();
  }, [datasetId]);

  useEffect(() => {
    if (!statusLoaded) return; // wait for status before deciding the 404 path

    async function load() {
      try {
        const res = await callBackend(
          `/dataset/alternate/result?dataset_id=${datasetId}&version_id=${version}&page=1&limit=99999`
        );

        if (res.status === 404) {
          // No alt exists yet — would normally create one from the original,
          // but that write hits the same processing/frozen gate on the backend.
          if (isLocked) {
            setLockedNotice(
              status === "frozen"
                ? "No alternate exists yet, and this dataset is frozen — unfreeze it from the dashboard before an alternate can be created."
                : "No alternate exists yet, and this dataset is currently processing — please wait until it completes."
            );
            return;
          }

          const originalRes = await callBackend(
            `/dataset/result?dataset_id=${datasetId}&version_id=${version}&page=1&limit=99999`
          );
          if (!originalRes.ok) return;
          const originalData = await originalRes.json();
          const originalEntities = originalData.entities ?? [];

          await callBackend(`/dataset/alternate/save`, {
            method: "POST",
            body: JSON.stringify({
              dataset_id: Number(datasetId),
              version,
              entities: originalEntities,
            }),
          });
          setDataset({
            dataset_id: Number(datasetId),
            data_name: `Dataset ${datasetId}`,
            total: originalEntities.length,
            created_at: new Date().toISOString(),
            generated_at: new Date().toISOString(),
            entities: originalEntities,
          });

          localStorage.removeItem(storageKey);
          setAllEntities(originalEntities);
          setPage(0);
          setTextValue(JSON.stringify(originalEntities.slice(0, PAGE_SIZE), null, 2));
          setParseError(null);
          setIsDirty(false);
          return;
        }

        if (!res.ok) {
          console.error("Failed to load dataset:", await res.text());
          return;
        }

        const data = await res.json();
        const fetchedEntities: Entity[] = data.entities ?? [];

        setDataset({
          dataset_id: Number(datasetId),
          data_name: data.data_name ?? `Dataset ${datasetId}`,
          total: data.total ?? fetchedEntities.length,
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          entities: fetchedEntities,
        });

        localStorage.removeItem(storageKey);
        setAllEntities(fetchedEntities);
        setPage(0);
        setTextValue(JSON.stringify(fetchedEntities.slice(0, PAGE_SIZE), null, 2));
        setParseError(null);
        setIsDirty(false);
      } catch (e) {
        console.error("Network error loading dataset:", e);
      }
    }
    load();
  }, [datasetId, storageKey, version, statusLoaded, isLocked, status]);

  useEffect(() => {
    const slice = allEntities.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    setTextValue(JSON.stringify(slice, null, 2));
    setParseError(null);
  }, [page, allEntities]);

  function handleTextChange(val: string) {
    setTextValue(val);
    setParseError(null);
    setSaveError(null);
    try {
      const parsed: Entity[] = JSON.parse(val);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array of entities");
      const updated = [...allEntities];
      const start = page * PAGE_SIZE;
      updated.splice(start, PAGE_SIZE, ...parsed);
      setAllEntities(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setIsDirty(true);
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  function handleUploadConfirm(entities: Entity[]) {
    if (isLocked) {
      // Defensive — the button that opens this modal is disabled while
      // locked, but guard here too in case status changed mid-session.
      setShowUploadModal(false);
      return;
    }
    setShowUploadModal(false);
    localStorage.removeItem(storageKey);
    setAllEntities(entities);
    setPage(0);
    setTextValue(JSON.stringify(entities.slice(0, PAGE_SIZE), null, 2));
    setParseError(null);
    setIsDirty(true);
    setSaveError(null);
  }

  async function handleDeleteAlternate() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await callBackend(`/dataset/alternate/delete`, {
        method: "DELETE",
        body: JSON.stringify({
          dataset_id: Number(datasetId),
          version,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setDeleteError(text || "Delete failed");
        setDeleting(false);
        setShowDeleteModal(false);
        return;
      }
      localStorage.removeItem(storageKey);
      router.push(`/dataset/web-view/${datasetId}`);
    } catch {
      setDeleteError("Network error — could not reach server");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleSave() {
    if (parseError || isLocked) return;
    setSaveError(null);
    try {
      const res = await callBackend(`/dataset/alternate/save`, {
        method: "POST",
        body: JSON.stringify({
          dataset_id: Number(datasetId),
          version,
          entities: allEntities,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        setSaveError(text || "Save failed");
        return;
      }
      localStorage.removeItem(storageKey);
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      if (e instanceof Error && e.message === "Not authenticated") {
        setSaveError("Please log in to save changes.");
      } else {
        setSaveError("Network error — could not reach server");
      }
    }
  }

  if (lockedNotice) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center space-y-4">
        <AlertCircle size={28} className="text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">{lockedNotice}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">
          Back
        </Button>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pageStart = page * PAGE_SIZE + 1;
  const pageEnd = Math.min((page + 1) * PAGE_SIZE, allEntities.length);

  return (
    <>
      {showDeleteModal && (
        <DeleteAltModal
          datasetName={dataset.data_name}
          version={version}
          deleting={deleting}
          onConfirm={handleDeleteAlternate}
          onCancel={() => !deleting && setShowDeleteModal(false)}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onConfirm={handleUploadConfirm}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft size={13} /> Back
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {dataset.data_name}
                </h1>
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border text-primary bg-primary/10 border-primary/20">
                  <GitFork size={10} /> alternate
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-border text-muted-foreground bg-accent">
                  Version {version}{" "}
                  <span className="text-primary">(alternate-v{version})</span>
                </span>
                {isDirty && !parseError && (
                  <span className="text-xs text-yellow-400 font-mono border border-yellow-500/20 px-2 py-0.5 rounded-full bg-yellow-500/5">
                    unsaved changes
                  </span>
                )}
                {parseError && (
                  <span className="flex items-center gap-1 text-xs text-red-400 font-mono border border-red-500/20 px-2 py-0.5 rounded-full bg-red-500/5">
                    <AlertCircle size={10} /> invalid json
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {allEntities.length} entities total · showing {pageStart}–{pageEnd}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                  disabled={isLocked}
                  className="text-xs h-8 gap-1.5 border-border hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  <Upload size={12} /> Upload JSON
                </Button>
                {isLocked && lockReason && (
                  <span className="text-xs text-muted-foreground max-w-[200px] leading-snug">
                    {lockReason}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="text-xs h-8 gap-1.5 border-border hover:border-red-500/40 hover:text-red-400"
              >
                <Trash2 size={12} /> Delete alternate
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!!parseError || isLocked}
                  className="text-xs h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  {saved
                    ? <><CheckCircle2 size={12} /> Saved</>
                    : <><Save size={12} /> Save</>}
                </Button>
                {isLocked && lockReason && (
                  <span className="text-xs text-muted-foreground max-w-[220px] leading-snug">
                    {lockReason}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {deleteError && (
          <div className="flex items-start gap-1.5 bg-red-950/60 border border-red-500/30 rounded px-3 py-2">
            <AlertCircle size={11} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 font-mono break-all">{deleteError}</p>
          </div>
        )}


        <div
          className={cn(
            "rounded-md border overflow-auto",
            parseError ? "border-red-500/50" : "border-border"
          )}
          style={{ maxHeight: "70vh", backgroundColor: "#0d1117" }}
        >
          <Editor
            value={textValue}
            onValueChange={isLocked ? () => {} : handleTextChange}
            highlight={(code) => highlight(code, languages.json, "json")}
            padding={16}
            disabled={isLocked}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 12,
              lineHeight: 1.6,
              backgroundColor: "transparent",
              minHeight: "70vh",
              caretColor: "#fff",
              opacity: isLocked ? 0.6 : 1,
            }}
            textareaClassName="focus:outline-none"
          />
        </div>
        {isLocked && lockReason && (
          <p className="text-xs text-muted-foreground -mt-2">{lockReason}</p>
        )}

        {parseError && (
          <div className="flex items-start gap-1.5 bg-red-950/60 border border-red-500/30 rounded px-3 py-2">
            <AlertCircle size={11} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 font-mono break-all">{parseError}</p>
          </div>
        )}

        {saveError && (
          <div className="flex items-start gap-1.5 bg-red-950/60 border border-red-500/30 rounded px-3 py-2">
            <AlertCircle size={11} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 font-mono break-all">{saveError}</p>
          </div>
        )}

        <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </>
  );
}