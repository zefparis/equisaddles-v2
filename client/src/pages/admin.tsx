import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import AdminLogin from "../components/admin/AdminLogin";
import "../styles/admin-responsive.css";
import { useToast } from "../hooks/use-toast";
import { scrollToTop } from "../lib/utils";
import { apiRequest } from "../lib/queryClient";
import { Product, GalleryImage, insertProductSchema, insertGalleryImageSchema } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "../components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "../components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Package, Images, ShoppingCart, Plus, Edit, Trash2, Star, FileText, Search, Eye, Copy, Filter, RotateCcw, ChevronLeft, ChevronRight, AlertCircle, PackageSearch, Play, Video, Youtube, GripVertical } from "lucide-react";
import ProductImageManager from "../components/admin/product-image-manager";
import ImageUpload from "../components/admin/image-upload";
import OrdersManagement from "../components/admin/orders-management";

const categories = ["Obstacle", "Dressage", "Cross", "Mixte", "Poney", "Accessoires", "Autres"];
const saddleSizes = ["16", "16.5", "17", "17.5", "18", "18.5"];
const accessorySubcategories = ["Sangles", "Etrivieres", "Etriers", "Amortisseurs", "Tapis", "Briderie", "Couvertures", "Protections", "Autre"];
const accessorySizes = ["S", "M", "L", "XL", "XXL", "Unique", "Poney", "Cheval", "Double Poney", "Full"];
const saddleColors = [
  "Noir",
  "Marron foncé", 
  "Marron havane",
  "Marron clair / Cognac",
  "Châtaigne",
  "Tabac",
  "Miel",
  "Naturel",
  "Chocolat",
  "Acajou"
];
const productConditions = ["neuve", "occasion"];

type ProductFormData = z.infer<typeof insertProductSchema>;
type GalleryFormData = z.infer<typeof insertGalleryImageSchema>;

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [imagesProductId, setImagesProductId] = useState<number | null>(null);
  const [resumeEditAfterImages, setResumeEditAfterImages] = useState(false);

  // Search, filters, sort, pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "selles" | "accessoires">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "disponibles" | "vendus">("all");
  const [filterCondition, setFilterCondition] = useState<"all" | "neuf" | "occasion">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFeatured, setFilterFeatured] = useState<"all" | "vedette" | "non-vedette">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc" | "recent" | "old">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "product" | "gallery"; id: number; name: string } | null>(null);

  // Gallery mediatheque state
  const [galleryMediaType, setGalleryMediaType] = useState<"image" | "video" | "youtube" | "vimeo">("image");
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryImage | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryFilterType, setGalleryFilterType] = useState<string>("all");
  const [galleryFilterCategory, setGalleryFilterCategory] = useState<string>("all");
  const [galleryExternalUrl, setGalleryExternalUrl] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState<{ url: string; thumbnailUrl?: string; mediaType: string } | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  // Queries
  const { data: products, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: galleryImages, isLoading: galleryLoading, isError: galleryError, refetch: refetchGallery } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });


  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Annonce créée avec succès" });
      setShowProductDialog(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductFormData> }) =>
      apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit modifié avec succès" });
      setEditingProduct(null);
      setShowProductDialog(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produit supprimé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const createGalleryImageMutation = useMutation({
    mutationFn: (data: GalleryFormData) => apiRequest("POST", "/api/gallery", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Média ajouté avec succès" });
      setShowGalleryDialog(false);
      setGalleryPreview(null);
      setGalleryExternalUrl("");
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateGalleryImageMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GalleryFormData> }) =>
      apiRequest("PUT", `/api/gallery/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Média modifié avec succès" });
      setShowGalleryDialog(false);
      setEditingGalleryItem(null);
      setGalleryPreview(null);
      setGalleryExternalUrl("");
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const reorderGalleryMutation = useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      apiRequest("POST", "/api/gallery/reorder", { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
    onError: (error) => {
      toast({ title: "Erreur réorganisation", description: error.message, variant: "destructive" });
    },
  });

  const deleteGalleryImageMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/gallery/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Média supprimé avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Derived data: available categories from products
  const availableCategories = useMemo(() => {
    if (!products) return [];
    const cats = products.map((p) => p.category).filter((v, i, arr) => arr.indexOf(v) === i).filter(Boolean) as string[];
    return cats.sort();
  }, [products]);

  // Filtered, sorted, paginated products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let result = [...products];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        [p.name, p.category, p.color, p.size, p.location]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }

    // Filter: type
    if (filterType === "selles") {
      result = result.filter((p) => p.category !== "Accessoires");
    } else if (filterType === "accessoires") {
      result = result.filter((p) => p.category === "Accessoires");
    }

    // Filter: status
    if (filterStatus === "disponibles") {
      result = result.filter((p) => p.inStock !== false);
    } else if (filterStatus === "vendus") {
      result = result.filter((p) => p.inStock === false);
    }

    // Filter: condition
    if (filterCondition === "neuf") {
      result = result.filter((p) => p.condition === "neuve");
    } else if (filterCondition === "occasion") {
      result = result.filter((p) => p.condition === "occasion");
    }

    // Filter: category
    if (filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }

    // Filter: featured
    if (filterFeatured === "vedette") {
      result = result.filter((p) => p.featured === true);
    } else if (filterFeatured === "non-vedette") {
      result = result.filter((p) => p.featured !== true);
    }

    // Sort
    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "recent":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "old":
        result.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [products, searchQuery, filterType, filterStatus, filterCondition, filterCategory, filterFeatured, sortBy]);

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, filterCondition, filterCategory, filterFeatured, sortBy]);

  const productsPerPage = useMemo(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return 12;
    return 24;
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, safeCurrentPage, productsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterCondition("all");
    setFilterCategory("all");
    setFilterFeatured("all");
    setSortBy("recent");
  };

  const hasActiveFilters = searchQuery || filterType !== "all" || filterStatus !== "all" || filterCondition !== "all" || filterCategory !== "all" || filterFeatured !== "all";

  const handleDuplicateProduct = (product: Product) => {
    setEditingProduct(null);
    productForm.reset({
      name: `Copie de ${product.name}`,
      category: product.category,
      subcategory: product.subcategory || "",
      size: product.size,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      description: product.description,
      image: product.image,
      images: [],
      inStock: true,
      featured: false,
      location: product.location || "",
      sellerContact: product.sellerContact || "",
      color: product.color || "",
      condition: product.condition || "",
      customSubcategory: product.customSubcategory || "",
    });
    setSelectedImageFile(null);
    setShowProductDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "product") {
      deleteProductMutation.mutate(deleteTarget.id);
    } else if (deleteTarget.type === "gallery") {
      deleteGalleryImageMutation.mutate(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // Gallery handlers
  const handleNewGalleryItem = (mediaType: "image" | "video" | "youtube" | "vimeo") => {
    setEditingGalleryItem(null);
    setGalleryMediaType(mediaType);
    setGalleryExternalUrl("");
    setGalleryPreview(null);
    setSelectedImageFile(null);
    galleryForm.reset({
      mediaType,
      url: "",
      thumbnailUrl: undefined,
      publicId: undefined,
      title: "",
      description: "",
      alt: "",
      category: "Obstacle",
      sortOrder: 0,
      featured: false,
      active: true,
    });
    setShowGalleryDialog(true);
  };

  const handleEditGalleryItem = (item: GalleryImage) => {
    setEditingGalleryItem(item);
    setGalleryMediaType(item.mediaType as "image" | "video" | "youtube" | "vimeo");
    setGalleryExternalUrl(item.mediaType === "youtube" || item.mediaType === "vimeo" ? item.url : "");
    setGalleryPreview({ url: item.url, thumbnailUrl: item.thumbnailUrl || undefined, mediaType: item.mediaType });
    setSelectedImageFile(null);
    galleryForm.reset({
      mediaType: item.mediaType as any,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || undefined,
      publicId: item.publicId || undefined,
      title: item.title || "",
      description: item.description || "",
      alt: item.alt || "",
      category: item.category,
      sortOrder: item.sortOrder || 0,
      featured: item.featured || false,
      active: item.active !== false,
    });
    setShowGalleryDialog(true);
  };

  const handleDuplicateGalleryItem = (item: GalleryImage) => {
    setEditingGalleryItem(null);
    setGalleryMediaType(item.mediaType as "image" | "video" | "youtube" | "vimeo");
    setGalleryExternalUrl(item.mediaType === "youtube" || item.mediaType === "vimeo" ? item.url : "");
    setGalleryPreview(null);
    setSelectedImageFile(null);
    galleryForm.reset({
      mediaType: item.mediaType as any,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || undefined,
      publicId: undefined,
      title: `Copie de ${item.title || item.alt || ""}`,
      description: item.description || "",
      alt: item.alt || "",
      category: item.category,
      sortOrder: 0,
      featured: false,
      active: true,
    });
    setShowGalleryDialog(true);
  };

  const handleGalleryMove = (id: number, direction: "up" | "down") => {
    if (!galleryImages) return;
    const sorted = [...galleryImages].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sorted.findIndex((g) => g.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sorted.length - 1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const items = sorted.map((g, i) => ({ id: g.id, sortOrder: i }));
    // Swap
    const temp = items[index].sortOrder;
    items[index].sortOrder = items[swapIndex].sortOrder;
    items[swapIndex].sortOrder = temp;
    reorderGalleryMutation.mutate(items);
  };

  // Filtered gallery images
  const filteredGalleryImages = useMemo(() => {
    if (!galleryImages) return [];
    let result = [...galleryImages];
    if (gallerySearch.trim()) {
      const q = gallerySearch.toLowerCase().trim();
      result = result.filter((g) =>
        [g.title, g.alt, g.category, g.description]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }
    if (galleryFilterType !== "all") {
      result = result.filter((g) => g.mediaType === galleryFilterType);
    }
    if (galleryFilterCategory !== "all") {
      result = result.filter((g) => g.category === galleryFilterCategory);
    }
    return result.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [galleryImages, gallerySearch, galleryFilterType, galleryFilterCategory]);

  // Forms
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      category: "Obstacle",
      subcategory: "",
      size: "17",
      price: "0",
      description: "",
      image: "",
      images: [],
      inStock: true,
      location: "",
      sellerContact: "",
      color: "",
      condition: "",
      customSubcategory: "",
    },
  });

  const galleryForm = useForm<GalleryFormData>({
    resolver: zodResolver(insertGalleryImageSchema),
    defaultValues: {
      mediaType: "image",
      url: "",
      thumbnailUrl: undefined,
      publicId: undefined,
      title: "",
      description: "",
      alt: "",
      category: "Obstacle",
      sortOrder: 0,
      featured: false,
      active: true,
    },
  });

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload de l\'image');
    }
    
    const result = await response.json();
    return result.url;
  };

  const handleProductSubmit = async (data: ProductFormData) => {
    setUploadingImage(true);
    
    try {
      let imageUrl = data.image;
      
      // Si un fichier d'image a été sélectionné, l'uploader d'abord
      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile);
        data.image = imageUrl;
      }
      
      if (editingProduct) {
        updateProductMutation.mutate({ id: editingProduct.id, data });
      } else {
        createProductMutation.mutate(data);
      }
      
      // Reset l'état du fichier après soumission
      setSelectedImageFile(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload de l'image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGallerySubmit = async (data: GalleryFormData) => {
    setUploadingImage(true);
    setGalleryUploading(true);

    try {
      if (galleryMediaType === "youtube" || galleryMediaType === "vimeo") {
        // Resolve external URL
        const resp = await fetch("/api/upload/external-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: galleryExternalUrl }),
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "URL invalide");
        }
        const result = await resp.json();
        data.url = result.url;
        data.thumbnailUrl = result.thumbnailUrl;
        data.mediaType = result.mediaType;
      } else if (selectedImageFile) {
        // Upload file (image or video)
        const formData = new FormData();
        formData.append("media", selectedImageFile);
        const resp = await fetch("/api/upload/media", {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err.error || "Upload échoué");
        }
        const result = await resp.json();
        data.url = result.url;
        data.publicId = result.publicId;
        data.thumbnailUrl = result.thumbnailUrl;
        data.mediaType = result.mediaType;
      }

      if (editingGalleryItem) {
        updateGalleryImageMutation.mutate({ id: editingGalleryItem.id, data });
      } else {
        createGalleryImageMutation.mutate(data);
      }

      setSelectedImageFile(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      setGalleryUploading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || "",
      size: product.size,
      price: product.price,
      originalPrice: product.originalPrice || undefined,
      description: product.description,
      image: product.image,
      images: product.images || [],
      inStock: product.inStock !== false,
      featured: product.featured === true,
      location: product.location || "",
      sellerContact: product.sellerContact || "",
      color: product.color || "",
      condition: product.condition || "",
      customSubcategory: product.customSubcategory || "",
    });
    setShowProductDialog(true);
  };

  const handleNewProduct = (type?: "saddle" | "accessory") => {
    setEditingProduct(null);
    if (type === "accessory") {
      productForm.reset({
        name: "",
        category: "Accessoires",
        subcategory: "",
        size: "S",
        price: "0",
        description: "",
        image: "",
        images: [],
        inStock: true,
        featured: false,
        location: "",
        sellerContact: "",
        color: "",
        condition: "",
        customSubcategory: "",
      });
    } else {
      productForm.reset({
        name: "",
        category: "Obstacle",
        subcategory: "",
        size: "17",
        price: "0",
        description: "",
        image: "",
        images: [],
        inStock: true,
        featured: false,
        location: "",
        sellerContact: "",
        color: "",
        condition: "",
        customSubcategory: "",
      });
    }
    setShowProductDialog(true);
  };

  // Si la vérification de session est en cours, afficher un écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher la page de connexion
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 admin-container">
      <div className="container mx-auto">
        {/* Header */}
        <div className="admin-header flex justify-between items-start">
          <div>
            <h1 className="admin-header-title text-gray-900 dark:text-gray-100">
              <Settings className="admin-header-icon" />
              <span>Administration</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Interface d'administration pour publier et gérer vos annonces de selles et accessoires équestres.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => { void logout(); }}
            className="text-sm mt-1"
          >
            Déconnexion
          </Button>
        </div>

        <Tabs defaultValue="products" className="space-y-6 sm:space-y-8">
          <TabsList className="admin-tabs-list w-full">
            <TabsTrigger value="products" className="admin-tab-trigger">
              <Package className="admin-tab-icon" />
              <span>Annonces</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="admin-tab-trigger">
              <Images className="admin-tab-icon" />
              <span>Galerie</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="admin-tab-trigger">
              <ShoppingCart className="admin-tab-icon" />
              <span>Commandes</span>
            </TabsTrigger>
          </TabsList>

          {/* Products Tab - Unified for both saddles and accessories */}
          <TabsContent value="products" className="space-y-4 sm:space-y-6">
            <div className="admin-section-header">
              <h2 className="admin-section-title text-gray-900 dark:text-gray-100">Gestion des annonces</h2>
              <div className="flex gap-2">
                <Button onClick={() => handleNewProduct("saddle")} className="btn-primary admin-add-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle selle
                </Button>
                <Button onClick={() => handleNewProduct("accessory")} variant="outline" className="admin-add-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Accessoire
                </Button>
              </div>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, catégorie, couleur, taille, localisation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters toolbar */}
            <div className="admin-filters-toolbar flex flex-wrap gap-2 items-center">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="selles">Selles</SelectItem>
                  <SelectItem value="accessoires">Accessoires</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="disponibles">Disponibles</SelectItem>
                  <SelectItem value="vendus">Vendus</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCondition} onValueChange={(v) => setFilterCondition(v as typeof filterCondition)}>
                <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="État" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous états</SelectItem>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="occasion">Occasion</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterFeatured} onValueChange={(v) => setFilterFeatured(v as typeof filterFeatured)}>
                <SelectTrigger className="w-auto min-w-[120px]"><SelectValue placeholder="Vedette" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="vedette">Vedette uniquement</SelectItem>
                  <SelectItem value="non-vedette">Non vedette</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-auto min-w-[140px]"><SelectValue placeholder="Tri" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="old">Plus anciens</SelectItem>
                  <SelectItem value="name-asc">Nom A → Z</SelectItem>
                  <SelectItem value="name-desc">Nom Z → A</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleResetFilters} title="Réinitialiser les filtres">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Counter */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredProducts.length} annonce{filteredProducts.length > 1 ? "s" : ""} affichée{filteredProducts.length > 1 ? "s" : ""} sur {products?.length || 0}
            </p>

            {/* Content states */}
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-300 h-6 rounded mb-2"></div>
                    <div className="bg-gray-300 h-4 rounded"></div>
                  </div>
                ))}
              </div>
            ) : productsError ? (
              <div className="text-center py-16">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
                <p className="text-gray-600 mb-4">Impossible de charger les annonces.</p>
                <Button onClick={() => refetchProducts()} variant="outline">
                  Réessayer
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <PackageSearch className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">
                  {hasActiveFilters ? "Aucun résultat" : "Aucune annonce"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {hasActiveFilters
                    ? "Aucune annonce ne correspond à votre recherche. Essayez de modifier les filtres."
                    : "Commencez par créer votre première annonce."}
                </p>
                {hasActiveFilters && (
                  <Button onClick={handleResetFilters} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="admin-product-grid">
                  {paginatedProducts.map((product) => (
                    <Card key={product.id} className="admin-product-card">
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="admin-product-image"
                        />
                        <Badge className="absolute top-2 left-2 bg-blue-500 text-white text-xs">
                          {product.category === "Accessoires" ? product.subcategory : product.category}
                        </Badge>
                        {product.inStock ? (
                          <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
                            Disponible
                          </Badge>
                        ) : (
                          <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                            Vendu
                          </Badge>
                        )}
                        {product.featured && (
                          <Badge className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Vedette
                          </Badge>
                        )}
                      </div>
                      <CardContent className="admin-product-content">
                        <h3 className="admin-product-title">{product.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p className="admin-product-meta">
                            {product.category === "Accessoires" ?
                              (product.subcategory === "Autre" && product.customSubcategory ?
                                product.customSubcategory : product.subcategory)
                              : product.category} - Taille {product.size}
                          </p>
                          {product.color && product.category !== "Accessoires" && (
                            <p className="text-gray-600 dark:text-gray-400">
                              Couleur: {product.color}
                            </p>
                          )}
                          {product.condition && (
                            <p className="text-gray-600 dark:text-gray-400">
                              État: {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                            </p>
                          )}
                          {product.location && (
                            <p className="text-gray-600 dark:text-gray-400">
                              📍 {product.location}
                            </p>
                          )}
                        </div>
                        <p className="admin-product-price text-primary font-semibold mt-2">
                          {parseFloat(product.price).toFixed(2)} €
                        </p>
                        <div className="admin-product-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/product/${product.id}`, "_blank")}
                            className="admin-action-button"
                            title="Voir l'annonce publique"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setImagesProductId(product.id); setImagesDialogOpen(true); }}
                            className="admin-action-button"
                            title="Gérer les images"
                          >
                            <Images className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="admin-action-button"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateProduct(product)}
                            className="admin-action-button"
                            title="Dupliquer"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: "product", id: product.id, name: product.name })}
                            className="admin-action-button text-red-500 hover:text-red-700"
                            title="Supprimer"
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(safeCurrentPage - 1)}
                      disabled={safeCurrentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                      Page {safeCurrentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(safeCurrentPage + 1)}
                      disabled={safeCurrentPage >= totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Gallery Tab — Médiathèque */}
          <TabsContent value="gallery" className="space-y-4 sm:space-y-6">
            <div className="admin-section-header">
              <h2 className="admin-section-title text-gray-900 dark:text-gray-100">Médiathèque</h2>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleNewGalleryItem("image")} className="btn-primary admin-add-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Image
                </Button>
                <Button onClick={() => handleNewGalleryItem("video")} className="btn-primary admin-add-button">
                  <Video className="h-4 w-4 mr-2" />
                  Vidéo
                </Button>
                <Button onClick={() => handleNewGalleryItem("youtube")} className="btn-primary admin-add-button">
                  <Youtube className="h-4 w-4 mr-2" />
                  YouTube
                </Button>
                <Button onClick={() => handleNewGalleryItem("vimeo")} className="btn-primary admin-add-button">
                  <Play className="h-4 w-4 mr-2" />
                  Vimeo
                </Button>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre..."
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={galleryFilterType} onValueChange={setGalleryFilterType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Vidéos</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={galleryFilterCategory} onValueChange={setGalleryFilterCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(gallerySearch || galleryFilterType !== "all" || galleryFilterCategory !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setGallerySearch(""); setGalleryFilterType("all"); setGalleryFilterCategory("all"); }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Counter */}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredGalleryImages.length} média{filteredGalleryImages.length !== 1 ? "s" : ""} affiché{filteredGalleryImages.length !== 1 ? "s" : ""} sur {galleryImages?.length || 0}
            </p>

            {galleryLoading ? (
              <div className="admin-product-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 dark:bg-gray-700 aspect-square rounded-lg mb-2"></div>
                    <div className="bg-gray-300 dark:bg-gray-700 h-4 rounded mb-1"></div>
                    <div className="bg-gray-300 dark:bg-gray-700 h-3 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : galleryError ? (
              <div className="text-center py-16">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
                <p className="text-gray-600 mb-4">Impossible de charger la médiathèque.</p>
                <Button onClick={() => refetchGallery()} variant="outline">
                  Réessayer
                </Button>
              </div>
            ) : filteredGalleryImages.length === 0 ? (
              <div className="text-center py-16">
                <Images className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">{galleryImages?.length === 0 ? "Aucun média" : "Aucun résultat"}</h3>
                <p className="text-gray-600 mb-4">
                  {galleryImages?.length === 0
                    ? "La médiathèque est vide. Ajoutez votre premier média."
                    : "Aucun média ne correspond à votre recherche."}
                </p>
              </div>
            ) : (
              <div className="admin-product-grid">
                {filteredGalleryImages.map((item) => (
                  <Card key={item.id} className="admin-product-card">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title || item.alt || ""}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {/* Media type badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black bg-opacity-70 text-white text-xs flex items-center gap-1">
                          {item.mediaType === "video" && <Video className="h-3 w-3" />}
                          {item.mediaType === "youtube" && <Youtube className="h-3 w-3" />}
                          {item.mediaType === "vimeo" && <Play className="h-3 w-3" />}
                          {item.mediaType === "image" && <Images className="h-3 w-3" />}
                          <span className="capitalize">{item.mediaType}</span>
                        </Badge>
                      </div>
                      {/* Category badge */}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black bg-opacity-70 text-white text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      {/* Play overlay for videos */}
                      {(item.mediaType === "video" || item.mediaType === "youtube" || item.mediaType === "vimeo") && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black bg-opacity-50 rounded-full p-3">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                      {/* Featured badge */}
                      {item.featured && (
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-yellow-500 text-white text-xs flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Vedette
                          </Badge>
                        </div>
                      )}
                      {/* Inactive badge */}
                      {item.active === false && (
                        <div className="absolute bottom-2 right-2">
                          <Badge className="bg-gray-500 text-white text-xs">
                            Inactif
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="admin-product-content">
                      <p className="admin-product-title">{item.title || item.alt || "Sans titre"}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                      )}
                      <div className="admin-product-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGalleryMove(item.id, "up")}
                          className="admin-action-button"
                          title="Monter"
                          disabled={reorderGalleryMutation.isPending}
                        >
                          <ChevronLeft className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGalleryMove(item.id, "down")}
                          className="admin-action-button"
                          title="Descendre"
                          disabled={reorderGalleryMutation.isPending}
                        >
                          <ChevronRight className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGalleryItem(item)}
                          className="admin-action-button"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateGalleryItem(item)}
                          className="admin-action-button"
                          title="Dupliquer"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget({ type: "gallery", id: item.id, name: item.title || item.alt || "ce média" })}
                          className="admin-action-button text-red-500 hover:text-red-700"
                          title="Supprimer"
                          disabled={deleteGalleryImageMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>



          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <OrdersManagement />
          </TabsContent>
        </Tabs>

        {/* Product Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier l'annonce" : "Nouvelle annonce"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? "Modifiez les détails de l'annonce" : "Créez une nouvelle annonce de selle ou accessoire équestre"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    {...productForm.register("name")}
                    placeholder="Nom de l'article"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  {/* FIX: label for/id - Added id to SelectTrigger for accessibility */}
                  <Select
                    value={productForm.watch("category")}
                    onValueChange={(value) => {
                      productForm.setValue("category", value);
                      // Reset subcategory when category changes
                      if (value !== "Accessoires") {
                        productForm.setValue("subcategory", "");
                      }
                    }}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sous-catégorie pour les accessoires */}
              {productForm.watch("category") === "Accessoires" && (
                <div>
                  <Label htmlFor="subcategory">Sous-catégorie *</Label>
                  {/* FIX: label for/id - Added id to SelectTrigger for accessibility */}
                  <Select
                    value={productForm.watch("subcategory") || ""}
                    onValueChange={(value) => {
                      productForm.setValue("subcategory", value);
                      // Reset custom subcategory when changing selection
                      if (value !== "Autre") {
                        productForm.setValue("customSubcategory", "");
                      }
                    }}
                  >
                    <SelectTrigger id="subcategory">
                      <SelectValue placeholder="Sélectionner une sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessorySubcategories.map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Champ personnalisé pour "Autre" sous-catégorie */}
              {productForm.watch("category") === "Accessoires" && productForm.watch("subcategory") === "Autre" && (
                <div>
                  <Label htmlFor="customSubcategory">Précisez le type d'accessoire *</Label>
                  <Input
                    id="customSubcategory"
                    {...productForm.register("customSubcategory")}
                    placeholder="Ex: Licol, Longe, Cravache, Boots, etc."
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="size">Taille *</Label>
                  <Select
                    value={productForm.watch("size")}
                    onValueChange={(value) => productForm.setValue("size", value)}
                  >
                    <SelectTrigger id="size">
                      <SelectValue placeholder="Sélectionner une taille" />
                    </SelectTrigger>
                    <SelectContent>
                      {(productForm.watch("category") === "Accessoires" ? accessorySizes : saddleSizes).map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {productForm.watch("category") !== "Accessoires" && (
                  <div>
                    <Label htmlFor="color">Couleur</Label>
                    <Select
                      value={productForm.watch("color") || ""}
                      onValueChange={(value) => productForm.setValue("color", value)}
                    >
                      <SelectTrigger id="color">
                        <SelectValue placeholder="Sélectionner une couleur" />
                      </SelectTrigger>
                      <SelectContent>
                        {saddleColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="condition">État</Label>
                  <Select
                    value={productForm.watch("condition") || ""}
                    onValueChange={(value) => productForm.setValue("condition", value)}
                  >
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Sélectionner l'état" />
                    </SelectTrigger>
                    <SelectContent>
                      {productConditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition.charAt(0).toUpperCase() + condition.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...productForm.register("price")}
                    placeholder="Prix en euros"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    {...productForm.register("location")}
                    placeholder="Ville ou région"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...productForm.register("description")}
                  placeholder="Décrivez l'état, les caractéristiques et autres détails importants"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="sellerContact">Contact vendeur</Label>
                <Input
                  id="sellerContact"
                  {...productForm.register("sellerContact")}
                  placeholder="Téléphone ou email pour contact direct"
                />
              </div>

              <ImageUpload
                onImageSelect={({ url, file }) => {
                  productForm.setValue("image", url);
                  setSelectedImageFile(file);
                }}
                currentImage={productForm.watch("image")}
                placeholder="Sélectionner l'image principale"
              />

              {editingProduct ? (
                <div className="pt-2 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Gérer plusieurs images (3–5)</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImagesProductId(editingProduct.id);
                      setResumeEditAfterImages(true);
                      setShowProductDialog(false); // avoid two focus-trapped modals
                      setImagesDialogOpen(true);
                    }}
                  >
                    Gérer les images
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 pt-2">
                  Après la création de l'annonce, vous pourrez ajouter jusqu'à 5 images depuis la gestion des images.
                </p>
              )}

              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={productForm.watch("inStock") !== false}
                    onCheckedChange={(checked) => productForm.setValue("inStock", !!checked)}
                  />
                  <Label htmlFor="inStock">Annonce active (disponible à la vente)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={productForm.watch("featured") === true}
                    onCheckedChange={(checked) => productForm.setValue("featured", !!checked)}
                  />
                  <Label htmlFor="featured" className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Afficher en "Produits en Vedette" sur la page d'accueil
                  </Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowProductDialog(false)} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button type="submit" className="btn-primary w-full sm:w-auto" disabled={uploadingImage}>
                  {uploadingImage ? "Upload en cours..." : (editingProduct ? "Modifier" : "Créer l'annonce")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Gallery Dialog — Médiathèque */}
        <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>{editingGalleryItem ? "Modifier le média" : "Ajouter un média"}</DialogTitle>
              <DialogDescription>
                {galleryMediaType === "image" && "Ajoutez une image à la médiathèque"}
                {galleryMediaType === "video" && "Ajoutez une vidéo (MP4, WebM, MOV)"}
                {galleryMediaType === "youtube" && "Ajoutez une vidéo YouTube via son URL"}
                {galleryMediaType === "vimeo" && "Ajoutez une vidéo Vimeo via son URL"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={galleryForm.handleSubmit(handleGallerySubmit)} className="space-y-4">
              {/* Media input depends on type */}
              {galleryMediaType === "image" && (
                <ImageUpload
                  onImageSelect={({ url, file }) => {
                    galleryForm.setValue("url", url);
                    setSelectedImageFile(file);
                    setGalleryPreview({ url, mediaType: "image" });
                  }}
                  currentImage={galleryForm.watch("url")}
                  placeholder="Sélectionner une image"
                />
              )}
              {galleryMediaType === "video" && (
                <div>
                  <Label htmlFor="videoFile">Fichier vidéo (MP4, WebM, MOV — max 50 Mo)</Label>
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedImageFile(file);
                        galleryForm.setValue("url", "");
                        setGalleryPreview({ url: URL.createObjectURL(file), mediaType: "video" });
                      }
                    }}
                  />
                </div>
              )}
              {(galleryMediaType === "youtube" || galleryMediaType === "vimeo") && (
                <div>
                  <Label htmlFor="externalUrl">
                    {galleryMediaType === "youtube" ? "URL YouTube" : "URL Vimeo"}
                  </Label>
                  <Input
                    id="externalUrl"
                    placeholder={galleryMediaType === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://vimeo.com/..."}
                    value={galleryExternalUrl}
                    onChange={(e) => setGalleryExternalUrl(e.target.value)}
                  />
                  {galleryExternalUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={async () => {
                        try {
                          const resp = await fetch("/api/upload/external-video", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ url: galleryExternalUrl }),
                          });
                          if (!resp.ok) {
                            const err = await resp.json();
                            throw new Error(err.error || "URL invalide");
                          }
                          const result = await resp.json();
                          setGalleryPreview({ url: result.url, thumbnailUrl: result.thumbnailUrl, mediaType: result.mediaType });
                          galleryForm.setValue("url", result.url);
                          galleryForm.setValue("thumbnailUrl", result.thumbnailUrl);
                          galleryForm.setValue("mediaType", result.mediaType);
                        } catch (err: any) {
                          toast({ title: "Erreur", description: err.message, variant: "destructive" });
                        }
                      }}
                    >
                      Prévisualiser
                    </Button>
                  )}
                </div>
              )}

              {/* Preview */}
              {galleryPreview && (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={galleryPreview.thumbnailUrl || galleryPreview.url}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                  {(galleryPreview.mediaType === "video" || galleryPreview.mediaType === "youtube" || galleryPreview.mediaType === "vimeo") && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 rounded-full p-3">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="galleryTitle">Titre</Label>
                <Input
                  id="galleryTitle"
                  {...galleryForm.register("title")}
                  placeholder="Titre du média"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="galleryDescription">Description</Label>
                <Textarea
                  id="galleryDescription"
                  {...galleryForm.register("description")}
                  placeholder="Description (optionnelle)"
                  rows={2}
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="galleryCategory">Catégorie *</Label>
                <Select
                  value={galleryForm.watch("category")}
                  onValueChange={(value) => galleryForm.setValue("category", value)}
                >
                  <SelectTrigger id="galleryCategory">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Featured + Active */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="galleryFeatured"
                    checked={galleryForm.watch("featured")}
                    onCheckedChange={(checked) => galleryForm.setValue("featured", checked === true)}
                  />
                  <Label htmlFor="galleryFeatured" className="text-sm cursor-pointer">Vedette</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="galleryActive"
                    checked={galleryForm.watch("active")}
                    onCheckedChange={(checked) => galleryForm.setValue("active", checked === true)}
                  />
                  <Label htmlFor="galleryActive" className="text-sm cursor-pointer">Actif</Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowGalleryDialog(false)} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="btn-primary w-full sm:w-auto"
                  disabled={galleryUploading || createGalleryImageMutation.isPending || updateGalleryImageMutation.isPending}
                >
                  {galleryUploading ? "Upload..." : editingGalleryItem ? "Enregistrer" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Product Images Dialog */}
        <Dialog
          open={imagesDialogOpen}
          onOpenChange={(open) => {
            setImagesDialogOpen(open);
            if (!open && resumeEditAfterImages) {
              setShowProductDialog(true);
              setResumeEditAfterImages(false);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Gérer les images du produit</DialogTitle>
              <DialogDescription>
                Ajoutez, supprimez et définissez l'image principale. Maximum 5 images, minimum recommandé 3.
              </DialogDescription>
            </DialogHeader>
            {imagesProductId !== null && (
              <div className="mt-2">
                <ProductImageManager productId={imagesProductId} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ?
                Cette action est définitive et ne peut pas être annulée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteProductMutation.isPending || deleteGalleryImageMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteProductMutation.isPending || deleteGalleryImageMutation.isPending
                  ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Images Manager Dialog mounted at root level of Admin page
// Ensure it renders outside of product cards
