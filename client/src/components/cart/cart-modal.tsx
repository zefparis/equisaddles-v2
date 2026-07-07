import { useCart } from "../../hooks/use-cart";
import { useLanguage } from "../../hooks/use-language";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Badge } from "../ui/badge";
import { ShoppingCart, X } from "lucide-react";
import { Link } from "wouter";
import CartItem from "./cart-item";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, totalAmount, totalItems } = useCart();
  const { t } = useLanguage();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t("cart.title")}
            {totalItems > 0 && (
              <Badge variant="secondary">{totalItems}</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {t("cart.description")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-4">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t("cart.empty")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-lg">{t("cart.total")}:</span>
                <span className="text-xl font-bold text-primary">
                  {totalAmount.toFixed(2)} €
                </span>
              </div>
              <div className="space-y-2">
                <Link href="/checkout" onClick={onClose}>
                  <Button className="w-full btn-primary">
                    {t("cart.checkout")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  {t("cart.continue")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
