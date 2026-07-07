import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, useLocation } from "wouter";
import { lazy } from "react";
import { LanguageProvider } from "./hooks/use-language";
import { CartProvider } from "./hooks/use-cart";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { Toaster } from "./components/ui/toaster";

// Pages
import Home from "./pages/home";
import Catalog from "./pages/catalog";
import ProductPage from "./pages/product";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import Confirmation from "./pages/confirmation";
import Gallery from "./pages/gallery";
import Contact from "./pages/contact";
import Admin from "./pages/admin";
import Support from "./pages/support";
import Privacy from "./pages/privacy";
import Terms from "./pages/terms";
import Returns from "./pages/returns";
import Delivery from "./pages/delivery";
import CustomerService from "./pages/customer-service";  
import NotFound from "./pages/not-found";
import Accessories from "./pages/accessories";

// Import the queryClient from the lib to get the default queryFn
import { queryClient } from "./lib/queryClient";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";
import ChatButton from "./components/chat/chat-button";
import BackgroundWrapper from "./components/layout/background-wrapper";

function Router() {
  const [location] = useLocation();
  
  // Si on est sur admin, afficher seulement l'admin sans header/footer
  if (location === '/admin' || location === '/administrateur') {
    return (
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <BackgroundWrapper>
            <Admin />
          </BackgroundWrapper>
          <Toaster />
        </AdminAuthProvider>
      </QueryClientProvider>
    );
  }
  
  // Pour toutes les autres pages, afficher l'app normale avec test header
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <AdminAuthProvider>
            <BackgroundWrapper>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/home" component={Home} />
                  <Route path="/catalog" component={Catalog} />
                  <Route path="/accessories" component={Accessories} />
                  <Route path="/product/:id" component={ProductPage} />
                  <Route path="/cart" component={Cart} />
                  <Route path="/checkout" component={Checkout} />
                  <Route path="/confirmation" component={Confirmation} />
                  <Route path="/gallery" component={Gallery} />
                  <Route path="/contact" component={Contact} />
                  <Route path="/chat" component={lazy(() => import("@/pages/chat"))} />
                  <Route path="/simple-chat" component={lazy(() => import("@/pages/simple-chat"))} />
                  <Route path="/support" component={Support} />
                  <Route path="/privacy" component={Privacy} />
                  <Route path="/terms" component={Terms} />
                  <Route path="/returns" component={Returns} />
                  <Route path="/delivery" component={Delivery} />
                  <Route path="/customer-service" component={CustomerService} />
                  <Route component={NotFound} />
                </Switch>
                </main>
                <Footer />
                
                {/* Chat Button flottant pour toutes les pages publiques */}
                <ChatButton />
              </div>
            </BackgroundWrapper>
            <Toaster />
          </AdminAuthProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return <Router />;
}