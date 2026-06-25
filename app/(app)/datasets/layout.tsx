// app/(app)/datasets/layout.tsx

import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Public Datasets",
  description:
    "Browse, clone, and hit community datasets via API. Structured, versioned web data — updated in real time.",
  openGraph: {
    title: `Public Datasets | ${SITE_NAME}`,
    description:
      "Browse, clone, and hit community datasets via API. Structured, versioned web data — updated in real time.",
    url: `${SITE_URL}/datasets`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Public Datasets | ${SITE_NAME}`,
    description:
      "Browse, clone, and hit community datasets via API. Structured, versioned web data — updated in real time.",
  },
  alternates: {
    canonical: `${SITE_URL}/datasets`,
  },
};

export default function DatasetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}