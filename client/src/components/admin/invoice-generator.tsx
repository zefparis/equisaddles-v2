import { Order } from "@shared/schema";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { FileText, Download, Mail, Printer } from "lucide-react";
import { useState } from "react";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";

interface InvoiceGeneratorProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceGenerator({ order, open, onOpenChange }: InvoiceGeneratorProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const formatDate = (date: Date | string | null) => {
    if (!date) return new Date().toLocaleDateString('fr-FR');
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getItems = () => {
    try {
      return JSON.parse(order.items);
    } catch {
      return [];
    }
  };

  const items = getItems();
  const subtotal = items.reduce((sum: number, item: any) => 
    sum + (parseFloat(item.price) * item.quantity), 0
  );
  const shipping = parseFloat(order.shippingCost || "0");
  const total = parseFloat(order.totalAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Facture #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 40px; }
            .company { font-size: 24px; font-weight: bold; color: #1e40af; }
            .invoice-title { font-size: 20px; margin-top: 10px; }
            .info-section { display: flex; justify-content: space-between; margin: 30px 0; }
            .info-block h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
            .info-block p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-final { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">Equi Saddles</div>
            <div class="invoice-title">FACTURE #${order.id}</div>
            <p>Date: ${formatDate(order.createdAt)}</p>
          </div>

          <div class="info-section">
            <div class="info-block">
              <h3>FACTURER À:</h3>
              <p><strong>${order.customerName}</strong></p>
              <p>${order.customerEmail}</p>
              <p>${order.customerPhone || ''}</p>
            </div>
            <div class="info-block">
              <h3>ADRESSE DE LIVRAISON:</h3>
              <p>${order.customerAddress}</p>
              <p>${order.customerCity}, ${order.customerPostalCode}</p>
              <p>${order.customerCountry}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${parseFloat(item.price).toFixed(2)} €</td>
                  <td>${(parseFloat(item.price) * item.quantity).toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Sous-total:</span>
              <span>${subtotal.toFixed(2)} €</span>
            </div>
            <div class="totals-row">
              <span>Frais de port:</span>
              <span>${shipping.toFixed(2)} €</span>
            </div>
            <div class="totals-row total-final">
              <span>TOTAL:</span>
              <span>${total.toFixed(2)} €</span>
            </div>
          </div>

          <div class="footer">
            <p>Merci pour votre commande !</p>
            <p>Pour toute question, contactez-nous à contact@equisaddles.com</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSendEmail = async () => {
    setSending(true);
    try {
      await apiRequest("POST", "/api/send-invoice", {
        orderId: order.id,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
      });
      
      toast({
        title: "Facture envoyée",
        description: `La facture a été envoyée à ${order.customerEmail}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la facture: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Facture #{order.id}</DialogTitle>
        </DialogHeader>

        {/* Preview de la facture */}
        <div className="border rounded-lg p-8 bg-white text-black print:border-0">
          {/* En-tête */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">Equi Saddles</h1>
            <h2 className="text-xl font-semibold">FACTURE #{order.id}</h2>
            <p className="text-gray-600 mt-2">Date: {formatDate(order.createdAt)}</p>
          </div>

          {/* Informations client et livraison */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">FACTURER À:</h3>
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-sm">{order.customerEmail}</p>
              {order.customerPhone && <p className="text-sm">{order.customerPhone}</p>}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">ADRESSE DE LIVRAISON:</h3>
              <p className="text-sm">{order.customerAddress}</p>
              <p className="text-sm">{order.customerCity}, {order.customerPostalCode}</p>
              <p className="text-sm">{order.customerCountry}</p>
            </div>
          </div>

          {/* Articles */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 font-semibold">Article</th>
                <th className="text-center py-3 font-semibold">Quantité</th>
                <th className="text-right py-3 font-semibold">Prix unitaire</th>
                <th className="text-right py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3">{item.name}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{parseFloat(item.price).toFixed(2)} €</td>
                  <td className="py-3 text-right">{(parseFloat(item.price) * item.quantity).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="flex justify-between py-2">
                <span>Sous-total:</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Frais de port:</span>
                <span>{shipping.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-black font-bold text-lg">
                <span>TOTAL:</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="text-center text-sm text-gray-600 pt-8 border-t">
            <p className="mb-2">Merci pour votre commande !</p>
            <p>Pour toute question, contactez-nous à contact@equisaddles.com</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-4 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button onClick={handleSendEmail} disabled={sending}>
            <Mail className="h-4 w-4 mr-2" />
            {sending ? "Envoi..." : "Envoyer par email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
