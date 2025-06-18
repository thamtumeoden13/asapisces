import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase/server";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHubProvider, GoogleProvider],
  callbacks: {
    async signIn({ user, account, profile }) {
      const providerId =
        account.provider === "github" ? profile.id : profile.sub;

      // Kiểm tra user đã tồn tại chưa
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("provider_id", String(providerId))
        .single();

      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert({
          provider_id: String(providerId),
          name: user.name,
          email: user.email,
          username: account.provider === "github" ? profile.login : user.email,
          image: user.image,
          bio: account.provider === "github" ? profile.bio || "" : "",
          role: "viewer",
          provider: account.provider,
        });

        if (insertError) {
          console.error("Failed to insert user:", insertError);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        const providerId =
          account.provider === "github" ? profile.id : profile.sub;

        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("provider_id", String(providerId))
          .single();

        if (user) {
          token.id = user.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session && token?.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
