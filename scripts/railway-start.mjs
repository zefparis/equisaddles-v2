import { execSync } from "child_process";

console.log("[startup] environment validated");

if (!process.env.DATABASE_URL) {
  console.error("[startup] FATAL: DATABASE_URL is not set. Refusing to start.");
  process.exit(1);
}

console.log("[startup] database configuration detected");
console.log("[startup] schema initialization started");

try {
  execSync("npx drizzle-kit push --force", {
    stdio: "inherit",
    env: process.env,
  });
  console.log("[startup] schema initialization completed");
} catch (err) {
  console.error("[startup] database initialization failed");
  console.error("[startup] schema push error:", err.message || "unknown error");
  process.exit(1);
}

console.log("[startup] starting server...");

import("file://" + process.cwd() + "/dist/index.js");
