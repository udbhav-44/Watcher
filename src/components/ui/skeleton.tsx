import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Block-level shimmer used as a loading placeholder. Compose into specific
 * skeleton shapes via the helpers below so async surfaces (rails, hero, lists)
 * have a consistent loading state.
 */
export const Skeleton = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element => (
  <div
    aria-hidden
    className={cn(
      "relative overflow-hidden rounded-md bg-fg/[0.06]",
      "before:absolute before:inset-0 before:-translate-x-full",
      "before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r",
      "before:from-transparent before:via-fg/10 before:to-transparent",
      className
    )}
    {...props}
  />
);

export const PosterSkeleton = (): JSX.Element => (
  <div className="w-[168px] shrink-0 sm:w-[184px] lg:w-[196px]">
    <Skeleton className="aspect-[2/3] w-full rounded-lg" />
    <div className="space-y-2 p-3">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
  </div>
);

export const RailSkeleton = ({ count = 6 }: { count?: number }): JSX.Element => (
  <section className="space-y-3" aria-busy="true" aria-live="polite">
    <Skeleton className="h-5 w-40" />
    <div className="-mx-4 flex gap-3 overflow-hidden px-4">
      {Array.from({ length: count }).map((_, idx) => (
        <PosterSkeleton key={idx} />
      ))}
    </div>
  </section>
);

export const HeroSkeleton = (): JSX.Element => (
  <div
    className="relative min-h-[520px] overflow-hidden rounded-xl border border-border bg-surface"
    aria-busy="true"
  >
    <Skeleton className="absolute inset-0 rounded-none" />
    <div className="relative flex min-h-[520px] flex-col justify-end gap-4 p-5 md:p-10">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-16 w-1/2" />
      <div className="flex gap-3">
        <Skeleton className="h-12 w-28 rounded-full" />
        <Skeleton className="h-12 w-32 rounded-full" />
      </div>
    </div>
  </div>
);
