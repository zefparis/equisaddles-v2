import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../auth";
import { z } from "zod";
import { sendInvoiceEmail, sendQuoteEmail, sendOrderConfirmationEmail, sendShippingNotificationEmail } from "../services/brevo";
import { generateInvoicePdf, generateQuotePdf } from "../services/pdf";
import type { Order, OrderItem, Quote, QuoteItem } from "@shared/schema";

const PAYMENT_STATUSES = ["unpaid", "pending", "partially_paid", "paid", "refunded", "cancelled"];
const ORDER_STATUSES = ["draft", "confirmed", "preparing", "ready", "shipped", "delivered", "cancelled", "archived"];
const QUOTE_STATUSES = ["draft", "sent", "accepted", "refused", "expired", "converted"];
const CURRENCIES = ["EUR", "USD", "GBP", "CHF"];

const lineItemSchema = z.object({
  productId: z.number().int().positive().optional(),
  productName: z.string().trim().min(1, "Nom du produit requis").max(200),
  description: z.string().max(1000).optional(),
  quantity: z.number().int().positive("La quantité doit être positive"),
  unitPrice: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0;
  }, "Le prix unitaire ne peut pas être négatif"),
  taxRate: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0 && n <= 100;
  }, "Taux de TVA invalide").optional().default("0"),
  lineTotal: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0;
  }, "Le total ligne ne peut pas être négatif"),
});

const createManualOrderSchema = z.object({
  customerFirstName: z.string().trim().min(1, "Prénom requis").max(100),
  customerLastName: z.string().trim().min(1, "Nom requis").max(100),
  customerEmail: z.string().trim().email("Email invalide").max(254),
  customerPhone: z.string().trim().max(30).optional(),
  billingAddress: z.string().trim().max(500).optional(),
  shippingAddress: z.string().trim().max(500).optional(),
  country: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  shippingCost: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0;
  }, "Frais de port invalides").optional().default("0"),
  discountAmount: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0;
  }, "Remise invalide").optional().default("0"),
  taxRate: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0 && n <= 100;
  }, "Taux de TVA invalide").optional().default("0"),
  currency: z.enum(CURRENCIES as [string, ...string[]]).optional().default("EUR"),
  paymentStatus: z.enum(PAYMENT_STATUSES as [string, ...string[]]).optional().default("unpaid"),
  orderStatus: z.enum(ORDER_STATUSES as [string, ...string[]]).optional().default("confirmed"),
  items: z.array(lineItemSchema).min(1, "Au moins un article est requis"),
});

const createQuoteSchema = z.object({
  customerFirstName: z.string().trim().min(1, "Prénom requis").max(100),
  customerLastName: z.string().trim().min(1, "Nom requis").max(100),
  customerEmail: z.string().trim().email("Email invalide").max(254),
  customerPhone: z.string().trim().max(30).optional(),
  billingAddress: z.string().trim().max(500).optional(),
  shippingAddress: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  shippingCost: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0;
  }, "Frais de port invalides").optional().default("0"),
  discountAmount: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0;
  }, "Remise invalide").optional().default("0"),
  taxRate: z.string().refine((val) => {
    const n = parseFloat(val);
    return !isNaN(n) && n >= 0 && n <= 100;
  }, "Taux de TVA invalide").optional().default("0"),
  currency: z.enum(CURRENCIES as [string, ...string[]]).optional().default("EUR"),
  validUntil: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Au moins un article est requis"),
});

const updateOrderStatusSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES as [string, ...string[]]).optional(),
  orderStatus: z.enum(ORDER_STATUSES as [string, ...string[]]).optional(),
});

const updateShippingSchema = z.object({
  carrier: z.string().trim().min(1, "Transporteur requis").max(100),
  trackingNumber: z.string().trim().min(1, "Numéro de suivi requis").max(100),
});

const updateQuoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES as [string, ...string[]]),
});

function computeTotals(items: Array<{ unitPrice: string; quantity: number; taxRate?: string }>, shippingCost: string, discountAmount: string, taxRate: string) {
  let subtotal = 0;
  let lineTaxTotal = 0;

  for (const item of items) {
    const lineSubtotal = parseFloat(item.unitPrice) * item.quantity;
    subtotal += lineSubtotal;
    const itemTaxRate = parseFloat(item.taxRate || "0");
    if (itemTaxRate > 0) {
      lineTaxTotal += lineSubtotal * (itemTaxRate / 100);
    }
  }

  const globalTaxRate = parseFloat(taxRate || "0");
  if (globalTaxRate > 0 && lineTaxTotal === 0) {
    lineTaxTotal = subtotal * (globalTaxRate / 100);
  }

  const shipping = parseFloat(shippingCost || "0");
  const discount = parseFloat(discountAmount || "0");
  const total = subtotal - discount + shipping + lineTaxTotal;

  return {
    subtotal: subtotal.toFixed(2),
    taxAmount: lineTaxTotal.toFixed(2),
    totalAmount: Math.max(0, total).toFixed(2),
  };
}

export function registerCommerceRoutes(app: Express) {

  // ==================== ORDERS ====================

  // Get all orders with items
  app.get("/api/admin/orders", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allOrders = await storage.getOrders();
      const ordersWithItems = await Promise.all(
        allOrders.map(async (order) => {
          const items = await storage.getOrderItems(order.id);
          return { ...order, orderItems: items };
        })
      );
      res.json(ordersWithItems);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching orders: " + error.message });
    }
  });

  // Get single order with items
  app.get("/api/admin/orders/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }
      const items = await storage.getOrderItems(order.id);
      res.json({ ...order, orderItems: items });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching order: " + error.message });
    }
  });

  // Create manual order
  app.post("/api/admin/orders", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = createManualOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Données invalides",
          errors: parsed.error.errors,
        });
      }

      const data = parsed.data;
      const totals = computeTotals(data.items, data.shippingCost, data.discountAmount, data.taxRate || "0");

      const orderNumber = await storage.generateDocumentNumber("CMD");

      const customerName = `${data.customerFirstName} ${data.customerLastName}`;
      const legacyItems = JSON.stringify(data.items.map((item) => ({
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
      })));

      const order = await storage.createOrder({
        customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || "",
        customerAddress: data.billingAddress || "",
        customerCity: "",
        customerPostalCode: "",
        customerCountry: data.country || "",
        items: legacyItems,
        totalAmount: totals.totalAmount,
        shippingCost: data.shippingCost,
        status: data.paymentStatus === "paid" ? "paid" : "pending",
        orderNumber,
        source: "manual",
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        billingAddress: data.billingAddress || "",
        shippingAddress: data.shippingAddress || "",
        country: data.country || "",
        notes: data.notes || "",
        subtotal: totals.subtotal,
        discountAmount: data.discountAmount,
        taxAmount: totals.taxAmount,
        currency: data.currency,
        paymentStatus: data.paymentStatus,
        orderStatus: data.orderStatus,
      });

      // Create order items
      const orderItemsData = data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        description: item.description || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || "0",
        lineTotal: item.lineTotal,
      }));
      await storage.createOrderItems(orderItemsData);

      res.status(201).json({ ...order, orderItems: orderItemsData });
    } catch (error: any) {
      console.error("Error creating manual order:", error);
      res.status(500).json({ message: "Erreur lors de la création: " + error.message });
    }
  });

  // Update order status
  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateOrderStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Statut invalide", errors: parsed.error.errors });
      }

      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      const updates: Record<string, any> = {};
      if (parsed.data.paymentStatus) {
        updates.paymentStatus = parsed.data.paymentStatus;
        updates.status = parsed.data.paymentStatus === "paid" ? "paid" : order.status;
      }
      if (parsed.data.orderStatus) {
        updates.orderStatus = parsed.data.orderStatus;
        if (parsed.data.orderStatus === "shipped") {
          updates.shippedAt = new Date();
          updates.status = "shipped";
        } else if (parsed.data.orderStatus === "delivered") {
          updates.deliveredAt = new Date();
          updates.status = "delivered";
        }
      }

      const updated = await storage.updateOrder(id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur: " + error.message });
    }
  });

  // Update shipping info
  app.patch("/api/admin/orders/:id/shipping", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateShippingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Données invalides", errors: parsed.error.errors });
      }

      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      const updated = await storage.updateOrder(id, {
        carrier: parsed.data.carrier,
        trackingNumber: parsed.data.trackingNumber,
        orderStatus: "shipped",
        shippedAt: new Date(),
        status: "shipped",
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur: " + error.message });
    }
  });

  // Update order (general edit)
  app.patch("/api/admin/orders/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      const allowedFields = [
        "customerFirstName", "customerLastName", "customerEmail", "customerPhone",
        "billingAddress", "shippingAddress", "country", "notes",
        "shippingCost", "discountAmount", "currency", "paymentStatus", "orderStatus",
      ];

      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.customerFirstName || updates.customerLastName) {
        const fn = updates.customerFirstName || order.customerFirstName || "";
        const ln = updates.customerLastName || order.customerLastName || "";
        updates.customerName = `${fn} ${ln}`;
      }

      if (updates.customerEmail) {
        updates.customerEmail = updates.customerEmail;
      }

      const updated = await storage.updateOrder(id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur: " + error.message });
    }
  });

  // Generate invoice PDF
  app.get("/api/admin/orders/:id/invoice-pdf", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      let items = await storage.getOrderItems(id);
      if (items.length === 0) {
        // Fallback to legacy JSON items
        try {
          const legacyItems = JSON.parse(order.items);
          items = legacyItems.map((item: any, idx: number) => ({
            id: idx,
            orderId: id,
            productId: item.id || null,
            productName: item.name || "Article",
            description: "",
            quantity: item.quantity || 1,
            unitPrice: item.price || "0",
            taxRate: "0",
            lineTotal: ((parseFloat(item.price) * item.quantity) || 0).toFixed(2),
            createdAt: order.createdAt,
          })) as OrderItem[];
        } catch {
          items = [];
        }
      }

      const invoiceNumber = await storage.generateDocumentNumber("FAC");
      const pdfBuffer = await generateInvoicePdf(order, items, invoiceNumber);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="facture-${invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating invoice PDF:", error);
      res.status(500).json({ message: "Erreur génération PDF: " + error.message });
    }
  });

  // Send invoice email with PDF attachment
  app.post("/api/admin/orders/:id/send-invoice", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      let items = await storage.getOrderItems(id);
      if (items.length === 0) {
        try {
          const legacyItems = JSON.parse(order.items);
          items = legacyItems.map((item: any, idx: number) => ({
            id: idx,
            orderId: id,
            productId: item.id || null,
            productName: item.name || "Article",
            description: "",
            quantity: item.quantity || 1,
            unitPrice: item.price || "0",
            taxRate: "0",
            lineTotal: ((parseFloat(item.price) * item.quantity) || 0).toFixed(2),
            createdAt: order.createdAt,
          })) as OrderItem[];
        } catch {
          items = [];
        }
      }

      const invoiceNumber = await storage.generateDocumentNumber("FAC");
      const pdfBuffer = await generateInvoicePdf(order, items, invoiceNumber);
      const pdfBase64 = pdfBuffer.toString("base64");

      const customerName = order.customerFirstName && order.customerLastName
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerName;

      const subtotal = parseFloat(order.subtotal || order.totalAmount);
      const shipping = parseFloat(order.shippingCost || "0");
      const discount = parseFloat(order.discountAmount || "0");
      const tax = parseFloat(order.taxAmount || "0");
      const total = parseFloat(order.totalAmount);

      const orderDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString("fr-FR");

      const result = await sendInvoiceEmail(customerName, order.customerEmail, {
        orderId: order.id,
        invoiceNumber,
        items: items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        subtotal,
        shipping,
        discount,
        tax,
        total,
        address: order.customerAddress,
        city: order.customerCity,
        postalCode: order.customerPostalCode,
        country: order.customerCountry,
        orderDate,
        paymentStatus: order.paymentStatus || "unpaid",
        pdfAttachment: { name: `facture-${invoiceNumber}.pdf`, content: pdfBase64 },
      });

      res.json({
        success: result,
        message: result ? "Facture envoyée avec succès" : "Échec de l'envoi de la facture",
      });
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi: " + error.message,
      });
    }
  });

  // Send order confirmation email
  app.post("/api/admin/orders/:id/send-confirmation", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      const customerName = order.customerFirstName && order.customerLastName
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerName;

      const orderDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString("fr-FR");

      const result = await sendOrderConfirmationEmail(customerName, order.customerEmail, {
        orderNumber: order.orderNumber || `CMD-${order.id}`,
        total: parseFloat(order.totalAmount),
        orderDate,
      });

      res.json({
        success: result,
        message: result ? "Confirmation envoyée" : "Échec de l'envoi",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erreur: " + error.message });
    }
  });

  // Send shipping notification
  app.post("/api/admin/orders/:id/send-shipping-notification", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Commande introuvable" });
      }

      if (!order.carrier || !order.trackingNumber) {
        return res.status(400).json({ message: "Transporteur et numéro de suivi requis" });
      }

      const customerName = order.customerFirstName && order.customerLastName
        ? `${order.customerFirstName} ${order.customerLastName}`
        : order.customerName;

      const result = await sendShippingNotificationEmail(customerName, order.customerEmail, {
        orderNumber: order.orderNumber || `CMD-${order.id}`,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
      });

      res.json({
        success: result,
        message: result ? "Notification envoyée" : "Échec de l'envoi",
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Erreur: " + error.message });
    }
  });

  // ==================== QUOTES ====================

  // Get all quotes with items
  app.get("/api/admin/quotes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allQuotes = await storage.getQuotes();
      const quotesWithItems = await Promise.all(
        allQuotes.map(async (quote) => {
          const items = await storage.getQuoteItems(quote.id);
          return { ...quote, quoteItems: items };
        })
      );
      res.json(quotesWithItems);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching quotes: " + error.message });
    }
  });

  // Get single quote with items
  app.get("/api/admin/quotes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(parseInt(req.params.id));
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }
      const items = await storage.getQuoteItems(quote.id);
      res.json({ ...quote, quoteItems: items });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching quote: " + error.message });
    }
  });

  // Create quote
  app.post("/api/admin/quotes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = createQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Données invalides",
          errors: parsed.error.errors,
        });
      }

      const data = parsed.data;
      const totals = computeTotals(data.items, data.shippingCost, data.discountAmount, data.taxRate || "0");
      const quoteNumber = await storage.generateDocumentNumber("DEV");

      const validUntil = data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const quote = await storage.createQuote({
        quoteNumber,
        status: "draft",
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || "",
        billingAddress: data.billingAddress || "",
        shippingAddress: data.shippingAddress || "",
        notes: data.notes || "",
        subtotal: totals.subtotal,
        shippingCost: data.shippingCost,
        discountAmount: data.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        currency: data.currency,
        validUntil,
      });

      const quoteItemsData = data.items.map((item) => ({
        quoteId: quote.id,
        productId: item.productId,
        productName: item.productName,
        description: item.description || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || "0",
        lineTotal: item.lineTotal,
      }));
      await storage.createQuoteItems(quoteItemsData);

      res.status(201).json({ ...quote, quoteItems: quoteItemsData });
    } catch (error: any) {
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Erreur lors de la création du devis: " + error.message });
    }
  });

  // Update quote status
  app.patch("/api/admin/quotes/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const parsed = updateQuoteStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Statut invalide", errors: parsed.error.errors });
      }

      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }

      const updated = await storage.updateQuote(id, { status: parsed.data.status });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur: " + error.message });
    }
  });

  // Update quote (general edit)
  app.patch("/api/admin/quotes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }

      const allowedFields = [
        "customerFirstName", "customerLastName", "customerEmail", "customerPhone",
        "billingAddress", "shippingAddress", "notes",
        "shippingCost", "discountAmount", "currency", "validUntil",
      ];

      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (updates.validUntil) {
        updates.validUntil = new Date(updates.validUntil);
      }

      const updated = await storage.updateQuote(id, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: "Erreur: " + error.message });
    }
  });

  // Duplicate quote
  app.post("/api/admin/quotes/:id/duplicate", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }

      const items = await storage.getQuoteItems(id);
      const quoteNumber = await storage.generateDocumentNumber("DEV");

      const newQuote = await storage.createQuote({
        quoteNumber,
        status: "draft",
        customerFirstName: quote.customerFirstName,
        customerLastName: quote.customerLastName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone || "",
        billingAddress: quote.billingAddress || "",
        shippingAddress: quote.shippingAddress || "",
        notes: quote.notes || "",
        subtotal: quote.subtotal || "0",
        shippingCost: quote.shippingCost || "0",
        discountAmount: quote.discountAmount || "0",
        taxAmount: quote.taxAmount || "0",
        totalAmount: quote.totalAmount,
        currency: quote.currency || "EUR",
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const newItems = items.map((item) => ({
        quoteId: newQuote.id,
        productId: item.productId,
        productName: item.productName,
        description: item.description || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || "0",
        lineTotal: item.lineTotal,
      }));
      await storage.createQuoteItems(newItems);

      res.status(201).json({ ...newQuote, quoteItems: newItems });
    } catch (error: any) {
      res.status(500).json({ message: "Erreur: " + error.message });
    }
  });

  // Convert quote to order
  app.post("/api/admin/quotes/:id/convert", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }

      if (quote.status === "converted") {
        return res.status(400).json({ message: "Ce devis a déjà été converti" });
      }

      const items = await storage.getQuoteItems(id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Le devis ne contient aucun article" });
      }

      const orderNumber = await storage.generateDocumentNumber("CMD");
      const customerName = `${quote.customerFirstName} ${quote.customerLastName}`;

      const legacyItems = JSON.stringify(items.map((item) => ({
        id: item.productId,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
      })));

      const order = await storage.createOrder({
        customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone || "",
        customerAddress: quote.billingAddress || "",
        customerCity: "",
        customerPostalCode: "",
        customerCountry: "",
        items: legacyItems,
        totalAmount: quote.totalAmount,
        shippingCost: quote.shippingCost || "0",
        status: "pending",
        orderNumber,
        source: "quote_conversion",
        customerFirstName: quote.customerFirstName,
        customerLastName: quote.customerLastName,
        billingAddress: quote.billingAddress || "",
        shippingAddress: quote.shippingAddress || "",
        country: "",
        notes: quote.notes || "",
        subtotal: quote.subtotal || "0",
        discountAmount: quote.discountAmount || "0",
        taxAmount: quote.taxAmount || "0",
        currency: quote.currency || "EUR",
        paymentStatus: "unpaid",
        orderStatus: "confirmed",
        quoteId: quote.id,
      });

      // Copy quote items to order items
      const orderItemsData = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        description: item.description || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || "0",
        lineTotal: item.lineTotal,
      }));
      await storage.createOrderItems(orderItemsData);

      // Mark quote as converted
      await storage.updateQuote(quote.id, {
        status: "converted",
        convertedOrderId: order.id,
      });

      res.status(201).json({ ...order, orderItems: orderItemsData, quoteId: quote.id });
    } catch (error: any) {
      console.error("Error converting quote:", error);
      res.status(500).json({ message: "Erreur lors de la conversion: " + error.message });
    }
  });

  // Generate quote PDF
  app.get("/api/admin/quotes/:id/quote-pdf", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }

      const items = await storage.getQuoteItems(id);
      const pdfBuffer = await generateQuotePdf(quote, items);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="devis-${quote.quoteNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating quote PDF:", error);
      res.status(500).json({ message: "Erreur génération PDF: " + error.message });
    }
  });

  // Send quote email with PDF attachment
  app.post("/api/admin/quotes/:id/send-quote", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis introuvable" });
      }

      const items = await storage.getQuoteItems(id);
      const pdfBuffer = await generateQuotePdf(quote, items);
      const pdfBase64 = pdfBuffer.toString("base64");

      const customerName = `${quote.customerFirstName} ${quote.customerLastName}`;
      const validUntilStr = quote.validUntil
        ? new Date(quote.validUntil).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
        : "—";

      const result = await sendQuoteEmail(customerName, quote.customerEmail, {
        quoteNumber: quote.quoteNumber || `DEV-${quote.id}`,
        items: items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        subtotal: parseFloat(quote.subtotal || "0"),
        shipping: parseFloat(quote.shippingCost || "0"),
        discount: parseFloat(quote.discountAmount || "0"),
        tax: parseFloat(quote.taxAmount || "0"),
        total: parseFloat(quote.totalAmount),
        validUntil: validUntilStr,
        pdfAttachment: { name: `devis-${quote.quoteNumber}.pdf`, content: pdfBase64 },
      });

      // Mark quote as sent
      if (quote.status === "draft") {
        await storage.updateQuote(id, { status: "sent" });
      }

      res.json({
        success: result,
        message: result ? "Devis envoyé avec succès" : "Échec de l'envoi du devis",
      });
    } catch (error: any) {
      console.error("Error sending quote:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi: " + error.message,
      });
    }
  });
}
