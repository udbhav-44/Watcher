const hostRules = [
  "playimdb.com",
  "vidking.net",
  "streamimdb.ru",
  "vidsrc.cc",
  "vidsrc.to",
  "embed.su",
  "multiembed.mov"
] as const;

export const isAllowedProviderHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return hostRules.some((rule) => host === rule || host.endsWith(`.${rule}`));
};

export const providerHostAllowlist = hostRules;
