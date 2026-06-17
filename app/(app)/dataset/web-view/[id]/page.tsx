import { Metadata } from "next";
import { DatasetViewClient } from "./dataset-view-client";

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
      title: "Dataset Not Found | Vexaro",
      description: "This dataset could not be found.",
    };
  }

  const title = `${dataset.name} — Public Dataset | Vexaro`;
  const description = `${dataset.description ?? ""} · ${dataset.entity_count ?? 0} entities · v${dataset.active_version ?? 1} · ${dataset.dataset_type ?? "web"} dataset`.trim();
  const url = `https://vexaro.vercel.app/dataset/web-view/${id}`;

  return {
    title,
    description,
    keywords: [
      dataset.name,
      dataset.tag ?? "",
      dataset.dataset_type ?? "web",
      "public dataset",
      "vexaro",
      "data api",
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url,
      siteName: "Vexaro",
      type: "website",
      images: [
        {
          url: "https://vexaro.vercel.app/og-image.png",
          width: 1200,
          height: 630,
          alt: `${dataset.name} — Vexaro Dataset`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://vexaro.vercel.app/og-image.png"],
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