import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Quickstart -- ${SITE_NAME} Docs`,
  description: "Get your first Vexaro dataset live in under 5 minutes. No pipelines, no infrastructure, no credit card required.",
  openGraph: {
    title: `Quickstart -- ${SITE_NAME} Docs`,
    description: "Get your first Vexaro dataset live in under 5 minutes.",
    url: `${SITE_URL}/docs/quickstart`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Quickstart -- ${SITE_NAME} Docs`,
    description: "Get your first Vexaro dataset live in under 5 minutes.",
  },
  alternates: {
    canonical: `${SITE_URL}/docs/quickstart`,
  },
};

const QUERY_PARAMS = [
  { param: "format", def: "json", desc: "Output format. json, jsonl, csv, tsv, xml, parquet." },
  { param: "limit", def: "all", desc: "Max number of entities to return." },
  { param: "offset", def: "0", desc: "Skip the first N entities." },
  { param: "sort", def: "none", desc: "Sort by a field. sort=score:desc or sort=name:asc." },
  { param: "keywords", def: "none", desc: "Full-text search across all fields. Comma-separated for OR. Use keywords_mode=and for AND." },
  { param: "filter", def: "none", desc: "Exact match on a field. filter=category:finance. Repeatable." },
  { param: "filter_contains", def: "none", desc: "Partial match on a field. filter_contains=title:startup. Repeatable." },
  { param: "keep_field", def: "none", desc: "Return only these fields. Dot-notation supported. keep_field=title,score." },
  { param: "drop_field", def: "none", desc: "Remove these fields from the response. drop_field=_source." },
  { param: "dedup", def: "false", desc: "Remove duplicate entities. Use dedup_key=field1,field2 to dedup on specific fields." },
  { param: "denull", def: "false", desc: "Strip null and empty string values recursively." },
  { param: "flatten", def: "false", desc: "Flatten nested objects into dot-notation keys. Required automatically for csv, tsv, parquet." },
  { param: "sample", def: "none", desc: "Return N randomly sampled entities." },
  { param: "count", def: "false", desc: "Return only the count of matched entities, not the entities themselves." },
  { param: "alt", def: "false", desc: "Return the alt version of the dataset if one exists." },
  { param: "include_source", def: "true", desc: "Include the _source field (the origin URL of each entity). Set to false to strip it." },
  { param: "pretty", def: "true", desc: "Pretty-print JSON output. Set to false for compact output." },
];

const URL_PARAMS = [
  { param: "dataset_id", desc: "The numeric ID of the dataset." },
  { param: "name-slug", desc: "The dataset name, lowercased and hyphenated. Must match exactly." },
  { param: "version", desc: "active (the pinned version), latest (the most recent), or v1, v2, v3 etc." },
];

const RATE_LIMITS = [
  { type: "Public (no auth)", limit: "100 requests per minute, per IP" },
  { type: "Private (Bearer token)", limit: "300 requests per minute, per IP" },
];

const STEPS = [
  {
    n: "01",
    title: "Sign up",
    body: `Create a free account at ${SITE_URL}/auth. No credit card required.`,
  },
  {
    n: "02",
    title: "Paste URLs or describe your intent",
    body: "Import URLs directly, or type a plain-English description of what you want and Vexaro will discover the sources for you using web search.",
  },
  {
    n: "03",
    title: "Define your schema",
    body: "Tell Vexaro which fields you want and what they mean in plain English. For example: title (string) -- the title of the article, score (number) -- the upvote count.",
  },
  {
    n: "04",
    title: "Wait for processing",
    body: "Vexaro crawls your URLs, runs AI extraction against your schema, and versions the result. You will get a notification when it is ready. Usually takes a few minutes.",
  },
  {
    n: "05",
    title: "Hit your endpoint",
    body: "Your dataset is live. Find your dataset ID and name slug in the dashboard, then hit the API exactly like you did in Path 1.",
  },
];

const NEXT_STEPS = [
  { label: "Creating a dataset", href: "/docs/dataset", desc: "Schema, URLs, SERP intent, and plan limits." },
  { label: "API reference", href: "/docs/api", desc: "Every parameter, response header, and format." },
  { label: "MCP", href: "/docs/mcp", desc: "Connect your datasets to Claude and other agents." },
  { label: "Versioning and rollback", href: "/docs/versioning", desc: "How versions work and how to roll back." },
];

export default function QuickstartPage() {
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
            <span style={{ color: "var(--fg)" }}>Quickstart</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p
              className="font-mono text-xs tracking-widest uppercase mb-4"
              style={{ color: "var(--accent-color)" }}
            >
              Quickstart
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              Up and running in 5 minutes.
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
            >
              No account needed to start. Hit a public dataset right now, then create your own when you are ready.
            </p>
          </div>

          <div className="space-y-14">

            {/* PATH 1 */}
            <section>
              <div className="flex items-start gap-3 mb-6 flex-wrap">
                <span
                  className="font-mono text-xs px-2 py-0.5 shrink-0"
                  style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)" }}
                >
                  PATH 1
                </span>
                <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-body)" }}>
                  Hit a public dataset. No account required.
                </h2>
              </div>

              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Every public dataset on Vexaro is accessible to anyone. No API key, no signup. Just a GET request.
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Request</p>
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
{`GET ${SITE_URL}/api/1/hacker-news-top/active/
    ?format=json
    &limit=5
    &sort=score:desc`}
              </pre>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Response</p>
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
{`[
  {
    "title": "Show HN: I built a source of truth for the web",
    "score": 412,
    "comments": 187,
    "url": "https://news.ycombinator.com/item?id=..."
  },
  ...
]`}
              </pre>

              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                That is it. No setup. Browse all public datasets in the{" "}
                <Link
                  href="/datasets"
                  style={{ color: "var(--accent-color)" }}
                  className="underline underline-offset-2"
                >
                  marketplace
                </Link>{" "}
                and swap the slug for any of them.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* URL structure */}
            <section>
              <h2
                className="font-bold text-base mb-4"
                style={{ fontFamily: "var(--font-body)" }}
              >
                API URL structure
              </h2>
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
{`${SITE_URL}/api/{dataset_id}/{name-slug}/{version}/`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {URL_PARAMS.map(({ param, desc }, i) => (
                  <div
                    key={param}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < URL_PARAMS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <p
                      className="font-mono mb-1"
                      style={{ color: "var(--accent-color)" }}
                    >
                      {param}
                    </p>
                    <p
                      style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}
                    >
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Query params */}
            <section>
              <h2
                className="font-bold text-base mb-2"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Query parameters
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Every endpoint accepts the same set of params. Stack as many as you need.
              </p>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {QUERY_PARAMS.map(({ param, def, desc }, i) => (
                  <div
                    key={param}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < QUERY_PARAMS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span
                        className="font-mono"
                        style={{ color: "var(--accent-color)" }}
                      >
                        {param}
                      </span>
                      <span
                        className="font-mono text-xs"
                        style={{ color: "var(--muted-2)" }}
                      >
                        default: {def}
                      </span>
                    </div>
                    <p
                      style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}
                    >
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Rate limits */}
            <section>
              <h2
                className="font-bold text-base mb-4"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Rate limits
              </h2>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {RATE_LIMITS.map(({ type, limit }, i) => (
                  <div
                    key={type}
                    className="px-4 py-3 text-xs"
                    style={{
                      borderBottom: i < RATE_LIMITS.length - 1 ? "1px solid var(--line-color)" : "none",
                    }}
                  >
                    <p
                      className="font-mono mb-1"
                      style={{ color: "var(--fg)" }}
                    >
                      {type}
                    </p>
                    <p
                      style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}
                    >
                      {limit}
                    </p>
                  </div>
                ))}
              </div>

              <p
                className="text-xs mt-3"
                style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}
              >
                Rate limit headers are included in every response: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* PATH 2 */}
            <section>
              <div className="flex items-start gap-3 mb-6 flex-wrap">
                <span
                  className="font-mono text-xs px-2 py-0.5 shrink-0"
                  style={{ border: "1px solid var(--line-color)", color: "var(--muted-2)" }}
                >
                  PATH 2
                </span>
                <h2
                  className="font-bold text-base"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Create your own dataset.
                </h2>
              </div>

              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Free account, no credit card. One dataset, up to 20 URLs.
              </p>

              <div className="space-y-8">
                {STEPS.map(({ n, title, body }, i) => (
                  <div key={n} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className="font-mono text-xs w-8 h-8 flex items-center justify-center"
                        style={{ border: "1px solid var(--line-color)", color: "var(--accent-color)" }}
                      >
                        {n}
                      </span>
                      {i < STEPS.length - 1 && (
                        <div
                          className="flex-1 w-px mt-2"
                          style={{ background: "var(--line-color)", minHeight: "2rem" }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
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

            {/* Private datasets */}
            <section>
              <h2
                className="font-bold text-base mb-4"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Accessing a private dataset
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Private datasets require a Bearer token. Find your private key in the dataset settings inside your dashboard.
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
{`GET ${SITE_URL}/api/42/my-dataset/active/
Authorization: Bearer your_private_key`}
              </pre>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Next steps */}
            <section>
              <h2
                className="font-bold text-base mb-6"
                style={{ fontFamily: "var(--font-body)" }}
              >
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
                    <p
                      className="text-xs"
                      style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
                    >
                      {desc}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Prev / Next */}
            <div className="flex items-center justify-end pt-4">
              <Link
                href="/docs/dataset"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                Creating a dataset
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