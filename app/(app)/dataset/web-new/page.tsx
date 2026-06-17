"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  ArrowRight,
  Play,
  Tag,
  AlertCircle,
  Zap,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { FaGlobe } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";

interface Step1Form {
  name: string;
  description: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
}

interface SchemaField {
  id: number;
  type: string;
  description: string;
  dataType: "string" | "number" | "boolean" | "array";
}

interface PipelinePayload extends Step1Form {
  intent: string;
  extractIntent: string;
  schema: SchemaField[];
  urls: string;
}

interface ProgressLine {
  detail: string;
  done: boolean;
}

// ── URL classification ────────────────────────────────────────────────────────

const HARD_BLOCKED = [
  "twitter.com", "x.com", "facebook.com", "instagram.com",
  "tiktok.com", "youtube.com", "youtu.be", "linkedin.com",
  "snapchat.com", "pinterest.com", "threads.net",
  "reddit.com", "old.reddit.com",
];

const SOFT_BLOCKED = [
  { domain: "amazon", label: "Amazon" },
];

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

interface URLAnalysis {
  hardBlocked: string[];
  softBlocked: { url: string; label: string }[];
  clean: string[];
}

function analyzeURLs(raw: string): URLAnalysis {
  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("http"));
  const hardBlocked: string[] = [];
  const softBlocked: { url: string; label: string }[] = [];
  const clean: string[] = [];

  for (const url of lines) {
    const domain = getDomain(url);
    if (HARD_BLOCKED.some((b) => domain === b || domain.endsWith("." + b))) {
      hardBlocked.push(url);
      continue;
    }
    const soft = SOFT_BLOCKED.find((b) =>
      b.domain === "amazon"
        ? domain === "amazon.com" || domain.includes("amazon.")
        : domain === b.domain || domain.endsWith("." + b.domain)
    );
    if (soft) {
      softBlocked.push({ url, label: soft.label });
      continue;
    }
    clean.push(url);
  }

  return { hardBlocked, softBlocked, clean };
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

// ── Progress Log ──────────────────────────────────────────────────────────────

function ProgressLog({
  lines,
  phase,
  errorMsg,
}: {
  lines: ProgressLine[];
  phase: "running" | "done" | "error";
  errorMsg: string | null;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="rounded-lg border border-border bg-accent/20 p-4 space-y-2 max-h-72 overflow-y-auto">
      {lines.map((line, i) => {
        const isLast = i === lines.length - 1;
        const spinning = isLast && phase === "running";
        return (
          <div key={i} className="flex items-start gap-2">
            {spinning ? (
              <Loader2 size={13} className="text-primary animate-spin shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
            )}
            <p className={cn(
              "text-xs font-mono leading-relaxed",
              spinning ? "text-foreground" : "text-muted-foreground"
            )}>
              {line.detail}
            </p>
          </div>
        );
      })}

      {phase === "error" && errorMsg && (
        <div className="flex items-start gap-2 pt-1">
          <XCircle size={13} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs font-mono text-destructive leading-relaxed">{errorMsg}</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ form, onChange, onNext }: {
  form: Step1Form;
  onChange: (data: Step1Form) => void;
  onNext: (data: Step1Form) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Step1Form, v: string) => onChange({ ...form, [k]: v });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Dataset name is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <Label required>Dataset Name</Label>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. crypto-prices"
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm focus-visible:ring-primary/40 focus-visible:border-primary/50",
            errors.name && "border-destructive focus-visible:border-destructive"
          )}
        />
        <FieldError msg={errors.name} />
      </div>

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

      <div>
        <Label>Dataset Tag</Label>
        <div className="relative">
          <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={form.tag}
            onChange={(e) => set("tag", e.target.value)}
            placeholder="e.g. finance, crypto, social"
            className="pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-primary/40 focus-visible:border-primary/50"
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">Optional. Helps with discovery.</p>
      </div>

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
              onClick={() => set("visibility", val)}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                form.visibility === val
                  ? "bg-primary/10 border-primary/50 shadow-[0_0_12px_oklch(0.85_0.18_195_/_0.1)]"
                  : "bg-accent/20 border-border hover:border-primary/30"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                form.visibility === val
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-accent border-border text-muted-foreground"
              )}>
                <Icon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.visibility === val ? "text-primary" : "text-foreground")}>
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label required>Nightly Refresh</Label>
        <p className="text-[11px] text-muted-foreground mb-2">Auto-refresh dataset every night at midnight UTC.</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: "yes", label: "Yes", desc: "Refresh every night" },
            { val: "no", label: "No", desc: "Manual refresh only" },
          ].map(({ val, label, desc }) => (
            <button
              key={val}
              type="button"
              onClick={() => set("nightly", val)}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                form.nightly === val
                  ? "bg-primary/10 border-primary/50 shadow-[0_0_12px_oklch(0.85_0.18_195_/_0.1)]"
                  : "bg-accent/20 border-border hover:border-primary/30"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                form.nightly === val
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-accent border-border text-muted-foreground"
              )}>
                <Moon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.nightly === val ? "text-primary" : "text-foreground")}>
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => { if (validate()) onNext(form); }}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs tracking-widest uppercase gap-2"
      >
        Next <ArrowRight size={13} />
      </Button>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

function Step2({
  meta,
  form,
  onChange,
  onRun,
  phase,
  progressLines,
  errorMsg,
}: {
  meta: Step1Form;
  form: {
    intent: string;
    extractIntent: string;
    schema: SchemaField[];
    urls: string;
  };
  onChange: (data: { intent: string; extractIntent: string; schema: SchemaField[]; urls: string }) => void;
  onRun: (data: PipelinePayload) => Promise<void>;
  phase: "idle" | "running" | "done" | "error";
  progressLines: ProgressLine[];
  errorMsg: string | null;
}) {
  const [urlAnalysis, setUrlAnalysis] = useState<URLAnalysis>({ hardBlocked: [], softBlocked: [], clean: [] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setIntent = (v: string) => onChange({ ...form, intent: v });
  const setExtractIntent = (v: string) => onChange({ ...form, extractIntent: v });
  const setUrls = (v: string) => onChange({ ...form, urls: v });
  const setSchema = (fn: (prev: SchemaField[]) => SchemaField[]) =>
    onChange({ ...form, schema: fn(form.schema) });

  useEffect(() => {
    setUrlAnalysis(analyzeURLs(form.urls));
  }, [form.urls]);

  const addField = () => setSchema((p) => [...p, { id: Date.now(), type: "", description: "", dataType: "string" as const }]);
  const removeField = (id: number) => setSchema((p) => (p.length > 1 ? p.filter((f) => f.id !== id) : p));
  const updateField = (id: number, key: keyof Omit<SchemaField, "id">, val: string) =>
    setSchema((p) => p.map((f) => (f.id === id ? { ...f, [key]: val } : f)));

  const validate = () => {
    const e: Record<string, string> = {};
    const hasSerpIntent = form.intent.trim().length > 0;
    const hasImportURLs = urlAnalysis.clean.length > 0;

    if (!hasSerpIntent && !hasImportURLs) {
      e.intent = "Provide a SERP intent, import URLs, or both";
    }
    if (hasSerpIntent && form.intent.trim().length < 20) {
      e.intent = `SERP intent minimum 20 characters (${form.intent.trim().length}/20)`;
    }
    if (hasSerpIntent && EMOJI_RE.test(form.intent)) {
      e.intent = "Emojis are not allowed in the SERP intent";
    }
    if (form.extractIntent.trim().length < 20) {
      e.extractIntent = `Minimum 20 characters (${form.extractIntent.trim().length}/20)`;
    }
    if (EMOJI_RE.test(form.extractIntent)) {
      e.extractIntent = "Emojis are not allowed in the extract intent";
    }
    if (form.schema.some((f) => !f.type.trim() || !f.description.trim())) {
      e.schema = "All schema fields must have a type and description";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const intentLen = form.intent.trim().length;
  const extractIntentLen = form.extractIntent.trim().length;
  const cleanURLsString = urlAnalysis.clean.join("\n");
  const submitting = phase === "running";

  return (
    <div className="space-y-6">

      {/* SERP Intent */}
      <div>
        <Label>SERP Intent</Label>
        <p className="text-[11px] text-muted-foreground mb-1">
          Optional. Used to discover URLs via search engines. Leave empty if importing your own URLs. Min 20 characters if provided.
        </p>
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/20">
          <Zap size={11} className="text-primary shrink-0" />
          <p className="text-[11px] text-primary/80 leading-relaxed">
            Keep this concise and search-friendly — think of it as what you'd type into Google.
          </p>
        </div>
        <Textarea
          value={form.intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. top AI startups 2025 funding rounds"
          rows={3}
          disabled={submitting}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-primary/40 focus-visible:border-primary/50 disabled:opacity-50",
            errors.intent && "border-destructive focus-visible:border-destructive"
          )}
        />
        <div className="flex items-center justify-between mt-1">
          <FieldError msg={errors.intent} />
          {form.intent.trim().length > 0 && (
            <span className={cn("text-[11px] font-mono ml-auto", intentLen >= 20 ? "text-primary" : "text-muted-foreground")}>
              {intentLen} {intentLen < 20 ? "/ 20 min" : "chars"}
            </span>
          )}
        </div>
      </div>

      {/* Extract Intent */}
      <div>
        <Label required>Extract Intent</Label>
        <p className="text-[11px] text-muted-foreground mb-1">Tells the AI exactly what to extract from each page. Be specific. Min 20 characters.</p>
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/20">
          <Zap size={11} className="text-primary shrink-0" />
          <p className="text-[11px] text-primary/80 leading-relaxed">
            Unlike SERP intent, this is read by the AI — be detailed about format, filters, and what matters.
          </p>
        </div>
        <Textarea
          value={form.extractIntent}
          onChange={(e) => setExtractIntent(e.target.value)}
          placeholder={`e.g. Extract AI startup companies that raised funding in 2025. For each company capture the name, funding amount, funding round (Seed/Series A etc), lead investor, and a one sentence description of what the company does. Only include companies with confirmed funding announcements, ignore speculation or rumours.`}
          rows={6}
          disabled={submitting}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-primary/40 focus-visible:border-primary/50 disabled:opacity-50",
            errors.extractIntent && "border-destructive focus-visible:border-destructive"
          )}
        />
        <div className="flex items-center justify-between mt-1">
          <FieldError msg={errors.extractIntent} />
          <span className={cn("text-[11px] font-mono ml-auto", extractIntentLen >= 20 ? "text-primary" : "text-muted-foreground")}>
            {extractIntentLen} {extractIntentLen < 20 ? "/ 20 min" : "chars"}
          </span>
        </div>
      </div>

      {/* Schema Fields */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label required>Schema Fields</Label>
          <button
            type="button"
            onClick={addField}
            disabled={submitting}
            className="flex items-center gap-1 text-[11px] font-mono text-primary hover:text-primary/80 transition-colors border border-primary/30 hover:border-primary/60 rounded-md px-2 py-1 bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={11} /> Add Field
          </button>
        </div>
        <div className="space-y-2">
          {form.schema.map((field) => (
            <div
              key={field.id}
              className="group flex flex-col gap-2 p-3 rounded-lg bg-accent/20 border border-border hover:border-primary/20 transition-colors md:grid md:grid-cols-[1fr_140px_1fr_auto]"
            >
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Field Name</p>
                <Input
                  value={field.type}
                  onChange={(e) => updateField(field.id, "type", e.target.value)}
                  placeholder="e.g. title"
                  disabled={submitting}
                  className="h-8 bg-card border-border text-foreground placeholder:text-muted-foreground font-mono text-xs focus-visible:ring-primary/40 focus-visible:border-primary/50 disabled:opacity-50"
                />
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Data Type</p>
                <select
                  value={field.dataType}
                  onChange={(e) => updateField(field.id, "dataType", e.target.value)}
                  disabled={submitting}
                  className="h-8 w-full rounded-md border border-border bg-card text-foreground text-xs font-mono px-2 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
                >
                  {["string", "number", "boolean", "array"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                <Input
                  value={field.description}
                  onChange={(e) => updateField(field.id, "description", e.target.value)}
                  placeholder="What to extract"
                  disabled={submitting}
                  className="h-8 bg-card border-border text-foreground placeholder:text-muted-foreground text-xs focus-visible:ring-primary/40 focus-visible:border-primary/50 disabled:opacity-50"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  disabled={form.schema.length === 1 || submitting}
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

      {/* Import URLs */}
      <div>
        <Label>Import URLs</Label>
        <p className="text-[11px] text-muted-foreground mb-2">One URL per line. Optional.</p>
        <Textarea
          value={form.urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"https://example.com/page-1\nhttps://example.com/page-2"}
          rows={5}
          disabled={submitting}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-primary/40 focus-visible:border-primary/50 disabled:opacity-50",
            urlAnalysis.hardBlocked.length > 0 && "border-destructive/50"
          )}
        />

        {urlAnalysis.hardBlocked.length > 0 && (
          <div className="mt-2 px-3 py-2.5 rounded-md border border-destructive/30 bg-destructive/5 space-y-1">
            <div className="flex items-center gap-1.5">
              <XCircle size={11} className="text-destructive shrink-0" />
              <p className="text-[11px] font-medium text-destructive">
                {urlAnalysis.hardBlocked.length} URL{urlAnalysis.hardBlocked.length > 1 ? "s" : ""} removed — social media platforms are not supported
              </p>
            </div>
            <div className="space-y-0.5 pl-4">
              {urlAnalysis.hardBlocked.map((u) => (
                <p key={u} className="text-[10px] font-mono text-destructive/70 truncate">{u}</p>
              ))}
            </div>
          </div>
        )}

        {urlAnalysis.softBlocked.length > 0 && (
          <div className="mt-2 px-3 py-2.5 rounded-md border border-yellow-500/30 bg-yellow-500/5 space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={11} className="text-yellow-500 shrink-0" />
              <p className="text-[11px] font-medium text-yellow-500">
                {urlAnalysis.softBlocked.length} URL{urlAnalysis.softBlocked.length > 1 ? "s" : ""} — Amazon URLs must use the Amazon pipeline.
              </p>
            </div>
            <div className="space-y-0.5 pl-4">
              {urlAnalysis.softBlocked.map(({ url, label }) => (
                <p key={url} className="text-[10px] font-mono text-yellow-500/70 truncate">
                  <span className="text-yellow-500/50">[{label}]</span> {url}
                </p>
              ))}
            </div>
          </div>
        )}

        {urlAnalysis.clean.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {urlAnalysis.clean.length} URL{urlAnalysis.clean.length > 1 ? "s" : ""} queued for processing
          </p>
        )}
      </div>

      {/* Progress log */}
      {phase !== "idle" && (
        <ProgressLog
          lines={progressLines}
          phase={phase}
          errorMsg={errorMsg}
        />
      )}

      {phase === "error" && (
        <p className="text-[11px] text-muted-foreground text-center">
          You can edit your settings above and try again.
        </p>
      )}

      <Button
        onClick={() => { if (validate()) onRun({ ...meta, intent: form.intent, extractIntent: form.extractIntent, schema: form.schema, urls: cleanURLsString }); }}
        disabled={submitting || phase === "done"}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
      >
        {submitting ? (
          <><Loader2 size={13} className="animate-spin" /> Running...</>
        ) : phase === "done" ? (
          <><CheckCircle2 size={13} /> Done</>
        ) : (
          <><Play size={13} /> Run Pipeline</>
        )}
      </Button>
    </div>
  );
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step, onStepClick }: { step: number; onStepClick: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[
        { n: 1, label: "Dataset Info" },
        { n: 2, label: "Pipeline Config" },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onStepClick(n)}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border transition-all",
                step === n
                  ? "bg-primary border-primary text-primary-foreground"
                  : step > n
                  ? "bg-primary/20 border-primary/40 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-accent border-border text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              {n}
            </button>
            <span className={cn("text-xs font-mono", step === n ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < 1 && <div className={cn("w-8 h-px mx-1", step > 1 ? "bg-primary/40" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateDatasetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [step1Form, setStep1Form] = useState<Step1Form>({
    name: "",
    description: "",
    tag: "",
    visibility: "public",
    nightly: "no",
  });
  const [step2Form, setStep2Form] = useState({
  intent: "",
  extractIntent: "",
  schema: [{ id: Date.now(), type: "", description: "", dataType: "string" as const }],
  urls: "",
  });
  const [meta, setMeta] = useState<Step1Form | null>(null);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [progressLines, setProgressLines] = useState<ProgressLine[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = (data: Step1Form) => {
    setMeta(data);
    setStep(2);
  };

  const handleStepClick = (n: number) => {
    if (n === 1) setStep(1);
    if (n === 2 && meta !== null) setStep(2);
  };

  const addLine = (detail: string) => {
    setProgressLines((prev) => {
      const updated = prev.map((l, i) =>
        i === prev.length - 1 ? { ...l, done: true } : l
      );
      return [...updated, { detail, done: false }];
    });
  };

  const handleRun = async (full: PipelinePayload) => {
    setPhase("running");
    setProgressLines([]);
    setErrorMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, ...full }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7).trim();
            if (line.startsWith("data: ")) data = line.slice(6).trim();
          }

          if (!data) continue;

          if (event === "progress") {
            const parsed = JSON.parse(data);
            addLine(parsed.detail);
          } else if (event === "done") {
            setProgressLines((prev) =>
              prev.map((l, i) => (i === prev.length - 1 ? { ...l, done: true } : l))
            );
            setPhase("done");
            setTimeout(() => {
              router.push("/dashboard");
            }, 1200);
          } else if (event === "error") {
            const parsed = JSON.parse(data);
            setErrorMsg(parsed.message);
            setPhase("error");
          }
        }
      }
    } catch (err: any) {
      setErrorMsg("Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <FaGlobe size={14} className="text-primary" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Web Pipeline</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Create <span className="text-primary">Web</span> Dataset
        </h1>
        <p className="text-sm text-muted-foreground">Configure your dataset and define the extraction pipeline.</p>
      </div>

      <StepIndicator step={step} onStepClick={handleStepClick} />

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {step === 1 && (
            <Step1
              form={step1Form}
              onChange={setStep1Form}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
  <Step2
    meta={meta!}
    form={step2Form}
    onChange={setStep2Form}
    onRun={handleRun}
    phase={phase}
    progressLines={progressLines}
    errorMsg={errorMsg}
  />
)}
        </CardContent>
      </Card>
    </div>
  );
}