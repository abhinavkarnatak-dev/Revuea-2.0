/**
 * Sliding-window rate limiter, in-memory.
 *
 * Good enough for a single-instance deployment (Vercel functions reuse
 * warm instances; a determined attacker is still slowed dramatically).
 * For multi-instance scale, swap the store for Upstash Redis - the
 * `RateLimiter` interface below is the only contract callers rely on.
 *
 * ANONYMITY NOTE: keys (hashed IPs) live only in process memory and are
 * never persisted or logged. Nothing here can retroactively link a
 * response to a respondent.
 */

import { createHash } from "crypto";

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Opportunistic cleanup so the map can't grow unbounded.
const MAX_ENTRIES = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (store.size > MAX_ENTRIES) {
    for (const [k, entry] of store) {
      if (entry.timestamps.every((t) => t < cutoff)) store.delete(k);
    }
  }

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Hash an identifier (e.g. IP) so raw values never sit in memory. */
export function hashIdentifier(value: string, scope: string): string {
  return createHash("sha256").update(`${scope}:${value}`).digest("hex");
}
