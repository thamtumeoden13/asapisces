"use server";

import { supabase } from "@/lib/supabase/server";
import { auth } from "@/auth";

import { hasUnlimitedCredits } from "@/lib/permissions";

/**
 * Lấy số credits hiện tại của người dùng.
 * @returns {Promise<number>} Số credits hiện tại.
 */
export async function getUserCredits(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user credits:", error);
    return 0;
  }

  return data?.credits || 0;
}

/**
 * Trừ credits từ tài khoản người dùng.
 * Hàm này được gọi SAU KHI một tác vụ AI đã hoàn thành thành công.
 * @param {number} amount - Số credits cần trừ.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deductCredits(
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Unauthorized" };

  if (amount <= 0) return { success: true }; // Không làm gì nếu số lượng không hợp lệ

  try {
    // Sử dụng rpc để thực hiện phép trừ một cách an toàn trên server
    const { error } = await supabase.rpc("deduct_user_credits", {
      p_user_id: userId,
      p_amount: amount,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deducting credits:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown database error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Hàm bao bọc (Wrapper) để thực thi một hành động tốn phí AI.
 * Nó sẽ tự động kiểm tra và trừ credits.
 * @param cost - Chi phí của hành động từ CREDIT_COSTS.
 * @param actionFn - Hàm async thực thi tác vụ AI.
 */
export async function withCreditCheck<T>(
  cost: number,
  actionFn: () => Promise<T>
): Promise<(T & { success: true }) | { success: false; error: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "Unauthorized. Please log in." };
  }

  try {
    const isUnlimited = await hasUnlimitedCredits();

    if (!isUnlimited) {
      const currentCredits = await getUserCredits();

      if (currentCredits < cost) {
        return {
          success: false,
          error: "Insufficient credits. Please upgrade your plan.",
        };
      }
    }

    // Thực thi hành động AI
    const result = await actionFn();

    // Chỉ trừ credit nếu hành động thành công
    // Giả định rằng nếu actionFn ném lỗi, nó sẽ được bắt bởi khối catch bên ngoài
    if (!isUnlimited) {
      await deductCredits(cost);
    }

    // Giả định result là một object, thêm cờ success vào
    return { ...(result as object), success: true } as T & { success: true };
  } catch (error) {
    console.error("Error during credit-checked action:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
