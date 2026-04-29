"use client";

import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/me/watchlist", label: "Watchlist" },
  { href: "/admin/dashboard", label: "Admin" }
] as const;

export const Navbar = (): JSX.Element => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          CampusStream
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="rounded-full px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="sm">
          <Search className="mr-1 h-4 w-4" /> Quick Search
        </Button>
      </nav>
    </header>
  );
};
