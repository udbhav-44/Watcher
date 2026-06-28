import { cache } from "react";

import {
  getFeaturedRails,
  getNowPlayingMovies
} from "@/lib/data/movies";
import { getOnTheAirTv, getTvFeaturedRails } from "@/lib/data/tv";

export const getCachedFeaturedRails = cache(getFeaturedRails);
export const getCachedTvFeaturedRails = cache(getTvFeaturedRails);
export const getCachedNowPlayingMovies = cache(getNowPlayingMovies);
export const getCachedOnTheAirTv = cache(getOnTheAirTv);
