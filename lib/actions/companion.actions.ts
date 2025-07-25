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
  let query = supabase
    .from("companions")
    .select("*, bookmarks:bookmarks(id)")
    .range((page - 1) * limit, page * limit - 1);

  if (subject && topic) {
    query = query
      .ilike("subject", `%${subject}%`)
      .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  } else if (subject) {
    query = query.ilike("subject", `%${subject}%`);
  } else if (topic) {
    query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
  }

  if (userId) {
    query = query.eq("bookmarks.user_id", userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data.map((companion) => ({
    ...companion,
    bookmarked: companion.bookmarks && companion.bookmarks.length > 0,
  }));
};

// Get One
export const getCompanion = async (id: string) => {
  const { data, error } = await supabase
    .from("companions")
    .select()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return data?.[0];
};

export async function getCompanionById(id: string) {
  try {
    // Sử dụng Drizzle query với "with" để lấy dữ liệu liên quan
    // const companion = await db.query.companions.findFirst({
    //   where: eq(companions.id, id),
    //   // "with" sẽ tự động JOIN và lồng dữ liệu từ bảng 'transcripts'
    //   with: {
    //     transcript: true, // Lấy toàn bộ dữ liệu từ transcript liên quan
    //   },
    // });

    const companion = await supabase.from("companions")
      // .select(`*, transcript:data(transcripts)`)
      // .select(`companions:companion_id (*)`)
      .select()
      .eq("id", id)
      .single();

    if (companion.error) {
      console.error("Error fetching companion by ID:", companion.error);
      return null;
    }
    if (!companion.data) {
      console.warn("No companion found with ID:", id);
      return null;
    }
    console.log("Fetched companion:", companion.data);
    // Trả về companion với transcript_data được gộp vào
    
    // --- Biến đổi dữ liệu để khớp với cấu trúc frontend mong đợi ---
    // Gộp dữ liệu từ hai bảng lại thành một object duy nhất
    const result = {
      ...companion.data, // Lấy các trường name, subject, topic, ...
      // Gộp transcript_data vào cấp cao nhất
      transcript_data: companion.data.transcript_data,
      // Xóa các thuộc tính không cần thiết để tránh nhầm lẫn
      transcript: undefined,
      transcriptId: undefined,
    };

    // Xóa các thuộc tính không cần thiết khỏi object cuối cùng
    delete result.transcript;
    delete result.transcriptId;

    return result;
  } catch (error) {
    console.error("Error fetching companion by ID:", error);
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
