import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.SUPABASE_DB_URL!, {
  ssl: "require",
});

export const db = drizzle(client);
export * from "./schema";
export * from "./server";

