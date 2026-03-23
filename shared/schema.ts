import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  provider: text("provider").default("email"),
  providerId: text("provider_id"),
  profileImage: text("profile_image"),
  conditions: jsonb("conditions").$type<string[]>().default([]),
  experienceLevel: text("experience_level").default("beginner"),
  goals: jsonb("goals").$type<string[]>().default([]),
  dailyMinutes: text("daily_minutes").default("10"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  bio: text("bio"),
  isPremium: boolean("is_premium").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  interoceptiveBaseline: jsonb("interoceptive_baseline").$type<Record<string, string>>().default({}),
  onboardingPlan: jsonb("onboarding_plan").$type<Record<string, unknown>[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exerciseSessions = pgTable("exercise_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  exerciseTitle: text("exercise_title").notNull(),
  category: text("category").notNull(),
  completedAt: text("completed_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  rating: integer("rating").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyCheckins = pgTable("daily_checkins", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  awarenessScore: integer("awareness_score").notNull().default(5),
  energyLevel: integer("energy_level").notNull().default(5),
  sleepQuality: integer("sleep_quality").notNull().default(5),
  stressLevel: integer("stress_level").notNull().default(5),
  mood: text("mood").notNull().default(""),
  sensations: jsonb("sensations").$type<string[]>().notNull().default([]),
  bodyAreas: jsonb("body_areas").$type<string[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scaleId: text("scale_id").notNull(),
  scaleName: text("scale_name").notNull(),
  completedAt: text("completed_at").notNull(),
  totalScore: integer("total_score").notNull().default(0),
  severity: text("severity").notNull().default(""),
  answers: jsonb("answers").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
});

export const dailyInsights = pgTable("daily_insights", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightText: text("insight_text").notNull(),
  generatedDate: text("generated_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
