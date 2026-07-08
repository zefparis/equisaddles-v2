import PDFDocument from "pdfkit";
import type { Order, OrderItem, Quote, QuoteItem } from "@shared/schema";

const COMPANY = {
  name: "Equi Saddles",
  address: "Rue du Vicinal 9, 4141 Louveigné, Belgique",
  phone: "+32 496 94 41 25",
  email: "contact@equisaddles.com",
  website: "www.equisaddles.com",
};

const PAGE_WIDTH = 595.28; // A4 in points
const MARGIN = 50;

function formatCurrency(amount: string | number | null | undefined, currency = "EUR"): string {
  const val = parseFloat(String(amount || "0"));
  const symbol = currency === "EUR" ? "€" : currency;
  return `${val.toFixed(2)} ${symbol}`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface PdfLineItem {
  productName: string;
  description?: string | null;
  quantity: number;
  unitPrice: string | number;
  taxRate?: string | number | null;
  lineTotal: string | number;
}

interface PdfDocumentData {
  documentNumber: string;
  date: Date | string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  items: PdfLineItem[];
  subtotal: string | number;
  shippingCost: string | number;
  discountAmount: string | number;
  taxAmount: string | number;
  totalAmount: string | number;
  currency: string;
  paymentStatus?: string;
  orderNumber?: string | null;
  notes?: string | null;
  validUntil?: Date | string | null;
  isQuote?: boolean;
}

function generatePdf(data: PdfDocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: MARGIN, right: MARGIN },
      info: {
        Title: data.isQuote ? `Devis ${data.documentNumber}` : `Facture ${data.documentNumber}`,
        Author: COMPANY.name,
        Subject: data.isQuote ? "Devis" : "Facture",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = PAGE_WIDTH - MARGIN * 2;
    const isQuote = data.isQuote;
    const docTitle = isQuote ? "DEVIS" : "FACTURE";

    // ===== Header =====
    doc.fontSize(24).fillColor("#1e40af").text(COMPANY.name, MARGIN, 50);
    doc.fontSize(9).fillColor("#666")
      .text(COMPANY.address, MARGIN, 80)
      .text(`Tél: ${COMPANY.phone} | Email: ${COMPANY.email}`)
      .text(COMPANY.website);

    // Document title (right aligned)
    doc.fontSize(20).fillColor("#333")
      .text(docTitle, MARGIN, 50, { width: contentWidth, align: "right" });
    doc.fontSize(12).fillColor("#666")
      .text(`N° ${data.documentNumber}`, MARGIN, 75, { width: contentWidth, align: "right" })
      .text(`Date: ${formatDate(data.date)}`, MARGIN, 92, { width: contentWidth, align: "right" });

    if (isQuote && data.validUntil) {
      doc.text(`Valable jusqu'au: ${formatDate(data.validUntil)}`, MARGIN, 109, { width: contentWidth, align: "right" });
    }

    if (!isQuote && data.orderNumber) {
      doc.text(`Réf. commande: ${data.orderNumber}`, MARGIN, 109, { width: contentWidth, align: "right" });
    }

    // ===== Separator line =====
    const sepY = isQuote ? 130 : 130;
    doc.moveTo(MARGIN, sepY).lineTo(PAGE_WIDTH - MARGIN, sepY).strokeColor("#ddd").lineWidth(1).stroke();

    // ===== Customer info =====
    let y = sepY + 20;
    doc.fontSize(10).fillColor("#999").text("FACTURER À:", MARGIN, y);
    doc.fontSize(11).fillColor("#333")
      .text(data.customerName, MARGIN, y + 15)
      .text(data.customerEmail, MARGIN, y + 30);
    if (data.customerPhone) {
      doc.text(data.customerPhone, MARGIN, y + 45);
    }
    if (data.billingAddress) {
      doc.fontSize(9).fillColor("#666").text(data.billingAddress, MARGIN, y + 60, { width: contentWidth * 0.45 });
    }

    // Shipping address (right column)
    if (data.shippingAddress && data.shippingAddress !== data.billingAddress) {
      doc.fontSize(10).fillColor("#999").text("LIVRAISON:", MARGIN + contentWidth * 0.5, y);
      doc.fontSize(9).fillColor("#666").text(data.shippingAddress, MARGIN + contentWidth * 0.5, y + 15, { width: contentWidth * 0.5 });
    }

    // ===== Items table =====
    y = y + 100;
    const tableTop = y;
    const colX = {
      name: MARGIN,
      qty: MARGIN + contentWidth * 0.45,
      price: MARGIN + contentWidth * 0.60,
      tax: MARGIN + contentWidth * 0.75,
      total: MARGIN + contentWidth * 0.88,
    };

    // Table header
    doc.fontSize(9).fillColor("#fff").rect(MARGIN, y, contentWidth, 22).fill("#1e40af");
    doc.fillColor("#fff")
      .text("Article", colX.name + 5, y + 6)
      .text("Qté", colX.qty, y + 6, { width: 40, align: "center" })
      .text("Prix unit.", colX.price, y + 6, { width: 60, align: "right" })
      .text("TVA", colX.tax, y + 6, { width: 40, align: "center" })
      .text("Total", colX.total, y + 6, { width: 60, align: "right" });

    y += 22;

    // Table rows
    for (const item of data.items) {
      const rowHeight = Math.max(25, Math.ceil((item.description ? 2 : 1) * 12) + 10);

      if (y + rowHeight > 750) {
        doc.addPage();
        y = 50;
      }

      // Alternate row background
      if (Math.floor(y - tableTop) / 22 % 2 === 0) {
        doc.rect(MARGIN, y, contentWidth, rowHeight).fill("#f8f9fa");
      }

      doc.fontSize(9).fillColor("#333")
        .text(item.productName, colX.name + 5, y + 4, { width: colX.qty - colX.name - 10 });
      if (item.description) {
        doc.fontSize(8).fillColor("#999")
          .text(item.description, colX.name + 5, y + 18, { width: colX.qty - colX.name - 10 });
      }
      doc.fillColor("#333")
        .text(String(item.quantity), colX.qty, y + 4, { width: 40, align: "center" })
        .text(formatCurrency(item.unitPrice, data.currency), colX.price, y + 4, { width: 60, align: "right" })
        .text(`${parseFloat(String(item.taxRate || "0"))}%`, colX.tax, y + 4, { width: 40, align: "center" })
        .text(formatCurrency(item.lineTotal, data.currency), colX.total, y + 4, { width: 60, align: "right" });

      y += rowHeight;
    }

    // Table border
    doc.rect(MARGIN, tableTop, contentWidth, y - tableTop).strokeColor("#ddd").lineWidth(0.5).stroke();

    // ===== Totals =====
    y += 20;
    const totalsX = MARGIN + contentWidth * 0.55;
    const totalsWidth = contentWidth * 0.45 - 10;

    doc.fontSize(10).fillColor("#555")
      .text("Sous-total:", totalsX, y, { width: totalsWidth - 80, align: "left" })
      .text(formatCurrency(data.subtotal, data.currency), totalsX + totalsWidth - 80, y, { width: 80, align: "right" });

    y += 18;
    if (parseFloat(String(data.discountAmount || "0")) > 0) {
      doc.fillColor("#555")
        .text("Remise:", totalsX, y, { width: totalsWidth - 80, align: "left" })
        .text(`- ${formatCurrency(data.discountAmount, data.currency)}`, totalsX + totalsWidth - 80, y, { width: 80, align: "right" });
      y += 18;
    }

    doc.fillColor("#555")
      .text("Frais de port:", totalsX, y, { width: totalsWidth - 80, align: "left" })
      .text(formatCurrency(data.shippingCost, data.currency), totalsX + totalsWidth - 80, y, { width: 80, align: "right" });

    y += 18;
    if (parseFloat(String(data.taxAmount || "0")) > 0) {
      doc.fillColor("#555")
        .text("TVA:", totalsX, y, { width: totalsWidth - 80, align: "left" })
        .text(formatCurrency(data.taxAmount, data.currency), totalsX + totalsWidth - 80, y, { width: 80, align: "right" });
      y += 18;
    }

    // Total line
    y += 5;
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsWidth, y).strokeColor("#333").lineWidth(1.5).stroke();
    y += 8;
    doc.fontSize(14).fillColor("#1e40af").font("Helvetica-Bold")
      .text("TOTAL:", totalsX, y, { width: totalsWidth - 80, align: "left" })
      .text(formatCurrency(data.totalAmount, data.currency), totalsX + totalsWidth - 80, y, { width: 80, align: "right" });
    doc.font("Helvetica");

    // Payment status (invoice only)
    if (!isQuote && data.paymentStatus) {
      y += 25;
      const statusLabel = data.paymentStatus === "paid" ? "PAYÉ" :
        data.paymentStatus === "partially_paid" ? "PARTIELLEMENT PAYÉ" :
        data.paymentStatus === "refunded" ? "REMBOURSÉ" :
        data.paymentStatus === "cancelled" ? "ANNULÉ" : "NON PAYÉ";
      const statusColor = data.paymentStatus === "paid" ? "#16a34a" :
        data.paymentStatus === "cancelled" || data.paymentStatus === "refunded" ? "#dc2626" : "#ea580c";
      doc.fontSize(11).fillColor(statusColor).font("Helvetica-Bold")
        .text(`Statut: ${statusLabel}`, MARGIN, y);
      doc.font("Helvetica");
    }

    // ===== Notes =====
    if (data.notes) {
      y += 30;
      doc.fontSize(9).fillColor("#999").text("Notes:", MARGIN, y);
      doc.fillColor("#555").text(data.notes, MARGIN, y + 14, { width: contentWidth });
    }

    // ===== Footer =====
    const footerY = 780;
    doc.moveTo(MARGIN, footerY).lineTo(PAGE_WIDTH - MARGIN, footerY).strokeColor("#ddd").lineWidth(0.5).stroke();

    doc.fontSize(8).fillColor("#999")
      .text(COMPANY.name, MARGIN, footerY + 10)
      .text(COMPANY.address, MARGIN, footerY + 22)
      .text(`Tél: ${COMPANY.phone} | Email: ${COMPANY.email} | ${COMPANY.website}`, MARGIN, footerY + 34);

    // Legal mentions
    if (isQuote) {
      doc.fillColor("#999")
        .text("Ce document est un devis et ne constitue pas une facture. Les prix indiqués sont valables jusqu'à la date de validité mentionnée ci-dessus.",
          MARGIN, footerY + 50, { width: contentWidth })
        .text("Bon pour accord — Signature du client:", MARGIN, footerY + 68)
        .text("_______________________________", MARGIN, footerY + 82);
    } else {
      doc.fillColor("#999")
        .text("Conditions de paiement: Paiement à réception de la facture. Retard de paiement: intérêts au taux légal.",
          MARGIN, footerY + 50, { width: contentWidth })
        .text("Pour toute question concernant cette facture, contactez-nous à " + COMPANY.email + ".",
          MARGIN, footerY + 62, { width: contentWidth });
    }

    doc.end();
  });
}

export async function generateInvoicePdf(
  order: Order,
  items: OrderItem[],
  invoiceNumber: string
): Promise<Buffer> {
  const customerName = order.customerFirstName && order.customerLastName
    ? `${order.customerFirstName} ${order.customerLastName}`
    : order.customerName;

  return generatePdf({
    documentNumber: invoiceNumber,
    date: order.createdAt,
    customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    billingAddress: order.billingAddress || `${order.customerAddress}, ${order.customerPostalCode} ${order.customerCity}, ${order.customerCountry}`,
    shippingAddress: order.shippingAddress || `${order.customerAddress}, ${order.customerPostalCode} ${order.customerCity}, ${order.customerCountry}`,
    items: items.map((item) => ({
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal || order.totalAmount,
    shippingCost: order.shippingCost || "0",
    discountAmount: order.discountAmount || "0",
    taxAmount: order.taxAmount || "0",
    totalAmount: order.totalAmount,
    currency: order.currency || "EUR",
    paymentStatus: order.paymentStatus,
    orderNumber: order.orderNumber,
    notes: order.notes,
    isQuote: false,
  });
}

export async function generateQuotePdf(
  quote: Quote,
  items: QuoteItem[]
): Promise<Buffer> {
  const customerName = `${quote.customerFirstName} ${quote.customerLastName}`;

  return generatePdf({
    documentNumber: quote.quoteNumber || `DEV-${quote.id}`,
    date: quote.createdAt,
    customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    billingAddress: quote.billingAddress,
    shippingAddress: quote.shippingAddress,
    items: items.map((item) => ({
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      lineTotal: item.lineTotal,
    })),
    subtotal: quote.subtotal || "0",
    shippingCost: quote.shippingCost || "0",
    discountAmount: quote.discountAmount || "0",
    taxAmount: quote.taxAmount || "0",
    totalAmount: quote.totalAmount,
    currency: quote.currency || "EUR",
    validUntil: quote.validUntil,
    notes: quote.notes,
    isQuote: true,
  });
}
