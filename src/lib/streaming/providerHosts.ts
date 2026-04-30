const hostRules = ["playimdb.com", "vidking.net", "streamimdb.ru"] as const;

export const isAllowedProviderHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return hostRules.some((rule) => host === rule || host.endsWith(`.${rule}`));
};

export const providerHostAllowlist = hostRules;
