import { useEffect } from "react";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Shield, Lock, Eye, Database, Mail, UserCheck } from "lucide-react";

export default function Privacy() {
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
            <Shield className="h-10 w-10 text-primary" />
            {t("legal.privacy.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("privacy.subtitle")}
          </p>
          <Badge variant="secondary" className="mt-4">
            {t("privacy.lastUpdated")}
          </Badge>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t("privacy.collection.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{t("privacy.dataCollected")}</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <strong>{t("privacy.personalInfo")} :</strong> {t("privacy.personalInfoDesc")}
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <strong>{t("privacy.orderData")} :</strong> {t("privacy.orderDataDesc")}
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <strong>{t("privacy.technicalData")} :</strong> {t("privacy.technicalDataDesc")}
                      </div>
                    </li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">{t("privacy.collectionPurposes")}</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>{t("privacy.purpose1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>{t("privacy.purpose2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>{t("privacy.purpose3")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <span>{t("privacy.purpose4")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("privacy.protection.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">{t("privacy.protection.ssl")}</h4>
                  <p className="text-sm text-green-700">
                    {t("privacy.protection.sslDesc")}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">{t("privacy.protection.storage")}</h4>
                  <p className="text-sm text-blue-700">
                    {t("privacy.protection.storageDesc")}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">{t("privacy.protection.gdpr")}</h4>
                  <p className="text-sm text-purple-700">
                    {t("privacy.protection.gdprDesc")}
                  </p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">{t("privacy.protection.access")}</h4>
                  <p className="text-sm text-orange-700">
                    {t("privacy.protection.accessDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                {t("privacy.rights.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold mb-1">{t("privacy.rights.access")}</h4>
                  <p className="text-sm text-gray-600">
                    {t("privacy.rights.accessDesc")}
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold mb-1">{t("privacy.rights.correction")}</h4>
                  <p className="text-sm text-gray-600">
                    {t("privacy.rights.correctionDesc")}
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold mb-1">{t("privacy.rights.deletion")}</h4>
                  <p className="text-sm text-gray-600">
                    {t("privacy.rights.deletionDesc")}
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold mb-1">{t("privacy.rights.portability")}</h4>
                  <p className="text-sm text-gray-600">
                    {t("privacy.rights.portabilityDesc")}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-sm">
                  <strong>Pour exercer vos droits :</strong> Contactez-nous à 
                  <a href="mailto:equisaddles@gmail.com" className="text-primary ml-1">
                    equisaddles@gmail.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t("privacy.sharing.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">
                  🚫 {t("privacy.sharing.never")}
                </h4>
                <p className="text-sm text-red-700">
                  {t("privacy.sharing.neverDesc")}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">{t("privacy.sharing.limited")}</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <strong>{t("privacy.sharing.carriers")} :</strong> {t("privacy.sharing.carriersDesc")}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <strong>{t("privacy.sharing.payments")} :</strong> {t("privacy.sharing.paymentsDesc")}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <strong>Services techniques :</strong> Fournisseurs d'hébergement et de maintenance 
                      (accès strictement encadré)
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cookies et Traceurs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Types de cookies utilisés :</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">Essentiel</Badge>
                    <div className="text-sm">
                      <strong>Cookies techniques :</strong> Nécessaires au fonctionnement du site 
                      (panier, connexion, préférences de langue)
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5">Optionnel</Badge>
                    <div className="text-sm">
                      <strong>Cookies analytiques :</strong> Nous aident à améliorer l'expérience utilisateur 
                      (avec votre consentement)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Gestion des cookies :</strong> Vous pouvez modifier vos préférences 
                  cookies à tout moment dans les paramètres de votre navigateur.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact & Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/5 p-6 rounded-lg">
                <h4 className="font-semibold mb-3">Délégué à la Protection des Données</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Email :</strong> equisaddles@gmail.com</p>
                  <p><strong>Adresse :</strong> Equi Saddles - Service DPO<br />
                  Rue du Vicinal 9<br />
                  4141 Louveigné, Belgique</p>
                  <p><strong>Téléphone :</strong> +32 496 94 41 25</p>
                </div>
                
                <Separator className="my-4" />
                
                <p className="text-sm text-gray-600">
                  Pour toute question concernant cette politique de confidentialité 
                  ou l'utilisation de vos données personnelles, n'hésitez pas à nous contacter. 
                  Nous nous engageons à vous répondre dans les 72 heures.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}