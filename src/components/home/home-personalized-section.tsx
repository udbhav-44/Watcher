import { ContinueWatchingRail } from "@/components/profile/continue-watching-rail";
import { PersonalizedRail } from "@/components/profile/personalized-rail";
import { getContinueWatchingItems } from "@/lib/personalization/continueWatching";
import { getPersonalizedRecommendations } from "@/lib/personalization/recommendations";
import { getProfileKeyFromCookie } from "@/lib/profile/sessionProfile";

export const HomePersonalizedSection = async (): Promise<JSX.Element> => {
  const profileKey = getProfileKeyFromCookie();
  const [continueItems, recommendations] = await Promise.all([
    getContinueWatchingItems(profileKey),
    getPersonalizedRecommendations(profileKey)
  ]);

  return (
    <>
      <ContinueWatchingRail items={continueItems} />
      <PersonalizedRail data={recommendations} />
    </>
  );
};
