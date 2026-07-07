import type { Product, InsertProduct, ProductImage, InsertProductImage, GalleryImage, InsertGalleryImage, Order, InsertOrder } from "@shared/schema";

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
  getGalleryImagesByCategory(category: string): Promise<GalleryImage[]>;
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  deleteGalleryImage(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
}

import { postgresStorage } from "./postgres-storage";
export const storage = postgresStorage;
