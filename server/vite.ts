import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";

function nowLog(source: string, message: string) {
  const t = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${t} [${source}] ${message}`);
}

export function log(message: string, source = "express") {
  nowLog(source, message);
}

// ---- DEV ONLY: import('vite') au runtime, pas d'import top-level ----
export async function setupVite(app: Express, server: Server) {
  try {
    // Import dynamique pour éviter la résolution de 'vite' en production
    const { createServer: createViteServer, createLogger } = await import("vite");
    // idem pour le fichier de config (il dépend de plugins dev)
    const viteConfigMod = await import("../vite.config");
    const viteConfig = viteConfigMod.default;

  const viteLogger = createLogger();

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // évite la stack mappée si vite non concerné
      // @ts-ignore
      if (typeof vite?.ssrFixStacktrace === "function") vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    nowLog("setupVite", `Failed to setup Vite in development mode: ${errorMessage}`);
    // Fallback to static serving if Vite setup fails
    serveStatic(app);
  }
}

// ---- PROD: sert simplement dist/public sans 'vite' ----
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  nowLog("serveStatic", `static root => ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
