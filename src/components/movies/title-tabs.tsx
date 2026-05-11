"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  defaultActiveId?: string;
};

/**
 * Anchor-style segmented tabs for title detail pages. Each tab smooth-scrolls
 * to a section by id and tracks the currently visible section via an
 * IntersectionObserver so the active state stays accurate while the user
 * scrolls manually.
 */
export const TitleTabs = ({
  tabs,
  defaultActiveId
}: Props): JSX.Element => {
  const [active, setActive] = useState(defaultActiveId ?? tabs[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = tabs
      .map((tab) => document.getElementById(tab.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [tabs]);

  const handleClick = (id: string): void => {
    setActive(id);
    const node = document.getElementById(id);
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Title sections"
      className="sticky top-16 z-10 -mx-4 mb-2 flex gap-1 overflow-x-auto border-b border-border bg-base/85 px-4 py-2 backdrop-blur"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleClick(tab.id)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "relative shrink-0 rounded-full px-3 py-1.5 text-sm transition",
              isActive
                ? "bg-fg/[0.1] text-fg"
                : "text-fg-muted hover:bg-fg/[0.06] hover:text-fg"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
