import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "Obstacle", "Dressage", "Cross", "Mixte", "Poney", "Accessoires"
  subcategory: text("subcategory"), // For "Accessoires": "Sangles", "Etrivieres", "Etriers", "Amortisseurs", "Tapis", "Briderie", "Couvertures", "Protections"
  size: text("size").notNull(), // "16", "16.5", "17", "17.5", "18", "18.5"
  color: text("color"), // "Noir", "Marron foncé", "Marron havane", "Marron clair / Cognac", "Châtaigne", "Tabac", "Miel", "Naturel", "Chocolat", "Acajou"
  condition: text("condition"), // "neuve", "occasion"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  image: text("image").notNull(),
  images: text("images").array().default([]),
  featured: boolean("featured").default(false), // true = Affiché en page d'accueil
  inStock: boolean("in_stock").default(true), // true = Disponible, false = Vendu
  location: text("location"), // Ville/région où se trouve l'article
  sellerContact: text("seller_contact"), // Contact du vendeur
  customSubcategory: text("custom_subcategory"), // Sous-catégorie personnalisée pour "Autre"
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  mediaType: text("media_type").notNull().default("image"), // "image" | "video" | "youtube" | "vimeo"
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  publicId: text("public_id"),
  title: text("title"),
  description: text("description"),
  alt: text("alt").notNull().default(""), // kept for backward compat
  category: text("category").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  // Legacy columns (kept for backward compatibility, always populated)
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address").notNull(),
  customerCity: text("customer_city").notNull(),
  customerPostalCode: text("customer_postal_code").notNull(),
  customerCountry: text("customer_country").notNull(),
  items: text("items").notNull(), // JSON string — kept for backward compat
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull().default("pending"), // Legacy status
  stripeSessionId: text("stripe_session_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  // New commerce columns
  orderNumber: text("order_number").unique(),
  source: text("source").notNull().default("stripe"), // stripe | manual | quote_conversion
  customerFirstName: text("customer_first_name"),
  customerLastName: text("customer_last_name"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  country: text("country"),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").notNull().default("EUR"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  orderStatus: text("order_status").notNull().default("draft"),
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  quoteId: integer("quote_id"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").unique(),
  status: text("status").notNull().default("draft"), // draft | sent | accepted | refused | expired | converted
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("EUR"),
  validUntil: timestamp("valid_until"),
  convertedOrderId: integer("converted_order_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(),
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentCounters = pgTable("document_counters", {
  id: serial("id").primaryKey(),
  counterType: text("counter_type").notNull(), // CMD | FAC | DEV
  year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
});

export const shippingRates = pgTable("shipping_rates", {
  id: serial("id").primaryKey(),
  zone: text("zone").notNull(),
  service: text("service").notNull(),
  minWeight: decimal("min_weight", { precision: 5, scale: 2 }).notNull().default("0"),
  maxWeight: decimal("max_weight", { precision: 5, scale: 2 }).notNull().default("30"),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  perKgRate: decimal("per_kg_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryTime: text("delivery_time").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductImageSchema = createInsertSchema(productImages).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
  createdAt: true,
});

export const insertShippingRateSchema = createInsertSchema(shippingRates).omit({
  id: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type ShippingRate = typeof shippingRates.$inferSelect;
export type InsertShippingRate = z.infer<typeof insertShippingRateSchema>;
