import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage, createResetToken, getResetToken, markTokenUsed } from "./storage";
import { loginSchema, registerSchema } from "../shared/schema";

// ── Apple JWT verification ─────────────────────────────────────────────────
// Fetches Apple's JWKS and verifies the identity token's signature + claims.
// Derives email/sub only from the verified payload — never from client body.
let appleJwksCache: { keys: any[]; fetchedAt: number } | null = null;

async function fetchAppleJwks(): Promise<any[]> {
  const now = Date.now();
  if (appleJwksCache && now - appleJwksCache.fetchedAt < 3600_000) {
    return appleJwksCache.keys;
  }
  const res = await fetch("https://appleid.apple.com/auth/keys");
  if (!res.ok) throw new Error("Failed to fetch Apple JWKS");
  const { keys } = await res.json();
  appleJwksCache = { keys, fetchedAt: now };
  return keys;
}

interface AppleClaims {
  sub: string;
  email: string | null;
  email_verified?: string | boolean;
}

async function verifyAppleToken(identityToken: string): Promise<AppleClaims> {
  const parts = identityToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed Apple identity token");

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header to find the key id
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  if (header.alg !== "RS256") throw new Error("Unexpected Apple token algorithm");

  // Find matching JWKS key
  const keys = await fetchAppleJwks();
  const jwk = keys.find((k: any) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching Apple key found for kid: " + header.kid);

  // Import public key from JWK and verify signature
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signingInput = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(signatureB64, "base64url");

  const valid = crypto.verify("sha256", signingInput, publicKey, signature);
  if (!valid) throw new Error("Apple token signature verification failed");

  // Validate claims
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

  if (payload.iss !== "https://appleid.apple.com") {
    throw new Error("Invalid Apple token issuer");
  }
  if (Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Apple token has expired");
  }
  if (!payload.sub) {
    throw new Error("Apple token missing sub claim");
  }

  // Validate audience — must match this app's bundle ID / Service ID.
  // APPLE_APP_BUNDLE_ID should be set in secrets when Apple Sign-In is configured.
  // Falls back to the known bundle ID so development/staging still validates correctly.
  const expectedAud = process.env.APPLE_APP_BUNDLE_ID || "com.interosense";
  const tokenAud: string | string[] = payload.aud;
  const audMatches = Array.isArray(tokenAud)
    ? tokenAud.includes(expectedAud)
    : tokenAud === expectedAud;
  if (!audMatches) {
    throw new Error(`Apple token audience mismatch: expected "${expectedAud}", got "${tokenAud}"`);
  }

  return { sub: payload.sub, email: payload.email ?? null, email_verified: payload.email_verified };
}

// ── Google token verification ──────────────────────────────────────────────
interface GoogleClaims {
  sub: string;
  email: string;
  name?: string;
  email_verified?: string | boolean;
  aud?: string;
}

async function verifyGoogleToken(token: string, isIdToken: boolean): Promise<GoogleClaims> {
  let data: any;

  if (isIdToken) {
    // tokeninfo verifies signature + expiry server-side
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!res.ok) throw new Error("Google tokeninfo request failed");
    data = await res.json();
    if (data.error || data.error_description) throw new Error("Invalid Google id_token: " + (data.error_description || data.error));

    // Validate audience when client ID is configured
    const expectedAud = process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (expectedAud && data.aud !== expectedAud) {
      throw new Error("Google token audience mismatch");
    }
    if (!data.email_verified || data.email_verified === "false") {
      throw new Error("Google account email is not verified");
    }
  } else {
    // Access token — fetch verified user info from Google
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
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

declare module "express-session" {
  interface SessionData {
    userId: string;
    oauthState?: string;
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

    const { name, conditions, experienceLevel, goals, dailyMinutes, gender, dateOfBirth, bio, profileImage, interoceptiveBaseline, onboardingPlan } = req.body;

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
      ...(interoceptiveBaseline !== undefined && { interoceptiveBaseline }),
      ...(onboardingPlan !== undefined && { onboardingPlan }),
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

      const forwardedProto = req.header('x-forwarded-proto') || req.protocol || 'https';
      const forwardedHost = req.header('x-forwarded-host') || req.get('host') || 'localhost:8081';
      const resetUrl = `${forwardedProto}://${forwardedHost}/auth/reset-password?token=${token}`;

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

router.post("/api/auth/social", async (req: Request, res: Response) => {
  try {
    const { provider, idToken, accessToken, name, email } = req.body;

    if (!provider || (!idToken && !accessToken)) {
      return res.status(400).json({ message: "Missing provider or token." });
    }

    let verifiedEmail: string | null = null;
    let verifiedName: string | null = name || null;
    let providerId: string | null = null;

    if (provider === "google") {
      if (!idToken && !accessToken) {
        return res.status(400).json({ message: "Google token is required." });
      }
      let claims: GoogleClaims;
      try {
        claims = await verifyGoogleToken(
          (idToken || accessToken) as string,
          !!idToken,
        );
      } catch (err: any) {
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
      let claims: AppleClaims;
      try {
        claims = await verifyAppleToken(idToken);
      } catch (err: any) {
        console.error("Apple token verification failed:", err?.message);
        return res.status(401).json({ message: "Apple sign-in could not be verified. Please try again." });
      }
      // Apple only sends email on the first sign-in; subsequent sign-ins omit it.
      // On repeat sign-ins, look up the existing account by providerId (sub).
      verifiedEmail = claims.email ?? null;
      verifiedName = name || null;
      providerId = claims.sub;

      if (!verifiedEmail) {
        // Repeat Apple sign-in — find existing account by providerId
        const existingByProvider = await storage.getUserByProviderId("apple", providerId);
        if (!existingByProvider) {
          return res.status(400).json({ message: "Could not retrieve your Apple account. Please sign in with Apple again on your original device." });
        }
        // Skip find-or-create below; session for existing user
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

    // Find or create user
    let user = await storage.getUserByEmail(verifiedEmail);
    if (user) {
      // Update provider info if signing in via social for the first time
      if (user.provider === "email" || !user.provider) {
        user = await storage.updateUser(user.id, { provider, providerId }) ?? user;
      }
    } else {
      user = await storage.createUser({
        email: verifiedEmail,
        password: null,
        name: verifiedName,
        provider,
        providerId,
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

// ── Google OAuth server-side flow ──────────────────────────────────────────
// Works on web without any client-side credentials.
// Requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in server Secrets.

router.get("/api/auth/google", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.redirect("/app/auth/login?error=google_not_configured");
  }

  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;

  const proto = req.header("x-forwarded-proto") || req.protocol || "https";
  const host = req.header("x-forwarded-host") || req.get("host") || "";
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  req.session.save(() => {
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });
});

router.get("/api/auth/google/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error || !code) {
    return res.redirect("/app/auth/login?error=google_cancelled");
  }

  if (state !== req.session.oauthState) {
    return res.redirect("/app/auth/login?error=google_state_mismatch");
  }
  delete req.session.oauthState;

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const proto = req.header("x-forwarded-proto") || req.protocol || "https";
  const host = req.header("x-forwarded-host") || req.get("host") || "";
  const redirectUri = `${proto}://${host}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      return res.redirect("/app/auth/login?error=google_token_failed");
    }

    const tokens = await tokenRes.json() as { access_token: string };

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.redirect("/app/auth/login?error=google_userinfo_failed");
    }

    const userInfo = await userInfoRes.json() as { email?: string; name?: string; sub?: string };

    if (!userInfo.email) {
      return res.redirect("/app/auth/login?error=google_no_email");
    }

    let user = await storage.getUserByEmail(userInfo.email.toLowerCase());
    if (user) {
      if (user.provider === "email" || !user.provider) {
        user = await storage.updateUser(user.id, { provider: "google", providerId: userInfo.sub }) ?? user;
      }
    } else {
      user = await storage.createUser({
        email: userInfo.email.toLowerCase(),
        password: null,
        name: userInfo.name || null,
        provider: "google",
        providerId: userInfo.sub || null,
      });
    }

    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error("Session save error after Google OAuth:", err);
        return res.redirect("/app/auth/login?error=google_session_failed");
      }
      res.redirect("/app");
    });
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    res.redirect("/app/auth/login?error=google_failed");
  }
});

export default router;
