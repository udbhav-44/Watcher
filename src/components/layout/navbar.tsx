"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Menu, Search, Tv, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { clientEnv } from "@/lib/config/clientEnv";
import { cn } from "@/lib/utils";

const primaryLinks: ReadonlyArray<{ href: Route; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Movies" },
  { href: "/tv", label: "TV" },
  { href: "/anime" as Route, label: "Anime" }
];

const secondaryLinks: ReadonlyArray<{ href: Route; label: string }> = [
  { href: "/new", label: "New" },
  { href: "/calendar", label: "Calendar" },
  { href: "/me/collections", label: "Collections" },
  { href: "/me/watchlist", label: "Watchlist" }
];

const adminLink = { href: "/admin/dashboard" as Route, label: "Admin" };

type NavbarVariant = "default" | "minimal";

type Props = {
  variant?: NavbarVariant;
};

export const Navbar = ({ variant = "default" }: Props): JSX.Element => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const minimal = variant === "minimal";
  const showAdmin = clientEnv.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD === "true";
  const mobileSecondary = showAdmin
    ? [...secondaryLinks, adminLink]
    : secondaryLinks;

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 16);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-[background-color,border-color,backdrop-filter,padding] duration-200 ease-out-soft",
        scrolled || minimal
          ? "border-b border-border bg-base/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent backdrop-blur-0"
      )}
    >
      <nav
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4",
          minimal ? "py-2" : "py-3"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-wide text-fg"
        >
          <Tv className="h-5 w-5 text-accent" />
          <span className={minimal ? "sr-only sm:not-sr-only" : undefined}>
            CampusStream
          </span>
        </Link>

        {!minimal && (
          <div className="hidden items-center gap-0.5 md:flex">
            {primaryLinks.map((link) => (
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
        )}

        <div className="flex items-center gap-1.5">
          <Link
            href="/search"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-border bg-fg/[0.04] text-fg-muted transition hover:border-border-strong hover:bg-fg/[0.08] hover:text-fg",
              minimal
                ? "p-2"
                : "hidden px-3 py-2 text-xs sm:inline-flex"
            )}
            aria-label="Search the catalog"
          >
            <Search className="h-4 w-4" />
            {!minimal && (
              <>
                <span className="hidden md:inline">Search</span>
                <kbd className="ml-0.5 hidden rounded border border-border bg-base/60 px-1.5 py-0.5 font-mono text-[10px] text-fg-faint lg:inline-flex">
                  ⌘K
                </kbd>
              </>
            )}
          </Link>
          <ProfileAvatar />
          {!minimal && (
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
          )}
        </div>
      </nav>

      {open && !minimal && (
        <div className="mx-auto mb-3 flex w-full max-w-7xl flex-col gap-1 px-4 md:hidden">
          {primaryLinks.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg",
                pathname === link.href && "bg-fg/[0.1] text-fg"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 border-t border-border pt-2">
            <p className="px-3 pb-1 text-[10px] tracking-[0.18em] text-fg-faint uppercase">
              Library
            </p>
            {mobileSecondary.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm text-fg-muted transition hover:bg-fg/[0.08] hover:text-fg",
                  pathname === link.href && "bg-fg/[0.1] text-fg"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
