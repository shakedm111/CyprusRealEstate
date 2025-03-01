import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useTranslation } from "@/hooks/useTranslation";

type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isRtl } = useTranslation();
  
  return (
    <div className={`min-h-screen flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AppLayout;
