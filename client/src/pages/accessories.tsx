import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Product } from "@shared/schema";
import ProductCard from "../components/product/product-card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Search, Package, Filter, ShoppingBag, Sparkles, TrendingUp, Heart } from "lucide-react";

// Fonction pour obtenir les catégories traduites
const getAccessoryCategories = (t: (key: string) => string) => [
  { id: "all", name: t("accessories.allCategories"), icon: Package },
  { id: "Sangles", name: t("subcategories.sangles"), icon: Package },
  { id: "Etrivieres", name: t("subcategories.etrivieres"), icon: Package },
  { id: "Etriers", name: t("subcategories.etriers"), icon: Package },
  { id: "Amortisseurs", name: t("subcategories.amortisseurs"), icon: Package },
  { id: "Tapis", name: t("subcategories.tapis"), icon: Package },
  { id: "Briderie", name: t("subcategories.briderie"), icon: Package },
  { id: "Couvertures", name: t("subcategories.couvertures"), icon: Package },
  { id: "Protections", name: t("subcategories.protections"), icon: Package },
  { id: "Autre", name: t("accessories.otherAccessories"), icon: ShoppingBag },
];

export default function Accessories() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  // Images du carrousel (servies depuis /public/images)
  const carouselImages = [
    "/images/56704-864-Equitation-et-cheval-840x473.jpg",
    "/images/cavalier-monte-sur-le-cheval-alezan-promenades-sur-un-gros-plan-de-l-hippodrome.jpg",
    "/images/monter-a-cheval.jpg",
    "/images/un-homme-a-cheval.jpg",
    "/images/obstacle.webp",
    "/images/dressage.jpg",
  ];

  // Index de l'image courante et rotation automatique
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [carouselImages.length]);

  // Obtenir les catégories traduites
  const accessoryCategories = getAccessoryCategories(t);

  useEffect(() => {
    scrollToTop();
  }, []);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filtrer uniquement les accessoires
  const accessories = products?.filter(product => product.category === "Accessoires") || [];

  // Statistiques par catégorie
  const categoryStats = accessoryCategories.map(cat => ({
    ...cat,
    count: cat.id === "all" 
      ? accessories.length 
      : accessories.filter(a => 
          cat.id === "Autre" 
            ? a.subcategory === "Autre" || !a.subcategory
            : a.subcategory === cat.id
        ).length
  }));

  // Filtrage des produits
  const filteredAccessories = accessories.filter(accessory => {
    // Filtre par catégorie
    if (selectedCategory !== "all") {
      if (selectedCategory === "Autre") {
        if (accessory.subcategory !== "Autre" && accessory.subcategory) return false;
      } else {
        if (accessory.subcategory !== selectedCategory) return false;
      }
    }

    // Filtre par recherche
    if (searchTerm && !accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !accessory.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtre par prix
    const price = parseFloat(accessory.price);
    if (price < priceRange[0] || price > priceRange[1]) {
      return false;
    }

    // Filtre par taille
    if (selectedSizes.length > 0 && !selectedSizes.includes(accessory.size)) {
      return false;
    }

    // Filtre par condition
    if (selectedConditions.length > 0 && accessory.condition && !selectedConditions.includes(accessory.condition)) {
      return false;
    }

    return true;
  });

  // Tri des produits
  const sortedAccessories = filteredAccessories.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "newest":
        return (b.id || 0) - (a.id || 0);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Obtenir les tailles uniques
  const availableSizes = Array.from(new Set(accessories.map(a => a.size))).sort();
  
  // Obtenir les conditions uniques
  const availableConditions = Array.from(new Set(accessories.filter(a => a.condition).map(a => a.condition!))).sort();

  // Produits populaires (les 3 premiers par catégorie)
  const popularAccessories = accessories.slice(0, 3);

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section - Carousel Background */}
      <div className="relative h-[320px] md:h-[420px] text-white">
        {carouselImages.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
          </div>
        ))}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t("accessories.title")}
              </h1>
              <p className="text-xl opacity-90 mb-8">
                {t("accessories.subtitle")}
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {accessories.length} {t("accessories.available")}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t("accessories.newWeekly")}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Heart className="h-4 w-4 mr-2" />
                  {t("accessories.premiumSelection")}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        {/* Indicateurs (points) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {carouselImages.map((_, i) => (
            <button
              key={i}
              aria-label={`Aller à l'image ${i + 1}`}
              onClick={() => setCurrentSlide(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Barre de recherche et filtres */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder={t("accessories.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 h-12">
                <SelectValue placeholder={t("accessories.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t("accessories.sortName")}</SelectItem>
                <SelectItem value="price-low">{t("accessories.sortPriceLow")}</SelectItem>
                <SelectItem value="price-high">{t("accessories.sortPriceHigh")}</SelectItem>
                <SelectItem value="newest">{t("accessories.sortNewest")}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-12"
              onClick={() => navigate("/catalog")}
            >
              {t("accessories.viewSaddles")}
            </Button>
          </div>
        </div>

        {/* Catégories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            {t("accessories.categories")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryStats.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card
                  key={cat.id}
                  aria-pressed={selectedCategory === cat.id}
                  className={`group cursor-pointer transition-all rounded-2xl bg-white/70 border border-white/60 shadow-md hover:bg-white/80 hover:shadow-lg hover:-translate-y-0.5 ${
                    selectedCategory === cat.id
                      ? 'ring-2 ring-[#D4AF37] border-[#D4AF37]/60'
                      : 'hover:border-[#D4AF37]/50'
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-5 text-center">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#FFD700]/85 border border-[#D4AF37]/80 flex items-center justify-center shadow-sm">
                      <Icon className="h-6 w-6 text-[#6B4226]" />
                    </div>
                    <h3
                      className="font-semibold text-sm tracking-wide text-[#3b2a20]"
                      style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                    >
                      {cat.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="mt-2 bg-white/90 border-white/90 text-[#3b2a20]"
                    >
                      {cat.count} {t('accessories.articles')}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres */}
          <div className="w-full lg:w-64 space-y-6">
            {/* Filtre par prix */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("accessories.price")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>{priceRange[0]}€</span>
                    <span>{priceRange[1]}€</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filtre par taille */}
            {availableSizes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("accessories.sizes")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableSizes.map(size => (
                      <label key={size} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSizes([...selectedSizes, size]);
                            } else {
                              setSelectedSizes(selectedSizes.filter(s => s !== size));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{size}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filtre par condition */}
            {availableConditions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("accessories.condition")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableConditions.map(condition => (
                      <label key={condition} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedConditions.includes(condition)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedConditions([...selectedConditions, condition]);
                            } else {
                              setSelectedConditions(selectedConditions.filter(c => c !== condition));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">
                          {condition.charAt(0).toUpperCase() + condition.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Produits populaires */}
            {popularAccessories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                    {t("accessories.popular")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {popularAccessories.map(accessory => (
                    <div
                      key={accessory.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                      onClick={() => navigate(`/product/${accessory.id}`)}
                    >
                      <img
                        src={accessory.image}
                        alt={accessory.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{accessory.name}</p>
                        <p className="text-sm text-primary font-semibold">
                          {parseFloat(accessory.price).toFixed(2)}€
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Grille de produits */}
          <div className="flex-1">
            {/* Résultats */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                {sortedAccessories.length} {sortedAccessories.length !== 1 ? t("accessories.foundPlural") : t("accessories.found")} {sortedAccessories.length !== 1 ? t("accessories.foundTextPlural") : t("accessories.foundText")}
              </p>
              {(selectedSizes.length > 0 || selectedConditions.length > 0 || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSizes([]);
                    setSelectedConditions([]);
                    setSearchTerm("");
                    setPriceRange([0, 500]);
                  }}
                >
                  {t("accessories.resetFilters")}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
                    <div className="bg-gray-300 h-6 rounded mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : sortedAccessories.length === 0 ? (
              <Card className="p-16 text-center">
                <Package className="h-24 w-24 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">{t("accessories.noResults")}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t("accessories.noResultsDesc")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchTerm("");
                    setSelectedSizes([]);
                    setSelectedConditions([]);
                    setPriceRange([0, 500]);
                  }}
                >
                  {t("accessories.resetFilters")}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAccessories.map((accessory) => (
                  <ProductCard key={accessory.id} product={accessory} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
