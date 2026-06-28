import "server-only";

const ERROR_MARKERS = [
  "Error - MegaPlay",
  "We can't find the file you are looking for",
  'class="error-code"',
  "Content Removed",
  "410 Gone",
  "we Coudn't find this episode",
  "Couldn't find this episode"
] as const;

const PLAYABLE_MARKERS = [
  "Vidking Player",
  "iframe",
  "jwplayer",
  "<video"
] as const;

/**
 * Server-side embed health check. Returns true only when the URL responds with
 * HTTP OK and HTML that looks like a player shell, not an error page.
 */
export const probeAnimeEmbedUrl = async (url: string): Promise<boolean> => {
  if (!url.startsWith("https://")) return false;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    });
    if (!response.ok) return false;

    const html = await response.text();
    if (ERROR_MARKERS.some((marker) => html.includes(marker))) return false;
    return PLAYABLE_MARKERS.some((marker) => html.includes(marker));
  } catch {
    return false;
  }
};
