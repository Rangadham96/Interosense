import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { users, exerciseSessions, dailyCheckins, assessments, passwordResetTokens, dailyInsights, type User, type InsertUser } from "../shared/schema";

export type ExerciseSession = typeof exerciseSessions.$inferSelect;
export type DailyCheckin = typeof dailyCheckins.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
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

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
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
}

export const storage = new DatabaseStorage();

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

export async function getTodayInsight(userId: string, generatedDate: string): Promise<DailyInsight | undefined> {
  const [insight] = await db
    .select()
    .from(dailyInsights)
    .where(and(eq(dailyInsights.userId, userId), eq(dailyInsights.generatedDate, generatedDate)));
  return insight;
}

export async function saveInsight(userId: string, insightText: string, generatedDate: string): Promise<DailyInsight> {
  const [insight] = await db
    .insert(dailyInsights)
    .values({ userId, insightText, generatedDate })
    .returning();
  return insight;
}
