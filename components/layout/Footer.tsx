import Link from "next/link";
import { VexaroWordmark } from "@/components/ui/vexaro-mark";

const PRODUCT_LINKS = ["Docs", "Features", "Pricing", "Changelog"];
const COMPANY_LINKS = ["About", "Blog", "GitHub", "Contact"];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border px-5 md:px-12 py-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        <div>
          <div className="mb-3">
            <VexaroWordmark markSize={24} textSize="text-base" />
          </div>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            The GitHub for web data and AI datasets. Built by{" "}
            <a
              href="https://var-raphael.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Raphael Samuel
            </a>.
          </p>
        </div>

        <div className="flex gap-12 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground mb-1">Product</p>
            {PRODUCT_LINKS.map((l) => (
              <Link key={l} href="#" className="hover:text-foreground transition-colors text-xs">
                {l}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground mb-1">Company</p>
            {COMPANY_LINKS.map((l) => (
              <Link key={l} href="#" className="hover:text-foreground transition-colors text-xs">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Vexaro. All rights reserved.</p>
        <p className="text-xs font-mono text-muted-foreground">v0.1.0</p>
      </div>
    </footer>
  );
}