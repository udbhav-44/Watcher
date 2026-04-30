import { env } from "@/lib/config/env";

export const assertAdminAccess = (request: Request): boolean => {
  if (env.NEXT_PUBLIC_ENABLE_ADMIN_DASHBOARD !== "true") return false;
  if (!env.ADMIN_INTERNAL_KEY) return false;

  const incoming = request.headers.get("x-internal-admin-key");
  return incoming === env.ADMIN_INTERNAL_KEY;
};
