"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight, Play, Tag, AlertCircle, Moon,
  Globe, Lock, ChevronDown, ChevronUp, List, Search, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";
type InputMethod = "search" | "ids" | "lists";

interface Step1Form {
  name: string;
  description: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
}

const HN_LISTS = [
  { value: "top", label: "Top", desc: "Up to 500 top stories" },
  { value: "new", label: "New", desc: "Up to 500 newest stories" },
  { value: "best", label: "Best", desc: "Best ranked stories" },
  { value: "ask", label: "Ask HN", desc: "Up to 200 Ask HN posts" },
  { value: "show", label: "Show HN", desc: "Up to 200 Show HN posts" },
  { value: "jobs", label: "Jobs", desc: "Up to 200 job listings" },
];

const FIELD_GROUPS = [
  {
    group: "Core",
    fields: [
      { key: "id", label: "Story ID", default: true },
      { key: "title", label: "Title", default: true },
      { key: "url", label: "URL", default: true },
      { key: "score", label: "Score (Points)", default: true },
      { key: "author", label: "Author", default: true },
      { key: "comment_count", label: "Comment Count", default: true },
      { key: "timestamp", label: "Timestamp", default: true },
      { key: "story_type", label: "Story Type", default: true },
    ],
  },
  {
    group: "Content",
    fields: [
      { key: "text", label: "Post Text", default: false },
    ],
  },
  {
    group: "Domain",
    fields: [
      { key: "domain", label: "Extracted Domain", default: false },
    ],
  },
  {
    group: "Author",
    fields: [
      { key: "author_karma", label: "Author Karma", default: false },
      { key: "author_account_age", label: "Account Age", default: false },
    ],
  },
];

const DEFAULT_FIELDS = FIELD_GROUPS.flatMap((g) =>
  g.fields.filter((f) => f.default).map((f) => f.key)
);

const HN_ORANGE = "#FF6600";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase flex items-center gap-1 mb-1.5">
      {children}
      {required && <span className="text-[10px]" style={{ color: HN_ORANGE }}>*</span>}
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
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border transition-all",
                step === n
                  ? "text-white"
                  : step > n
                  ? "text-[#FF6600] bg-transparent"
                  : "bg-accent border-border text-muted-foreground"
              )}
              style={
                step === n
                  ? { backgroundColor: HN_ORANGE, borderColor: HN_ORANGE }
                  : step > n
                  ? { borderColor: `${HN_ORANGE}66`, backgroundColor: `${HN_ORANGE}22` }
                  : {}
              }
            >
              {n}
            </div>
            <span className={cn("text-xs font-mono", step === n ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < 1 && (
            <div
              className="w-8 h-px mx-1"
              style={step > 1 ? { backgroundColor: `${HN_ORANGE}66` } : { backgroundColor: "var(--border)" }}
            />
          )}
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

  const hnFocus = "focus-visible:ring-[#FF6600]/40 focus-visible:border-[#FF6600]/50";
  const hnSelected = (active: boolean) =>
    active
      ? "bg-[#FF6600]/10 border-[#FF6600]/50 shadow-[0_0_12px_rgba(255,102,0,0.1)]"
      : "bg-accent/20 border-border hover:border-[#FF6600]/30";

  return (
    <div className="space-y-6">
      <div>
        <Label required>Dataset Name</Label>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. hn-ai-trending"
          className={cn(
            `bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm ${hnFocus}`,
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
          placeholder="What stories are you tracking? What's the use case?"
          rows={3}
          className={cn(
            `bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none ${hnFocus}`,
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
            placeholder="e.g. tech, ai, startups"
            className={`pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm ${hnFocus}`}
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
              className={cn("flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150", hnSelected(form.visibility === val))}
            >
              <div
                className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                style={
                  form.visibility === val
                    ? { backgroundColor: `${HN_ORANGE}26`, borderColor: `${HN_ORANGE}66`, color: HN_ORANGE }
                    : {}
                }
              >
                {form.visibility !== val && <Icon size={13} className="text-muted-foreground" />}
                {form.visibility === val && <Icon size={13} />}
              </div>
              <div>
                <p className="text-xs font-semibold" style={form.visibility === val ? { color: HN_ORANGE } : {}}>
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
              className={cn("flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150", hnSelected(form.nightly === val))}
            >
              <div
                className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
                style={
                  form.nightly === val
                    ? { backgroundColor: `${HN_ORANGE}26`, borderColor: `${HN_ORANGE}66`, color: HN_ORANGE }
                    : {}
                }
              >
                <Moon size={13} className={form.nightly === val ? "" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={form.nightly === val ? { color: HN_ORANGE } : {}}>
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
        className="w-full text-white font-mono text-xs tracking-widest uppercase gap-2"
        style={{ backgroundColor: HN_ORANGE }}
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
  const [inputMethod, setInputMethod] = useState<InputMethod>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [storyIds, setStoryIds] = useState("");
  const [selectedList, setSelectedList] = useState<string>("top");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_FIELDS));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Core"]));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hnFocus = "focus-visible:ring-[#FF6600]/40 focus-visible:border-[#FF6600]/50";

  const parsedIds = storyIds
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^\d+$/.test(l));

  const invalidIds = storyIds
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !/^\d+$/.test(l));

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
    if (inputMethod === "search" && !searchQuery.trim()) {
      e.search = "Search query is required";
    }
    if (inputMethod === "ids" && parsedIds.length === 0) {
      e.ids = "At least one valid story ID is required";
    }
    if (inputMethod === "lists" && !selectedList) {
      e.lists = "Select a list";
    }
    if (selectedFields.size === 0) {
      e.fields = "Select at least one field";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const INPUT_METHODS = [
    { val: "search", label: "Search", icon: Search, desc: "Algolia-powered keyword search" },
    { val: "ids", label: "Story IDs", icon: Hash, desc: "Paste specific story IDs" },
    { val: "lists", label: "Lists", icon: List, desc: "Top, New, Best, Ask, Show, Jobs" },
  ];

  return (
    <div className="space-y-6">

      {/* Input Method Selector */}
      <div>
        <Label required>Input Method</Label>
        <div className="grid grid-cols-3 gap-2">
          {INPUT_METHODS.map(({ val, label, icon: Icon, desc }) => {
            const active = inputMethod === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setInputMethod(val as InputMethod)}
                className={cn(
                  "flex flex-col items-start gap-1.5 p-3 rounded-lg border text-left transition-all duration-150",
                  active
                    ? "bg-[#FF6600]/10 border-[#FF6600]/50 shadow-[0_0_12px_rgba(255,102,0,0.1)]"
                    : "bg-accent/20 border-border hover:border-[#FF6600]/30"
                )}
              >
                <div
                  className="w-6 h-6 rounded-md border flex items-center justify-center"
                  style={
                    active
                      ? { backgroundColor: `${HN_ORANGE}26`, borderColor: `${HN_ORANGE}66`, color: HN_ORANGE }
                      : {}
                  }
                >
                  <Icon size={11} className={active ? "" : "text-muted-foreground"} />
                </div>
                <p className="text-xs font-semibold" style={active ? { color: HN_ORANGE } : {}}>
                  {label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      {inputMethod === "search" && (
        <div className="space-y-3">
          <div>
            <Label required>Search Query</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. large language models"
              className={cn(
                `bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm ${hnFocus}`,
                errors.search && "border-destructive"
              )}
            />
            <FieldError msg={errors.search} />
          </div>
          <div>
            <Label>Sort By</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "relevance", label: "Relevance", desc: "Best match first" },
                { val: "date", label: "Date", desc: "Most recent first" },
              ].map(({ val, label, desc }) => {
                const active = sortBy === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSortBy(val as "relevance" | "date")}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all duration-150",
                      active
                        ? "bg-[#FF6600]/10 border-[#FF6600]/50"
                        : "bg-accent/20 border-border hover:border-[#FF6600]/30"
                    )}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={active ? { color: HN_ORANGE } : {}}>
                        {label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Story IDs */}
      {inputMethod === "ids" && (
        <div>
          <Label required>Story IDs</Label>
          <p className="text-[11px] text-muted-foreground mb-2">One numeric story ID per line. Found in the HN post URL.</p>
          <Textarea
            value={storyIds}
            onChange={(e) => setStoryIds(e.target.value)}
            placeholder={"43752090\n43748234\n43741100"}
            rows={5}
            className={cn(
              `bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none ${hnFocus}`,
              errors.ids && "border-destructive/50"
            )}
          />
          {invalidIds.length > 0 && (
            <div className="mt-2 px-3 py-2.5 rounded-md border border-destructive/30 bg-destructive/5 space-y-1">
              <p className="text-[11px] font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle size={11} />
                {invalidIds.length} invalid {invalidIds.length === 1 ? "ID" : "IDs"} — must be numeric only
              </p>
              <div className="space-y-0.5 pl-4">
                {invalidIds.slice(0, 3).map((id) => (
                  <p key={id} className="text-[10px] font-mono text-destructive/70 truncate">{id}</p>
                ))}
                {invalidIds.length > 3 && (
                  <p className="text-[10px] text-destructive/50">+{invalidIds.length - 3} more</p>
                )}
              </div>
            </div>
          )}
          {parsedIds.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {parsedIds.length} valid {parsedIds.length === 1 ? "ID" : "IDs"} queued
            </p>
          )}
          <FieldError msg={errors.ids} />
        </div>
      )}

      {/* Lists */}
      {inputMethod === "lists" && (
        <div>
          <Label required>Select List</Label>
          <p className="text-[11px] text-muted-foreground mb-2">
            Each list returns up to 200–500 stories from the official HN Firebase API.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HN_LISTS.map(({ value, label, desc }) => {
              const active = selectedList === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedList(value)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all duration-150",
                    active
                      ? "bg-[#FF6600]/10 border-[#FF6600]/50 shadow-[0_0_12px_rgba(255,102,0,0.08)]"
                      : "bg-accent/20 border-border hover:border-[#FF6600]/30"
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold" style={active ? { color: HN_ORANGE } : {}}>
                      {label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedList === "jobs" && (
            <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: `${HN_ORANGE}cc` }}>
              <AlertCircle size={11} />
              Score and comment count are not available for job stories.
            </p>
          )}
          <FieldError msg={errors.lists} />
        </div>
      )}

      {/* Field Picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label required>Fields to Extract</Label>
          <span className="text-[11px] font-mono" style={{ color: HN_ORANGE }}>
            {selectedFields.size} selected
          </span>
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
                    <span className="text-[10px] font-mono" style={{ color: `${HN_ORANGE}99` }}>
                      {selectedInGroup}/{fields.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => allSelected ? clearGroup(group) : selectAllInGroup(group)}
                      className="text-[10px] font-mono text-muted-foreground transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.color = HN_ORANGE)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
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
                              ? "bg-[#FF6600]/10 border-[#FF6600]/40 text-[#FF6600]"
                              : "bg-card border-border text-muted-foreground hover:border-[#FF6600]/20 hover:text-foreground"
                          )}
                        >
                          <div
                            className="w-3 h-3 rounded-sm border shrink-0 flex items-center justify-center"
                            style={checked ? { backgroundColor: HN_ORANGE, borderColor: HN_ORANGE } : {}}
                          >
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
              input_method: inputMethod,
              search_query: inputMethod === "search" ? searchQuery.trim() : "",
              sort_by: inputMethod === "search" ? sortBy : "",
              story_ids: inputMethod === "ids" ? parsedIds : [],
              lists: inputMethod === "lists" ? [selectedList] : [],
              fields: Array.from(selectedFields),
            });
          }
        }}
        disabled={submitting}
        className="w-full text-white font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
        style={{ backgroundColor: HN_ORANGE }}
      >
        <Play size={13} /> {submitting ? "Queuing..." : "Run Pipeline"}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateHNDatasetPage() {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hn-new`, {
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
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect width="14" height="14" rx="2" fill="#FF6600" />
            <text x="7" y="11" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">Y</text>
          </svg>
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Hacker News Pipeline</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Create <span style={{ color: HN_ORANGE }}>HN</span> Dataset
        </h1>
        <p className="text-sm text-muted-foreground">Search stories, import by ID, or pull from HN lists.</p>
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