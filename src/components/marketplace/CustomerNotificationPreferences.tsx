import React, { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Send,
  Smartphone,
  Info,
  Check,
  Volume2,
  VolumeX,
  History,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationPreferences, CustomerPreferences } from '../../types';
import { UserNotificationsList } from '../notifications/UserNotificationsList';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  orderStatus: {
    push: true,
    email: true,
    whatsapp: true
  },
  sellerMessages: {
    push: true,
    email: false,
    whatsapp: true
  },
  promotions: {
    push: true,
    email: true,
    whatsapp: false
  }
};

export const CustomerNotificationPreferences: React.FC = () => {
  const {
    currentUser,
    updateCustomerPreferences,
    triggerToast,
    sendInAppNotification
  } = useApp();

  const [activeSubView, setActiveSubView] = useState<'matrix' | 'history'>('matrix');

  // Load existing preferences or defaults
  const initialPrefs: NotificationPreferences =
    currentUser?.notificationPreferences ||
    currentUser?.preferences?.notificationChannels || {
      orderStatus: {
        push: true,
        email: currentUser?.preferences?.receiveEmail ?? true,
        whatsapp: currentUser?.preferences?.receiveWhatsApp ?? true
      },
      sellerMessages: {
        push: true,
        email: false,
        whatsapp: currentUser?.preferences?.receiveWhatsApp ?? true
      },
      promotions: {
        push: true,
        email: currentUser?.preferences?.receiveEmail ?? true,
        whatsapp: false
      }
    };

  const [prefs, setPrefs] = useState<NotificationPreferences>(initialPrefs);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const toggleChannel = (
    type: 'orderStatus' | 'sellerMessages' | 'promotions',
    channel: 'push' | 'email' | 'whatsapp'
  ) => {
    setIsSaved(false);
    setPrefs((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel]
      }
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    const updatedCustomerPreferences: CustomerPreferences = {
      ...(currentUser.preferences || {
        receiveWhatsApp: true,
        receiveEmail: true,
        receiveSms: false,
        receivePromoAlerts: true
      }),
      receiveWhatsApp: prefs.orderStatus.whatsapp || prefs.sellerMessages.whatsapp || prefs.promotions.whatsapp,
      receiveEmail: prefs.orderStatus.email || prefs.sellerMessages.email || prefs.promotions.email,
      receivePromoAlerts: prefs.promotions.push || prefs.promotions.email || prefs.promotions.whatsapp,
      notificationChannels: prefs
    };

    updateCustomerPreferences(updatedCustomerPreferences);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleApplyPreset = (preset: 'all' | 'essential' | 'noPromo' | 'reset') => {
    setIsSaved(false);
    if (preset === 'all') {
      setPrefs({
        orderStatus: { push: true, email: true, whatsapp: true },
        sellerMessages: { push: true, email: true, whatsapp: true },
        promotions: { push: true, email: true, whatsapp: true }
      });
      triggerToast('Predefinição "Ativar Todos os Canais" aplicada!');
    } else if (preset === 'essential') {
      setPrefs({
        orderStatus: { push: true, email: true, whatsapp: true },
        sellerMessages: { push: true, email: false, whatsapp: true },
        promotions: { push: false, email: false, whatsapp: false }
      });
      triggerToast('Predefinição "Apenas Essenciais" aplicada!');
    } else if (preset === 'noPromo') {
      setPrefs((prev) => ({
        ...prev,
        promotions: { push: false, email: false, whatsapp: false }
      }));
      triggerToast('Ofertas silenciadas em todos os canais!');
    } else if (preset === 'reset') {
      setPrefs(DEFAULT_NOTIFICATION_PREFERENCES);
      triggerToast('Configurações restauradas para o padrão!');
    }
  };

  const handleSendTestNotification = () => {
    if (!currentUser) return;
    setIsSendingTest(true);

    setTimeout(() => {
      sendInAppNotification({
        title: '🔔 Teste de Notificação Achei Aqui',
        message: `Olá, ${currentUser.name}! Suas preferências de notificação estão funcionando perfeitamente. Canais ativos para atualizações: ${[
          prefs.orderStatus.push ? 'Push' : null,
          prefs.orderStatus.email ? 'E-mail' : null,
          prefs.orderStatus.whatsapp ? 'WhatsApp' : null
        ]
          .filter(Boolean)
          .join(', ')}.`,
        category: 'SISTEMA',
        priority: 'HIGH',
        audience: 'SPECIFIC_USER',
        recipientUserId: currentUser.id,
        recipientName: currentUser.name,
        senderName: 'Sistema Achei Aqui',
        senderRole: 'SISTEMA',
        actionUrl: 'account',
        actionLabel: 'Ver Preferências'
      });
      setIsSendingTest(false);
      triggerToast('Notificação de teste disparada com sucesso! Verifique o ícone do sino.');
    }, 400);
  };

  // Count active channels
  const totalSlots = 9;
  const activeCount =
    Number(prefs.orderStatus.push) +
    Number(prefs.orderStatus.email) +
    Number(prefs.orderStatus.whatsapp) +
    Number(prefs.sellerMessages.push) +
    Number(prefs.sellerMessages.email) +
    Number(prefs.sellerMessages.whatsapp) +
    Number(prefs.promotions.push) +
    Number(prefs.promotions.email) +
    Number(prefs.promotions.whatsapp);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900">
                  Preferências de Notificação
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black uppercase tracking-wider">
                  {activeCount} de {totalSlots} Ativos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Personalize com total precisão quais tipos de atualizações você quer receber em cada um dos seus canais (Push, E-mail e WhatsApp). Suas escolhas respeitam sua privacidade segundo a LGPD.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSubView('matrix')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeSubView === 'matrix'
                    ? 'bg-white text-blue-600 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Canais & Alertas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('history')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeSubView === 'history'
                    ? 'bg-white text-blue-600 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico Recebido</span>
              </button>
            </div>
          </div>
        </div>

        {/* Channels Information Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                Canal Push / Navegador
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                Dispositivo Atual & Web App
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
              Ativo
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                Canal E-mail
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentUser?.email || 'E-mail não informado'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold shrink-0">
              {currentUser?.isEmailVerified ? 'Verificado' : 'Cadastrado'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                Canal WhatsApp
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {currentUser?.phone || 'Telefone não informado'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
              Disponível
            </span>
          </div>
        </div>
      </div>

      {activeSubView === 'matrix' ? (
        <>
          {/* Presets Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Ações Rápidas & Predefinições:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all active:scale-95 shadow-2xs"
              >
                Ativar Todos
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('essential')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold transition-all active:scale-95 shadow-2xs"
              >
                Apenas Essenciais
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('noPromo')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold transition-all active:scale-95 shadow-2xs"
              >
                Silenciar Ofertas
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('reset')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 font-medium transition-all active:scale-95 flex items-center space-x-1"
                title="Restaurar padrão sugerido"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Padrão</span>
              </button>
            </div>
          </div>

          {/* NOTIFICATION PREFERENCES MATRIX */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Table Header (Desktop) */}
            <div className="hidden md:grid md:grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-xs font-black text-slate-600 uppercase tracking-wider">
              <div className="col-span-5">Tipo de Atualização</div>
              <div className="col-span-2 text-center flex items-center justify-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>Push (App)</span>
              </div>
              <div className="col-span-2 text-center flex items-center justify-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                <span>E-mail</span>
              </div>
              <div className="col-span-3 text-center flex items-center justify-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* ITEM 1: STATUS DE PEDIDO */}
              <div className="p-5 md:px-6 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50/50 transition-colors">
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Status de Pedido & Entregas
                      </h4>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        Recomendado • Alta Prioridade
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pl-10.5 md:pl-0">
                    Confirmação de estoque, preparo na loja, saída para entrega, código de retirada expressa no balcão e agendamentos confirmados.
                  </p>
                </div>

                {/* Toggles for Channels */}
                <div className="w-full md:col-span-7 grid grid-cols-3 gap-2 sm:gap-4 pt-2 md:pt-0">
                  {/* Push */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      Push
                    </span>
                    <button
                      type="button"
                      id="toggle-order-push"
                      onClick={() => toggleChannel('orderStatus', 'push')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.orderStatus.push ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar Push para Status de Pedido"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.orderStatus.push ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.orderStatus.push ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  {/* E-mail */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      E-mail
                    </span>
                    <button
                      type="button"
                      id="toggle-order-email"
                      onClick={() => toggleChannel('orderStatus', 'email')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.orderStatus.email ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar E-mail para Status de Pedido"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.orderStatus.email ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.orderStatus.email ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      WhatsApp
                    </span>
                    <button
                      type="button"
                      id="toggle-order-whatsapp"
                      onClick={() => toggleChannel('orderStatus', 'whatsapp')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.orderStatus.whatsapp ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar WhatsApp para Status de Pedido"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.orderStatus.whatsapp ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.orderStatus.whatsapp ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ITEM 2: MENSAGENS DE LOJISTAS */}
              <div className="p-5 md:px-6 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50/50 transition-colors">
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Mensagens de Lojistas & Chat
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Comunicação Direta
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pl-10.5 md:pl-0">
                    Respostas dos comerciantes no chat interno sobre produtos, dúvidas de agendamento de serviços, detalhes de tamanho e orçamentos.
                  </p>
                </div>

                {/* Toggles for Channels */}
                <div className="w-full md:col-span-7 grid grid-cols-3 gap-2 sm:gap-4 pt-2 md:pt-0">
                  {/* Push */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      Push
                    </span>
                    <button
                      type="button"
                      id="toggle-messages-push"
                      onClick={() => toggleChannel('sellerMessages', 'push')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.sellerMessages.push ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar Push para Mensagens de Lojistas"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.sellerMessages.push ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.sellerMessages.push ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  {/* E-mail */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      E-mail
                    </span>
                    <button
                      type="button"
                      id="toggle-messages-email"
                      onClick={() => toggleChannel('sellerMessages', 'email')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.sellerMessages.email ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar E-mail para Mensagens de Lojistas"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.sellerMessages.email ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.sellerMessages.email ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      WhatsApp
                    </span>
                    <button
                      type="button"
                      id="toggle-messages-whatsapp"
                      onClick={() => toggleChannel('sellerMessages', 'whatsapp')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.sellerMessages.whatsapp ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar WhatsApp para Mensagens de Lojistas"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.sellerMessages.whatsapp ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.sellerMessages.whatsapp ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ITEM 3: OFERTAS & NOVIDADES */}
              <div className="p-5 md:px-6 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50/50 transition-colors">
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Ofertas, Promoções & Destaques
                      </h4>
                      <span className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">
                        Opcional • Comércio de Macacu
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pl-10.5 md:pl-0">
                    Cupons de desconto, liquidações relâmpago, lançamentos das lojas parceiras e novidades do portal regional Achei Aqui.
                  </p>
                </div>

                {/* Toggles for Channels */}
                <div className="w-full md:col-span-7 grid grid-cols-3 gap-2 sm:gap-4 pt-2 md:pt-0">
                  {/* Push */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      Push
                    </span>
                    <button
                      type="button"
                      id="toggle-promo-push"
                      onClick={() => toggleChannel('promotions', 'push')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.promotions.push ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar Push para Ofertas"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.promotions.push ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.promotions.push ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  {/* E-mail */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      E-mail
                    </span>
                    <button
                      type="button"
                      id="toggle-promo-email"
                      onClick={() => toggleChannel('promotions', 'email')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.promotions.email ? 'bg-purple-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar E-mail para Ofertas"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.promotions.email ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.promotions.email ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 md:bg-transparent md:border-0 text-center">
                    <span className="text-[11px] font-bold text-slate-600 md:hidden mb-1">
                      WhatsApp
                    </span>
                    <button
                      type="button"
                      id="toggle-promo-whatsapp"
                      onClick={() => toggleChannel('promotions', 'whatsapp')}
                      className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors ${
                        prefs.promotions.whatsapp ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      aria-label="Alternar WhatsApp para Ofertas"
                    >
                      <div
                        className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                          prefs.promotions.whatsapp ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500 mt-1">
                      {prefs.promotions.whatsapp ? 'Ativo' : 'Desativado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                id="btn-test-notification"
                onClick={handleSendTestNotification}
                disabled={isSendingTest}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 transition-all flex items-center justify-center space-x-2 shadow-2xs active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>{isSendingTest ? 'Disparando...' : 'Enviar Notificação de Teste'}</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {isSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Preferências Salvas!</span>
                  </span>
                )}
                <button
                  type="button"
                  id="btn-save-notification-prefs"
                  onClick={() => handleSave()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Preferências</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Security Note */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Privacidade & Alertas Críticos de Segurança</p>
              <p className="text-blue-800/80 leading-relaxed text-[11px]">
                Notificações confidenciais e indispensáveis de segurança (como redefinição de senha, confirmação de cadastro e alertas de acesso suspeito) serão sempre enviadas diretamente ao seu e-mail cadastrado por motivos legais e de segurança da conta.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* History of user notifications */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Histórico de Notificações Recebidas
              </h4>
              <p className="text-xs text-slate-500">
                Mensagens e comunicados particulares enviados especificamente para a sua conta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubView('matrix')}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Voltar aos Canais</span>
            </button>
          </div>
          <UserNotificationsList />
        </div>
      )}
    </div>
  );
};
