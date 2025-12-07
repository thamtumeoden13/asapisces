"use server";

import { auth } from "@/auth";
import { getUserCredits, deductCredits } from "./credits.action";
import { CREDIT_COSTS } from "@/constants";
import { hasUnlimitedCredits } from "../permissions";

// Chi phí cố định cho mỗi lần bắt đầu phiên hội thoại
const SESSION_START_COST = CREDIT_COSTS.DEEPGRAM_TRANSCRIPTION_PER_MINUTE * 2; // Ví dụ: 200 credits

/**
 * Bắt đầu một phiên hội thoại: kiểm tra credit, trừ credit, và lấy token Deepgram.
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function startConversationSessionAction(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Kiểm tra credit
    const [isUnlimited, currentCredits] = await Promise.all([
      hasUnlimitedCredits(),
      getUserCredits(),
    ]);
    if (!isUnlimited && currentCredits < SESSION_START_COST) {
      return {
        success: false,
        error: "Insufficient credits to start a new session.",
      };
    }

    // 2. Lấy token Deepgram từ API route của bạn
    // NEXT_PUBLIC_SERVER_URL phải được định nghĩa trong file .env của bạn
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/deepgram`
    );
    const data = await response.json();

    if (!response.ok || !data.deepgramToken) {
      console.error("Failed to get Deepgram token:", data.error);
      throw new Error(data.error || "Failed to get Deepgram token.");
    }

    if (!isUnlimited) {
      // 3. Trừ credit SAU KHI lấy token thành công
      const deductResult = await deductCredits(SESSION_START_COST);
      if (!deductResult.success) {
        // Trong trường hợp này, chúng ta đã lấy token nhưng không trừ được credit.
        // Cần có cơ chế log lại để admin kiểm tra.
        console.error(
          `CRITICAL: Failed to deduct credits for user ${session.user.id} after getting token.`
        );
      }
    }

    // 4. Trả về token cho client
    return { success: true, token: data.deepgramToken };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Error in startConversationSessionAction:", error);
    return { success: false, error: errorMessage };
  }
}
