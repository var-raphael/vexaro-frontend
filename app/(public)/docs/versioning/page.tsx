import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Versioning -- ${SITE_NAME} Docs`,
  description: "How Quorel versions every refresh, how to roll back, how alt versions work, and how to diff any two versions.",
  openGraph: {
    title: `Versioning -- ${SITE_NAME} Docs`,
    description: "How Quorel versions every refresh, how to roll back, how alt versions work, and how to diff any two versions.",
    url: `${SITE_URL}/docs/versioning`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Versioning -- ${SITE_NAME} Docs`,
    description: "How Quorel versions every refresh, how to roll back, how alt versions work, and how to diff any two versions.",
  },
  alternates: {
    canonical: `${SITE_URL}/docs/versioning`,
  },
};

const VERSION_FIELDS = [
  { field: "version_number", type: "number", desc: "Monotonically incrementing integer. Starts at 1 and increases by 1 on every successful refresh. Never reused." },
  { field: "file_path", type: "string", desc: "Internal storage path of the version file. Not exposed via the public API." },
  { field: "alt_file_path", type: "string | null", desc: "Internal storage path of the alt version file, if one exists. Null otherwise." },
  { field: "entity_count", type: "number", desc: "Number of entities in this version." },
  { field: "file_size_bytes", type: "number", desc: "Size of the version file in bytes." },
  { field: "is_active", type: "boolean", desc: "Whether this version is the current active version. Only one version can be active at a time." },
  { field: "created_at", type: "string", desc: "ISO 8601 timestamp of when this version was created." },
];

const VERSION_REFS = [
  { ref: "active", desc: "The pinned active version. Controlled by rollback. This is what consumers should use by default — it only changes when you explicitly pin a new version or a refresh completes." },
  { ref: "latest", desc: "The highest version number in the dataset. After a nightly refresh, latest is the new version. active only moves to match if no rollback is in effect." },
  { ref: "v1, v2, v3…", desc: "A specific version by number. Immutable. The data at v3 will always be exactly what was captured at that refresh." },
];

const ALT_FIELDS = [
  { field: "alt=true", desc: "Query parameter. Returns the alt version of the requested version. Equivalent to appending /alt/ to the path." },
  { field: "/alt/", desc: "URL path suffix. GET /api/42/my-dataset/v3/alt/ returns the alt for v3." },
];

const ALT_SOURCES = [
  {
    label: "Dashboard",
    desc: "Open any version in the dashboard, switch to the Alt tab, edit or replace the entity list manually, and save. The alt is written immediately.",
  },
  {
    label: "MCP agent (push_alt_version)",
    desc: "Call pull_for_edit to get the raw entities, process them with Claude, then push_alt_version to write the result back as the alt. The original is never touched.",
  },
  {
    label: "API (web alternate save)",
    desc: "POST to /dataset/alternate/save with dataset_id, version, and a JSON array of entities. The alt is written to storage and the alt_file_path is recorded against the version.",
  },
];

const ROLLBACK_NOTES = [
  { label: "What rollback does", desc: "Sets active_version to the specified version_number. The API immediately starts serving that version at ?version=active. No data is deleted or modified." },
  { label: "What rollback does not do", desc: "Rollback does not delete newer versions. v5, v6, v7 are all still accessible by number after rolling back to v3. Nothing is ever destroyed." },
  { label: "Freeze on rollback", desc: "You can optionally freeze the dataset at rollback time by passing freeze: true. This locks the dataset at that version permanently and prevents future refreshes." },
  { label: "Unfreezing", desc: "Unfreezing re-activates the dataset for nightly refreshes. It counts against your plan's active dataset limit. A frozen dataset does not count toward the limit." },
];

const DIFF_FIELDS = [
  { field: "added", type: "number", desc: "Number of entities present in v2 but not in v1." },
  { field: "subtracted", type: "number", desc: "Number of entities present in v1 but not in v2." },
  { field: "modified", type: "number", desc: "Number of entities matched across versions where at least one field value changed." },
  { field: "total_v1", type: "number", desc: "Total entity count in v1." },
  { field: "total_v2", type: "number", desc: "Total entity count in v2." },
  { field: "records", type: "array", desc: "Array of diff records. Each has id, change_type (added / subtracted / modified), source, v1, v2, and field_diffs for modified records." },
];

const DIFF_CHANGE_TYPES = [
  { type: "added", desc: "Entity exists in v2 but not v1. v1 is null." },
  { type: "subtracted", desc: "Entity exists in v1 but not v2. v2 is null." },
  { type: "modified", desc: "Entity matched across versions (same source URL, similar field values). field_diffs lists exactly which fields changed and shows v1 and v2 values side by side." },
];

const NEXT_STEPS = [
  { label: "API reference", href: "/docs/api", desc: "Query specific versions via the active, latest, or vN URL params." },
  { label: "MCP", href: "/docs/mcp", desc: "pull_for_edit and push_alt_version for agent-driven alt versions." },
  { label: "Dataset", href: "/docs/dataset", desc: "Alt versions, frozen datasets, and clone behavior." },
  { label: "Webhooks", href: "/docs/webhooks", desc: "Get notified the moment a new version is created." },
];

export default function VersioningPage() {
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
            <span style={{ color: "var(--fg)" }}>Versioning</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent-color)" }}>
              Versioning
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Nothing is ever overwritten.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
              Every refresh creates a new version. Every version is permanent. You can roll back to any prior state, diff any two versions, and publish a cleaned alt alongside the original — all without touching the source data.
            </p>
          </div>

          <div className="space-y-14">

            {/* How versions are created */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>How versions are created</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                A new version is created every time a refresh completes successfully — whether triggered by the nightly scheduler, a ping URL hit, or a manual refresh from the dashboard. Version numbers are monotonically incrementing integers starting at 1. They are never reused or deleted.
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                When a new version is created, it automatically becomes the active version unless you have manually rolled back to a specific version, in which case active stays pinned where you left it.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Version fields */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Version fields</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Each version record exposed by <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>/dataset/view</code> contains these fields.
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {VERSION_FIELDS.map(({ field, type, desc }, i) => (
                  <div
                    key={field}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < VERSION_FIELDS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: "var(--accent-color)" }}>{field}</span>
                      <span className="font-mono" style={{ color: "var(--muted-2)" }}>{type}</span>
                    </div>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Accessing versions via the API */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Accessing versions via the API</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                The third segment of every API URL is the version reference. Three forms are accepted.
              </p>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {VERSION_REFS.map(({ ref, desc }, i) => (
                  <div
                    key={ref}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < VERSION_REFS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{ref}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mt-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`GET ${SITE_URL}/api/42/my-dataset/active/   # pinned version
GET ${SITE_URL}/api/42/my-dataset/latest/   # most recent version
GET ${SITE_URL}/api/42/my-dataset/v3/       # exactly version 3`}
              </pre>

              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                The resolved version number is always returned in the <code className="font-mono" style={{ color: "var(--accent-color)" }}>X-Dataset-Version</code> response header, so you always know exactly which version you received even when requesting <code className="font-mono" style={{ color: "var(--accent-color)" }}>active</code> or <code className="font-mono" style={{ color: "var(--accent-color)" }}>latest</code>.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Rollback */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Rollback</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Rolling back pins <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>active</code> to any prior version. The dataset continues to refresh nightly and newer versions keep accumulating — they just aren't served at <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>active</code> until you update the pin.
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Request</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`POST /dataset/rollback
Authorization: <session>

{
  "dataset_id": 42,
  "version_number": 3,
  "freeze": false
}`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {ROLLBACK_NOTES.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < ROLLBACK_NOTES.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Alt versions */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>Alt versions</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Every version can have an alt — a separate copy of the entities for that version that lives alongside the original without replacing it. Alts are useful for cleaned, enriched, or deduplicated versions of the same data. The original is never modified.
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Accessing an alt</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`# Via query param
GET ${SITE_URL}/api/42/my-dataset/active/?alt=true

# Via URL path suffix
GET ${SITE_URL}/api/42/my-dataset/v3/alt/`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)", marginBottom: "1.5rem" }}>
                {ALT_FIELDS.map(({ field, desc }, i) => (
                  <div
                    key={field}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < ALT_FIELDS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{field}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <p
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                How alt versions are created
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {ALT_SOURCES.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < ALT_SOURCES.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                Requesting an alt that doesn't exist returns 404. Check <code className="font-mono" style={{ color: "var(--accent-color)" }}>X-Dataset-Alt</code> in the response headers to confirm whether an alt was served.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Deleting an alt */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Deleting an alt</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Alts can be deleted independently of the original version. The original is unaffected.
              </p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`DELETE /dataset/alternate/delete
Authorization: <session>

{
  "dataset_id": 42,
  "version": 3
}`}
              </pre>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                The alt file is removed from storage and <code className="font-mono" style={{ color: "var(--accent-color)" }}>alt_file_path</code> is set to null on the version record. The version itself is untouched.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Diff */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>Diffing two versions</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Any two versions of the same dataset can be diffed. Quorel matches entities across versions using their source URL and a weighted field-similarity score, then classifies each change as added, subtracted, or modified.
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Request</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`GET /dataset/diff?dataset_id=42&v1=3&v2=5`}
              </pre>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Response shape</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`{
  "added": 12,
  "subtracted": 3,
  "modified": 27,
  "total_v1": 801,
  "total_v2": 847,
  "records": [
    {
      "id": "rec_0001",
      "change_type": "modified",
      "source": "https://example.com/job/123",
      "v1": { "title": "Senior Engineer", "salary": 120000 },
      "v2": { "title": "Senior Engineer", "salary": 135000 },
      "field_diffs": [
        { "field": "salary", "v1": 120000, "v2": 135000 }
      ]
    }
  ]
}`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)", marginBottom: "1.5rem" }}>
                {DIFF_FIELDS.map(({ field, type, desc }, i) => (
                  <div
                    key={field}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < DIFF_FIELDS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: "var(--accent-color)" }}>{field}</span>
                      <span className="font-mono" style={{ color: "var(--muted-2)" }}>{type}</span>
                    </div>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <p
                className="text-sm font-semibold mb-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Change types
              </p>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {DIFF_CHANGE_TYPES.map(({ type, desc }, i) => (
                  <div
                    key={type}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < DIFF_CHANGE_TYPES.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{type}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                Entity matching is weighted by field cardinality — fields with more unique values across the dataset carry more weight in the similarity score. A minimum similarity threshold of 0.3 is required for two entities to be considered a match. Below that threshold, both are treated as independent additions and subtractions.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Clones and versions */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Clones and versions</h2>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                When you clone a public dataset, the clone receives v1 containing a copy of the source dataset's latest version at the time of cloning. If the source dataset had an alt on that version, the alt is also copied into the clone's v1.
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                From that point on, the clone's version history is entirely independent. Future refreshes of the source dataset do not affect the clone. The clone's v2, v3, and beyond come from its own nightly refreshes against its own source URLs.
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
                href="/docs/webhooks"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
                Webhooks
              </Link>
              <Link
                href="/docs/faq"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                FAQ
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