"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Tv, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { clientEnv } from "@/lib/config/clientEnv";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Movies" },
  { href: "/tv", label: "TV" },
  { href: "/new", label: "New" },
  { href: "/calendar", label: "Calendar" },
  { href: "/search", label: "Search" },
  { href: "/me/collections", label: "Collections" }
] as const;

const adminLink = { href: "/admin/dashboard", label: "Admin" } as const;

export const Navbar = (): JSX.Element => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const showAdmin = clientEnv.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD === "true";
  const navLinks = showAdmin ? [...links, adminLink] : links;

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-[background-color,border-color,backdrop-filter] duration-200 ease-out-soft",
        scrolled
          ? "border-b border-border bg-base/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent backdrop-blur-0"
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-wide text-fg"
        >
          <Tv className="h-5 w-5 text-accent" />
          CampusStream
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-sm text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg",
                pathname === link.href && "bg-fg/[0.1] text-fg"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="hidden items-center gap-2 rounded-full border border-border bg-fg/[0.04] px-3 py-2 text-xs text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg sm:inline-flex"
            aria-label="Search the catalog"
          >
            <Search className="h-4 w-4" />
            <span>Find a title</span>
            <kbd className="ml-1 hidden rounded border border-border bg-base/60 px-1.5 py-0.5 font-mono text-[10px] text-fg-faint md:inline-flex">
              ⌘K
            </kbd>
          </Link>
          <Link href="/search" className="sm:hidden" aria-label="Search">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <ProfileAvatar />
          <Button
            className="md:hidden"
            variant="ghost"
            size="icon"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>
      {open && (
        <div className="mx-auto mb-3 flex w-full max-w-7xl flex-col gap-1 px-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg",
                pathname === link.href && "bg-fg/[0.1] text-fg"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
