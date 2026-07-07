import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "../contexts/AdminAuthContext";
import AdminLogin from "../components/admin/AdminLogin";
import "../styles/admin-responsive.css";
import { useToast } from "../hooks/use-toast";
import { scrollToTop } from "../lib/utils";
import { apiRequest } from "../lib/queryClient";
import { Product, GalleryImage, Order, insertProductSchema, insertGalleryImageSchema } from "@shared/schema";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Package, Images, ShoppingCart, Plus, Edit, Trash2, MessageCircle, Star, FileText } from "lucide-react";
import ProductImageManager from "../components/admin/product-image-manager";
import ImageUpload from "../components/admin/image-upload";
import ChatAdmin from "../components/admin/chat-admin";
import InvoiceGenerator from "../components/admin/invoice-generator";

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
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  // Queries
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: galleryImages, isLoading: galleryLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
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
      toast({ title: "Image ajoutée avec succès" });
      setShowGalleryDialog(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteGalleryImageMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/gallery/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({ title: "Image supprimée avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

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
      url: "",
      alt: "",
      category: "Obstacle",
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
    
    try {
      let imageUrl = data.url;
      
      // Si un fichier d'image a été sélectionné, l'uploader d'abord
      if (selectedImageFile) {
        imageUrl = await uploadImage(selectedImageFile);
        data.url = imageUrl;
      }
      
      createGalleryImageMutation.mutate(data);
      
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
            <TabsTrigger value="chat" className="admin-tab-trigger">
              <MessageCircle className="admin-tab-icon" />
              <span>Chat</span>
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
            ) : (
              <div className="admin-product-grid">
                {products?.map((product) => (
                  <Card key={product.id} className="admin-product-card">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
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
                          onClick={() => { setImagesProductId(product.id); setImagesDialogOpen(true); }}
                          className="admin-action-button"
                        >
                          <Images className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="admin-action-button"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          className="admin-action-button text-red-500 hover:text-red-700"
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

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4 sm:space-y-6">
            <div className="admin-section-header">
              <h2 className="admin-section-title text-gray-900 dark:text-gray-100">Gestion de la galerie</h2>
              <Button onClick={() => setShowGalleryDialog(true)} className="btn-primary admin-add-button">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle image
              </Button>
            </div>

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
            ) : (
              <div className="admin-product-grid">
                {galleryImages?.map((image) => (
                  <Card key={image.id} className="admin-product-card">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-black bg-opacity-70 text-white text-xs">
                          {image.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="admin-product-content">
                      <p className="admin-product-title">{image.alt}</p>
                      <div className="admin-product-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteGalleryImageMutation.mutate(image.id)}
                          className="admin-action-button text-red-500 hover:text-red-700 w-full"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Supprimer
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
            <h2 className="text-2xl font-semibold">Gestion des commandes</h2>

            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-24 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : orders?.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-24 w-24 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Aucune commande</h3>
                <p className="text-gray-600">Les commandes apparaîtront ici une fois effectuées.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders?.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Commande #{order.id}
                          </h3>
                          <p className="text-gray-600">
                            {order.customerName} - {order.customerEmail}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={order.status === 'paid' ? 'default' : 'secondary'}
                          >
                            {order.status}
                          </Badge>
                          <p className="text-lg font-bold text-primary mt-1">
                            {parseFloat(order.totalAmount).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Adresse de livraison</h4>
                          <p className="text-sm text-gray-600">
                            {order.customerAddress}<br />
                            {order.customerCity}, {order.customerPostalCode}<br />
                            {order.customerCountry}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Date de commande</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt!).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Articles commandés */}
                      <div className="mt-4">
                        <h4 className="font-semibold mb-3">Articles commandés</h4>
                        {(() => {
                          try {
                            const items = JSON.parse(order.items);
                            if (!items || items.length === 0) {
                              return (
                                <p className="text-sm text-gray-500 italic">
                                  Aucun article dans cette commande
                                </p>
                              );
                            }
                            return (
                              <div className="space-y-2">
                                {items.map((item: any, index: number) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    {item.imageUrl && (
                                      <img 
                                        src={item.imageUrl} 
                                        alt={item.name}
                                        className="w-16 h-16 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-sm text-gray-600">
                                        Quantité: {item.quantity}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-primary">
                                        {parseFloat(item.price).toFixed(2)} €
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Total: {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch (e) {
                            return (
                              <p className="text-sm text-red-500">
                                Erreur lors du chargement des articles
                              </p>
                            );
                          }
                        })()}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setInvoiceDialogOpen(true);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Générer facture
                        </Button>
                      </div>

                      {/* Contact Info for Manual Processing */}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Action requise</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Contactez le client pour organiser la livraison ou la récupération de la commande.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Chat Support Tab */}
          <TabsContent value="chat" className="space-y-4 sm:space-y-6">
            <div className="admin-section-header">
              <h2 className="admin-section-title text-gray-900 dark:text-gray-100">Chat Support Admin</h2>
            </div>
            <div className="admin-chat-widget">
              <ChatAdmin />
            </div>
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

        {/* Gallery Dialog */}
        <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>Nouvelle image</DialogTitle>
              <DialogDescription>
                Ajoutez une image à la galerie
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={galleryForm.handleSubmit(handleGallerySubmit)} className="space-y-4">
              <ImageUpload
                onImageSelect={({ url, file }) => {
                  galleryForm.setValue("url", url);
                  setSelectedImageFile(file);
                }}
                currentImage={galleryForm.watch("url")}
                placeholder="Sélectionner une image pour la galerie"
              />

              <div>
                <Label htmlFor="alt">Texte alternatif *</Label>
                <Input
                  id="alt"
                  {...galleryForm.register("alt")}
                  placeholder="Description de l'image"
                />
              </div>

              <div>
                <Label htmlFor="galleryCategory">Catégorie *</Label>
                {/* FIX: label for/id - Added id to SelectTrigger for accessibility */}
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

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowGalleryDialog(false)} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button type="submit" className="btn-primary w-full sm:w-auto">
                  Ajouter
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

        {/* Invoice Generator Dialog */}
        {selectedOrder && (
          <InvoiceGenerator
            order={selectedOrder}
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
          />
        )}
      </div>
    </div>
  );
}

// Images Manager Dialog mounted at root level of Admin page
// Ensure it renders outside of product cards
