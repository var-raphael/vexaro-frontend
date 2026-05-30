"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Database, GitBranch, Diff, Undo2, Copy,
  RefreshCw, Key, Zap, ArrowRight, Check,
  Globe, Layers, Shield, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VexaroMark } from "@/components/ui/vexaro-mark";

// ── Pricing Data ──────────────────────────────────────────────────────────────

const FREE_PLAN = {
  name: "Free",
  price: "$0",
  period: "/mo",
  desc: "For exploration and testing only.",
  features: [
    "1 dataset only",
    "No version history",
    "No auto-refresh",
    "No marketplace access",
    "Community support only",
  ],
  cta: "Get started free",
};

const PRO_PLAN = {
  name: "Starter",
  price: "$39",
  period: "/mo",
  desc: "For developers building seriously with web and Reddit data.",
  features: [
    "6 custom datasets",
    "Unlimited version history",
    "Daily data refresh",
    "On-demand refresh via ping URL",
    "Full diff viewer & one-click rollback",
    "Access to full marketplace",
    "Clone & extend public datasets",
    "AI pipeline-ready structured JSON",
    "Priority support",
  ],
  cta: "Start building",
};

// ── Animation utilities ───────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: !mounted ? 0 : inView ? 1 : 0,
        transform: !mounted ? "translateY(24px)" : inView ? "translateY(0)" : "translateY(24px)",
        transition: mounted
          ? `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`
          : "none",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// ── Typewriter ────────────────────────────────────────────────────────────────

function Typewriter({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index % words.length];
    const speed = deleting ? 35 : 70;
    if (!deleting && displayed === word) {
      const t = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(t);
    }
    if (deleting && displayed === "") {
      setDeleting(false);
      setIndex((i) => i + 1);
      return;
    }
    const t = setTimeout(() => {
      setDisplayed(
        deleting ? word.slice(0, displayed.length - 1) : word.slice(0, displayed.length + 1)
      );
    }, speed);
    return () => clearTimeout(t);
  }, [displayed, deleting, index, words]);

  return (
    <span style={{ color: "var(--accent-color)" }}>
      {displayed}
      <span className="animate-pulse" style={{ opacity: 0.7 }}>_</span>
    </span>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative flex flex-col items-start justify-end min-h-screen px-6 md:px-16 pb-16 pt-32 overflow-hidden"
      style={{ borderBottom: "1px solid var(--line-color)" }}
    >
      {/* Fine grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      {/* Subtle top-left accent bleed */}
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none" style={{
        background: "radial-gradient(ellipse at top left, var(--glow-color) 0%, transparent 70%)",
      }} />

      {/* Version tag */}
      <div className="absolute top-28 right-6 md:right-16 flex items-center gap-2">
        <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>PUBLIC BETA</span>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-color)", boxShadow: "0 0 6px var(--accent-color)" }} />
      </div>

      {/* Mark */}
      <div className="mb-10 relative z-10" style={{ animation: "fadeUp 0.6s ease 0.05s both" }}>
        <VexaroMark size={48} />
      </div>

      {/* Headline */}
      <div className="relative z-10 max-w-5xl">
        <h1
          className="font-black leading-none tracking-tight mb-8"
          style={{
            fontSize: "clamp(3rem, 9vw, 7.5rem)",
            fontFamily: "var(--font-display)",
            animation: "fadeUp 0.7s ease 0.1s both",
            letterSpacing: "-0.04em",
          }}
        >
          The internet,
          <br />
          <Typewriter words={["structured.", "on demand.", "always live.", "yours."]} />
        </h1>

        <div style={{ animation: "fadeUp 0.7s ease 0.25s both" }}>
          <p
            className="text-base md:text-lg leading-relaxed mb-4 max-w-xl"
            style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
          >
            Define what data you want. Vexaro fetches it, structures it, versions it, and serves it as you want. No pipelines. No maintenance. No dirty surprises.
          </p>

          <p
            className="text-sm leading-relaxed mb-10 max-w-xl"
            style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}
          >
            You bring the idea. Vexaro brings the data.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <button className="vx-btn-primary">
              Start building free <ArrowRight size={15} className="ml-1.5" />
            </button>
            <button className="vx-btn-ghost">
              Browse datasets <ArrowUpRight size={14} className="ml-1.5" />
            </button>
          </div>

          <p className="mt-6 font-mono text-xs" style={{ color: "var(--muted-2)" }}>
            No credit card required · Upgrade anytime
          </p>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="absolute bottom-8 left-6 md:left-16 flex items-center gap-3"
        style={{ animation: "fadeUp 0.7s ease 0.6s both" }}
      >
        <div className="w-10 h-px" style={{ background: "var(--line-color)" }} />
        <span className="font-mono text-xs" style={{ color: "var(--muted-2)" }}>scroll to explore</span>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ── Problem / Solution ────────────────────────────────────────────────────────

function ProblemSolution() {
  const PROBLEMS = [
    { pain: "Pipelines break without warning", detail: "Sites change structure. Your pipeline silently returns empty arrays at 2 AM." },
    { pain: "Data is always stale", detail: "A job missed three runs. The dashboard shows last week's prices." },
    { pain: "Fresh Reddit data is gone", detail: "Reddit killed free API access in 2023. Fresh, structured Reddit data is now genuinely scarce. Vexaro solves this quietly." },
    { pain: "80% of your time is data prep", detail: "You wanted to ship an AI feature. Instead you spent a week cleaning CSVs." },
  ];

  const SOLUTIONS = [
    { win: "Schema-first extraction", detail: "Tell Vexaro what fields you need in plain English. We deliver them clean, typed, and consistent on every refresh." },
    { win: "Refreshed every night, automatically", detail: "No cron jobs. No servers. Your data is always current when you wake up." },
    { win: "Every change versioned forever", detail: "Nothing is overwritten. Roll back to any prior state. Full diff between any two versions." },
    { win: "Plug straight into your pipeline", detail: "Structured JSON, ready the moment it's created. No preprocessing, no cleaning scripts. Available in any format." },
  ];

  return (
    <section className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-16">
            <div className="w-8 h-px" style={{ background: "var(--accent-color)" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
              The Problem
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ border: "1px solid var(--line-color)" }}>
          {/* Problem column */}
          <div className="p-8 md:p-12" style={{ borderRight: "1px solid var(--line-color)" }}>
            <Reveal>
              <h2
                className="font-black tracking-tight leading-tight mb-8"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              >
                Building with web data
                <br />
                <span style={{ color: "var(--muted)" }}>is broken by default.</span>
              </h2>
            </Reveal>
            <div className="space-y-6">
              {PROBLEMS.map(({ pain, detail }, i) => (
                <Reveal key={pain} delay={i * 60}>
                  <div className="flex gap-4">
                    <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: "#ef4444" }}>✗</span>
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-body)" }}>{pain}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>{detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Solution column */}
          <div className="p-8 md:p-12" style={{ background: "var(--card-alt)" }}>
            <Reveal delay={80}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-4 h-px" style={{ background: "var(--accent-color)" }} />
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>The Vexaro way</span>
              </div>
              <h2
                className="font-black tracking-tight leading-tight mb-8"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              >
                Define your intent.
                <br />
                Get a live dataset in minutes.
              </h2>
            </Reveal>
            <div className="space-y-6">
              {SOLUTIONS.map(({ win, detail }, i) => (
                <Reveal key={win} delay={80 + i * 60}>
                  <div className="flex gap-4">
                    <Check size={13} className="mt-0.5 shrink-0" style={{ color: "var(--accent-color)" }} />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-body)" }}>{win}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>{detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    icon: <Globe size={16} />,
    title: "Pick a source or describe your intent",
    desc: "Paste any public URL, pick subreddits and keywords, or describe what data you need in plain English. Vexaro figures out the rest.",
  },
  {
    n: "02",
    icon: <Database size={16} />,
    title: "Define your schema",
    desc: "Specify which fields you want in plain English. Our extraction engine maps web or Reddit data to your structure precisely. No selectors, no XPath, no brittle rules.",
  },
  {
    n: "03",
    icon: <GitBranch size={16} />,
    title: "Dataset goes live, versioned from day one",
    desc: "Vexaro refreshes nightly. Trigger extra refreshes via your ping URL. Every change is stored permanently and nothing is ever lost.",
  },
  {
    n: "04",
    icon: <Key size={16} />,
    title: "Download, clone, or plug in via Api",
    desc: "Download directly, clone a public dataset and extend it, or wire it into your AI pipeline. Clean structured JSON, ready immediately. Available in any format.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-px" style={{ background: "var(--accent-color)" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
              How it works
            </span>
          </div>
          <h2
            className="font-black tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
          >
            Four steps from intent<br className="hidden md:block" /> to structured dataset.
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            No brittle pipelines. No maintenance overhead. Define your intent and we handle everything else.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={{ border: "1px solid var(--line-color)" }}>
          {STEPS.map(({ n, icon, title, desc }, i) => (
            <Reveal key={n} delay={i * 70}>
              <div
                className="p-6 h-full group transition-colors duration-200"
                style={{
                  borderRight: i < STEPS.length - 1 ? "1px solid var(--line-color)" : "none",
                  cursor: "default",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs" style={{ color: "var(--muted-2)" }}>{n}</span>
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{
                      border: "1px solid var(--line-color)",
                      color: "var(--accent-color)",
                    }}
                  >
                    {icon}
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-3 leading-snug" style={{ fontFamily: "var(--font-body)" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <Database size={15} />, title: "Intent-Driven Extraction", desc: "Describe your need in plain English, define your schema, and Vexaro extracts exactly that from any web source. Typed, clean, and consistent on every refresh." },
  { icon: <Globe size={15} />, title: "Reddit Data, Fresh Daily", desc: "Subreddits, keywords, date ranges, and post caps. Full post body, nested comments, scores, flairs, and metadata. The freshest Reddit data available anywhere." },
  { icon: <RefreshCw size={15} />, title: "Nightly Automatic Refresh", desc: "Your source is re-processed every night. Your dataset is always current by morning. No cron jobs to manage." },
  { icon: <Zap size={15} />, title: "On-Demand Ping URL", desc: "Every dataset gets a dedicated ping URL. Wire it into any scheduler for additional refreshes whenever you need fresher data." },
  { icon: <GitBranch size={15} />, title: "Immutable Version History", desc: "Every refresh is a permanent snapshot. Nothing is ever overwritten. Your full history is always queryable and downloadable." },
  { icon: <Diff size={15} />, title: "Visual Diff Viewer", desc: "See exactly what changed between any two versions. Added rows, removed fields, modified values — all clearly visualized." },
  { icon: <Undo2 size={15} />, title: "One-Click Rollback", desc: "A bad refresh brought in dirty data? Roll back to any prior version instantly. Your pipeline stays stable." },
  { icon: <Copy size={15} />, title: "Clone & Extend", desc: "Fork any public dataset like a GitHub repo. Extend it with your own fields, add your own sources, and optionally publish it back to the community." },
  { icon: <Shield size={15} />, title: "AI Pipeline Ready", desc: "Clean, structured JSON with typed fields and consistent shape. Honest nulls, preserved duplicates. Drop it straight into your pipeline or fine-tune your model." },
];

function Features() {
  return (
    <section id="features" className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-px" style={{ background: "var(--accent-color)" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
              Features
            </span>
          </div>
          <h2
            className="font-black tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
          >
            Everything your pipeline needs.
            <br className="hidden md:block" />
            <span style={{ color: "var(--muted)" }}>Nothing it doesn't.</span>
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            Built for developers who want reliable, structured web and Reddit data without managing the infrastructure behind it.
          </p>
        </Reveal>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ border: "1px solid var(--line-color)" }}
        >
          {FEATURES.map(({ icon, title, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 50}>
              <div
                className="p-6 transition-colors duration-200 group"
                style={{
                  borderRight: (i % 3 !== 2) ? "1px solid var(--line-color)" : "none",
                  borderBottom: i < FEATURES.length - (FEATURES.length % 3 || 3) ? "1px solid var(--line-color)" : "none",
                }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center mb-4"
                  style={{ border: "1px solid var(--line-color)", color: "var(--accent-color)" }}
                >
                  {icon}
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "var(--font-body)" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Trending Datasets ─────────────────────────────────────────────────────────

const TRENDING = [
  { name: "r/investing", desc: "Top posts, sentiment and discussion from r/investing, refreshed daily", clones: 186, category: "Reddit" },
  { name: "remote-jobs", desc: "Live remote job listings from WeWorkRemotely, structured and versioned", clones: 164, category: "Web" },
  { name: "r/MachineLearning", desc: "Top posts, comments and sentiment from the ML community", clones: 142, category: "Reddit" },
  { name: "crypto-prices", desc: "Top 100 cryptocurrencies with daily price data from CoinGecko", clones: 138, category: "Web" },
  { name: "r/wallstreetbets", desc: "WSB posts, flairs, upvote data and daily sentiment signal", clones: 121, category: "Reddit" },
  { name: "hacker-news-top", desc: "Top 100 HN stories, comment counts and scores refreshed daily", clones: 98, category: "Web" },
  { name: "r/startups", desc: "Founder discussions, ask posts and top comments from r/startups", clones: 87, category: "Reddit" },
  { name: "github-trending", desc: "Trending repositories across all languages, updated nightly", clones: 76, category: "Web" },
  { name: "r/worldnews", desc: "Breaking news posts and top-voted comments from r/worldnews", clones: 68, category: "Reddit" },
  { name: "nba-scores", desc: "Live NBA scores, player stats and standings refreshed nightly", clones: 54, category: "Web" },
];

function TrendingDatasets() {
  return (
    <section id="datasets" className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-px" style={{ background: "var(--accent-color)" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
              Public Marketplace
            </span>
          </div>
          <h2
            className="font-black tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
          >
            The data you actually need,
            <br className="hidden md:block" />
            <span style={{ color: "var(--muted)" }}>already built.</span>
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            Curated web and Reddit datasets across finance, tech, sports, and entertainment. Versioned, maintained, and ready to clone. No account needed to access public endpoints.
          </p>
        </Reveal>

        {/* Dataset table */}
        <div style={{ border: "1px solid var(--line-color)" }}>
          {/* Header */}
          <div
            className="grid font-mono text-xs py-3 px-4"
            style={{
              gridTemplateColumns: "1fr auto auto",
              gap: "1rem",
              borderBottom: "1px solid var(--line-color)",
              color: "var(--muted-2)",
            }}
          >
            <span>DATASET</span>
            <span className="text-right">SOURCE</span>
            <span className="text-right w-16">CLONES</span>
          </div>

          {TRENDING.map(({ name, desc, clones, category }, i) => (
            <Reveal key={name} delay={i * 40}>
              <div
                className="grid items-center px-4 py-4 group cursor-pointer transition-colors duration-150"
                style={{
                  gridTemplateColumns: "1fr auto auto",
                  gap: "1rem",
                  borderBottom: i < TRENDING.length - 1 ? "1px solid var(--line-color)" : "none",
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Database size={11} style={{ color: "var(--accent-color)", flexShrink: 0 }} />
                    <span
                      className="font-mono text-xs font-medium truncate group-hover:underline"
                      style={{ textDecorationColor: "var(--accent-color)" }}
                    >
                      {name}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--muted)", paddingLeft: "1.2rem" }}>{desc}</p>
                </div>
                <span
                  className="font-mono text-xs text-right px-2 py-0.5"
                  style={{
                    color: category === "Reddit" ? "#ff6314" : "var(--accent-color)",
                    border: `1px solid ${category === "Reddit" ? "rgba(255,99,20,0.2)" : "rgba(0,212,200,0.2)"}`,
                    fontSize: "0.6rem",
                    letterSpacing: "0.06em",
                  }}
                >
                  {category.toUpperCase()}
                </span>
                <span className="font-mono text-xs text-right w-16" style={{ color: "var(--muted)" }}>{clones}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-6 flex justify-end">
            <button className="vx-btn-ghost text-sm">
              View all datasets <ChevronRight size={13} className="ml-1" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function PricingCard({
  plan,
  highlight = false,
  delay = 0,
}: {
  plan: typeof FREE_PLAN;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="relative flex flex-col h-full"
        style={{
          border: highlight ? "1px solid var(--accent-color)" : "1px solid var(--line-color)",
          background: highlight ? "var(--card-alt)" : "transparent",
        }}
      >
        {highlight && (
          <div
            className="absolute -top-px left-0 right-0 h-px"
            style={{ background: "var(--accent-color)" }}
          />
        )}

        <div className="p-8 flex-1">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: highlight ? "var(--accent-color)" : "var(--muted-2)" }}>
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-black tracking-tight"
                  style={{ fontSize: "2.8rem", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm" style={{ color: "var(--muted)" }}>{plan.period}</span>
                )}
              </div>
            </div>
            {highlight && (
              <span
                className="font-mono text-xs px-2 py-1"
                style={{
                  border: "1px solid var(--accent-color)",
                  color: "var(--accent-color)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.08em",
                }}
              >
                POPULAR
              </span>
            )}
          </div>

          <p className="text-xs mb-8" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            {plan.desc}
          </p>

          <div className="space-y-3">
            {plan.features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <Check size={12} className="mt-0.5 shrink-0" style={{ color: highlight ? "var(--accent-color)" : "var(--muted-2)" }} />
                <span className="text-xs" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 pt-0">
          <button
            className={highlight ? "vx-btn-primary w-full justify-center" : "vx-btn-outline w-full justify-center"}
            style={{ width: "100%" }}
          >
            {plan.cta}
          </button>
        </div>
      </div>
    </Reveal>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-px" style={{ background: "var(--accent-color)" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
              Pricing
            </span>
          </div>
          <h2
            className="font-black tracking-tight leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
          >
            Two plans. No surprises.
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            Start free. Move to Starter when you need daily refresh, unlimited version history, and full marketplace access.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <PricingCard plan={FREE_PLAN} delay={0} />
          <PricingCard plan={PRO_PLAN} highlight delay={80} />
        </div>

        <Reveal delay={160}>
          <p className="mt-8 font-mono text-xs" style={{ color: "var(--muted-2)" }}>
            Marketplace datasets at <span style={{ color: "var(--fg)" }}>$9 one-time</span>. Yours forever with all future versions included.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h2
              className="font-black tracking-tight leading-tight"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}
            >
              Stop managing pipelines.
              <br />
              <span style={{ color: "var(--accent-color)" }}>Start building.</span>
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <div>
              <p className="text-sm md:text-base mb-8" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
                The internet is full of data. Vexaro makes it structured, versioned, and yours. Your first dataset is free. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button className="vx-btn-primary">
                  Get started free <ArrowRight size={15} className="ml-1.5" />
                </button>
                <button className="vx-btn-ghost">
                  View documentation <ArrowUpRight size={14} className="ml-1.5" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Global Styles + Page ──────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <style>{`
        :root {
          --bg: #0a0a0a;
          --fg: #f0f0ee;
          --muted: #6b6b6b;
          --muted-2: #3d3d3d;
          --line-color: #1e1e1e;
          --grid-color: rgba(255,255,255,0.025);
          --accent-color: #00d4c8;
          --glow-color: rgba(0, 212, 200, 0.05);
          --card-alt: #0f0f0f;
          --font-display: 'DM Serif Display', 'Playfair Display', Georgia, serif;
          --font-body: 'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        body {
          background: var(--bg);
          color: var(--fg);
        }

        .vx-section {
          padding: 5rem 0;
        }
        @media (min-width: 768px) {
          .vx-section { padding: 7rem 0; }
        }

        .vx-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        @media (min-width: 768px) {
          .vx-container { padding: 0 4rem; }
        }

        .vx-btn-primary {
          display: inline-flex;
          align-items: center;
          background: var(--accent-color);
          color: #0a0a0a;
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.8125rem;
          padding: 0.65rem 1.4rem;
          letter-spacing: 0.01em;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .vx-btn-primary:hover { opacity: 0.88; }

        .vx-btn-ghost {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: var(--muted);
          font-family: var(--font-body);
          font-weight: 500;
          font-size: 0.8125rem;
          padding: 0.65rem 1.4rem;
          border: 1px solid var(--line-color);
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          white-space: nowrap;
        }
        .vx-btn-ghost:hover {
          color: var(--fg);
          border-color: var(--muted-2);
        }

        .vx-btn-outline {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: var(--fg);
          font-family: var(--font-body);
          font-weight: 600;
          font-size: 0.8125rem;
          padding: 0.65rem 1.4rem;
          border: 1px solid var(--line-color);
          cursor: pointer;
          transition: border-color 0.15s;
          white-space: nowrap;
        }
        .vx-btn-outline:hover { border-color: var(--muted); }
      `}</style>

      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap"
      />

      <Navbar />
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <TrendingDatasets />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}