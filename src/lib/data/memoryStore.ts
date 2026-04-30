type WatchlistEntry = {
  id: string;
  profileKey: string;
  titleId: string;
  createdAt: string;
};

type WatchEventEntry = {
  id: string;
  profileKey: string;
  titleId: string;
  secondsWatched: number;
  progressPercent: number;
  completed: boolean;
  watchedAt: string;
};

type ReactionEntry = {
  id: string;
  profileKey: string;
  titleId: string;
  type: "LIKE" | "FIRE" | "WOW";
  createdAt: string;
};

type ProfileEntry = {
  key: string;
  displayName: string;
  avatarColor?: string;
};

export const memoryStore = {
  profiles: [
    { key: "guest", displayName: "Guest", avatarColor: "#f2c46d" },
    { key: "default", displayName: "Default", avatarColor: "#8fb7ff" }
  ] as ProfileEntry[],
  watchlist: [] as WatchlistEntry[],
  watchEvents: [] as WatchEventEntry[],
  reactions: [] as ReactionEntry[]
};
