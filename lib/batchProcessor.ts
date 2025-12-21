// File: lib/batchProcessor.ts

/**
 * Xử lý một mảng các tác vụ Promise theo từng đợt (batch) để tránh Rate Limiting.
 * @param items Mảng các mục cần xử lý.
 * @param processingFn Một hàm async nhận một mục và trả về một Promise.
 * @param batchSize Kích thước của mỗi đợt.
 * @param delayBetweenBatches Thời gian chờ (ms) giữa các đợt.
 */
export async function processInBatches<T, R>(
  items: T[],
  processingFn: (item: T) => Promise<R>,
  batchSize: number,
  delayBetweenBatches: number = 1000 // Mặc định chờ 1 giây giữa các đợt
): Promise<R[]> {
  let results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batchItems = items.slice(i, i + batchSize);
    console.log(`[BATCH] Processing batch ${i / batchSize + 1} of ${Math.ceil(items.length / batchSize)}...`);

    const batchPromises = batchItems.map(item => processingFn(item));
    const batchResults = await Promise.all(batchPromises);
    results = results.concat(batchResults);

    // Nếu đây không phải là đợt cuối cùng, hãy chờ một chút
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}