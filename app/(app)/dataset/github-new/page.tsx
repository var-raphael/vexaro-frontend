"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FaGithub } from "react-icons/fa";
import {
  ArrowRight, Play, Tag, AlertCircle, Moon,
  Globe, Lock, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
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

const LANGUAGE_OPTIONS = [
  "Any", "JavaScript", "TypeScript", "Python", "Go", "Rust",
  "Java", "C", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin",
  "Scala", "Shell", "Dockerfile", "HTML", "CSS", "Vue",
];

const FIELD_GROUPS = [
  {
    group: "Core",
    fields: [
      { key: "name", label: "Name", default: true },
      { key: "full_name", label: "Full Name", default: true },
      { key: "description", label: "Description", default: true },
      { key: "html_url", label: "GitHub URL", default: true },
      { key: "homepage", label: "Homepage", default: false },
      { key: "visibility", label: "Visibility", default: false },
    ],
  },
  {
    group: "Stats",
    fields: [
      { key: "stargazers_count", label: "Stars", default: true },
      { key: "forks_count", label: "Forks", default: true },
      { key: "watchers_count", label: "Watchers", default: false },
      { key: "open_issues_count", label: "Open Issues", default: true },
      { key: "size", label: "Size (KB)", default: false },
    ],
  },
  {
    group: "Details",
    fields: [
      { key: "language", label: "Language", default: true },
      { key: "topics", label: "Topics", default: true },
      { key: "default_branch", label: "Default Branch", default: false },
      { key: "fork", label: "Is Fork", default: false },
      { key: "archived", label: "Is Archived", default: false },
      { key: "is_template", label: "Is Template", default: false },
    ],
  },
  {
    group: "Dates",
    fields: [
      { key: "created_at", label: "Created At", default: true },
      { key: "updated_at", label: "Updated At", default: false },
      { key: "pushed_at", label: "Last Push", default: false },
    ],
  },
  {
    group: "Owner",
    fields: [
      { key: "owner", label: "Owner (full object)", default: false },
    ],
  },
];

const DEFAULT_FIELDS = FIELD_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.default).map((f) => f.key)
);

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase flex items-center gap-1 mb-1.5">
      {children}
      {required && <span className="text-slate-400 text-[10px]">*</span>}
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

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[
        { n: 1, label: "Dataset Info" },
        { n: 2, label: "Pipeline Config" },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border transition-all",
              step === n
                ? "bg-slate-500 border-slate-500 text-white"
                : step > n
                ? "bg-slate-500/20 border-slate-500/40 text-slate-400"
                : "bg-accent border-border text-muted-foreground"
            )}>
              {n}
            </div>
            <span className={cn("text-xs font-mono", step === n ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < 1 && <div className={cn("w-8 h-px mx-1", step > 1 ? "bg-slate-500/40" : "bg-border")} />}
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
          placeholder="e.g. trending-rust-repos"
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm focus-visible:ring-slate-500/40 focus-visible:border-slate-500/50",
            errors.name && "border-destructive"
          )}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <Label required>Dataset Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What repos are you tracking? What's the use case?"
          rows={3}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-slate-500/40 focus-visible:border-slate-500/50",
            errors.description && "border-destructive"
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
            placeholder="e.g. open-source, rust, ai"
            className="pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-slate-500/40 focus-visible:border-slate-500/50"
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
                  ? "bg-slate-500/10 border-slate-500/50 shadow-[0_0_12px_rgba(100,116,139,0.15)]"
                  : "bg-accent/20 border-border hover:border-slate-500/30"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                form.visibility === val
                  ? "bg-slate-500/15 border-slate-500/40 text-slate-400"
                  : "bg-accent border-border text-muted-foreground"
              )}>
                <Icon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.visibility === val ? "text-slate-400" : "text-foreground")}>
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
                  ? "bg-slate-500/10 border-slate-500/50 shadow-[0_0_12px_rgba(100,116,139,0.15)]"
                  : "bg-accent/20 border-border hover:border-slate-500/30"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                form.nightly === val
                  ? "bg-slate-500/15 border-slate-500/40 text-slate-400"
                  : "bg-accent border-border text-muted-foreground"
              )}>
                <Moon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.nightly === val ? "text-slate-400" : "text-foreground")}>
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
        className="w-full bg-slate-600 text-white hover:bg-slate-600/90 font-mono text-xs tracking-widest uppercase gap-2"
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
  onRun: (data: any) => Promise<void>;
  submitting: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("Any");
  const [minStars, setMinStars] = useState("");
  const [repoURLs, setRepoURLs] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_FIELDS));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Core", "Stats", "Details"]));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parseRepoURLs = (raw: string) => {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    const repoPattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return {
      valid: lines.filter((l) => repoPattern.test(l)),
      invalid: lines.filter((l) => !repoPattern.test(l)),
    };
  };

  const { valid: validURLs, invalid: invalidURLs } = parseRepoURLs(repoURLs);

  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const selectAllInGroup = (group: string) => {
    const keys = FIELD_GROUPS.find((g) => g.group === group)?.fields.map((f) => f.key) ?? [];
    setSelectedFields((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const clearGroup = (group: string) => {
    const keys = FIELD_GROUPS.find((g) => g.group === group)?.fields.map((f) => f.key) ?? [];
    setSelectedFields((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const hasSearch = searchQuery.trim() !== "";
    const hasURLs = validURLs.length > 0;
    if (!hasSearch && !hasURLs) e.source = "Provide a search query, import repo URLs, or both";
    if (invalidURLs.length > 0) e.urls = `${invalidURLs.length} invalid URL(s) — must be github.com/owner/repo format`;
    if (selectedFields.size === 0) e.fields = "Select at least one field";
    if (minStars !== "" && (isNaN(Number(minStars)) || Number(minStars) < 0)) e.minStars = "Min stars must be a positive number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-6">

      {/* Search */}
      <div className="space-y-4">
        <div>
          <Label>Search Query</Label>
          <p className="text-[11px] text-muted-foreground mb-2">Search GitHub repos by keyword, topic, or description</p>
          {errors.source && <FieldError msg={errors.source} />}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. machine learning framework"
            className="bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm focus-visible:ring-slate-500/40 focus-visible:border-slate-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-accent/30 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-slate-500/50 focus:ring-1 focus:ring-slate-500/40"
            >
              {LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Min Stars</Label>
            <Input
              type="number"
              value={minStars}
              onChange={(e) => setMinStars(e.target.value)}
              placeholder="e.g. 1000"
              min={0}
              className={cn(
                "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-slate-500/40 focus-visible:border-slate-500/50",
                errors.minStars && "border-destructive"
              )}
            />
            <FieldError msg={errors.minStars} />
          </div>
        </div>
      </div>

      {/* URL Import */}
      <div>
        <Label>Import Repo URLs</Label>
        <p className="text-[11px] text-muted-foreground mb-2">Paste specific GitHub repo URLs, one per line</p>
        <Textarea
          value={repoURLs}
          onChange={(e) => setRepoURLs(e.target.value)}
          placeholder={"https://github.com/torvalds/linux\nhttps://github.com/facebook/react"}
          rows={5}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-slate-500/40 focus-visible:border-slate-500/50",
            errors.urls && "border-destructive/50"
          )}
        />

        {invalidURLs.length > 0 && (
          <div className="mt-2 px-3 py-2.5 rounded-md border border-destructive/30 bg-destructive/5 space-y-1">
            <div className="flex items-center gap-1.5">
              <XCircle size={11} className="text-destructive shrink-0" />
              <p className="text-[11px] font-medium text-destructive">
                {invalidURLs.length} invalid {invalidURLs.length === 1 ? "URL" : "URLs"} — must be github.com/owner/repo format
              </p>
            </div>
            <div className="space-y-0.5 pl-4">
              {invalidURLs.slice(0, 3).map((u) => (
                <p key={u} className="text-[10px] font-mono text-destructive/70 truncate">{u}</p>
              ))}
              {invalidURLs.length > 3 && (
                <p className="text-[10px] text-destructive/50">+{invalidURLs.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        {validURLs.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {validURLs.length} valid {validURLs.length === 1 ? "URL" : "URLs"} queued
          </p>
        )}
        <FieldError msg={errors.urls} />
      </div>

      {/* Field Picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label required>Fields to Extract</Label>
          <span className="text-[11px] font-mono text-slate-400">{selectedFields.size} selected</span>
        </div>
        <FieldError msg={errors.fields} />

        <div className="space-y-2 mt-2">
          {FIELD_GROUPS.map(({ group, fields }) => {
            const isExpanded = expandedGroups.has(group);
            const selectedInGroup = fields.filter((f) => selectedFields.has(f.key)).length;
            const allSelected = selectedInGroup === fields.length;

            return (
              <div key={group} className="rounded-lg border border-border overflow-hidden">
                <div
                  className="flex items-center justify-between px-3 py-2.5 bg-accent/20 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleGroup(group)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded
                      ? <ChevronUp size={12} className="text-muted-foreground" />
                      : <ChevronDown size={12} className="text-muted-foreground" />}
                    <span className="text-xs font-mono font-medium text-foreground">{group}</span>
                    <span className="text-[10px] font-mono text-slate-400/70">
                      {selectedInGroup}/{fields.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => allSelected ? clearGroup(group) : selectAllInGroup(group)}
                      className="text-[10px] font-mono text-muted-foreground hover:text-slate-400 transition-colors"
                    >
                      {allSelected ? "clear" : "all"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-2 gap-1.5 p-3 bg-accent/10">
                    {fields.map(({ key, label }) => {
                      const checked = selectedFields.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleField(key)}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left transition-all duration-100 text-xs",
                            checked
                              ? "bg-slate-500/10 border-slate-500/40 text-slate-300"
                              : "bg-card border-border text-muted-foreground hover:border-slate-500/20 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-sm border shrink-0 flex items-center justify-center",
                            checked ? "bg-slate-500 border-slate-500" : "border-border"
                          )}>
                            {checked && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <span className="font-mono truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button
        onClick={() => {
          if (validate()) {
            onRun({
              ...meta,
              search_query: searchQuery.trim(),
              language: language === "Any" ? "" : language,
              min_stars: minStars === "" ? 0 : Number(minStars),
              repo_urls: repoURLs,
              fields: Array.from(selectedFields),
            });
          }
        }}
        disabled={submitting}
        className="w-full bg-slate-600 text-white hover:bg-slate-600/90 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
      >
        <Play size={13} /> {submitting ? "Queuing..." : "Run Pipeline"}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateGitHubDatasetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [meta, setMeta] = useState<Step1Form | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNext = (data: Step1Form) => {
    setMeta(data);
    setStep(2);
  };

  const handleRun = async (full: any) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/github-new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.id, ...full }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
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
          <FaGithub size={14} className="text-slate-400" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">GitHub Pipeline</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Create <span className="text-slate-400">GitHub</span> Dataset
        </h1>
        <p className="text-sm text-muted-foreground">Search repositories or import by URL from GitHub.</p>
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