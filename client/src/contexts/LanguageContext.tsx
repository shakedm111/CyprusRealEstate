import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { translations } from "@shared/i18n/translations";
import type { TranslationKeys } from "@shared/i18n/translations";

type LanguageContextType = {
  language: "he" | "en";
  setLanguage: (lang: "he" | "en") => void;
  t: (key: string, section?: keyof TranslationKeys) => string;
  dir: "rtl" | "ltr";
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<"he" | "en">("he");
  const [dir, setDir] = useState<"rtl" | "ltr">("rtl");

  // Get a translation by key using dot notation (e.g. "common.welcome")
  const t = (key: string, section: keyof TranslationKeys = "common") => {
    try {
      if (key.includes(".")) {
        const [sectionKey, translationKey] = key.split(".");
        // @ts-ignore - This is fine because we're accessing by string keys
        return translations[language][sectionKey][translationKey] || key;
      }
      
      // @ts-ignore - This is fine because we're accessing by string keys
      return translations[language][section][key] || key;
    } catch (e) {
      console.warn(`Translation missing: ${key} in ${section}`);
      return key;
    }
  };

  const setLanguage = (lang: "he" | "en") => {
    setLanguageState(lang);
    setDir(lang === "he" ? "rtl" : "ltr");
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  };

  // Set initial language from HTML tag on mount
  useEffect(() => {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "en") {
      setLanguage("en");
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
