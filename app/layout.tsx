import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SITE_URL, SITE_NAME } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - The source of truth for the live web`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Define what data you want from any public website, once. Quorel structures it, versions every change, and serves it as a clean, always-fresh API — for AI agents, dashboards, and data pipelines.",
  keywords: [
    "web scraping api",
    "structured data api",
    "versioned data",
    "data pipeline",
    "web data extraction",
    SITE_NAME.toLowerCase(),
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: `${SITE_NAME} - The source of truth for the live web`,
    description:
      "Define what data you want from any public website, once. Quorel structures it, versions every change, and serves it as a clean, always-fresh API.",
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — The source of truth for the live web`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - The source of truth for the live web`,
    description:
      "Define what data you want from any public website, once. Quorel structures it, versions every change, and serves it as a clean, always-fresh API.",
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}