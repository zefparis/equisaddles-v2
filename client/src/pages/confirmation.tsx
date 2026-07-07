import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "../hooks/use-cart";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { CheckCircle, Package, Truck, Mail } from "lucide-react";

export default function Confirmation() {
  const { clearCart } = useCart();
  const { t } = useLanguage();
  const [location] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const processedRef = useRef(false);

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    // Utiliser window.location.search pour récupérer la query string
    const params = new URLSearchParams(window.location.search);
    const sessionIdParam = params.get('session_id');
    
    console.log('🔍 Confirmation page loaded');
    console.log('🔍 Full URL:', window.location.href);
    console.log('🔍 session_id from URL:', sessionIdParam);
    
    // Ne traiter qu'une seule fois
    if (sessionIdParam && !processedRef.current) {
      processedRef.current = true;
      setSessionId(sessionIdParam);
      
      console.log('🛒 Clearing cart...');
      clearCart();
      
      // Force cart clear via localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('equi-saddles-cart');
        console.log('✅ Cart cleared from localStorage');
      }
      
      // Vérifier et créer la commande si elle n'existe pas
      console.log('📞 Calling verify-session API with session:', sessionIdParam);
      verifyAndCreateOrder(sessionIdParam);
    } else if (!sessionIdParam) {
      console.error('❌ No session_id found in URL!');
    }
  }, [location, clearCart]);

  const verifyAndCreateOrder = async (sessionId: string) => {
    try {
      const response = await apiRequest("POST", "/api/verify-session", { sessionId });
      const data = await response.json();
      
      if (data.success) {
        setOrderCreated(true);
        console.log('✅ Order verified/created:', data.orderId);
      }
    } catch (error) {
      console.error('Error verifying order:', error);
      // La commande sera créée par le webhook Stripe en production
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("confirmation.title")}
            </h1>
            <p className="text-gray-600">
              {t("confirmation.thankYou")}
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("confirmation.orderDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sessionId && (
                <div>
                  <p className="text-sm text-gray-600">{t("confirmation.orderNumber")}</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {sessionId}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t("confirmation.orderDate")}</p>
                  <p className="font-semibold">
                    {new Date().toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">{t("confirmation.status")}</p>
                  <p className="font-semibold text-green-600">{t("confirmation.confirmed")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Prochaines étapes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Confirmation par email</h4>
                    <p className="text-sm text-gray-600">
                      Vous recevrez un email de confirmation avec tous les détails de votre commande.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Préparation</h4>
                    <p className="text-sm text-gray-600">
                      Votre commande sera préparée et expédiée sous 24h ouvrées.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Livraison</h4>
                    <p className="text-sm text-gray-600">
                      Livraison par Standard sous 2-3 jours ouvrés. Vous recevrez un numéro de suivi.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Pour toute question concernant votre commande, n'hésitez pas à nous contacter :
              </p>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>equisaddles@gmail.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <span>📞</span>
                  <span>+32 496 94 41 25</span>
                </p>
                <p className="text-sm text-gray-600">
                  Horaires : Lundi-Vendredi 9h-18h
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/catalog">
              <Button className="btn-primary">
                Continuer mes achats
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
