// File: lib/cache.ts
import { kv } from "./redis";

interface CacheOptions {
  keyPrefix: string;
  expiration: number; // Thời gian hết hạn tính bằng giây
}

/**
 * Hàm bao bọc để cache kết quả của một hàm async.
 * @param fn - Hàm async cần được cache (ví dụ: một lệnh gọi AI).
 * @param getKey - Một hàm để tạo ra một cache key duy nhất dựa trên các tham số.
 * @param options - Các tùy chọn cache.
 * @returns Một hàm mới đã được bọc logic cache.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getKey: (...args: Parameters<T>) => string,
  options: CacheOptions
) {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const cacheKey = `${options.keyPrefix}:${getKey(...args)}`;

    try {
      // 1. Kiểm tra cache trước
      const cachedResult = await kv.get<Awaited<ReturnType<T>>>(cacheKey);
      if (cachedResult) {
        console.log(`[CACHE] HIT for key: ${cacheKey}`);
        return cachedResult;
      }
    } catch (error) {
      console.error("[CACHE] Redis GET error:", error);
      // Nếu Redis lỗi, bỏ qua và chạy hàm gốc
    }

    console.log(`[CACHE] MISS for key: ${cacheKey}`);

    // 2. Nếu không có trong cache, gọi hàm gốc
    const result = await fn(...args);

    try {
      // 3. Lưu kết quả vào cache (không await để không làm chậm phản hồi)
      kv.set(cacheKey, result, { ex: options.expiration }).catch((err) => {
        console.error("[CACHE] Redis SET error:", err);
      });
    } catch (error) {
      console.error("[CACHE] Redis SET error:", error);
    }

    return result;
  };
}
