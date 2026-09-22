import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingBag,
  Megaphone,
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  CheckCheck,
  Eye,
  Info,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InAppNotification, NotificationCategory, NotificationPriority } from '../../types';

const DISMISSED_STORAGE_KEY_PREFIX = 'acheiaqui_dismissed_ball_notifs_';

export const FloatingNotificationBall: React.FC = () => {
  const {
    currentUser,
    systemSettings,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openNotificationDetailModal,
    triggerToast
  } = useApp();

  // 1. REQUISITO DE SEGURANÇA E ACESSO: Exibir APENAS para usuários logados
  // 2. CONFIGURÁVEL VIA PAINEL ADMINISTRATIVO: Respeitar systemSettings.enableFloatingNotificationBall
  const isEnabledByAdmin = systemSettings?.enableFloatingNotificationBall !== false;

  // Lista de IDs dispensados pelo botão 'X' de cada balão (persistido no localStorage por usuário)
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    if (!currentUser?.id) return [];
    try {
      const stored = localStorage.getItem(`${DISMISSED_STORAGE_KEY_PREFIX}${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Estado de minimização/expansão da pilha de balões
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Sincronizar dismissedIds quando trocar de usuário
  useEffect(() => {
    if (!currentUser?.id) {
      setDismissedIds([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`${DISMISSED_STORAGE_KEY_PREFIX}${currentUser.id}`);
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      } else {
        setDismissedIds([]);
      }
    } catch {
      setDismissedIds([]);
    }
  }, [currentUser?.id]);

  // Salvar dismissedIds no localStorage
  const saveDismissedIds = (newDismissed: string[]) => {
    setDismissedIds(newDismissed);
    if (currentUser?.id) {
      try {
        localStorage.setItem(
          `${DISMISSED_STORAGE_KEY_PREFIX}${currentUser.id}`,
          JSON.stringify(newDismissed)
        );
      } catch (err) {
        console.error('Erro ao salvar balões dispensados:', err);
      }
    }
  };

  // Buscar todas as notificações pertinentes ao usuário atual
  const allUserNotifications = useMemo(() => {
    if (!currentUser) return [];
    return getUserNotifications(currentUser);
  }, [currentUser, getUserNotifications]);

  // Filtrar apenas as notificações pendentes que ainda NÃO foram fechadas com 'X' pelo usuário
  const pendingFloatingNotifications = useMemo(() => {
    if (!currentUser) return [];
    const currentUserId = currentUser.id;

    return allUserNotifications.filter((n) => {
      // Notificação não deve ter sido descartada pelo botão 'X' nesta sessão/cache
      const isDismissed = dismissedIds.includes(n.id);
      if (isDismissed) return false;

      // Priorizar notificações não lidas ou urgentes
      const isUnread = !n.readBy || !n.readBy.includes(currentUserId);
      return isUnread;
    });
  }, [allUserNotifications, currentUser, dismissedIds]);

  // Ação ao clicar no botão 'X' de um balão específico
  const handleDismissBalloon = (notificationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = [...dismissedIds, notificationId];
    saveDismissedIds(updated);
    
    // Opcional: marca como lida para sincronizar com o centro de notificações
    if (currentUser?.id) {
      markNotificationAsRead(notificationId, currentUser.id);
    }
    triggerToast('Notificação fechada.');
  };

  // Ação de fechar todos os balões pendentes
  const handleDismissAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const allPendingIds = pendingFloatingNotifications.map((n) => n.id);
    const updated = Array.from(new Set([...dismissedIds, ...allPendingIds]));
    saveDismissedIds(updated);
    if (currentUser?.id) {
      markAllNotificationsAsRead(currentUser.id);
    }
    triggerToast('Todos os balões foram dispensados.');
  };

  // Ação ao clicar no corpo do balão para ver detalhes
  const handleOpenNotification = (notification: InAppNotification) => {
    if (currentUser?.id) {
      markNotificationAsRead(notification.id, currentUser.id);
    }
    openNotificationDetailModal(notification);
  };

  // Helper para ícones por categoria
  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'PEDIDO':
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'COMUNICADO':
        return <Megaphone className="w-4 h-4 text-emerald-600" />;
      case 'COMISSAO':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'SEGURANCA':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      case 'URGENTE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'PROMO':
        return <Sparkles className="w-4 h-4 text-pink-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  // Helper para estilo de prioridade
  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 rounded-md border border-red-200">
            Urgente
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 rounded-md border border-amber-200">
            Alta
          </span>
        );
      default:
        return null;
    }
  };

  // Formatação de horário amigável
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Agora';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
      if (diffMin < 1) return 'Agora mesmo';
      if (diffMin < 60) return `${diffMin}m atrás`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h atrás`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Recente';
    }
  };

  // Se o usuário NÃO estiver logado ou o recurso estiver desativado pelo admin, não renderiza nada
  if (!currentUser || !isEnabledByAdmin) {
    return null;
  }

  // Se não houver nenhuma notificação pendente não dispensada, podemos ocultar ou mostrar a bolinha recolhida
  const count = pendingFloatingNotifications.length;
  if (count === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Balões Flutuantes de Notificações"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end pointer-events-none"
    >
      {/* PILHA DE BALÕES FLUTUANTES (PERSISTENTES ATÉ O 'X') */}
      {isExpanded && (
        <div className="w-80 sm:w-96 max-h-[70vh] overflow-y-auto space-y-2.5 mb-3 pointer-events-auto pr-1 pb-1 scrollbar-thin scrollbar-thumb-slate-300">
          {/* Barra superior de controle dos balões */}
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-lg border border-slate-700/80 flex items-center justify-between text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold tracking-tight">
                Notificações Pendentes ({count})
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDismissAll}
                className="text-[11px] text-slate-300 hover:text-white font-medium hover:underline transition-colors cursor-pointer"
                title="Fechar todos os balões"
              >
                Limpar todos
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                title="Minimizar para a bolinha flutuante"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista de cada balão individual */}
          {pendingFloatingNotifications.map((notification) => {
            const isUrgent = notification.priority === 'URGENT';
            const isHigh = notification.priority === 'HIGH';

            return (
              <div
                key={notification.id}
                role="alert"
                className={`group relative bg-white rounded-2xl shadow-xl border p-4 transition-all duration-200 animate-in fade-in slide-in-from-right-4 hover:shadow-2xl ${
                  isUrgent
                    ? 'border-red-400/80 ring-2 ring-red-400/20 bg-linear-to-br from-red-50/40 to-white'
                    : isHigh
                    ? 'border-amber-300/80 bg-linear-to-br from-amber-50/30 to-white'
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                {/* BOTÃO 'X' OBRIGATÓRIO PARA FECHAR ESTE BALÃO INDIVIDUALMENTE */}
                <button
                  onClick={(e) => handleDismissBalloon(notification.id, e)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all z-10 cursor-pointer shadow-xs border border-transparent hover:border-red-200"
                  title="Fechar esta notificação (X)"
                  aria-label="Fechar notificação"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-start space-x-3 pr-7">
                  {/* Ícone da Categoria */}
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/80 shadow-2xs mt-0.5">
                    {getCategoryIcon(notification.category)}
                  </div>

                  {/* Conteúdo da Notificação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {notification.category}
                      </span>
                      {getPriorityBadge(notification.priority)}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>

                    <h4
                      onClick={() => handleOpenNotification(notification)}
                      className="text-xs font-bold text-slate-900 cursor-pointer hover:text-emerald-700 transition-colors line-clamp-1"
                    >
                      {notification.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>

                    {/* Botões de Ação do Balão */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenNotification(notification)}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{notification.actionLabel || 'Ver detalhes'}</span>
                      </button>

                      <button
                        onClick={(e) => handleDismissBalloon(notification.id, e)}
                        className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
                      >
                        Dispensar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOLINHA FLUTUANTE PRINCIPAL (FLOATING NOTIFICATION BALL TRIGGER) */}
      <div className="pointer-events-auto flex items-center space-x-2">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer border ${
            isExpanded
              ? 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 ring-4 ring-emerald-500/20 animate-bounce'
          }`}
          title={isExpanded ? 'Recolher balões flutuantes' : 'Ver balões de notificações pendentes'}
          aria-expanded={isExpanded}
        >
          {/* Efeito Glow / Ping quando minimizado */}
          {!isExpanded && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}

          <div className="relative">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center border border-white shadow-xs">
              {count}
            </span>
          </div>

          <span className="text-xs font-bold tracking-tight hidden sm:inline">
            {isExpanded ? 'Ocultar Balões' : `${count} Notificaç${count === 1 ? 'ão' : 'ões'}`}
          </span>

          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-emerald-200" />
          )}
        </button>
      </div>
    </aside>
  );
};
