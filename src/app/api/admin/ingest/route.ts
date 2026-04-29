import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { parseTitleId } from "@/lib/imdb/parseTitleId";
import { toPlayableUrl } from "@/lib/imdb/toPlayableUrl";

const ingestSchema = z.object({
  title: z.string().min(2),
  imdbUrlOrId: z.string().min(2),
  synopsis: z.string().optional()
});

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const titleId = parseTitleId(parsed.data.imdbUrlOrId);
  if (!titleId) {
    return NextResponse.json({ error: "Unable to parse title id" }, { status: 422 });
  }

  try {
    const movie = await prisma.movie.upsert({
      where: { titleId },
      update: {
        title: parsed.data.title,
        synopsis: parsed.data.synopsis,
        playableUrl: toPlayableUrl(titleId, parsed.data.imdbUrlOrId)
      },
      create: {
        titleId,
        title: parsed.data.title,
        synopsis: parsed.data.synopsis,
        playableUrl: toPlayableUrl(titleId, parsed.data.imdbUrlOrId)
      }
    });

    await prisma.adminAudit.create({
      data: { action: "INGEST_UPSERT", targetType: "Movie", targetId: movie.id, metadata: parsed.data }
    });

    return NextResponse.json({ movie });
  } catch {
    return NextResponse.json({
      simulated: true,
      movie: {
        titleId,
        title: parsed.data.title,
        synopsis: parsed.data.synopsis,
        playableUrl: toPlayableUrl(titleId, parsed.data.imdbUrlOrId)
      }
    });
  }
}
