/**
 * Small in-memory fixed-window rate limiter for the API routes.
 *
 * - Keyed by `<route>:<client ip>`; default 30 requests per minute per key.
 * - Memory is bounded: expired windows are pruned as calls arrive and the
 *   oldest keys are evicted past `maxKeys`.
 * - Per server instance only. Good enough for the demo; a multi-instance
 *   deployment needs a shared store (see docs/SECURITY-ROADMAP.md).
 * - Never sees or stores request bodies — only the derived key.
 */

export interface RateLimitOptions {
  /** Window length in ms. Default 60 000. */
  windowMs?: number;
  /** Requests allowed per key per window. Default 30. */
  max?: number;
  /** Upper bound on tracked keys. Default 10 000. */
  maxKeys?: number;
  /** Clock (ms), injectable for tests. */
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Whole seconds until the current window resets (>= 1). */
  retryAfterSec: number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
  reset(): void;
}

export const DEFAULT_RATE_LIMIT = { windowMs: 60_000, max: 30 } as const;

interface Bucket {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimitOptions = {}): RateLimiter {
  const windowMs = options.windowMs ?? DEFAULT_RATE_LIMIT.windowMs;
  const max = options.max ?? DEFAULT_RATE_LIMIT.max;
  const maxKeys = options.maxKeys ?? 10_000;
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();
  let lastPrune = 0;

  function prune(t: number): void {
    for (const [k, b] of buckets) if (b.resetAt <= t) buckets.delete(k);
    lastPrune = t;
  }

  return {
    check(key: string): RateLimitResult {
      const t = now();
      if (t - lastPrune >= windowMs || buckets.size >= maxKeys) prune(t);
      let bucket = buckets.get(key);
      if (!bucket || bucket.resetAt <= t) {
        while (buckets.size >= maxKeys) {
          const oldest = buckets.keys().next().value;
          if (oldest === undefined) break;
          buckets.delete(oldest);
        }
        bucket = { count: 0, resetAt: t + windowMs };
        buckets.set(key, bucket);
      }
      bucket.count += 1;
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - t) / 1000));
      return {
        allowed: bucket.count <= max,
        limit: max,
        remaining: Math.max(0, max - bucket.count),
        retryAfterSec,
      };
    },
    reset(): void {
      buckets.clear();
      lastPrune = 0;
    },
  };
}

/**
 * Best-effort client address. Prefers `x-real-ip` (set by Vercel / common
 * proxies), then the last `x-forwarded-for` hop (the one appended by the
 * nearest proxy; Next.js fills it from the socket when absent). Not a trust
 * boundary: without a proxy these headers are client-controlled.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last.slice(0, 64);
  }
  return "unknown";
}

/** Shared limiter used by withJsonBody (one instance per server process). */
export const apiRateLimiter: RateLimiter = createRateLimiter();

/**
 * The shared limiter is skipped under the unit-test runner so suites that
 * exercise routes many times are unaffected; limiter tests inject their own.
 */
export function isDefaultRateLimitActive(env: Record<string, string | undefined> = process.env): boolean {
  return !(env.VITEST || env.NODE_ENV === "test");
}
