import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `MCP -- ${SITE_NAME} Docs`,
  description: "Connect your Quorel datasets to Claude and any MCP-compatible agent. Query, filter, and push alt versions conversationally.",
  openGraph: {
    title: `MCP -- ${SITE_NAME} Docs`,
    description: "Connect your Quorel datasets to Claude and any MCP-compatible agent.",
    url: `${SITE_URL}/docs/mcp`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `MCP -- ${SITE_NAME} Docs`,
    description: "Connect your Quorel datasets to Claude and any MCP-compatible agent.",
  },
  alternates: {
    canonical: `${SITE_URL}/docs/mcp`,
  },
};

const TOOLS = [
  {
    name: "list_datasets",
    desc: "List all datasets owned by the authenticated user.",
    args: [],
    returns: "An array of datasets with dataset_id, name, dataset_type, active_version, entity_count, and last_refresh.",
  },
  {
    name: "get_dataset_schema",
    desc: "Get the field schema of a dataset. Call this before query_dataset to understand what fields are available for filtering and sorting.",
    args: [
      { name: "dataset_id", type: "number", required: true, desc: "The dataset ID to inspect." },
    ],
    returns: "The dataset name, type, field list, field details with types and descriptions, entity count, and include flags for links, images, and files.",
  },
  {
    name: "query_dataset",
    desc: "Query a dataset with filters, keywords, sorting, and pagination. Supports all output formats.",
    args: [
      { name: "dataset_id", type: "number", required: true, desc: "The dataset ID to query." },
      { name: "version", type: "string", required: false, desc: "active (default), latest, or v1, v2 etc." },
      { name: "format", type: "string", required: false, desc: "json (default), jsonl, csv, tsv, xml, parquet." },
      { name: "keywords", type: "string", required: false, desc: "Comma-separated keywords. Searched across all fields at every depth." },
      { name: "keywords_mode", type: "string", required: false, desc: "or (default) matches any keyword. and requires all." },
      { name: "filter", type: "string", required: false, desc: "Exact field match. Format: field:value. Dot-notation supported." },
      { name: "filter_contains", type: "string", required: false, desc: "Partial field match. Format: field:value. Dot-notation supported." },
      { name: "keep_field", type: "string", required: false, desc: "Comma-separated fields to keep. Dot-notation supported." },
      { name: "drop_field", type: "string", required: false, desc: "Comma-separated fields to remove. Dot-notation supported." },
      { name: "sort", type: "string", required: false, desc: "Sort by top-level field. Format: field:asc or field:desc." },
      { name: "limit", type: "number", required: false, desc: "Max number of results to return." },
      { name: "offset", type: "number", required: false, desc: "Number of results to skip." },
      { name: "sample", type: "number", required: false, desc: "Return N randomly sampled results using cryptographically secure shuffling." },
      { name: "dedup", type: "boolean", required: false, desc: "Remove duplicate entities." },
      { name: "dedup_key", type: "string", required: false, desc: "Comma-separated fields to use as the dedup key. Only meaningful when dedup is true." },
      { name: "denull", type: "boolean", required: false, desc: "Recursively strip null values and empty strings at all depths." },
      { name: "flatten", type: "boolean", required: false, desc: "Flatten nested objects and arrays into top-level dot-notation keys." },
      { name: "include_source", type: "boolean", required: false, desc: "Include the _source field. Default true." },
      { name: "count", type: "boolean", required: false, desc: "Return only the count of matching entities, not the entities themselves." },
    ],
    returns: "The matching entities in the requested format, or a count object if count is true.",
  },
  {
    name: "pull_for_edit",
    desc: "Pull the full unfiltered entity list from a dataset version for AI processing. Use push_alt_version to save the processed result back.",
    args: [
      { name: "dataset_id", type: "number", required: true, desc: "The dataset ID to pull from." },
      { name: "version", type: "string", required: false, desc: "active (default), latest, or v1, v2 etc." },
      { name: "use_alt", type: "boolean", required: false, desc: "Set true to pull the existing alt version instead of the original." },
    ],
    returns: "An object with dataset_id, version, is_alt, entity_count, and the full entities array.",
  },
  {
    name: "push_alt_version",
    desc: "Push AI-processed entities back as the alt version of a dataset version. Always writes to alt — never overwrites the original. The dataset must not be frozen or currently processing.",
    args: [
      { name: "dataset_id", type: "number", required: true, desc: "The dataset ID to push to." },
      { name: "version", type: "number", required: true, desc: "The version number to attach the alt to." },
      { name: "entities", type: "string", required: true, desc: "A JSON array of processed entities to save as the alt version." },
    ],
    returns: "Confirmation with ok, dataset_id, version, entity_count, and the alt file path.",
  },
];

const TOKEN_ENDPOINTS = [
  {
    method: "POST",
    path: "/mcp/token",
    auth: "Session cookie (dashboard auth)",
    desc: "Generate a new MCP token for the authenticated user. If a token already exists, it is replaced.",
    response: `{ "ok": true, "token": "abc123...", "created_at": "2026-01-01T00:00:00Z" }`,
  },
  {
    method: "DELETE",
    path: "/mcp/token/revoke",
    auth: "Session cookie (dashboard auth)",
    desc: "Revoke the current MCP token. The SSE connection will reject any further requests using the old token.",
    response: `{ "ok": true }`,
  },
  {
    method: "GET",
    path: "/mcp/token/view",
    auth: "Session cookie (dashboard auth)",
    desc: "Check whether a token exists and whether it is active.",
    response: `{ "has_token": true, "token": "abc123...", "is_active": true, "last_used_at": "...", "created_at": "..." }`,
  },
];

const WORKFLOW_STEPS = [
  {
    n: "01",
    title: "list_datasets",
    body: "Start by listing your datasets to find the dataset_id you want to work with.",
  },
  {
    n: "02",
    title: "get_dataset_schema",
    body: "Inspect the schema to understand which fields are available before writing filters or sort expressions.",
  },
  {
    n: "03",
    title: "query_dataset",
    body: 'Query with keywords, filters, and sorting to get the slice you need. Use count=true first to check how many entities match before fetching them all.',
  },
  {
    n: "04",
    title: "pull_for_edit",
    body: "Pull the full unfiltered entity list when you want Claude to clean, deduplicate, enrich, or restructure the data.",
  },
  {
    n: "05",
    title: "push_alt_version",
    body: "Push the processed entities back as the alt version. The original is never touched. The alt is immediately available via the API at ?alt=true.",
  },
];

const NEXT_STEPS = [
  { label: "API reference", href: "/docs/api", desc: "Every query parameter, header, and format." },
  { label: "Dataset", href: "/docs/dataset", desc: "Schema, URLs, SERP intent, and plan limits." },
  { label: "Versioning and rollback", href: "/docs/versioning", desc: "How versions and alt versions work." },
  { label: "Webhooks", href: "/docs/webhooks", desc: "Get notified the moment a refresh finishes." },
];

export default function MCPPage() {
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
            <span style={{ color: "var(--fg)" }}>MCP</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent-color)" }}>
              MCP
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Your datasets, callable by Claude.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
              Every Quorel dataset ships with a native MCP server. Claude — or any MCP-compatible agent — can list, query, filter, and clean your data without you writing a script. Included on every plan.
            </p>
          </div>

          <div className="space-y-14">

            {/* How it connects */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                How it connects
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Quorel uses the MCP SSE transport. Your agent connects to a token-scoped SSE endpoint and receives tool definitions it can call in any order.
              </p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`# SSE endpoint
${SITE_URL}/mcp/{your_mcp_token}/

# Token in URL (recommended for Claude Desktop)
${SITE_URL}/mcp/abc123def456.../

# Token as Bearer header (for programmatic clients)
GET ${SITE_URL}/mcp/{token}/
Authorization: Bearer abc123def456...`}
              </pre>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                The token is scoped to your account. All five tools operate on datasets you own — they cannot access other users' private datasets.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Getting a token */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Getting a token
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Generate your MCP token from the dashboard under Settings → MCP, or via the API below. Each account has one active token at a time. Generating a new one immediately invalidates the old one.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {TOKEN_ENDPOINTS.map(({ method, path, auth, desc, response }, i) => (
                  <div
                    key={path + method}
                    className="px-4 py-4 text-xs"
                    style={{ borderBottom: i < TOKEN_ENDPOINTS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className="font-mono px-1.5 py-0.5"
                        style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}
                      >
                        {method}
                      </span>
                      <span className="font-mono" style={{ color: "var(--fg)" }}>{path}</span>
                    </div>
                    <p className="mb-1" style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                    <p className="mb-2" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>Auth: {auth}</p>
                    <pre
                      className="font-mono text-xs p-3 overflow-x-auto rounded-sm"
                      style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                    >
                      {response}
                    </pre>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Claude Desktop setup */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Connecting Claude Desktop
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Add the following to your <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>claude_desktop_config.json</code>. Replace the token with the one from your dashboard.
              </p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`{
  "mcpServers": {
    "vexaro": {
      "url": "${SITE_URL}/mcp/your_mcp_token/"
    }
  }
}`}
              </pre>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                Restart Claude Desktop after saving. The five Quorel tools will appear in Claude's tool list automatically.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Tools */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Tools
              </h2>
              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Five tools are exposed. All require a valid MCP token. All are scoped to datasets you own.
              </p>

              <div className="space-y-6">
                {TOOLS.map(({ name, desc, args, returns }) => (
                  <div key={name} style={{ border: "1px solid var(--line-color)" }}>
                    {/* Tool header */}
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line-color)", background: "#0f0f0f" }}>
                      <p className="font-mono text-sm" style={{ color: "var(--accent-color)" }}>{name}</p>
                      <p className="text-xs mt-1" style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                    </div>

                    {/* Args */}
                    {args.length > 0 && (
                      <div style={{ borderBottom: "1px solid var(--line-color)" }}>
                        <p className="px-4 pt-3 pb-1 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted-2)" }}>
                          Arguments
                        </p>
                        {args.map(({ name: argName, type, required, desc: argDesc }, i) => (
                          <div
                            key={argName}
                            className="px-4 py-2 text-xs"
                            style={{ borderTop: i > 0 ? "1px solid var(--line-color)" : "none" }}
                          >
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-mono" style={{ color: "var(--fg)" }}>{argName}</span>
                              <span className="font-mono" style={{ color: "var(--muted-2)" }}>{type}</span>
                              {required && (
                                <span
                                  className="font-mono text-xs px-1"
                                  style={{ color: "var(--accent-color)", border: "1px solid var(--accent-color)", fontSize: "0.6rem" }}
                                >
                                  required
                                </span>
                              )}
                            </div>
                            <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{argDesc}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Returns */}
                    <div className="px-4 py-3 text-xs">
                      <span className="font-mono" style={{ color: "var(--muted-2)" }}>returns </span>
                      <span style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{returns}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Recommended workflow */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>
                Recommended workflow
              </h2>
              <p
                className="text-sm leading-relaxed mb-8"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                The five tools form a natural pipeline. You don't have to use all of them — query_dataset alone covers most use cases.
              </p>
              <div className="space-y-8">
                {WORKFLOW_STEPS.map(({ n, title, body }, i) => (
                  <div key={n} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className="font-mono text-xs w-8 h-8 flex items-center justify-center"
                        style={{ border: "1px solid var(--line-color)", color: "var(--accent-color)" }}
                      >
                        {n}
                      </span>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className="flex-1 w-px mt-2" style={{ background: "var(--line-color)", minHeight: "2rem" }} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-mono text-xs mb-1" style={{ color: "var(--accent-color)" }}>{title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Live example */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Example session
              </h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                A Claude session that queries a remote jobs dataset, then cleans and publishes an alt version.
              </p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`> list_datasets()
→ 3 datasets found
  id=12  remote-jobs       847 entities  v14
  id=7   yc-companies      412 entities  v6
  id=3   arxiv-ai-papers   1,204 entities v22

> get_dataset_schema(dataset_id: 12)
→ fields: title, company, salary, stack, location, type, _source

> query_dataset(
    dataset_id: 12,
    keywords: "React,TypeScript",
    keywords_mode: "and",
    filter_contains: "location:remote",
    sort: "salary:desc",
    limit: 10,
    drop_field: "_source"
  )
→ 10 entities returned

> query_dataset(dataset_id: 12, count: true)
→ { "count": 847 }

> pull_for_edit(dataset_id: 12, version: "active")
→ 847 entities pulled

  Claude deduplicates on title+company,
  fills missing salary fields from context,
  removes 12 listings with no stack specified.

> push_alt_version(
    dataset_id: 12,
    version: 14,
    entities: "[...]"
  )
→ { "ok": true, "entity_count": 791, "version": 14 }
  live at /api/12/remote-jobs/v14/?alt=true`}
              </pre>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Alt version note */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>
                Alt versions and safety
              </h2>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>push_alt_version</code>{" "}
                never touches the original version. It writes a separate file and records it as the alt path for that version in the database. Two things will block a push:
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {[
                  { label: "Dataset is frozen", desc: "Frozen datasets are permanently locked. Clone the dataset first if you want to push an alt." },
                  { label: "Dataset is currently processing", desc: "If a refresh is in progress, the push is rejected. Wait for the refresh to complete, then retry." },
                ].map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i === 0 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                Once pushed, the alt is accessible via the REST API at{" "}
                <code className="font-mono" style={{ color: "var(--accent-color)" }}>?alt=true</code>{" "}
                or <code className="font-mono" style={{ color: "var(--accent-color)" }}>/vN/alt/</code> and is versioned alongside the original.
              </p>
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
                    <p className="text-sm font-semibold mb-1 group-hover:opacity-80 transition-opacity" style={{ fontFamily: "var(--font-body)", color: "var(--accent-color)" }}>
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
                href="/docs/api"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
                API reference
              </Link>
              <Link
                href="/docs/webhooks"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                Webhooks
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