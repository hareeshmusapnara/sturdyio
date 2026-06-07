import {
  pgTable, text, integer, boolean, timestamp, jsonb, serial, varchar, real,
} from "drizzle-orm/pg-core";

// ── Users ─────────────────────────────────────────────────────────────────────
// Populated automatically on first NextAuth sign-in via the DB callbacks
export const users = pgTable("users", {
  id: text("id").primaryKey(),          // NextAuth provider sub
  name: text("name"),
  email: text("email").notNull().unique(),
  image: text("image"),
  provider: varchar("provider", { length: 32 }).default("google"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login").defaultNow().notNull(),
});

// ── Resume Analyses ───────────────────────────────────────────────────────────
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").default("resume.txt"),
  // Scores
  overallScore: integer("overall_score").notNull(),
  atsScore: integer("ats_score").notNull(),
  contentScore: integer("content_score").notNull(),
  keywordScore: integer("keyword_score").notNull(),
  formatScore: integer("format_score").notNull(),
  // Detected metadata
  industry: varchar("industry", { length: 64 }),
  experienceLevel: varchar("experience_level", { length: 32 }),
  // Raw parsed data stored as JSON
  parsedResume: jsonb("parsed_resume"),
  aiSuggestions: jsonb("ai_suggestions"),   // string[]
  interviewQuestions: jsonb("interview_questions"), // string[]
  jobDescription: text("job_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Resume Optimizations ──────────────────────────────────────────────────────
export const optimizations = pgTable("optimizations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  analysisId: integer("analysis_id").references(() => analyses.id, { onDelete: "set null" }),
  originalResume: text("original_resume").notNull(),
  optimizedResume: text("optimized_resume").notNull(),
  jobDescription: text("job_description").notNull(),
  // Score delta
  scoreBefore: integer("score_before").notNull(),
  scoreAfter: integer("score_after").notNull(),
  keywordsFound: jsonb("keywords_found"),    // string[]
  improvements: jsonb("improvements"),      // string[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Cover Letters ─────────────────────────────────────────────────────────────
export const coverLetters = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  analysisId: integer("analysis_id").references(() => analyses.id, { onDelete: "set null" }),
  coverLetter: text("cover_letter").notNull(),
  jobDescription: text("job_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Page Analytics ────────────────────────────────────────────────────────────
// Replaces the file-based .analytics.json
export const pageHits = pgTable("page_hits", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 256 }).notNull(),
  ts: timestamp("ts").defaultNow().notNull(),
  ipHash: varchar("ip_hash", { length: 16 }),
  ref: text("ref"),
  ua: text("ua"),
  device: varchar("device", { length: 16 }),   // mobile | tablet | desktop
  browser: varchar("browser", { length: 32 }),
});

// ── Type exports ──────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type Optimization = typeof optimizations.$inferSelect;
export type NewOptimization = typeof optimizations.$inferInsert;
export type CoverLetter = typeof coverLetters.$inferSelect;
export type NewCoverLetter = typeof coverLetters.$inferInsert;
export type PageHit = typeof pageHits.$inferSelect;
export type NewPageHit = typeof pageHits.$inferInsert;
