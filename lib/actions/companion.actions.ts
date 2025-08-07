"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { supabase } from "../supabase/server";
import { CreateCompanion, GetAllCompanions } from "@/types";
import { companions, db } from "../supabase";
import { eq } from "drizzle-orm";

// Create
export const createCompanion = async (formData: CreateCompanion) => {
  const session = await auth();
  const author = session?.user?.id;
  if (!author) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("companions")
    .insert({ ...formData, author })
    .select();

  if (error || !data) throw new Error(error?.message || "Failed to create");

  return data[0];
};

// Get All
export const getAllCompanions = async ({
  limit = 10,
  page = 1,
  subject,
  topic,
  userId,
}: GetAllCompanions & { userId?: string }) => {
  // Bắt đầu xây dựng query với Supabase client
  let query = supabase
    .from("companions")
    // --- SỬA ĐỔI CHUỖI SELECT Ở ĐÂY ---
    .select(
      `
      *, 
      bookmarks(id), 
      transcript:transcripts(data)
    `
    )
    // --- KẾT THÚC SỬA ĐỔI ---
    .range((page - 1) * limit, page * limit - 1);

  // Các điều kiện lọc giữ nguyên
  if (subject && topic) {
    query = query
      .ilike("subject", `%${subject}%`)
      .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  } else if (subject) {
    query = query.ilike("subject", `%${subject}%`);
  } else if (topic) {
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  }

  // Lưu ý: Lọc bookmark như thế này có thể không hoạt động như mong đợi
  // Cách tốt hơn là kiểm tra sau khi lấy dữ liệu hoặc dùng một query phức tạp hơn.
  // if (userId) {
  //   query = query.eq("bookmarks.user_id", userId);
  // }

  // Thực thi query
  const { data, error } = await query;
  if (error) {
    console.error("Supabase error fetching all companions:", error);
    throw new Error(error.message);
  }

  // Biến đổi dữ liệu trả về
  return data.map((companion) => ({
    ...companion,
    // Gộp transcript_data vào
    transcript_data: (companion.transcript as any)?.data || null,
    // Xóa thuộc tính `transcript` lồng nhau
    transcript: undefined,
    // Tính toán `bookmarked`
    bookmarked: companion.bookmarks && companion.bookmarks.length > 0,
  }));
};

export async function getCompanionById(id: string) {
  try {
    const { data: companion, error } = await supabase
      .from("companions")
      // --- SỬA ĐỔI CHUỖI SELECT Ở ĐÂY ---
      // Cú pháp: *, tên_bảng_liên_quan(các_cột_cần_lấy)
      .select(
        `
        *, 
        transcript:transcripts(data) 
      `
      )
      // --- KẾT THÚC SỬA ĐỔI ---
      .eq("id", id)
      .single(); // Dùng .single() để Supabase trả về một object thay vì một mảng

    if (error) {
      console.error("Supabase error fetching companion by ID:", error);
      return null;
    }

    if (!companion) {
      return null;
    }

    // --- Biến đổi dữ liệu để khớp với cấu trúc frontend mong đợi ---
    // `companion` giờ sẽ có dạng: { ..., transcript: { data: { ... } } }

    const result = {
      ...companion,
      // Gộp transcript.data vào cấp cao nhất dưới tên `transcript_data`
      transcript_data: (companion.transcript as any)?.data || null,
    };

    // Xóa thuộc tính `transcript` lồng nhau để làm sạch object
    delete (result as any).transcript;

    return result;
  } catch (error) {
    console.error("Error in getCompanionById:", error);
    return null;
  }
}

// Session History
export const addToSessionHistory = async (companionId: string) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const { data, error } = await supabase.from("session_history").insert({
    companion_id: companionId,
    user_id: userId,
  });

  if (error) throw new Error(error.message);
  return data;
};

export const getRecentSessions = async (limit = 10) => {
  const { data, error } = await supabase
    .from("session_history")
    .select(`companions:companion_id (*)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data.map(({ companions }) => companions);
};

export const getUserSessions = async (userId: string, limit = 10) => {
  const { data, error } = await supabase
    .from("session_history")
    .select(`companions:companion_id (*)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data.map(({ companions }) => companions);
};

// My Companions
export const getUserCompanions = async (userId: string) => {
  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("author", userId);

  if (error) throw new Error(error.message);
  return data;
};

// Limit by plan
export const newCompanionPermissions = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  // You need to manually implement this plan/feature logic in your user DB
  // Here, we assume viewer is limited to 3 companions
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  const role = user?.role || "viewer";
  const limit = role === "pro" ? Infinity : role === "10_limit" ? 10 : 3;

  const { data } = await supabase
    .from("companions")
    .select("id", { count: "exact" })
    .eq("author", userId);

  const companionCount = data?.length ?? 0;
  return companionCount < limit;
};

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
  if (!userId) return;

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
