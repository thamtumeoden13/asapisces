"use server";

import { auth } from "@/auth";
// import { auth } from "@clerk/nextjs/server"
// import { createSupabaseClient } from "@/lib/supabase"
import { supabase } from "../supabase/server";
import { CreateTranscriptCompanion } from "@/components/companion/transcript-save-form";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { companions, db, transcripts } from "../supabase";
import { eq } from "drizzle-orm";
import { upsertCompanionSchema } from "@/constants";

export const createTranscriptCompanion = async (
  formData: CreateTranscriptCompanion
) => {
  const session = await auth();
  const author = session?.user?.id;

  if (!author) {
    throw new Error("User not authenticated");
  }

  //   const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from("companions")
    .insert({
      ...formData,
      author,
      type: "transcript", // Add type to distinguish from other companions
    })
    .select();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create transcript companion");
  }

  return data[0];
};

// Get transcript companions for current user
export const getTranscriptCompanions = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  //   const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("author", userId)
    .eq("type", "transcript")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

// Get specific transcript companion
export const getTranscriptCompanion = async (id: string) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  //   const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("id", id)
    .eq("author", userId)
    .eq("type", "transcript")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// --- Định nghĩa Schema để xác thực dữ liệu ---
// export const upsertTranscriptCompanionSchema = z.object({
//   id: z.string().uuid().optional().nullable(),
//   name: z.string().min(1, { message: "Name is required." }),
//   subject: z.string().min(1, { message: "Subject is required." }),
//   topic: z.string().min(1, { message: "Topic is required." }),
//   voice: z.string().min(1, { message: "Voice is required." }),
//   style: z.string().min(1, { message: "Style is required." }),
//   duration: z.coerce.number().min(1, { message: "Duration is required." }),
//   transcript_data: z.any(), // Giữ nguyên
// });

// export type UpsertTranscriptCompanion = z.infer<
//   typeof upsertTranscriptCompanionSchema
// >;

export type UpsertCompanionData = z.infer<typeof upsertCompanionSchema>;

// --- SERVER ACTION ĐÃ NÂNG CẤP VỚI TRANSACTION ---
export const upsertTranscriptCompanion = async (data: UpsertCompanionData) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const validation = upsertCompanionSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid data provided.");

  const {
    id: companionId,
    transcriptData,
    ...companionCoreData
  } = validation.data;

  console.log("Upserting companion with data:", {
    companionId,
    transcriptData,
    companionCoreData,
  }); 

  try {
    // Sử dụng Drizzle transaction để đảm bảo tính toàn vẹn dữ liệu
    const savedCompanion = await db.transaction(async (tx) => {
      let finalCompanionId: string;

      if (companionId) {
        // --- Chế độ UPDATE ---
        console.log(`Updating companion and transcript for ID: ${companionId}`);

        // 1. Lấy thông tin companion hiện tại để có transcript_id
        const existingCompanion = await tx.query.companions.findFirst({
          where: eq(companions.id, companionId),
          columns: { transcriptId: true },
        });

        if (!existingCompanion || !existingCompanion.transcriptId) {
          throw new Error("Companion or associated transcript not found.");
        }

        // 2. Cập nhật bản ghi trong bảng transcripts
        await tx
          .update(transcripts)
          .set({ data: transcriptData })
          .where(eq(transcripts.id, existingCompanion.transcriptId));

        // 3. Cập nhật bản ghi trong bảng companions
        await tx
          .update(companions)
          .set(companionCoreData)
          .where(eq(companions.id, companionId));

        finalCompanionId = companionId;
      } else {
        // --- Chế độ INSERT ---
        console.log("Creating new companion and transcript...");

        // 1. Chèn vào bảng transcripts trước để lấy ID
        const newTranscript = await tx
          .insert(transcripts)
          .values({ data: transcriptData })
          .returning({ id: transcripts.id });

        const newTranscriptId = newTranscript[0]?.id;
        if (!newTranscriptId)
          throw new Error("Failed to create transcript record.");

        // 2. Chèn vào bảng companions với transcript_id vừa tạo
        const newCompanion = await tx
          .insert(companions)
          .values({
            ...companionCoreData,
            transcriptId: newTranscriptId,
            author: userId,
            type: "transcript",
          })
          .returning({ id: companions.id });

        finalCompanionId = newCompanion[0]?.id;
        if (!finalCompanionId)
          throw new Error("Failed to create companion record.");
      }

      return { id: finalCompanionId }; // Trả về ID để redirect
    });

    if (!savedCompanion?.id) {
      throw new Error("Transaction failed to return a companion ID.");
    }

    // Xóa cache và điều hướng
    revalidatePath("/companions");
    revalidatePath(`/companions/${savedCompanion.id}`);
    redirect(`/companions/${savedCompanion.id}`);
  } catch (error) {
    console.error("Upsert companion failed:", error);
    // Trả về một object lỗi để form có thể bắt và hiển thị
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
};

export async function upsertTranscriptCompanion2(data: UpsertCompanionData) {
  const session = await auth();
  const userId = session?.user?.id;
  console.log("User ID from session:", userId);
  if (!userId) throw new Error("Unauthorized");

  const validation = upsertCompanionSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid data provided.");

  const { id, name, subject, topic, voice, style, duration, transcriptData } = validation.data;

  console.log("Upserting companion with data:", validation.data)

  const companionIdToSend = id || null;
  try {
    // Gọi hàm PostgreSQL qua Supabase RPC
    const { data: companionId, error } = await supabase.rpc('upsert_companion_with_transcript', {
      p_companion_id: companionIdToSend,
      p_user_id: userId,
      p_name: name,
      p_subject: subject,
      p_topic: topic,
      p_voice: voice,
      p_style: style,
      p_duration: duration,
      p_transcript_data: transcriptData
    });

    if (error) {
      // Ném lỗi từ PostgreSQL để client có thể bắt
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    if (!companionId) {
      throw new Error("Database function did not return a companion ID.");
    }
    
    // Xóa cache
    revalidatePath("/companion/companions");
    
    // Redirect sau khi thành công
    
    return { success: true, companionId: companionId };
    
  } catch (error) {
    console.error("Upsert companion failed:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}