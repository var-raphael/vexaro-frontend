import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/blog";

export function BlogCard({ post }: { post: Post }) {
  const date = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block transition-opacity duration-150"
      style={{ textDecoration: "none" }}
    >
      <div style={{ border: "1px solid var(--line-color)" }}>

        {/* Cover */}
        {post.cover && (
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/7" }}>
            <Image
              src={post.cover}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 672px"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }}
            />
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
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

          <h2
            className="font-black tracking-tight leading-tight mb-2 group-hover:opacity-80 transition-opacity"
            style={{
              fontSize: "clamp(1.1rem, 3vw, 1.4rem)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              color: "var(--fg)",
            }}
          >
            {post.title}
          </h2>

          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "var(--fg)", fontFamily: "var(--font-body)", opacity: 0.6 }}
          >
            {post.description}
          </p>

          <span
            className="font-mono text-xs group-hover:opacity-80 transition-opacity"
            style={{ color: "var(--accent-color)" }}
          >
            Read more →
          </span>
        </div>
      </div>
    </Link>
  );
}