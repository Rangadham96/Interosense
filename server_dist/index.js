var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// constants/clinical-scales.ts
var MAIA2_REQUIRED_SUBSCALE_KEYS = [
  "noticing",
  "notDistracting",
  "notWorrying",
  "attentionRegulation",
  "emotionalAwareness",
  "selfRegulation",
  "bodyListening",
  "trusting"
];

// server/routes.ts
import { createServer } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import * as fs from "fs";
import * as path from "path";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  assessments: () => assessments,
  dailyCheckins: () => dailyCheckins,
  dailyInsights: () => dailyInsights,
  exerciseSessions: () => exerciseSessions,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  passwordResetTokens: () => passwordResetTokens,
  registerSchema: () => registerSchema,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name"),
  provider: text("provider").default("email"),
  providerId: text("provider_id"),
  profileImage: text("profile_image"),
  conditions: jsonb("conditions").$type().default([]),
  experienceLevel: text("experience_level").default("beginner"),
  goals: jsonb("goals").$type().default([]),
  dailyMinutes: text("daily_minutes").default("10"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  bio: text("bio"),
  isPremium: boolean("is_premium").default(false),
  razorpayCustomerId: text("razorpay_customer_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  interoceptiveBaseline: jsonb("interoceptive_baseline").$type().default({}),
  onboardingPlan: jsonb("onboarding_plan").$type().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var exerciseSessions = pgTable("exercise_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  exerciseTitle: text("exercise_title").notNull(),
  category: text("category").notNull(),
  completedAt: text("completed_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  rating: integer("rating").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow()
});
var dailyCheckins = pgTable("daily_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  awarenessScore: integer("awareness_score").notNull().default(5),
  energyLevel: integer("energy_level").notNull().default(5),
  sleepQuality: integer("sleep_quality").notNull().default(5),
  stressLevel: integer("stress_level").notNull().default(5),
  mood: text("mood").notNull().default(""),
  sensations: jsonb("sensations").$type().notNull().default([]),
  bodyAreas: jsonb("body_areas").$type().notNull().default([]),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow()
});
var assessments = pgTable("assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scaleId: text("scale_id").notNull(),
  scaleName: text("scale_name").notNull(),
  completedAt: text("completed_at").notNull(),
  totalScore: integer("total_score").notNull().default(0),
  severity: text("severity").notNull().default(""),
  answers: jsonb("answers").$type().notNull().default([]),
  subscaleScores: jsonb("subscale_scores").$type(),
  createdAt: timestamp("created_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false)
});
var dailyInsights = pgTable("daily_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  insightText: text("insight_text").notNull(),
  generatedDate: text("generated_date").notNull(),
  hasWearableContext: boolean("has_wearable_context").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
}, (t) => ({
  userDateWearableUnique: unique("daily_insights_user_date_wearable_unique").on(
    t.userId,
    t.generatedDate,
    t.hasWearableContext
  )
}));
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
var registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

// server/db.ts
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// server/storage.ts
import { eq, desc, and, gte } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByRazorpayCustomerId(customerId) {
    const [user] = await db.select().from(users).where(eq(users.razorpayCustomerId, customerId));
    return user;
  }
  async getUserByProviderId(provider, providerId) {
    const [user] = await db.select().from(users).where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async updateUser(id, data) {
    const [user] = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
};
var storage = new DatabaseStorage();
async function createSession(data) {
  const [session2] = await db.insert(exerciseSessions).values(data).returning();
  return session2;
}
async function getUserSessions(userId) {
  return db.select().from(exerciseSessions).where(eq(exerciseSessions.userId, userId)).orderBy(desc(exerciseSessions.completedAt));
}
async function createCheckin(data) {
  const [checkin] = await db.insert(dailyCheckins).values(data).returning();
  return checkin;
}
async function getUserCheckins(userId) {
  return db.select().from(dailyCheckins).where(eq(dailyCheckins.userId, userId)).orderBy(desc(dailyCheckins.date));
}
async function createAssessment(data) {
  const [assessment] = await db.insert(assessments).values(data).returning();
  return assessment;
}
async function getUserAssessments(userId) {
  return db.select().from(assessments).where(eq(assessments.userId, userId)).orderBy(desc(assessments.completedAt));
}
async function createResetToken(userId, token, expiresAt) {
  const [record] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
  return record;
}
async function getResetToken(token) {
  const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  return record;
}
async function markTokenUsed(id) {
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, id));
}
async function getTodayInsight(userId, generatedDate, currentlyHasWearableContext = false) {
  if (currentlyHasWearableContext) {
    const [insight] = await db.select().from(dailyInsights).where(
      and(
        eq(dailyInsights.userId, userId),
        eq(dailyInsights.generatedDate, generatedDate),
        eq(dailyInsights.hasWearableContext, true)
      )
    );
    return insight;
  } else {
    const insights = await db.select().from(dailyInsights).where(
      and(
        eq(dailyInsights.userId, userId),
        eq(dailyInsights.generatedDate, generatedDate)
      )
    );
    if (insights.length === 0) return void 0;
    return insights.find((i) => i.hasWearableContext) ?? insights[0];
  }
}
async function saveInsight(userId, insightText, generatedDate, hasWearableContext = false) {
  const [insight] = await db.insert(dailyInsights).values({ userId, insightText, generatedDate, hasWearableContext }).onConflictDoUpdate({
    target: [dailyInsights.userId, dailyInsights.generatedDate, dailyInsights.hasWearableContext],
    set: { insightText }
  }).returning();
  return insight;
}
async function getExercisePracticeCounts() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
  const rows = await db.select({ exerciseId: exerciseSessions.exerciseId }).from(exerciseSessions).where(gte(exerciseSessions.completedAt, sevenDaysAgo));
  const counts = {};
  for (const row of rows) {
    counts[row.exerciseId] = (counts[row.exerciseId] || 0) + 1;
  }
  return counts;
}

// server/auth.ts
var appleJwksCache = null;
async function fetchAppleJwks() {
  const now = Date.now();
  if (appleJwksCache && now - appleJwksCache.fetchedAt < 36e5) {
    return appleJwksCache.keys;
  }
  const res = await fetch("https://appleid.apple.com/auth/keys");
  if (!res.ok) throw new Error("Failed to fetch Apple JWKS");
  const { keys } = await res.json();
  appleJwksCache = { keys, fetchedAt: now };
  return keys;
}
async function verifyAppleToken(identityToken) {
  const parts = identityToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed Apple identity token");
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  if (header.alg !== "RS256") throw new Error("Unexpected Apple token algorithm");
  const keys = await fetchAppleJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching Apple key found for kid: " + header.kid);
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(signatureB64, "base64url");
  const valid = crypto.verify("sha256", signingInput, publicKey, signature);
  if (!valid) throw new Error("Apple token signature verification failed");
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  if (payload.iss !== "https://appleid.apple.com") {
    throw new Error("Invalid Apple token issuer");
  }
  if (Math.floor(Date.now() / 1e3) > payload.exp) {
    throw new Error("Apple token has expired");
  }
  if (!payload.sub) {
    throw new Error("Apple token missing sub claim");
  }
  const expectedAud = process.env.APPLE_APP_BUNDLE_ID || "com.interosense";
  const tokenAud = payload.aud;
  const audMatches = Array.isArray(tokenAud) ? tokenAud.includes(expectedAud) : tokenAud === expectedAud;
  if (!audMatches) {
    throw new Error(`Apple token audience mismatch: expected "${expectedAud}", got "${tokenAud}"`);
  }
  return { sub: payload.sub, email: payload.email ?? null, email_verified: payload.email_verified };
}
async function verifyGoogleToken(token, isIdToken) {
  let data;
  if (isIdToken) {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!res.ok) throw new Error("Google tokeninfo request failed");
    data = await res.json();
    if (data.error || data.error_description) throw new Error("Invalid Google id_token: " + (data.error_description || data.error));
    const expectedAud = process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (expectedAud && data.aud !== expectedAud) {
      throw new Error("Google token audience mismatch");
    }
    if (!data.email_verified || data.email_verified === "false") {
      throw new Error("Google account email is not verified");
    }
  } else {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Google userinfo request failed");
    data = await res.json();
    if (data.error) throw new Error("Invalid Google access_token: " + data.error);
    if (!data.email_verified) {
      throw new Error("Google account email is not verified");
    }
  }
  if (!data.email) throw new Error("Google token missing email claim");
  return { sub: data.sub, email: data.email.toLowerCase(), name: data.name, email_verified: data.email_verified };
}
var router = Router();
router.post("/api/auth/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, password, name } = parsed.data;
    const existing = await storage.getUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await storage.createUser({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      provider: "email"
    });
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    return res.status(201).json({ user: safeUser });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});
router.post("/api/auth/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;
    const user = await storage.getUserByEmail(email.toLowerCase());
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});
router.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
});
router.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error("Auth check error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
router.put("/api/auth/profile", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { name, conditions, experienceLevel, goals, dailyMinutes, gender, dateOfBirth, bio, profileImage, interoceptiveBaseline, onboardingPlan } = req.body;
    const user = await storage.updateUser(req.session.userId, {
      ...name !== void 0 && { name },
      ...conditions !== void 0 && { conditions },
      ...experienceLevel !== void 0 && { experienceLevel },
      ...goals !== void 0 && { goals },
      ...dailyMinutes !== void 0 && { dailyMinutes },
      ...gender !== void 0 && { gender },
      ...dateOfBirth !== void 0 && { dateOfBirth },
      ...bio !== void 0 && { bio },
      ...profileImage !== void 0 && { profileImage },
      ...interoceptiveBaseline !== void 0 && { interoceptiveBaseline },
      ...onboardingPlan !== void 0 && { onboardingPlan }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(200).json({ message: "If an account exists for that email, a reset link is on its way." });
    }
    const user = await storage.getUserByEmail(email.toLowerCase().trim());
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await createResetToken(user.id, token, expiresAt);
      const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
      const forwardedHost = req.header("x-forwarded-host") || req.get("host") || "localhost:8081";
      const resetUrl = `${forwardedProto}://${forwardedHost}/auth/reset-password?token=${token}`;
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "Interosense <noreply@interosense.app>",
              to: [user.email],
              subject: "Reset your Interosense password",
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
                  <h2 style="color: #6C63FF; margin-bottom: 16px;">Reset Your Password</h2>
                  <p style="color: #333; line-height: 1.6;">Hi ${user.name || "there"},</p>
                  <p style="color: #333; line-height: 1.6;">We received a request to reset your Interosense password. Click the button below to choose a new one. This link expires in 1 hour.</p>
                  <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 14px 28px; background: #6C63FF; color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold;">Reset Password</a>
                  <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
              `
            })
          });
          if (!response.ok) {
            console.error("Resend email failed:", await response.text());
          }
        } catch (emailErr) {
          console.error("Failed to send reset email:", emailErr);
        }
      } else {
        console.log(`[DEV] Password reset link for ${user.email}: ${resetUrl}`);
      }
    }
    return res.status(200).json({ message: "If an account exists for that email, a reset link is on its way." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(200).json({ message: "If an account exists for that email, a reset link is on its way." });
  }
});
router.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ message: "Invalid request." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    const record = await getResetToken(token);
    if (!record) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }
    if (record.used) {
      return res.status(400).json({ message: "This reset link has already been used. Please request a new one." });
    }
    if (/* @__PURE__ */ new Date() > record.expiresAt) {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await storage.updateUser(record.userId, { password: hashedPassword });
    await markTokenUsed(record.id);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});
router.post("/api/auth/social", async (req, res) => {
  try {
    const { provider, idToken, accessToken, name, email } = req.body;
    if (!provider || !idToken && !accessToken) {
      return res.status(400).json({ message: "Missing provider or token." });
    }
    let verifiedEmail = null;
    let verifiedName = name || null;
    let providerId = null;
    if (provider === "google") {
      if (!idToken && !accessToken) {
        return res.status(400).json({ message: "Google token is required." });
      }
      let claims;
      try {
        claims = await verifyGoogleToken(
          idToken || accessToken,
          !!idToken
        );
      } catch (err) {
        console.error("Google token verification failed:", err?.message);
        return res.status(401).json({ message: "Google sign-in could not be verified. Please try again." });
      }
      verifiedEmail = claims.email;
      verifiedName = claims.name || name || null;
      providerId = claims.sub;
    } else if (provider === "apple") {
      if (!idToken) {
        return res.status(400).json({ message: "Apple identity token is required." });
      }
      let claims;
      try {
        claims = await verifyAppleToken(idToken);
      } catch (err) {
        console.error("Apple token verification failed:", err?.message);
        return res.status(401).json({ message: "Apple sign-in could not be verified. Please try again." });
      }
      verifiedEmail = claims.email ?? null;
      verifiedName = name || null;
      providerId = claims.sub;
      if (!verifiedEmail) {
        const existingByProvider = await storage.getUserByProviderId("apple", providerId);
        if (!existingByProvider) {
          return res.status(400).json({ message: "Could not retrieve your Apple account. Please sign in with Apple again on your original device." });
        }
        req.session.userId = existingByProvider.id;
        const { password: _p, ...safeExisting } = existingByProvider;
        return res.status(200).json({ user: safeExisting });
      }
    } else {
      return res.status(400).json({ message: "Unsupported provider." });
    }
    if (!verifiedEmail) {
      return res.status(400).json({ message: "Could not retrieve email from provider." });
    }
    let user = await storage.getUserByEmail(verifiedEmail);
    if (user) {
      if (user.provider === "email" || !user.provider) {
        user = await storage.updateUser(user.id, { provider, providerId }) ?? user;
      }
    } else {
      user = await storage.createUser({
        email: verifiedEmail,
        password: null,
        name: verifiedName,
        provider,
        providerId
      });
    }
    req.session.userId = user.id;
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    console.error("Social auth error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});
router.post("/api/auth/google/verify", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: "No Google credential provided." });
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ message: "Google sign-in is not configured on this server." });
  }
  try {
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!tokenInfoRes.ok) {
      console.error("Google tokeninfo rejected:", await tokenInfoRes.text());
      return res.status(401).json({ message: "Invalid Google credential. Please try again." });
    }
    const info = await tokenInfoRes.json();
    if (info.aud !== clientId) {
      return res.status(401).json({ message: "Google credential audience mismatch." });
    }
    if (!info.email) {
      return res.status(400).json({ message: "Your Google account did not share an email address." });
    }
    const email = info.email.toLowerCase();
    let user = await storage.getUserByEmail(email);
    if (user) {
      if (user.provider === "email" || !user.provider) {
        user = await storage.updateUser(user.id, { provider: "google", providerId: info.sub }) ?? user;
      }
    } else {
      user = await storage.createUser({
        email,
        password: null,
        name: info.name || null,
        provider: "google",
        providerId: info.sub || null
      });
    }
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error after Google verify:", err);
        return res.status(500).json({ message: "Session error. Please try again." });
      }
      const { password: _, ...safeUser } = user;
      return res.status(200).json({ user: safeUser });
    });
  } catch (err) {
    console.error("Google verify error:", err);
    return res.status(500).json({ message: "Google sign-in failed. Please try again." });
  }
});
var auth_default = router;

// server/razorpayRoutes.ts
import { Router as Router2 } from "express";

// server/razorpayClient.ts
import Razorpay from "razorpay";
import crypto2 from "crypto";
function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("RAZORPAY_KEY_ID not set");
  return keyId;
}
function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in Secrets");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
function verifyWebhookSignature(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "RAZORPAY_WEBHOOK_SECRET is not set \u2014 all webhook requests will be rejected. Add the secret from Razorpay Dashboard \u2192 Settings \u2192 Webhooks to enable webhook processing."
    );
    return false;
  }
  if (!signature) {
    return false;
  }
  const expectedSignature = crypto2.createHmac("sha256", secret).update(body).digest("hex");
  return expectedSignature === signature;
}
function verifyPaymentSignature(params) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;
  const message = `${params.paymentId}|${params.subscriptionId}`;
  const expectedSignature = crypto2.createHmac("sha256", keySecret).update(message).digest("hex");
  return expectedSignature === params.signature;
}
function isRazorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
var PLANS = {
  inr: {
    monthly: {
      amount: 39900,
      currency: "INR",
      period: "monthly",
      interval: 1,
      name: "Interosense Premium Monthly"
    },
    annual: {
      amount: 399e3,
      currency: "INR",
      period: "yearly",
      interval: 1,
      name: "Interosense Premium Annual"
    }
  },
  usd: {
    monthly: {
      amount: 799,
      currency: "USD",
      period: "monthly",
      interval: 1,
      name: "Interosense Premium Monthly"
    },
    annual: {
      amount: 7990,
      currency: "USD",
      period: "yearly",
      interval: 1,
      name: "Interosense Premium Annual"
    }
  }
};

// server/notifications.ts
async function sendResendEmail(opts) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] Email skipped (no RESEND_API_KEY). Would send to ${opts.to}: ${opts.subject}`);
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL || "Interosense <noreply@interosense.app>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html })
  });
  if (!response.ok) {
    console.error("Resend email failed:", await response.text());
  }
}
async function sendSlackAlert(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("[DEV] Slack alert skipped (no SLACK_WEBHOOK_URL). Message:", message);
    return;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message })
    });
    if (!response.ok) {
      console.error("Slack webhook failed:", await response.text());
    }
  } catch (err) {
    console.error("Slack webhook error:", err);
  }
}
async function notifySubscriptionHalted(user, subscriptionId) {
  const displayName = user.name || "there";
  const userEmailHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #FAFAFE;">
      <img src="https://interosense.app/logo.png" alt="Interosense" width="48" style="margin-bottom: 24px;" />
      <h2 style="color: #6B5B95; font-size: 22px; margin: 0 0 12px;">Your Interosense Premium subscription has been paused</h2>
      <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        Hi ${displayName},
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        We were unable to collect your subscription payment after several attempts. As a result, your Interosense Premium access has been temporarily paused.
      </p>
      <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        To restore access, please update your payment method through your bank or card provider and reply to this email \u2014 our support team will reactivate your subscription right away.
      </p>
      <a href="mailto:support@interosense.app?subject=Reactivate%20my%20subscription"
         style="display: inline-block; background: #6B5B95; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; margin-bottom: 24px;">
        Contact Support
      </a>
      <p style="color: #999; font-size: 13px; line-height: 1.5; margin: 0;">
        If you believe this is an error or have already updated your payment details, please ignore this email or reply and we will sort it out promptly.
      </p>
    </div>
  `;
  const teamAlertMessage = `*Subscription halted* \u2014 payment retries exhausted.
\u2022 User: ${displayName} (ID ${user.id}, <mailto:${user.email}|${user.email}>)
` + (subscriptionId ? `\u2022 Subscription: \`${subscriptionId}\`
` : "") + `\u2022 Action: premium access revoked. Please follow up to help them reactivate.`;
  await Promise.allSettled([
    sendResendEmail({
      to: user.email,
      subject: "Your Interosense Premium subscription has been paused",
      html: userEmailHtml
    }).catch((err) => console.error("Failed to send halted email to user:", err)),
    sendSlackAlert(teamAlertMessage).catch((err) => console.error("Failed to send Slack halted alert:", err))
  ]);
  console.log(
    `[subscription.halted] Notified user ${user.id} (${user.email})` + (subscriptionId ? ` sub=${subscriptionId}` : "") + `. RESEND=${!!process.env.RESEND_API_KEY} SLACK=${!!process.env.SLACK_WEBHOOK_URL}`
  );
}

// server/razorpayRoutes.ts
var router2 = Router2();
router2.post("/api/razorpay/create-subscription", async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      error: "Payment not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Secrets."
    });
  }
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const planKey = req.body.planId === "annual" ? "annual" : "monthly";
  const currency = "INR";
  const planIdEnv = planKey === "annual" ? process.env.RAZORPAY_ANNUAL_PLAN_ID : process.env.RAZORPAY_MONTHLY_PLAN_ID;
  if (!planIdEnv) {
    return res.status(503).json({
      error: "Subscription plans not configured. Run POST /api/razorpay/setup-plans to create them.",
      setup_required: true
    });
  }
  try {
    const user = await storage.getUser(userId);
    const client = getRazorpayClient();
    const totalCount = planKey === "annual" ? 10 : 120;
    const isFirstTimeSubscriber = !user?.razorpaySubscriptionId;
    const sub = await client.subscriptions.create({
      plan_id: planIdEnv,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      ...isFirstTimeSubscriber ? { trial_period: 7 } : {},
      notes: {
        userId: String(userId),
        plan: planKey,
        currency
      }
    });
    const subscriptionId = sub.id;
    const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host") || req.get("host") || "";
    const baseUrl = `${forwardedProto}://${forwardedHost}`;
    const checkoutUrl = `${baseUrl}/razorpay-checkout?` + new URLSearchParams({
      key: getRazorpayKeyId(),
      subscription_id: subscriptionId,
      user_id: String(userId),
      name: user?.name || "",
      email: user?.email || "",
      plan: planKey,
      currency
    }).toString();
    return res.json({
      subscription_id: subscriptionId,
      key: getRazorpayKeyId(),
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: ""
      },
      plan: planKey,
      currency,
      url: checkoutUrl
    });
  } catch (err) {
    console.error("Razorpay create-subscription error:", err);
    return res.status(500).json({ error: err.message || "Failed to start checkout" });
  }
});
router2.post("/api/razorpay/verify-payment", async (req, res) => {
  const verifyUserId = req.session?.userId;
  if (!verifyUserId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }
  const valid = verifyPaymentSignature({
    paymentId: razorpay_payment_id,
    subscriptionId: razorpay_subscription_id,
    signature: razorpay_signature
  });
  if (!valid) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }
  try {
    await storage.updateUser(String(verifyUserId), {
      isPremium: true,
      razorpayCustomerId: razorpay_subscription_id,
      razorpaySubscriptionId: razorpay_subscription_id
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("Razorpay verify-payment error:", err);
    return res.status(500).json({ error: "Failed to update subscription status" });
  }
});
router2.post("/api/razorpay/webhook", async (req, res) => {
  const rawBody = req.rawBody;
  const signature = req.headers["x-razorpay-signature"];
  if (!verifyWebhookSignature(
    rawBody ? rawBody.toString() : JSON.stringify(req.body),
    signature || ""
  )) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error("Razorpay webhook: RAZORPAY_WEBHOOK_SECRET not configured \u2014 request rejected");
      return res.status(503).json({ error: "Webhook secret not configured on server" });
    }
    console.warn("Razorpay webhook: invalid signature \u2014 request rejected");
    return res.status(401).json({ error: "Invalid webhook signature" });
  }
  const event = req.body;
  if (!event?.event) return res.status(400).json({ error: "Invalid webhook payload" });
  try {
    const sub = event.payload?.subscription?.entity;
    const notes = sub?.notes || {};
    const userId = notes.userId;
    const subscriptionId = sub?.id;
    if (event.event === "subscription.activated" || event.event === "subscription.charged") {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: true,
          razorpaySubscriptionId: subscriptionId
        });
      }
    } else if (event.event === "subscription.cancelled" || event.event === "subscription.expired" || event.event === "subscription.completed") {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: false
        });
      }
    } else if (event.event === "subscription.halted") {
      if (userId) {
        await storage.updateUser(String(userId), {
          isPremium: false
        });
        const user = await storage.getUser(String(userId));
        if (user) {
          notifySubscriptionHalted(user, subscriptionId).catch(
            (err) => console.error("notifySubscriptionHalted failed:", err)
          );
        }
      }
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
router2.get("/api/razorpay/subscription-status", async (req, res) => {
  const statusUserId = req.session?.userId;
  if (!statusUserId) return res.status(401).json({ error: "Not authenticated" });
  try {
    const user = await storage.getUser(String(statusUserId));
    const subscriptionId = user?.razorpaySubscriptionId;
    if (!subscriptionId) {
      return res.json({ subscription: null });
    }
    if (!isRazorpayConfigured()) {
      return res.json({ subscription: { id: subscriptionId, status: "unknown", plan: "unknown" } });
    }
    const client = getRazorpayClient();
    const sub = await client.subscriptions.fetch(subscriptionId);
    const planNote = sub?.notes?.plan || "monthly";
    const planLabel = planNote === "annual" ? "Annual" : "Monthly";
    const amount = planNote === "annual" ? "\u20B93,990/year" : "\u20B9399/month";
    return res.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: planLabel,
        amount,
        currentStart: sub.current_start ? new Date(sub.current_start * 1e3).toISOString() : null,
        currentEnd: sub.current_end ? new Date(sub.current_end * 1e3).toISOString() : null,
        chargeAt: sub.charge_at ? new Date(sub.charge_at * 1e3).toISOString() : null,
        trialEndAt: sub.trial_end_at ? new Date(sub.trial_end_at * 1e3).toISOString() : null,
        // true when user cancelled with cancel_at_cycle_end — status stays "active" until period ends
        cancelAtCycleEnd: sub.cancel_at_cycle_end === true || sub.cancel_at_cycle_end === 1
      }
    });
  } catch (err) {
    console.error("Razorpay subscription-status error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch subscription details" });
  }
});
router2.post("/api/razorpay/cancel", async (req, res) => {
  const cancelUserId = req.session?.userId;
  if (!cancelUserId) return res.status(401).json({ error: "Not authenticated" });
  try {
    const user = await storage.getUser(String(cancelUserId));
    const subscriptionId = user?.razorpaySubscriptionId;
    if (subscriptionId && isRazorpayConfigured()) {
      const client = getRazorpayClient();
      await client.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
    }
    return res.json({ success: true, message: "Subscription will be cancelled at the end of the current billing period." });
  } catch (err) {
    console.error("Razorpay cancel error:", err);
    return res.status(500).json({ error: err.message || "Failed to cancel subscription" });
  }
});
router2.post("/api/razorpay/setup-plans", async (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedSecret = req.headers["x-admin-secret"] || req.body?.adminSecret;
  if (!adminSecret || providedSecret !== adminSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      error: "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set before creating plans."
    });
  }
  const existing = {
    monthly_inr: process.env.RAZORPAY_MONTHLY_PLAN_ID,
    annual_inr: process.env.RAZORPAY_ANNUAL_PLAN_ID
  };
  if (existing.monthly_inr && existing.annual_inr) {
    return res.json({
      message: "All plans already configured",
      plans: existing
    });
  }
  try {
    const client = getRazorpayClient();
    const results = {};
    const instructions = [];
    if (!existing.monthly_inr) {
      const plan = await client.plans.create({
        period: PLANS.inr.monthly.period,
        interval: PLANS.inr.monthly.interval,
        item: {
          name: PLANS.inr.monthly.name,
          amount: PLANS.inr.monthly.amount,
          currency: "INR",
          description: "Interosense Premium, monthly subscription"
        },
        notes: { plan_type: "monthly_inr" }
      });
      results.monthly_inr = plan.id;
      instructions.push(`Set RAZORPAY_MONTHLY_PLAN_ID = ${plan.id}`);
    } else {
      results.monthly_inr = existing.monthly_inr;
    }
    if (!existing.annual_inr) {
      const plan = await client.plans.create({
        period: PLANS.inr.annual.period,
        interval: PLANS.inr.annual.interval,
        item: {
          name: PLANS.inr.annual.name,
          amount: PLANS.inr.annual.amount,
          currency: "INR",
          description: "Interosense Premium, annual subscription"
        },
        notes: { plan_type: "annual_inr" }
      });
      results.annual_inr = plan.id;
      instructions.push(`Set RAZORPAY_ANNUAL_PLAN_ID = ${plan.id}`);
    } else {
      results.annual_inr = existing.annual_inr;
    }
    console.log("Razorpay plans created:");
    instructions.forEach((i) => console.log(" ", i));
    return res.json({
      message: instructions.length ? "Plans created. Copy the IDs below into Replit Secrets." : "All plans were already configured.",
      plans: results,
      instructions
    });
  } catch (err) {
    const detail = err?.error?.description || err?.message || JSON.stringify(err);
    console.error("Razorpay setup-plans error:", detail);
    return res.status(500).json({ error: detail });
  }
});
var razorpayRoutes_default = router2;

// server/advisor.ts
var SYSTEM_PROMPT = `You are a knowledgeable, compassionate interoception coach embedded in a wellness app called Interosense. Your role is to provide a single daily insight that feels genuinely personal.

Guidelines:
- Respond warmly but stay grounded in clinical reality. Reference real neuroscience when relevant (insular cortex, vagus nerve, HRV, gut-brain axis).
- Never be alarmist. Never use generic phrases like "Great job!" or "Keep it up!"
- Always be specific to what the user has shared, their conditions, recent check-in data, exercise patterns, and current state.
- Maximum 120 words. Write in second person ("you").
- If the user is new, welcome them and connect their specific conditions to interoceptive science.
- If they checked in today, reference their specific scores and mood.
- If they have a streak, acknowledge it meaningfully, tie it to neuroplasticity.
- If real HRV or sleep data is available, reference it specifically (e.g. "Your HRV yesterday was 42ms, your nervous system appears well-regulated today"). HRV above 40ms is generally a sign of good vagal tone; below 20ms may indicate stress or poor recovery. Sleep under 6 hours increases interoceptive reactivity.
- Match tone to time of day (energizing in morning, reflective in evening, calming at night).
- Do not use bullet points or lists. Write in flowing, natural prose.
- Do not start with greetings like "Good morning", the app already shows a greeting.
- Do not mention that you are an AI.`;
async function generateInsight(context) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  const userMessage = buildUserMessage(context);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  const text2 = data.content?.[0]?.text;
  if (!text2) {
    throw new Error("Empty response from Claude API");
  }
  return text2.trim();
}
function buildUserMessage(context) {
  const parts = [];
  parts.push(`User: ${context.name}`);
  parts.push(`Time of day: ${context.timeOfDay}`);
  if (context.isNewUser) {
    parts.push("This is a brand new user who just signed up.");
  }
  if (context.conditions.length > 0) {
    parts.push(`Conditions they are working on: ${context.conditions.join(", ")}`);
  }
  parts.push(`Practice stats: ${context.totalSessions} total sessions, ${context.totalMinutes} total minutes, ${context.currentStreak}-day streak`);
  if (context.todayCheckin) {
    const c = context.todayCheckin;
    parts.push(`Today's check-in: awareness ${c.awarenessScore}/10, energy ${c.energyLevel}/10, sleep quality ${c.sleepQuality}/10, stress ${c.stressLevel}/10, mood: ${c.mood || "not specified"}`);
  } else {
    parts.push("No check-in today, base the insight on their historical patterns and conditions.");
  }
  if (context.recentExerciseHistory.length > 0) {
    const recent = context.recentExerciseHistory.slice(0, 5);
    const exerciseList = recent.map((e) => `${e.title} (${e.category})`).join(", ");
    parts.push(`Recent exercises: ${exerciseList}`);
  } else {
    parts.push("No exercises completed yet.");
  }
  if (context.wearableContext) {
    const w = context.wearableContext;
    const wearableParts = [];
    if (w.avgHrv !== void 0) {
      wearableParts.push(`most recent HRV: ${w.avgHrv}ms`);
    }
    if (w.avgHrv7d !== void 0 && w.avgHrv !== void 0 && w.avgHrv7d !== w.avgHrv) {
      wearableParts.push(`7-day HRV average: ${w.avgHrv7d}ms`);
    }
    if (w.lastSleepHours !== void 0) {
      wearableParts.push(`last night's sleep: ${w.lastSleepHours}hrs`);
    }
    if (w.avgSleep7d !== void 0) {
      wearableParts.push(`7-day sleep average: ${w.avgSleep7d}hrs`);
    }
    if (wearableParts.length > 0) {
      parts.push(`Real biometric data from their wearable, use these numbers in your insight: ${wearableParts.join(", ")}`);
    }
  }
  parts.push("Generate a single personalized daily insight for this user.");
  return parts.join("\n");
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.set("trust proxy", 1);
  const PgStore = connectPgSimple(session);
  app2.use(
    session({
      store: new PgStore({
        pool,
        tableName: "session",
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || "interosense-dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1e3,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
      }
    })
  );
  app2.use(auth_default);
  app2.use(razorpayRoutes_default);
  app2.get("/pitch", (req, res) => {
    const templatePath = path.resolve(
      process.cwd(),
      "server",
      "templates",
      "pitch-deck.html"
    );
    const template = fs.readFileSync(templatePath, "utf-8");
    const forwardedProto = req.header("x-forwarded-proto");
    const protocol = forwardedProto || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host");
    const host = forwardedHost || req.get("host");
    const baseUrl = `${protocol}://${host}`;
    const html = template.replace(/BASE_URL_PLACEHOLDER/g, baseUrl);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });
  app2.post("/api/sessions", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { id, exerciseId, exerciseTitle, category, completedAt, durationMinutes, rating, notes } = req.body;
      const session2 = await createSession({
        id,
        userId: req.session.userId,
        exerciseId,
        exerciseTitle,
        category,
        completedAt,
        durationMinutes: durationMinutes ?? 0,
        rating: rating ?? 0,
        notes: notes ?? ""
      });
      return res.status(201).json({ session: session2 });
    } catch (error) {
      console.error("Create session error:", error);
      return res.status(500).json({ message: "Failed to save session" });
    }
  });
  app2.get("/api/sessions", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const sessions = await getUserSessions(req.session.userId);
      return res.status(200).json({ sessions });
    } catch (error) {
      console.error("Get sessions error:", error);
      return res.status(500).json({ message: "Failed to load sessions" });
    }
  });
  app2.post("/api/checkins", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { id, date, awarenessScore, energyLevel, sleepQuality, stressLevel, mood, sensations, bodyAreas, notes } = req.body;
      const checkin = await createCheckin({
        id,
        userId: req.session.userId,
        date,
        awarenessScore: awarenessScore ?? 5,
        energyLevel: energyLevel ?? 5,
        sleepQuality: sleepQuality ?? 5,
        stressLevel: stressLevel ?? 5,
        mood: mood ?? "",
        sensations: sensations ?? [],
        bodyAreas: bodyAreas ?? [],
        notes: notes ?? ""
      });
      return res.status(201).json({ checkin });
    } catch (error) {
      console.error("Create checkin error:", error);
      return res.status(500).json({ message: "Failed to save check-in" });
    }
  });
  app2.get("/api/checkins", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const checkins = await getUserCheckins(req.session.userId);
      return res.status(200).json({ checkins });
    } catch (error) {
      console.error("Get checkins error:", error);
      return res.status(500).json({ message: "Failed to load check-ins" });
    }
  });
  app2.post("/api/assessments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { id, scaleId, scaleName, completedAt, totalScore, severity, answers, subscaleScores } = req.body;
      if (scaleId === "maia2") {
        const scores = subscaleScores ?? {};
        const missingKeys = MAIA2_REQUIRED_SUBSCALE_KEYS.filter(
          (key) => !(key in scores) || typeof scores[key] !== "number" || isNaN(scores[key])
        );
        if (missingKeys.length > 0) {
          return res.status(422).json({
            message: "MAIA-2 assessment rejected: subscaleScores is missing required keys",
            missingKeys
          });
        }
      }
      const assessment = await createAssessment({
        id,
        userId: req.session.userId,
        scaleId,
        scaleName,
        completedAt,
        totalScore: totalScore ?? 0,
        severity: severity ?? "",
        answers: Array.isArray(answers) ? answers : [],
        subscaleScores: subscaleScores ?? null
      });
      return res.status(201).json({ assessment });
    } catch (error) {
      console.error("Create assessment error:", error);
      return res.status(500).json({ message: "Failed to save assessment" });
    }
  });
  app2.get("/api/assessments", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const assessments2 = await getUserAssessments(req.session.userId);
      return res.status(200).json({ assessments: assessments2 });
    } catch (error) {
      console.error("Get assessments error:", error);
      return res.status(500).json({ message: "Failed to load assessments" });
    }
  });
  app2.get("/api/exercises/counts", async (req, res) => {
    try {
      const counts = await getExercisePracticeCounts();
      return res.status(200).json({ counts });
    } catch (error) {
      console.error("Exercise counts error:", error);
      return res.status(500).json({ message: "Failed to load practice counts" });
    }
  });
  app2.post("/api/advisor/insight", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const wearableContext = req.body?.wearableContext ?? null;
      const hasWearableContext = wearableContext !== null && wearableContext !== void 0;
      const cached = await getTodayInsight(req.session.userId, today, hasWearableContext);
      if (cached) {
        return res.status(200).json({ insight: cached.insightText, cached: true });
      }
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ message: "AI advisor not configured" });
      }
      const user = await storage.getUser(req.session.userId);
      const sessions = await getUserSessions(req.session.userId);
      const checkins = await getUserCheckins(req.session.userId);
      const todayCheckin = checkins.find((c) => c.date === today) || null;
      const hour = (/* @__PURE__ */ new Date()).getHours();
      let timeOfDay = "morning";
      if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 21) timeOfDay = "evening";
      else if (hour >= 21) timeOfDay = "night";
      const recentExercises = sessions.slice(0, 5).map((s) => ({
        title: s.exerciseTitle,
        category: s.category,
        completedAt: s.completedAt
      }));
      const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const uniqueDays = new Set(sessions.map((s) => s.completedAt.split("T")[0]));
      const sortedDays = Array.from(uniqueDays).sort().reverse();
      let currentStreak = 0;
      const todayStr = today;
      const yesterdayStr = new Date(Date.now() - 864e5).toISOString().split("T")[0];
      if (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr) {
        currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const d1 = new Date(sortedDays[i - 1]);
          const d2 = new Date(sortedDays[i]);
          const diff = Math.round((d1.getTime() - d2.getTime()) / 864e5);
          if (diff === 1) currentStreak++;
          else break;
        }
      }
      const insightText = await generateInsight({
        name: user?.name || "there",
        conditions: user?.conditions || [],
        todayCheckin: todayCheckin ? {
          awarenessScore: todayCheckin.awarenessScore,
          energyLevel: todayCheckin.energyLevel,
          sleepQuality: todayCheckin.sleepQuality,
          stressLevel: todayCheckin.stressLevel,
          mood: todayCheckin.mood
        } : null,
        recentExerciseHistory: recentExercises,
        currentStreak,
        totalSessions: sessions.length,
        totalMinutes,
        timeOfDay,
        isNewUser: sessions.length === 0 && checkins.length === 0,
        wearableContext
      });
      await saveInsight(req.session.userId, insightText, today, hasWearableContext);
      return res.status(200).json({ insight: insightText, cached: false });
    } catch (error) {
      console.error("Advisor insight error:", error);
      return res.status(500).json({ message: "Failed to generate insight" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupRazorpayCheckoutPage(app2) {
  app2.get("/razorpay-checkout", (_req, res) => {
    const checkoutPath = path2.resolve(process.cwd(), "server", "templates", "razorpay-checkout.html");
    if (fs2.existsSync(checkoutPath)) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(checkoutPath);
    } else {
      res.status(404).send("Checkout page not found");
    }
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path3.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path2.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path2.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs2.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  const webBuildPath = path2.resolve(process.cwd(), "dist");
  const hasWebBuild = fs2.existsSync(path2.join(webBuildPath, "index.html"));
  log("Serving static Expo files with dynamic manifest routing");
  if (hasWebBuild) {
    log("Web build found at dist/ - serving web app under /app");
  }
  app2.get("/", (req, res) => {
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    return serveLandingPage({ req, res, landingPageTemplate, appName });
  });
  app2.get("/manifest", (req, res, next) => {
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    next();
  });
  app2.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  app2.use("/landing-assets", express.static(path2.resolve(process.cwd(), "server", "templates", "assets")));
  app2.use(express.static(path2.resolve(process.cwd(), "static-build")));
  if (hasWebBuild) {
    app2.use("/app", express.static(webBuildPath));
    app2.use((req, res, next) => {
      if (!req.path.startsWith("/app")) {
        return next();
      }
      const indexPath = path2.join(webBuildPath, "index.html");
      if (fs2.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      next();
    });
  }
  log("Routes: / = landing page, /app = web app, /pitch = pitch deck");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupRazorpayCheckoutPage(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  if (!process.env.ANTHROPIC_API_KEY) {
    log("\u26A0\uFE0F  ANTHROPIC_API_KEY is not set. AI advisor will use static fallback insights.");
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
