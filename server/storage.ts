import { eq, desc, and, gte } from "drizzle-orm";
import { db } from "./db";
import { users, exerciseSessions, dailyCheckins, assessments, passwordResetTokens, dailyInsights, type User, type InsertUser } from "../shared/schema";

export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: Partial<User> & { email: string }): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByRazorpayCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.razorpayCustomerId, customerId));
    return user;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
    return user;
  }

  async createUser(userData: Partial<User> & { email: string }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();

export async function getUserPreferences(userId: string): Promise<Record<string, unknown> | null> {
  const [row] = await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, userId));
  return row?.preferences ?? null;
}

export async function setUserPreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
  await db.update(users).set({ preferences, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function createSession(data: Omit<ExerciseSession, "createdAt">): Promise<ExerciseSession> {
  const [session] = await db.insert(exerciseSessions).values(data).returning();
  return session;
}

export async function getUserSessions(userId: string): Promise<ExerciseSession[]> {
  return db.select().from(exerciseSessions).where(eq(exerciseSessions.userId, userId)).orderBy(desc(exerciseSessions.completedAt));
}

export async function createCheckin(data: Omit<DailyCheckin, "createdAt">): Promise<DailyCheckin> {
  const [checkin] = await db.insert(dailyCheckins).values(data).returning();
  return checkin;
}

export async function getUserCheckins(userId: string): Promise<DailyCheckin[]> {
  return db.select().from(dailyCheckins).where(eq(dailyCheckins.userId, userId)).orderBy(desc(dailyCheckins.date));
}

export async function createAssessment(data: Omit<Assessment, "createdAt">): Promise<Assessment> {
  const [assessment] = await db.insert(assessments).values(data).returning();
  return assessment;
}

export async function getUserAssessments(userId: string): Promise<Assessment[]> {
  return db.select().from(assessments).where(eq(assessments.userId, userId)).orderBy(desc(assessments.completedAt));
}

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export async function createResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
  const [record] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
  return record;
}

export async function getResetToken(token: string): Promise<PasswordResetToken | undefined> {
  const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  return record;
}

export async function markTokenUsed(id: string): Promise<void> {
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
}

export type DailyInsight = typeof dailyInsights.$inferSelect;

export async function getTodayInsight(
  userId: string,
  generatedDate: string,
  currentlyHasWearableContext: boolean = false,
): Promise<DailyInsight | undefined> {
  if (currentlyHasWearableContext) {
    // Wearable data is present: only serve a wearable-enriched insight.
    // A plain cached insight (hasWearableContext=false) is intentionally ignored so
    // that the richer wearable insight is generated and stored.
    const [insight] = await db
      .select()
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.userId, userId),
          eq(dailyInsights.generatedDate, generatedDate),
          eq(dailyInsights.hasWearableContext, true),
        ),
      );
    return insight;
  } else {
    // Wearable data is absent: serve any cached insight for today.
    // If a wearable-enriched insight was cached earlier in the day and the health
    // connection since dropped, we prefer to return that richer cached insight
    // rather than generating and persisting a second, stale plain insight.
    // ORDER BY has_wearable_context DESC gives priority to true > false.
    const insights = await db
      .select()
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.userId, userId),
          eq(dailyInsights.generatedDate, generatedDate),
        ),
      );
    if (insights.length === 0) return undefined;
    // Prefer wearable insight if present, otherwise fall back to plain insight
    return insights.find(i => i.hasWearableContext) ?? insights[0];
  }
}

export async function saveInsight(
  userId: string,
  insightText: string,
  generatedDate: string,
  hasWearableContext: boolean = false,
): Promise<DailyInsight> {
  const [insight] = await db
    .insert(dailyInsights)
    .values({ userId, insightText, generatedDate, hasWearableContext })
    .onConflictDoUpdate({
      target: [dailyInsights.userId, dailyInsights.generatedDate, dailyInsights.hasWearableContext],
      set: { insightText },
    })
    .returning();
  return insight;
}

// 5-minute in-memory cache for exercise practice counts.
// Prevents the badge from flickering around UTC midnight when the
// sevenDaysAgo boundary shifts, and keeps counts stable within a session.
const PRACTICE_COUNTS_TTL_MS = 5 * 60 * 1000;
let practiceCountsCache: { counts: Record<string, number>; expiresAt: number } | null = null;

export async function getExercisePracticeCounts(): Promise<Record<string, number>> {
  const now = Date.now();
  if (practiceCountsCache && now < practiceCountsCache.expiresAt) {
    return practiceCountsCache.counts;
  }

  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await db
    .select({ exerciseId: exerciseSessions.exerciseId })
    .from(exerciseSessions)
    .where(gte(exerciseSessions.completedAt, sevenDaysAgo));

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.exerciseId] = (counts[row.exerciseId] || 0) + 1;
  }

  practiceCountsCache = { counts, expiresAt: now + PRACTICE_COUNTS_TTL_MS };
  return counts;
}
