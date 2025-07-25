// File: drizzle/db.ts (hoặc tên file cấu hình của bạn)

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// --- QUAN TRỌNG: KHAI BÁO BIẾN CLIENT Ở PHẠM VI TOÀN CỤC ---
// Điều này cho phép Next.js tái sử dụng kết nối giữa các lần gọi hàm serverless trong cùng một container.
declare global {
  // eslint-disable-next-line no-var -- declare global var
  var client: postgres.Sql | undefined;
}

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is not set.");
}

let client: postgres.Sql;

// Ngăn chặn việc tạo nhiều kết nối trong môi trường dev do Hot Module Reload
if (process.env.NODE_ENV === "production") {
  client = postgres(process.env.SUPABASE_DB_URL, {
    ssl: "require",
    // Cấu hình tối ưu cho serverless
    max: 1, // Chỉ cho phép 1 kết nối trên mỗi instance lambda
    idle_timeout: 20, // Tự động đóng kết nối sau 20 giây không hoạt động
    connect_timeout: 10, // Timeout nếu không thể kết nối sau 10 giây
  });
} else {
  if (!global.client) {
    global.client = postgres(process.env.SUPABASE_DB_URL, {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  client = global.client;
}

export const db = drizzle(client, { schema });
export * from "./schema";
export * from "./server";