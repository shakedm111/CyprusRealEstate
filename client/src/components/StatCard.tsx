
import React from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: number | string;
  direction?: 'rtl' | 'ltr';
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  iconBgColor,
  title,
  value,
  direction = 'rtl',
}) => {
  return (
    <div className="stat-card group">
      <div 
        className={cn(
          "stat-card-icon",
          iconBgColor
        )}
      >
        <i className={cn("fas", `fa-${icon}`, iconColor, "text-lg")}></i>
      </div>
      <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
      <div 
        className={cn(
          "text-2xl font-bold text-gray-800", 
          direction === 'ltr' ? 'direction-ltr' : ''
        )}
      >
        {value}
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left w-full"></div>
    </div>
  );
};

export default StatCard;
