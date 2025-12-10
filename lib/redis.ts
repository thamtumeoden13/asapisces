// File: lib/redis.ts
import { createClient } from "@vercel/kv";

// Client này sẽ tự động đọc các biến môi trường từ Vercel
export const kv = createClient({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
