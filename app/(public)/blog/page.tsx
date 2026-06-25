import type { Metadata } from "next";
import { BlogNav } from "@/components/layout/BlogNav";
import { Footer } from "@/components/layout/Footer";
import { BlogCard } from "@/components/blog/BlogCard";
import { getSortedPosts } from "@/lib/blog";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Blog -- ${SITE_NAME}`,
  description: "Thoughts on web data, versioning, AI pipelines, and building Vexaro in public.",
  openGraph: {
    title: `Blog -- ${SITE_NAME}`,
    description: "Thoughts on web data, versioning, AI pipelines, and building Vexaro in public.",
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog -- ${SITE_NAME}`,
    description: "Thoughts on web data, versioning, AI pipelines, and building Vexaro in public.",
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

export default function BlogPage() {
  const posts = getSortedPosts();

  return (
    <>
      <BlogNav />
      <main
        className="min-h-screen pt-24 pb-20"
        style={{ background: "var(--bg)", color: "var(--fg)" }}
      >
        <div className="max-w-2xl mx-auto px-5 md:px-8">

          {/* Header */}
          <div className="mb-12">
            <p
              className="font-mono text-xs tracking-widest uppercase mb-4"
              style={{ color: "var(--accent-color)" }}
            >
              Blog
            </p>
            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              Thinking out loud.
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.7 }}
            >
              Web data, versioning, AI pipelines, and building Vexaro in public. Written by Raphael.
            </p>
          </div>

          {/* Posts */}
          {posts.length === 0 ? (
            <div
              className="px-6 py-12 text-center"
              style={{ border: "1px solid var(--line-color)" }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--muted-2)", fontFamily: "var(--font-body)" }}
              >
                No posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}