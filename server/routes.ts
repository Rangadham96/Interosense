import type { Express } from "express";
import type { Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import * as fs from "fs";
import * as path from "path";
import { pool } from "./db";
import authRouter from "./auth";

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

  const httpServer = createServer(app);
  return httpServer;
}
