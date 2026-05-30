// app/profile/[username]/ProfileClient.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Calendar, GitBranch, Database, Zap, ExternalLink,
  Crown, Sparkles, Lock, MessageSquare, Clock,
  TrendingUp, Newspaper, Trophy, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileUser {
  user_id: string;
  username: string;
  bio: string;
  joined_at: string;
  is_admin: boolean;
  info_text: string;
}

interface ProfileStats {
  public_datasets: number;
  clones_received: number;
  versions_saved: number;
  total_api_hits: number;
}

interface ProfileDataset {
  dataset_id: number;
  name: string;
  description: string;
  tag: string;
  visibility: "public" | "private";
  is_premium: boolean;
  price: number;
  clone_count: number;
  api_hit_count: number;
  active_version: number;
  created_at: string;
  dataset_type: "web" | "reddit";
  has_alt: boolean;
  entity_count: number;
}

interface InitialData {
  user: ProfileUser;
  stats: ProfileStats;
  datasets: ProfileDataset[];
}

interface Props {
  initialData: InitialData;
  username: string;
}

// ── Tag colors ────────────────────────────────────────────────────────────────

const TAG_PALETTES = [
  "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  "text-lime-400 bg-lime-500/10 border-lime-500/20",
  "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
];

function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_PALETTES[Math.abs(hash) % TAG_PALETTES.length];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatHits(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── Bio renderer — turns plain-text URLs into clickable links ─────────────────

function BioText({ text }: { text: string }) {
  if (!text) return null;

  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRe);

  return (
    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
      {parts.map((part, i) =>
        urlRe.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// ── Unlock Modal ──────────────────────────────────────────────────────────────

function UnlockModal({
  dataset,
  open,
  onClose,
}: {
  dataset: ProfileDataset | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dataset) return null;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/dataset/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_dataset_id: dataset.dataset_id,
          user_id: user?.id,
          name: dataset.name,
          description: dataset.description,
          tag: dataset.tag,
          nightly: "yes",
          visibility: "private",
          is_premium_clone: true,
          payment_ref: `test-ref-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError("Clone failed. Try again.");
        setLoading(false);
        return;
      }

      onClose();
      window.location.href =
        dataset.dataset_type === "reddit"
          ? `/dataset/reddit-view/${data.new_dataset_id}`
          : `/dataset/web-view/${data.new_dataset_id}`;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-mono text-foreground">
            <Crown size={14} className="text-yellow-400" />
            Unlock Premium Dataset
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md p-4 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono font-medium text-foreground">
                {dataset.name}
              </p>
              {dataset.has_alt && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Sparkles size={9} /> alt
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {dataset.description}
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <GitBranch size={10} /> v{dataset.active_version}
              </span>
              <span className="flex items-center gap-1">
                <Database size={10} />{" "}
                {dataset.entity_count.toLocaleString()}{" "}
                {dataset.dataset_type === "reddit" ? "posts" : "entities"}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-[11px] uppercase tracking-wider">
              What you get:
            </p>
            {[
              "Full access to view all dataset records",
              "Clone to your account (private)",
              "All future versions included",
              "One-time payment, no subscription",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">✦</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border/40">
            <span className="text-xs text-muted-foreground">One-time price</span>
            <span className="text-lg font-bold text-yellow-400">
              ${dataset.price}
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border text-sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1 relative overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" /> Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Lock size={13} /> Pay ${dataset.price}
                </span>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Dataset Card ──────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  Crypto: TrendingUp,
  News: Newspaper,
  Sports: Trophy,
  Tech: Zap,
};

function DatasetCard({
  dataset,
  isOwner,
  onUnlock,
}: {
  dataset: ProfileDataset;
  isOwner: boolean;
  onUnlock: (d: ProfileDataset) => void;
}) {
  const viewHref =
    dataset.dataset_type === "reddit"
      ? `/dataset/reddit-view/${dataset.dataset_id}`
      : `/dataset/web-view/${dataset.dataset_id}`;

  const showPremiumButton = dataset.is_premium && !isOwner;

  // derive an icon from the first tag
  const firstTag = dataset.tag.split(",")[0]?.trim() ?? "";
  const Icon = TYPE_ICON[firstTag] ?? (dataset.dataset_type === "reddit" ? MessageSquare : Database);

  return (
    <Card
      className={cn(
        "bg-card border-border hover:border-primary/30 transition-all hover:-translate-y-0.5 duration-150 group flex flex-col",
        dataset.is_premium && "hover:border-yellow-500/30"
      )}
    >
      <CardContent className="p-5 flex flex-col h-full">

        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-md bg-accent border border-border flex items-center justify-center text-primary shrink-0 group-hover:border-primary/40 transition-colors">
              <Icon size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <p className="text-sm font-mono font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {dataset.name}
                </p>
                {dataset.is_premium && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded-full shrink-0">
                    <Crown size={9} /> PREMIUM
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                    dataset.dataset_type === "reddit"
                      ? "text-orange-400/80 bg-orange-500/10 border-orange-500/20"
                      : "text-sky-400/80 bg-sky-500/10 border-sky-500/20"
                  )}
                >
                  {dataset.dataset_type}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary">
                  v{dataset.active_version}
                </span>
                {dataset.has_alt && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-400">
                    <Sparkles size={9} /> alt
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1 line-clamp-2">
          {dataset.description}
        </p>

        {/* Tags */}
        {dataset.tag && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {dataset.tag
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                    tagColor(t)
                  )}
                >
                  {t}
                </span>
              ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4 flex-wrap">
          <span className="flex items-center gap-1">
            {dataset.dataset_type === "reddit" ? (
              <MessageSquare size={10} />
            ) : (
              <Database size={10} />
            )}
            {dataset.entity_count.toLocaleString()}{" "}
            {dataset.dataset_type === "reddit" ? "posts" : "entities"}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch size={10} /> {dataset.clone_count} clones
          </span>
          <span className="flex items-center gap-1">
            <Zap size={10} /> {formatHits(dataset.api_hit_count)} hits
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={10} /> {formatDate(dataset.created_at)}
          </span>
        </div>

        {/* Action */}
        {showPremiumButton ? (
          <button
            onClick={() => onUnlock(dataset)}
            className="w-full relative overflow-hidden rounded-md px-4 py-2 text-sm font-semibold text-black bg-yellow-400 hover:bg-yellow-300 transition-colors"
          >
            <span className="flex items-center justify-center gap-1.5">
              <Lock size={13} /> Unlock for ${dataset.price}
            </span>
          </button>
        ) : (
          <Link href={viewHref}>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs border-border hover:border-primary hover:text-primary bg-transparent"
            >
              <ExternalLink size={11} className="mr-1" /> View
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileUser;
  onSaved: (updated: Partial<ProfileUser>) => void;
}) {
  const { user } = useAuth();
  const [bio, setBio] = useState(profile.bio ?? "");
  const [infoText, setInfoText] = useState(profile.info_text ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8080/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          bio: bio.trim(),
          info_text: infoText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError("Save failed. Try again.");
        setSaving(false);
        return;
      }

      onSaved({ bio: data.bio, info_text: data.info_text });
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono text-foreground">
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Bio
              <span className="ml-1 text-muted-foreground/50">
                (plain text — URLs become clickable)
              </span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world what you build..."
              rows={4}
              maxLength={500}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-[11px] text-muted-foreground/50 text-right">
              {bio.length}/500
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Extended bio
              <span className="ml-1 text-muted-foreground/50">(optional)</span>
            </label>
            <textarea
              value={infoText}
              onChange={(e) => setInfoText(e.target.value)}
              placeholder="More about you, your work, your projects..."
              rows={5}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertTriangle size={12} /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-border text-sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfileClient({ initialData, username }: Props) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileUser>(initialData.user);
  const [stats] = useState<ProfileStats>(initialData.stats);
  const [datasets] = useState<ProfileDataset[]>(initialData.datasets);

  const [unlockTarget, setUnlockTarget] = useState<ProfileDataset | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const isOwner = user?.username === username;

  const initials = profile.username
    .slice(0, 2)
    .toUpperCase();

  function handleUnlock(dataset: ProfileDataset) {
    setUnlockTarget(dataset);
    setUnlockOpen(true);
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-10">

        {/* Profile header */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="w-20 h-20 border-2 border-border shrink-0">
                <AvatarFallback className="bg-accent text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                      {profile.username}
                    </h1>
                    <p className="text-sm font-mono text-primary">
                      @{profile.username}
                    </p>
                  </div>

                  {isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditOpen(true)}
                      className="border-border hover:border-primary hover:text-primary bg-transparent text-xs"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Bio with clickable links */}
                {profile.bio && <BioText text={profile.bio} />}

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar size={13} /> Joined {formatDate(profile.joined_at)}
                  </span>
                  {profile.is_admin && (
                    <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded-full">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Public Datasets", value: stats.public_datasets,   icon: Database },
            { label: "Clones received", value: stats.clones_received,   icon: GitBranch },
            { label: "Versions saved",  value: stats.versions_saved,    icon: GitBranch },
            { label: "API hits",        value: formatHits(stats.total_api_hits), icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <Card
              key={label}
              className="bg-card border-border hover:border-primary/30 transition-colors group"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-accent border border-border flex items-center justify-center text-primary shrink-0 group-hover:border-primary/40 transition-colors">
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-foreground">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Datasets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Public Datasets · {datasets.length}
            </p>
            <Link
              href="/public-data"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Browse all <ExternalLink size={11} />
            </Link>
          </div>

          {datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Database size={28} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No public datasets yet
              </p>
              <p className="text-xs text-muted-foreground">
                {isOwner
                  ? "Create your first dataset to show it here."
                  : "This user hasn't published any datasets yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {datasets.map((d) => (
                <DatasetCard
                  key={d.dataset_id}
                  dataset={d}
                  isOwner={isOwner}
                  onUnlock={handleUnlock}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <UnlockModal
        dataset={unlockTarget}
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
      />

      {isOwner && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={(updated) =>
            setProfile((prev) => ({ ...prev, ...updated }))
          }
        />
      )}
    </>
  );
}