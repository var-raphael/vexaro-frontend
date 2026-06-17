"use client";

import { useEffect, useRef, useState } from "react";
import {
  Database, GitBranch, Diff, Undo2, Copy,
  RefreshCw, Key, Zap, ArrowRight, Check,
  Globe, Shield, ChevronRight, ArrowUpRight,
  Webhook, FileJson, Bot, Terminal,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VexaroMark } from "@/components/ui/vexaro-mark";

// ── Pricing ───────────────────────────────────────────────────────────────────

const FREE_PLAN = {
  name: "Free",
  price: "$0",
  period: "/mo",
  desc: "For exploration and testing only.",
  features: [
    "2 datasets",
    "20 URLs per dataset",
    "10 Serper-discovered URLs per dataset",
    "Nightly automatic refresh",
    "On-demand refresh via ping URL",
    "MCP access included",
    "Full diff viewer & one-click rollback",
    "Full marketplace access",
    "Clone & extend public datasets",
    "Download in any format",
    "Community support only",
  ],
  cta: "Get started free",
  href: "/auth",
};

const PRO_PLAN = {
  name: "Pro",
  price: "$35",
  period: "/mo",
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
    "Full marketplace access",
    "Clone & extend public datasets",
    "Download in any format",
    "Email support",
  ],
  cta: "Start building",
  href: "/auth",
  highlight: true,
};

const SCALE_PLAN = {
  name: "Scale",
  price: "Coming Soon",
  period: "",
  desc: "For teams and startups running serious data pipelines.",
  features: [
    "Unlimited datasets",
    "500 URLs per dataset",
    "100 Serper-discovered URLs per dataset",
    "Everything in Pro",
    "Priority crawling queue",
    "Custom refresh schedules",
    "Dedicated support",
  ],
  cta: "Join waitlist",
  href: "/waitlist",
};

// ── Animation ─────────────────────────────────────────────────────────────────

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
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none" style={{
        background: "radial-gradient(ellipse at top left, var(--glow-color) 0%, transparent 70%)",
      }} />

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
          Any website.
          <br />
          <Typewriter words={["clean data.", "live API.", "your schema.", "versioned."]} />
        </h1>

        <div style={{ animation: "fadeUp 0.7s ease 0.25s both" }}>
          <p
            className="text-base md:text-lg leading-relaxed mb-4 max-w-xl"
            style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
          >
            Define what data you want from any public website. Vexaro fetches it, structures it against your schema, versions every change, and serves it as a clean API. No pipelines. No maintenance. No dirty surprises.
          </p>

          <p
            className="text-sm leading-relaxed mb-10 max-w-xl"
            style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}
          >
            Public datasets are accessible to anyone — no account needed.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <Link href="/auth" className="vx-btn-primary">
              Start building free <ArrowRight size={15} className="ml-1.5" />
            </Link>
            <Link href="/datasets" className="vx-btn-ghost">
              Browse datasets <ArrowUpRight size={14} className="ml-1.5" />
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-2 font-mono text-xs" style={{ color: "var(--muted-2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-color)", boxShadow: "0 0 6px var(--accent-color)" }} />
            Public beta · No credit card required · Upgrade anytime
          </p>
        </div>
      </div>

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
    { pain: "Pipelines break without warning", detail: "Sites change their structure. Your scraper silently returns empty arrays at 2 AM and nobody notices until the damage is done." },
    { pain: "Data is always stale", detail: "A cron job missed three runs. Your dashboard is showing last week's numbers and you didn't know." },
    { pain: "80% of your time is data prep", detail: "You wanted to ship a feature. Instead you spent a week writing cleaning scripts, deduplicating rows, and fixing null handling." },
    { pain: "Infrastructure nobody wants to maintain", detail: "Proxies, headless browsers, rate limiting, retries. You're maintaining a small platform just to get some structured data." },
  ];

  const SOLUTIONS = [
    { win: "Schema-first extraction", detail: "Tell Vexaro what fields you need in plain English. We deliver them clean, typed, and consistent on every single refresh." },
    { win: "Refreshed every night, automatically", detail: "No cron jobs. No servers. No missed runs. Your data is always current when you wake up." },
    { win: "Every change versioned forever", detail: "Nothing is ever overwritten. Roll back to any prior state instantly. Full diff between any two versions." },
    { win: "Plug straight into your pipeline", detail: "Clean structured JSON, CSV, JSONL, XML, Excel, Parquet, TSV any format, convient params, ready immediately. No preprocessing. No cleaning scripts." },
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
          <div className="p-8 md:p-12" style={{ borderRight: "1px solid var(--line-color)" }}>
            <Reveal>
              <h2
                className="font-black tracking-tight leading-tight mb-8"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              >
                Getting web data into
                <br />
                <span style={{ color: "var(--muted)" }}>your app is still broken.</span>
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
                Describe your data.
                <br />
                Get a live API in minutes.
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
    title: "Paste URLs or describe your intent",
    desc: "Paste/Import any public URLs directly, or describe what data you need in plain English and let Vexaro discover the sources for you.",
  },
  {
    n: "02",
    icon: <Database size={16} />,
    title: "Define your schema in plain English",
    desc: "Specify which fields you want and what they mean. Our AI extraction engine maps web content to your structure precisely. No selectors, no XPath, no brittle rules.",
  },
  {
    n: "03",
    icon: <GitBranch size={16} />,
    title: "Dataset goes live, versioned from day one",
    desc: "Vexaro refreshes nightly. Trigger extra refreshes via your ping URL or webhook. Every change is a permanent snapshot — nothing is ever lost.",
  },
  {
    n: "04",
    icon: <Key size={16} />,
    title: "Consume via API, download, or clone",
    desc: "Hit your public endpoint directly — no account needed. Download in any format. Clone any public dataset and extend it your way.",
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
            Four steps from intent
            <br className="hidden md:block" /> to live structured data.
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            No infrastructure to manage. No pipelines to maintain. Define your intent and we handle everything else.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0" style={{ border: "1px solid var(--line-color)" }}>
          {STEPS.map(({ n, icon, title, desc }, i) => (
            <Reveal key={n} delay={i * 70}>
              <div
                className="p-6 h-full"
                style={{ borderRight: i < STEPS.length - 1 ? "1px solid var(--line-color)" : "none" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs" style={{ color: "var(--muted-2)" }}>{n}</span>
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ border: "1px solid var(--line-color)", color: "var(--accent-color)" }}
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
  { icon: <Database size={15} />, title: "Intent-Driven Extraction", desc: "Describe your need in plain English, define your schema, and Vexaro extracts exactly that from any public web source. Typed, clean, and consistent on every refresh." },
  { icon: <FileJson size={15} />, title: "Any Format, Any Params", desc: "Consume your dataset as JSON, CSV, JSONL, XML, Excel, TSV, Parquet. Filter, sort, deduplicate, denull, paginate — all via query params. Public endpoints need no account." },
  { icon: <RefreshCw size={15} />, title: "Nightly Automatic Refresh", desc: "Your sources are re-processed every night. Your dataset is always current by morning. No cron jobs. No missed runs. No maintenance." },
  { icon: <Zap size={15} />, title: "On-Demand Ping URL", desc: "Every dataset gets a dedicated ping URL. Wire it into any external scheduler or CI pipeline for additional refreshes whenever you need fresher data." },
  { icon: <Webhook size={15} />, title: "Webhook Notifications", desc: "Register a webhook endpoint and Vexaro will notify you the moment your dataset finishes refreshing. Build reactive pipelines without polling." },
  { icon: <GitBranch size={15} />, title: "Immutable Version History", desc: "Every refresh is a permanent snapshot. Nothing is ever overwritten. Your full history is always queryable, diffable, and downloadable." },
  { icon: <Diff size={15} />, title: "Visual Diff Viewer", desc: "See exactly what changed between any two versions. Added rows, removed entries, modified field values — all clearly visualized side by side." },
  { icon: <Undo2 size={15} />, title: "One-Click Rollback", desc: "A bad refresh brought in dirty data? Roll back to any prior version instantly. Freeze it to lock it permanently. Your pipeline stays stable." },
  { icon: <Copy size={15} />, title: "Clone & Extend", desc: "Fork any public dataset like a GitHub repo. Add your own schema fields, your own URLs, and publish it back. You own it fully from day one." },
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
            <span style={{ color: "var(--muted)" }}> Nothing it doesn't.</span>
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            Built for anyone who needs reliable, structured web data without managing the infrastructure behind it.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ border: "1px solid var(--line-color)" }}>
          {FEATURES.map(({ icon, title, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 50}>
              <div
                className="p-6"
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

// ── MCP / AI Agents ───────────────────────────────────────────────────────────

const MCP_POINTS = [
  {
    title: "Query it like a tool, not an endpoint",
    detail: "list_datasets, get_dataset_schema, and query_dataset let an agent browse, filter, and sort your data conversationally. \"What's trending in my dataset\" just works, no code required.",
  },
  {
    title: "Hand off the cleaning, not just the read",
    detail: "pull_for_edit and push_alt_version let Claude pull the raw entities, fix nulls or duplicates in plain English, and publish the result as your alt version automatically.",
  },
  {
    title: "The same alt system you already trust",
    detail: "Nothing new to learn. Agent-driven cleanups land in the exact alt pipeline you'd use manually — versioned, reversible, and downloadable like everything else.",
  },
];

function MCPSection() {
  return (
    <section id="mcp" className="vx-section" style={{ borderBottom: "1px solid var(--line-color)" }}>
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-16">
            <div className="w-8 h-px" style={{ background: "var(--accent-color)" }} />
            <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
              MCP · AI Agents
            </span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0" style={{ border: "1px solid var(--line-color)" }}>
          <div className="p-8 md:p-12" style={{ borderRight: "1px solid var(--line-color)" }}>
            <Reveal>
              <h2
                className="font-black tracking-tight leading-tight mb-6"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              >
                Not just an API.
                <br />
                <span style={{ color: "var(--muted)" }}>A tool Claude can call.</span>
              </h2>
              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
              >
                Every Vexaro dataset ships with a native MCP server, included on every plan. Claude — or any MCP-compatible agent — can query it, filter it, and clean it without you writing a script.
              </p>
            </Reveal>
            <div className="space-y-6">
              {MCP_POINTS.map(({ title, detail }, i) => (
                <Reveal key={title} delay={i * 70}>
                  <div className="flex gap-4">
                    <Bot size={13} className="mt-0.5 shrink-0" style={{ color: "var(--accent-color)" }} />
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-body)" }}>{title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>{detail}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-12 flex flex-col" style={{ background: "var(--card-alt)" }}>
            <Reveal delay={80}>
              <div className="flex items-center gap-3 mb-6">
                <Terminal size={13} style={{ color: "var(--accent-color)" }} />
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: "var(--accent-color)" }}>
                  Live in a Claude chat
                </span>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div
                className="font-mono text-xs leading-relaxed p-5 mb-4"
                style={{ background: "var(--bg)", border: "1px solid var(--line-color)", color: "var(--muted)" }}
              >
                <p style={{ color: "var(--fg)" }}>&gt; query_dataset(dataset_id: 142, keywords: "senior remote", sort: "salary:desc", limit: 5)</p>
                <p className="mt-2" style={{ color: "var(--accent-color)" }}>→ 47 entities matched</p>
                <p style={{ color: "var(--accent-color)" }}>→ returned as JSON, sorted by salary</p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div
                className="font-mono text-xs leading-relaxed p-5"
                style={{ background: "var(--bg)", border: "1px solid var(--line-color)", color: "var(--muted)" }}
              >
                <p style={{ color: "var(--fg)" }}>&gt; pull_for_edit(dataset_id: 142, use_alt: false)</p>
                <p className="mt-2">→ Claude reviews 1,204 entities</p>
                <p>→ dedupes, fixes null salary fields</p>
                <p className="mt-3" style={{ color: "var(--fg)" }}>&gt; push_alt_version(dataset_id: 142, version: 3, entities: [...])</p>
                <p className="mt-2" style={{ color: "var(--accent-color)" }}>→ live at /remote-jobs/v3/alt</p>
              </div>
            </Reveal>

            <Reveal delay={260}>
              <p className="mt-6 text-xs" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                MCP access is included on every plan, including Free.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Datasets Preview ──────────────────────────────────────────────────────────

const DATASETS = [
  { name: "github-trending", desc: "Trending repositories across all languages with stars, forks and descriptions", clones: 212, category: "Dev" },
  { name: "hacker-news-top", desc: "Top 100 HN stories with scores, comment counts and URLs refreshed daily", clones: 189, category: "Tech" },
  { name: "remote-jobs", desc: "Live remote job listings with role, company, salary range and stack required", clones: 176, category: "Jobs" },
  { name: "yc-companies", desc: "Y Combinator companies with batch, description, founder names and website", clones: 154, category: "Startups" },
  { name: "crypto-prices", desc: "Top 100 cryptocurrencies with price, market cap and 24h change from CoinGecko", clones: 143, category: "Finance" },
  { name: "ai-tools-directory", desc: "AI tools with category, pricing model, description and launch date", clones: 128, category: "AI" },
  { name: "arxiv-ai-papers", desc: "Latest AI and ML papers from ArXiv with abstracts, authors and citation counts", clones: 97, category: "Research" },
  { name: "product-hunt-launches", desc: "Daily Product Hunt launches with upvotes, tagline, maker and category", clones: 84, category: "Tech" },
];

function DatasetsPreview() {
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
            <span style={{ color: "var(--muted)" }}> already built.</span>
          </h2>
          <p className="text-sm md:text-base mb-14 max-w-lg" style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}>
            Curated web datasets across tech, finance, jobs, AI and research. Versioned, maintained, and refreshed nightly. Hit any public endpoint directly — no account needed.
          </p>
        </Reveal>

        <div style={{ border: "1px solid var(--line-color)" }}>
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
            <span className="text-right">CATEGORY</span>
            <span className="text-right w-16">CLONES</span>
          </div>

          {DATASETS.map(({ name, desc, clones, category }, i) => (
            <Reveal key={name} delay={i * 40}>
              <div
                className="grid items-center px-4 py-4 group cursor-pointer transition-colors duration-150"
                style={{
                  gridTemplateColumns: "1fr auto auto",
                  gap: "1rem",
                  borderBottom: i < DATASETS.length - 1 ? "1px solid var(--line-color)" : "none",
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
                  className="font-mono text-right px-2 py-0.5"
                  style={{
                    color: "var(--accent-color)",
                    border: "1px solid rgba(0,212,200,0.2)",
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
            <Link href="/datasets" className="vx-btn-ghost text-sm">
              View all datasets <ChevronRight size={13} className="ml-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

type AnyPlan = typeof FREE_PLAN | typeof PRO_PLAN | typeof SCALE_PLAN;

function PricingCard({
  plan,
  highlight = false,
  delay = 0,
}: {
  plan: AnyPlan;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div
        className="relative flex flex-col h-full"
        style={{
          border: highlight
            ? "1px solid var(--accent-color)"
            : "1px solid var(--line-color)",
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
              <p
                className="font-mono text-xs tracking-widest uppercase mb-1"
                style={{
                  color: highlight ? "var(--accent-color)" : "var(--muted-2)",
                }}
              >
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-black tracking-tight"
                  style={{
                    fontSize: "2.8rem",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {plan.price}
                </span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {plan.period}
                </span>
              </div>
            </div>
          </div>

          <p
            className="text-xs mb-8"
            style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
          >
            {plan.desc}
          </p>

          <div className="space-y-3">
            {plan.features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <Check
                  size={12}
                  className="mt-0.5 shrink-0"
                  style={{
                    color: highlight
                      ? "var(--accent-color)"
                      : "var(--muted-2)",
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: "var(--muted)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 pt-0">
          <Link
            href={plan.href}
            className={
              highlight
                ? "vx-btn-primary w-full justify-center"
                : "vx-btn-outline w-full justify-center"
            }
            style={{ display: "flex", width: "100%" }}
          >
            {plan.cta}
          </Link>
        </div>
      </div>
    </Reveal>
  );
}

// ── Pricing Section ───────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section
      id="pricing"
      className="vx-section"
      style={{ borderBottom: "1px solid var(--line-color)" }}
    >
      <div className="vx-container">
        <Reveal>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-8 h-px"
              style={{ background: "var(--accent-color)" }}
            />
            <span
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: "var(--accent-color)" }}
            >
              Pricing
            </span>
          </div>
          <h2
            className="font-black tracking-tight leading-tight mb-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.04em",
            }}
          >
            Three plans. No surprises.
          </h2>
          <p
            className="text-sm md:text-base mb-14 max-w-lg"
            style={{ color: "var(--muted)", fontFamily: "var(--font-body)" }}
          >
            Start free. Upgrade when you need nightly refresh, version history,
            and live API access. Flat pricing — no usage bills, no hidden fees.
          </p>
        </Reveal>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <PricingCard plan={FREE_PLAN} delay={0} />
  <PricingCard plan={PRO_PLAN} highlight delay={80} />
  <PricingCard plan={SCALE_PLAN} delay={160} />
</div>
        <Reveal delay={280}>
          <p className="mt-8 font-mono text-xs" style={{ color: "var(--muted-2)" }}>
            Premium Marketplace datasets at{" "}
            <span style={{ color: "#f59e0b" }}>$9 one-time</span>. Yours
            forever with all future versions included.
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
                Any website. Any schema. Clean, versioned, and live via API. Your first dataset is free. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Link href="/auth" className="vx-btn-primary">
                  Get started free <ArrowRight size={15} className="ml-1.5" />
                </Link>
                <Link href="/datasets" className="vx-btn-ghost">
                  Browse datasets <ArrowUpRight size={14} className="ml-1.5" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        body { background: var(--bg); color: var(--fg); }
        .vx-section { padding: 5rem 0; }
        @media (min-width: 768px) { .vx-section { padding: 7rem 0; } }
        .vx-container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
        @media (min-width: 768px) { .vx-container { padding: 0 4rem; } }
        .vx-btn-primary {
          display: inline-flex; align-items: center;
          background: var(--accent-color); color: #0a0a0a;
          font-family: var(--font-body); font-weight: 700; font-size: 0.8125rem;
          padding: 0.65rem 1.4rem; letter-spacing: 0.01em;
          border: none; cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
        }
        .vx-btn-primary:hover { opacity: 0.88; }
        .vx-btn-ghost {
          display: inline-flex; align-items: center;
          background: transparent; color: var(--muted);
          font-family: var(--font-body); font-weight: 500; font-size: 0.8125rem;
          padding: 0.65rem 1.4rem; border: 1px solid var(--line-color);
          cursor: pointer; transition: color 0.15s, border-color 0.15s; white-space: nowrap;
        }
        .vx-btn-ghost:hover { color: var(--fg); border-color: var(--muted-2); }
        .vx-btn-outline {
          display: inline-flex; align-items: center;
          background: transparent; color: var(--fg);
          font-family: var(--font-body); font-weight: 600; font-size: 0.8125rem;
          padding: 0.65rem 1.4rem; border: 1px solid var(--line-color);
          cursor: pointer; transition: border-color 0.15s; white-space: nowrap;
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
      <MCPSection />
      <DatasetsPreview />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}