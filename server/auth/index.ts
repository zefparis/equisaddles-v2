import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import argon2 from "argon2";
import { parseCookie } from "cookie";
import { unsign } from "cookie-signature";
import type { Express, Request, Response, NextFunction } from "express";
import type { IncomingMessage } from "http";
import { z } from "zod";
import pg from "pg";

const PgSessionStore = connectPgSimple(session);

const SESSION_COOKIE_NAME = "equisaddle_admin";
const DEV_FALLBACK_SECRET = "dev-only-insecure-fallback-secret-not-for-production";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function validateSessionSecret(isProduction: boolean): string {
  const secret = process.env.SESSION_SECRET;

  if (isProduction) {
    if (!secret || secret.trim().length === 0) {
      console.error("FATAL: SESSION_SECRET is required in production. Server cannot start.");
      process.exit(1);
    }
    if (secret.length < 32) {
      console.error("FATAL: SESSION_SECRET must be at least 32 characters in production. Server cannot start.");
      process.exit(1);
    }
    return secret;
  }

  if (!secret || secret.trim().length === 0) {
    console.warn("SESSION_SECRET not set — using insecure dev-only fallback. DO NOT use in production.");
    return DEV_FALLBACK_SECRET;
  }

  if (secret.length < 32) {
    console.warn("SESSION_SECRET is shorter than 32 characters — not recommended even for development.");
  }

  return secret;
}

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = validateSessionSecret(isProduction);

// Reuse the existing PostgreSQL pool from db.ts when available.
// We create a dedicated pool only if db.ts hasn't been imported yet.
let sessionPool: pg.Pool | null = null;

function getSessionPool(): pg.Pool {
  if (sessionPool) return sessionPool;

  // Try to reuse the pool from db.ts
  try {
    // db.ts exports `db` which wraps the pool, but we need the raw pool.
    // Since db.ts creates its own Pool, we create a separate one for sessions
    // to avoid coupling. Both use the same DATABASE_URL.
    const { Pool } = pg;
    sessionPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });
    return sessionPool;
  } catch {
    const { Pool } = pg;
    sessionPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    });
    return sessionPool;
  }
}

// Single shared session store — PostgreSQL-backed for persistence
const sessionStore = new PgSessionStore({
  pool: getSessionPool(),
  tableName: "user_sessions",
  createTableIfMissing: true,
  pruneSessionInterval: 3600,
});

// Single shared session middleware instance
const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
});

export function setupSession(app: Express) {
  app.set("trust proxy", isProduction ? 1 : false);
  app.use(sessionMiddleware);
}

/**
 * Extract and validate admin session from a WebSocket upgrade request.
 * Uses the same session store and secret as the Express middleware.
 * Returns true only if the session has admin.authenticated === true.
 */
export function isAdminSessionFromWs(request: IncomingMessage): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const cookieHeader = request.headers.cookie;
      if (!cookieHeader) {
        return resolve(false);
      }

      const cookies = parseCookie(cookieHeader);
      const signedSid = cookies[SESSION_COOKIE_NAME];
      if (!signedSid) {
        return resolve(false);
      }

      const sidValue = signedSid.startsWith("s:") ? signedSid.slice(2) : signedSid;
      const sid = unsign(sidValue, sessionSecret);
      if (!sid || typeof sid !== "string") {
        return resolve(false);
      }

      sessionStore.get(sid, (err: any, sessionData: any) => {
        if (err || !sessionData) {
          return resolve(false);
        }
        resolve(sessionData.admin?.authenticated === true);
      });
    } catch {
      resolve(false);
    }
  });
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.admin?.authenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function registerAuthRoutes(app: Express) {
  app.post("/api/admin/login", loginLimiter, async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const { username, password } = parsed.data;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
      console.error("ADMIN_USERNAME or ADMIN_PASSWORD_HASH not configured");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const usernameMatch = username === adminUsername;
    const passwordMatch = await argon2.verify(adminPasswordHash, password).catch(() => false);

    if (!usernameMatch || !passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ message: "Login failed" });
      }

      req.session.admin = {
        authenticated: true,
        username,
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ authenticated: true });
      });
    });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie(SESSION_COOKIE_NAME);
      res.status(204).send();
    });
  });

  app.get("/api/admin/session", (req: Request, res: Response) => {
    if (req.session.admin?.authenticated) {
      return res.json({ authenticated: true });
    }
    return res.status(401).json({ authenticated: false });
  });
}
