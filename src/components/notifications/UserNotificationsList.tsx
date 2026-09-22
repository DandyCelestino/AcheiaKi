import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  Search,
  Filter,
  ShoppingBag,
  Megaphone,
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Lock,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InAppNotification, NotificationCategory } from '../../types';

export const UserNotificationsList: React.FC = () => {
  const {
    currentUser,
    getUserNotifications,
    getUnreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openNotificationDetailModal
  } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyUnread, setOnlyUnread] = useState<boolean>(false);

  const currentUserId = currentUser?.id || 'visitor';
  const allUserNotifs = getUserNotifications(currentUser);
  const unreadCount = getUnreadNotificationsCount(currentUser);

  const filteredNotifs = allUserNotifs.filter((n) => {
    if (onlyUnread && n.readBy.includes(currentUserId)) return false;
    if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term) ||
        n.senderName.toLowerCase().includes(term) ||
        (n.orderCode && n.orderCode.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const getCategoryBadge = (cat: NotificationCategory) => {
    switch (cat) {
      case 'PEDIDO':
        return { icon: ShoppingBag, label: 'Pedido', color: 'bg-blue-100 text-blue-800' };
      case 'COMUNICADO':
        return { icon: Megaphone, label: 'Comunicado', color: 'bg-emerald-100 text-emerald-800' };
      case 'COMISSAO':
        return { icon: DollarSign, label: 'Comissão/Planos', color: 'bg-amber-100 text-amber-800' };
      case 'SEGURANCA':
        return { icon: ShieldAlert, label: 'Segurança', color: 'bg-purple-100 text-purple-800' };
      case 'URGENTE':
        return { icon: AlertTriangle, label: 'Urgente', color: 'bg-red-100 text-red-800' };
      case 'PROMO':
        return { icon: Sparkles, label: 'Promoção', color: 'bg-pink-100 text-pink-800' };
      default:
        return { icon: Bell, label: 'Sistema', color: 'bg-slate-100 text-slate-800' };
    }
  };

  const handleOpen = (item: InAppNotification) => {
    markNotificationAsRead(item.id, currentUserId);
    openNotificationDetailModal(item);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">Minhas Notificações</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-black">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-emerald-100/80 mt-1">
            Receba avisos de pedidos, novidades e comunicados oficiais da administração pelo aplicativo.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead(currentUserId)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Marcar Todas como Lidas</span>
          </button>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="px-4 sm:px-6 pt-2 pb-1 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, loja ou código..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="PEDIDO">Pedidos & Retirada</option>
            <option value="COMUNICADO">Comunicados Oficiais</option>
            <option value="COMISSAO">Planos & Taxas</option>
            <option value="SEGURANCA">Segurança</option>
            <option value="AVISO">Avisos</option>
          </select>

          <button
            onClick={() => setOnlyUnread(!onlyUnread)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              onlyUnread
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Apenas Não Lidas
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-slate-100 px-4 sm:px-6 pb-6">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-slate-300 opacity-60" />
            <p className="text-sm font-bold text-slate-600">Nenhuma notificação localizada</p>
            <p className="text-xs text-slate-400">
              {searchTerm || onlyUnread
                ? 'Nenhuma mensagem corresponde aos filtros selecionados.'
                : 'Todas as suas mensagens da administração e pedidos aparecerão nesta tela.'}
            </p>
          </div>
        ) : (
          filteredNotifs.map((item) => {
            const isRead = item.readBy.includes(currentUserId);
            const badge = getCategoryBadge(item.category);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={item.id}
                onClick={() => handleOpen(item)}
                className={`py-3.5 sm:py-4 px-3 sm:px-4 rounded-2xl transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                  !isRead ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <BadgeIcon className="w-4 h-4 text-emerald-800" />
                    </div>
                    {!isRead && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-bold text-emerald-900">
                        {item.senderName}
                      </span>
                      {item.orderCode && (
                        <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                          #{item.orderCode}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs sm:text-sm ${!isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">Internet do App</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-1 self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen(item);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center space-x-1"
                  >
                    <span>Ler</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
