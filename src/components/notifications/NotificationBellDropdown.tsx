import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Lock,
  Megaphone,
  ShoppingBag,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InAppNotification, NotificationCategory } from '../../types';

interface NotificationBellDropdownProps {
  onNavigateTab?: (tab: string) => void;
}

export const NotificationBellDropdown: React.FC<NotificationBellDropdownProps> = ({
  onNavigateTab
}) => {
  const {
    currentUser,
    getUserNotifications,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openNotificationDetailModal
  } = useApp();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userNotifications = getUserNotifications(currentUser);
  const unreadCount = getUnreadNotificationsCount(currentUser);
  const currentUserId = currentUser?.id || 'visitor';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredList = userNotifications.filter((n) => {
    if (activeFilter === 'UNREAD') {
      return !n.readBy.includes(currentUserId);
    }
    return true;
  });

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'PEDIDO':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />;
      case 'COMUNICADO':
        return <Megaphone className="w-3.5 h-3.5 text-emerald-600" />;
      case 'COMISSAO':
        return <DollarSign className="w-3.5 h-3.5 text-amber-600" />;
      case 'SEGURANCA':
        return <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />;
      case 'URGENTE':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case 'PROMO':
        return <Sparkles className="w-3.5 h-3.5 text-pink-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const formatNotificationTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `Há ${diffMinutes}m`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Recente';
    }
  };

  const handleNotificationClick = (item: InAppNotification) => {
    markNotificationAsRead(item.id, currentUserId);
    openNotificationDetailModal(item);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="header-notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors focus:outline-none cursor-pointer"
        title="Notificações do App"
        aria-label="Abrir Notificações"
      >
        <Bell className="w-5 h-5 text-emerald-900" />

        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-emerald-300" />
              <h4 className="font-bold text-xs sm:text-sm">Notificações no App</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead(currentUserId)}
                className="text-[11px] text-emerald-200 hover:text-white font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ler todas</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({userNotifications.length})
              </button>
              <button
                onClick={() => setActiveFilter('UNREAD')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  activeFilter === 'UNREAD'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                Não lidas ({unreadCount})
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-medium">Internet do App 🟢</span>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-xs font-bold text-slate-600">Nenhuma notificação por aqui!</p>
                <p className="text-[11px] text-slate-400">
                  {activeFilter === 'UNREAD'
                    ? 'Você já leu todas as suas mensagens recentes.'
                    : 'Novidades de compras e avisos aparecerão diretamente aqui.'}
                </p>
              </div>
            ) : (
              filteredList.map((item) => {
                const isRead = item.readBy.includes(currentUserId);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left p-3 sm:p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer ${
                      !isRead ? 'bg-emerald-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Unread indicator / Category Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        {getCategoryIcon(item.category)}
                      </div>
                      {!isRead && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase truncate">
                          {item.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center space-x-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatNotificationTime(item.createdAt)}</span>
                        </span>
                      </div>

                      <h5 className={`text-xs truncate ${!isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {item.title}
                      </h5>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        {item.message}
                      </p>

                      {item.orderCode && (
                        <div className="mt-1 flex items-center space-x-1">
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[9px] font-mono font-bold">
                            #{item.orderCode}
                          </span>
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 self-center" />
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {userNotifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateTab) {
                    onNavigateTab('account');
                  }
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer inline-flex items-center space-x-1"
              >
                <span>Ver todas na Minha Conta</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
