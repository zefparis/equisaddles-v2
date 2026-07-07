import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useLanguage } from "../../hooks/use-language";
import { useCart } from "../../hooks/use-cart";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingCart, Download } from "lucide-react";
import { useInstallPrompt } from "../../hooks/use-install-prompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import CartModal from "../cart/cart-modal";

const languages = [
  { code: "fr", name: "Français", flag: <svg className="w-4 h-4" viewBox="0 0 24 16"><rect width="8" height="16" fill="#002654"/><rect x="8" width="8" height="16" fill="#ffffff"/><rect x="16" width="8" height="16" fill="#ce1126"/></svg> },
  { code: "en", name: "English", flag: <svg className="w-4 h-4" viewBox="0 0 24 16"><rect width="24" height="16" fill="#012169"/><path d="M0 0l24 16M24 0L0 16" stroke="#ffffff" strokeWidth="2"/><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" strokeWidth="1"/><path d="M12 0v16M0 8h24" stroke="#ffffff" strokeWidth="3"/><path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="1.5"/></svg> },
  { code: "nl", name: "Nederlands", flag: <svg className="w-4 h-4" viewBox="0 0 24 16"><rect width="24" height="5.33" fill="#ae1c28"/><rect width="24" height="5.33" y="5.33" fill="#ffffff"/><rect width="24" height="5.33" y="10.67" fill="#21468b"/></svg> },
  { code: "es", name: "Español", flag: <svg className="w-4 h-4" viewBox="0 0 24 16"><rect width="24" height="4" fill="#aa151b"/><rect width="24" height="8" y="4" fill="#f1bf00"/><rect width="24" height="4" y="12" fill="#aa151b"/></svg> },
  { code: "de", name: "Deutsch", flag: <svg className="w-4 h-4" viewBox="0 0 24 16"><rect width="24" height="5.33" fill="#000000"/><rect width="24" height="5.33" y="5.33" fill="#dd0000"/><rect width="24" height="5.33" y="10.67" fill="#ffce00"/></svg> },
];

// Texture cuir photo (fond-de-texture-de-cuir-marron-d-origine.jpg) avec overlay discret
const leatherTexture = "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('/images/fond-de-texture-de-cuir-marron-d-origine.jpg')";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const { canInstall, promptInstall, isInstalled } = useInstallPrompt();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const navigation = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.catalog"), href: "/catalog" },
    { name: t("nav.accessories"), href: "/accessories" },
    { name: t("nav.gallery"), href: "/gallery" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  // Custom style pour le fond "cuir"
  const leatherBg = {
    backgroundColor: "#6B4226", // fallback si l'image ne charge pas
    backgroundImage: leatherTexture,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "none"
  };

  return (
    <header className="bg-[#6B4226] text-white sticky top-0 z-50 shadow-xl" style={leatherBg}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 md:gap-3 flex-1 min-w-0">
            <img 
              src="/images/logo.png?v=3" 
              alt="Equi Saddles"
              className="h-12 w-auto object-contain md:h-20 flex-shrink-0"
              style={{ maxHeight: "80px", maxWidth: "200px" }}
            />
            <span 
              className="text-lg md:text-3xl font-bold truncate"
              style={{
                fontFamily: "'Cinzel', 'Playfair Display', serif",
                // Couleur dorée solide - toujours visible sur fond sombre
                color: "#FFD700",
                textShadow: "0 2px 6px rgba(0,0,0,0.8), 0 0 20px rgba(255,215,0,0.4)",
                letterSpacing: "0.05em"
              }}
            >
              Equi Saddles
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-[#FFD700] text-white transition-colors duration-150 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {/* PWA Install Button - Désactivé temporairement */}
            {false && !isInstalled && (
              <button
                onClick={promptInstall}
                className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-[#FFD700] border border-white/20 rounded-lg transition"
              >
                <Download className="h-4 w-4" />
                <span>Installer</span>
              </button>
            )}
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1.5 md:p-2 text-white hover:text-[#FFD700]">
                  <span className="flex items-center">{currentLanguage?.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="border-none shadow-2xl text-white min-w-[180px]"
                style={leatherBg}
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`
                      cursor-pointer px-3 py-2 font-medium flex items-center
                      transition-colors rounded
                      ${language === lang.code 
                        ? 'bg-[#a47551] text-white'
                        : 'hover:bg-[#a47551] hover:text-white'
                      }
                    `}
                  >
                    <span className="mr-2 flex items-center">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Button
              variant="ghost"
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-[#FFD700] text-white p-1.5 md:p-2"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#FFD700] text-[#6B4226] text-xs flex items-center justify-center">
                  {totalItems}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <div className="relative" ref={mobileMenuRef}>
              <Button
                variant="ghost"
                className="md:hidden p-2 hover:bg-[#a47551]/20 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu mobile"
              >
                <svg 
                  className="h-7 w-7" 
                  fill="none" 
                  stroke="#FFD700"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
                  }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              </Button>
              {isMobileMenuOpen && (
                <div
                  className="
                    absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50
                    text-white animate-fade-in
                  "
                  style={leatherBg}
                >
                  <nav className="flex flex-col p-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="
                          py-3 px-2 mb-1 rounded-lg text-white font-semibold
                          hover:bg-[#a47551] hover:text-white
                          transition-colors
                        "
                      >
                        {item.name}
                      </Link>
                    ))}
                    {/* PWA Install (mobile) - Désactivé temporairement */}
                    {false && !isInstalled && (
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          promptInstall();
                        }}
                        className="
                          flex items-center gap-3 py-3 px-2 rounded-lg
                          text-[#FFD700] hover:bg-[#a47551] hover:text-white
                          transition-colors font-medium mt-2
                        "
                      >
                        <Download className="h-5 w-5" />
                        <span>Installer l'app</span>
                      </button>
                    )}
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}

