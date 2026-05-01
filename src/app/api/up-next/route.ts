import { NextResponse } from "next/server";

import { computeUpNext } from "@/lib/personalization/seriesProgress";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export async function GET(): Promise<Response> {
  const profileKey = getProfileKeyFromCookie();
  const entries = await computeUpNext(profileKey);
  return NextResponse.json({
    upNext: entries.map((entry) => ({
      titleId: entry.show.titleId,
      title: entry.show.title,
      posterUrl: entry.show.posterUrl,
      backdropUrl: entry.show.backdropUrl,
      season: entry.season,
      episode: entry.episode,
      episodeName: entry.episodeName,
      episodeStillUrl: entry.episodeStillUrl,
      totalEpisodes: entry.totalEpisodes,
      watchedEpisodes: entry.watchedEpisodes,
      completionPercent: entry.completionPercent,
      progressPercent: entry.progressPercent,
      reason: entry.reason
    }))
  });
}
