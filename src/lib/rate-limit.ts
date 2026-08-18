/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single-node deployment; swap for Redis in a cluster.
 */
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0 };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.timestamps.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }

  return { allowed: true, remaining: limit - bucket.timestamps.length };
}

export function clientKey(request: Request, scope: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${scope}:${ip}`;
}
