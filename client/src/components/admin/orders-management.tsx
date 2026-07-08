import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/use-toast";
import { apiRequest } from "../../lib/queryClient";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import {
  ShoppingCart, Search, Plus, FileText, Eye, Truck, Mail,
  ChevronLeft, ChevronRight, Package, FileSpreadsheet, Copy,
  CheckCircle, XCircle, Clock, AlertCircle, Download, Send
} from "lucide-react";

interface OrderItemData {
  id?: number;
  orderId?: number;
  productId?: number | null;
  productName: string;
  description?: string | null;
  quantity: number;
  unitPrice: string;
  taxRate?: string;
  lineTotal: string;
}

interface OrderData {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress: string;
  customerCity: string;
  customerPostalCode: string;
  customerCountry: string;
  items: string;
  totalAmount: string;
  shippingCost: string;
  status: string;
  stripeSessionId?: string | null;
  createdAt: string | null;
  orderNumber?: string | null;
  source?: string;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  country?: string | null;
  notes?: string | null;
  subtotal?: string | null;
  discountAmount?: string | null;
  taxAmount?: string | null;
  currency?: string;
  paymentStatus?: string;
  orderStatus?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  quoteId?: number | null;
  orderItems?: OrderItemData[];
}

interface QuoteItemData {
  id?: number;
  quoteId?: number;
  productId?: number | null;
  productName: string;
  description?: string | null;
  quantity: number;
  unitPrice: string;
  taxRate?: string;
  lineTotal: string;
}

interface QuoteData {
  id: number;
  quoteNumber?: string | null;
  status: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  subtotal?: string | null;
  shippingCost?: string | null;
  discountAmount?: string | null;
  taxAmount?: string | null;
  totalAmount: string;
  currency?: string;
  validUntil?: string | null;
  convertedOrderId?: number | null;
  createdAt: string | null;
  quoteItems?: QuoteItemData[];
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Non payé", color: "bg-orange-100 text-orange-800" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  partially_paid: { label: "Partiellement payé", color: "bg-blue-100 text-blue-800" },
  paid: { label: "Payé", color: "bg-green-100 text-green-800" },
  refunded: { label: "Remboursé", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Annulé", color: "bg-gray-100 text-gray-800" },
};

const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Préparation", color: "bg-purple-100 text-purple-800" },
  ready: { label: "Prête", color: "bg-cyan-100 text-cyan-800" },
  shipped: { label: "Expédiée", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800" },
  archived: { label: "Archivée", color: "bg-gray-100 text-gray-600" },
};

const QUOTE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  sent: { label: "Envoyé", color: "bg-blue-100 text-blue-800" },
  accepted: { label: "Accepté", color: "bg-green-100 text-green-800" },
  refused: { label: "Refusé", color: "bg-red-100 text-red-800" },
  expired: { label: "Expiré", color: "bg-orange-100 text-orange-800" },
  converted: { label: "Converti", color: "bg-purple-100 text-purple-800" },
};

const ITEMS_PER_PAGE = 10;

function formatCurrency(amount: string | number | null | undefined, currency = "EUR"): string {
  const val = parseFloat(String(amount || "0"));
  const symbol = currency === "EUR" ? "€" : currency;
  return `${val.toFixed(2)} ${symbol}`;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseItems(order: OrderData): OrderItemData[] {
  if (order.orderItems && order.orderItems.length > 0) {
    return order.orderItems;
  }
  try {
    const parsed = JSON.parse(order.items);
    return parsed.map((item: any, idx: number) => ({
      id: idx,
      productName: item.name || "Article",
      quantity: item.quantity || 1,
      unitPrice: item.price || "0",
      lineTotal: ((parseFloat(item.price) * item.quantity) || 0).toFixed(2),
      taxRate: "0",
      productId: item.id || null,
      description: "",
    }));
  } catch {
    return [];
  }
}

export default function OrdersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<"orders" | "quotes">("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showQuoteDetail, setShowQuoteDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<OrderData | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderData[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery<QuoteData[]>({
    queryKey: ["/api/admin/quotes"],
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = !search ||
        order.customerName?.toLowerCase().includes(search) ||
        order.customerEmail?.toLowerCase().includes(search) ||
        order.orderNumber?.toLowerCase().includes(search) ||
        order.id.toString().includes(search);
      const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      const matchesSource = sourceFilter === "all" || order.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesPayment && matchesSource;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, sourceFilter]);

  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];
    return quotes.filter((quote) => {
      const search = searchQuery.toLowerCase();
      const matchesSearch = !search ||
        `${quote.customerFirstName} ${quote.customerLastName}`.toLowerCase().includes(search) ||
        quote.customerEmail?.toLowerCase().includes(search) ||
        quote.quoteNumber?.toLowerCase().includes(search);
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const totalPages = Math.ceil(
    (activeSubTab === "orders" ? filteredOrders.length : filteredQuotes.length) / ITEMS_PER_PAGE
  );
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const paginatedQuotes = filteredQuotes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { paymentStatus?: string; orderStatus?: string } }) => {
      return apiRequest("PATCH", `/api/admin/orders/${id}/status`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateQuoteStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/quotes/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Statut du devis mis à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const convertQuote = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/quotes/${id}/convert`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Devis converti en commande" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const duplicateQuote = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/quotes/${id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Devis dupliqué" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const sendInvoice = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/orders/${id}/send-invoice`, {});
    },
    onSuccess: (data: any) => {
      toast({ title: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const sendQuoteEmail = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/quotes/${id}/send-quote`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const sendShippingNotif = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/orders/${id}/send-shipping-notification`, {});
    },
    onSuccess: (data: any) => {
      toast({ title: data.message });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateShipping = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { carrier: string; trackingNumber: string } }) => {
      return apiRequest("PATCH", `/api/admin/orders/${id}/shipping`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      setShowShippingDialog(false);
      toast({ title: "Informations d'expédition mises à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const downloadInvoicePdf = useCallback((id: number) => {
    window.open(`/api/admin/orders/${id}/invoice-pdf`, "_blank");
  }, []);

  const downloadQuotePdf = useCallback((id: number) => {
    window.open(`/api/admin/quotes/${id}/quote-pdf`, "_blank");
  }, []);

  const handleOpenOrderDetail = (order: OrderData) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleOpenQuoteDetail = (quote: QuoteData) => {
    setSelectedQuote(quote);
    setShowQuoteDetail(true);
  };

  const handleSetShipping = (order: OrderData) => {
    setShippingOrder(order);
    setShowShippingDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Gestion commerciale</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateQuote(true)} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
          <Button onClick={() => setShowCreateOrder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle commande
          </Button>
        </div>
      </div>

      {/* Sub-tabs: Orders / Quotes */}
      <div className="flex gap-2 border-b">
        <button
          className={`pb-2 px-4 text-sm font-medium ${activeSubTab === "orders" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => { setActiveSubTab("orders"); setCurrentPage(1); setStatusFilter("all"); setPaymentFilter("all"); setSourceFilter("all"); }}
        >
          <ShoppingCart className="h-4 w-4 inline mr-1" />
          Commandes ({orders?.length || 0})
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium ${activeSubTab === "quotes" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          onClick={() => { setActiveSubTab("quotes"); setCurrentPage(1); setStatusFilter("all"); setPaymentFilter("all"); setSourceFilter("all"); }}
        >
          <FileSpreadsheet className="h-4 w-4 inline mr-1" />
          Devis ({quotes?.length || 0})
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, email, numéro..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-10"
          />
        </div>
        {activeSubTab === "orders" && (
          <>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut commande" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(ORDER_STATUS_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous paiements</SelectItem>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sources</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="manual">Manuelle</SelectItem>
                <SelectItem value="quote_conversion">Devis converti</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        {activeSubTab === "quotes" && (
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Statut devis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(QUOTE_STATUS_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Orders List */}
      {activeSubTab === "orders" && (
        <>
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
              ))}
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
              <p className="text-gray-500">Les commandes apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedOrders.map((order) => {
                const items = parseItems(order);
                const payStatus = PAYMENT_STATUS_LABELS[order.paymentStatus || "unpaid"] || PAYMENT_STATUS_LABELS.unpaid;
                const ordStatus = ORDER_STATUS_LABELS[order.orderStatus || "confirmed"] || ORDER_STATUS_LABELS.confirmed;
                return (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">
                              {order.orderNumber || `CMD-${order.id}`}
                            </h3>
                            <Badge className={payStatus.color} variant="secondary">{payStatus.label}</Badge>
                            <Badge className={ordStatus.color} variant="secondary">{ordStatus.label}</Badge>
                            {order.source === "manual" && (
                              <Badge variant="outline">Manuelle</Badge>
                            )}
                            {order.source === "quote_conversion" && (
                              <Badge variant="outline">Devis</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {order.customerFirstName && order.customerLastName
                              ? `${order.customerFirstName} ${order.customerLastName}`
                              : order.customerName} — {order.customerEmail}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(order.createdAt)} · {items.length} article(s)
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(order.totalAmount, order.currency)}
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenOrderDetail(order)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => downloadInvoicePdf(order.id)} title="Télécharger facture PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => sendInvoice.mutate(order.id)} title="Envoyer facture" disabled={sendInvoice.isPending}>
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleSetShipping(order)} title="Expédition">
                              <Truck className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Quotes List */}
      {activeSubTab === "quotes" && (
        <>
          {quotesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
              ))}
            </div>
          ) : paginatedQuotes.length === 0 ? (
            <div className="text-center py-16">
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Aucun devis</h3>
              <p className="text-gray-500">Créez un devis pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedQuotes.map((quote) => {
                const qStatus = QUOTE_STATUS_LABELS[quote.status] || QUOTE_STATUS_LABELS.draft;
                return (
                  <Card key={quote.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">
                              {quote.quoteNumber || `DEV-${quote.id}`}
                            </h3>
                            <Badge className={qStatus.color} variant="secondary">{qStatus.label}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {quote.customerFirstName} {quote.customerLastName} — {quote.customerEmail}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(quote.createdAt)} · Valable jusqu'au {formatDate(quote.validUntil)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(quote.totalAmount, quote.currency)}
                          </span>
                          <div className="flex gap-1 flex-wrap justify-end">
                            <Button size="sm" variant="ghost" onClick={() => handleOpenQuoteDetail(quote)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => downloadQuotePdf(quote.id)} title="Télécharger PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => sendQuoteEmail.mutate(quote.id)} title="Envoyer devis" disabled={sendQuoteEmail.isPending}>
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => duplicateQuote.mutate(quote.id)} title="Dupliquer">
                              <Copy className="h-4 w-4" />
                            </Button>
                            {quote.status !== "converted" && (
                              <Button size="sm" variant="outline" onClick={() => convertQuote.mutate(quote.id)} title="Convertir en commande" disabled={convertQuote.isPending}>
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create Order Dialog */}
      {showCreateOrder && (
        <CreateOrderDialog
          open={showCreateOrder}
          onOpenChange={setShowCreateOrder}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
            setShowCreateOrder(false);
            toast({ title: "Commande créée avec succès" });
          }}
        />
      )}

      {/* Create Quote Dialog */}
      {showCreateQuote && (
        <CreateQuoteDialog
          open={showCreateQuote}
          onOpenChange={setShowCreateQuote}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
            setShowCreateQuote(false);
            toast({ title: "Devis créé avec succès" });
          }}
        />
      )}

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          open={showOrderDetail}
          onOpenChange={setShowOrderDetail}
          onStatusChange={(data) => {
            updateOrderStatus.mutate({ id: selectedOrder.id, data });
          }}
          onDownloadInvoice={() => downloadInvoicePdf(selectedOrder.id)}
          onSendInvoice={() => sendInvoice.mutate(selectedOrder.id)}
          onSendShippingNotif={() => sendShippingNotif.mutate(selectedOrder.id)}
          onSetShipping={() => handleSetShipping(selectedOrder)}
        />
      )}

      {/* Quote Detail Dialog */}
      {selectedQuote && (
        <QuoteDetailDialog
          quote={selectedQuote}
          open={showQuoteDetail}
          onOpenChange={setShowQuoteDetail}
          onStatusChange={(status) => updateQuoteStatus.mutate({ id: selectedQuote.id, status })}
          onDownloadPdf={() => downloadQuotePdf(selectedQuote.id)}
          onSendEmail={() => sendQuoteEmail.mutate(selectedQuote.id)}
          onConvert={() => {
            convertQuote.mutate(selectedQuote.id);
            setShowQuoteDetail(false);
          }}
          onDuplicate={() => {
            duplicateQuote.mutate(selectedQuote.id);
            setShowQuoteDetail(false);
          }}
        />
      )}

      {/* Shipping Dialog */}
      {showShippingDialog && shippingOrder && (
        <ShippingDialog
          order={shippingOrder}
          open={showShippingDialog}
          onOpenChange={setShowShippingDialog}
          onSubmit={(data) => updateShipping.mutate({ id: shippingOrder.id, data })}
        />
      )}
    </div>
  );
}

// ==================== LINE ITEMS EDITOR ====================

function LineItemsEditor({ items, onChange }: { items: OrderItemData[]; onChange: (items: OrderItemData[]) => void }) {
  const addItem = () => {
    onChange([...items, {
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: "0",
      taxRate: "0",
      lineTotal: "0",
    }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItemData, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(String(newItems[index].quantity)) || 0;
      const price = parseFloat(String(newItems[index].unitPrice)) || 0;
      newItems[index].lineTotal = (qty * price).toFixed(2);
    }
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg">
          <div className="col-span-12 sm:col-span-4">
            <Input
              placeholder="Nom du produit"
              value={item.productName}
              onChange={(e) => updateItem(index, "productName", e.target.value)}
            />
          </div>
          <div className="col-span-4 sm:col-span-2">
            <Input
              type="number"
              min="1"
              placeholder="Qté"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="col-span-4 sm:col-span-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Prix unit."
              value={item.unitPrice}
              onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
            />
          </div>
          <div className="col-span-3 sm:col-span-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="TVA %"
              value={item.taxRate}
              onChange={(e) => updateItem(index, "taxRate", e.target.value)}
            />
          </div>
          <div className="col-span-1 sm:col-span-1">
            <span className="text-sm font-medium block pt-2">
              {formatCurrency(item.lineTotal)}
            </span>
          </div>
          <div className="col-span-12 sm:col-span-1 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => removeItem(index)}>
              <XCircle className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter un article
      </Button>
    </div>
  );
}

// ==================== CREATE ORDER DIALOG ====================

function CreateOrderDialog({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    billingAddress: "",
    shippingAddress: "",
    country: "",
    notes: "",
    shippingCost: "0",
    discountAmount: "0",
    taxRate: "0",
    currency: "EUR",
    paymentStatus: "unpaid",
    orderStatus: "confirmed",
  });
  const [items, setItems] = useState<OrderItemData[]>([{
    productName: "", description: "", quantity: 1, unitPrice: "0", taxRate: "0", lineTotal: "0",
  }]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerFirstName || !formData.customerLastName || !formData.customerEmail) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    if (items.length === 0 || items.some((i) => !i.productName)) {
      toast({ title: "Au moins un article avec un nom est requis", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/admin/orders", { ...formData, items });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle commande manuelle</DialogTitle>
          <DialogDescription>Créez une commande hors ligne (pas de paiement Stripe).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prénom *</Label>
              <Input value={formData.customerFirstName} onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })} required />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={formData.customerLastName} onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} required />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Adresse de facturation</Label>
            <Textarea value={formData.billingAddress} onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Adresse de livraison (si différente)</Label>
            <Textarea value={formData.shippingAddress} onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Pays</Label>
            <Input value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
          </div>

          <Separator />
          <div>
            <Label className="mb-2 block">Articles</Label>
            <LineItemsEditor items={items} onChange={setItems} />
          </div>

          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Frais de port</Label>
              <Input type="number" step="0.01" min="0" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })} />
            </div>
            <div>
              <Label>Remise</Label>
              <Input type="number" step="0.01" min="0" value={formData.discountAmount} onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })} />
            </div>
            <div>
              <Label>TVA %</Label>
              <Input type="number" step="0.01" min="0" max="100" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} />
            </div>
            <div>
              <Label>Devise</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Statut paiement</Label>
              <Select value={formData.paymentStatus} onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut commande</Label>
              <Select value={formData.orderStatus} onValueChange={(v) => setFormData({ ...formData, orderStatus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Création..." : "Créer la commande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== CREATE QUOTE DIALOG ====================

function CreateQuoteDialog({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerFirstName: "",
    customerLastName: "",
    customerEmail: "",
    customerPhone: "",
    billingAddress: "",
    shippingAddress: "",
    notes: "",
    shippingCost: "0",
    discountAmount: "0",
    taxRate: "0",
    currency: "EUR",
    validUntil: "",
  });
  const [items, setItems] = useState<QuoteItemData[]>([{
    productName: "", description: "", quantity: 1, unitPrice: "0", taxRate: "0", lineTotal: "0",
  }]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerFirstName || !formData.customerLastName || !formData.customerEmail) {
      toast({ title: "Champs requis manquants", variant: "destructive" });
      return;
    }
    if (items.length === 0 || items.some((i) => !i.productName)) {
      toast({ title: "Au moins un article avec un nom est requis", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/admin/quotes", { ...formData, items });
      onSuccess();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau devis</DialogTitle>
          <DialogDescription>Créez un devis pour un client. Il pourra être converti en commande.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prénom *</Label>
              <Input value={formData.customerFirstName} onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })} required />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input value={formData.customerLastName} onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} required />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Adresse de facturation</Label>
            <Textarea value={formData.billingAddress} onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Adresse de livraison (si différente)</Label>
            <Textarea value={formData.shippingAddress} onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })} rows={2} />
          </div>

          <Separator />
          <div>
            <Label className="mb-2 block">Articles</Label>
            <LineItemsEditor items={items} onChange={setItems} />
          </div>

          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Frais de port</Label>
              <Input type="number" step="0.01" min="0" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })} />
            </div>
            <div>
              <Label>Remise</Label>
              <Input type="number" step="0.01" min="0" value={formData.discountAmount} onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })} />
            </div>
            <div>
              <Label>TVA %</Label>
              <Input type="number" step="0.01" min="0" max="100" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })} />
            </div>
            <div>
              <Label>Devise</Label>
              <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Valable jusqu'au</Label>
            <Input type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Création..." : "Créer le devis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== ORDER DETAIL DIALOG ====================

function OrderDetailDialog({ order, open, onOpenChange, onStatusChange, onDownloadInvoice, onSendInvoice, onSendShippingNotif, onSetShipping }: {
  order: OrderData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (data: { paymentStatus?: string; orderStatus?: string }) => void;
  onDownloadInvoice: () => void;
  onSendInvoice: () => void;
  onSendShippingNotif: () => void;
  onSetShipping: () => void;
}) {
  const items = parseItems(order);
  const payStatus = PAYMENT_STATUS_LABELS[order.paymentStatus || "unpaid"] || PAYMENT_STATUS_LABELS.unpaid;
  const ordStatus = ORDER_STATUS_LABELS[order.orderStatus || "confirmed"] || ORDER_STATUS_LABELS.confirmed;
  const customerName = order.customerFirstName && order.customerLastName
    ? `${order.customerFirstName} ${order.customerLastName}` : order.customerName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order.orderNumber || `CMD-${order.id}`}</DialogTitle>
          <DialogDescription>
            {formatDate(order.createdAt)} · Source: {order.source === "stripe" ? "Stripe" : order.source === "manual" ? "Manuelle" : "Devis converti"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={payStatus.color} variant="secondary">Paiement: {payStatus.label}</Badge>
            <Badge className={ordStatus.color} variant="secondary">Commande: {ordStatus.label}</Badge>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Client</h4>
              <p className="text-sm text-gray-600">{customerName}</p>
              <p className="text-sm text-gray-600">{order.customerEmail}</p>
              {order.customerPhone && <p className="text-sm text-gray-600">{order.customerPhone}</p>}
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Livraison</h4>
              <p className="text-sm text-gray-600">
                {order.shippingAddress || order.billingAddress || `${order.customerAddress}, ${order.customerPostalCode} ${order.customerCity}, ${order.customerCountry}`}
              </p>
            </div>
          </div>

          {/* Shipping info */}
          {order.carrier && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-sm mb-1 text-blue-700 dark:text-blue-300">Expédition</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Transporteur: {order.carrier} · Suivi: {order.trackingNumber}
              </p>
            </div>
          )}

          {/* Items */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Articles</h4>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    <p className="text-xs text-gray-500">Qté: {item.quantity} × {formatCurrency(item.unitPrice, order.currency)}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.lineTotal, order.currency)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Sous-total:</span><span>{formatCurrency(order.subtotal || order.totalAmount, order.currency)}</span></div>
            {parseFloat(order.discountAmount || "0") > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">Remise:</span><span>- {formatCurrency(order.discountAmount, order.currency)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-600">Frais de port:</span><span>{formatCurrency(order.shippingCost, order.currency)}</span></div>
            {parseFloat(order.taxAmount || "0") > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">TVA:</span><span>{formatCurrency(order.taxAmount, order.currency)}</span></div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base"><span>TOTAL:</span><span className="text-primary">{formatCurrency(order.totalAmount, order.currency)}</span></div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Status controls */}
          <Separator />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Changer statut paiement</Label>
              <Select onValueChange={(v) => onStatusChange({ paymentStatus: v })}>
                <SelectTrigger><SelectValue placeholder={payStatus.label} /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Changer statut commande</Label>
              <Select onValueChange={(v) => onStatusChange({ orderStatus: v })}>
                <SelectTrigger><SelectValue placeholder={ordStatus.label} /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onDownloadInvoice}>
              <Download className="h-4 w-4 mr-1" /> Facture PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onSendInvoice}>
              <Mail className="h-4 w-4 mr-1" /> Envoyer facture
            </Button>
            <Button variant="outline" size="sm" onClick={onSetShipping}>
              <Truck className="h-4 w-4 mr-1" /> Expédition
            </Button>
            {order.carrier && order.trackingNumber && (
              <Button variant="outline" size="sm" onClick={onSendShippingNotif}>
                <Send className="h-4 w-4 mr-1" /> Notif. livraison
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== QUOTE DETAIL DIALOG ====================

function QuoteDetailDialog({ quote, open, onOpenChange, onStatusChange, onDownloadPdf, onSendEmail, onConvert, onDuplicate }: {
  quote: QuoteData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: string) => void;
  onDownloadPdf: () => void;
  onSendEmail: () => void;
  onConvert: () => void;
  onDuplicate: () => void;
}) {
  const qStatus = QUOTE_STATUS_LABELS[quote.status] || QUOTE_STATUS_LABELS.draft;
  const items = quote.quoteItems || [];
  const customerName = `${quote.customerFirstName} ${quote.customerLastName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quote.quoteNumber || `DEV-${quote.id}`}</DialogTitle>
          <DialogDescription>
            {formatDate(quote.createdAt)} · Valable jusqu'au {formatDate(quote.validUntil)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Badge className={qStatus.color} variant="secondary">{qStatus.label}</Badge>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">Client</h4>
              <p className="text-sm text-gray-600">{customerName}</p>
              <p className="text-sm text-gray-600">{quote.customerEmail}</p>
              {quote.customerPhone && <p className="text-sm text-gray-600">{quote.customerPhone}</p>}
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Adresse</h4>
              <p className="text-sm text-gray-600">{quote.billingAddress || "—"}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Articles</h4>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-gray-500">Qté: {item.quantity} × {formatCurrency(item.unitPrice, quote.currency)}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.lineTotal, quote.currency)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Sous-total:</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span></div>
            {parseFloat(quote.discountAmount || "0") > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">Remise:</span><span>- {formatCurrency(quote.discountAmount, quote.currency)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-600">Frais de port:</span><span>{formatCurrency(quote.shippingCost, quote.currency)}</span></div>
            {parseFloat(quote.taxAmount || "0") > 0 && (
              <div className="flex justify-between"><span className="text-gray-600">TVA:</span><span>{formatCurrency(quote.taxAmount, quote.currency)}</span></div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base"><span>TOTAL:</span><span className="text-primary">{formatCurrency(quote.totalAmount, quote.currency)}</span></div>
          </div>

          {quote.notes && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{quote.notes}</p>
            </div>
          )}

          <Separator />
          <div>
            <Label className="text-xs">Changer statut</Label>
            <Select onValueChange={(v) => onStatusChange(v)}>
              <SelectTrigger><SelectValue placeholder={qStatus.label} /></SelectTrigger>
              <SelectContent>
                {Object.entries(QUOTE_STATUS_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onDownloadPdf}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onSendEmail}>
              <Send className="h-4 w-4 mr-1" /> Envoyer
            </Button>
            <Button variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-1" /> Dupliquer
            </Button>
            {quote.status !== "converted" && (
              <Button variant="default" size="sm" onClick={onConvert}>
                <ShoppingCart className="h-4 w-4 mr-1" /> Convertir en commande
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SHIPPING DIALOG ====================

function ShippingDialog({ order, open, onOpenChange, onSubmit }: {
  order: OrderData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { carrier: string; trackingNumber: string }) => void;
}) {
  const [carrier, setCarrier] = useState(order.carrier || "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrier || !trackingNumber) return;
    onSubmit({ carrier, trackingNumber });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Expédition — {order.orderNumber || `CMD-${order.id}`}</DialogTitle>
          <DialogDescription>Renseignez le transporteur et le numéro de suivi.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Transporteur *</Label>
            <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Ex: Colissimo, Chronopost, Bpost..." required />
          </div>
          <div>
            <Label>Numéro de suivi *</Label>
            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Ex: 123456789FR" required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit">Enregistrer & expédier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
