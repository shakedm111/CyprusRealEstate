import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import TelemLogo from "@/lib/telemLogo";
import { Button } from "@/components/ui/button";
import { NotificationsPanel } from "@/components/modals/NotificationsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "he" ? "en" : "he");
  };

  const toggleNotificationsPanel = () => {
    setNotificationsPanelOpen(!notificationsPanelOpen);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center py-3 px-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-40">
            <TelemLogo className="h-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">{t('common.dashboard')}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="p-2 text-gray-600 hover:text-teal-500 transition-colors"
          >
            <i className="fas fa-globe"></i>
            <span className="ml-1 hidden md:inline">
              {language === "he" ? "EN" : "עב"}
            </span>
          </Button>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleNotificationsPanel}
              className="p-2 text-gray-600 hover:text-teal-500 transition-colors"
            >
              <i className="fas fa-bell"></i>
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
          
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 space-x-reverse p-2 text-gray-600 hover:text-teal-500 transition-colors"
                >
                  <span className="hidden md:block">
                    {t('common.welcomeMessage')}, {user?.name}
                  </span>
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
                    <span>{user?.name.charAt(0)}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <NotificationsPanel 
        isOpen={notificationsPanelOpen}
        onClose={() => setNotificationsPanelOpen(false)}
      />
    </header>
  );
};
