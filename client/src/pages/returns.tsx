import { useEffect } from "react";
import { useLanguage } from "../hooks/use-language";
import { scrollToTop } from "../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { 
  RotateCcw, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Mail, 
  FileText,
  Truck,
  AlertTriangle,
  Phone
} from "lucide-react";

export default function Returns() {
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
            <RotateCcw className="h-10 w-10 text-primary" />
            {t("legal.returns.title")}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t("legal.returns.subtitle")}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Quick Summary */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">{t("returns.days14")}</h3>
                <p className="text-sm text-green-700">{t("returns.days14desc")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Return Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("returns.policy.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-blue-50 border-blue-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>{t("returns.policy.satisfaction")} :</strong> {t("returns.policy.satisfactionLegalOnly")}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Return Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("returns.process.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4, 5].map((step, i) => (
                <div key={step} className="flex items-start gap-4">
                  <Badge className="min-w-8 h-8 rounded-full flex items-center justify-center">{step}</Badge>
                  <div>
                    <h4 className="font-semibold mb-1">{t(`returns.process.step${step}`)}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {t(`returns.process.step${step}desc`)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t(`returns.process.step${step}info`) || t(`returns.process.step${step}advice`) || t(`returns.process.step${step}delay`) || t(`returns.process.step${step}email`) || t(`returns.process.step${step}receipt`)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Transport Responsibility */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Truck className="h-5 w-5" />
                {t("transport.responsibility.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="bg-yellow-100 border-yellow-300">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  <strong>{t("transport.important")}</strong> {t("transport.disclaimer")}
                </AlertDescription>
              </Alert>
              <div className="mt-4 space-y-2 text-sm">
                <h5 className="font-semibold">{t("transport.recommendations")}</h5>
                <ul className="space-y-1">
                  <li>• {t("transport.rec1")}</li>
                  <li>• {t("transport.rec2")}</li>
                  <li>• {t("transport.rec3")}</li>
                  <li>• {t("transport.rec4")}</li>
                  <li>• {t("transport.rec5")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">{t("returns.contact.question.title")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t("returns.contact.email")}
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("returns.contact.phone")}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {t("returns.contact.availability")}<br />
                  {t("returns.contact.response")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
