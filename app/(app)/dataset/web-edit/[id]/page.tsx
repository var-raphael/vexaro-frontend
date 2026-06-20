"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Globe,
  Lock,
  Moon,
  Tag,
  AlertCircle,
  Save,
  Loader2,
  Crown,
  DollarSign,
  Link,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { callBackend } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";

interface SchemaField {
  id: number;
  type: string;
  description: string;
  dataType: "string" | "number" | "boolean" | "array" | "url";
}

interface ExistingURL {
  dataset_url_id: number;
  url: string;
  source_type: string;
  queue_status: string;
  folder_path?: string | null;
  markedForDeletion: boolean;
}

interface EditForm {
  description: string;
  extractDescription: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
  schema: SchemaField[];
  newUrls: string;
  is_premium: boolean;
  price: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase flex items-center gap-1 mb-1.5">
      {children}
      {required && <span className="text-primary text-[10px]">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-destructive mt-1">
      <AlertCircle size={10} /> {msg}
    </p>
  );
}

function CharCount({
  current,
  min,
  max,
}: {
  current: number;
  min: number;
  max: number;
}) {
  const tooShort = current > 0 && current < min;
  const tooLong = current > max;
  const color = tooLong
    ? "text-destructive"
    : tooShort
    ? "text-yellow-400"
    : "text-muted-foreground";

  return (
    <p className={cn("text-[11px] mt-1 text-right tabular-nums", color)}>
      {current}/{max}
      {tooShort && ` — ${min - current} more needed`}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditDatasetPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const datasetId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [datasetName, setDatasetName] = useState<string>("");

  const [existingURLs, setExistingURLs] = useState<ExistingURL[]>([]);

  const [form, setForm] = useState<EditForm>({
    description: "",
    extractDescription: "",
    tag: "",
    visibility: "public",
    nightly: "yes",
    schema: [{ id: Date.now(), type: "", description: "", dataType: "string" }],
    newUrls: "",
    is_premium: false,
    price: 9,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const EXTRACT_MIN = 20;
  const EXTRACT_MAX = 500;

  // ── Fetch existing dataset ────────────────────────────────────────────────

  useEffect(() => {
    if (!datasetId) return;
    const fetchDataset = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dataset/view?dataset_id=${datasetId}`
        );
        if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
        const data = await res.json();

        setDatasetName(data.name ?? "");

        // Map existing URLs with markedForDeletion = false
        const mappedURLs: ExistingURL[] = (data.urls ?? []).map((u: any) => ({
          dataset_url_id: u.dataset_url_id,
          url: u.url,
          source_type: u.source_type,
          queue_status: u.queue_status,
          folder_path: u.folder_path ?? null,
          markedForDeletion: false,
        }));
        setExistingURLs(mappedURLs);

        setForm({
          description: data.description ?? "",
          extractDescription: data.extract_intent ?? "",
          tag: data.tag ?? "",
          visibility: data.visibility ?? "public",
          nightly: data.nightly === true ? "yes" : "no",
          schema:
            data.schema && Object.keys(data.schema).length > 0
              ? Object.entries(data.schema).map(([key, val]: [string, any], i) => ({
                  id: Date.now() + i,
                  type: val.type ?? key,
                  description: val.description ?? "",
                  dataType: val.data_type ?? "string",
                }))
              : [{ id: Date.now(), type: "", description: "", dataType: "string" }],
          newUrls: "",
          is_premium: data.is_premium ?? false,
          price: data.price ?? 9,
        });
      } catch (err: any) {
        setFetchError(err.message ?? "Could not load dataset.");
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
  }, [datasetId]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setPremium = (val: boolean) => {
    setForm((p) => ({
      ...p,
      is_premium: val,
      visibility: val ? "public" : p.visibility,
    }));
  };

  const addField = () =>
    setForm((p) => ({
      ...p,
      schema: [...p.schema, { id: Date.now(), type: "", description: "", dataType: "string" }],
    }));

  const removeField = (id: number) =>
    setForm((p) => ({
      ...p,
      schema: p.schema.length > 1 ? p.schema.filter((f) => f.id !== id) : p.schema,
    }));

  const updateField = (
    id: number,
    key: keyof Omit<SchemaField, "id">,
    val: string
  ) =>
    setForm((p) => ({
      ...p,
      schema: p.schema.map((f) => (f.id === id ? { ...f, [key]: val } : f)),
    }));

  const toggleURLDeletion = (dataset_url_id: number) => {
    setExistingURLs((prev) =>
      prev.map((u) =>
        u.dataset_url_id === dataset_url_id
          ? { ...u, markedForDeletion: !u.markedForDeletion }
          : u
      )
    );
  };

  const markedCount = existingURLs.filter((u) => u.markedForDeletion).length;
  const activeCount = existingURLs.length - markedCount;

  // ── Validate ───────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = "Description is required";

    const extractLen = form.extractDescription.trim().length;
    if (extractLen === 0) {
      e.extractDescription = "Extract description is required";
    } else if (extractLen < EXTRACT_MIN) {
      e.extractDescription = `Must be at least ${EXTRACT_MIN} characters (${extractLen}/${EXTRACT_MIN})`;
    } else if (extractLen > EXTRACT_MAX) {
      e.extractDescription = `Must be at most ${EXTRACT_MAX} characters (${extractLen}/${EXTRACT_MAX})`;
    }

    if (form.schema.some((f) => !f.type.trim() || !f.description.trim()))
      e.schema = "All schema fields must have a type and description";
    if (form.is_premium && form.price < 1)
      e.price = "Price must be at least $1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const urlsToDelete = existingURLs
      .filter((u) => u.markedForDeletion)
      .map((u) => u.dataset_url_id);

    const hasUrlField = form.schema.some((f) => f.dataType === "url");

    try {
      const res = await callBackend(`/dataset/edit`, {
  method: "PATCH",
  body: JSON.stringify({
    dataset_id: Number(datasetId),
    description: form.description,
    extract_description: form.extractDescription,
    tag: form.tag,
    visibility: form.visibility,
    nightly: form.nightly,
    schema: form.schema.map(({ type, description, dataType }) => ({
      type,
      description,
      data_type: dataType,
    })),
    urls: form.newUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean),
    urls_to_delete: urlsToDelete,
    is_premium: form.is_premium,
    price: form.is_premium ? form.price : 0,
    include_links: hasUrlField,
  }),
});
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      router.push(`/dashboard`);
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={22} className="animate-spin text-primary" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            Loading dataset...
          </p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          <AlertCircle size={13} /> {fetchError}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-1">
          Vexaro
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Edit <span className="text-primary">{datasetName || "Dataset"}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your dataset configuration and extraction schema.
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          <AlertCircle size={13} /> {submitError}
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">

          {/* Description */}
          <div>
            <Label required>Dataset Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this dataset contain? How is it useful?"
              rows={3}
              className={cn(
                "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-primary/40 focus-visible:border-primary/50",
                errors.description && "border-destructive focus-visible:border-destructive"
              )}
            />
            <FieldError msg={errors.description} />
          </div>

          {/* Extract Description */}
          <div>
            <Label required>Extract Description</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Describe what to extract from each page. Be specific about the data fields and context.
            </p>
            <Textarea
              value={form.extractDescription}
              onChange={(e) => set("extractDescription", e.target.value)}
              placeholder="e.g. Extract the job title, company name, location, salary range, and required skills from each job posting page."
              rows={4}
              className={cn(
                "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-primary/40 focus-visible:border-primary/50",
                errors.extractDescription && "border-destructive focus-visible:border-destructive"
              )}
            />
            <CharCount
              current={form.extractDescription.trim().length}
              min={EXTRACT_MIN}
              max={EXTRACT_MAX}
            />
            <FieldError msg={errors.extractDescription} />
          </div>

          {/* Tag */}
          <div>
            <Label>Dataset Tag</Label>
            <div className="relative">
              <Tag
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="e.g. finance, crypto, social"
                className="pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-primary/40 focus-visible:border-primary/50"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Optional. Helps with discovery.
            </p>
          </div>

          {/* Premium toggle — admin only */}
          {user?.is_admin && (
            <div className={cn(
              "rounded-lg border p-4 space-y-4 transition-colors",
              form.is_premium
                ? "border-yellow-500/30 bg-yellow-500/5"
                : "border-border bg-accent/10"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={14} className={form.is_premium ? "text-yellow-400" : "text-muted-foreground"} />
                  <div>
                    <p className={cn(
                      "text-xs font-semibold",
                      form.is_premium ? "text-yellow-400" : "text-foreground"
                    )}>
                      Premium Dataset
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Charge users a one-time fee to access and clone this dataset.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-0.5">
                  <button
                    onClick={() => setPremium(false)}
                    className={cn(
                      "px-3 py-1 text-xs rounded transition-colors",
                      !form.is_premium
                        ? "bg-background border border-border text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Off
                  </button>
                  <button
                    onClick={() => setPremium(true)}
                    className={cn(
                      "px-3 py-1 text-xs rounded transition-colors",
                      form.is_premium
                        ? "bg-background border border-border text-yellow-400 shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    On
                  </button>
                </div>
              </div>

              {form.is_premium && (
                <div>
                  <Label required>Price (USD)</Label>
                  <div className="relative max-w-[160px]">
                    <DollarSign
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={form.price}
                      onChange={(e) => set("price", Number(e.target.value))}
                      className="pl-8 bg-background border-border text-foreground text-sm focus-visible:ring-yellow-500/40 focus-visible:border-yellow-500/50"
                    />
                  </div>
                  <FieldError msg={errors.price} />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    One-time payment. Dataset will be set to public automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Visibility */}
          <div>
            <Label required>Visibility</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "public", label: "Public", icon: Globe, desc: "Anyone can clone this dataset" },
                { val: "private", label: "Private", icon: Lock, desc: "Only you can access it" },
              ].map(({ val, label, icon: Icon, desc }) => (
                <button
                  key={val}
                  type="button"
                  disabled={form.is_premium && val === "private"}
                  onClick={() => set("visibility", val as Visibility)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                    form.visibility === val
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_12px_oklch(0.85_0.18_195_/_0.1)]"
                      : "bg-accent/20 border-border hover:border-primary/30",
                    form.is_premium && val === "private" && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                      form.visibility === val
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-accent border-border text-muted-foreground"
                    )}
                  >
                    <Icon size={13} />
                  </div>
                  <div>
                    <p className={cn(
                      "text-xs font-semibold",
                      form.visibility === val ? "text-primary" : "text-foreground"
                    )}>
                      {label}
                      {form.is_premium && val === "private" && (
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">(locked)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {form.is_premium && (
              <p className="text-[11px] text-yellow-400/70 mt-1.5 flex items-center gap-1">
                <Crown size={10} /> Premium datasets are always public.
              </p>
            )}
          </div>

          {/* Nightly Refresh */}
          <div>
            <Label required>Nightly Refresh</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Auto-refresh dataset every night at midnight UTC.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "yes", label: "Yes", desc: "Refresh every night" },
                { val: "no", label: "No", desc: "Manual refresh only" },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("nightly", val as NightlyRefresh)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                    form.nightly === val
                      ? "bg-primary/10 border-primary/50 shadow-[0_0_12px_oklch(0.85_0.18_195_/_0.1)]"
                      : "bg-accent/20 border-border hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                      form.nightly === val
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-accent border-border text-muted-foreground"
                    )}
                  >
                    <Moon size={13} />
                  </div>
                  <div>
                    <p className={cn(
                      "text-xs font-semibold",
                      form.nightly === val ? "text-primary" : "text-foreground"
                    )}>
                      {label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Schema Fields */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label required>Schema Fields</Label>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-primary/80 transition-colors border border-primary/30 hover:border-primary/60 rounded-md px-2 py-1 bg-primary/5"
              >
                <Plus size={11} /> Add Field
              </button>
            </div>
            <div className="space-y-2">
              {form.schema.map((field) => (
                <div
                  key={field.id}
                  className="group flex flex-col gap-2 p-3 rounded-lg bg-accent/20 border border-border hover:border-primary/20 transition-colors md:grid md:grid-cols-[1fr_120px_1fr_auto]"
                >
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                      Type
                    </p>
                    <Input
                      value={field.type}
                      onChange={(e) => updateField(field.id, "type", e.target.value)}
                      placeholder="e.g. title"
                      className="h-8 bg-card border-border text-foreground placeholder:text-muted-foreground font-mono text-xs focus-visible:ring-primary/40 focus-visible:border-primary/50"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                      Data Type
                    </p>
                    <select
                      value={field.dataType}
                      onChange={(e) => updateField(field.id, "dataType", e.target.value)}
                      className="h-8 w-full rounded-md border border-border bg-card text-foreground text-xs font-mono px-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    >
                      {["string", "number", "boolean", "array", "url"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                      Description
                    </p>
                    <Input
                      value={field.description}
                      onChange={(e) => updateField(field.id, "description", e.target.value)}
                      placeholder="What to extract"
                      className="h-8 bg-card border-border text-foreground placeholder:text-muted-foreground text-xs focus-visible:ring-primary/40 focus-visible:border-primary/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      disabled={form.schema.length === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <FieldError msg={errors.schema} />
          </div>

          {/* Existing URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Dataset URLs</Label>
              <div className="flex items-center gap-2">
                {markedCount > 0 && (
                  <span className="text-[11px] font-mono text-destructive border border-destructive/30 bg-destructive/10 rounded-md px-2 py-0.5">
                    {markedCount} to remove
                  </span>
                )}
                <span className="text-[11px] font-mono text-muted-foreground border border-border bg-accent/20 rounded-md px-2 py-0.5">
                  {activeCount} active
                </span>
              </div>
            </div>

            {existingURLs.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-border bg-accent/10 text-muted-foreground text-xs">
                <Link size={12} /> No URLs attached to this dataset.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {existingURLs.map((u) => (
                  <div
                    key={u.dataset_url_id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-150",
                      u.markedForDeletion
                        ? "bg-destructive/5 border-destructive/30 opacity-60"
                        : "bg-accent/20 border-border hover:border-primary/20"
                    )}
                  >
                    <Link
                      size={11}
                      className={cn(
                        "shrink-0",
                        u.markedForDeletion ? "text-destructive/60" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 font-mono truncate",
                        u.markedForDeletion
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      )}
                      title={u.url}
                    >
                      {u.url}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border",
                        u.source_type === "import"
                          ? "border-blue-500/20 text-blue-400/70 bg-blue-500/5"
                          : "border-border text-muted-foreground bg-accent/20"
                      )}
                    >
                      {u.source_type}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleURLDeletion(u.dataset_url_id)}
                      className={cn(
                        "shrink-0 h-6 w-6 flex items-center justify-center rounded border transition-colors",
                        u.markedForDeletion
                          ? "border-primary/40 text-primary hover:border-primary/70 bg-primary/5"
                          : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                      )}
                      title={u.markedForDeletion ? "Restore URL" : "Mark for removal"}
                    >
                      {u.markedForDeletion ? <RotateCcw size={11} /> : <Trash2 size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {markedCount > 0 && (
              <p className="text-[11px] text-destructive/70 mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> {markedCount} URL{markedCount > 1 ? "s" : ""} will be removed on save.
              </p>
            )}
          </div>

          {/* Add New URLs */}
          <div>
            <Label>Add New URLs</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              One URL per line. Optional.
            </p>
            <Textarea
              value={form.newUrls}
              onChange={(e) => set("newUrls", e.target.value)}
              placeholder={"https://example.com/page-1\nhttps://example.com/page-2"}
              rows={5}
              className="bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-primary/40 focus-visible:border-primary/50"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 font-mono text-xs tracking-widest uppercase border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={13} /> Save Changes
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}