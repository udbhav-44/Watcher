import { notFound } from "next/navigation";

import { StreamingPlayer } from "@/components/player/StreamingPlayer";
import { Card } from "@/components/ui/card";
import { getMovieByTitleId } from "@/lib/data/movies";

type Props = {
  params: { ttid: string };
};

export default async function WatchPage({ params }: Props): Promise<JSX.Element> {
  const movie = await getMovieByTitleId(params.ttid);
  if (!movie) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Watching {movie.title}</h1>
      <StreamingPlayer src={movie.playableUrl} poster={movie.backdropUrl} />
      <Card>
        <p className="text-sm text-white/70">
          Adaptive playback enabled. Resume and quality controls can be expanded with HLS manifests and watch-event API.
        </p>
      </Card>
    </div>
  );
}
