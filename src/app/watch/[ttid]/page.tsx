import Link from "next/link";
import { notFound } from "next/navigation";

import { ServerTogglePlayer } from "@/components/player/server-toggle-player";
import { Card } from "@/components/ui/card";
import { getFeaturedRails, getMovieByTitleId } from "@/lib/data/movies";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import { resolveVidkingUrlFromIdentifier } from "@/lib/vidking/resolveVidkingUrl";

type Props = {
  params: { ttid: string };
};

export default async function WatchPage({
  params
}: Props): Promise<JSX.Element> {
  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();
  const rails = await getFeaturedRails();
  const upNext = rails
    .flatMap((rail) => rail.movies)
    .find((candidate) => candidate.titleId !== movie.titleId);
  const playImdbUrl = movie.imdbTitleId
    ? toPlayableUrl(movie.imdbTitleId, undefined, "playimdb")
    : toPlayableUrl(movie.titleId, undefined, "playimdb");
  const vidkingUrl = await resolveVidkingUrlFromIdentifier(movie.titleId).catch(
    () => null
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{movie.title}</h1>
      <ServerTogglePlayer
        titleId={movie.titleId}
        poster={movie.backdropUrl}
        playImdbUrl={playImdbUrl}
        vidkingUrl={vidkingUrl}
      />
      <Card>
        <p className="text-sm text-white/68">
          Playback opens inside the page when the provider allows it. Use the
          alternate server or open the player in a new tab if a stream does not
          start.
        </p>
        {upNext && (
          <p className="mt-3 text-sm">
            Up next:{" "}
            <Link
              href={`/watch/${upNext.titleId}`}
              className="text-[#f2c46d] underline-offset-4 hover:underline"
            >
              {upNext.title}
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
