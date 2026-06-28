import { HeroRotation } from "@/components/movies/hero-rotation";
import {
  getCachedFeaturedRails,
  getCachedTvFeaturedRails
} from "@/lib/data/cached-catalog";
import { dedupeByTitleId } from "@/lib/data/tmdb";

export const HeroSection = async (): Promise<JSX.Element | null> => {
  const [movieRails, tvRails] = await Promise.all([
    getCachedFeaturedRails(),
    getCachedTvFeaturedRails()
  ]);

  const heroPool = dedupeByTitleId(
    [...(movieRails[0]?.movies ?? []), ...(tvRails[0]?.movies ?? [])]
      .filter((entry) => entry.backdropUrl || entry.posterUrl)
      .slice(0, 5)
  );

  if (heroPool.length === 0) return null;
  return <HeroRotation titles={heroPool} />;
};
