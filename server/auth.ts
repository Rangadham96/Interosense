import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "../shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const router = Router();

router.post("/api/auth/register", async (req: Request, res: Response) => {
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
      provider: "email",
    });

    req.session.userId = user.id;

    const { password: _, ...safeUser } = user;
    return res.status(201).json({ user: safeUser });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

router.post("/api/auth/login", async (req: Request, res: Response) => {
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

router.post("/api/auth/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully" });
  });
});

router.get("/api/auth/me", async (req: Request, res: Response) => {
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

router.put("/api/auth/profile", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { name, conditions, experienceLevel, goals, dailyMinutes, gender, dateOfBirth, bio, profileImage } = req.body;

    const user = await storage.updateUser(req.session.userId, {
      ...(name !== undefined && { name }),
      ...(conditions !== undefined && { conditions }),
      ...(experienceLevel !== undefined && { experienceLevel }),
      ...(goals !== undefined && { goals }),
      ...(dailyMinutes !== undefined && { dailyMinutes }),
      ...(gender !== undefined && { gender }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(bio !== undefined && { bio }),
      ...(profileImage !== undefined && { profileImage }),
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

export default router;
