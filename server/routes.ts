import type { Express } from "express";
import type { Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import * as fs from "fs";
import * as path from "path";
import { pool } from "./db";
import authRouter from "./auth";
import razorpayRouter from "./razorpayRoutes";
import {
  createSession,
  getUserSessions,
  createCheckin,
  getUserCheckins,
  createAssessment,
  getUserAssessments,
  getTodayInsight,
  saveInsight,
  getExercisePracticeCounts,
} from "./storage";
import { storage } from "./storage";
import { generateInsight } from "./advisor";

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "interosense-dev-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.use(authRouter);
  app.use(razorpayRouter);

  app.get("/pitch", (req: Request, res: Response) => {
    const templatePath = path.resolve(
      process.cwd(),
      "server",
      "templates",
      "pitch-deck.html",
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

  app.post("/api/sessions", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { id, exerciseId, exerciseTitle, category, completedAt, durationMinutes, rating, notes } = req.body;
      const session = await createSession({
        id,
        userId: req.session.userId,
        exerciseId,
        exerciseTitle,
        category,
        completedAt,
        durationMinutes: durationMinutes ?? 0,
        rating: rating ?? 0,
        notes: notes ?? "",
      });
      return res.status(201).json({ session });
    } catch (error) {
      console.error("Create session error:", error);
      return res.status(500).json({ message: "Failed to save session" });
    }
  });

  app.get("/api/sessions", async (req: Request, res: Response) => {
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

  app.post("/api/checkins", async (req: Request, res: Response) => {
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
        notes: notes ?? "",
      });
      return res.status(201).json({ checkin });
    } catch (error) {
      console.error("Create checkin error:", error);
      return res.status(500).json({ message: "Failed to save check-in" });
    }
  });

  app.get("/api/checkins", async (req: Request, res: Response) => {
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

  app.post("/api/assessments", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const { id, scaleId, scaleName, completedAt, totalScore, severity, answers } = req.body;
      const assessment = await createAssessment({
        id,
        userId: req.session.userId,
        scaleId,
        scaleName,
        completedAt,
        totalScore: totalScore ?? 0,
        severity: severity ?? "",
        answers: answers ?? [],
      });
      return res.status(201).json({ assessment });
    } catch (error) {
      console.error("Create assessment error:", error);
      return res.status(500).json({ message: "Failed to save assessment" });
    }
  });

  app.get("/api/assessments", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const assessments = await getUserAssessments(req.session.userId);
      return res.status(200).json({ assessments });
    } catch (error) {
      console.error("Get assessments error:", error);
      return res.status(500).json({ message: "Failed to load assessments" });
    }
  });

  app.get("/api/exercises/counts", async (req: Request, res: Response) => {
    try {
      const counts = await getExercisePracticeCounts();
      return res.status(200).json({ counts });
    } catch (error) {
      console.error("Exercise counts error:", error);
      return res.status(500).json({ message: "Failed to load practice counts" });
    }
  });

  app.post("/api/advisor/insight", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    try {
      const today = new Date().toISOString().split("T")[0];

      const cached = await getTodayInsight(req.session.userId, today);
      if (cached) {
        return res.status(200).json({ insight: cached.insightText, cached: true });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ message: "AI advisor not configured" });
      }

      const user = await storage.getUser(req.session.userId);
      const sessions = await getUserSessions(req.session.userId);
      const checkins = await getUserCheckins(req.session.userId);

      const todayCheckin = checkins.find(c => c.date === today) || null;

      const hour = new Date().getHours();
      let timeOfDay = "morning";
      if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 21) timeOfDay = "evening";
      else if (hour >= 21) timeOfDay = "night";

      const recentExercises = sessions.slice(0, 5).map(s => ({
        title: s.exerciseTitle,
        category: s.category,
        completedAt: s.completedAt,
      }));

      const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

      const uniqueDays = new Set(sessions.map(s => s.completedAt.split("T")[0]));
      const sortedDays = Array.from(uniqueDays).sort().reverse();
      let currentStreak = 0;
      const todayStr = today;
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr) {
        currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
          const d1 = new Date(sortedDays[i - 1]);
          const d2 = new Date(sortedDays[i]);
          const diff = Math.round((d1.getTime() - d2.getTime()) / 86400000);
          if (diff === 1) currentStreak++;
          else break;
        }
      }

      const wearableContext = req.body?.wearableContext ?? null;

      const insightText = await generateInsight({
        name: user?.name || "there",
        conditions: (user?.conditions as string[]) || [],
        todayCheckin: todayCheckin
          ? {
              awarenessScore: todayCheckin.awarenessScore,
              energyLevel: todayCheckin.energyLevel,
              sleepQuality: todayCheckin.sleepQuality,
              stressLevel: todayCheckin.stressLevel,
              mood: todayCheckin.mood,
            }
          : null,
        recentExerciseHistory: recentExercises,
        currentStreak,
        totalSessions: sessions.length,
        totalMinutes,
        timeOfDay,
        isNewUser: sessions.length === 0 && checkins.length === 0,
        wearableContext,
      });

      await saveInsight(req.session.userId, insightText, today);

      return res.status(200).json({ insight: insightText, cached: false });
    } catch (error) {
      console.error("Advisor insight error:", error);
      return res.status(500).json({ message: "Failed to generate insight" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
