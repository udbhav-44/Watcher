"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const palette = [
  "#f2c46d",
  "#7ad6ff",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#facc15",
  "#60a5fa"
];

const stringHash = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const colorForKey = (key: string): string =>
  palette[stringHash(key) % palette.length];

const initialFor = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "?";
  const segments = trimmed.split(/[^a-z0-9]+/i).filter(Boolean);
  if (segments.length === 0) return "?";
  if (segments.length === 1) return segments[0].slice(0, 1).toUpperCase();
  return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
};

export const ProfileAvatar = (): JSX.Element => {
  const [profileKey, setProfileKey] = useState<string>("guest");

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/profile", {
          credentials: "same-origin",
          cache: "no-store"
        });
        if (!response.ok) return;
        const data = (await response.json()) as { profileKey?: string };
        if (!cancelled && data.profileKey) {
          setProfileKey(data.profileKey);
        }
      } catch {
        // keep default
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const initial = initialFor(profileKey);
  const color = colorForKey(profileKey);

  return (
    <Link
      href="/me/collections"
      aria-label={`Profile ${profileKey}`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-sm font-semibold text-black transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-[#f2c46d]/70 focus-visible:outline-none"
      style={{ backgroundColor: color }}
    >
      {initial}
    </Link>
  );
};
