import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `About -- ${SITE_NAME}`,
  description: "Vexaro is built by Raphael, a software developer who got tired of stitching together painful, expensive data pipelines.",
  openGraph: {
    title: `About -- ${SITE_NAME}`,
    description: "Vexaro is built by Raphael, a software developer who got tired of stitching together painful, expensive data pipelines.",
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About -- ${SITE_NAME}`,
    description: "Vexaro is built by Raphael, a software developer who got tired of stitching together painful, expensive data pipelines.",
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

const SOCIALS = [
  {
    label: "Portfolio",
    handle: "var-raphael.vercel.app",
    href: "https://var-raphael.vercel.app",
    mono: "var-raphael.vercel.app",
  },
  {
    label: "X / Twitter",
    handle: "@PhantomDev001",
    href: "https://x.com/PhantomDev001",
    mono: "@PhantomDev001",
  },
  {
    label: "GitHub",
    handle: "var-raphael",
    href: "https://github.com/var-raphael",
    mono: "github.com/var-raphael",
  },
  {
    label: "LinkedIn",
    handle: "Samuel Raphael",
    href: "https://www.linkedin.com/in/samuel-raphael-7679313a2",
    mono: "linkedin.com/in/samuel-raphael-7679313a2",
  },
];

const WHAT_IT_IS = [
  {
    label: "A schema-first extraction engine",
    desc: "You describe what you want in plain English. Vexaro maps web content to your structure precisely — no selectors, no XPath, no brittle scraping rules that break every other week.",
  },
  {
    label: "A versioned data store",
    desc: "Every refresh is a permanent snapshot. Nothing is ever overwritten. You can roll back, diff any two versions, and see exactly what changed between them.",
  },
  {
    label: "An API you can actually depend on",
    desc: "Clean JSON, CSV, JSONL, XML, TSV, or Parquet. Filter, sort, deduplicate, and paginate via query params. Public datasets need no account. Private datasets use a Bearer token.",
  },
  {
    label: "A source of truth Claude can call",
    desc: "Every dataset ships with a native MCP server. Claude can query, filter, and clean your data conversationally. No code required.",
  },
];

export default function AboutPage() {
  return (
    <>
      <NavDoc />
      <main
        className="min-h-screen pt-24 pb-20"
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        <div className="max-w-2xl mx-auto px-5 md:px-8">

          {/* Breadcrumb */}
          <div
            className="flex items-center gap-2 font-mono text-xs mb-10 flex-wrap"
            style={{ color: "var(--muted-2)" }}
          >
            <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--muted-2)" }}>
              Home
            </Link>
            <span>/</span>
            <span style={{ color: "var(--fg)" }}>About</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent-color)" }}>
              About
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              Built by one person,<br />out of genuine frustration.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
              Vexaro is a solo project. One codebase, one founder, no committee.
            </p>
          </div>

          <div className="space-y-14">

            {/* The problem */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Why this exists
              </h2>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
                <p>
                  Getting structured data from the web is a solved problem in theory. In practice it means picking a scraping tool, wiring it to a scheduler, piping output into a cleaner, storing it somewhere, versioning it manually, and then doing all of it again when the source changes its layout. Every piece is a different product with a different API and a different failure mode.
                </p>
                <p>
                  The pipeline is painful to build, expensive to run, and time-consuming to maintain — and that's before you've written a single line of business logic. Most of that time is spent on infrastructure nobody wanted to build in the first place.
                </p>
                <p>
                  Vexaro is the thing I wanted to exist: describe what data you need, point it at sources, and get a clean versioned API back. The infrastructure disappears.
                </p>
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* What it is */}
            <section>
              <h2 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-body)" }}>
                What Vexaro actually is
              </h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {WHAT_IT_IS.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-4 text-xs"
                    style={{ borderBottom: i < WHAT_IT_IS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.7" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* The builder */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Who built it
              </h2>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
                <p>
                  I'm Raphael, a software developer. I built Vexaro because I kept running into the same problem on different projects and got tired of assembling the same fragile stack every time.
                </p>
                <p>
                  This is a public beta. The rough edges are real, the fixes are fast, and every message you send reaches me directly — not a support queue, not a tier-1 agent. Me.
                </p>
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Socials */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Get in touch
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Every message goes directly to me. If something is broken, missing, or confusing — I want to hear it.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {SOCIALS.map(({ label, handle, href, mono }, i) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 group transition-colors duration-150"
                    style={{
                      borderBottom: i < SOCIALS.length - 1 ? "1px solid var(--line-color)" : "none",
                      textDecoration: "none",
                    }}
                  >
                    <div>
                      <p
                        className="font-mono text-xs mb-0.5 group-hover:opacity-80 transition-opacity"
                        style={{ color: "var(--accent-color)" }}
                      >
                        {label}
                      </p>
                      <p
                        className="font-mono text-xs"
                        style={{ color: "var(--muted-2)" }}
                      >
                        {mono}
                      </p>
                    </div>
                    <span
                      className="font-mono text-xs group-hover:opacity-80 transition-opacity"
                      style={{ color: "var(--accent-color)" }}
                    >
                      {"→"}
                    </span>
                  </a>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Where things are going */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Where things are going
              </h2>
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
                <p>
                  Vexaro is in public beta. The core pipeline is stable — datasets, versioning, the API, MCP, webhooks, and the marketplace are all live and working. What's coming is more scale: higher URL limits, custom refresh schedules, priority crawling, and team access.
                </p>
                <p>
                  The Scale plan is on the roadmap. If you need something that isn't there yet,{" "}
                  <a
                    href="https://x.com/PhantomDev001"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent-color)" }}
                    className="underline underline-offset-2"
                  >
                    tell me
                  </a>
                  . Feature requests from actual users move faster than anything on a roadmap.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div
              className="p-6 text-center"
              style={{ border: "1px solid var(--line-color)" }}
            >
              <p
                className="font-black tracking-tight mb-2"
                style={{ fontSize: "1.2rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Try it now. No credit card.
              </p>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.6 }}
              >
                One free dataset. Full API access. MCP included.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth"
                  className="font-mono text-xs px-4 py-2 transition-colors duration-150"
                  style={{
                    background: "var(--accent-color)",
                    color: "var(--bg)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Start building free
                </Link>
                <Link
                  href="/docs/quickstart"
                  className="font-mono text-xs px-4 py-2 transition-colors duration-150"
                  style={{
                    border: "1px solid var(--line-color)",
                    color: "var(--fg)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Read the docs
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}