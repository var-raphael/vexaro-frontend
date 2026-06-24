"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu, Zap, BookOpen, DollarSign, Bot, Webhook, GitBranch, Database, HelpCircle, Newspaper, Users, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { VexaroWordmark } from "@/components/ui/vexaro-mark";

const DOC_LINKS = [
  { label: "Quickstart", href: "/docs/quickstart", icon: Rocket },
  { label: "Dataset", href: "/docs/dataset", icon: Database },
  { label: "API", href: "/docs/api", icon: Zap },
  { label: "MCP", href: "/docs/mcp", icon: Bot },
  { label: "Webhooks", href: "/docs/webhooks", icon: Webhook },
  { label: "Versioning", href: "/docs/versioning", icon: GitBranch },
  { label: "FAQ", href: "/docs/faq", icon: HelpCircle },
];

const MORE_LINKS = [
  { label: "Pricing", href: "/pricing", icon: DollarSign },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "About", href: "/about", icon: Users },
];

export function NavDoc() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href;
  }

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 h-16",
      "bg-background/80 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_var(--border)]"
    )}>
      {/* Logo */}
      <Link href="/" className="shrink-0">
        <VexaroWordmark markSize={28} textSize="text-lg" />
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-1">
        {DOC_LINKS.map((l) => {
          const active = isActive(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "relative px-3 py-1.5 text-sm rounded-md transition-all duration-200 group flex items-center gap-1.5",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn(
                "absolute inset-0 rounded-md transition-opacity duration-200",
                active ? "bg-primary/8 opacity-100" : "bg-accent opacity-0 group-hover:opacity-100"
              )} />
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-primary rounded-full shadow-[0_0_6px_oklch(0.85_0.18_195_/_0.8)]" />
              )}
              <Icon size={13} className={cn(
                "relative shrink-0 transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
              )} />
              <span className="relative">{l.label}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="w-px h-4 mx-1" style={{ background: "var(--border)" }} />

        {MORE_LINKS.map((l) => {
          const active = isActive(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "relative px-3 py-1.5 text-sm rounded-md transition-all duration-200 group flex items-center gap-1.5",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn(
                "absolute inset-0 rounded-md transition-opacity duration-200",
                active ? "bg-primary/8 opacity-100" : "bg-accent opacity-0 group-hover:opacity-100"
              )} />
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-primary rounded-full shadow-[0_0_6px_oklch(0.85_0.18_195_/_0.8)]" />
              )}
              <Icon size={13} className={cn(
                "relative shrink-0 transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
              )} />
              <span className="relative">{l.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:flex items-center">
        <Button
          size="sm"
          asChild
          className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_oklch(0.85_0.18_195_/_0.3)] hover:shadow-[0_0_24px_oklch(0.85_0.18_195_/_0.5)] transition-all"
        >
          <Link href="/auth">Start Building</Link>
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

          <div className="mb-8 px-2">
            <VexaroWordmark markSize={28} textSize="text-lg" />
          </div>

          <div className="flex flex-col gap-1 px-2">
            <p className="px-4 mb-1 font-mono text-xs tracking-widest uppercase text-muted-foreground/50">Docs</p>
            {DOC_LINKS.map((l) => {
              const active = isActive(l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative px-4 py-3 text-sm font-medium rounded-md transition-all border flex items-center gap-3",
                    active
                      ? "text-primary bg-primary/8 border-primary/20"
                      : "text-foreground hover:text-primary hover:bg-accent/20 border-transparent hover:border-border"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full shadow-[0_0_8px_oklch(0.85_0.18_195_/_0.8)]" />
                  )}
                  <Icon size={15} className={cn("shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
                  {l.label}
                </Link>
              );
            })}

            <div className="my-3 mx-4 h-px bg-border" />

            <p className="px-4 mb-1 font-mono text-xs tracking-widest uppercase text-muted-foreground/50">More</p>
            {MORE_LINKS.map((l) => {
              const active = isActive(l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative px-4 py-3 text-sm font-medium rounded-md transition-all border flex items-center gap-3",
                    active
                      ? "text-primary bg-primary/8 border-primary/20"
                      : "text-foreground hover:text-primary hover:bg-accent/20 border-transparent hover:border-border"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full shadow-[0_0_8px_oklch(0.85_0.18_195_/_0.8)]" />
                  )}
                  <Icon size={15} className={cn("shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto px-2 pb-6">
            <Button
              asChild
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_16px_oklch(0.85_0.18_195_/_0.3)]"
            >
              <Link href="/auth">Start Building</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}