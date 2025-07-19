// File: app/actions/sessionActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/server";
import { auth } from "@/auth";

export async function recordSessionStartAction(companionId?: string) {
  // Kiểm tra xem companionId có hợp lệ không
  if (!companionId) {
    throw new Error("Invalid companion ID.");
  }

  // Lấy thông tin người dùng từ session
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  try {
    // Chèn một dòng mới vào bảng session_history
    await supabase.from("session_history").insert({
      user_id: userId,
      companion_id: companionId,
    });

    // Xóa cache của trang chính để nó tải lại danh sách recent/popular
    revalidatePath("/companion");

    return { success: true };
  } catch (error) {
    console.error("Error recording session start:", error);
    return { success: false, error: "Database error." };
  }
}
