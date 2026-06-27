"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useRedirectToDashboard } from "@/hooks/useRedirectToDashboard";
import {
  Plus, Globe, Lock, Moon, Tag, AlertCircle,
  Calendar, Hash, Link2, X, Search, ArrowLeft,
  Save, Loader2, CheckCircle2, Crown, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";

interface RedditDatasetDetail {
  dataset_id: number;
  name: string;
  description: string;
  tag: string;
  visibility: string;
  is_frozen: boolean;
  nightly: boolean;
  date_from: string;
  date_to: string;
  cap: number;
  subreddits: string[];
  urls: { url: string; source_type: string }[];
  is_premium: boolean;
  price: number;
}

interface EditForm {
  alias: string;
  description: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
  date_from: string;
  date_to: string;
  cap: number;
  new_subreddits: string[];
  new_keywords: string[];
  new_urls: string;
  is_premium: boolean;
  price: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DATE_FLOOR = "2020-01-01";
const TODAY = new Date().toISOString().split("T")[0];
const CAP_MIN = 50;
const CAP_MAX = 1000;
const MAX_NEW_SUBREDDITS = 3;
const MAX_NEW_KEYWORDS = 5;
const MAX_URLS = 200;
const REDDIT_URL_RE = /^https?:\/\/(www\.)?reddit\.com\//i;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</h2>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border/40 my-6" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RedditEditPage() {
  const params    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const datasetId = params?.datasetId as string;
  useRedirectToDashboard();

  const [dataset, setDataset]         = useState<RedditDatasetDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [saved, setSaved]             = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  const [form, setForm] = useState<EditForm>({
    alias: "",
    description: "",
    tag: "",
    visibility: "public",
    nightly: "yes",
    date_from: "",
    date_to: TODAY,
    cap: 200,
    new_subreddits: [""],
    new_keywords: [""],
    new_urls: "",
    is_premium: false,
    price: 9,
  });

  // ── Fetch dataset ──────────────────────────────────────────────────────────

  const fetchDataset = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dataset/reddit/view?dataset_id=${datasetId}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data: RedditDatasetDetail = await res.json();
      setDataset(data);
      setForm({
        alias:          data.name,
        description:    data.description,
        tag:            data.tag ?? "",
        visibility:     (data.visibility as Visibility) ?? "public",
        nightly:        data.nightly ? "yes" : "no",
        date_from:      data.date_from?.slice(0, 10) ?? "",
        date_to:        data.date_to?.slice(0, 10) ?? TODAY,
        cap:            data.cap ?? 200,
        new_subreddits: [""],
        new_keywords:   [""],
        new_urls:       "",
        is_premium:     data.is_premium ?? false,
        price:          data.price ?? 9,
      });
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load dataset");
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => { fetchDataset(); }, [fetchDataset]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setPremium = (val: boolean) => {
    setForm((p) => ({
      ...p,
      is_premium: val,
      visibility: val ? "public" : p.visibility,
    }));
  };

  const addSubreddit = () => {
    if (form.new_subreddits.length < MAX_NEW_SUBREDDITS)
      set("new_subreddits", [...form.new_subreddits, ""]);
  };
  const removeSubreddit = (i: number) =>
    set("new_subreddits", form.new_subreddits.filter((_, idx) => idx !== i));
  const updateSubreddit = (i: number, val: string) =>
    set("new_subreddits", form.new_subreddits.map((s, idx) => (idx === i ? val : s)));

  const addKeyword = () => {
    if (form.new_keywords.length < MAX_NEW_KEYWORDS)
      set("new_keywords", [...form.new_keywords, ""]);
  };
  const removeKeyword = (i: number) =>
    set("new_keywords", form.new_keywords.filter((_, idx) => idx !== i));
  const updateKeyword = (i: number, val: string) =>
    set("new_keywords", form.new_keywords.map((k, idx) => (idx === i ? val : k)));

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.alias.trim()) e.alias = "Dataset name is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (form.is_premium && form.price < 1) e.price = "Price must be at least $1.";

    if (form.new_urls.trim()) {
      const lines = form.new_urls.trim().split("\n").filter(Boolean);
      if (lines.length > MAX_URLS) {
        e.new_urls = `Maximum ${MAX_URLS} URLs allowed (${lines.length} provided).`;
      } else {
        const invalid = lines.filter((l) => !REDDIT_URL_RE.test(l.trim()));
        if (invalid.length > 0) {
          e.new_urls = `Only Reddit URLs allowed. ${invalid.length} invalid line${invalid.length > 1 ? "s" : ""} found.`;
        }
      }
    }

    const filledSubs = form.new_subreddits.filter((s) => s.trim().length > 0);
    if (filledSubs.length > 0) {
      if (filledSubs.some((s) => !/^[A-Za-z0-9_]+$/.test(s.trim()))) {
        e.new_subreddits = "Subreddit names can only contain letters, numbers, and underscores.";
      }
    }

    if (!form.date_from) {
      e.date_from = "Start date is required.";
    } else if (form.date_from < DATE_FLOOR) {
      e.date_from = `Date cannot be before ${DATE_FLOOR}.`;
    } else if (form.date_from === form.date_to) {
      e.date_from = "Start and end date cannot be the same day.";
    } else if (form.date_from > form.date_to) {
      e.date_from = "Start date must be before end date.";
    }

    if (form.cap < CAP_MIN || form.cap > CAP_MAX) {
      e.cap = `Cap must be between ${CAP_MIN} and ${CAP_MAX}.`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const filledSubs = form.new_subreddits.filter((s) => s.trim().length > 0);
    const filledKws  = form.new_keywords.filter((k) => k.trim().length > 0);
    const newUrls    = form.new_urls.trim()
      ? form.new_urls.trim().split("\n").filter(Boolean)
      : [];

    const payload = {
      dataset_id:     Number(datasetId),
      user_id:        user?.id,
      alias:          form.alias.trim(),
      description:    form.description.trim(),
      tag:            form.tag.trim(),
      visibility:     form.visibility,
      nightly:        form.nightly,
      date_from:      form.date_from,
      date_to:        form.date_to,
      cap:            form.cap,
      new_subreddits: filledSubs,
      new_keywords:   filledKws,
      new_urls:       newUrls,
      is_premium:     form.is_premium,
      price:          form.is_premium ? form.price : 0,
    };

    try {
      const res = await fetch(`${API}/dataset/reddit/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      setSaved(true);
      setTimeout(() => { router.push(`/dashboard`); }, 800);
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError || !dataset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={28} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{fetchError ?? "Dataset not found."}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs">
          Go Back
        </Button>
      </div>
    );
  }

  const existingImportUrls = dataset.urls.filter(
    (u) => u.source_type === "import" || u.source_type === "reddit"
  );
  const urlCount = form.new_urls.trim()
    ? form.new_urls.trim().split("\n").filter(Boolean).length
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={13} /> Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Vexaro</p>
          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
            Reddit
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Edit <span className="text-orange-400">{dataset.name}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Update metadata, refresh config, or add more sources.
        </p>
      </div>

      {submitError && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          <AlertCircle size={13} /> {submitError}
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">

          <SectionHeader title="Dataset Info" />

          {/* Name / Alias */}
          <div>
            <Label required>Dataset Name</Label>
            <Input
              value={form.alias}
              onChange={(e) => set("alias", e.target.value)}
              placeholder="Display name for this dataset"
              className={cn(
                "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
                errors.alias && "border-destructive"
              )}
            />
            <FieldError msg={errors.alias} />
            <p className="text-[11px] text-muted-foreground mt-1">
              Updates display name only. Internal ID{" "}
              <span className="font-mono text-muted-foreground/60">{dataset.name}</span>{" "}
              stays unchanged.
            </p>
          </div>

          {/* Description */}
          <div>
            <Label required>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What does this dataset cover?"
              rows={3}
              className={cn(
                "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
                errors.description && "border-destructive"
              )}
            />
            <FieldError msg={errors.description} />
          </div>

          {/* Tag */}
          <div>
            <Label>Tag</Label>
            <div className="relative">
              <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="e.g. community, finance, tech"
                className="pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
              />
            </div>
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
                { val: "public",  label: "Public",  icon: Globe, desc: "Anyone can clone this dataset" },
                { val: "private", label: "Private", icon: Lock,  desc: "Only you can access it" },
              ].map(({ val, label, icon: Icon, desc }) => (
                <button
                  key={val}
                  type="button"
                  disabled={form.is_premium && val === "private"}
                  onClick={() => set("visibility", val as Visibility)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                    form.visibility === val
                      ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_12px_theme(colors.orange.500/10)]"
                      : "bg-accent/20 border-border hover:border-orange-500/20",
                    form.is_premium && val === "private" && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                    form.visibility === val
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                      : "bg-accent border-border text-muted-foreground"
                  )}>
                    <Icon size={13} />
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold", form.visibility === val ? "text-orange-400" : "text-foreground")}>
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

          {/* Nightly */}
          <div>
            <Label required>Nightly Refresh</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Auto-refresh dataset every night at midnight UTC.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "yes", label: "Yes", desc: "Refresh every night" },
                { val: "no",  label: "No",  desc: "Manual refresh only" },
              ].map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("nightly", val as NightlyRefresh)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                    form.nightly === val
                      ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_12px_theme(colors.orange.500/10)]"
                      : "bg-accent/20 border-border hover:border-orange-500/20"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                    form.nightly === val
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                      : "bg-accent border-border text-muted-foreground"
                  )}>
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

          <Divider />

          <SectionHeader
            title="Refresh Config"
            sub="These settings apply to the next refresh, not historical data."
          />

          {/* Date Range */}
          <div>
            <Label required>Date Range</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Collect posts from this period on the next refresh.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">From</span>
                </div>
                <Input
                  type="date"
                  value={form.date_from}
                  min={DATE_FLOOR}
                  max={form.date_to || TODAY}
                  onChange={(e) => set("date_from", e.target.value)}
                  className={cn(
                    "bg-accent/30 border-border text-foreground text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
                    errors.date_from && "border-destructive"
                  )}
                />
                <FieldError msg={errors.date_from} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className="text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">To</span>
                </div>
                <Input
                  type="date"
                  value={form.date_to}
                  min={form.date_from || DATE_FLOOR}
                  max={TODAY}
                  onChange={(e) => set("date_to", e.target.value)}
                  className="bg-accent/30 border-border text-foreground text-sm focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50"
                />
              </div>
            </div>
          </div>

          {/* Cap */}
          <div>
            <Label required>Post Cap</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Max posts to collect per subreddit on the next refresh.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={form.cap}
                min={CAP_MIN}
                max={CAP_MAX}
                onChange={(e) => set("cap", Number(e.target.value))}
                className={cn(
                  "bg-accent/30 border-border text-foreground font-mono text-sm w-32 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
                  errors.cap && "border-destructive"
                )}
              />
              <div className="flex-1 h-1.5 rounded-full bg-accent/50 overflow-hidden">
                <div
                  className="h-full bg-orange-500/60 rounded-full transition-all duration-150"
                  style={{ width: `${((form.cap - CAP_MIN) / (CAP_MAX - CAP_MIN)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">{CAP_MIN}–{CAP_MAX}</span>
            </div>
            <FieldError msg={errors.cap} />
          </div>

          <Divider />

          <SectionHeader
            title="Existing Sources"
            sub="Read-only. These are already part of the dataset."
          />

          {dataset.subreddits.length > 0 && (
            <div>
              <Label>Subreddits</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {dataset.subreddits.map((sub) => (
                  <span
                    key={sub}
                    className="flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400"
                  >
                    <Hash size={9} />r/{sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {existingImportUrls.length > 0 && (
            <div>
              <Label>Imported URLs</Label>
              <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                {existingImportUrls.map((u) => (
                  <p key={u.url} className="text-[11px] font-mono text-muted-foreground/60 truncate">
                    {u.url}
                  </p>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {existingImportUrls.length} imported URL{existingImportUrls.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          <Divider />

          <SectionHeader
            title="Add More Sources"
            sub="New sources will be fetched and added to the next version."
          />

          {/* New Subreddits */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>New Subreddits</Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {form.new_subreddits.filter((s) => s.trim()).length}/{MAX_NEW_SUBREDDITS}
                </span>
                {form.new_subreddits.length < MAX_NEW_SUBREDDITS && (
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
              {form.new_subreddits.map((sub, i) => (
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
                  {form.new_subreddits.length > 1 && (
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
            <FieldError msg={errors.new_subreddits} />
          </div>

          {/* New Keywords */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>New Keywords</Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {form.new_keywords.filter((k) => k.trim()).length}/{MAX_NEW_KEYWORDS}
                </span>
                {form.new_keywords.length < MAX_NEW_KEYWORDS && (
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
                New keywords will be used in the next refresh alongside existing subreddits.
              </p>
            </div>
            <div className="space-y-2">
              {form.new_keywords.map((kw, i) => (
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
                  {form.new_keywords.length > 1 && (
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
            <FieldError msg={errors.new_keywords} />
          </div>

          {/* New URLs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Import More Reddit URLs</Label>
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
                Reddit post URLs only. One per line. Duplicates are skipped automatically.
              </p>
            </div>
            <Textarea
              value={form.new_urls}
              onChange={(e) => set("new_urls", e.target.value)}
              placeholder={"https://reddit.com/r/Nigeria/comments/abc123/...\nhttps://reddit.com/r/technology/comments/xyz456/..."}
              rows={5}
              className={cn(
                "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50",
                errors.new_urls && "border-destructive"
              )}
            />
            <FieldError msg={errors.new_urls} />
          </div>

          <Divider />

          <Button
            onClick={handleSave}
            disabled={submitting || saved}
            className="w-full bg-orange-500 text-white hover:bg-orange-600 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
          >
            {saved ? (
              <><CheckCircle2 size={13} className="text-white" /> Saved — redirecting</>
            ) : submitting ? (
              <><Loader2 size={13} className="animate-spin" /> Saving...</>
            ) : (
              <><Save size={13} /> Save Changes</>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}