"use server";

import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SESSION_DURATION = 60 * 60 * 24 * 7; // 1 week

export async function setSessionCookie(access_token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", access_token, {
    maxAge: SESSION_DURATION,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function signUp(params: SignUpParams) {
  const { email, name, password } = params;

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
    });

    if (error) throw error;

    await supabase.from("users").insert({
      id: data.user?.id,
      email,
      name,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: string }).message === "string" &&
      (error as { message: string }).message.includes("already registered")
    ) {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create account. Please try again.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, password } = params;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return {
        success: false,
        message: "Invalid credentials. Please try again.",
      };
    }

    await setSessionCookie(data.session.access_token);
    return {
      success: true,
      message: "Logged in successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to log into account. Please try again.",
    };
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getCurrentUser(): Promise<User | null> {
  // // Lấy user đang đăng nhập
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  const session = await auth();

  console.log("getCurrentUser", session);

  if (!session) return null;

  // Lấy thông tin user từ bảng "users" trong Supabase
  const { data: dbUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!dbUser || error) return null;

  return {
    ...dbUser,
  } as User;
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}
