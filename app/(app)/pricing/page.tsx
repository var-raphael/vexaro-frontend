"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Check, Loader2, Sparkles, Clock, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { callBackend } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BillingStatus {
  plan: string;
  plan_name: string;
  datasets: number;
  urls: number;
  serp: number;
  ping_url: boolean;
  webhook: boolean;
  pending_plan: string | null;
  expires_at: string | null;
}

interface PaystackTransaction {
  reference: string;
  trxref: string;
  status: string;
  message: string;
  transaction: string;
  trans: string;
}

declare global {
  interface Window {
    PaystackPop?: new () => {
      newTransaction: (config: {
        key: string;
        email: string;
        amount: number;
        reference?: string;
        currency?: string;
        channels?: string[];
        metadata?: Record<string, unknown>;
        onSuccess?: (transaction: { reference: string }) => void;
        onCancel?: () => void;
        onError?: (error: { message: string }) => void;
      }) => { id: string };
    };
  }
}

// ── Static plan content (display only — backend is source of truth for limits) ─
// Approx NGN equivalent shown to users for transparency — update periodically.
const STARTER_NGN_DISPLAY = "₦26,000";

const PLAN_DISPLAY = {
  free: {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    ngnNote: null,
    desc: "For exploration and testing only.",
    features: [
      "1 dataset",
      "20 URLs per dataset",
      "10 Serper-discovered URLs per dataset",
      "Nightly automatic refresh",
      "MCP access included",
      "Full diff viewer & one-click rollback",
      "Full marketplace access",
      "Community support only",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/mo",
    ngnNote: `≈ ${STARTER_NGN_DISPLAY} charged in NGN`,
    desc: "For builders who need live, versioned web data without managing infrastructure.",
    features: [
      "5 datasets",
      "100 URLs per dataset",
      "40 Serper-discovered URLs per dataset",
      "Nightly automatic refresh",
      "On-demand refresh via ping URL",
      "Webhook notifications on refresh",
      "MCP access included",
      "Full diff viewer & one-click rollback",
      "Email support",
    ],
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: "Coming Soon",
    period: "",
    ngnNote: null,
    desc: "For teams and startups running serious data pipelines.",
    features: [
      "Unlimited datasets",
      "500 URLs per dataset",
      "100 Serper-discovered URLs per dataset",
      "Everything in Starter",
      "Priority crawling queue",
      "Custom refresh schedules",
      "Dedicated support",
    ],
  },
} as const;

// Naira amount Paystack actually charges for Starter, in kobo (26000 * 100).
// Keep in sync with backend Plans["starter"].Price.
const STARTER_AMOUNT_KOBO = 26000 * 100;

// ── Toast (lightweight, local) ───────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
  const show = useCallback((kind: "success" | "error", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);
  return { toast, show, dismiss: () => setToast(null) };
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: { kind: "success" | "error"; msg: string } | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;
  return (
    <div className="fixed top-4 right-4 z-[60] max-w-sm">
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm",
          toast.kind === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
        )}
      >
        {toast.kind === "success" ? (
          <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        ) : (
          <X size={15} className="mt-0.5 shrink-0" />
        )}
        <p className="text-xs leading-relaxed">{toast.msg}</p>
        <button onClick={onDismiss} className="ml-auto text-current opacity-60 hover:opacity-100">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Confirm modal for downgrade ──────────────────────────────────────────────

function DowngradeConfirmModal({
  expiresAt,
  onConfirm,
  onCancel,
  loading,
}: {
  expiresAt: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const dateLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "the end of your current billing period";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <Card className="bg-card border-border w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/10">
              <Clock size={16} className="text-amber-400" />
            </div>
            <p className="font-semibold text-foreground text-sm">Cancel Starter plan?</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You'll keep Starter access until <span className="text-foreground font-medium">{dateLabel}</span>.
            After that, your account switches to Free automatically and any datasets over the
            Free plan's limit will be frozen.
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={loading} className="flex-1 text-xs border-border">
              Keep Starter
            </Button>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 text-xs bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : "Confirm Cancel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

type PlanKey = keyof typeof PLAN_DISPLAY;

function PlanCard({
  planKey,
  currentPlan,
  pendingPlan,
  expiresAt,
  highlight = false,
  onUpgrade,
  onDowngradeClick,
  busy,
}: {
  planKey: PlanKey;
  currentPlan: string;
  pendingPlan: string | null;
  expiresAt: string | null;
  highlight?: boolean;
  onUpgrade: (planId: string) => void;
  onDowngradeClick: () => void;
  busy: boolean;
}) {
  const plan = PLAN_DISPLAY[planKey];
  const isCurrent = currentPlan === planKey;
  const isComingSoon = planKey === "scale";
  const isScheduledDowngrade = isCurrent && pendingPlan === "free";

  let cta: React.ReactNode;
  if (isComingSoon) {
    cta = (
      <Button disabled className="w-full justify-center text-xs" variant="outline">
        Coming Soon
      </Button>
    );
  } else if (isCurrent && planKey === "free") {
    cta = (
      <Button disabled className="w-full justify-center text-xs" variant="outline">
        Current Plan
      </Button>
    );
  } else if (isCurrent && planKey === "starter") {
    cta = isScheduledDowngrade ? (
      <Button disabled className="w-full justify-center text-xs" variant="outline">
        Ends {expiresAt ? new Date(expiresAt).toLocaleDateString() : "soon"}
      </Button>
    ) : (
      <Button
        onClick={onDowngradeClick}
        variant="outline"
        className="w-full justify-center text-xs border-border hover:border-red-500/40 hover:text-red-400"
      >
        Cancel Plan
      </Button>
    );
  } else if (planKey === "starter" && currentPlan === "free") {
    cta = (
      <Button
        onClick={() => onUpgrade("starter")}
        disabled={busy}
        className="w-full justify-center text-xs bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : "Upgrade to Starter"}
      </Button>
    );
  } else {
    cta = (
      <Button disabled className="w-full justify-center text-xs" variant="outline">
        Unavailable
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col h-full rounded-xl",
        highlight ? "border border-primary" : "border border-border",
        highlight && "bg-card"
      )}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
            <Sparkles size={9} /> MOST POPULAR
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            Active
          </span>
        </div>
      )}

      <div className="p-8 flex-1">
        <p className={cn("font-mono text-xs tracking-widest uppercase mb-1", highlight ? "text-primary" : "text-muted-foreground")}>
          {plan.name}
        </p>
       <div className="flex items-baseline gap-1 mb-1">
  <span className="font-black tracking-tight text-foreground" style={{ fontSize: "2.6rem", letterSpacing: "-0.03em" }}>
    {plan.price}
  </span>
  <span className="text-sm text-muted-foreground">{plan.period}</span>
</div>
{plan.ngnNote && (
  <p className="text-[11px] text-muted-foreground mb-4">{plan.ngnNote}</p>
)}
        <p className="text-xs text-muted-foreground mb-7 leading-relaxed">{plan.desc}</p>

        <div className="space-y-3">
          {plan.features.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <Check size={12} className={cn("mt-0.5 shrink-0", highlight ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 pt-0">{cta}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast, show, dismiss } = useToast();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [downgradeBusy, setDowngradeBusy] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const verifyingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) {
      setLoadingStatus(false);
      return;
    }
    try {
      const res = await callBackend(`/billing/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("billing status error:", err);
    } finally {
      setLoadingStatus(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // ── Handle ?reference= coming back from a redirect-style flow / page refresh ──
  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference || verifyingRef.current || !user?.id) return;
    verifyingRef.current = true;

    (async () => {
      try {
        const res = await callBackend(`/billing/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();
        if (data.ok) {
          show("success", `You're now on the ${PLAN_DISPLAY[data.plan as PlanKey]?.name ?? data.plan} plan.`);
          await fetchStatus();
        } else {
          show("error", "Payment could not be verified. If you were charged, contact support.");
        }
      } catch (err) {
        console.error("verify error:", err);
        show("error", "Something went wrong verifying your payment.");
      } finally {
        router.replace("/pricing");
      }
    })();
  }, [searchParams, user?.id, fetchStatus, router, show]);

  async function handleUpgrade(planId: string) {
  if (!user?.email) {
    show("error", "Please sign in before upgrading.");
    return;
  }
  if (!window.PaystackPop) {
    show("error", "Payment system is still loading — try again in a moment.");
    return;
  }
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    show("error", "Payment is not configured yet.");
    return;
  }

  setUpgradeBusy(true);
  try {
    const res = await callBackend(`/billing/subscribe`, {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok || !data.reference) throw new Error("No reference returned");

    const popup = new window.PaystackPop();
    popup.newTransaction({
      key: publicKey,
      email: user.email,
      amount: STARTER_AMOUNT_KOBO,
      reference: data.reference,
      currency: "NGN",
      channels: ["card"],
      metadata: { user_id: user.id, plan_id: planId },
      onSuccess: (transaction) => {
        (async () => {
          try {
            const verifyRes = await callBackend(
              `/billing/verify?reference=${encodeURIComponent(transaction.reference)}`
            );
            const verifyData = await verifyRes.json();
            if (verifyData.ok) {
              show("success", `You're now on the ${PLAN_DISPLAY[verifyData.plan as PlanKey]?.name ?? verifyData.plan} plan.`);
              await fetchStatus();
            } else {
              show("error", "Payment succeeded but verification failed. Contact support with your reference.");
            }
          } catch (err) {
            console.error("post-payment verify error:", err);
            show("error", "Payment succeeded but we couldn't confirm it. Contact support with your reference.");
          } finally {
            setUpgradeBusy(false);
          }
        })();
      },
      onCancel: () => {
        setUpgradeBusy(false);
      },
      onError: (error) => {
        console.error("paystack error:", error.message);
        show("error", error.message || "Couldn't start checkout. Please try again.");
        setUpgradeBusy(false);
      },
    });
  } catch (err) {
    console.error("upgrade error:", err);
    show("error", "Couldn't start checkout. Please try again.");
    setUpgradeBusy(false);
  }
}

  async function handleConfirmDowngrade() {
    setDowngradeBusy(true);
    try {
      const res = await callBackend(`/billing/cancel`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        show("success", data.message ?? "Your plan will switch to Free at the end of the current billing period.");
        await fetchStatus();
      } else {
        show("error", "Couldn't cancel your plan. Please try again.");
      }
    } catch (err) {
      console.error("cancel error:", err);
      show("error", "Couldn't cancel your plan. Please try again.");
    } finally {
      setDowngradeBusy(false);
      setShowDowngradeModal(false);
    }
  }

  const currentPlan = status?.plan ?? "free";

  return (
    <>
      <Script src="https://js.paystack.co/v2/inline.js" strategy="afterInteractive" />

      <Toast toast={toast} onDismiss={dismiss} />

      {showDowngradeModal && (
        <DowngradeConfirmModal
          expiresAt={status?.expires_at ?? null}
          loading={downgradeBusy}
          onConfirm={handleConfirmDowngrade}
          onCancel={() => setShowDowngradeModal(false)}
        />
      )}

      <div className="max-w-5xl mx-auto px-5 md:px-8 py-14">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
            Plans & Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Start free. Upgrade when one source of truth isn't enough.
          </p>
        </div>

        {loadingStatus ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {status?.pending_plan === "free" && status.expires_at && (
              <div className="max-w-2xl mx-auto mb-8 flex items-start gap-2.5 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                <Clock size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/90 leading-relaxed">
                  Your Starter plan is scheduled to end on{" "}
                  <span className="font-semibold text-amber-300">
                    {new Date(status.expires_at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  . You'll automatically move to Free after that.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <PlanCard
                planKey="free"
                currentPlan={currentPlan}
                pendingPlan={status?.pending_plan ?? null}
                expiresAt={status?.expires_at ?? null}
                onUpgrade={handleUpgrade}
                onDowngradeClick={() => setShowDowngradeModal(true)}
                busy={upgradeBusy}
              />
              <PlanCard
                planKey="starter"
                currentPlan={currentPlan}
                pendingPlan={status?.pending_plan ?? null}
                expiresAt={status?.expires_at ?? null}
                highlight
                onUpgrade={handleUpgrade}
                onDowngradeClick={() => setShowDowngradeModal(true)}
                busy={upgradeBusy}
              />
              <PlanCard
                planKey="scale"
                currentPlan={currentPlan}
                pendingPlan={status?.pending_plan ?? null}
                expiresAt={status?.expires_at ?? null}
                onUpgrade={handleUpgrade}
                onDowngradeClick={() => setShowDowngradeModal(true)}
                busy={upgradeBusy}
              />
            </div>

            <p className="mt-8 text-center font-mono text-xs text-muted-foreground">
              Premium Marketplace datasets at <span className="text-amber-400">$9 one-time</span>. Yours forever with all future versions included.
            </p>
          </>
        )}
      </div>
    </>
  );
}