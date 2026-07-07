import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSession } from "./auth";
import "./auth/types";

const app = express();

// Serve static files from public directory FIRST
app.use(express.static(path.join(process.cwd(), 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session management — must be before route registration
setupSession(app);

// Health check endpoint — registered before all other routes, SPA fallback, and error handlers.
// Public, independent of Stripe, Brevo, Cloudinary, and admin auth.
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("[startup] registering routes");
  const server = await registerRoutes(app);
  console.log("[startup] routes registered");

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const status = err.status || err.statusCode || 500;

    const safeStatuses = [400, 401, 403, 404, 413, 415, 429];
    const isSafeStatus = safeStatuses.includes(status);

    let message: string;
    if (status === 500 || !isSafeStatus) {
      message = isProduction ? "Internal server error" : (err.message || "Internal Server Error");
    } else {
      message = err.message || "Error";
    }

    if (isProduction) {
      console.error(`[error] ${req.method} ${req.path} ${status} ${err.message || "unknown"}`);
    } else {
      console.error(`[error] ${req.method} ${req.path} ${status}`, err);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the configured port
  // Railway sets PORT automatically, fallback to 5000 for local dev
  const port = Number(process.env.PORT) || 5000;
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`[startup] server listening on ${host}:${port}`);
    log(`serving on http://${host}:${port}`);
  });
})().catch((err) => {
  console.error("[startup] server failed to start", err.message || err);
  process.exit(1);
});
