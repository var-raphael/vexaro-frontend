"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useRedirectToDashboard } from "@/hooks/useRedirectToDashboard";
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
  Calendar,
  Hash,
  Link2,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";

interface Step1Form {
  name: string;
  description: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
}

interface PipelinePayload extends Step1Form {
  urls: string;
  subreddits: string[];
  keywords: string[];
  date_from: string;
  date_to: string;
  cap: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_FLOOR = "2020-01-01";
const TODAY = new Date().toISOString().split("T")[0];
const CAP_MIN = 50;
const CAP_MAX = 1000;
const CAP_DEFAULT = 200;
const MAX_URLS = 200;
const MAX_SUBREDDITS = 3;
const MAX_KEYWORDS = 5;
const REDDIT_URL_RE = /^https?:\/\/(www\.)?reddit\.com\//i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase flex items-center gap-1 mb-1.5">
      {children}
      {required && <span className="text-orange-400 text-[10px]">*</span>}
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

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[
        { n: 1, label: "Dataset Info" },
        { n: 2, label: "Pipeline Config" },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border transition-all",
                step === n
                  ? "bg-orange-500 border-orange-500 text-white"
                  : step > n
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-accent border-border text-muted-foreground"
              )}
            >
              {n}
            </div>
            <span className={cn("text-xs font-mono", step === n ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < 1 && <div className={cn("w-8 h-px mx-1", step > 1 ? "bg-orange-500/40" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: (data: Step1Form) => void }) {
  const [form, setForm] = useState<Step1Form>({
    name: "",
    description: "",
    tag: "",
    visibility: "public",
    nightly: "yes",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof Step1Form, v: string) => setForm((p) => ({ ...p, [k]: v }));

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
          placeholder="e.g. r-nigeria-tech"
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
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
          placeholder="What Reddit communities or topics does this dataset cover?"
          rows={3}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
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
            placeholder="e.g. community, finance, tech"
            className="pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
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
                  ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_12px_theme(colors.orange.500/10)]"
                  : "bg-accent/20 border-border hover:border-orange-500/20"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                  form.visibility === val
                    ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                    : "bg-accent border-border text-muted-foreground"
                )}
              >
                <Icon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.visibility === val ? "text-orange-400" : "text-foreground")}>
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
                  ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_12px_theme(colors.orange.500/10)]"
                  : "bg-accent/20 border-border hover:border-orange-500/20"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                  form.nightly === val
                    ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                    : "bg-accent border-border text-muted-foreground"
                )}
              >
                <Moon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.nightly === val ? "text-orange-400" : "text-foreground")}>
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
        className="w-full bg-orange-500 text-white hover:bg-orange-600 font-mono text-xs tracking-widest uppercase gap-2"
      >
        Next <ArrowRight size={13} />
      </Button>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function Step2({
  meta,
  onRun,
  submitting,
}: {
  meta: Step1Form;
  onRun: (data: PipelinePayload) => Promise<void>;
  submitting: boolean;
}) {
  const [urls, setUrls] = useState("");
  const [subreddits, setSubreddits] = useState<string[]>([""]);
  const [keywords, setKeywords] = useState<string[]>([""]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState(TODAY);
  const [cap, setCap] = useState(CAP_DEFAULT);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Subreddit helpers ──────────────────────────────────────────────────────

  const addSubreddit = () => {
    if (subreddits.length < MAX_SUBREDDITS) setSubreddits((p) => [...p, ""]);
  };
  const removeSubreddit = (i: number) => setSubreddits((p) => p.filter((_, idx) => idx !== i));
  const updateSubreddit = (i: number, val: string) =>
    setSubreddits((p) => p.map((s, idx) => (idx === i ? val : s)));

  // ── Keyword helpers ────────────────────────────────────────────────────────

  const addKeyword = () => {
    if (keywords.length < MAX_KEYWORDS) setKeywords((p) => [...p, ""]);
  };
  const removeKeyword = (i: number) => setKeywords((p) => p.filter((_, idx) => idx !== i));
  const updateKeyword = (i: number, val: string) =>
    setKeywords((p) => p.map((k, idx) => (idx === i ? val : k)));

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};

    const urlsFilled = urls.trim().length > 0;
    const subsFilled = subreddits.some((s) => s.trim().length > 0);
    const kwFilled = keywords.some((k) => k.trim().length > 0);

    if (!urlsFilled && !subsFilled && !kwFilled) {
      e.source = "Add at least one data source — subreddits, keywords, or URLs.";
    }

    if (urlsFilled) {
      const lines = urls.trim().split("\n").filter(Boolean);
      if (lines.length > MAX_URLS) {
        e.urls = `Maximum ${MAX_URLS} URLs allowed (${lines.length} provided)`;
      } else {
        const invalid = lines.filter((l) => !REDDIT_URL_RE.test(l.trim()));
        if (invalid.length > 0) {
          e.urls = `Only Reddit URLs allowed. ${invalid.length} invalid line${invalid.length > 1 ? "s" : ""} found.`;
        }
      }
    }

    if (subsFilled) {
      const hasEmpty = subreddits.some((s, i) => i < subreddits.length && s.trim() === "" && subreddits.length > 1);
      if (hasEmpty) e.subreddits = "Remove empty subreddit fields or fill them in.";
      const filled = subreddits.filter((s) => s.trim().length > 0);
      if (filled.some((s) => !/^[A-Za-z0-9_]+$/.test(s.trim()))) {
        e.subreddits = "Subreddit names can only contain letters, numbers, and underscores.";
      }
    }

    if (kwFilled) {
      const hasEmpty = keywords.some((k, i) => i < keywords.length && k.trim() === "" && keywords.length > 1);
      if (hasEmpty) e.keywords = "Remove empty keyword fields or fill them in.";
    }

    if (!dateFrom) {
  e.dateFrom = "Start date is required.";
} else if (dateFrom < DATE_FLOOR) {
  e.dateFrom = `Date cannot be before ${DATE_FLOOR}.`;
} else if (dateFrom === dateTo) {
  e.dateFrom = "Start date and end date cannot be the same day.";
} else if (dateFrom > dateTo) {
  e.dateFrom = "Start date must be before end date.";
}

    if (cap < CAP_MIN || cap > CAP_MAX) {
      e.cap = `Cap must be between ${CAP_MIN} and ${CAP_MAX}.`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const urlCount = urls.trim() ? urls.trim().split("\n").filter(Boolean).length : 0;
  const filledSubs = subreddits.filter((s) => s.trim().length > 0).length;
  const filledKws = keywords.filter((k) => k.trim().length > 0).length;

  return (
    <div className="space-y-6">

      {/* Source error banner */}
      {errors.source && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-orange-500/30 bg-orange-500/8 text-orange-400 text-xs">
          <AlertCircle size={12} className="shrink-0" /> {errors.source}
        </div>
      )}

      {/* Subreddits */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Subreddits</Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{filledSubs}/{MAX_SUBREDDITS}</span>
            {subreddits.length < MAX_SUBREDDITS && (
              <button
                type="button"
                onClick={addSubreddit}
                className="flex items-center gap-1 text-[11px] font-mono text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30 hover:border-orange-500/60 rounded-md px-2 py-1 bg-orange-500/5"
              >
                <Plus size={11} /> Add
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {subreddits.map((sub, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-accent/30 border border-border rounded-md overflow-hidden focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
                <div className="flex items-center gap-1 px-3 border-r border-border bg-accent/50 h-10 shrink-0">
                  <Hash size={11} className="text-orange-400" />
                  <span className="text-xs font-mono text-orange-400">r/</span>
                </div>
                <Input
                  value={sub}
                  onChange={(e) => updateSubreddit(i, e.target.value)}
                  placeholder="subreddit name"
                  className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground font-mono text-sm h-10 focus-visible:ring-0 focus-visible:border-0 rounded-none"
                />
              </div>
              {subreddits.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSubreddit(i)}
                  className="w-10 h-10 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <FieldError msg={errors.subreddits} />
        <p className="text-[11px] text-muted-foreground mt-1.5">Max {MAX_SUBREDDITS} subreddits per dataset.</p>
      </div>

      {/* Keywords */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Keywords</Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{filledKws}/{MAX_KEYWORDS}</span>
            {keywords.length < MAX_KEYWORDS && (
              <button
                type="button"
                onClick={addKeyword}
                className="flex items-center gap-1 text-[11px] font-mono text-orange-400 hover:text-orange-300 transition-colors border border-orange-500/30 hover:border-orange-500/60 rounded-md px-2 py-1 bg-orange-500/5"
              >
                <Plus size={11} /> Add
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-md bg-accent/30 border border-border">
          <Search size={11} className="text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Search Reddit for posts matching these keywords. Combined with subreddits for targeted search.
          </p>
        </div>
        <div className="space-y-2">
          {keywords.map((kw, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-accent/30 border border-border rounded-md overflow-hidden focus-within:border-orange-500/50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
                <div className="flex items-center justify-center px-3 border-r border-border bg-accent/50 h-10 shrink-0">
                  <Search size={11} className="text-orange-400" />
                </div>
                <Input
                  value={kw}
                  onChange={(e) => updateKeyword(i, e.target.value)}
                  placeholder={`Keyword ${i + 1}`}
                  className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground font-mono text-sm h-10 focus-visible:ring-0 focus-visible:border-0 rounded-none"
                />
              </div>
              {keywords.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeKeyword(i)}
                  className="w-10 h-10 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <FieldError msg={errors.keywords} />
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Max {MAX_KEYWORDS} keywords. All keywords are combined into one search query.
        </p>
      </div>

      {/* URL Import */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>Import Reddit URLs</Label>
          <div className="flex items-center gap-2">
            {urlCount > 0 && (
              <span className={cn("text-[10px] font-mono", urlCount > MAX_URLS ? "text-destructive" : "text-muted-foreground")}>
                {urlCount}/{MAX_URLS}
              </span>
            )}
            <span className="text-[10px] font-mono text-muted-foreground">optional</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-md bg-accent/30 border border-border">
          <Link2 size={11} className="text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Reddit post URLs only. One per line. Max {MAX_URLS} URLs.
          </p>
        </div>
        <Textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"https://reddit.com/r/Nigeria/comments/abc123/...\nhttps://reddit.com/r/technology/comments/xyz456/..."}
          rows={5}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
            errors.urls && "border-destructive focus-visible:border-destructive"
          )}
        />
        <FieldError msg={errors.urls} />
      </div>

      {/* Date Range */}
      <div>
        <Label required>Date Range</Label>
        <p className="text-[11px] text-muted-foreground mb-2">
          Collect posts from this period. Newest posts collected first.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} className="text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">From</span>
            </div>
            <Input
              type="date"
              value={dateFrom}
              min={DATE_FLOOR}
              max={dateTo || TODAY}
              onChange={(e) => setDateFrom(e.target.value)}
              className={cn(
                "bg-accent/30 border-border text-foreground text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
                errors.dateFrom && "border-destructive"
              )}
            />
            <FieldError msg={errors.dateFrom} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={11} className="text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">To</span>
            </div>
            <Input
              type="date"
              value={dateTo}
              min={dateFrom || DATE_FLOOR}
              max={TODAY}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-accent/30 border-border text-foreground text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Earliest available: {DATE_FLOOR} · Latest: today
        </p>
      </div>

      {/* Cap */}
      <div>
        <Label required>Post Cap</Label>
        <p className="text-[11px] text-muted-foreground mb-2">
          Max posts to collect per subreddit. Newest first within date range.
        </p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={cap}
            min={CAP_MIN}
            max={CAP_MAX}
            onChange={(e) => setCap(Number(e.target.value))}
            className={cn(
              "bg-accent/30 border-border text-foreground font-mono text-sm w-32 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
              errors.cap && "border-destructive"
            )}
          />
          <div className="flex-1 h-1.5 rounded-full bg-accent/50 overflow-hidden">
            <div
              className="h-full bg-orange-500/60 rounded-full transition-all duration-150"
              style={{ width: `${((cap - CAP_MIN) / (CAP_MAX - CAP_MIN)) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-muted-foreground shrink-0">{CAP_MIN}–{CAP_MAX}</span>
        </div>
        <FieldError msg={errors.cap} />
      </div>

      <Button
        onClick={() => {
          if (validate()) {
            const filledSubreddits = subreddits.filter((s) => s.trim().length > 0);
            const filledKeywords = keywords.filter((k) => k.trim().length > 0);
            onRun({
              ...meta,
              urls,
              subreddits: filledSubreddits,
              keywords: filledKeywords,
              date_from: dateFrom,
              date_to: dateTo,
              cap,
            });
          }
        }}
        disabled={submitting}
        className="w-full bg-orange-500 text-white hover:bg-orange-600 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
      >
        <Play size={13} /> {submitting ? "Queuing..." : "Run Pipeline"}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateRedditDatasetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState<Step1Form | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  useRedirectToDashboard();

  const handleNext = (data: Step1Form) => {
    setMeta(data);
    setStep(2);
  };

  const handleRun = async (full: PipelinePayload) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/queue/reddit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, ...full }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data = await res.json();
      console.log("Reddit pipeline queued:", data);
      router.push("/dashboard");
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Vexaro</p>
          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
            Reddit
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Create <span className="text-orange-400">Reddit Dataset</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Pull posts from subreddits or specific Reddit URLs into your pipeline.
        </p>
      </div>

      <StepIndicator step={step} />

      {submitError && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          <AlertCircle size={13} /> {submitError}
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {step === 1 && <Step1 onNext={handleNext} />}
          {step === 2 && <Step2 meta={meta!} onRun={handleRun} submitting={submitting} />}
        </CardContent>
      </Card>
    </div>
  );
}