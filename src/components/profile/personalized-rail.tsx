import Image from "next/image";
import Link from "next/link";

import { detailHrefFor } from "@/lib/catalog/titleId";
import type { PersonalizedRecommendations } from "@/lib/personalization/recommendations";

type Props = {
  data: PersonalizedRecommendations;
};

export const PersonalizedRail = ({ data }: Props): JSX.Element | null => {
  if (!data.basis || data.recommendations.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="personalized-rail-heading">
      <h2
        id="personalized-rail-heading"
        className="text-lg font-medium tracking-tight text-fg md:text-xl"
      >
        Because you liked{" "}
        <span className="text-accent">{data.basis.title}</span>
      </h2>
      <div className="rail-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {data.recommendations.map((entry) => (
          <Link
            key={entry.titleId}
            href={detailHrefFor(entry.titleId)}
            className="group w-[160px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card transition outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <div className="relative aspect-[2/3] w-full bg-surface-3">
              {entry.posterUrl ? (
                <Image
                  src={entry.posterUrl}
                  alt={entry.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                  sizes="160px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-fg-faint">
                  Artwork unavailable
                </div>
              )}
            </div>
            <div className="space-y-1 p-2">
              <p className="line-clamp-1 text-sm font-medium text-fg">
                {entry.title}
              </p>
              <p className="text-xs text-fg-faint tabular-nums">
                {entry.releaseYear ?? "TBA"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
