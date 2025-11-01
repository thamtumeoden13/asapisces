"use server";

import { auth } from "@/auth";
import { supabase } from "../supabase/server";
import { CreateCompanion, GetAllCompanions } from "@/types";

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
  limit = 8,
  page = 1,
  subject,
  topic,
}: GetAllCompanions & { userId?: string }) => {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Bắt đầu xây dựng query với Supabase client
    let query = supabase
      .from("companions")
      .select(
        `
      *, 
      bookmarks(id), 
      transcript:transcripts(data)
    `,
        { count: "exact" } // Yêu cầu Supabase đếm tổng số bản ghi phù hợp
      )
      // --- KẾT THÚC SỬA ĐỔI ---
      .range((page - 1) * limit, page * limit - 1);

    // Các điều kiện lọc giữ nguyên
    // if (subject && topic) {
    //   query = query
    //     .ilike("subject", `%${subject}%`)
    //     .or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    // } else if (subject) {
    //   query = query.ilike("subject", `%${subject}%`);
    // } else if (topic) {
    //   query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    // }

    if (subject) query = query.ilike("subject", `%${subject}%`);
    if (topic) query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);

    // Sắp xếp và phân trang
    query = query.order("created_at", { ascending: false }).range(from, to);

    // Lưu ý: Lọc bookmark như thế này có thể không hoạt động như mong đợi
    // Cách tốt hơn là kiểm tra sau khi lấy dữ liệu hoặc dùng một query phức tạp hơn.
    // if (userId) {
    //   query = query.eq("bookmarks.user_id", userId);
    // }

    // Thực thi query
    const { data, error, count } = await query;
    if (error) {
      console.error("Supabase error fetching all companions:", error);
      throw new Error(error.message);
    }

    // Biến đổi dữ liệu trả về
    const companions = data.map((companion) => ({
      ...companion,
      // Gộp transcript_data vào
      transcript_data: (companion.transcript as any)?.data || null,
      // Xóa thuộc tính `transcript` lồng nhau
      transcript: undefined,
      // Tính toán `bookmarked`
      bookmarked: companion.bookmarks && companion.bookmarks.length > 0,
    }));

    // --- CẤU TRÚC TRẢ VỀ MỚI ---
    return {
      companions: companions,
      // Kiểm tra xem có trang tiếp theo không
      hasNextPage: to < (count ?? 0) - 1,
    };
  } catch (error) {
    console.error("Error in getAllCompanions:", error);
    // Trả về giá trị mặc định an toàn nếu có lỗi
    return { companions: [], hasNextPage: false };
  }
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

export async function getNewestCompanionsAction(limit: number = 5) {
  const { data, error } = await supabase
    .from("companions")
    .select(
      `
      *, 
      bookmarks(id)
      `,
      { count: "exact" } // Yêu cầu Supabase đếm tổng số bản ghi phù hợp
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const companions = data.map((companion) => ({
    ...companion,
    // Tính toán `bookmarked`
    bookmarked: companion.bookmarks && companion.bookmarks.length > 0,
  }));
  return companions;
}

export async function getPopularCompanionsAction(
  limit: number = 5,
  timeframe: "week" | "all" = "week"
) {
  try {
    // 2. Gọi hàm PostgreSQL qua RPC
    const { data: companions, error } = await supabase.rpc(
      "get_popular_companions",
      {
        p_limit: limit,
        p_timeframe: timeframe,
      }
    );

    // 3. Xử lý lỗi
    if (error) {
      console.error("RPC Error fetching popular companions:", error);
      throw error;
    }

    // 4. Trả về dữ liệu
    // Dữ liệu trả về đã có định dạng đúng, không cần xử lý thêm
    return companions || [];
  } catch (error) {
    console.error("Error in getPopularCompanionsAction:", error);
    return [];
  }
}
