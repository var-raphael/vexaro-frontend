"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { VexaroWordmark } from "@/components/ui/vexaro-mark";

const NAV_LINKS = [
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/docs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const ids = ["how", "features", "pricing"];
    const observers: IntersectionObserver[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.4 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  function isActive(href: string) {
    const section = href.replace("/#", "");
    return activeSection === section;
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 h-16 transition-all duration-300",
      scrolled
        ? "bg-background/80 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_var(--border)]"
        : "bg-transparent border-b border-transparent"
    )}>
      {/* Logo */}
      <Link href="/" className="shrink-0">
        <VexaroWordmark markSize={28} textSize="text-lg" />
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_LINKS.map((l) => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "relative px-3 py-1.5 text-sm rounded-md transition-all duration-200 group",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn(
                "absolute inset-0 rounded-md transition-opacity duration-200",
                active
                  ? "bg-primary/8 opacity-100"
                  : "bg-accent opacity-0 group-hover:opacity-100"
              )} />

              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-primary rounded-full shadow-[0_0_6px_oklch(0.85_0.18_195_/_0.8)]" />
              )}

              <span className="relative">{l.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Sign in
        </Button>
        <Button
          size="sm"
          className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_oklch(0.85_0.18_195_/_0.3)] hover:shadow-[0_0_24px_oklch(0.85_0.18_195_/_0.5)] transition-all"
        >
          Start Building
        </Button>
      </div>

      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Menu size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          aria-describedby={undefined}
          className="w-72 bg-card border-border flex flex-col pt-10 gap-0"
        >
          <VisuallyHidden><SheetTitle>Navigation Menu</SheetTitle></VisuallyHidden>

          {/* Mobile logo */}
          <div className="mb-10 px-2">
            <VexaroWordmark markSize={28} textSize="text-lg" />
          </div>

          {/* Mobile links */}
          <div className="flex flex-col gap-1 px-2">
            {NAV_LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative px-4 py-3 text-sm font-medium rounded-md transition-all border",
                    active
                      ? "text-primary bg-primary/8 border-primary/20"
                      : "text-foreground hover:text-primary hover:bg-accent/20 border-transparent hover:border-border"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full shadow-[0_0_8px_oklch(0.85_0.18_195_/_0.8)]" />
                  )}
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile CTA */}
          <div className="mt-auto flex flex-col gap-3 px-2 pb-6">
            <Button
              variant="outline"
              className="w-full border-border text-foreground hover:border-primary hover:text-primary transition-all"
            >
              Sign in
            </Button>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_oklch(0.85_0.18_195_/_0.3)]">
              Start Building
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}