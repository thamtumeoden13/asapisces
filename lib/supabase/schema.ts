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
    // id uuid not null default gen_random_uuid ()
    // constraint companions_pkey primary key (id)
    id: uuid("id").primaryKey().defaultRandom(),

    // created_at timestamp with time zone not null default now()
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // name character varying null
    name: varchar("name"),

    // subject character varying null
    subject: varchar("subject"),

    // topic character varying null
    topic: varchar("topic"),

    // style character varying null
    style: varchar("style"),

    // voice character varying null
    voice: varchar("voice"),

    // duration bigint null
    // Chú ý: bigint trong JS được biểu diễn bằng string, nên ta dùng { mode: "string" }
    duration: bigint("duration", { mode: "string" }),

    // author character varying null
    author: varchar("author"),

    // type character varying(50) null default 'general'::character varying
    type: varchar("type", { length: 50 }).default("general"),

    // transcript_data jsonb null
    transcriptData: jsonb("transcript_data"),
  },
  (table) => {
    // Định nghĩa các index bên trong một callback function
    return {
      // create index IF not exists idx_companions_type ...
      typeIndex: index("idx_companions_type").on(table.type),

      // create index IF not exists idx_companions_author_type ...
      authorTypeIndex: index("idx_companions_author_type").on(
        table.author,
        table.type
      ),
    };
  }
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
