import { useLanguage } from "@/contexts/LanguageContext";
import type { TranslationKeys } from "@shared/i18n/translations";

export const useTranslation = () => {
  const { t, language, setLanguage, dir } = useLanguage();
  
  return {
    t,
    language,
    setLanguage,
    dir,
    isRtl: dir === "rtl",
    isHebrew: language === "he"
  };
};

// Helper function to get specific section translations
export const useTranslationSection = <T extends keyof TranslationKeys>(section: T) => {
  const { t } = useLanguage();
  
  const getTranslation = (key: string) => {
    return t(key, section);
  };
  
  return getTranslation;
};
