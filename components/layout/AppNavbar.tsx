"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
   LayoutDashboard, User, Database,
  Bell, Settings, BookOpen, Info, LogOut, Menu, ChevronDown, CreditCard,
 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VexaroWordmark } from "@/components/ui/vexaro-mark";
import { useAuth } from "@/context/AuthContext";
import { callBackend } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
   { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
   { label: "Datasets",  href: "/datasets",  icon: Database },
   { label: "Pricing",   href: "/pricing",   icon: CreditCard },
 ];

const STATIC_SECONDARY_ITEMS = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Docs",     href: "/docs",     icon: BookOpen },
  { label: "About",    href: "/about",    icon: Info },
];

// Minimal set shown to signed-out users on /datasets
const MINIMAL_ITEMS = [
  { label: "Docs",  href: "/docs",  icon: BookOpen },
  { label: "About", href: "/about", icon: Info },
];

// ── Nav Link ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
        active
          ? "bg-accent text-primary border border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/20 border border-transparent"
      )}
    >
      <Icon size={16} className={cn(active ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
}

// ── Active Page Indicator ─────────────────────────────────────────────────────

function ActivePageIndicator({ profileHref }: { profileHref: string }) {
  const pathname = usePathname();

  const allItems = [
    ...NAV_ITEMS,
    ...STATIC_SECONDARY_ITEMS,
    { label: "Profile",       href: profileHref,      icon: User },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  const current =
    allItems.find((item) => item.href === pathname) ??
    allItems.find((item) => item.href !== "/" && pathname.startsWith(item.href + "/"));

  if (!current) return null;

  const Icon = current.icon;

  return (
    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/40 border border-primary/20 text-xs font-medium text-primary">
      <Icon size={12} />
      <span>{current.label}</span>
    </div>
  );
}

// ── App Navbar ────────────────────────────────────────────────────────────────

export function AppNavbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileHref = user ? `/profile/${user.username}` : "/profile";

  const secondaryItems = [
    { label: "Profile", href: profileHref, icon: User },
    ...STATIC_SECONDARY_ITEMS,
  ];

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  useEffect(() => {
    if (!user?.id) return;
    async function fetchUnread() {
      try {
        const res = await callBackend(`/notifications`);
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.unread_count ?? 0);
      } catch {
        // silently fail — nav shouldn't break if this fails
      }
    }
    fetchUnread();
  }, [user?.id]);

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  // Minimal content: signed-out users on /datasets
  const onDatasetsPage = pathname === "/datasets" || pathname.startsWith("/datasets/");
  const showMinimalNav = onDatasetsPage && !user;

  const logoHref = showMinimalNav ? "/" : "/dashboard";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-8 h-16 bg-background/80 backdrop-blur-md border-b border-border">

      {/* Logo */}
      <Link href={logoHref} className="shrink-0">
        <VexaroWordmark markSize={28} textSize="text-lg" />
      </Link>

      {showMinimalNav ? (
        <>
          {/* Desktop: minimal links + CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              asChild
            >
              <Link href="/auth">Start building</Link>
            </Button>
          </div>

          {/* Mobile: hamburger -> minimal sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                <Menu size={20} />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              aria-describedby={undefined}
              className="w-72 bg-card border-border flex flex-col pt-6 gap-0 overflow-y-auto"
            >
              <VisuallyHidden><SheetTitle>Navigation</SheetTitle></VisuallyHidden>

              <div className="flex flex-col gap-1 px-3 pt-2">
                {MINIMAL_ITEMS.map((item) => (
                  <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
                ))}
              </div>

              <div className="mt-auto px-3 pb-6 pt-4 border-t border-border">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  asChild
                >
                  <Link href="/auth" onClick={() => setOpen(false)}>Start building</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            <ActivePageIndicator profileHref={profileHref} />

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/20 transition-colors outline-none">
                  <Avatar className="w-7 h-7 border border-border">
                    <AvatarFallback className="bg-accent text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground font-medium hidden lg:block">
                    {user?.name?.split(" ")[0] ?? ""}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground hidden lg:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                {secondaryItems.map(({ label, href, icon: Icon }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link
                      href={href}
                      className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 text-sm text-red-400 hover:text-red-300 cursor-pointer focus:text-red-300 focus:bg-red-500/10"
                >
                  <LogOut size={15} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger -> full sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
                <Menu size={20} />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              aria-describedby={undefined}
              className="w-72 bg-card border-border flex flex-col pt-6 gap-0 overflow-y-auto"
            >
              <VisuallyHidden><SheetTitle>App Navigation</SheetTitle></VisuallyHidden>

              {/* User info */}
              <div className="flex items-center gap-3 px-4 pb-6 border-b border-border">
                <Avatar className="w-9 h-9 border border-border">
                  <AvatarFallback className="bg-accent text-primary text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {/* Primary links */}
              <div className="flex flex-col gap-1 px-3 pt-5">
                <p className="text-xs font-mono text-muted-foreground px-2 mb-2 tracking-widest uppercase">
                  Main
                </p>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
                ))}
              </div>

              {/* Secondary links */}
              <div className="flex flex-col gap-1 px-3 pt-6">
                <p className="text-xs font-mono text-muted-foreground px-2 mb-2 tracking-widest uppercase">
                  Account
                </p>
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
                    "text-muted-foreground hover:text-foreground hover:bg-accent/20 border border-transparent"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Bell size={16} className="text-muted-foreground" />
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                {secondaryItems.map((item) => (
                  <NavLink key={item.href} {...item} onClick={() => setOpen(false)} />
                ))}
              </div>

              {/* Logout */}
              <div className="mt-auto px-3 pb-6 pt-4 border-t border-border">
                <button
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </nav>
  );
}