import type { ReactNode } from "react";
import WhyIBuiltVexaro from "@/content/blog/why-i-built-vexaro";
import VersioningWebData from "@/content/blog/versioning-web-data";

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tag: string;
  cover: string | null;
  body: ReactNode;
};

export const posts: Post[] = [
  {
    slug: "why-i-built-vexaro",
    title: "Why I built Vexaro",
    date: "2026-06-25",
    description: "Data pipelines are painful, expensive, and force you to stitch together tools that were never meant to work together. Here's why that bothered me enough to build something.",
    tag: "product",
    cover: "/blog/why-i-built-vexaro.jpg",
    body: <WhyIBuiltVexaro />,
  },
  {
    slug: "versioning-web-data",
    title: "Why versioning web data actually matters",
    date: "2026-06-20",
    description: "Most data pipelines treat every fetch as a replacement. That means you have no history, no rollback, and no way to know what changed. Here's why that's a problem.",
    tag: "engineering",
    cover: "/blog/versioning-web-data.jpg",
    body: <VersioningWebData />,
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getSortedPosts(): Post[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}