"use server";

import { auth } from "@/auth";
// import { auth } from "@clerk/nextjs/server"
// import { createSupabaseClient } from "@/lib/supabase"
import { supabase } from "../supabase/server";
import { CreateTranscriptCompanion } from "@/components/companion/transcript-save-form";

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
