const TITLE_ID_REGEX = /tt\d{7,9}/i;

export const parseTitleId = (input: string): string | null => {
  const normalized = input.trim();
  if (!normalized) return null;

  const directMatch = normalized.match(TITLE_ID_REGEX);
  if (directMatch) return directMatch[0].toLowerCase();

  try {
    const url = new URL(normalized);
    const matchFromPath = url.pathname.match(TITLE_ID_REGEX);
    return matchFromPath?.[0].toLowerCase() ?? null;
  } catch {
    return null;
  }
};
