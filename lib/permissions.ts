// File: lib/permissions.ts
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS, USER_ROLES } from "@/constants";

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * Lấy vai trò của người dùng hiện tại từ database.
 * @returns {Promise<UserRole | null>} Vai trò của người dùng hoặc null.
 */
async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    console.log("Fetched user role data:", data, "error:", error);

    if (error || !data) return null;

    return data.role as UserRole;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem người dùng hiện tại có quyền không giới hạn credit hay không.
 * @returns {Promise<boolean>} Trả về true nếu người dùng có quyền, ngược lại false.
 */
export async function hasUnlimitedCredits(): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  console.log("User role:", userRole);
  if (!userRole) return false;

  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions?.UNLIMITED_CREDITS === true;
}
