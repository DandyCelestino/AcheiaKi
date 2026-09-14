import React from 'react';
import { Bell, Sparkles, ArrowRight, CheckCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationAccountBannerProps {
  className?: string;
  onOpenNotifications?: () => void;
}

export const NotificationAccountBanner: React.FC<NotificationAccountBannerProps> = ({
  className = '',
  onOpenNotifications
}) => {
  const {
    currentUser,
    getUserNotifications,
    getUnreadNotificationsCount,
    openNotificationDetailModal,
    markAllNotificationsAsRead
  } = useApp();

  const [isDismissed, setIsDismissed] = React.useState<boolean>(false);

  const unreadCount = getUnreadNotificationsCount(currentUser);
  const userNotifications = getUserNotifications(currentUser);
  const currentUserId = currentUser?.id || 'visitor';

  if (unreadCount === 0 || isDismissed) return null;

  // Most recent unread notification
  const latestUnread = userNotifications.find((n) => !n.readBy.includes(currentUserId));
  if (!latestUnread) return null;

  const handleOpenLatest = () => {
    openNotificationDetailModal(latestUnread);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-3.5 sm:p-4 text-white shadow-md border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-200 ${className}`}
    >
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <Bell className="w-5 h-5 text-emerald-200 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider">
                {unreadCount} Nova{unreadCount > 1 ? 's' : ''} Notificaç{unreadCount > 1 ? 'ões' : 'ão'}
              </span>
              <span className="text-xs text-emerald-200 font-bold truncate">
                {latestUnread.senderName}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-white mt-0.5 line-clamp-1">
              {latestUnread.title}
            </p>
            <p className="text-[11px] text-emerald-100/80 line-clamp-1 hidden sm:block">
              {latestUnread.message}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-center">
          <button
            onClick={handleOpenLatest}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>Ver Mensagem</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
