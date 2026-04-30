import { NextResponse } from "next/server";
import { z } from "zod";

import { parseTitleId } from "@/lib/imdb/parseTitleId";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";
import { resolveVidkingUrlFromIdentifier } from "@/lib/vidking/resolveVidkingUrl";

const resolveSchema = z.object({
  imdbUrlOrId: z.string().min(2),
  provider: z.enum(["playimdb", "vidking"]).default("playimdb")
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const titleId = parseTitleId(parsed.data.imdbUrlOrId);
  if (!titleId) {
    return NextResponse.json({ error: "Could not parse IMDb title id" }, { status: 422 });
  }

  const provider = parsed.data.provider;
  if (provider === "vidking") {
    const vidkingUrl = await resolveVidkingUrlFromIdentifier(titleId);
    if (!vidkingUrl) {
      return NextResponse.json(
        {
          error:
            "Could not resolve Vidking URL from this IMDb id. Vidking expects TMDB id (use TMDB_API_KEY for automatic mapping)."
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      titleId,
      provider,
      playableUrl: vidkingUrl
    });
  }

  return NextResponse.json({ titleId, provider, playableUrl: toPlayableUrl(titleId, parsed.data.imdbUrlOrId, "playimdb") });
}
