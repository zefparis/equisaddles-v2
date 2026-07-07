import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

console.log("[startup] environment validated");

if (!process.env.DATABASE_URL) {
  console.error("[startup] FATAL: DATABASE_URL is not set. Refusing to start.");
  process.exit(1);
}

console.log("[startup] database configuration detected");

// Run schema push non-interactively before starting the server.
// Uses the local drizzle-kit binary directly (no npx download delay).
const drizzleBin = join(projectRoot, "node_modules", ".bin", "drizzle-kit");

if (!existsSync(drizzleBin)) {
  console.error("[startup] drizzle-kit not found. Cannot initialize schema.");
  process.exit(1);
}

console.log("[startup] schema initialization started");

try {
  execFileSync(drizzleBin, ["push", "--force"], {
    stdio: "inherit",
    env: process.env,
    cwd: projectRoot,
    timeout: 60000,
  });
  console.log("[startup] schema initialization completed");
} catch (err) {
  console.error("[startup] database initialization failed");
  console.error("[startup] schema push error:", err.message || "unknown error");
  process.exit(1);
}

console.log("[startup] starting server...");

const serverPath = join(projectRoot, "dist", "index.js");

if (!existsSync(serverPath)) {
  console.error("[startup] FATAL: dist/index.js not found. Build may have failed.");
  process.exit(1);
}

try {
  await import("file://" + serverPath);
} catch (err) {
  console.error("[startup] server failed to start:", err.message || "unknown error");
  process.exit(1);
}
