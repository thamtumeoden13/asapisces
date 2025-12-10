import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
  index,
  varchar,
  bigint,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // uuid, khớp với database
  providerId: text("provider_id"),
  provider: text("provider"),
  name: text("name"),
  username: text("username"),
  email: text("email"),
  image: text("image"),
  bio: text("bio"),
  role: text("role").default("viewer"), // viewer, pro, admin
  createdAt: timestamp("created_at").defaultNow(),
  credits: bigint("credits", { mode: "bigint" }).default(BigInt(1000)),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role"),
  type: text("type"),
  level: text("level"),
  techstack: text("techstack").array(),
  questions: text("questions").array(),
  cover_image: text("cover_image"),
  created_at: timestamp("created_at", { withTimezone: true }),
  finalized: boolean("finalized"),
  user_id: text("user_id"),
});

export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  interview_id: text("interview_id"),
  user_id: text("user_id"),
  total_score: integer("total_score"),
  final_assessment: text("final_assessment"),
  strengths: text("strengths").array(), // nếu có
  areas_for_improvement: text("areas_for_improvement").array(), // nếu có
  created_at: timestamp("created_at", { withTimezone: true }),
});

export const feedbackCategoryScores = pgTable("feedback_category_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  feedback_id: text("feedback_id")
    .notNull()
    .references(() => feedbacks.id),
  name: text("name"),
  score: integer("score"),
  comment: text("comment"),
});

export const companions = pgTable(
  "companions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    name: varchar("name"),

    subject: varchar("subject"),

    topic: varchar("topic"),

    style: varchar("style"),

    voice: varchar("voice"),

    duration: bigint("duration", { mode: "bigint" }),

    author: uuid("author").references(() => users.id, { onDelete: "set null" }),

    type: varchar("type", { length: 50 }).default("general"),

    transcriptId: uuid("transcript_id").references(() => transcripts.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    coverImage: text("cover_image"),
    isPublic: boolean("is_public").notNull().default(false),
  },
  (t) => [
    index("idx_companions_type").on(t.type),

    index("idx_companions_author_type").on(t.author, t.type),
  ]
  // (table) => {
  //   // Định nghĩa các index bên trong một callback function
  //   return {
  //     // create index IF not exists idx_companions_type ...
  //     typeIndex: index("idx_companions_type").on(table.type),

  //     // create index IF not exists idx_companions_author_type ...
  //     authorTypeIndex: index("idx_companions_author_type").on(
  //       table.author,
  //       table.type
  //     ),
  //   };
  // }
);

export const conversationFeedbacks = pgTable("conversation_feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Liên kết đến bảng 'users' ở trên
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Liên kết đến bảng 'companions'
  companionId: uuid("companion_id")
    .notNull()
    .references(() => companions.id, { onDelete: "cascade" }),

  topicId: text("topic_id").notNull(),
  totalScore: integer("total_score").notNull(),
  categoryScores: jsonb("category_scores").notNull(),
  strengths: jsonb("strengths").notNull(),
  areasForImprovement: jsonb("areas_for_improvement").notNull(),
  finalAssessment: text("final_assessment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const sessionHistory = pgTable("session_history", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Liên kết đến người dùng đã bắt đầu phiên
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Liên kết đến companion đã được sử dụng
  companionId: uuid("companion_id")
    .notNull()
    .references(() => companions.id, { onDelete: "cascade" }),

  // Tự động ghi lại thời điểm bắt đầu phiên
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Dùng jsonb để lưu toàn bộ object transcript_data
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const companionsRelations = relations(companions, ({ one }) => ({
  // Một companion có MỘT transcript
  transcript: one(transcripts, {
    fields: [companions.transcriptId], // Cột khóa ngoại trong bảng `companions`
    references: [transcripts.id], // Cột khóa chính trong bảng `transcripts`
  }),
}));

// (Tùy chọn) Định nghĩa quan hệ ngược lại từ `transcripts` đến `companions`
export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  // Một transcript thuộc về MỘT companion
  companion: one(companions, {
    fields: [transcripts.id],
    references: [companions.transcriptId],
  }),
}));

export const cachedAudios = pgTable("cached_audios", {
  id: uuid("id").primaryKey().defaultRandom(),
  textHash: varchar("text_hash").unique().notNull(), // unique key with hash SHA-256 of text
  voiceId: varchar("voice_id").notNull(),
  audioUrl: text("audio_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cachedAudiosRelations = relations(cachedAudios, ({}) => ({}));
