import type { Express } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { requireAdmin } from "../auth";

const execPromise = promisify(exec);

/**
 * Route d'administration pour exécuter les migrations manuellement
 * Endpoint sécurisé : /api/admin/run-migrations
 */
export function registerMigrationRoutes(app: Express) {
  
  // Endpoint pour exécuter les migrations
  app.post("/api/admin/run-migrations", requireAdmin, async (req, res) => {
    try {
      console.log("🔧 Running database migrations manually...");
      
      if (!process.env.DATABASE_URL) {
        return res.status(500).json({ 
          success: false,
          message: "DATABASE_URL not configured" 
        });
      }

      const { stdout, stderr } = await execPromise("npm run db:push");
      
      console.log("✅ Migrations executed successfully");

      res.json({
        success: true,
        message: "Database migrations executed successfully"
      });

    } catch (error: any) {
      console.error("❌ Migration error:", error.message);
      res.status(500).json({
        success: false,
        message: "Migration failed"
      });
    }
  });

  // Endpoint pour exécuter le seed
  app.post("/api/admin/run-seed", requireAdmin, async (req, res) => {
    try {
      console.log("🌱 Running database seed manually...");
      
      const { stdout, stderr } = await execPromise("npm run db:seed");
      
      console.log("✅ Seed executed successfully");
      
      res.json({
        success: true,
        message: "Database seeded successfully"
      });

    } catch (error: any) {
      console.error("❌ Seed error:", error.message);
      res.status(500).json({
        success: false,
        message: "Seed failed"
      });
    }
  });

  // Endpoint pour vérifier l'état de la base de données
  app.get("/api/admin/db-status", requireAdmin, async (req, res) => {
    try {
      const { db } = await import("../db");
      const { products } = await import("@shared/schema");
      
      const productCount = await db.select().from(products).limit(1);
      
      res.json({
        success: true,
        message: "Database connection OK",
        hasProducts: productCount.length > 0
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Database connection failed"
      });
    }
  });
}
