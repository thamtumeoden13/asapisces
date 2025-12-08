// File: lib/redis.ts
import { createClient } from "@vercel/kv";

// Client này sẽ tự động đọc các biến môi trường từ Vercel
export const kv = createClient({
  url: process.env.KV_URL!,
  token: process.env.KV_TOKEN!,
});
