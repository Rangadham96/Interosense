import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage, createResetToken, getResetToken, markTokenUsed } from "./storage";
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

router.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(200).json({ message: "If an account exists for that email, a reset link is on its way." });
    }

    const user = await storage.getUserByEmail(email.toLowerCase().trim());

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await createResetToken(user.id, token, expiresAt);

      const resetUrl = `${process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:8081"}/auth/reset-password?token=${token}`;

      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
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
              `,
            }),
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

router.post("/api/auth/reset-password", async (req: Request, res: Response) => {
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

    if (new Date() > record.expiresAt) {
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

export default router;
