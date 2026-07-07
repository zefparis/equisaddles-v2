import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Product } from "@shared/schema";
import ProductCard from "../components/product/product-card";
import ProductFilters from "../components/product/product-filters";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, Grid, List, Filter } from "lucide-react";

export default function Catalog() {
  const { t } = useLanguage();

  // Fonction pour obtenir les noms de produits traduits
  const getTranslatedProductName = (productName: string) => {
    // Mapping direct des noms de produits vers leurs clés de traduction
    const productTranslationMap: { [key: string]: string } = {
      'Sangle en cuir premium': 'products.sangleCuirPremium',
      'Étrivières ajustables': 'products.etrivieresAjustables',
      'Étriers en acier inoxydable': 'products.etriersAcierInoxydable',
      'Amortisseur gel professionnel': 'products.amortisseurGelProfessionnel',
      'Tapis de selle respirant': 'products.tapisSelleRespirant',
      'Bridon cuir français': 'products.bridonCuirFrancais',
      'Couverture imperméable': 'products.couvertureImpermeabile',
      'Protections de transport': 'products.protectionsTransport'
    };
    
    return productTranslationMap[productName] ? t(productTranslationMap[productName]) : productName;
  };
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"selles" | "accessoires">("selles");
  
  // Initialiser searchTerm avec la bonne valeur par défaut selon l'onglet
  useEffect(() => {
    if (activeTab === "accessoires" && searchTerm === "") {
      setSearchTerm("tous");
    }
  }, [activeTab, searchTerm]);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    subcategories: [] as string[],
    sizes: [] as string[],
    condition: "" as string,
  });

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const category = params.get('category');
    if (category) {
      setFilters(prev => ({
        ...prev,
        categories: [category.charAt(0).toUpperCase() + category.slice(1)]
      }));
    }
  }, [location]);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Séparer les selles et les accessoires
  const selles = products?.filter(product => product.category !== "Accessoires") || [];
  const accessoires = products?.filter(product => product.category === "Accessoires") || [];

  const filteredProducts = (activeTab === "selles" ? selles : accessoires).filter(product => {
    // Search filter
    if (activeTab === "selles") {
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    } else {
      // Pour les accessoires, filtrer par id sélectionné sauf si "tous" est sélectionné
      if (searchTerm && searchTerm !== "tous" && String(product.id) !== searchTerm) {
        return false;
      }
    }

    // Category filter pour les selles uniquement
    if (activeTab === "selles" && filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }

    // Subcategory filter pour les accessoires uniquement
    if (activeTab === "accessoires" && filters.subcategories.length > 0) {
      const productSubcategory = product.subcategory || "";
      // Si le produit a une subcategory "Autre" et une customSubcategory, on compare avec la customSubcategory
      const effectiveSubcategory = product.subcategory === "Autre" && product.customSubcategory 
        ? product.customSubcategory 
        : productSubcategory;
      
      if (!filters.subcategories.includes(productSubcategory) && !filters.subcategories.includes(effectiveSubcategory)) {
        return false;
      }
    }

    // Size filter
    if (filters.sizes.length > 0 && !filters.sizes.includes(product.size)) {
      return false;
    }

    // Condition filter (neuve / occasion) - applies to all categories if provided
    if (filters.condition) {
      const rawCond = (product as any).condition;
      const pcond = typeof rawCond === "string" ? rawCond.toLowerCase() : "neuve";
      if (pcond !== filters.condition.toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const sortedProducts = filteredProducts?.sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t("nav.catalog")}</h1>
          
          {/* Onglets Selles / Accessoires */}
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as "selles" | "accessoires");
            setSearchTerm(value === "accessoires" ? "tous" : ""); // Réinitialiser la recherche quand on change d'onglet
          }} className="mb-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="selles">{t("catalog.saddles")} ({selles.length})</TabsTrigger>
              <TabsTrigger value="accessoires">{t("catalog.accessories")} ({accessoires.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {activeTab === "selles" ? (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("catalog.searchSaddle")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            ) : (
              <div className="flex-1">
                {/* ACCESSIBILITY: Added aria-label for screen readers */}
                <Select value={searchTerm} onValueChange={setSearchTerm}>
                  <SelectTrigger aria-label={t("catalog.selectAccessory")}>
                    <SelectValue placeholder={t("catalog.selectAccessory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">{t("catalog.allAccessories")}</SelectItem>
                    {accessoires.map((accessoire) => (
                      <SelectItem key={accessoire.id} value={String(accessoire.id)}>
                        {accessoire.subcategory === "Autre" && accessoire.customSubcategory 
                          ? `${accessoire.name} (${accessoire.customSubcategory})`
                          : getTranslatedProductName(accessoire.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* ACCESSIBILITY: Added aria-label for screen readers */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48" aria-label={t("catalog.sortBy")}>
                <SelectValue placeholder={t("catalog.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
                size="sm"
              >
                <Grid className="h-4 w-4" />
              </Button>
              
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                size="sm"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`w-full lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <ProductFilters activeTab={activeTab} onFiltersChange={setFilters} />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
                    <div className="bg-gray-300 h-6 rounded mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded"></div>
                  </div>
                ))}
              </div>
            ) : sortedProducts?.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-gray-600">
                    {sortedProducts?.length} produit{sortedProducts?.length !== 1 ? 's' : ''} trouvé{sortedProducts?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProducts?.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedProducts?.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-md p-6 flex gap-6">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                          <p className="text-gray-600 mb-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-primary">
                              {parseFloat(product.price).toFixed(2)} €
                            </span>
                            <Button className="btn-primary">
                              {t("product.addToCart")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
