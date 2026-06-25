import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BlogNav } from "@/components/layout/BlogNav";
import { Footer } from "@/components/layout/Footer";
import { getPost, getSortedPosts } from "@/lib/blog";
import { SITE_URL, SITE_NAME } from "@/lib/config";

export async function generateStaticParams() {
  return getSortedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} -- ${SITE_NAME}`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: SITE_NAME,
      type: "article",
      ...(post.cover ? { images: [{ url: `${SITE_URL}${post.cover}` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <BlogNav />
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
            <Link href="/" className="hover:text-white transition-colors" style={{ color: "var(--muted-2)" }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white transition-colors" style={{ color: "var(--muted-2)" }}>
              Blog
            </Link>
            <span>/</span>
            <span style={{ color: "var(--fg)" }}>{post.title}</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="font-mono text-xs px-2 py-0.5"
                style={{ border: "1px solid var(--accent-color)", color: "var(--accent-color)" }}
              >
                {post.tag}
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: "var(--muted-2)" }}
              >
                {date}
              </span>
            </div>

            <h1
              className="font-black tracking-tight leading-tight mb-4"
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.03em",
              }}
            >
              {post.title}
            </h1>

            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.6 }}
            >
              {post.description}
            </p>
          </div>

          {/* Cover image */}
          {post.cover && (
            <div
              className="relative w-full overflow-hidden mb-10"
              style={{ aspectRatio: "16/7", border: "1px solid var(--line-color)" }}
            >
              <Image
                src={post.cover}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </div>
          )}

          <div className="h-px mb-10" style={{ background: "var(--line-color)" }} />

          {/* Body */}
          <div
            className="prose-vexaro space-y-5"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              lineHeight: "1.8",
              color: "var(--fg)",
              opacity: 0.85,
            }}
          >
            {post.body}
          </div>

          <div className="h-px mt-14 mb-10" style={{ background: "var(--line-color)" }} />

          {/* Author */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Raphael
              </p>
              <p
                className="font-mono text-xs"
                style={{ color: "var(--muted-2)" }}
              >
                Builder of Quorel
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/PhantomDev001"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--accent-color)" }}
              >
                X / Twitter →
              </a>
              <a
                href="https://github.com/var-raphael"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs transition-opacity hover:opacity-70"
                style={{ color: "var(--accent-color)" }}
              >
                GitHub →
              </a>
            </div>
          </div>

          <div className="h-px mt-10 mb-8" style={{ background: "var(--line-color)" }} />

          {/* Back */}
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm font-medium transition-colors duration-150 hover:text-white"
            style={{ color: "#c8c8c8", fontFamily: "var(--font-body)" }}
          >
            <span style={{ color: "var(--accent-color)" }}>{"<"}</span>
            All posts
          </Link>

        </div>
      </main>
      <Footer />
    </>
  );
}