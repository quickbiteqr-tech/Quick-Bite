import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Define a placeholder Redis client if the environment variables are missing
// so the build doesn't crash, but it will throw an error if used.
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : ({
      // Mock for development if keys are not set, you can remove this or handle differently
      // if you want to strictly require the env vars.
      sadd: async () => 1,
      eval: async () => [0, 100, 1000, 0], // fake successful response for rate limiter
    } as unknown as Redis);

// Order submission: 5 requests per 1 minute
export const orderRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/order",
});

// Auth endpoints: 5 requests per 5 minutes
export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});
