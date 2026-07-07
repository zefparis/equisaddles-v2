import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { registerUploadRoutes } from "./routes/upload";
import { registerCloudinaryUploadRoutes } from "./routes/upload-cloudinary";
import { registerMigrationRoutes } from "./routes/migrations";
import { registerAuthRoutes, requireAdmin } from "./auth";
import { insertProductSchema, insertGalleryImageSchema, insertProductImageSchema, insertOrderSchema } from "@shared/schema";
import { sendContactFormEmail, sendInvoiceEmail } from "./services/brevo";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { calculateShipping, isAllowedCountry, ALLOWED_COUNTRIES } from "@shared/shipping";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found. Please set it in environment variables.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Register auth routes (login, logout, session check)
  registerAuthRoutes(app);

  // Register migration routes (protected with requireAdmin inside)
  registerMigrationRoutes(app);
  
  // Register upload routes (Cloudinary for persistent storage)
  registerCloudinaryUploadRoutes(app);
  
  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { category, featured } = req.query;
      let products;
      
      if (featured === 'true') {
        products = await storage.getFeaturedProducts();
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching products: " + error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching product: " + error.message });
    }
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating product: " + error.message });
    }
  });

  app.put("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(parseInt(req.params.id), validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating product: " + error.message });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProduct(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting product: " + error.message });
    }
  });

  // Product Images API
  app.get("/api/products/:productId/images", async (req, res) => {
    try {
      const images = await storage.getProductImages(parseInt(req.params.productId));
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching product images: " + error.message });
    }
  });

  app.post("/api/products/:productId/images", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      // Enforce max 5 images per product
      const existing = await storage.getProductImages(productId);
      if (existing && existing.length >= 5) {
        return res.status(400).json({ message: "Maximum 5 images par produit." });
      }

      const validatedData = insertProductImageSchema.parse({
        productId,
        ...req.body
      });
      const image = await storage.createProductImage(validatedData);
      res.status(201).json(image);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating product image: " + error.message });
    }
  });

  app.delete("/api/products/:productId/images/:imageId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProductImage(parseInt(req.params.imageId));
      if (!success) {
        return res.status(404).json({ message: "Product image not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting product image: " + error.message });
    }
  });

  app.put("/api/products/:productId/images/:imageId/main", requireAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const imageId = parseInt(req.params.imageId);
      const success = await storage.setMainProductImage(productId, imageId);
      if (!success) {
        return res.status(404).json({ message: "Product image not found" });
      }
      res.json({ message: "Main image updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error updating main image: " + error.message });
    }
  });

  // Gallery API
  app.get("/api/gallery", async (req, res) => {
    try {
      const { category } = req.query;
      let images;
      
      if (category) {
        images = await storage.getGalleryImagesByCategory(category as string);
      } else {
        images = await storage.getGalleryImages();
      }
      
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching gallery images: " + error.message });
    }
  });

  app.post("/api/gallery", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertGalleryImageSchema.parse(req.body);
      const image = await storage.createGalleryImage(validatedData);
      res.status(201).json(image);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating gallery image: " + error.message });
    }
  });

  app.delete("/api/gallery/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteGalleryImage(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting gallery image: " + error.message });
    }
  });

  // Orders API
  app.get("/api/orders", requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching orders: " + error.message });
    }
  });

  app.get("/api/orders/:id", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching order: " + error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating order: " + error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { items, customerInfo } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }

      if (!customerInfo || !customerInfo.country) {
        return res.status(400).json({ message: "Country is required" });
      }

      if (!isAllowedCountry(customerInfo.country)) {
        return res.status(400).json({ message: "Country not supported for shipping" });
      }

      // Server-side price calculation: fetch products from DB, ignore client prices
      let subtotal = 0;
      const validatedItems: Array<{ id: number; name: string; price: string; quantity: number; imageUrl: string | null }> = [];

      for (const item of items) {
        const product = await storage.getProduct(item.id);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.id} not found` });
        }
        const unitPrice = parseFloat(product.price);
        subtotal += unitPrice * item.quantity;
        const validImageUrl = product.image && 
          (product.image.startsWith('http://') || product.image.startsWith('https://')) 
          ? product.image : null;
        validatedItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          imageUrl: validImageUrl,
        });
      }

      const shippingCost = calculateShipping(subtotal, customerInfo.country);
      const totalAmount = subtotal + shippingCost;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: validatedItems.map((item) => {
          return {
            price_data: {
              currency: 'eur',
              product_data: {
                name: item.name,
                images: item.imageUrl ? [item.imageUrl] : [],
              },
              unit_amount: Math.round(parseFloat(item.price) * 100),
            },
            quantity: item.quantity,
          };
        }),
        mode: 'payment',
        success_url: `${req.headers.origin}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/cart`,
        metadata: {
          customerInfo: JSON.stringify({
            ...customerInfo,
            items: validatedItems.map((item) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl
            })),
            shippingCost: shippingCost.toFixed(2),
          })
        },
        shipping_address_collection: {
          allowed_countries: [...ALLOWED_COUNTRIES],
        },
        shipping_options: shippingCost > 0 ? [{
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shippingCost * 100), currency: 'eur' },
            display_name: 'Livraison standard',
          },
        }] : [],
      });

      res.json({ 
        clientSecret: session.url, 
        sessionId: session.id,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        total: totalAmount.toFixed(2),
      });
    } catch (error: any) {
      console.error("Error creating payment session:", error);
      res.status(500).json({ message: "Error creating payment session: " + error.message });
    }
  });

  // NOTE: The Stripe webhook is registered in server/index.ts BEFORE express.json()
  // so it receives the raw body. The handler is exported as registerStripeWebhook below.


  // Contact form route
  const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 messages per window per IP
    message: { success: false, message: "Trop de messages envoyés. Veuillez réessayer plus tard." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const contactSchema = z.object({
    name: z.string().trim().min(2, "Nom trop court").max(100, "Nom trop long"),
    email: z.string().trim().email("Format d'email invalide").max(254),
    subject: z.string().trim().min(2, "Sujet trop court").max(200, "Sujet trop long"),
    message: z.string().trim().min(10, "Message trop court").max(5000, "Message trop long"),
  });

  app.post("/api/contact", contactLimiter, async (req, res) => {
    try {
      const parsed = contactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || "Données invalides",
        });
      }

      const { name, email, subject, message } = parsed.data;
      const result = await sendContactFormEmail(name, email, subject, message);

      if (!result) {
        return res.status(502).json({
          success: false,
          message: "Échec de l'envoi du message. Veuillez réessayer plus tard.",
        });
      }

      res.json({
        success: true,
        message: "Message envoyé avec succès",
      });
    } catch (error: any) {
      console.error("Error sending contact form email:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi du message. Veuillez réessayer plus tard.",
      });
    }
  });

  // Verify Stripe session and create order if not exists (backup for webhook)
  app.post("/api/verify-session", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Idempotency: check if order already exists for this session
      const existingOrder = await storage.getOrderByStripeSessionId(sessionId);
      
      if (existingOrder) {
        return res.json({ 
          success: true, 
          message: "Order already exists",
          orderId: existingOrder.id 
        });
      }

      // Retrieve the session from Stripe to verify payment
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ 
          message: "Payment not completed",
          status: session.payment_status 
        });
      }

      const customerInfo = session.metadata?.customerInfo ? 
        JSON.parse(session.metadata.customerInfo) : {};

      const orderData = {
        customerName: session.customer_details?.name || 
          (customerInfo.firstName && customerInfo.lastName ? 
            `${customerInfo.firstName} ${customerInfo.lastName}` : ""),
        customerEmail: session.customer_details?.email || customerInfo.email || "",
        customerPhone: session.customer_details?.phone || customerInfo.phone || "",
        customerAddress: session.customer_details?.address?.line1 || customerInfo.address || "",
        customerCity: session.customer_details?.address?.city || customerInfo.city || "",
        customerPostalCode: session.customer_details?.address?.postal_code || customerInfo.postalCode || "",
        customerCountry: session.customer_details?.address?.country || customerInfo.country || "",
        items: JSON.stringify(customerInfo.items || []),
        totalAmount: (session.amount_total! / 100).toString(),
        shippingCost: session.total_details?.amount_shipping ? 
          (session.total_details.amount_shipping / 100).toString() : "0",
        status: "paid",
        stripeSessionId: session.id,
      };

      try {
        const order = await storage.createOrder(orderData);
        console.log(`[orders] Order ${order.id} created via session verification`);
        
        res.json({ 
          success: true, 
          message: "Order created successfully",
          orderId: order.id 
        });
      } catch (createError: any) {
        // PostgreSQL unique_violation (code 23505) — race condition with webhook
        if (createError.code === '23505') {
          const raceOrder = await storage.getOrderByStripeSessionId(sessionId);
          if (raceOrder) {
            return res.json({ 
              success: true, 
              message: "Order already exists",
              orderId: raceOrder.id 
            });
          }
        }
        // Re-throw non-23505 errors
        throw createError;
      }
    } catch (error: any) {
      console.error("Error verifying session:", error);
      res.status(500).json({ message: "Error verifying session: " + error.message });
    }
  });

  // Send invoice email
  app.post("/api/send-invoice", requireAdmin, async (req, res) => {
    try {
      const { orderId, customerEmail, customerName } = req.body;
      
      if (!orderId || !customerEmail || !customerName) {
        return res.status(400).json({ 
          success: false,
          message: "Données manquantes" 
        });
      }

      // Récupérer la commande depuis la base de données
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ 
          success: false,
          message: "Commande introuvable" 
        });
      }

      // Parser les items
      let items = [];
      try {
        items = JSON.parse(order.items);
      } catch (e) {
        items = [];
      }

      // Calculer les totaux
      const subtotal = items.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      );
      const shipping = parseFloat(order.shippingCost || "0");
      const total = parseFloat(order.totalAmount);

      // Formater la date
      const orderDate = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('fr-FR');

      // Envoyer l'email
      const result = await sendInvoiceEmail(customerName, customerEmail, {
        orderId: order.id,
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        shipping,
        total,
        address: order.customerAddress,
        city: order.customerCity,
        postalCode: order.customerPostalCode,
        country: order.customerCountry,
        orderDate
      });

      res.json({ 
        success: result,
        message: result ? "Facture envoyée avec succès" : "Échec de l'envoi de la facture"
      });
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ 
        success: false,
        message: "Erreur lors de l'envoi de la facture: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Stripe webhook handler — exported and registered in server/index.ts BEFORE express.json()
// so that req.body is a raw Buffer for signature verification.
export async function registerStripeWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    if (!stripe) {
      console.error("[webhook] Stripe is not configured");
      res.status(500).json({ message: "Stripe is not configured" });
      return;
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error("[webhook] No Stripe signature found");
      res.status(400).json({ message: "No signature provided" });
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    // In production, STRIPE_WEBHOOK_SECRET is mandatory
    if (!webhookSecret) {
      if (isProduction) {
        console.error("[webhook] STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook in production");
        res.status(500).json({ message: "Webhook secret not configured" });
        return;
      }
      // Dev mode only: log warning but still reject — never accept unsigned webhooks
      console.warn("[webhook] STRIPE_WEBHOOK_SECRET not configured — rejecting unsigned webhook (dev mode)");
      res.status(400).json({ message: "Webhook secret not configured" });
      return;
    }

    // Verify signature with raw body
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error("[webhook] Signature verification failed:", err.message);
      res.status(400).json({ message: "Webhook signature verification failed" });
      return;
    }

    // Process verified events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Idempotency: check if order already exists for this session
        const existingOrder = await storage.getOrderByStripeSessionId(session.id);

        if (existingOrder) {
          console.log(`[webhook] Order already exists for session ${session.id}`);
          break;
        }

        const customerInfo = session.metadata?.customerInfo
          ? JSON.parse(session.metadata.customerInfo)
          : {};

        const orderData = {
          customerName: session.customer_details?.name || customerInfo.name || "",
          customerEmail: session.customer_details?.email || customerInfo.email || "",
          customerPhone: session.customer_details?.phone || customerInfo.phone || "",
          customerAddress: session.customer_details?.address?.line1 || customerInfo.address || "",
          customerCity: session.customer_details?.address?.city || customerInfo.city || "",
          customerPostalCode: session.customer_details?.address?.postal_code || customerInfo.postalCode || "",
          customerCountry: session.customer_details?.address?.country || customerInfo.country || "",
          items: JSON.stringify(customerInfo.items || []),
          totalAmount: (session.amount_total! / 100).toString(),
          shippingCost: session.metadata?.shippingCost || "0",
          status: "paid",
          stripeSessionId: session.id,
        };

        try {
          await storage.createOrder(orderData);
          console.log(`[webhook] Order created for session ${session.id}`);
        } catch (createError: any) {
          // PostgreSQL unique_violation (code 23505) — race condition with verify-session
          if (createError.code === '23505') {
            const raceOrder = await storage.getOrderByStripeSessionId(session.id);
            if (raceOrder) {
              console.log(`[webhook] Order already created by verify-session for session ${session.id}`);
              break;
            }
          }
          // Re-throw non-23505 errors
          throw createError;
        }
        break;
      }

      case 'checkout.session.async_payment_succeeded':
        console.log(`[webhook] Async payment succeeded for session: ${event.data.object.id}`);
        break;

      case 'checkout.session.async_payment_failed':
        console.log(`[webhook] Async payment failed for session: ${event.data.object.id}`);
        break;

      default:
        // Unhandled event — acknowledge but don't process
        break;
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[webhook] Processing error:", error.message);
    res.status(500).json({ message: "Webhook error" });
  }
}