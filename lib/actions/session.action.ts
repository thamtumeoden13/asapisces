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

export async function calculateStreakAction() {
  // Lấy thông tin người dùng từ session
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  try {
    // Lấy tất cả các ngày mà người dùng đã luyện tập, không trùng lặp,
    // sắp xếp từ mới nhất đến cũ nhất.
    // Cắt (cast) timestamp thành DATE để loại bỏ phần giờ, phút, giây
    const { data: practiceDays, error } = await supabase
      .from("session_history")
      .select("created_at::date", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error fetching session dates for streak calculation:",
        error
      );
      return { streak: 0, practicedToday: false };
    }
    if (practiceDays.length === 0) {
      return { streak: 0, practicedToday: false };
    }
    // --- LOGIC TÍNH TOÁN CHUỖI NGÀY ---
    let streak = 0;

    // Lấy ngày hôm nay và ngày hôm qua (theo múi giờ của server)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Kiểm tra xem người dùng đã luyện tập hôm nay chưa
    const practicedToday =
      new Date(practiceDays[0].created_at).toISOString().split("T")[0] ===
      todayStr;

    // Bắt đầu tính chuỗi
    let expectedDate = new Date(todayStr); // Bắt đầu từ hôm nay

    // Nếu chưa luyện tập hôm nay, chuỗi ngày bắt đầu từ hôm qua
    if (!practicedToday) {
      expectedDate = new Date(yesterdayStr);
    }

    for (const record of practiceDays) {
      const practiceDateStr = new Date(record.created_at)
        .toISOString()
        .split("T")[0];
      const expectedDateStr = expectedDate.toISOString().split("T")[0];

      if (practiceDateStr === expectedDateStr) {
        streak++;
        // Lùi ngày mong đợi lại 1 ngày
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // Chuỗi ngày bị ngắt
        break;
      }
    }

    return { streak, practicedToday };
  } catch (error) {
    console.error("Error calculating streak:", error);
    return { streak: 0, practicedToday: false };
  }
}

// export async function calculateStreakAction(userId: string) {
//   // Lấy tất cả các phiên của người dùng, sắp xếp theo ngày tạo giảm dần
//   const { data: sessions, error } = await supabase
//     .from("session_history")
//     .select("created_at")
//     .eq("user_id", userId)
//     .order("created_at", { ascending: false });

//   if (error) {
//     console.error("Error fetching sessions for streak calculation:", error);
//     return 0;
//   }

//   if (!sessions || sessions.length === 0) {
//     return 0; // Không có phiên nào
//   }

//   let streak = 0;
//   let lastSessionDate: Date | null = null;

//   for (const session of sessions) {
//     const sessionDate = new Date(session.created_at);
//     // Chỉ quan tâm đến ngày, không quan tâm đến thời gian
//     sessionDate.setHours(0, 0, 0, 0);

//     if (lastSessionDate === null) {
//       // Phiên đầu tiên
//       streak = 1;
//     } else {
//       const diffTime = lastSessionDate.getTime() - sessionDate.getTime();
//       const diffDays = diffTime / (1000 * 60 * 60 * 24);

//       if (diffDays === 1) {
//         // Liên tiếp ngày hôm trước
//         streak += 1;
//       } else if (diffDays > 1) {
//         // Ngắt quãng
//         break;
//       }
//       // Nếu diffDays === 0, nghĩa là cùng một ngày, bỏ qua
//     }

//     lastSessionDate = sessionDate;
//   }

//   return streak;
// }

// export async function endSessionAction(sessionId: number) {
//   try {
//     // Cập nhật thời gian kết thúc của phiên
//     const { data, error } = await supabase
//       .from("session_history")
//       .update({ ended_at: new Date().toISOString() })
//       .eq("id", sessionId);

//     if (error) {
//       console.error("Error ending session:", error);
//       return { success: false, error: "Database error." };
//     }

//     // Xóa cache của trang chính để nó tải lại danh sách recent/popular
//     revalidatePath("/companion");

//     return { success: true };
//   } catch (error) {
//     console.error("Error ending session:", error);
//     return { success: false, error: "Database error." };
//   }
// }
