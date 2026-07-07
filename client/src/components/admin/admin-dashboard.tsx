import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Euro,
  Image,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity
} from "lucide-react";
import { Product, Order } from "@shared/schema";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Statistiques
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.inStock).length || 0;
  const soldProducts = products?.filter(p => !p.inStock).length || 0;
  
  const saddleCount = products?.filter(p => p.category !== "Accessoires").length || 0;
  const accessoryCount = products?.filter(p => p.category === "Accessoires").length || 0;
  
  const totalOrders = orders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
  const completedOrders = orders?.filter(o => o.status === "paid").length || 0;
  
  const totalRevenue = orders?.reduce((sum, order) => 
    sum + parseFloat(order.totalAmount), 0
  ) || 0;

  const averagePrice = products && products.length > 0
    ? products.reduce((sum, p) => sum + parseFloat(p.price), 0) / products.length
    : 0;

  // Produits récents
  const recentProducts = products?.slice(-5).reverse() || [];
  
  // Commandes récentes
  const recentOrders = orders?.slice(-5).reverse() || [];

  // Catégories populaires
  const categoryStats = products?.reduce((acc, product) => {
    const cat = product.category === "Accessoires" 
      ? (product.subcategory || "Accessoires")
      : product.category;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const popularCategories = Object.entries(categoryStats || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Annonces</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {activeProducts} actives
              </Badge>
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {soldProducts} vendues
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="text-xs bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                {completedOrders} payées
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {pendingOrders} en attente
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground mt-2">
              Prix moyen: {averagePrice.toFixed(2)}€
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Répartition</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Selles</span>
                <span className="font-bold">{saddleCount}</span>
              </div>
              <Progress value={(saddleCount / totalProducts) * 100} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm">Accessoires</span>
                <span className="font-bold">{accessoryCount}</span>
              </div>
              <Progress value={(accessoryCount / totalProducts) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produits récents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Annonces Récentes
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="#products">Voir tout</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune annonce pour le moment
                </p>
              ) : (
                recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.category === "Accessoires" 
                            ? product.subcategory || "Accessoire"
                            : product.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Taille {product.size}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{parseFloat(product.price).toFixed(2)}€</p>
                      <Badge 
                        variant={product.inStock ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {product.inStock ? "Disponible" : "Vendu"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Catégories populaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Catégories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune donnée disponible
                </p>
              ) : (
                popularCategories.map(([category, count], index) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <Badge variant="secondary">{count} articles</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes récentes */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Commandes Récentes
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="#orders">Voir tout</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div>
                    <p className="font-medium">Commande #{order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName} - {order.customerEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt!).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {parseFloat(order.totalAmount).toFixed(2)}€
                    </p>
                    <Badge 
                      variant={order.status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {order.status === 'paid' ? 'Payée' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="w-full" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Nouvelle Selle
            </Button>
            <Button className="w-full" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Nouvel Accessoire
            </Button>
            <Button className="w-full" variant="outline">
              <Image className="h-4 w-4 mr-2" />
              Ajouter Galerie
            </Button>
            <Button className="w-full" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Voir Chat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
