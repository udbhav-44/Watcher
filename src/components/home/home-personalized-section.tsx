import { ContinueWatchingRail } from "@/components/profile/continue-watching-rail";
import { PersonalizedRail } from "@/components/profile/personalized-rail";
import { UpNextRail } from "@/components/profile/up-next-rail";
import { getContinueWatchingItems } from "@/lib/personalization/continueWatching";
import { getPersonalizedRecommendations } from "@/lib/personalization/recommendations";
import { computeUpNext } from "@/lib/personalization/seriesProgress";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export const HomePersonalizedSection = async (): Promise<JSX.Element> => {
  const profileKey = getProfileKeyFromCookie();
  const [continueItems, upNext, recommendations] = await Promise.all([
    getContinueWatchingItems(profileKey),
    computeUpNext(profileKey),
    getPersonalizedRecommendations(profileKey)
  ]);

  return (
    <>
      <ContinueWatchingRail items={continueItems} />
      <UpNextRail entries={upNext} />
      <PersonalizedRail data={recommendations} />
    </>
  );
};
