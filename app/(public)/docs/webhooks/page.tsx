import type { Metadata } from "next";
import { NavDoc } from "@/components/layout/NavDoc";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Webhooks -- ${SITE_NAME} Docs`,
  description: "Get notified the moment a dataset refresh completes. Register an endpoint, verify the signature, and build reactive pipelines.",
  openGraph: {
    title: `Webhooks -- ${SITE_NAME} Docs`,
    description: "Get notified the moment a dataset refresh completes.",
    url: `${SITE_URL}/docs/webhooks`,
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
    title: `Webhooks -- ${SITE_NAME} Docs`,
    description: "Get notified the moment a dataset refresh completes.",
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/docs/webhooks`,
  },
};

const WEBHOOK_ENDPOINTS = [
  {
    method: "POST",
    path: "/webhook/register",
    auth: "Session cookie",
    desc: "Register or update a webhook for a dataset. If a webhook already exists for this dataset, it is replaced. The secret is optional but recommended.",
    body: `{
  "dataset_id": 42,
  "url": "https://your-server.com/webhook",
  "secret": "your_signing_secret"
}`,
    response: `{ "ok": true }`,
  },
  {
    method: "DELETE",
    path: "/webhook/delete",
    auth: "Session cookie",
    desc: "Remove the webhook registered for a dataset. The endpoint will no longer receive POST requests after a refresh.",
    body: `{ "dataset_id": 42 }`,
    response: `{ "ok": true }`,
  },
  {
    method: "GET",
    path: "/webhook/view?dataset_id=42",
    auth: "Session cookie",
    desc: "Check whether a webhook exists for a dataset and inspect its status.",
    body: null,
    response: `{
  "has_webhook": true,
  "url": "https://your-server.com/webhook",
  "has_secret": true,
  "is_active": true,
  "last_fired_at": "2026-06-01T03:12:44Z",
  "last_status": 200,
  "created_at": "2026-05-15T10:00:00Z"
}`,
  },
];

const PAYLOAD_FIELDS = [
  { field: "dataset_id", type: "number", desc: "The numeric ID of the dataset that refreshed." },
  { field: "dataset_name", type: "string", desc: "The display name of the dataset." },
  { field: "version", type: "number", desc: "The version number that was just created by the refresh." },
  { field: "entity_count", type: "number", desc: "The number of entities in the new version." },
  { field: "refreshed_at", type: "string", desc: "ISO 8601 timestamp of when the refresh completed." },
];

const VIEW_FIELDS = [
  { field: "has_webhook", type: "boolean", desc: "Whether a webhook is registered for this dataset." },
  { field: "url", type: "string", desc: "The registered endpoint URL." },
  { field: "has_secret", type: "boolean", desc: "Whether a signing secret is configured. The secret itself is never returned." },
  { field: "is_active", type: "boolean", desc: "Whether the webhook is active. Webhooks are active by default on registration." },
  { field: "last_fired_at", type: "string | null", desc: "ISO 8601 timestamp of the last time the webhook was fired. Null if never fired." },
  { field: "last_status", type: "number | null", desc: "The HTTP status code returned by your endpoint on the last attempt. Null if never fired." },
  { field: "created_at", type: "string", desc: "ISO 8601 timestamp of when the webhook was registered." },
];

const REGISTER_FIELDS = [
  { field: "dataset_id", type: "number", required: true, desc: "The dataset to attach the webhook to. Must be owned by the authenticated user." },
  { field: "url", type: "string", required: true, desc: "The endpoint that will receive POST requests. Must be a valid http or https URL." },
  { field: "secret", type: "string", required: false, desc: "An optional string used to sign the payload. See the signature verification section below." },
];

const SETUP_STEPS = [
  {
    n: "01",
    title: "Expose a public endpoint",
    body: "Your server needs a publicly accessible URL that accepts POST requests with a JSON body. It must return a 2xx status code within a reasonable timeout.",
  },
  {
    n: "02",
    title: "Register the webhook",
    body: "Call POST /webhook/register with your dataset_id, endpoint URL, and an optional secret. One webhook per dataset — registering again replaces the existing one.",
  },
  {
    n: "03",
    title: "Verify the signature (recommended)",
    body: "If you provided a secret, Quorel signs every payload with it. Verify the signature on your server before processing the event.",
  },
  {
    n: "04",
    title: "Respond with 2xx",
    body: "Return any 2xx status code quickly. Quorel records the status in last_status. Non-2xx responses are noted but the webhook is not automatically disabled.",
  },
];

const PLAN_NOTES = [
  { label: "Free", desc: "Webhooks are not available. Register via the API will return 403." },
  { label: "Pro", desc: "Webhooks are available. One webhook per dataset." },
  { label: "Scale", desc: "Webhooks are available. One webhook per dataset." },
];

const NEXT_STEPS = [
  { label: "API reference", href: "/docs/api", desc: "Every query parameter, response header, and format." },
  { label: "MCP", href: "/docs/mcp", desc: "Connect your datasets to Claude and other agents." },
  { label: "Versioning and rollback", href: "/docs/versioning", desc: "How versions work and how to roll back." },
  { label: "Dataset", href: "/docs/dataset", desc: "Ping URLs, refresh modes, and plan limits." },
];

export default function WebhooksPage() {
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
            <span style={{ color: "var(--fg)" }}>Webhooks</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: "var(--accent-color)" }}>
              Webhooks
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              React the moment a refresh lands.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
              Register an endpoint and Quorel will POST to it the moment a dataset refresh completes. No polling. Available on Pro and Scale.
            </p>
          </div>

          <div className="space-y-14">

            {/* How it works */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>How it works</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                One webhook per dataset. When a refresh completes and a new version is created, Quorel sends a single POST to your registered URL with a JSON payload describing the event. The result is recorded in <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>last_fired_at</code> and <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>last_status</code>.
              </p>

              <div className="space-y-8">
                {SETUP_STEPS.map(({ n, title, body }, i) => (
                  <div key={n} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        className="font-mono text-xs w-8 h-8 flex items-center justify-center"
                        style={{ border: "1px solid var(--line-color)", color: "var(--accent-color)" }}
                      >
                        {n}
                      </span>
                      {i < SETUP_STEPS.length - 1 && (
                        <div className="flex-1 w-px mt-2" style={{ background: "var(--line-color)", minHeight: "2rem" }} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-body)" }}>{title}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Endpoints */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Endpoints</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                All three endpoints require session authentication — they are called from your dashboard or your own backend, not from your webhook receiver.
              </p>

              <div className="space-y-6">
                {WEBHOOK_ENDPOINTS.map(({ method, path, auth, desc, body, response }) => (
                  <div key={path + method} style={{ border: "1px solid var(--line-color)" }}>
                    <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--line-color)", background: "#0f0f0f" }}>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span
                          className="font-mono text-xs px-1.5 py-0.5"
                          style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}
                        >
                          {method}
                        </span>
                        <span className="font-mono text-xs" style={{ color: "var(--fg)" }}>{path}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>Auth: {auth}</p>
                    </div>

                    {body && (
                      <div style={{ borderBottom: "1px solid var(--line-color)" }}>
                        <p className="px-4 pt-3 pb-1 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted-2)" }}>Request body</p>
                        <pre
                          className="font-mono text-xs leading-relaxed px-4 pb-3 overflow-x-auto"
                          style={{ color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                        >
                          {body}
                        </pre>
                      </div>
                    )}

                    <div>
                      <p className="px-4 pt-3 pb-1 font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted-2)" }}>Response</p>
                      <pre
                        className="font-mono text-xs leading-relaxed px-4 pb-3 overflow-x-auto"
                        style={{ color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                      >
                        {response}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Register fields */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Registration fields</h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {REGISTER_FIELDS.map(({ field, type, required, desc }, i) => (
                  <div
                    key={field}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < REGISTER_FIELDS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: "var(--accent-color)" }}>{field}</span>
                      <span className="font-mono" style={{ color: "var(--muted-2)" }}>{type}</span>
                      {required && (
                        <span
                          className="font-mono px-1"
                          style={{ color: "var(--accent-color)", border: "1px solid var(--accent-color)", fontSize: "0.6rem" }}
                        >
                          required
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Payload */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Payload</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                Quorel sends a single POST to your endpoint with <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>Content-Type: application/json</code>. The body looks like this:
              </p>

              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`{
  "dataset_id": 42,
  "dataset_name": "remote-jobs",
  "version": 15,
  "entity_count": 847,
  "refreshed_at": "2026-06-01T03:12:44Z"
}`}
              </pre>

              <div style={{ border: "1px solid var(--line-color)" }}>
                {PAYLOAD_FIELDS.map(({ field, type, desc }, i) => (
                  <div
                    key={field}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < PAYLOAD_FIELDS.length - 1 ? "1px solid var(--line-color)" : "none" }}
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

            {/* Signature verification */}
            <section>
              <h2 className="font-bold text-base mb-2" style={{ fontFamily: "var(--font-body)" }}>Signature verification</h2>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
              >
                If you registered a secret, Quorel includes an <code className="font-mono text-xs px-1 py-0.5" style={{ background: "#1a1a1a", color: "var(--accent-color)", border: "1px solid var(--line-color)" }}>X-Quorel-Signature</code> header on every request. It is a hex-encoded HMAC-SHA256 of the raw request body, keyed with your secret. Verify it before processing the payload.
              </p>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Node.js</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto mb-6 rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`import crypto from "crypto";

function verifySignature(rawBody, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}`}
              </pre>

              <p className="font-mono text-xs mb-2" style={{ color: "var(--muted-2)" }}>Python</p>
              <pre
                className="font-mono text-xs leading-relaxed p-4 overflow-x-auto rounded-sm"
                style={{ background: "#0f0f0f", border: "1px solid var(--line-color)", color: "#c8c8c8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
              >
{`import hmac, hashlib

def verify_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}
              </pre>

              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                Always use a constant-time comparison function to prevent timing attacks. Never compare strings with <code className="font-mono" style={{ color: "var(--accent-color)" }}>===</code> or <code className="font-mono" style={{ color: "var(--accent-color)" }}>==</code>.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* View response fields */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>View response fields</h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {VIEW_FIELDS.map(({ field, type, desc }, i) => (
                  <div
                    key={field}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < VIEW_FIELDS.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono" style={{ color: "var(--accent-color)" }}>{field}</span>
                      <span className="font-mono" style={{ color: "var(--muted-2)" }}>{type}</span>
                    </div>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}>
                If no webhook is registered, the view endpoint returns <code className="font-mono" style={{ color: "var(--accent-color)" }}>{`{ "has_webhook": false }`}</code>.
              </p>
            </section>

            <div className="h-px" style={{ background: "var(--line-color)" }} />

            {/* Plan availability */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Plan availability</h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {PLAN_NOTES.map(({ label, desc }, i) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < PLAN_NOTES.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
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

            {/* Important notes */}
            <section>
              <h2 className="font-bold text-base mb-4" style={{ fontFamily: "var(--font-body)" }}>Notes</h2>
              <div style={{ border: "1px solid var(--line-color)" }}>
                {[
                  { label: "One webhook per dataset", desc: "Registering a second webhook for the same dataset replaces the first. There is no queue of multiple endpoints." },
                  { label: "No automatic retries", desc: "Quorel fires the webhook once and records the result. If your endpoint is down, you will not receive the event retroactively. Use the API to fetch the new version manually if needed." },
                  { label: "Non-2xx responses are recorded, not fatal", desc: "If your endpoint returns 4xx or 5xx, the webhook is not disabled. The status is recorded in last_status and the next refresh will fire again." },
                  { label: "Secret is write-only", desc: "The secret you provide is never returned by the view endpoint. has_secret tells you whether one is configured." },
                  { label: "Registering replaces, not stacks", desc: "Calling POST /webhook/register when a webhook already exists updates the URL and secret in place. is_active is reset to true and last_fired_at is cleared." },
                ].map(({ label, desc }, i, arr) => (
                  <div
                    key={label}
                    className="px-4 py-3 text-xs"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line-color)" : "none" }}
                  >
                    <p className="font-mono mb-1" style={{ color: "var(--accent-color)" }}>{label}</p>
                    <p style={{ color: "#c8c8c8", fontFamily: "var(--font-body)", lineHeight: "1.6" }}>{desc}</p>
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
                href="/docs/mcp"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
                MCP
              </Link>
              <Link
                href="/docs/versioning"
                className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
              >
                Versioning
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