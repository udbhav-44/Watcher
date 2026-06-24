export type EmbedProgress = {
  currentTime: number;
  duration: number;
  progressPercent: number;
};

type RawMessage = Record<string, unknown>;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const progressFromTimes = (
  currentTime: number,
  duration: number
): EmbedProgress | null => {
  if (currentTime < 0 || duration <= 0) return null;
  const progressPercent = Math.min(100, (currentTime / duration) * 100);
  return {
    currentTime,
    duration,
    progressPercent
  };
};

const parseMegacloud = (payload: RawMessage): {
  kind: "progress" | "complete" | "error";
  progress?: EmbedProgress;
} | null => {
  if (payload.channel !== "megacloud") return null;
  const event = payload.event;
  if (event === "complete") return { kind: "complete" };
  if (event === "error") return { kind: "error" };
  if (event !== "time" && event !== "watching-log") return null;

  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as RawMessage)
      : payload;
  const currentTime =
    asNumber(data.currentTime) ??
    asNumber(data.current) ??
    asNumber(data.time) ??
    asNumber(data.played);
  const duration =
    asNumber(data.duration) ?? asNumber(data.total) ?? asNumber(data.totalTime);
  if (currentTime == null || duration == null) return null;
  const progress = progressFromTimes(currentTime, duration);
  return progress ? { kind: "progress", progress } : null;
};

const parseNestedPlayerEvent = (payload: RawMessage): {
  kind: "progress" | "complete";
  progress?: EmbedProgress;
} | null => {
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as RawMessage)
      : null;
  // Different providers nest the event name differently: Vidking uses
  // `timeupdate`/`ended`, Vidsrc.cc uses `time`/`complete` (wrapped under a
  // `PLAYER_EVENT` type), VidLink uses `timeupdate`/`ended`. Inspect every
  // candidate slot rather than only the first non-empty one so a `complete`
  // sitting in `data.event` isn't masked by `type: "PLAYER_EVENT"`.
  const eventNames = [
    payload.event,
    payload.type,
    data?.event,
    data?.type
  ].map((value) => String(value ?? "").toLowerCase());

  const indicatesCompletion = eventNames.some(
    (name) =>
      name.includes("complete") || name.includes("ended") || name === "finish"
  );

  if (indicatesCompletion) {
    return { kind: "complete" };
  }

  const currentTime =
    asNumber(payload.currentTime) ??
    asNumber(data?.currentTime) ??
    asNumber(data?.current) ??
    asNumber(payload.current);
  const duration =
    asNumber(payload.duration) ??
    asNumber(data?.duration) ??
    asNumber(data?.total);

  if (currentTime == null || duration == null) return null;
  const progress = progressFromTimes(currentTime, duration);
  return progress ? { kind: "progress", progress } : null;
};

/**
 * Normalize postMessage payloads from MegaPlay (megacloud) and other embed
 * providers into progress or completion signals.
 */
export const parseEmbedMessage = (
  payload: unknown
): {
  kind: "progress" | "complete" | "error";
  progress?: EmbedProgress;
} | null => {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as RawMessage;

  const megacloud = parseMegacloud(raw);
  if (megacloud) return megacloud;

  return parseNestedPlayerEvent(raw);
};

export const AUTOPLAY_NEXT_KEY = "campusstream:autoplay-next";

export const readAutoplayNextPreference = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(AUTOPLAY_NEXT_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {
    // ignore
  }
  return true;
};
