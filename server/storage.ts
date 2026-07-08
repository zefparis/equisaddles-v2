import type { Product, InsertProduct, ProductImage, InsertProductImage, GalleryImage, InsertGalleryImage, Order, InsertOrder, OrderItem, InsertOrderItem, Quote, InsertQuote, QuoteItem, InsertQuoteItem } from "@shared/schema";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Product Images
  getProductImages(productId: number): Promise<ProductImage[]>;
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  deleteProductImage(id: number): Promise<boolean>;
  setMainProductImage(productId: number, imageId: number): Promise<boolean>;

  // Gallery
  getGalleryImages(): Promise<GalleryImage[]>;
  getActiveGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImagesByCategory(category: string): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  updateGalleryImage(id: number, image: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined>;
  reorderGalleryImages(items: { id: number; sortOrder: number }[]): Promise<boolean>;
  deleteGalleryImage(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]>;

  // Quotes
  getQuotes(): Promise<Quote[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;

  // Quote Items
  getQuoteItems(quoteId: number): Promise<QuoteItem[]>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  createQuoteItems(items: InsertQuoteItem[]): Promise<QuoteItem[]>;

  // Document Numbering
  generateDocumentNumber(type: string): Promise<string>;
}

import { postgresStorage } from "./postgres-storage";
export const storage = postgresStorage;
