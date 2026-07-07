import { createContext, useContext, useState, ReactNode } from "react";
import { translations } from "../lib/translations";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("equi-saddles-language");
      // Vérifier que la langue existe dans translations
      if (saved && translations[saved]) {
        return saved;
      }
      // Si la langue sauvegardée n'existe pas, reset à "fr"
      if (saved && !translations[saved]) {
        console.warn(`[Language] Invalid language "${saved}" in localStorage, resetting to "fr"`);
        localStorage.setItem("equi-saddles-language", "fr");
      }
      return "fr";
    }
    return "fr";
  });

  const setLanguage = (lang: string) => {
    // Valider que la langue existe
    if (!translations[lang]) {
      console.error(`[Language] Cannot set invalid language: ${lang}`);
      return;
    }
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem("equi-saddles-language", lang);
    }
  };

  const t = (key: string): string => {
    const translation = translations[language]?.[key];
    if (!translation) {
      // En développement, logger les clés manquantes
      if (import.meta.env.DEV) {
        console.warn(`[Translation] Missing key "${key}" for language "${language}"`);
      }
      return key;
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "fr",
      setLanguage: () => {},
      t: (key: string) => key
    };
  }
  return context;
}