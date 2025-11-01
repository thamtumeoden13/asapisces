"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/server";

// Bookmarks
export const addBookmark = async (companionId: string, path: string) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  const { data, error } = await supabase.from("bookmarks").insert({
    companion_id: companionId,
    user_id: userId,
  });

  console.log("addBookmark", { data, error });

  if (error) throw new Error(error.message);
  revalidatePath(path);
  return data;
};

export const removeBookmark = async (companionId: string, path: string) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("companion_id", companionId)
    .eq("user_id", userId);

  console.log("removeBookmark", { data, error });

  if (error) throw new Error(error.message);
  revalidatePath(path);
  return data;
};

export const getBookmarkedCompanions = async (userId: string) => {
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`companions:companion_id (*)`)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return data.map(({ companions }) => companions);
};

// --- HÀM TOGGLE BOOKMARK MỚI ---
export async function toggleBookmarkAction(companionId: string, path: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  try {
    // 1. Kiểm tra xem bookmark đã tồn tại chưa
    const { data: existingBookmark, error: selectError } = await supabase
      .from("bookmarks")
      .select("companion_id") // Chỉ cần chọn một cột để kiểm tra sự tồn tại
      .eq("user_id", userId)
      .eq("companion_id", companionId)
      .single(); // .single() sẽ trả về lỗi nếu có nhiều hơn 1, hoặc null nếu không có

    // Bỏ qua lỗi 'PGRST116' (0 hàng trả về), vì đó là trường hợp chúng ta mong muốn (chưa có bookmark)
    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    let isNowBookmarked: boolean;

    if (existingBookmark) {
      // --- 2a. Nếu đã tồn tại -> Xóa bookmark ---
      console.log(`Bookmark exists. Removing for companion ${companionId}`);
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .match({ user_id: userId, companion_id: companionId });

      if (deleteError) throw deleteError;

      isNowBookmarked = false;
    } else {
      // --- 2b. Nếu chưa tồn tại -> Thêm bookmark mới ---
      console.log(
        `Bookmark does not exist. Adding for companion ${companionId}`
      );
      const { error: insertError } = await supabase.from("bookmarks").insert({
        user_id: userId,
        companion_id: companionId,
      });

      if (insertError) throw insertError;

      isNowBookmarked = true;
    }

    // 3. Revalidate path và trả về kết quả
    revalidatePath(path);
    return { success: true, bookmarked: isNowBookmarked };
  } catch (error) {
    console.error("Toggle bookmark database error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown database error occurred." };
  }
}
