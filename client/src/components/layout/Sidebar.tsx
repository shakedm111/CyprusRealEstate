import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";

export const Sidebar = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  const menuItems = [
    { label: t('common.dashboard'), icon: 'tachometer-alt', href: '/dashboard' },
    { label: t('common.calculators'), icon: 'calculator', href: '/calculators' },
    { label: t('common.properties'), icon: 'building', href: '/properties' },
    { label: t('common.investmentComparison'), icon: 'chart-line', href: '/investment-comparison' },
    { label: t('common.sensitivityAnalysis'), icon: 'chart-bar', href: '/sensitivity-analysis' },
    { label: t('common.cashFlow'), icon: 'coins', href: '/cash-flow' },
    { label: t('common.investors'), icon: 'users', href: '/investors' },
    { label: t('common.settings'), icon: 'cog', href: '/settings' },
  ];

  return (
    <aside className="bg-white shadow-md w-16 md:w-64 flex-shrink-0 transition-all">
      <div className="py-4">
        <nav>
          <ul>
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`flex items-center py-3 px-4 hover:bg-gray-50 transition-colors
                    ${location === item.href 
                      ? 'text-teal-500 border-r-4 border-teal-500' 
                      : 'text-gray-600 hover:text-teal-500'}`}
                >
                  <i className={`fas fa-${item.icon} text-lg w-6`} />
                  <span className="ml-2 hidden md:block">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
