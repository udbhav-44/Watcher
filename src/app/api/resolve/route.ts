import { NextResponse } from "next/server";
import { z } from "zod";

import { parseTitleId } from "@/lib/imdb/parseTitleId";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";

const resolveSchema = z.object({
  imdbUrlOrId: z.string().min(2)
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

  return NextResponse.json({
    titleId,
    playableUrl: toPlayableUrl(titleId, parsed.data.imdbUrlOrId)
  });
}
