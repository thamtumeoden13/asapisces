import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.SUPABASE_DB_URL!, {
  ssl: "require",
});

export const db = drizzle(client);
export * from "./schema";
export * from "./server";

// import { auth } from "@clerk/nextjs/server";
// import { createClient } from "@supabase/supabase-js";

// export const createSupabaseClient = () => {
//   return createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//         async accessToken() {
//             return ((await auth()).getToken());
//         }
//     }
//   );
// };
