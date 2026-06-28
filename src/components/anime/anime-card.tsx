import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";

import { detailHrefFor } from "@/lib/catalog/titleId";
import type { MovieCard as MovieCardType } from "@/lib/types";

type Props = {
  anime: MovieCardType;
};

export const AnimeCard = ({ anime }: Props): JSX.Element => {
  const rating =
    typeof anime.voteAverage === "number" && anime.voteAverage > 0
      ? anime.voteAverage.toFixed(1)
      : null;

  return (
    <div className="group w-[168px] shrink-0 transition-transform duration-200 ease-out-soft hover:-translate-y-1.5 sm:w-[184px] lg:w-[196px] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={detailHrefFor(anime.titleId)}
        className="block overflow-hidden rounded-lg border border-border bg-surface-2 shadow-card transition outline-none hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-3">
          {anime.posterUrl ? (
            <Image
              src={anime.posterUrl}
              alt={anime.title}
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
              sizes="196px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-3 px-4 text-center text-xs text-fg-faint">
              Artwork unavailable
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90" />
          {rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-base/80 px-2 py-0.5 text-[10px] font-medium text-fg tabular-nums">
              <Star className="h-2.5 w-2.5 fill-accent text-accent" />
              {rating}
            </div>
          )}
          <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-fg text-fg-on-accent opacity-0 shadow-lift transition group-focus-within:opacity-100 group-hover:opacity-100">
            <Play className="h-4 w-4 fill-current" />
          </div>
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-1 text-sm font-medium text-fg">
            {anime.title}
          </p>
          <p className="text-xs text-fg-faint tabular-nums">
            {anime.releaseYear ?? "TBA"}
            {anime.numberOfEpisodes
              ? `  ·  ${anime.numberOfEpisodes} eps`
              : ""}
          </p>
          {anime.genres.length > 0 && (
            <p className="line-clamp-1 text-xs text-accent/80">
              {anime.genres.slice(0, 2).join("  ·  ")}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};
