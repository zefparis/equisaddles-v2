import { useEffect } from "react";
import { Link } from "wouter";
import { useCart } from "../hooks/use-cart";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import CartItem from "../components/cart/cart-item";
import { ShoppingCart, ArrowLeft, Truck } from "lucide-react";

export default function Cart() {
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const { t } = useLanguage();

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  const shippingCost = totalAmount >= 100 ? 0 : 12.90;
  const finalTotal = totalAmount + shippingCost;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/catalog" className="flex items-center text-gray-600 hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("cart.continue")}
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            {t("cart.title")}
            {totalItems > 0 && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {totalItems}
              </Badge>
            )}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 mx-auto mb-6 text-gray-300" />
            <h2 className="text-2xl font-semibold mb-4">{t("cart.empty")}</h2>
            <p className="text-gray-600 mb-8">
              {t("cart.emptyDescription")}
            </p>
            <Link href="/catalog">
              <Button className="btn-primary">
                {t("cart.backToCatalog")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t("cart.yourItems")} ({totalItems})</span>
                    <Button
                      variant="ghost"
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700"
                    >
                      {t("cart.clearCart")}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>{t("cart.summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t("cart.subtotal")}</span>
                    <span>{totalAmount.toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>{t("cart.delivery")}</span>
                    </div>
                    <div className="text-right">
                      {shippingCost === 0 ? (
                        <span className="text-green-600 font-semibold">{t("cart.free")}</span>
                      ) : (
                        <span>{shippingCost.toFixed(2)} €</span>
                      )}
                    </div>
                  </div>
                  
                  {totalAmount < 100 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <p>
                        {t("cart.addForFreeShipping").replace("{amount}", (100 - totalAmount).toFixed(2))}
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t("cart.total")}</span>
                    <span className="text-primary">{finalTotal.toFixed(2)} €</span>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <Link href="/checkout">
                      <Button className="w-full btn-primary">
                        {t("cart.checkout")}
                      </Button>
                    </Link>
                    
                    <Link href="/catalog">
                      <Button variant="outline" className="w-full">
                        {t("cart.continue")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
