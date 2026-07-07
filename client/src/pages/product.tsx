import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useCart } from "../hooks/use-cart";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Product, ProductImage } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import Lightbox from "../components/ui/lightbox";
import { ArrowLeft, ShoppingCart, Truck, ShieldCheck, RotateCcw, MapPin } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const { data: apiImages } = useQuery<ProductImage[]>({
    queryKey: [`/api/products/${id}/images`],
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8">
          <div>
            <div className="skeleton h-8 w-32 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="skeleton h-96"></div>
              <div className="space-y-4">
                <div className="skeleton h-8"></div>
                <div className="skeleton h-6"></div>
                <div className="skeleton h-4"></div>
                <div className="skeleton h-12"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("product.productNotFound")}</h1>
          <Link href="/catalog">
            <Button>{t("product.backToCatalog")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const apiImageUrls = (apiImages && apiImages.length > 0)
    ? [...apiImages].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0)).map(i => i.url)
    : [];
  const allImages = apiImageUrls.length > 0
    ? apiImageUrls
    : [product.image, ...(product.images || [])];
  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/catalog" className="flex items-center text-gray-600 hover:text-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("product.backToCatalog")}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden surface-card image-zoom">
              <img
                src={allImages[0]}
                alt={product.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => openLightbox(0)}
              />
            </div>
            
            {allImages.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allImages.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden surface-card cursor-pointer hover:ring-2 hover:ring-accent transition-shadow"
                    onClick={() => openLightbox(index + 1)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 2}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category === "Accessoires" && product.subcategory === "Autre" && product.customSubcategory
                  ? product.customSubcategory
                  : product.category === "Accessoires" 
                  ? product.subcategory 
                  : product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-primary">
                {parseFloat(product.price).toFixed(2)} €
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    {parseFloat(product.originalPrice!).toFixed(2)} €
                  </span>
                  <Badge className="bg-red-500">
                    -
                    {Math.round(
                      ((parseFloat(product.originalPrice!) - parseFloat(product.price)) /
                        parseFloat(product.originalPrice!)) *
                        100
                    )}
                    %
                  </Badge>
                </>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-4 p-6 surface-card">
              <h3 className="text-lg font-semibold mb-4">{t("product.listingDetails")}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t("product.size")}</span>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    {product.size}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t("product.status")}</span>
                  {product.inStock ? (
                    <Badge className="bg-green-600 text-white">{t("product.available")}</Badge>
                  ) : (
                    <Badge variant="destructive">{t("product.sold")}</Badge>
                  )}
                </div>
                
                {product.color && product.category !== "Accessoires" && (
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t("product.color")}</span>
                    <span className="text-gray-900 dark:text-gray-100">{product.color}</span>
                  </div>
                )}
                
                {product.condition && (
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t("product.condition")}</span>
                    <span className="text-gray-900 dark:text-gray-100">{product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}</span>
                  </div>
                )}
                
                {product.location && (
                  <div className="flex items-center space-x-3 sm:col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t("product.location")}</span>
                    <span className="text-gray-900 dark:text-gray-100 flex items-center gap-1"><MapPin className="h-4 w-4" /> {product.location}</span>
                  </div>
                )}
                
                {product.sellerContact && (
                  <div className="flex items-center space-x-3 sm:col-span-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t("product.sellerContact")}</span>
                    <span className="text-gray-900 dark:text-gray-100">{product.sellerContact}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              className="w-full btn-primary text-lg py-6 shadow-lg"
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.inStock ? t("product.addToCart") : t("product.sold")}
            </Button>

            {/* Reassurance block */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="surface-card p-3 flex flex-col items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Paiement sécurisé</span>
              </div>
              <div className="surface-card p-3 flex flex-col items-center gap-1.5">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Expédition rapide</span>
              </div>
              <div className="surface-card p-3 flex flex-col items-center gap-1.5">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Retours acceptés</span>
              </div>
            </div>

            
          </div>
        </div>

        {/* Product Details */}
        <Card className="mb-12 glass-card border-0">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">{t("product.description")}</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-3">{t("product.characteristics")}</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><span className="font-medium">{t("product.category")}</span> {product.category}</li>
                    <li><span className="font-medium">{t("product.size")}</span> {product.size}</li>
                    <li><span className="font-medium">{t("product.material")}</span> {t("product.premiumItalianLeather")}</li>
                    <li><span className="font-medium">{t("product.color")}</span> {t("product.naturalBrown")}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">{t("product.maintenance")}</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• {t("product.maintenanceTip1")}</li>
                    <li>• {t("product.maintenanceTip2")}</li>
                    <li>• {t("product.maintenanceTip3")}</li>
                    <li>• {t("product.maintenanceTip4")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lightbox */}
        <Lightbox
          images={allImages}
          currentIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    </div>
  );
}
