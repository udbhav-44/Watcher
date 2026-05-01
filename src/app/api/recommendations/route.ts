import { NextResponse } from "next/server";

import { getPersonalizedRecommendations } from "@/lib/personalization/recommendations";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export async function GET(): Promise<Response> {
  const profileKey = getProfileKeyFromCookie();
  const result = await getPersonalizedRecommendations(profileKey);
  return NextResponse.json({
    basis: result.basis,
    recommendations: result.recommendations.map((entry) => ({
      titleId: entry.titleId,
      title: entry.title,
      mediaType: entry.mediaType ?? "movie",
      posterUrl: entry.posterUrl ?? null,
      releaseYear: entry.releaseYear ?? null
    }))
  });
}
