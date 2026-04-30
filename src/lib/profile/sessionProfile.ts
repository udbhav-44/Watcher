import { cookies } from "next/headers";

const COOKIE_KEY = "campus_profile";
const FALLBACK_PROFILE = "guest";
const profileKeyPattern = /^[a-z0-9_-]{2,24}$/i;

export const getProfileKeyFromCookie = (): string => {
  const value = cookies().get(COOKIE_KEY)?.value ?? FALLBACK_PROFILE;
  return profileKeyPattern.test(value) ? value : FALLBACK_PROFILE;
};

export const profileCookieKey = COOKIE_KEY;
