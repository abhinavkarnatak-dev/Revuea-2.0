import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting ONLY.
 * Never stored, never logged, never associated with a response row.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
