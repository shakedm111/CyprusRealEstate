import { useTranslation } from "@/hooks/useTranslation";

type Activity = {
  type: string;
  message: string;
  timestamp: Date;
};

type ActivityLogProps = {
  activities: Activity[];
};

export const ActivityLog = ({ activities }: ActivityLogProps) => {
  const { t } = useTranslation();

  // Function to format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('activity.justNow');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('activity.minutesAgo')}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${t('activity.hoursAgo')}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${t('activity.daysAgo')}`;
    }
    
    // For older activities, just show the date
    return date.toLocaleDateString();
  };

  // Function to get the appropriate icon and color based on activity type
  const getActivityIcon = (type: string): { icon: string; bgColor: string; color: string } => {
    switch (type) {
      case 'calculator':
        return { 
          icon: 'calculator', 
          bgColor: 'bg-blue-100', 
          color: 'text-blue-500' 
        };
      case 'property':
        return { 
          icon: 'building', 
          bgColor: 'bg-green-100', 
          color: 'text-green-500' 
        };
      case 'analysis':
        return { 
          icon: 'chart-line', 
          bgColor: 'bg-yellow-100', 
          color: 'text-yellow-600' 
        };
      case 'investor':
        return { 
          icon: 'user-plus', 
          bgColor: 'bg-purple-100', 
          color: 'text-purple-500' 
        };
      case 'exchangeRate':
        return { 
          icon: 'exchange-alt', 
          bgColor: 'bg-red-100', 
          color: 'text-red-500' 
        };
      default:
        return { 
          icon: 'info-circle', 
          bgColor: 'bg-gray-100', 
          color: 'text-gray-500' 
        };
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const { icon, bgColor, color } = getActivityIcon(activity.type);
        
        return (
          <div key={index} className="flex items-start">
            <div className={`${bgColor} rounded-full p-2 mr-3 flex-shrink-0 mt-1`}>
              <i className={`fas fa-${icon} ${color} text-sm`}></i>
            </div>
            <div>
              <p className="text-sm text-gray-800">{activity.message}</p>
              <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityLog;
