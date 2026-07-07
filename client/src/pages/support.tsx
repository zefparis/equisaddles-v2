import { useEffect } from "react";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { 
  Headphones, 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  HelpCircle,
  FileText,
  Package,
  CreditCard,
  Truck
} from "lucide-react";

export default function Support() {
  const { t } = useLanguage();

  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Headphones className="h-10 w-10 text-primary" />
            {t("legal.support.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("legal.support.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t("support.contact.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-sm text-gray-600">equisaddles@gmail.com</p>
                      <Badge variant="secondary" className="mt-1">{t("support.email.response")}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Téléphone</h3>
                      <p className="text-sm text-gray-600">+32 496 94 41 25</p>
                      <Badge variant="secondary" className="mt-1">{t("support.phone.hours")}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold">{t("support.hours.title")}</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>{t("support.hours.weekdays")} :</strong> {t("support.hours.weekdaysTime")}</p>
                    <p><strong>{t("support.hours.saturday")} :</strong> {t("support.hours.saturdayTime")}</p>
                    <p><strong>{t("support.hours.sunday")} :</strong> {t("support.hours.closed")}</p>
                    <p className="text-amber-700 mt-2">
                      <strong>{t("support.hours.emergency")} :</strong> {t("support.hours.emergencyDesc")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  {t("support.faq.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">{t("support.faq.q1")}</h4>
                    <p className="text-sm text-gray-600">
                      {t("support.faq.a1")}
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">{t("support.faq.q2")}</h4>
                    <p className="text-sm text-gray-600">
                      {t("support.faq.a2")}
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold mb-2">{t("support.faq.q3")}</h4>
                    <p className="text-sm text-gray-600">
                      {t("support.faq.a3")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Categories */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("support.categories.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  {t("support.categories.products")}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t("support.categories.orders")}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Truck className="h-4 w-4 mr-2" />
{t("support.categories.delivery")}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Garantie & SAV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Qualité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p><strong>Expertise :</strong> Plus de 20 ans d'expérience dans l'équitation</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p><strong>Qualité :</strong> Selles fabriquées par des maîtres selliers</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p><strong>Support :</strong> Accompagnement personnalisé pour chaque client</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <p><strong>Satisfaction :</strong> 98% de clients satisfaits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-12">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Support d'Urgence</h3>
                <p className="text-red-700 mb-4">
                  Pour les problèmes urgents liés à votre commande ou à la sécurité
                </p>
                <Button variant="destructive">
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler le Support d'Urgence
                </Button>
                <p className="text-xs text-red-600 mt-2">
                  Disponible 24h/24 - 7j/7
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}