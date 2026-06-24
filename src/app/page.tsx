import { Suspense } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { MovieRailsSection } from "@/components/home/movie-rails-section";
import { TvRailsSection } from "@/components/home/tv-rails-section";
import { ContinueWatching } from "@/components/profile/continue-watching";
import { PersonalizedRail } from "@/components/profile/personalized-rail";
import { UpNextRail } from "@/components/profile/up-next-rail";
import { HeroSkeleton, RailSkeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage(): JSX.Element {
  return (
    <>
      <Suspense fallback={<HeroSkeleton fullBleed />}>
        <HeroSection />
      </Suspense>

      <div className="mx-auto mt-8 max-w-7xl space-y-10 px-4">
        <ContinueWatching />
        <UpNextRail />
        <PersonalizedRail />

        <Suspense
          fallback={
            <div className="space-y-10">
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
            </div>
          }
        >
          <TvRailsSection />
        </Suspense>
      </div>
    </>
  );
}
