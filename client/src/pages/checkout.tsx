import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "../hooks/use-cart";
import { useLanguage } from "../hooks/use-language";
import { useToast } from "../hooks/use-toast";
import { scrollToTop } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Truck, Mail, Calculator, Info, Lock, ShieldCheck, Phone } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "../lib/queryClient";
import { calculateShipping, FREE_SHIPPING_THRESHOLD } from "@shared/shipping";

// Plus besoin de charger Stripe côté client avec cette approche

// Function to get translated validation messages - sera appelé pendant la validation
const getValidationMessages = () => ({
  firstName: { min: "Le prénom doit contenir au moins 2 caractères" },
  lastName: { min: "Le nom doit contenir au moins 2 caractères" },
  email: { invalid: "Adresse email invalide" },
  phone: { min: "Numéro de téléphone invalide" },
  address: { min: "Adresse complète requise" },
  city: { min: "Ville requise" },
  postalCode: { min: "Code postal requis" },
  country: { min: "Pays requis" },
});

// Schema de validation pour le formulaire d'adresse
const checkoutSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  address: z.string().min(5, "Adresse complète requise"),
  city: z.string().min(2, "Ville requise"),
  postalCode: z.string().min(4, "Code postal requis"),
  country: z.string().min(2, "Pays requis"),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;


export default function Checkout() {
  const { t } = useLanguage();
  const { items, totalAmount } = useCart();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Scroll to top when page loads
  useEffect(() => {
    scrollToTop();
  }, []);

  // Redirection si le panier est vide — use wouter Link navigation instead of window.location
  useEffect(() => {
    if (items.length === 0 && !isRedirecting) {
      window.location.href = "/catalog";
    }
  }, [items, isRedirecting]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "FR",
      notes: "",
    },
  });

  // Watch country to compute shipping live
  const watchedCountry = form.watch("country");
  const shippingCost = useMemo(() => {
    return calculateShipping(totalAmount, watchedCountry || "FR");
  }, [totalAmount, watchedCountry]);
  const finalTotal = totalAmount + shippingCost;

  const onSubmit = async (data: CheckoutFormData) => {
    if (isRedirecting) return;
    setSubmitError("");
    setIsRedirecting(true);

    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
        })),
        customerInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country,
          notes: data.notes || "",
        }
      });

      const result = await response.json();
      
      if (result.clientSecret) {
        // Same-tab redirect to Stripe Checkout
        window.location.href = result.clientSecret;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error: any) {
      console.error("Checkout error:", error.message);
      setSubmitError(error.message || "Impossible de créer la commande. Veuillez réessayer.");
      setIsRedirecting(false);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0 && !isRedirecting) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {t("checkout.title")}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire d'adresse de livraison */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Adresse de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/80 dark:bg-gray-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/80 dark:bg-gray-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} className="bg-white/80 dark:bg-gray-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} className="bg-white/80 dark:bg-gray-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse complète</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/80 dark:bg-gray-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/80 dark:bg-gray-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/80 dark:bg-gray-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger id="country" className="bg-white/80 dark:bg-gray-700">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="FR">France</SelectItem>
                                <SelectItem value="BE">Belgique</SelectItem>
                                <SelectItem value="NL">Pays-Bas</SelectItem>
                                <SelectItem value="DE">Allemagne</SelectItem>
                                <SelectItem value="LU">Luxembourg</SelectItem>
                                <SelectItem value="ES">Espagne</SelectItem>
                                <SelectItem value="IT">Italie</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optionnel)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Instructions de livraison..." className="bg-white/80 dark:bg-gray-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full btn-primary text-base py-6 shadow-lg" disabled={isRedirecting}>
                      {isRedirecting ? "Redirection vers le paiement..." : "Procéder au paiement"}
                    </Button>

                    {isRedirecting && (
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Redirection vers Stripe en cours...
                      </div>
                    )}

                    {submitError && !isRedirecting && (
                      <Alert variant="destructive">
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                </Form>
              </CardContent>
            </Card>

          </div>

          {/* Résumé de commande et paiement */}
          <div className="space-y-6">
            {/* Résumé du panier */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Quantité: {item.quantity} • Taille: {item.size}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{(parseFloat(item.price) * item.quantity).toFixed(2)}€</p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span>Sous-total</span>
                    <span>{totalAmount.toFixed(2)}€</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span>Livraison</span>
                    </div>
                    <span>
                      {shippingCost === 0 ? (
                        <span className="text-green-600 font-semibold">Gratuite</span>
                      ) : (
                        `${shippingCost.toFixed(2)}€`
                      )}
                    </span>
                  </div>

                  {totalAmount < FREE_SHIPPING_THRESHOLD && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-gray-700 p-3 rounded-lg">
                      <p>
                        Ajoutez {(FREE_SHIPPING_THRESHOLD - totalAmount).toFixed(2)}€ pour bénéficier de la livraison gratuite.
                      </p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-bold text-xl bg-primary/5 dark:bg-primary/20 rounded-lg px-3 py-2">
                    <span>Total</span>
                    <span className="text-primary">{finalTotal.toFixed(2)}€</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span>Paiement sécurisé par Stripe</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <Link href="/delivery" className="hover:underline">Information livraison</Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Info className="h-4 w-4 text-gray-600" />
                  <Link href="/returns" className="hover:underline">Politique de retour</Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4 text-primary" />
                  <Link href="/contact" className="hover:underline">Besoin d'aide ? Contactez-nous</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}