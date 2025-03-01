import { useTranslation } from "@/hooks/useTranslation";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-white shadow-md-top py-4 text-center text-gray-600 text-sm">
      <div className="container mx-auto">
        <p>{t('common.copyright')}</p>
      </div>
    </footer>
  );
};
