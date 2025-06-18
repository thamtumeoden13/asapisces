import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
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
  feedback_id: text("feedback_id").notNull().references(() => feedbacks.id),
  name: text("name"),
  score: integer("score"),
  comment: text("comment"),
});