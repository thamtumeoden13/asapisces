// File: lib/redis.ts
import { createClient } from "@vercel/kv";

// // Client này sẽ tự động đọc các biến môi trường từ Vercel
// export const kv = createClient({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

export const kv = createClient({
  // Sử dụng KV_REST_API_URL thay vì UPSTASH_...
  url: process.env.KV_REST_API_URL!,
  
  // Sử dụng KV_REST_API_TOKEN thay vì UPSTASH_...
  token: process.env.KV_REST_API_TOKEN!,
});