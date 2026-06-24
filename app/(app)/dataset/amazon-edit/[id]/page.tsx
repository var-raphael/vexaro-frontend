"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FaAmazon } from "react-icons/fa";
import {
  Plus, Trash2, Globe, Lock, Moon, Tag,
  AlertCircle, Save, Loader2, Crown, DollarSign,
  RotateCcw, XCircle, ChevronDown, ChevronUp, Snowflake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { callBackend } from "@/lib/api";

type Visibility = "public" | "private";
type NightlyRefresh = "yes" | "no";
type DatasetStatus = "active" | "processing" | "frozen" | null;

interface ExistingASIN {
  dataset_url_id: number;
  url: string;
  queue_status: string;
  markedForDeletion: boolean;
}

interface EditForm {
  name: string;
  description: string;
  tag: string;
  visibility: Visibility;
  nightly: NightlyRefresh;
  newAsins: string;
  is_premium: boolean;
  price: number;
}

const FIELD_GROUPS = [
  {
    group: "Core",
    fields: [
      { key: "title", label: "Title" },
      { key: "brand", label: "Brand" },
      { key: "description", label: "Description" },
      { key: "bullet_points", label: "Bullet Points" },
      { key: "manufacturer", label: "Manufacturer" },
      { key: "store_url", label: "Store URL" },
      { key: "asin", label: "ASIN" },
      { key: "url", label: "Product URL" },
      { key: "parent_asin", label: "Parent ASIN" },
    ],
  },
  {
    group: "Pricing",
    fields: [
      { key: "price", label: "Price" },
      { key: "price_buybox", label: "Buybox Price" },
      { key: "price_strikethrough", label: "Strikethrough Price" },
      { key: "currency", label: "Currency" },
      { key: "pricing_count", label: "Pricing Count" },
    ],
  },
  {
    group: "Availability",
    fields: [
      { key: "stock", label: "Stock" },
      { key: "is_prime", label: "Is Prime" },
      { key: "max_quantity", label: "Max Quantity" },
      { key: "delivery", label: "Delivery Info" },
    ],
  },
  {
    group: "Ratings & Reviews",
    fields: [
      { key: "rating", label: "Rating" },
      { key: "reviews_count", label: "Reviews Count" },
      { key: "reviews", label: "Top Reviews" },
      { key: "rating_stars_distribution", label: "Star Distribution" },
      { key: "answered_questions_count", label: "Q&A Count" },
    ],
  },
  {
    group: "Product Info",
    fields: [
      { key: "product_details", label: "Product Details" },
      { key: "product_dimensions", label: "Dimensions" },
      { key: "category", label: "Category Ladder" },
      { key: "sales_rank", label: "Sales Rank" },
    ],
  },
  {
    group: "Images & Media",
    fields: [
      { key: "images", label: "Images" },
      { key: "has_videos", label: "Has Videos" },
    ],
  },
  {
    group: "Seller",
    fields: [
      { key: "buybox", label: "Buybox Sellers" },
      { key: "featured_merchant", label: "Featured Merchant" },
    ],
  },
  {
    group: "Variations",
    fields: [
      { key: "variations", label: "Variations" },
    ],
  },
];

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

function extractASIN(url: string): string {
  const parts = url.split("/dp/");
  if (parts.length < 2) return url;
  return parts[1].split("/")[0] ?? url;
}

// ── Locked State UI ───────────────────────────────────────────────────────────

function LockedState({ status }: { status: "processing" | "frozen" }) {
  const isProcessing = status === "processing";
  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <FaAmazon size={14} className="text-amber-500" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Amazon Pipeline</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Edit <span className="text-amber-500">Amazon</span> Dataset
        </h1>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl border flex items-center justify-center",
            isProcessing
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-blue-500/10 border-blue-500/30"
          )}>
            {isProcessing
              ? <Loader2 size={24} className="text-amber-500 animate-spin" />
              : <Snowflake size={24} className="text-blue-400" />
            }
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {isProcessing ? "Dataset is currently processing" : "Dataset is frozen"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {isProcessing
                ? "Editing is disabled. Please wait until processing completes."
                : "Unfreeze it from the dashboard before editing."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="mt-2 text-xs border-border text-muted-foreground hover:text-foreground"
          >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditAmazonDatasetPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const datasetId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [marketplace, setMarketplace] = useState<string>("com");
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus>(null);

  const [existingASINs, setExistingASINs] = useState<ExistingASIN[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Core", "Pricing", "Availability", "Ratings & Reviews"])
  );

  const [form, setForm] = useState<EditForm>({
    name: "",
    description: "",
    tag: "",
    visibility: "public",
    nightly: "yes",
    newAsins: "",
    is_premium: false,
    price: 9,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!datasetId) return;
    const fetch_ = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dataset/view?dataset_id=${datasetId}`
        );
        if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
        const data = await res.json();

        setMarketplace(data.marketplace ?? "com");
        setDatasetStatus(data.status ?? null);

        const mapped: ExistingASIN[] = (data.urls ?? []).map((u: any) => ({
          dataset_url_id: u.dataset_url_id,
          url: u.url,
          queue_status: u.queue_status,
          markedForDeletion: false,
        }));
        setExistingASINs(mapped);

        const schemaKeys = data.schema ? Object.keys(data.schema) : [];
        setSelectedFields(new Set(schemaKeys));

        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          tag: data.tag ?? "",
          visibility: data.visibility ?? "public",
          nightly: data.nightly === true ? "yes" : "no",
          newAsins: "",
          is_premium: data.is_premium ?? false,
          price: data.price ?? 9,
        });
      } catch (err: any) {
        setFetchError(err.message ?? "Could not load dataset.");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [datasetId]);

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setPremium = (val: boolean) =>
    setForm((p) => ({ ...p, is_premium: val, visibility: val ? "public" : p.visibility }));

  const toggleASINDeletion = (id: number) =>
    setExistingASINs((prev) =>
      prev.map((a) => a.dataset_url_id === id ? { ...a, markedForDeletion: !a.markedForDeletion } : a)
    );

  const toggleField = (key: string) =>
    setSelectedFields((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleGroup = (group: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });

  const selectAllInGroup = (group: string) => {
    const keys = FIELD_GROUPS.find((g) => g.group === group)?.fields.map((f) => f.key) ?? [];
    setSelectedFields((prev) => { const n = new Set(prev); keys.forEach((k) => n.add(k)); return n; });
  };

  const clearGroup = (group: string) => {
    const keys = FIELD_GROUPS.find((g) => g.group === group)?.fields.map((f) => f.key) ?? [];
    setSelectedFields((prev) => { const n = new Set(prev); keys.forEach((k) => n.delete(k)); return n; });
  };

  const parsedNewASINs = form.newAsins
    .split("\n")
    .map((l) => l.trim().toUpperCase())
    .filter((l) => /^[A-Z0-9]{10}$/.test(l));

  const invalidNewASINs = form.newAsins
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !/^[A-Z0-9]{10}$/i.test(l));

  const markedCount = existingASINs.filter((a) => a.markedForDeletion).length;
  const activeCount = existingASINs.length - markedCount;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Dataset name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (selectedFields.size === 0) e.fields = "Select at least one field";
    if (form.is_premium && form.price < 1) e.price = "Price must be at least $1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const urlsToDelete = existingASINs
      .filter((a) => a.markedForDeletion)
      .map((a) => a.dataset_url_id);

    try {
      const res = await callBackend(`/dataset/amazon/edit`, {
        method: "PATCH",
        body: JSON.stringify({
          dataset_id: Number(datasetId),
          alias: form.name,
          description: form.description,
          tag: form.tag,
          visibility: form.visibility,
          nightly: form.nightly,
          fields: Array.from(selectedFields),
          new_asins: parsedNewASINs,
          urls_to_delete: urlsToDelete,
          is_premium: form.is_premium,
          price: form.is_premium ? form.price : 0,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }
      router.push(`/dataset/web-view/${datasetId}`);
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-8 py-10 flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={22} className="animate-spin text-amber-500" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Loading dataset...</p>
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

  // ── Locked states ──────────────────────────────────────────────────────────

  if (datasetStatus === "processing") return <LockedState status="processing" />;
  if (datasetStatus === "frozen") return <LockedState status="frozen" />;

  return (
    <div className="max-w-2xl mx-auto px-5 md:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <FaAmazon size={14} className="text-amber-500" />
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Amazon Pipeline</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1">
          Edit <span className="text-amber-500">Amazon</span> Dataset
        </h1>
        <p className="text-sm text-muted-foreground">Update your dataset configuration and pipeline settings.</p>
      </div>

      {submitError && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
          <AlertCircle size={13} /> {submitError}
        </div>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">

          {/* Dataset Name */}
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

          {/* Description */}
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

          {/* Tag */}
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

          {/* Marketplace — read only */}
          <div>
            <Label>Marketplace</Label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border bg-accent/20">
              <FaAmazon size={12} className="text-amber-500 shrink-0" />
              <span className="text-sm text-foreground font-mono">amazon.{marketplace}</span>
              <span className="ml-auto text-[10px] text-muted-foreground border border-border bg-accent/30 rounded px-1.5 py-0.5">locked</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Marketplace cannot be changed after creation.</p>
          </div>

          {/* Premium toggle — admin only */}
          {user?.is_admin && (
            <div className={cn(
              "rounded-lg border p-4 space-y-4 transition-colors",
              form.is_premium ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-accent/10"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown size={14} className={form.is_premium ? "text-yellow-400" : "text-muted-foreground"} />
                  <div>
                    <p className={cn("text-xs font-semibold", form.is_premium ? "text-yellow-400" : "text-foreground")}>
                      Premium Dataset
                    </p>
                    <p className="text-[11px] text-muted-foreground">Charge users a one-time fee to clone.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-accent border border-border rounded-md p-0.5">
                  {["Off", "On"].map((label) => {
                    const active = label === "On" ? form.is_premium : !form.is_premium;
                    return (
                      <button
                        key={label}
                        onClick={() => setPremium(label === "On")}
                        className={cn(
                          "px-3 py-1 text-xs rounded transition-colors",
                          active
                            ? "bg-background border border-border shadow-sm " + (label === "On" ? "text-yellow-400" : "text-foreground")
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {form.is_premium && (
                <div>
                  <Label required>Price (USD)</Label>
                  <div className="relative max-w-[160px]">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      value={form.price}
                      onChange={(e) => set("price", Number(e.target.value))}
                      className="pl-8 bg-background border-border text-foreground text-sm focus-visible:ring-yellow-500/40 focus-visible:border-yellow-500/50"
                    />
                  </div>
                  <FieldError msg={errors.price} />
                  <p className="text-[11px] text-muted-foreground mt-1">One-time payment. Dataset will be set to public.</p>
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
                      ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "bg-accent/20 border-border hover:border-amber-500/30",
                    form.is_premium && val === "private" && "opacity-30 cursor-not-allowed"
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
                      {form.is_premium && val === "private" && (
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">(locked)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Nightly Refresh */}
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
                  onClick={() => set("nightly", val as NightlyRefresh)}
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
                    <p className={cn("text-xs font-semibold", form.nightly === val ? "text-amber-400" : "text-foreground")}>{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Existing ASINs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Current ASINs</Label>
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
            {existingASINs.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 rounded-lg border border-border bg-accent/10 text-muted-foreground text-xs">
                No ASINs attached to this dataset.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {existingASINs.map((a) => (
                  <div
                    key={a.dataset_url_id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all duration-150",
                      a.markedForDeletion
                        ? "bg-destructive/5 border-destructive/30 opacity-60"
                        : "bg-accent/20 border-border hover:border-amber-500/20"
                    )}
                  >
                    <FaAmazon size={11} className={cn("shrink-0", a.markedForDeletion ? "text-destructive/60" : "text-amber-500/60")} />
                    <span
                      className={cn("flex-1 font-mono truncate", a.markedForDeletion ? "line-through text-muted-foreground" : "text-foreground")}
                      title={a.url}
                    >
                      {extractASIN(a.url)}
                    </span>
                    <span className={cn(
                      "shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border",
                      a.queue_status === "done"
                        ? "border-emerald-500/20 text-emerald-400/70 bg-emerald-500/5"
                        : a.queue_status === "failed"
                        ? "border-red-500/20 text-red-400/70 bg-red-500/5"
                        : "border-yellow-500/20 text-yellow-400/70 bg-yellow-500/5"
                    )}>
                      {a.queue_status}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleASINDeletion(a.dataset_url_id)}
                      className={cn(
                        "shrink-0 h-6 w-6 flex items-center justify-center rounded border transition-colors",
                        a.markedForDeletion
                          ? "border-amber-500/40 text-amber-400 hover:border-amber-500/70 bg-amber-500/5"
                          : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                      )}
                      title={a.markedForDeletion ? "Restore" : "Mark for removal"}
                    >
                      {a.markedForDeletion ? <RotateCcw size={11} /> : <Trash2 size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {markedCount > 0 && (
              <p className="text-[11px] text-destructive/70 mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> {markedCount} ASIN{markedCount > 1 ? "s" : ""} will be removed on save.
              </p>
            )}
          </div>

          {/* Add New ASINs */}
          <div>
            <Label>Add New ASINs</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              One ASIN per line. ASINs are 10-character codes e.g. B09HN3Q81F
            </p>
            <Textarea
              value={form.newAsins}
              onChange={(e) => set("newAsins", e.target.value)}
              placeholder={"B09HN3Q81F\nB0BDHWDR12"}
              rows={4}
              className="bg-accent/30 border-border text-foreground placeholder:text-muted-foreground font-mono text-xs resize-none focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50"
            />
            {invalidNewASINs.length > 0 && (
              <div className="mt-2 px-3 py-2.5 rounded-md border border-destructive/30 bg-destructive/5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <XCircle size={11} className="text-destructive shrink-0" />
                  <p className="text-[11px] font-medium text-destructive">
                    {invalidNewASINs.length} invalid {invalidNewASINs.length === 1 ? "ASIN" : "ASINs"} — must be 10 alphanumeric characters
                  </p>
                </div>
                <div className="space-y-0.5 pl-4">
                  {invalidNewASINs.slice(0, 3).map((a) => (
                    <p key={a} className="text-[10px] font-mono text-destructive/70 truncate">{a}</p>
                  ))}
                  {invalidNewASINs.length > 3 && (
                    <p className="text-[10px] text-destructive/50">+{invalidNewASINs.length - 3} more</p>
                  )}
                </div>
              </div>
            )}
            {parsedNewASINs.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {parsedNewASINs.length} valid {parsedNewASINs.length === 1 ? "ASIN" : "ASINs"} will be added
              </p>
            )}
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
                        {isExpanded
                          ? <ChevronUp size={12} className="text-muted-foreground" />
                          : <ChevronDown size={12} className="text-muted-foreground" />
                        }
                        <span className="text-xs font-mono font-medium text-foreground">{group}</span>
                        <span className="text-[10px] font-mono text-amber-500/70">{selectedInGroup}/{fields.length}</span>
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

          <div className="h-px bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 font-mono text-xs tracking-widest uppercase border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 bg-amber-500 text-white hover:bg-amber-500/90 font-mono text-xs tracking-widest uppercase gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <><Loader2 size={13} className="animate-spin" /> Saving...</>
              ) : (
                <><Save size={13} /> Save Changes</>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}