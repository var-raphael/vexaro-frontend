import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `FAQ -- ${SITE_NAME} Docs`,
  description: "Answers to the most common questions about Quorel datasets, the API, pricing, and how things work under the hood.",
  openGraph: {
    title: `FAQ -- ${SITE_NAME} Docs`,
    description: "Answers to the most common questions about Quorel.",
    url: `${SITE_URL}/docs/faq`,
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
    title: `FAQ -- ${SITE_NAME} Docs`,
    description: "Answers to the most common questions about Quorel.",
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/docs/faq`,
  },
};

const FAQS = [
  {
    group: "Getting started",
    items: [
      {
        q: "Do I need an account to use Quorel?",
        a: "No. Every public dataset is accessible via GET request with no account, no API key, and no signup. You only need an account to create your own datasets, access private datasets, or use MCP.",
      },
      {
        q: "How long does it take for my first dataset to be ready?",
        a: "Usually a few minutes. Once you submit, Quorel crawls your URLs, runs AI extraction against your schema, and creates v1. You will receive a notification when it is done. Larger datasets with many URLs take longer.",
      },
      {
        q: "Can I try Quorel without a credit card?",
        a: "Yes. The Free plan requires no credit card and gives you one dataset with up to 20 URLs and 10 SERP-discovered URLs. You can hit the API, download data, use MCP, and roll back versions — all for free.",
      },
      {
        q: "What kinds of websites can Quorel crawl?",
        a: "Any publicly accessible web page. Quorel cannot crawl pages that require login, are behind paywalls, or actively block automated access. Reddit is supported natively via the Reddit JSON API. Amazon products are supported via a dedicated Amazon integration.",
      },
    ],
  },
  {
    group: "Datasets and schema",
    items: [
      {
        q: "What happens if my schema doesn't match what's on the page?",
        a: "The AI extractor does its best to map page content to your schema. Fields that cannot be found are returned as null. If you're getting too many nulls, try making your field descriptions more specific — the more context you give, the better the extraction.",
      },
      {
        q: "Can I change my schema after the dataset is created?",
        a: "Yes. Edit the schema from your dashboard. If the schema changes, any URLs with cached crawl data are automatically re-queued for re-extraction against the new schema. A new version is created when re-extraction completes.",
      },
      {
        q: "Can I add or remove URLs after the dataset is created?",
        a: "Yes. You can add new URLs or delete existing ones from the edit page in your dashboard. New URLs are queued immediately. Deleted URLs are removed from future refreshes but do not affect existing versions.",
      },
      {
        q: "What is the extract intent and how is it different from the SERP intent?",
        a: "The SERP intent is used to discover source URLs via web search — it answers the question 'where should Quorel look?'. The extract intent tells the AI what to extract from those pages — it answers 'what do you want from each page?'. Both are plain English. The extract intent must be at least 20 characters.",
      },
      {
        q: "Why can't I edit my dataset right now?",
        a: "Edits are blocked while a refresh is in progress. Wait for the current refresh to complete, then try again. You can check the status of each URL in your dashboard.",
      },
      {
        q: "What does freezing a dataset do?",
        a: "Freezing locks the dataset permanently at its current active version. No future refreshes will run. The API endpoint stays live and returns the frozen version indefinitely. Frozen datasets do not count against your plan's active dataset limit. Freeze is irreversible — clone the dataset first if you want an active copy.",
      },
      {
        q: "Can I rename a dataset?",
        a: "You can set an alias for your dataset from the edit page. The alias becomes the display name and the name-slug used in API URLs. The original internal name is preserved in the database but the alias takes precedence everywhere it is shown.",
      },
    ],
  },
  {
    group: "API and access",
    items: [
      {
        q: "What is the difference between active, latest, and vN in the API URL?",
        a: "active is the pinned version you control — it only changes when a new refresh completes or when you manually roll back. latest is always the highest version number. vN is an immutable reference to a specific version. For production consumers, always use active so you control when breaking changes land.",
      },
      {
        q: "My request returned 404 even though the dataset ID is correct.",
        a: "The name slug in the URL must match the dataset's display name exactly, lowercased and hyphenated. If you set an alias, the slug is derived from the alias, not the original name. Double-check the slug against what appears in your dashboard.",
      },
      {
        q: "I'm getting 429 rate limit errors. What should I do?",
        a: "Public requests are limited to 100 per minute per IP. Authenticated private requests get 300 per minute. Check the X-RateLimit-Reset header for when the window resets and the Retry-After header for how many seconds to wait. If you need higher limits, consider upgrading your plan.",
      },
      {
        q: "Can I download data instead of hitting the API?",
        a: "Yes. Every version is downloadable from the dashboard in JSON, CSV, JSONL, XML, TSV, or Parquet format. You can also add format=csv (or any other format) to your API request and the response will include a Content-Disposition header for direct download.",
      },
      {
        q: "Does the API support pagination?",
        a: "Yes. Use offset and limit query parameters. For example, offset=100&limit=50 returns entities 101–150. The X-Total-Count response header tells you how many entities matched after all filters were applied, so you can calculate total pages.",
      },
      {
        q: "Can I filter on nested fields?",
        a: "Yes. Both filter and filter_contains support dot-notation. For example, filter=author.location:london filters entities where the author object has a location field equal to 'london'. Filtering fans out across arrays — filter=reviews.rating:5 matches any entity where at least one review has a rating of 5.",
      },
    ],
  },
  {
    group: "Versioning",
    items: [
      {
        q: "Can I accidentally lose data by rolling back?",
        a: "No. Rolling back only moves the active pointer — it does not delete any version. Every version ever created is permanently stored and accessible by its version number. You can roll forward again at any time.",
      },
      {
        q: "What is an alt version and when would I use one?",
        a: "An alt version is a separate copy of the entities for a given version that lives alongside the original without replacing it. Use it when you want to publish a cleaned, deduplicated, or enriched version of the data without touching the raw source. Alts can be created manually in the dashboard, via the API, or automatically by an MCP agent using push_alt_version.",
      },
      {
        q: "Does cloning copy version history?",
        a: "No. A clone starts fresh at v1, which contains a copy of the source dataset's latest version at the time of cloning. The clone's version history is fully independent from that point on. Future refreshes of the source do not affect your clone.",
      },
      {
        q: "How does the diff work for modified entities?",
        a: "Quorel matches entities across versions using their source URL and a weighted field-similarity score. Fields with more unique values across the dataset carry more weight. Two entities need a similarity score of at least 0.3 to be considered a match — below that threshold, they are treated as independent additions and subtractions rather than a modification.",
      },
    ],
  },
  {
    group: "MCP and agents",
    items: [
      {
        q: "What can Claude actually do with my datasets via MCP?",
        a: "Claude can list your datasets, inspect their schemas, query with filters and keywords, pull the full entity list for processing, and push a cleaned version back as an alt. In practice this means you can ask Claude to deduplicate entries, fill missing fields, filter by complex criteria, summarize trends, or restructure data — all conversationally without writing code.",
      },
      {
        q: "Does push_alt_version overwrite my original data?",
        a: "Never. push_alt_version always writes to the alt path for that version. The original version file is never modified. If you push an alt and then delete it, the original is exactly as it was.",
      },
      {
        q: "What happens if I generate a new MCP token?",
        a: "Generating a new token immediately invalidates the old one. Any agent or Claude Desktop instance using the old token will be rejected on its next request. Update your claude_desktop_config.json with the new token URL after regenerating.",
      },
      {
        q: "Is MCP available on the Free plan?",
        a: "Yes. MCP access is included on every plan, including Free. You can connect Claude Desktop to your Free dataset and use all five tools.",
      },
    ],
  },
  {
    group: "Pricing and plans",
    items: [
      {
        q: "What counts as an active dataset for plan limits?",
        a: "Any dataset you own that is not frozen. Frozen datasets are excluded from the count. This means you can freeze datasets you are not actively using to stay within your plan limit without deleting them.",
      },
      {
        q: "What happens if I hit my dataset or URL limit?",
        a: "Creating a new dataset or adding URLs beyond your plan limit returns a 403 with a clear error message. Existing datasets and data are unaffected. Upgrade your plan to unlock more.",
      },
      {
        q: "Can I clone a premium marketplace dataset on the Free plan?",
        a: "Yes, if you have room in your dataset limit. Cloning a premium dataset requires a one-time payment per dataset. The payment reference is validated before the clone is created. Once cloned, it counts as one of your plan's datasets.",
      },
      {
        q: "If I downgrade my plan, what happens to my datasets over the new limit?",
        a: "Existing datasets are not automatically deleted. You will just be unable to create new ones until you are back within the limit. Freeze any datasets you are not actively using to free up slots without losing data.",
      },
      {
        q: "Does the ping URL count toward my API rate limit?",
        a: "No. The ping URL triggers a refresh internally and is not part of the dataset API. It is available on Pro and Scale plans only. Hitting the ping URL on a Free plan returns 403.",
      },
    ],
  },
  {
    group: "Privacy and data",
    items: [
      {
        q: "Can other users see my private dataset?",
        a: "No. Private datasets do not appear in the marketplace and cannot be cloned. API requests to a private dataset without a valid Bearer token return 401. Only you can access it.",
      },
      {
        q: "What is the _source field?",
        a: "Every entity has a _source field containing the URL of the page it was extracted from. It is included by default and can be removed with include_source=false in the API request or drop_field=_source.",
      },
      {
        q: "Can I delete my dataset and all its data?",
        a: "Yes. Deleting a dataset from the dashboard permanently removes all versions, all alt files, the schema, all source URLs, and the queue records. This action is irreversible. You will receive an email confirmation when the deletion completes.",
      },
    ],
  },
];

const NEXT_STEPS = [
  { label: "Quickstart", href: "/docs/quickstart", desc: "Hit a public endpoint in under 5 minutes." },
  { label: "API reference", href: "/docs/api", desc: "Every parameter, response header, and format." },
  { label: "Dataset", href: "/docs/dataset", desc: "Schema, URLs, SERP intent, and plan limits." },
  { label: "MCP", href: "/docs/mcp", desc: "Connect your datasets to Claude and other agents." },
];

export default function FAQPage() {
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
            <span style={{ color: "var(--fg)" }}>FAQ</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent-color)" }}>
              FAQ
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Common questions, direct answers.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
              If something isn't covered here, the full documentation is linked at the bottom of each section.
            </p>
          </div>

          <div className="space-y-14">
            {FAQS.map(({ group, items }) => (
              <section key={group}>
                <p
                  className="font-mono text-xs tracking-widest uppercase mb-6"
                  style={{ color: "var(--muted-2)" }}
                >
                  {group}
                </p>
                <div style={{ border: "1px solid var(--line-color)" }}>
                  {items.map(({ q, a }, i) => (
                    <div
                      key={q}
                      className="px-4 py-4 text-xs"
                      style={{ borderBottom: i < items.length - 1 ? "1px solid var(--line-color)" : "none" }}
                    >
                      <p
                        className="text-sm font-semibold mb-2"
                        style={{ fontFamily: "var(--font-body)", color: "var(--fg)" }}
                      >
                        {q}
                      </p>
                      <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.7" }}>
                        {a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Next steps */}
            <section>
              <h2 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-body)" }}>Still have questions?</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                The full docs cover every detail. Or reach out directly on{" "}
                <a
                  href="https://x.com/vexaro_hq"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-color)" }}
                  className="underline underline-offset-2"
                >
                  X / Twitter
                </a>{" "}
                or{" "}
                <a
                  href="https://github.com/vexaro"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-color)" }}
                  className="underline underline-offset-2"
                >
                  GitHub
                </a>
                .
              </p>
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

            {/* Prev */}
            <div className="flex items-center justify-start pt-4">
              <Link
                href="/docs/versioning"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
                Versioning
              </Link>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}