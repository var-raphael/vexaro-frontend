import { Metadata } from "next";
import { AltViewClient } from "./AltViewClient";
import { SITE_URL, SITE_NAME } from "@/lib/config";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}

async function fetchAltData(id: string, version: number) {
  try {
    const res = await fetch(
      `${API}/dataset/alternate/result?dataset_id=${id}&version_id=${version}&page=1&limit=25`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { version: versionStr } = await searchParams;
  const version = Number(versionStr ?? "1");

  const data = await fetchAltData(id, version);

  if (!data) {
    return {
      title: `Alternate Dataset | ${SITE_NAME}`,
      description: "This alternate dataset could not be found.",
    };
  }

  const dataName = data.data_name ?? `Dataset ${id}`;
  const total = data.total ?? 0;
  const url = `${SITE_URL}/alternate/view-web/${id}?version=${version}`;

  const title = `${dataName} — Alternate v${version} · ${total.toLocaleString()} entities`;
  const description = `Curated alternate version of ${dataName}. ${total.toLocaleString()} entities · v${version} · web dataset · Read-only view on ${SITE_NAME}.`;

  return {
    title,
    description,
    keywords: [
      dataName,
      "alternate dataset",
      "curated data",
      "web dataset",
      SITE_NAME.toLowerCase(),
      "data api",
      "structured data",
    ],
    openGraph: {
      title: `${dataName} — Alt v${version} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${dataName} — Alternate Dataset | ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dataName} — Alt v${version} | ${SITE_NAME}`,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function AltViewWebPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { version: versionStr } = await searchParams;
  const version = Number(versionStr ?? "1");
  const initialData = await fetchAltData(id, version);

  return <AltViewClient id={id} version={version} initialData={initialData} />;
}