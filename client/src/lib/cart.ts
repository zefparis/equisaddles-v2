import { Product } from "@shared/schema";

export interface CartItem extends Product {
  quantity: number;
}

export class CartManager {
  private static STORAGE_KEY = "equi-saddles-cart";

  static getCart(): CartItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      return [];
    }
  }

  static saveCart(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }

  static addItem(product: Product, quantity: number = 1): CartItem[] {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    this.saveCart(cart);
    return cart;
  }

  static updateQuantity(id: number, quantity: number): CartItem[] {
    const cart = this.getCart();
    const item = cart.find(item => item.id === id);

    if (item) {
      if (quantity <= 0) {
        return this.removeItem(id);
      }
      item.quantity = quantity;
    }

    this.saveCart(cart);
    return cart;
  }

  static removeItem(id: number): CartItem[] {
    const cart = this.getCart().filter(item => item.id !== id);
    this.saveCart(cart);
    return cart;
  }

  static clearCart(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static getTotalAmount(items: CartItem[]): number {
    return items.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  }

  static getTotalItems(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  static calculateShipping(totalAmount: number, country: string = "FR"): number {
    if (totalAmount >= 100) return 0;
    
    switch (country) {
      case "FR":
        return 12.90;
      case "BE":
      case "NL":
      case "DE":
      case "ES":
        return 19.90;
      default:
        return 29.90;
    }
  }
}
