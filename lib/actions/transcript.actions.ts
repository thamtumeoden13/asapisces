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
import { upsertCompanionSchema } from "../zodSchema";

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

export type UpsertCompanionData = z.infer<typeof upsertCompanionSchema>;

export async function upsertTranscriptCompanion(data: UpsertCompanionData) {
  const session = await auth();
  const userId = session?.user?.id;
  console.log("User ID from session:", userId);
  if (!userId) throw new Error("Unauthorized");

  const validation = upsertCompanionSchema.safeParse(data);
  if (!validation.success) throw new Error("Invalid data provided.");

  const {
    id,
    name,
    subject,
    topic,
    voice,
    style,
    duration,
    description,
    coverImage,
    isPublic,
    transcriptData,
  } = validation.data;

  console.log("Upserting companion with data:", validation.data);

  const companionIdToSend = id || null;
  try {
    // Gọi hàm PostgreSQL qua Supabase RPC
    const { data: companionId, error } = await supabase.rpc(
      "upsert_companion_with_transcript",
      {
        p_companion_id: companionIdToSend,
        p_user_id: userId,
        p_name: name,
        p_subject: subject,
        p_topic: topic,
        p_voice: voice,
        p_style: style,
        p_duration: duration,
        p_description: description,
        p_cover_image: coverImage,
        p_is_public: isPublic,
        p_transcript_data: transcriptData,
      }
    );

    if (error) {
      // Ném lỗi từ PostgreSQL để client có thể bắt
      console.error("RPC Error:", error);
      throw new Error(error.message);
    }

    if (!companionId) {
      throw new Error("Database function did not return a companion ID.");
    }

    // Xóa cache
    revalidatePath("/companion-library");
    revalidatePath("/community");

    // Redirect sau khi thành công
    if (companionId) {
      revalidatePath(`companion-library/conversation/${companionId}`);
    }

    return { success: true, companionId: companionId };
  } catch (error) {
    console.error("Upsert companion failed:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred." };
  }
}
