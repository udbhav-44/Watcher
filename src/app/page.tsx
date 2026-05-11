import { Suspense } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { MovieRailsSection } from "@/components/home/movie-rails-section";
import { TvRailsSection } from "@/components/home/tv-rails-section";
import { ContinueWatching } from "@/components/profile/continue-watching";
import { PersonalizedRail } from "@/components/profile/personalized-rail";
import { RecentSearches } from "@/components/profile/recent-searches";
import { UpNextRail } from "@/components/profile/up-next-rail";
import { HeroSkeleton, RailSkeleton } from "@/components/ui/skeleton";

export default function HomePage(): JSX.Element {
  return (
    <div className="space-y-10">
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <RecentSearches />
      <ContinueWatching />
      <UpNextRail />
      <PersonalizedRail />
      <Suspense
        fallback={
          <div className="space-y-10">
            <RailSkeleton count={6} />
            <RailSkeleton count={6} />
          </div>
        }
      >
        <MovieRailsSection />
      </Suspense>
      <Suspense
        fallback={
          <div className="space-y-10">
            <RailSkeleton count={6} />
            <RailSkeleton count={6} />
          </div>
        }
      >
        <TvRailsSection />
      </Suspense>
    </div>
  );
}
