import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Dataset -- ${SITE_NAME} Docs`,
  description: "Everything about creating, configuring, cloning, and extending Vexaro datasets.",
  openGraph: {
    title: `Dataset -- ${SITE_NAME} Docs`,
    description: "Everything about creating, configuring, cloning, and extending Vexaro datasets.",
    url: `${SITE_URL}/docs/dataset`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Dataset -- ${SITE_NAME} Docs`,
    description: "Everything about creating, configuring, cloning, and extending Vexaro datasets.",
  },
  alternates: {
    canonical: `${SITE_URL}/docs/dataset`,
  },
};

const VISIBILITY_OPTIONS = [
  {
    label: "Public",
    desc: "Anyone can hit your endpoint without an account or API key. Your dataset appears in the marketplace and can be cloned by other users.",
  },
  {
    label: "Private",
    desc: "Requests require a Bearer token. Your dataset does not appear in the marketplace and cannot be cloned. Find your private key in the dataset settings.",
  },
];

const SCHEMA_TIPS = [
  {
    label: "Be descriptive, not terse",
    desc: 'score (number) — the Hacker News upvote count works better than score (number). The more context you give, the more accurately the AI maps the source.',
  },
  {
    label: "Specify the type",
    desc: "Supported types: string, number, boolean, array, object. If you omit the type, the extractor will infer it, but explicit is always more reliable.",
  },
  {
    label: "Nest when it makes sense",
    desc: "You can describe nested objects: author.name (string), author.handle (string). The extractor will build the nested structure for you.",
  },
  {
    label: "Leave _source alone",
    desc: "Vexaro adds a _source field automatically with the origin URL of each entity. You do not need to declare it in your schema.",
  },
];

const URL_TIPS = [
  {
    label: "One entity per URL",
    desc: "Each URL should be a page that contains one or more instances of the thing you want. A list page with 30 job postings is fine. A single job detail page is also fine.",
  },
  {
    label: "Avoid login-walled pages",
    desc: "Vexaro crawls public pages only. If a URL requires authentication, the crawl will fail silently for that URL.",
  },
  {
    label: "Pagination",
    desc: "Paste each paginated URL separately. If the source uses query-param pagination (?page=1, ?page=2), paste each page you want covered.",
  },
  {
    label: "Plan limits",
    desc: `Free: 20 URLs. Pro: 100 URLs. URLs discovered via SERP intent count separately (Free: 10, Pro: 40).`,
  },
];

const SERP_TIPS = [
  "Keep the intent narrow. "top remote React jobs" works. "all jobs" does not.",
  "Vexaro runs the query via Serper and picks the most relevant public URLs from the results.",
  "SERP-discovered URLs are additive — they stack on top of any URLs you pasted directly.",
  "Re-running discovery on a refresh may return different URLs if the search results have changed.",
];

const REFRESH_OPTIONS = [
  {
    label: "Nightly (automatic)",
    desc: "All datasets on all plans refresh automatically every night. No configuration needed.",
  },
  {
    label: "On-demand via ping URL",
    desc: "Pro and above. Every dataset gets a dedicated ping URL. Hit it with a GET request to trigger an extra refresh immediately. Wire it into any scheduler or CI pipeline.",
  },
  {
    label: "Webhook on completion",
    desc: "Pro and above. Register an endpoint and Vexaro will POST to it the moment a refresh finishes. See the Webhooks doc for the payload shape.",
  },
];

const CLONE_STEPS = [
  {
    n: "01",
    title: "Find a public dataset",
    body: "Browse the marketplace and open any public dataset. Every public dataset has a Clone button in the top right of its page.",
  },
  {
    n: "02",
    title: "Fork it to your account",
    body: "Cloning copies the current active version, the schema, and the source URLs into a new dataset owned by you. The original is untouched.",
  },
  {
    n: "03",
    title: "Extend it",
    body: "Add your own URLs, edit the schema to add or remove fields, or change the visibility. Your clone is fully independent from the original.",
  },
  {
    n: "04",
    title: "Hit your own endpoint",
    body: "Your extended dataset gets its own dataset ID and slug. It refreshes on its own schedule. The original dataset's changes never affect yours.",
  },
];

const FROZEN_NOTES = [
  "A frozen dataset will never refresh again.",
  "Its API endpoint stays live and returns the last version indefinitely.",
  "Frozen datasets cannot be unfrozen. Clone it first if you want an active copy.",
  "Datasets that violate the Terms of Service may be frozen by Vexaro.",
];

const NEXT_STEPS = [
  { label: "Quickstart", href: "/docs/quickstart", desc: "Hit a public endpoint in under 5 minutes." },
  { label: "API reference", href: "/docs/api", desc: "Every parameter, response header, and format." },
  { label: "Versioning and rollback", href: "/docs/versioning", desc: "How versions work and how to roll back." },
  { label: "Webhooks", href: "/docs/webhooks", desc: "Get notified the moment a refresh finishes." },
];

export default function DatasetPage() {
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
            <Link href="/docs/quickstart" className="hover:text-white transition-colors" style={{ color: "var(--muted-2)" }}>
              Docs
            </Link>
            <span>/</span>
            <span style={{ color: "var(--fg)" }}>Dataset</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p
              className="font-mono text-xs tracking-widest uppercase mb-4"
              style={{ color: "var(--accent-color)" }}
            >
              Dataset
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              Your source of truth, configured.
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
            >
              A dataset is a schema, a set of source URLs, and a version history. Everything flows from those three things.
            </p>
          </div>

          <div className="space-y-14">

            {/* Visibility */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Visibility
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Set when you create the dataset. Changeable at any time from dataset settings.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {VISIBILITY_OPTIONS.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < VISIBILITY_OPTIONS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Schema */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Schema
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Your schema is a plain-English description of the fields you want extracted from each source. Write one field per line in the format{" "}
                <code
                  className="font-mono text-xs px-1 py-0.5"
                  style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}
                >
                  field_name (type) — description
                </code>
                .
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Example</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid var(--line-color)",
                  color: "#c8c8c8",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
{`title (string) — the title of the post
score (number) — the upvote count
comments (number) — the number of comments
url (string) — the link to the original post
author (string) — the username of the submitter`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {SCHEMA_TIPS.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < SCHEMA_TIPS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Source URLs */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Source URLs
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Paste one URL per line. Vexaro crawls each page and extracts entities against your schema. All URLs must be publicly accessible.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {URL_TIPS.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < URL_TIPS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* SERP intent */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                SERP intent discovery
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Don't know the exact URLs? Describe what you want in plain English and Vexaro will discover the sources for you via web search. SERP-discovered URLs are additive — they stack on top of any URLs you pasted directly.
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Example intents</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid var(--line-color)",
                  color: "#c8c8c8",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
{`top remote React jobs posted this week
Y Combinator W25 batch companies
AI tools launched on Product Hunt in 2025`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {SERP_TIPS.map((tip, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < SERP_TIPS.length - 1 ? "1px solid var(--line-color)" : "none",
                      color: "#c8c8c8",
                      fontFamily: "var(--font-body)",
                      lineHeight: "1.6",
                    }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Refresh */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Refresh
              </h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {REFRESH_OPTIONS.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < REFRESH_OPTIONS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Clone & extend */}
            <section>
              <div className="flex items-start gap-3 mb-6 flex-wrap">
                <span
                  className="font-mono text-xs px-2 py-0.5 shrink-0"
                  style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)" }}
                >
                  CLONE & EXTEND
                </span>
                <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-body)" }}>
                  Fork any public dataset.
                </h2>
              </div>

              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Any public dataset in the marketplace can be cloned. Think of it like forking a GitHub repo — you get a full independent copy you own entirely.
              </p>

              <div className="space-y-8">
                {CLONE_STEPS.map(({ n, title, body }, i) => (
                  <div key={n} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className="font-mono text-xs w-8 h-8 flex items-center justify-center"
                        style={{ border: "1px solid var(--line-color)", color: "var(--accent-color)" }}
                      >
                        {n}
                      </span>
                      {i < CLONE_STEPS.length - 1 && (
                        <div
                          className="flex-1 w-px mt-2"
                          style={{ background: "var(--line-color)", minHeight: "2rem" }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-body)" }}>
                        {title}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
                      >
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Alt version */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Alt version
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Every dataset version can have an alt — a cleaned or modified copy of the same entities that lives alongside the original without replacing it. Alt versions are produced manually via the dashboard, or automatically by an MCP agent using{" "}
                <code
                  className="font-mono text-xs px-1 py-0.5"
                  style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}
                >
                  push_alt_version
                </code>
                .
              </p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid var(--line-color)",
                  color: "#c8c8c8",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
{`GET ${SITE_URL}/api/42/my-dataset/active/?alt=true
# or
GET ${SITE_URL}/api/42/my-dataset/v3/alt/`}
              </pre>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Frozen datasets */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Frozen datasets
              </h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {FROZEN_NOTES.map((note, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < FROZEN_NOTES.length - 1 ? "1px solid var(--line-color)" : "none",
                      color: "#c8c8c8",
                      fontFamily: "var(--font-body)",
                      lineHeight: "1.6",
                    }}
                  >
                    {note}
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Plan limits summary */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Plan limits
              </h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {[
                  { plan: "Free", datasets: "1", urls: "20", serp: "10" },
                  { plan: "Pro", datasets: "5", urls: "100", serp: "40" },
                  { plan: "Scale", datasets: "Unlimited", urls: "500", serp: "100" },
                ].map(({ plan, datasets, urls, serp }, i, arr) => (
                  <div
                    key={plan}
                    className="px-4 py-3 text-xs grid grid-cols-4 gap-2"
                    style={{
                      borderBottom: i < arr.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <span className="font-mono" style={{ color: "var(--accent-color)" }}>{plan}</span>
                    <span style={{ color: "#c8c8c8" }}>{datasets} dataset{datasets === "1" ? "" : "s"}</span>
                    <span style={{ color: "#c8c8c8" }}>{urls} URLs</span>
                    <span style={{ color: "#c8c8c8" }}>{serp} SERP</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                See the full{" "}
                <Link href="/docs/pricings" style={{ color: "var(--accent-color)" }} className="underline underline-offset-2">
                  pricing page
                </Link>{" "}
                for a complete feature comparison.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Next steps */}
            <section>
              <h2 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-body)" }}>
                Next steps
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NEXT_STEPS.map(({ label, href, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="p-4 block group transition-colors duration-150"
                    style={{ border: "1px solid var(--line-color)" }}
                  >
                    <p
                      className="text-sm font-semibold mb-1 group-hover:opacity-80 transition-opacity"
                      style={{ fontFamily: "var(--font-body)", color: "var(--accent-color)" }}
                    >
                      {label}
                    </p>
                    <p className="text-xs" style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}>
                      {desc}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Prev / Next */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/docs/quickstart"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
                Quickstart
              </Link>
              <Link
                href="/docs/api"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                API reference
                <span style={{ color: "var(--accent-color)" }}>{">"}</span>
              </Link>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}