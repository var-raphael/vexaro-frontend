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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dataset = await fetchDataset(id);

  if (!dataset) {
    return {
      title: `Dataset Not Found | ${SITE_NAME}`,
      description: "This dataset could not be found.",
    };
  }

  const title = `${dataset.name} — Public Dataset | ${SITE_NAME}`;
  const description = `${dataset.description ?? ""} · ${dataset.entity_count ?? 0} entities · v${dataset.active_version ?? 1} · ${dataset.dataset_type ?? "web"} dataset`.trim();
  const url = `${SITE_URL}/dataset/web-view/${id}`;

  return {
    title,
    description,
    keywords: [
      dataset.name,
      dataset.tag ?? "",
      dataset.dataset_type ?? "web",
      "public dataset",
      SITE_NAME.toLowerCase(),
      "data api",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
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
      title,
      description,
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