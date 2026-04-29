type WatchlistEntry = {
  id: string;
  profileKey: string;
  movieId: string;
  createdAt: string;
};

type WatchEventEntry = {
  id: string;
  profileKey: string;
  movieId: string;
  secondsWatched: number;
  progressPercent: number;
  completed: boolean;
  watchedAt: string;
};

type ReactionEntry = {
  id: string;
  profileKey: string;
  movieId: string;
  type: "LIKE" | "FIRE" | "WOW";
  createdAt: string;
};

export const memoryStore = {
  watchlist: [] as WatchlistEntry[],
  watchEvents: [] as WatchEventEntry[],
  reactions: [] as ReactionEntry[]
};
