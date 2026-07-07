import { useCart, CartItem as CartItemType } from "../../hooks/use-cart";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Minus, Plus, X } from "lucide-react";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <img
        src={item.image}
        alt={item.name}
        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.name}</h4>
        <p className="text-gray-600 text-xs">
          {item.category === "Accessoires" && item.subcategory === "Autre" && item.customSubcategory
            ? `${item.customSubcategory} - ${item.size}`
            : item.category === "Accessoires" 
            ? `${item.subcategory} - ${item.size}`
            : `${item.category} - ${item.size}`}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary text-sm">
            {parseFloat(item.price).toFixed(2)} €
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="h-7 w-7 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Badge variant="secondary" className="px-2 py-1 min-w-[2rem] text-center text-xs">
              {item.quantity}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeItem(item.id)}
        className="text-red-500 hover:text-red-700 h-7 w-7 p-0 flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
