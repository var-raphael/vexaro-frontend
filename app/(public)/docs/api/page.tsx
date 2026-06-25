import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `API Reference -- ${SITE_NAME} Docs`,
  description: "Complete API reference for Quorel. Every endpoint, parameter, response header, format, and error code.",
  openGraph: {
    title: `API Reference -- ${SITE_NAME} Docs`,
    description: "Complete API reference for Quorel. Every endpoint, parameter, response header, format, and error code.",
    url: `${SITE_URL}/docs/api`,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} API Reference`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `API Reference -- ${SITE_NAME} Docs`,
    description: "Complete API reference for Quorel. Every endpoint, parameter, response header, format, and error code.",
   images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/docs/api`,
  },
};

const URL_PARAMS = [
  { param: "dataset_id", desc: "The numeric ID of the dataset. Found in the dashboard and in the URL of any dataset page." },
  { param: "name-slug", desc: "The dataset name, lowercased and hyphenated. Must match exactly — mismatches return 404 even if the ID is correct." },
  { param: "version", desc: "active (the pinned version), latest (the most recent version), or v1, v2, v3 etc. for a specific version number." },
];

const QUERY_PARAMS = [
  {
    group: "Output format",
    params: [
      { param: "format", def: "json", desc: "Response format. One of: json, jsonl, csv, tsv, xml, parquet. csv, tsv, and parquet automatically flatten nested objects." },
      { param: "pretty", def: "true", desc: "Pretty-print JSON output with indentation. Set to false for compact single-line output. Has no effect on other formats." },
    ],
  },
  {
    group: "Pagination",
    params: [
      { param: "limit", def: "all", desc: "Maximum number of entities to return. Applied after all filters, sorting, and deduplication." },
      { param: "offset", def: "0", desc: "Skip the first N entities. Applied after filters and sorting, before limit. Use with limit for cursor-style pagination." },
      { param: "sample", def: "none", desc: "Return N randomly sampled entities. Uses cryptographically secure shuffling. Applied after filters, before offset and limit." },
      { param: "count", def: "false", desc: "Return only the count of matched entities, not the entities themselves. Response is a JSON object with count, dataset_id, version, and alt fields." },
    ],
  },
  {
    group: "Filtering",
    params: [
      { param: "filter", def: "none", desc: "Exact match on a field. Format: filter=field:value. Case-insensitive. Supports dot-notation for nested fields (filter=author.name:ada). Repeatable — multiple filters are ANDed together. Fans out across arrays." },
      { param: "filter_contains", def: "none", desc: "Partial match on a field. Format: filter_contains=field:value. Case-insensitive substring match. Repeatable and ANDed like filter. Fans out across arrays." },
      { param: "keywords", def: "none", desc: "Full-text search across every field at every depth. Comma-separated values are ORed by default. Use keywords_mode=and to require all terms." },
      { param: "keywords_mode", def: "or", desc: "Controls how multiple keywords are combined. or returns entities matching any keyword. and requires all keywords to be present." },
    ],
  },
  {
    group: "Sorting",
    params: [
      { param: "sort", def: "none", desc: "Sort by a top-level field. Format: sort=field:asc or sort=field:desc. Numeric fields sort numerically. String fields sort lexicographically. Entities where the field is missing or nested are sorted last." },
    ],
  },
  {
    group: "Field selection",
    params: [
      { param: "keep_field", def: "none", desc: "Return only the specified fields. Comma-separated. Supports dot-notation: keep_field=title,author.name keeps the full author object but strips every field inside it except name." },
      { param: "drop_field", def: "none", desc: "Remove the specified fields from every entity. Comma-separated. Supports dot-notation: drop_field=reviews.content removes content from every object in the reviews array." },
    ],
  },
  {
    group: "Cleaning",
    params: [
      { param: "dedup", def: "false", desc: "Remove duplicate entities. By default, deduplication is based on a SHA-256 hash of all fields except _source. Use dedup_key to dedup on specific fields only." },
      { param: "dedup_key", def: "none", desc: "Comma-separated list of fields to use as the deduplication key. Only meaningful when dedup=true. Example: dedup_key=title,author." },
      { param: "denull", def: "false", desc: "Recursively strip null values and empty strings at every depth. Empty arrays that result from stripping are also removed." },
      { param: "include_source", def: "true", desc: "Include the _source field (the origin URL of each entity). Set to false to strip it from the response." },
    ],
  },
  {
    group: "Structure",
    params: [
      { param: "flatten", def: "false", desc: "Flatten nested objects into dot-notation keys. Arrays of primitives are JSON-encoded into a single string cell. Arrays of objects are expanded with indexed keys: reviews_0_rating, reviews_1_rating etc. Required automatically for csv, tsv, and parquet." },
      { param: "alt", def: "false", desc: "Return the alt version of this dataset version if one exists. Equivalent to appending /alt/ to the URL path." },
    ],
  },
];

const RESPONSE_HEADERS = [
  { header: "X-RateLimit-Limit", desc: "The total number of requests allowed per minute for your authentication tier (100 for public, 300 for private)." },
  { header: "X-RateLimit-Remaining", desc: "The number of requests remaining in the current rate limit window." },
  { header: "X-RateLimit-Reset", desc: "Unix timestamp of when the current rate limit window resets." },
  { header: "X-Dataset-ID", desc: "The numeric ID of the dataset that was served." },
  { header: "X-Dataset-Version", desc: "The resolved version number, prefixed with v. e.g. v12. Useful when you requested active or latest and want to know the exact version." },
  { header: "X-Dataset-Alt", desc: "true if the alt version was served, false otherwise." },
  { header: "X-Total-Count", desc: "The number of entities in the response after all filters, deduplication, sampling, offset, and limit have been applied." },
  { header: "Retry-After", desc: "Only present on 429 responses. Number of seconds to wait before retrying." },
];

const FORMATS = [
  {
    format: "json",
    mime: "application/json",
    desc: "Default. Returns a JSON array of entity objects. Supports pretty=false for compact output.",
    notes: "Nested objects are preserved as-is unless flatten=true is set.",
  },
  {
    format: "jsonl",
    mime: "application/x-ndjson",
    desc: "Newline-delimited JSON. One entity per line. Ideal for streaming, log pipelines, and large datasets.",
    notes: "No pretty-printing. Each line is a self-contained JSON object.",
  },
  {
    format: "csv",
    mime: "text/csv",
    desc: "Comma-separated values with a header row. Response includes Content-Disposition with a filename.",
    notes: "Automatically flattens nested objects. Arrays of objects expand with indexed keys.",
  },
  {
    format: "tsv",
    mime: "text/tab-separated-values",
    desc: "Tab-separated values. Same structure as CSV but tab-delimited. Response includes Content-Disposition.",
    notes: "Automatically flattens nested objects. Arrays of objects expand with indexed keys.",
  },
  {
    format: "xml",
    mime: "application/xml",
    desc: "XML document with a <dataset> root element and one <entity> per record. Field names become element tags.",
    notes: "Non-alphanumeric characters in field names are replaced with underscores. Arrays are wrapped in a pluralized parent tag.",
  },
  {
    format: "parquet",
    mime: "application/octet-stream",
    desc: "Apache Parquet binary format. Response includes Content-Disposition. All values are coerced to strings.",
    notes: "Automatically flattens nested objects. Best for large datasets consumed by data warehouses or Pandas.",
  },
];

const ERROR_CODES = [
  { code: "400", title: "Bad Request", cases: ["Invalid path structure.", "dataset_id is not a positive integer.", "version is not active, latest, or vN.", "format is not one of the supported values."] },
  { code: "401", title: "Unauthorized", cases: ["Private dataset accessed without an Authorization header. Response includes WWW-Authenticate: Bearer."] },
  { code: "403", title: "Forbidden", cases: ["Authorization header present but the Bearer token does not match the dataset's private key."] },
  { code: "404", title: "Not Found", cases: ["No dataset with the given ID exists.", "The name slug does not match the dataset's name.", "The requested version does not exist.", "Dataset has no active version and active was requested.", "alt=true was requested but no alt version exists for this version."] },
  { code: "405", title: "Method Not Allowed", cases: ["Any method other than GET."] },
  { code: "410", title: "Gone", cases: ["The dataset exists but has been frozen. The endpoint will never return new data."] },
  { code: "429", title: "Too Many Requests", cases: ["Rate limit exceeded. Check X-RateLimit-Reset and Retry-After headers."] },
  { code: "500", title: "Internal Server Error", cases: ["The dataset file could not be read from storage.", "The dataset file could not be parsed."] },
];

const PIPELINE_ORDER = [
  { n: "01", label: "Load entities from storage" },
  { n: "02", label: "Strip _source (if include_source=false)" },
  { n: "03", label: "denull — recursive null and empty string removal" },
  { n: "04", label: "keep_field — retain only specified dot-notation paths" },
  { n: "05", label: "drop_field — remove specified dot-notation paths" },
  { n: "06", label: "filter — exact match on fields" },
  { n: "07", label: "filter_contains — partial match on fields" },
  { n: "08", label: "keywords — full-text search across all values" },
  { n: "09", label: "sort — sort by a top-level field" },
  { n: "10", label: "dedup — deduplicate by hash or key" },
  { n: "11", label: "sample — cryptographically random subset" },
  { n: "12", label: "offset — skip first N entities" },
  { n: "13", label: "limit — cap the result set" },
  { n: "14", label: "flatten — flatten nested objects (auto for csv, tsv, parquet)" },
  { n: "15", label: "Serialize to requested format" },
];

const RATE_LIMITS = [
  { type: "Public (no auth)", limit: "100 requests / minute / IP" },
  { type: "Private (Bearer token)", limit: "300 requests / minute / IP" },
];

const NEXT_STEPS = [
  { label: "Dataset", href: "/docs/dataset", desc: "Schema, URLs, SERP intent, and plan limits." },
  { label: "MCP", href: "/docs/mcp", desc: "Connect your datasets to Claude and other agents." },
  { label: "Versioning and rollback", href: "/docs/versioning", desc: "How versions work and how to roll back." },
  { label: "Webhooks", href: "/docs/webhooks", desc: "Get notified the moment a refresh finishes." },
];

export default function APIPage() {
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
            <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--muted-2)" }}>Home</Link>
            <span>/</span>
            <Link href="/docs/quickstart" className="hover:text-white transition-colors" style={{ color: "var(--muted-2)" }}>Docs</Link>
            <span>/</span>
            <span style={{ color: "var(--fg)" }}>API</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent-color)" }}>
              API Reference
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Every parameter. Every header. Every format.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
              One endpoint. Stack as many query params as you need. Public datasets require no authentication.
            </p>
          </div>

          <div className="space-y-14">

            {/* Endpoint */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Endpoint</h2>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`GET ${SITE_URL}/api/{dataset_id}/{name-slug}/{version}/`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {URL_PARAMS.map(({ param, desc }, i) => (
                  <div
                    key={param}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < URL_PARAMS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{param}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <p className="font-mono text-xs mt-6 mb-2" style={{ color: "var(--muted-2)" }}>Alt version shorthand</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`GET ${SITE_URL}/api/{dataset_id}/{name-slug}/{version}/alt/
# equivalent to ?alt=true`}
              </pre>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Authentication */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Authentication</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Public datasets require no authentication. Private datasets require a Bearer token sent in the Authorization header. Find your private key in the dataset settings inside your dashboard.
              </p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`GET ${SITE_URL}/api/42/my-dataset/active/
Authorization: Bearer your_private_key`}
              </pre>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Rate limits */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Rate limits</h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {RATE_LIMITS.map(({ type, limit }, i) => (
                  <div
                    key={type}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < RATE_LIMITS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--fg)" }}>{type}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{limit}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                Rate limits are per IP. Private auth uses a separate bucket from public requests on the same IP.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Query params */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>Query parameters</h2>
              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                All parameters are optional. They are applied in a fixed pipeline order — see the{" "}
                <a href="#pipeline" style={{ color: "var(--accent-color)" }} className="underline underline-offset-2">
                  processing pipeline
                </a>{" "}
                section below for the exact sequence.
              </p>

              <div className="space-y-8">
                {QUERY_PARAMS.map(({ group, params }) => (
                  <div key={group}>
                    <p
                      className="font-mono text-xs tracking-widest uppercase mb-3"
                      style={{ color: "var(--muted-2)" }}
                    >
                      {group}
                    </p>
                    <div style={{ border: "1px solid var(--line-color)" }}>
                      {params.map(({ param, def, desc }, i) => (
                        <div
                          key={param}
                          className="px-4 py-3 text-xs"
                          style={{ borderBottom: i < params.length - 1 ? "1px solid var(--line-color)" : "none" }}
                        >
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-mono" style={{ color: "var(--accent-color)" }}>{param}</span>
                            <span className="font-mono text-xs" style={{ color: "var(--muted-2)" }}>default: {def}</span>
                          </div>
                          <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Response headers */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Response headers</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Every successful response includes these headers, regardless of format.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {RESPONSE_HEADERS.map(({ header, desc }, i) => (
                  <div
                    key={header}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < RESPONSE_HEADERS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{header}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Formats */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Response formats</h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {FORMATS.map(({ format, mime, desc, notes }, i) => (
                  <div
                    key={format}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < FORMATS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: "var(--accent-color)" }}>{format}</span>
                      <span className="font-mono" style={{ color: "var(--muted-2)" }}>{mime}</span>
                    </div>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                    <p className="mt-1" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{notes}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Processing pipeline */}
            <section id="pipeline">
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>Processing pipeline</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Query parameters are always applied in this fixed order, regardless of the order you write them in the URL. Understanding the sequence matters when combining filters, dedup, sample, and pagination.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {PIPELINE_ORDER.map(({ n, label }, i) => (
                  <div
                    key={n}
                    className="px-4 py-3 text-xs flex items-center gap-4"
                    style={{ borderBottom: i < PIPELINE_ORDER.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <span className="font-mono shrink-0" style={{ color: "var(--muted-2)" }}>{n}</span>
                    <span style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Examples */}
            <section>
              <h2 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-body)" }}>Examples</h2>

              <div className="space-y-6">

                <div>
                  <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Top 10 HN stories sorted by score</p>
                  <pre
                    className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                    style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  >
{`GET ${SITE_URL}/api/1/hacker-news-top/active/
    ?limit=10
    &sort=score:desc`}
                  </pre>
                </div>

                <div>
                  <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Remote jobs mentioning "React" or "TypeScript", title and salary only</p>
                  <pre
                    className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                    style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  >
{`GET ${SITE_URL}/api/2/remote-jobs/active/
    ?keywords=React,TypeScript
    &keep_field=title,salary
    &sort=salary:desc
    &denull=true`}
                  </pre>
                </div>

                <div>
                  <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Count of YC companies in the finance category</p>
                  <pre
                    className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                    style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  >
{`GET ${SITE_URL}/api/4/yc-companies/active/
    ?filter=category:finance
    &count=true`}
                  </pre>
                </div>

                <div>
                  <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>5 random AI papers, deduplicated by title, as CSV</p>
                  <pre
                    className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                    style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  >
{`GET ${SITE_URL}/api/7/arxiv-ai-papers/latest/
    ?dedup=true
    &dedup_key=title
    &sample=5
    &format=csv
    &drop_field=_source`}
                  </pre>
                </div>

                <div>
                  <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Private dataset with Bearer token, compact JSON</p>
                  <pre
                    className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                    style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                  >
{`GET ${SITE_URL}/api/99/my-private-dataset/active/?pretty=false
Authorization: Bearer your_private_key`}
                  </pre>
                </div>

              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Error codes */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Error codes</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                All error responses are plain text with an appropriate HTTP status code. Error bodies are human-readable descriptions of what went wrong.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {ERROR_CODES.map(({ code, title, cases }, i) => (
                  <div
                    key={code}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < ERROR_CODES.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono" style={{ color: "var(--accent-color)" }}>{code}</span>
                      <span className="font-mono" style={{ color: "var(--fg)" }}>{title}</span>
                    </div>
                    <ul className="space-y-1">
                      {cases.map((c, j) => (
                        <li key={j} style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6", paddingLeft: "0.75rem", borderLeft: "1px solid var(--line-color)" }}>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Next steps */}
            <section>
              <h2 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-body)" }}>Next steps</h2>
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
                    <p className="text-xs" style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}>{desc}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* Prev / Next */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/docs/dataset"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
                Dataset
              </Link>
              <Link
                href="/docs/mcp"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                MCP
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