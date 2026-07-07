import { db } from "./db";
import { products, galleryImages, productImages, orders, type Product, type InsertProduct, type ProductImage, type InsertProductImage, type GalleryImage, type InsertGalleryImage, type Order, type InsertOrder } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { IStorage } from "./storage";

/**
 * PostgreSQL Storage Implementation
 * Persiste toutes les données dans PostgreSQL via Drizzle ORM
 */
export class PostgresStorage implements IStorage {
  
  constructor() {
    // Test de connexion au démarrage
    this.testConnection();
  }

  private async testConnection() {
    try {
      console.log("🔍 Testing database connection...");
      const result = await db.select().from(products).limit(1);
      console.log("✅ Database connection test successful");
    } catch (error: any) {
      console.error("❌ Database connection test failed:", error.message);
      console.error("Full error:", error);
    }
  }
  
  // ==================== PRODUCTS ====================
  
  async getProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products);
    } catch (error: any) {
      console.error("❌ Error in getProducts:", error.message);
      throw error;
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set(updateProduct)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    // Supprimer d'abord les images associées
    await db.delete(productImages).where(eq(productImages.productId, id));
    
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // ==================== PRODUCT IMAGES ====================

  async getProductImages(productId: number): Promise<ProductImage[]> {
    return await db.select().from(productImages).where(eq(productImages.productId, productId));
  }

  async createProductImage(insertImage: InsertProductImage): Promise<ProductImage> {
    const result = await db.insert(productImages).values(insertImage).returning();
    return result[0];
  }

  async deleteProductImage(id: number): Promise<boolean> {
    const result = await db.delete(productImages).where(eq(productImages.id, id)).returning();
    return result.length > 0;
  }

  async setMainProductImage(productId: number, imageId: number): Promise<boolean> {
    // D'abord, retirer le flag main de toutes les images du produit
    await db
      .update(productImages)
      .set({ isMain: false })
      .where(eq(productImages.productId, productId));

    // Ensuite, définir la nouvelle image principale
    const result = await db
      .update(productImages)
      .set({ isMain: true })
      .where(and(
        eq(productImages.id, imageId),
        eq(productImages.productId, productId)
      ))
      .returning();

    return result.length > 0;
  }

  // ==================== GALLERY ====================

  async getGalleryImages(): Promise<GalleryImage[]> {
    return await db.select().from(galleryImages);
  }

  async getGalleryImagesByCategory(category: string): Promise<GalleryImage[]> {
    return await db.select().from(galleryImages).where(eq(galleryImages.category, category));
  }

  async createGalleryImage(insertImage: InsertGalleryImage): Promise<GalleryImage> {
    const result = await db.insert(galleryImages).values(insertImage).returning();
    return result[0];
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const result = await db.delete(galleryImages).where(eq(galleryImages.id, id)).returning();
    return result.length > 0;
  }

  // ==================== ORDERS ====================

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(insertOrder).returning();
    console.log(`✅ Order ${result[0].id} created in database`);
    return result[0];
  }

  async updateOrder(id: number, updateOrder: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set(updateOrder)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }
}

export const postgresStorage = new PostgresStorage();
