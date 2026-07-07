import { Link } from "wouter";
import { useCart } from "../../hooks/use-cart";
import { useLanguage } from "../../hooks/use-language";
import { Product } from "@shared/schema";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardFooter } from "../ui/card";
import { ShoppingCart, MapPin } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { t } = useLanguage();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
  };

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

  return (
    <Card className="group product-card glass-card gradient-border overflow-hidden flex flex-col h-full">
      <Link href={`/product/${product.id}`}>
        <div className="relative image-zoom image-gradient">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-64 object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Status + discount badges, consistent placement */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <Badge className="bg-red-600 text-white shadow-md">
                -
                {Math.round(
                  ((parseFloat(product.originalPrice!) - parseFloat(product.price)) /
                    parseFloat(product.originalPrice!)) *
                    100
                )}
                %
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3">
            {product.inStock ? (
              <Badge className="bg-green-600/90 text-white text-xs shadow-md">{t("product.available")}</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs shadow-md">{t("product.sold")}</Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-5 flex-1">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-lg font-semibold mb-1 hover:text-primary transition-colors text-gray-900 dark:text-gray-100 line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{product.description}</p>
        
        {/* Details produit - couleur, état, localisation */}
        <div className="space-y-1.5 mb-4 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">{t("product.size")}</span> {product.size}
          </div>
          
          {product.color && product.category !== "Accessoires" && (
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t("product.color")}</span> {product.color}
            </div>
          )}
          
          {/* Afficher la sous-catégorie appropriée pour les accessoires */}
          {product.category === "Accessoires" && (
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t("product.type")}</span> {
                product.subcategory === "Autre" && product.customSubcategory
                  ? product.customSubcategory
                  : product.subcategory
              }
            </div>
          )}
          
          {product.condition && (
            <div className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{t("product.condition")}</span> {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
            </div>
          )}
          
          {product.location && (
            <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {product.location}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            {parseFloat(product.price).toFixed(2)} €
          </span>
          {hasDiscount && (
            <span className="text-base text-gray-500 line-through">
              {parseFloat(product.originalPrice!).toFixed(2)} €
            </span>
          )}
        </div>

      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button 
          onClick={handleAddToCart}
          className="w-full btn-primary"
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.inStock ? t("product.addToCart") : t("product.sold")}
        </Button>
      </CardFooter>
    </Card>
  );
}
