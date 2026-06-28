import { Suspense } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { HomePersonalizedSection } from "@/components/home/home-personalized-section";
import { MovieRailsSection } from "@/components/home/movie-rails-section";
import { TvRailsSection } from "@/components/home/tv-rails-section";
import { HeroSkeleton, RailSkeleton } from "@/components/ui/skeleton";

export const revalidate = 1800;

export default function HomePage(): JSX.Element {
  return (
    <>
      <Suspense fallback={<HeroSkeleton fullBleed />}>
        <HeroSection />
      </Suspense>

      <div className="mx-auto mt-8 max-w-7xl space-y-10 px-4">
        <Suspense fallback={<RailSkeleton count={3} />}>
          <HomePersonalizedSection />
        </Suspense>

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
