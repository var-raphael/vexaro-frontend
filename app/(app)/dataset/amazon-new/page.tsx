"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FaAmazon } from "react-icons/fa";
import {
  ArrowRight, Play, Tag, AlertCircle, Moon,
  Globe, Lock, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { callBackend } from "@/lib/api";

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";

interface Step1Form {
  name: string;
  description: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
}

const MARKETPLACES = [
  { value: "com", label: "USA (amazon.com)" },
  { value: "co.uk", label: "UK (amazon.co.uk)" },
  { value: "de", label: "Germany (amazon.de)" },
  { value: "fr", label: "France (amazon.fr)" },
  { value: "it", label: "Italy (amazon.it)" },
  { value: "es", label: "Spain (amazon.es)" },
  { value: "nl", label: "Netherlands (amazon.nl)" },
  { value: "pl", label: "Poland (amazon.pl)" },
  { value: "se", label: "Sweden (amazon.se)" },
  { value: "ca", label: "Canada (amazon.ca)" },
  { value: "com.mx", label: "Mexico (amazon.com.mx)" },
  { value: "com.br", label: "Brazil (amazon.com.br)" },
  { value: "com.au", label: "Australia (amazon.com.au)" },
  { value: "co.jp", label: "Japan (amazon.co.jp)" },
  { value: "sg", label: "Singapore (amazon.sg)" },
  { value: "in", label: "India (amazon.in)" },
  { value: "com.tr", label: "Turkey (amazon.com.tr)" },
  { value: "ae", label: "UAE (amazon.ae)" },
  { value: "sa", label: "Saudi Arabia (amazon.sa)" },
  { value: "eg", label: "Egypt (amazon.eg)" },
];

const FIELD_GROUPS = [
  {
    group: "Core",
    fields: [
      { key: "title", label: "Title", default: true },
      { key: "brand", label: "Brand", default: true },
      { key: "description", label: "Description", default: false },
      { key: "bullet_points", label: "Bullet Points", default: false },
      { key: "manufacturer", label: "Manufacturer", default: false },
      { key: "store_url", label: "Store URL", default: false },
      { key: "asin", label: "ASIN", default: true },
      { key: "url", label: "Product URL", default: false },
      { key: "parent_asin", label: "Parent ASIN", default: false },
    ],
  },
  {
    group: "Pricing",
    fields: [
      { key: "price", label: "Price", default: true },
      { key: "price_buybox", label: "Buybox Price", default: false },
      { key: "price_strikethrough", label: "Strikethrough Price", default: false },
      { key: "currency", label: "Currency", default: true },
      { key: "pricing_count", label: "Pricing Count", default: false },
    ],
  },
  {
    group: "Availability",
    fields: [
      { key: "stock", label: "Stock", default: true },
      { key: "is_prime", label: "Is Prime", default: true },
      { key: "max_quantity", label: "Max Quantity", default: false },
      { key: "delivery", label: "Delivery Info", default: false },
    ],
  },
  {
    group: "Ratings & Reviews",
    fields: [
      { key: "rating", label: "Rating", default: true },
      { key: "reviews_count", label: "Reviews Count", default: true },
      { key: "reviews", label: "Top Reviews", default: false },
      { key: "rating_stars_distribution", label: "Star Distribution", default: false },
      { key: "answered_questions_count", label: "Q&A Count", default: false },
    ],
  },
  {
    group: "Product Info",
    fields: [
      { key: "product_details", label: "Product Details", default: false },
      { key: "product_dimensions", label: "Dimensions", default: false },
      { key: "category", label: "Category Ladder", default: false },
      { key: "sales_rank", label: "Sales Rank", default: false },
    ],
  },
  {
    group: "Images & Media",
    fields: [
      { key: "images", label: "Images", default: false },
      { key: "has_videos", label: "Has Videos", default: false },
    ],
  },
  {
    group: "Seller",
    fields: [
      { key: "buybox", label: "Buybox Sellers", default: false },
      { key: "featured_merchant", label: "Featured Merchant", default: false },
    ],
  },
  {
    group: "Variations",
    fields: [
      { key: "variations", label: "Variations", default: false },
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
      {required && <span className="text-amber-500 text-[10px]">*</span>}
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
                ? "bg-amber-500 border-amber-500 text-white"
                : step > n
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-accent border-border text-muted-foreground"
            )}>
              {n}
            </div>
            <span className={cn("text-xs font-mono", step === n ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < 1 && <div className={cn("w-8 h-px mx-1", step > 1 ? "bg-amber-500/40" : "bg-border")} />}
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
          placeholder="e.g. amazon-cookware-prices"
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-sm focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50",
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
          placeholder="What products are you tracking? What's the use case?"
          rows={3}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm resize-none focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50",
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
            placeholder="e.g. electronics, pricing, competitor"
            className="pl-8 bg-accent/30 border-border text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50"
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
                  ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                  : "bg-accent/20 border-border hover:border-amber-500/30"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                form.visibility === val
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                  : "bg-accent border-border text-muted-foreground"
              )}>
                <Icon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.visibility === val ? "text-amber-400" : "text-foreground")}>
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
                  ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                  : "bg-accent/20 border-border hover:border-amber-500/30"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5",
                form.nightly === val
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                  : "bg-accent border-border text-muted-foreground"
              )}>
                <Moon size={13} />
              </div>
              <div>
                <p className={cn("text-xs font-semibold", form.nightly === val ? "text-amber-400" : "text-foreground")}>
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
        className="w-full bg-amber-500 text-white hover:bg-amber-500/90 font-mono text-xs tracking-widest uppercase gap-2"
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
  const [marketplace, setMarketplace] = useState("com");
  const [asins, setAsins] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(DEFAULT_FIELDS));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Core", "Pricing", "Availability", "Ratings & Reviews"]));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parsedAsins = asins
    .split("\n")
    .map((l) => l.trim().toUpperCase())
    .filter((l) => /^[A-Z0-9]{10}$/.test(l));

  const invalidAsins = asins
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !/^[A-Z0-9]{10}$/i.test(l));

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
    const groupFields = FIELD_GROUPS.find((g) => g.group === group)?.fields.map((f) => f.key) ?? [];
    setSelectedFields((prev) => {
      const next = new Set(prev);
      groupFields.forEach((k) => next.add(k));
      return next;
    });
  };

  const clearGroup = (group: string) => {
    const groupFields = FIELD_GROUPS.find((g) => g.group === group)?.fields.map((f) => f.key) ?? [];
    setSelectedFields((prev) => {
      const next = new Set(prev);
      groupFields.forEach((k) => next.delete(k));
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (parsedAsins.length === 0) e.asins = "At least one valid ASIN is required";
    if (selectedFields.size === 0) e.fields = "Select at least one field";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-6">

      {/* Marketplace */}
      <div>
        <Label required>Marketplace</Label>
        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          className="w-full bg-accent/30 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/40"
        >
          {MARKETPLACES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* ASIN Import */}
      <div>
        <Label required>Import ASINs</Label>
        <p className="text-[11px] text-muted-foreground mb-2">One ASIN per line. ASINs are 10-character codes e.g. B09HN3Q81F</p>
        <Textarea
          value={asins}
          onChange={(e) => setAsins(e.target.value)}
          placeholder={"B09HN3Q81F\nB0BDHWDR12\nB08N5WRWNW"}
          rows={5}
          className={cn(
            "bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50",
            errors.asins && "border-destructive/50"
          )}
        />

        {invalidAsins.length > 0 && (
          <div className="mt-2 px-3 py-2.5 rounded-md border border-destructive/30 bg-destructive/5 space-y-1">
            <div className="flex items-center gap-1.5">
              <XCircle size={11} className="text-destructive shrink-0" />
              <p className="text-[11px] font-medium text-destructive">
                {invalidAsins.length} invalid {invalidAsins.length === 1 ? "ASIN" : "ASINs"} — must be 10 alphanumeric characters
              </p>
            </div>
            <div className="space-y-0.5 pl-4">
              {invalidAsins.slice(0, 3).map((a) => (
                <p key={a} className="text-[10px] font-mono text-destructive/70 truncate">{a}</p>
              ))}
              {invalidAsins.length > 3 && (
                <p className="text-[10px] text-destructive/50">+{invalidAsins.length - 3} more</p>
              )}
            </div>
          </div>
        )}

        {parsedAsins.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {parsedAsins.length} valid {parsedAsins.length === 1 ? "ASIN" : "ASINs"} queued
          </p>
        )}

        <FieldError msg={errors.asins} />
      </div>

      {/* Field Picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label required>Fields to Extract</Label>
          <span className="text-[11px] font-mono text-amber-500">{selectedFields.size} selected</span>
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
                    {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                    <span className="text-xs font-mono font-medium text-foreground">{group}</span>
                    <span className="text-[10px] font-mono text-amber-500/70">
                      {selectedInGroup}/{fields.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => allSelected ? clearGroup(group) : selectAllInGroup(group)}
                      className="text-[10px] font-mono text-muted-foreground hover:text-amber-400 transition-colors"
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
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                              : "bg-card border-border text-muted-foreground hover:border-amber-500/20 hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded-sm border shrink-0 flex items-center justify-center",
                            checked ? "bg-amber-500 border-amber-500" : "border-border"
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
              marketplace,
              asins: parsedAsins,
              fields: Array.from(selectedFields),
            });
          }
        }}
        disabled={submitting}
        className="w-full bg-amber-500 text-white hover:bg-amber-500/90 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
      >
        <Play size={13} /> {submitting ? "Queuing..." : "Run Pipeline"}
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateAmazonDatasetPage() {
  const router = useRouter();
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
      const res = await callBackend(`/amazon-new`, {
  method: "POST",
  body: JSON.stringify({ ...full }),
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
          <FaAmazon size={14} className="text-amber-500" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Amazon Pipeline</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Create <span className="text-amber-500">Amazon</span> Dataset
        </h1>
        <p className="text-sm text-muted-foreground">Track products, prices and reviews from any Amazon marketplace.</p>
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