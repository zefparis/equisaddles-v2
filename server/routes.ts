import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { registerUploadRoutes } from "./routes/upload";
import { registerCloudinaryUploadRoutes } from "./routes/upload-cloudinary";
import { setupChatWebSocket } from "./routes/chat";
import { registerMigrationRoutes } from "./routes/migrations";
import { registerAuthRoutes, requireAdmin } from "./auth";
import { insertProductSchema, insertGalleryImageSchema, insertProductImageSchema, insertOrderSchema } from "@shared/schema";
import { sendChatNotificationToAdmin, sendChatResponseToCustomer, sendContactFormEmail, sendInvoiceEmail } from "./services/brevo";
import { chatStorage } from "./storage/chat";
import { z } from "zod";

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

      const amount = items.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: items.map((item: any) => {
          // Valider l'URL de l'image - ne l'inclure que si c'est une URL complète valide
          const validImageUrl = item.imageUrl && 
            (item.imageUrl.startsWith('http://') || item.imageUrl.startsWith('https://')) 
            ? item.imageUrl : null;
          
          return {
            price_data: {
              currency: 'eur',
              product_data: {
                name: item.name,
                images: validImageUrl ? [validImageUrl] : [],
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
            items: items.map((item: any) => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl
            }))
          })
        },
        shipping_address_collection: {
          allowed_countries: ['BE', 'FR', 'NL', 'DE', 'ES', 'IT', 'LU'],
        },
      });

      res.json({ clientSecret: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Error creating payment session:", error);
      res.status(500).json({ message: "Error creating payment session: " + error.message });
    }
  });

  // Stripe webhook - SÉCURISÉ avec validation de signature
  app.post("/webhook", async (req, res) => {
    try {
      if (!stripe) {
        console.error("Stripe not configured for webhook");
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const sig = req.headers['stripe-signature'];
      
      if (!sig) {
        console.error("No Stripe signature found in webhook request");
        return res.status(400).json({ message: "No signature provided" });
      }

      // Valider la signature du webhook pour s'assurer qu'il provient de Stripe
      let event;
      
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
          );
          console.log("✅ Webhook signature verified");
        } catch (err: any) {
          console.error("❌ Webhook signature verification failed:", err.message);
          return res.status(400).json({ message: `Webhook signature verification failed: ${err.message}` });
        }
      } else {
        // Mode développement sans webhook secret (non recommandé en production)
        console.warn("⚠️ STRIPE_WEBHOOK_SECRET not configured - webhook running without signature verification (DEV MODE ONLY)");
        event = req.body;
      }

      // Traiter les événements Stripe
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log(`Processing checkout.session.completed: ${session.id}`);
          
          const customerInfo = session.metadata?.customerInfo ? 
            JSON.parse(session.metadata.customerInfo) : {};

          const orderData = {
            customerName: session.customer_details?.name || customerInfo.name || "",
            customerEmail: session.customer_details?.email || customerInfo.email || "",
            customerPhone: session.customer_details?.phone || customerInfo.phone || "",
            customerAddress: session.customer_details?.address?.line1 || customerInfo.address || "",
            customerCity: session.customer_details?.address?.city || customerInfo.city || "",
            customerPostalCode: session.customer_details?.address?.postal_code || customerInfo.postalCode || "",
            customerCountry: session.customer_details?.address?.country || customerInfo.country || "",
            items: JSON.stringify(customerInfo.items || []),
            totalAmount: (session.amount_total / 100).toString(),
            shippingCost: session.metadata?.shippingCost || "0",
            status: "paid",
            stripeSessionId: session.id,
          };

          await storage.createOrder(orderData);
          console.log(`✅ Order created for session ${session.id}`);
          break;

        case 'checkout.session.async_payment_succeeded':
          console.log(`Async payment succeeded for session: ${event.data.object.id}`);
          // Gérer les paiements asynchrones réussis
          break;

        case 'checkout.session.async_payment_failed':
          console.log(`Async payment failed for session: ${event.data.object.id}`);
          // Gérer les paiements asynchrones échoués
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook error: " + error.message });
    }
  });


  // Test email route
  app.post("/api/test-email", requireAdmin, async (req, res) => {
    try {
      const { customerName, customerEmail, message, sessionId } = req.body;
      
      const result = await sendChatNotificationToAdmin(
        customerName || "Test Client",
        customerEmail || "test@example.com", 
        message || "Test message",
        sessionId || "test-session-123"
      );
      
      res.json({ 
        success: result,
        message: result ? "Email sent successfully" : "Failed to send email"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error sending test email: " + error.message });
    }
  });

  // Contact form route
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validation
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ 
          success: false,
          message: "Tous les champs sont requis" 
        });
      }
      
      // Validation email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false,
          message: "Format d'email invalide" 
        });
      }
      
      const result = await sendContactFormEmail(name, email, subject, message);
      
      res.json({ 
        success: result,
        message: result ? "Message envoyé avec succès" : "Échec de l'envoi du message"
      });
    } catch (error: any) {
      console.error("Error sending contact form email:", error);
      res.status(500).json({ 
        success: false,
        message: "Erreur lors de l'envoi du message: " + error.message 
      });
    }
  });

  // Verify Stripe session and create order if not exists (pour dev local et backup)
  app.post("/api/verify-session", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Vérifier si la commande existe déjà
      const existingOrders = await storage.getOrders();
      const existingOrder = existingOrders.find(order => order.stripeSessionId === sessionId);
      
      if (existingOrder) {
        console.log(`ℹ️ Order already exists for session ${sessionId}`);
        return res.json({ 
          success: true, 
          message: "Order already exists",
          orderId: existingOrder.id 
        });
      }

      // Récupérer la session Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ 
          message: "Payment not completed",
          status: session.payment_status 
        });
      }

      // Créer la commande
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

      const order = await storage.createOrder(orderData);
      console.log(`✅ Order ${order.id} created via session verification (dev/backup mode)`);
      
      res.json({ 
        success: true, 
        message: "Order created successfully",
        orderId: order.id 
      });
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

  // API pour récupérer la session d'un utilisateur par email
  app.get("/api/chat/user-session", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      // Chercher une session existante pour cet email dans chatStorage
      const existingSession = await chatStorage.getChatSessionByEmail(email);
      
      if (existingSession) {
        res.json({
          sessionId: existingSession.sessionId,
          customerName: existingSession.customerName,
          customerEmail: email
        });
      } else {
        // Pas de session trouvée pour cet email
        res.status(404).json({ message: "No session found for this email" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching user session: " + error.message });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket for chat
  setupChatWebSocket(httpServer, app);
  
  return httpServer;
}