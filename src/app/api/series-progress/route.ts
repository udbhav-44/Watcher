import { NextResponse } from "next/server";

import { titleIdSchema } from "@/lib/catalog/titleId";
import { computeSeriesCompletion } from "@/lib/personalization/seriesProgress";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const titleIdRaw = searchParams.get("titleId");
  if (!titleIdRaw) {
    return NextResponse.json({ error: "Missing titleId" }, { status: 400 });
  }
  const parsed = titleIdSchema.safeParse(titleIdRaw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid title id" }, { status: 400 });
  }

  const profileKey = getProfileKeyFromCookie();
  const progress = await computeSeriesCompletion(profileKey, parsed.data);
  return NextResponse.json({ progress });
}
