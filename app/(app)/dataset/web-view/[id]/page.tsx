import { Metadata } from "next";
import { DatasetViewClient } from "./dataset-view-client";
import { SITE_URL, SITE_NAME } from "@/lib/config";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function fetchDataset(id: string) {
  try {
    const res = await fetch(`${API}/dataset/view?dataset_id=${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dataset = await fetchDataset(id);

  if (!dataset) {
    return {
      title: `Dataset Not Found | ${SITE_NAME}`,
      description: "This dataset could not be found.",
    };
  }

  const tags = dataset.tag
    ? dataset.tag.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const lastRefresh = dataset.last_refresh ? formatDate(dataset.last_refresh) : null;
  const createdAt = dataset.created_at ? formatDate(dataset.created_at) : null;

  // Rich description — everything a crawler should know
  const descParts = [
    dataset.description,
    `${(dataset.entity_count ?? 0).toLocaleString()} entities`,
    `v${dataset.active_version ?? 1}`,
    `${dataset.dataset_type ?? "web"} dataset`,
    lastRefresh ? `Last refreshed ${lastRefresh}` : null,
    createdAt ? `Created ${createdAt}` : null,
    dataset.nightly ? "Nightly auto-refresh" : null,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
  ].filter(Boolean).join(" · ");

  // Fix: don't include SITE_NAME in title — root layout appends it
  const title = `${dataset.name} — ${(dataset.entity_count ?? 0).toLocaleString()} entities · ${dataset.dataset_type ?? "web"} dataset`;
  const url = `${SITE_URL}/dataset/web-view/${id}`;

  const keywords = [
    dataset.name,
    ...tags,
    dataset.dataset_type ?? "web",
    "public dataset",
    "data api",
    "structured data",
    SITE_NAME.toLowerCase(),
    dataset.intent ?? "",
  ].filter(Boolean);

  return {
    title,
    description: descParts,
    keywords,
    openGraph: {
      title: `${dataset.name} | ${SITE_NAME}`,
      description: descParts,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${dataset.name} — ${SITE_NAME} Dataset`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dataset.name} | ${SITE_NAME}`,
      description: descParts,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function DatasetViewPage({ params }: PageProps) {
  const { id } = await params;
  const dataset = await fetchDataset(id);
  return <DatasetViewClient id={id} initialDataset={dataset} />;
}