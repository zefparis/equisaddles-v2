import { db } from "./db";
import { products, galleryImages, productImages, orders, orderItems, quotes, quoteItems, documentCounters, type Product, type InsertProduct, type ProductImage, type InsertProductImage, type GalleryImage, type InsertGalleryImage, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type Quote, type InsertQuote, type QuoteItem, type InsertQuoteItem } from "@shared/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
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
    return await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder), desc(galleryImages.createdAt));
  }

  async getActiveGalleryImages(): Promise<GalleryImage[]> {
    return await db.select().from(galleryImages).where(eq(galleryImages.active, true)).orderBy(asc(galleryImages.sortOrder), desc(galleryImages.createdAt));
  }

  async getGalleryImagesByCategory(category: string): Promise<GalleryImage[]> {
    return await db.select().from(galleryImages).where(eq(galleryImages.category, category)).orderBy(asc(galleryImages.sortOrder), desc(galleryImages.createdAt));
  }

  async createGalleryImage(insertImage: InsertGalleryImage): Promise<GalleryImage> {
    const result = await db.insert(galleryImages).values(insertImage).returning();
    return result[0];
  }

  async updateGalleryImage(id: number, updateImage: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const result = await db
      .update(galleryImages)
      .set({ ...updateImage, updatedAt: new Date() })
      .where(eq(galleryImages.id, id))
      .returning();
    return result[0];
  }

  async reorderGalleryImages(items: { id: number; sortOrder: number }[]): Promise<boolean> {
    for (const item of items) {
      await db
        .update(galleryImages)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(galleryImages.id, item.id));
    }
    return true;
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

  async getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.stripeSessionId, stripeSessionId));
    return result[0];
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(insertOrder).returning();
    return result[0];
  }

  async updateOrder(id: number, updateOrder: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set({ ...updateOrder, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // ==================== ORDER ITEMS ====================

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(item).returning();
    return result[0];
  }

  async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    if (items.length === 0) return [];
    const result = await db.insert(orderItems).values(items).returning();
    return result;
  }

  // ==================== QUOTES ====================

  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const result = await db.select().from(quotes).where(eq(quotes.id, id));
    return result[0];
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const result = await db.insert(quotes).values(insertQuote).returning();
    return result[0];
  }

  async updateQuote(id: number, updateQuote: Partial<InsertQuote>): Promise<Quote | undefined> {
    const result = await db
      .update(quotes)
      .set({ ...updateQuote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return result[0];
  }

  // ==================== QUOTE ITEMS ====================

  async getQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }

  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const result = await db.insert(quoteItems).values(item).returning();
    return result[0];
  }

  async createQuoteItems(items: InsertQuoteItem[]): Promise<QuoteItem[]> {
    if (items.length === 0) return [];
    const result = await db.insert(quoteItems).values(items).returning();
    return result;
  }

  // ==================== DOCUMENT NUMBERING ====================

  async generateDocumentNumber(type: string): Promise<string> {
    const year = new Date().getFullYear();
    const result = await db.execute(sql`
      INSERT INTO document_counters (counter_type, year, last_number)
      VALUES (${type}, ${year}, 1)
      ON CONFLICT (counter_type, year)
      DO UPDATE SET last_number = document_counters.last_number + 1
      RETURNING last_number
    `);
    const lastNumber = (result.rows[0] as any).last_number;
    return `ES-${type}-${year}-${String(lastNumber).padStart(4, '0')}`;
  }
}

export const postgresStorage = new PostgresStorage();
