import { useEffect } from "react";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  Headphones, 
  Clock, 
  Star, 
  Shield, 
  CheckCircle,
  Mail,
  Phone,
  MessageCircle,
  Users,
  Award,
  Heart,
  Zap,
  ThumbsUp,
  HelpCircle
} from "lucide-react";

export default function CustomerService() {
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
            {t("legal.customerService.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("legal.customerService.subtitle")}
          </p>
          <Badge variant="default" className="mt-4 text-lg px-4 py-2">
            ⭐ {t("service.rating")} : 4.9/5 - {t("service.reviews")}
          </Badge>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Service Promise */}
          <Card className="bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">{t("service.promise.title")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="flex flex-col items-center">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold">{t("service.reactivity")}</h3>
                    <p className="text-sm text-gray-600 text-center">{t("service.reactivityDesc")}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <Heart className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">{t("service.listening")}</h3>
                    <p className="text-sm text-gray-600 text-center">{t("service.listeningDesc")}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="bg-purple-100 p-3 rounded-full mb-3">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">{t("service.expertise")}</h3>
                    <p className="text-sm text-gray-600 text-center">{t("service.expertiseDesc")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t("service.contact.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Mail className="h-6 w-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-2">{t("service.email.title")}</h4>
                      <p className="text-sm text-blue-700 mb-2">
                        <strong>equisaddles@gmail.com</strong>
                      </p>
                      <ul className="text-sm text-blue-600 space-y-1">
                        <li>• {t("service.email.response")}</li>
                        <li>• {t("service.email.team")}</li>
                        <li>• {t("service.email.tracking")}</li>
                        <li>• {t("service.email.archive")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3">
                    <Phone className="h-6 w-6 text-green-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-green-800 mb-2">{t("service.phone.title")}</h4>
                      <p className="text-sm text-green-700 mb-2">
                        <strong>+32 496 94 41 25</strong>
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        <li>• {t("service.phone.hours")}</li>
                        <li>• {t("service.phone.saturday")}</li>
                        <li>• {t("service.phone.expert")}</li>
                        <li>• {t("service.phone.emergency")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <Alert className="bg-orange-50 border-orange-200">
                <Zap className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  <strong>{t("service.express.title")} :</strong> {t("service.express.description")}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Service Standards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                {t("service.standards.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t("service.response.title")}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <span className="text-sm font-medium">{t("service.response.general")}</span>
                      <Badge variant="outline" className="bg-green-100">{t("service.response.24h")}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <span className="text-sm font-medium">{t("service.response.technical")}</span>
                      <Badge variant="outline" className="bg-blue-100">{t("service.response.12h")}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                      <span className="text-sm font-medium">{t("service.response.urgent")}</span>
                      <Badge variant="outline" className="bg-orange-100">{t("service.response.2h")}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                      <span className="text-sm font-medium">{t("service.response.critical")}</span>
                      <Badge variant="outline" className="bg-red-100">{t("service.response.immediate")}</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">{t("service.quality.title")}</h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{t("service.quality.dedicated")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{t("service.quality.followup")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{t("service.quality.expertise")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{t("service.quality.personalized")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">{t("service.quality.satisfaction")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("service.team.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">{t("service.team.passionate")}</h4>
                <p className="text-sm text-blue-700">
                  {t("service.team.description")}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h5 className="font-semibold mb-1">{t("service.team.experts")}</h5>
                  <p className="text-sm text-gray-600">{t("service.team.expertsDesc")}</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-8 w-8 text-green-600" />
                  </div>
                  <h5 className="font-semibold mb-1">{t("service.team.riders")}</h5>
                  <p className="text-sm text-gray-600">{t("service.team.ridersDesc")}</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ThumbsUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <h5 className="font-semibold mb-1">{t("service.team.premium")}</h5>
                  <p className="text-sm text-gray-600">{t("service.team.premiumDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Questions Fréquentes Service Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-2">Comment obtenir des conseils personnalisés ?</h4>
                  <p className="text-sm text-gray-600">
                    Nos experts peuvent vous conseiller par téléphone ou email. Préparez les mesures 
                    de votre cheval, votre niveau et discipline pour un conseil optimal.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-2">Puis-je modifier ma commande après validation ?</h4>
                  <p className="text-sm text-gray-600">
                    Oui, contactez-nous rapidement. Si la commande n'est pas encore expédiée, 
                    nous pouvons généralement procéder aux modifications.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold mb-2">Que faire si ma selle ne convient pas ?</h4>
                  <p className="text-sm text-gray-600">
                    Notre service d'échange facilité vous permet de trouver la selle parfaite. 
                    Nous vous accompagnons jusqu'à votre entière satisfaction.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold mb-2">Offrez-vous un service après-vente ?</h4>
                  <p className="text-sm text-gray-600">
                    Absolument ! Conseils d'entretien, garantie étendue, service de réparation... 
                    Nous restons à vos côtés bien après l'achat.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Satisfaction */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Shield className="h-5 w-5" />
                Garantie Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="bg-green-100 border-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <strong>Engagement 100% Satisfaction :</strong> Si vous n'êtes pas entièrement 
                    satisfait de notre service client, nous nous engageons à améliorer 
                    immédiatement votre expérience jusqu'à votre satisfaction complète.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Nos Garanties</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Réponse dans les délais annoncés</li>
                      <li>• Résolution effective de votre problème</li>
                      <li>• Conseils d'experts qualifiés</li>
                      <li>• Suivi jusqu'à satisfaction complète</li>
                      <li>• Amélioration continue de nos services</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Votre Feedback</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Votre avis nous est précieux pour améliorer constamment 
                      la qualité de notre service client.
                    </p>
                    <Button size="sm" className="w-full">
                      <Star className="h-4 w-4 mr-2" />
                      Évaluer Notre Service
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-800 mb-3">Contact d'Urgence</h3>
                <p className="text-sm text-red-700 mb-4">
                  Pour les situations critiques nécessitant une intervention immédiate 
                  (problème de sécurité, commande urgente, incident grave)
                </p>
                <Button variant="destructive" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligne d'Urgence : +32 496 94 41 25
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}