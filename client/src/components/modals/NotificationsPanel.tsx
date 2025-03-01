import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/useTranslation";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  isRead: boolean;
  createdAt: string;
};

type NotificationsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
    refetchOnWindowFocus: false,
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PUT", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: t("common.success"),
        description: t("notification.allMarkedAsRead"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("notification.errorMarkingRead"),
        variant: "destructive",
      });
    },
  });

  // Handle notification click
  const handleNotificationClick = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Get notification style based on type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-50 border-blue-500";
      case "warning":
        return "bg-yellow-50 border-yellow-500";
      case "error":
        return "bg-red-50 border-red-500";
      case "success":
        return "bg-green-50 border-green-500";
      default:
        return "bg-blue-50 border-blue-500";
    }
  };

  // Get notification title color based on type
  const getNotificationTitleStyle = (type: string) => {
    switch (type) {
      case "info":
        return "text-blue-800";
      case "warning":
        return "text-yellow-800";
      case "error":
        return "text-red-800";
      case "success":
        return "text-green-800";
      default:
        return "text-blue-800";
    }
  };

  // Calculate time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('notification.justNow');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('notification.minutesAgo')}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${t('notification.hoursAgo')}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return t('notification.yesterday');
    }
    
    return date.toLocaleDateString();
  };

  // Prevent body scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold">{t("common.notifications")}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <i className="fas fa-times"></i>
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-t-teal-500 border-r-teal-500 border-b-transparent border-l-transparent rounded-full" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-md border-r-4 ${getNotificationStyle(notification.type)} ${notification.isRead ? 'opacity-70' : ''}`}
                  onClick={() => !notification.isRead && handleNotificationClick(notification.id)}
                >
                  <div className="flex justify-between">
                    <h4 className={`font-medium ${getNotificationTitleStyle(notification.type)}`}>
                      {notification.title}
                      {!notification.isRead && (
                        <span className="ml-2 w-2 h-2 inline-block bg-blue-600 rounded-full"></span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-500">{timeAgo(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-bell text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-500">{t("notification.noNotifications")}</p>
            </div>
          )}
        </div>
        
        {notifications && notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 text-center">
            <Button 
              variant="ghost" 
              className="text-teal-500 hover:text-teal-600 text-sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mr-2" />
                  {t("notification.processing")}
                </div>
              ) : (
                t("common.markAllAsRead")
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
