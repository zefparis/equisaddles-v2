import { useEffect } from "react";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  Shield, 
  AlertTriangle,
  Globe,
  Home,
  Store,
  Zap,
  CreditCard,
  Phone,
  Mail
} from "lucide-react";

export default function Delivery() {
  const { t } = useLanguage();

  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Truck className="h-10 w-10 text-primary" />
            {t("legal.delivery.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("legal.delivery.subtitle")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800">{t("delivery.europe")}</h3>
                <p className="text-sm text-blue-700">{t("delivery.europeDesc")}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">{t("delivery.fastShipping")}</h3>
                <p className="text-sm text-green-700">{t("delivery.franceShipping")}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800">{t("delivery.packaging")}</h3>
                <p className="text-sm text-purple-700">{t("delivery.packagingDesc")}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-semibold text-orange-800">{t("delivery.tracking.title")}</h3>
                <p className="text-sm text-orange-700">{t("delivery.trackingDesc")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <strong>{t("delivery.important")} :</strong> {t("delivery.importantDesc")}
            </AlertDescription>
          </Alert>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t("delivery.options.title")} Standard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start gap-3">
                      <Home className="h-6 w-6 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">{t("delivery.home.title")}</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• {t("delivery.home.direct")}</li>
                          <li>• {t("delivery.home.signature")}</li>
                          <li>• {t("delivery.home.attempts")}</li>
                          <li>• {t("delivery.home.sms")}</li>
                        </ul>
                        <div className="mt-3">
                          <Badge variant="secondary">{t("delivery.fastShipping")} {t("delivery.franceShipping")}</Badge>
                          <Badge variant="outline" className="ml-2">8,50€ - 18,90€</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-start gap-3">
                      <Store className="h-6 w-6 text-green-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-green-800 mb-2">{t("delivery.relay.title")}</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• {t("delivery.relay.points")}</li>
                          <li>• {t("delivery.relay.hours")}</li>
                          <li>• {t("delivery.relay.pickup")}</li>
                          <li>• {t("delivery.relay.notification")}</li>
                        </ul>
                        <div className="mt-3">
                          <Badge variant="secondary">2-3 jours</Badge>
                          <Badge variant="outline" className="ml-2">5,90€ - 12,90€</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-start gap-3">
                      <Clock className="h-6 w-6 text-purple-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-2">Livraison Predict</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          <li>• Créneau horaire de 1h</li>
                          <li>• SMS la veille avec créneau</li>
                          <li>• Possibilité de reporter</li>
                          <li>• Suivi en temps réel</li>
                        </ul>
                        <div className="mt-3">
                          <Badge variant="secondary">1-2 jours</Badge>
                          <Badge variant="outline" className="ml-2">10,90€ - 21,90€</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start gap-3">
                      <Zap className="h-6 w-6 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-2">Express 10h</h4>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• Livraison avant 10h</li>
                          <li>• Jour ouvré suivant</li>
                          <li>• Belgique et pays limitrophes</li>
                          <li>• Signature obligatoire</li>
                        </ul>
                        <div className="mt-3">
                          <Badge variant="secondary">24h</Badge>
                          <Badge variant="outline" className="ml-2">18,90€ - 35,90€</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Zones de Livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Zone Belgique</h4>
                  <p className="text-sm text-green-700 mb-3">Belgique et pays limitrophes</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Délai :</span>
                      <span className="font-medium">2-3 jours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix à partir de :</span>
                      <span className="font-medium">5,90€</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Zone Europe</h4>
                  <p className="text-sm text-blue-700 mb-3">UE, Suisse, Norvège, UK</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Délai :</span>
                      <span className="font-medium">3-5 jours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix à partir de :</span>
                      <span className="font-medium">15,90€</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">Zone Internationale</h4>
                  <p className="text-sm text-purple-700 mb-3">Autres pays sur demande</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Délai :</span>
                      <span className="font-medium">5-10 jours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix :</span>
                      <span className="font-medium">Sur devis</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>Livraison internationale :</strong> Des frais de douane et taxes locales 
                  peuvent s'appliquer selon la destination. Ces frais sont à la charge du destinataire.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Packaging */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Emballage et Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Notre Engagement Emballage</h4>
                <p className="text-sm text-green-700">
                  Chaque selle est soigneusement emballée par nos experts pour garantir 
                  une protection maximale pendant le transport. Nous utilisons des matériaux 
                  de qualité professionnelle pour préserver l'intégrité de votre achat.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Protection Selle</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Housse de protection en tissu</li>
                    <li>• Film plastique étanche</li>
                    <li>• Calage sur mesure en mousse</li>
                    <li>• Carton renforcé double épaisseur</li>
                    <li>• {t("delivery.packagingFragile")}</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Sécurisation Colis</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Sangles de maintien intérieur</li>
                    <li>• Adhésif de sécurité</li>
                    <li>• Étiquetage professionnel</li>
                    <li>• Numéro de suivi visible</li>
                    <li>• Assurance transport incluse</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Suivi de Commande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Notifications Automatiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Confirmation de commande (immédiat)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Préparation en cours (24h)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Expédition + numéro de suivi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Livraison confirmée</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Canaux de Communication</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>Email avec lien de suivi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>SMS Standard (si activé)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span>Suivi en ligne 24h/24</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Problème de Livraison ?</h4>
                <p className="text-sm text-blue-700 mb-3">
                  En cas de problème avec votre livraison, contactez directement Standard 
                  ou notre service client qui fera le lien avec le transporteur.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    <Phone className="h-3 w-3 mr-1" />
                    Standard : +32 496 94 41 25
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="h-3 w-3 mr-1" />
                    equisaddles@gmail.com
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Calcul des Frais de Livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Frais de Livraison</h4>
                <p className="text-sm text-green-700">
                  Les frais de livraison dépendent de la destination et du poids de la commande.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Facteurs de Calcul</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Destination (zone géographique)</li>
                    <li>• Poids et dimensions du colis</li>
                    <li>• Service de livraison choisi</li>
                    <li>• Options supplémentaires</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Estimation en Temps Réel</h4>
                  <p className="text-sm text-gray-600">
                    Les frais de livraison sont calculés automatiquement 
                    lors de la finalisation de votre commande, selon 
                    votre adresse de livraison et vos préférences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact for Delivery */}
          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Questions sur la Livraison ?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Notre équipe logistique est à votre disposition pour toute question 
                  concernant l'expédition et la livraison de votre commande.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    equisaddles@gmail.com
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    +32 496 94 41 25
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Service disponible du lundi au vendredi, 9h-18h
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}