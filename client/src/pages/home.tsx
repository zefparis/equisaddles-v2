import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "../hooks/use-language";
import { useCart } from "../hooks/use-cart";
import { useToast } from "../hooks/use-toast";
import { scrollToTop, scrollToSection } from "../lib/utils";
import { Product } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import ProductCard from "../components/product/product-card";
// Header, Footer et ChatWidget sont maintenant dans App.tsx
import { ArrowRight, Award, Headphones, FastForward, Star, Gavel, Download, Smartphone } from "lucide-react";

const categories = [
  {
    name: "Obstacle",
    image: "/images/obstacle.webp",
    description: "categories.obstacle"
  },
  {
    name: "Dressage",
    image: "/images/dressage.jpg",
    description: "categories.dressage"
  },
  {
    name: "Cross",
    image: "/images/cross.jpg",
    description: "categories.cross"
  },
  {
    name: "Mixte",
    image: "/images/mixte.jpg",
    description: "categories.mixte"
  },
  {
    name: "Poney",
    image: "/images/poney.jpg",
    description: "categories.poney"
  }
];

export default function Home() {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const { toast } = useToast();

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  const { data: featuredProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products?featured=true"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[480px] md:h-screen flex items-center justify-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-gray-900"
          style={{
            backgroundImage: "url('/images/hero-excellence.webp')"
          }}
        >
          {/* Elegant dark gradient — stronger at the bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 fade-in text-white max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-2xl mb-10 max-w-2xl mx-auto text-white/90 drop-shadow">
            {t("hero.subtitle")}
          </p>
          <Link href="/catalog">
            <Button className="btn-accent text-lg px-10 py-6 shadow-xl">
              {t("hero.cta")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title mb-12 text-gray-900 dark:text-gray-100">
            {t("categories.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <Link 
                key={category.name}
                href={`/catalog?category=${category.name.toLowerCase()}`}
              >
                <Card className="category-hover image-zoom overflow-hidden cursor-pointer glass-card border-0 h-full">
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url('${category.image}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-4">
                      <h3 className="text-white font-semibold text-xl drop-shadow-lg font-display">{category.name}</h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t(category.description)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title mb-12 text-gray-900 dark:text-gray-100">
            {t("featured.title")}
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="skeleton h-64 mb-4"></div>
                  <div className="skeleton h-6 mb-2"></div>
                  <div className="skeleton h-4"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Aucun produit en vedette pour le moment.
              </p>
              <Link href="/catalog">
                <Button className="mt-4 btn-primary">
                  Voir tout le catalogue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="section-title mb-12 text-gray-900 dark:text-gray-100">
            {t("why.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center glass-card p-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Award className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t("why.quality")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("why.qualityDescription")}
              </p>
            </div>
            <div className="text-center glass-card p-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <FastForward className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t("why.shipping")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("why.shippingDescription")}
              </p>
            </div>
            <div className="text-center glass-card p-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Gavel className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t("why.custom")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("why.customDescription")}
              </p>
            </div>
            <div className="text-center glass-card p-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <Headphones className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t("why.support")}</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {t("why.supportDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Newsletter */}
      <section className="py-16 md:py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-display">{t("newsletter.title")}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {t("newsletter.subtitle")}
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder={t("newsletter.email")}
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
            />
            <Button type="submit" className="btn-accent px-6 py-3">
              {t("newsletter.subscribe")}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
