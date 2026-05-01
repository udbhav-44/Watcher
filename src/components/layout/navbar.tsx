"use client";

import { useState } from "react";
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
  const showAdmin = clientEnv.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD === "true";
  const navLinks = showAdmin ? [...links, adminLink] : links;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070707]/88 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-wide"
        >
          <Tv className="h-5 w-5 text-[#f2c46d]" />
          CampusStream
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-2 text-sm text-white/68 transition hover:bg-white/[0.08] hover:text-white",
                pathname === link.href && "bg-white/[0.1] text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search">
            <Button variant="ghost" size="sm">
              <Search className="mr-1 h-4 w-4" /> Find
            </Button>
          </Link>
          <ProfileAvatar />
          <Button
            className="md:hidden"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((prev) => !prev)}
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
                "rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.08]",
                pathname === link.href && "bg-white/[0.1] text-white"
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
