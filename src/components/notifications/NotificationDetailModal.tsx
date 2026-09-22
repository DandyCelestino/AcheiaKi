import React from 'react';
import {
  Bell,
  X,
  Clock,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  DollarSign,
  User,
  ArrowRight,
  ExternalLink,
  Lock
} from 'lucide-react';
import { InAppNotification, NotificationCategory, NotificationPriority } from '../../types';

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: InAppNotification | null;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  isOpen,
  notification,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen || !notification) return null;

  const getCategoryConfig = (cat: NotificationCategory) => {
    switch (cat) {
      case 'PEDIDO':
        return {
          icon: ShoppingBag,
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          label: 'Pedido & Entrega'
        };
      case 'COMUNICADO':
        return {
          icon: Megaphone,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          label: 'Comunicado Oficial'
        };
      case 'COMISSAO':
        return {
          icon: DollarSign,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          label: 'Planos & Comissões'
        };
      case 'SEGURANCA':
        return {
          icon: ShieldAlert,
          color: 'text-purple-700 bg-purple-50 border-purple-200',
          label: 'Segurança & Conta'
        };
      case 'URGENTE':
        return {
          icon: AlertTriangle,
          color: 'text-red-700 bg-red-50 border-red-200',
          label: 'Urgente'
        };
      case 'PROMO':
        return {
          icon: Sparkles,
          color: 'text-pink-700 bg-pink-50 border-pink-200',
          label: 'Promoção & Destaque'
        };
      case 'AVISO':
        return {
          icon: Bell,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          label: 'Aviso Importante'
        };
      default:
        return {
          icon: Bell,
          color: 'text-slate-700 bg-slate-50 border-slate-200',
          label: 'Mensagem do Sistema'
        };
    }
  };

  const getAudienceLabel = () => {
    switch (notification.audience) {
      case 'ALL':
        return { text: 'Transmitido para Todos (Público Geral)', isPrivate: false };
      case 'ALL_MERCHANTS':
        return { text: 'Direcionado a Todos os Lojistas & Prestadores', isPrivate: true };
      case 'ALL_CUSTOMERS':
        return { text: 'Direcionado a Todos os Clientes & Consumidores', isPrivate: true };
      case 'SPECIFIC_MERCHANT':
        return { text: `Mensagem Particular para ${notification.recipientName || 'sua Loja'}`, isPrivate: true };
      case 'SPECIFIC_USER':
        return { text: `Mensagem Particular e Privada para ${notification.recipientName || 'Você'}`, isPrivate: true };
      default:
        return { text: 'Notificação do Sistema', isPrivate: false };
    }
  };

  const catConfig = getCategoryConfig(notification.category);
  const IconComponent = catConfig.icon;
  const audienceInfo = getAudienceLabel();

  const formattedDate = new Date(notification.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleActionClick = () => {
    if (notification.actionUrl && onNavigateTab) {
      onNavigateTab(notification.actionUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Color Strip */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 sm:p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fechar Notificação"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
              <IconComponent className="w-3 h-3 mr-1" />
              <span>{catConfig.label}</span>
            </span>

            {notification.priority === 'URGENT' && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase animate-pulse">
                Urgente
              </span>
            )}
            {notification.priority === 'HIGH' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold uppercase">
                Prioridade Alta
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
            {notification.title}
          </h3>

          <div className="flex items-center space-x-3 text-emerald-100 text-xs mt-2">
            <span className="flex items-center space-x-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>{formattedDate}</span>
            </span>
            <span>•</span>
            <span className="font-semibold text-emerald-200 truncate">
              Por: {notification.senderName}
            </span>
          </div>
        </div>

        {/* Audience & Privacy Badge */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600">
            {audienceInfo.isPrivate ? (
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : (
              <Megaphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium truncate">{audienceInfo.text}</span>
          </div>

          {notification.orderCode && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-mono text-[11px] font-bold shrink-0">
              #{notification.orderCode}
            </span>
          )}
        </div>

        {/* Message Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-slate-700 text-sm leading-relaxed">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 whitespace-pre-line font-sans text-slate-800 text-[13px] sm:text-sm">
            {notification.message}
          </div>

          {/* Delivery Details Footnote */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="flex items-center space-x-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Notificação entregue via Internet do App Achei Aqui</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              ID: {notification.id.substring(0, 14)}
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {notification.actionUrl && (
            <button
              onClick={handleActionClick}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{notification.actionLabel || 'Acessar Seção'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
