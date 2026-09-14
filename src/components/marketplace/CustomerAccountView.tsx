import React, { useState } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  Calendar,
  Clock,
  Shirt,
  Copy,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  LogOut,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  Edit3,
  Sliders,
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Bell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Order } from '../../types';
import { CustomerProfileEditor } from './CustomerProfileEditor';
import { CustomerNotificationPreferences } from './CustomerNotificationPreferences';
import { CustomerReviewModal } from '../reviews/CustomerReviewModal';
import { CustomerReputationBadge } from '../reviews/CustomerReputationBadge';
import { NotificationAccountBanner } from '../notifications/NotificationAccountBanner';
import { UserNotificationsList } from '../notifications/UserNotificationsList';

interface CustomerAccountViewProps {
  onSelectProduct: (p: Product) => void;
  onOpenCheckout: (p: Product) => void;
  onOpenAuth: () => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  onSelectProduct,
  onOpenCheckout,
  onOpenAuth
}) => {
  const {
    currentUser,
    orders,
    favorites,
    products,
    logout,
    currentCity,
    triggerToast,
    reviews,
    addCustomerReview,
    getCustomerReputationSummary,
    isOrderReviewedByCustomer,
    openPolicyModal,
    openSubOrderChat,
    getUnreadSubOrderMessagesCount,
    getUnreadNotificationsCount
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'orders' | 'pickups' | 'trials' | 'services' | 'favorites' | 'reputation'>('profile');
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);

  const unreadNotifCount = getUnreadNotificationsCount ? getUnreadNotificationsCount(currentUser) : 0;

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Acesse sua Conta</h3>
        <p className="text-xs text-slate-500">
          Faça login para acompanhar seus pedidos, códigos de retirada e agendamentos no comércio local.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20"
        >
          Entrar ou Criar Conta
        </button>
      </div>
    );
  }

  // Filter orders
  const userOrders = orders; // Show all connected orders for smooth test experience
  const pickupOrders = userOrders.filter((o) => o.modality === 'RETIRADA');
  const trialOrders = userOrders.filter((o) => o.modality === 'EXPERIMENTAÇÃO');
  const serviceBookings = userOrders.filter((o) => o.modality === 'AGENDAMENTO');
  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const copyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      triggerToast(`Código ${code} copiado!`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Em Rota':
      case 'Pronto para Retirada':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
      case 'Confirmado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {currentUser.name}
              </h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email} • {currentUser.phone}</p>
            <p className="text-xs text-slate-600 flex items-center mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 mr-1" />
              {currentUser.address || currentCity}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            type="button"
            id="btn-tab-notifications-top"
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-blue-600/20'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
            title="Preferências de Notificação"
          >
            <Bell className="w-3.5 h-3.5 text-blue-600" />
            <span>Notificações</span>
            {unreadNotifCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-blue-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Meu Cadastro</span>
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      <NotificationAccountBanner onOpenNotifications={() => setActiveTab('notifications')} />

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none text-xs font-bold border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          <span>Minha Ficha Cadastral</span>
          <span className="ml-1 px-1.5 py-0.2 bg-blue-500/20 text-[10px] rounded-full">
            {currentUser.addresses?.length || 0} end.
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-notifications"
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-500" />
          <span>Preferências de Notificação</span>
          {unreadNotifCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full">
              {unreadNotifCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Todos os Pedidos ({userOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pickups')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'pickups'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Códigos de Retirada ({pickupOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('trials')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'trials'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Provador & Reservas ({trialOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'services'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agendamentos ({serviceBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'favorites'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Favoritos ({favoriteProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reputation')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeTab === 'reputation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Minha Reputação & Avaliações</span>
        </button>
      </div>

      {/* TAB CONTENT: MINHA FICHA CADASTRAL */}
      {activeTab === 'profile' && <CustomerProfileEditor />}

      {/* TAB CONTENT: PREFERÊNCIAS DE NOTIFICAÇÃO */}
      {activeTab === 'notifications' && <CustomerNotificationPreferences />}

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {userOrders.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Nenhum pedido realizado ainda.</p>
            </div>
          ) : (
            userOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {order.code}
                    </span>
                    <span className="text-slate-400 text-xs">• {order.createdAt}</span>
                    <span className="text-xs font-bold text-slate-700">
                      na {order.merchantName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                      {order.modality}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      ● {order.status}
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 py-1">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.quantity}x {item.productName}
                      </p>
                      {item.selectedVariation && (
                        <p className="text-[10px] text-slate-500">
                          {Object.entries(item.selectedVariation)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      R$ {((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}

                {/* Comprehensive Order Breakdown Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  {/* Column 1: Resposta do Lojista / Estoque */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      1. Resposta do Lojista:
                    </span>
                    {order.stockConfirmationStatus === 'STOCK_CONFIRMED' ? (
                      <div className="text-emerald-800 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Estoque Confirmado e Separado ✓</span>
                      </div>
                    ) : order.stockConfirmationStatus === 'OUT_OF_STOCK' ? (
                      <div className="text-red-800 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Produto Esgotado / Sem Estoque</span>
                      </div>
                    ) : (
                      <div className="text-amber-800 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Em Análise pelo Lojista</span>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 block">
                      Loja: <strong>{order.merchantName}</strong>
                    </span>
                  </div>

                  {/* Column 2: Informações de Pagamento */}
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      2. Informações de Pagamento:
                    </span>
                    <p className="font-bold text-slate-900">
                      R$ {(order.totalAmount ?? (order as any).total ?? 0).toFixed(2).replace('.', ',')}
                    </p>
                    <span className="text-[11px] text-slate-600 block">
                      Modalidade: {order.paymentMethod || 'Acordo Direto com a Loja (PIX / Dinheiro / Cartão)'}
                    </span>
                  </div>

                  {/* Column 3: Informações de Envio / Retirada */}
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      3. Envio / Retirada & Conclusão:
                    </span>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      {order.modality === 'DELIVERY' ? <Truck className="w-3.5 h-3.5 text-blue-600" /> : <Store className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{order.modality}</span>
                    </p>
                    <span className="text-[11px] text-slate-600 block">
                      {order.deliveryAddress ? `Entrega: ${order.deliveryAddress}` : `Local: ${order.merchantName}`}
                    </span>
                  </div>
                </div>

                {/* If Service */}
                {order.serviceDetails && (
                  <div className="p-3 bg-blue-50/70 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-blue-950">
                      💆 {order.serviceDetails.serviceTitle}
                    </p>
                    <p className="text-blue-800">
                      Profissional: {order.serviceDetails.professional} • Data: {order.serviceDetails.scheduledDate} às {order.serviceDetails.scheduledTime}
                    </p>
                  </div>
                )}

                {/* Stock Confirmation & Reservation Status Banner */}
                {order.stockConfirmationStatus === 'PENDING_STORE_CONFIRMATION' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span><strong>Aguardando confirmação de estoque:</strong> A loja possui até 15 minutos para verificar a disponibilidade.</span>
                    </div>
                  </div>
                )}

                {order.stockConfirmationStatus === 'STOCK_CONFIRMED' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span><strong>Estoque Confirmado pela Loja!</strong> Produto em reserva temporária de 30 minutos.</span>
                    </div>
                  </div>
                )}

                {/* Security Negotiation Code Callout */}
                {order.securityCode && (
                  <div className="p-3.5 bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">
                        Código Único de Segurança & Negociação:
                      </span>
                      <p className="font-mono text-lg font-black text-white tracking-widest">
                        {order.securityCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyCode(order.securityCode!)}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}

                {/* Pickup Code Callout if modality is RETIRADA */}
                {order.pickupCode && order.pickupCode !== order.securityCode && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-700 font-bold uppercase">
                        Código de Retirada no Balcão:
                      </span>
                      <p className="font-mono text-base font-black text-blue-950">
                        {order.pickupCode}
                      </p>
                    </div>
                    <button
                      onClick={() => copyCode(order.pickupCode!)}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500">Total do Pedido: </span>
                    <span className="font-black text-sm text-slate-900">
                      R$ {(order.totalAmount ?? (order as any).total ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const subId = (order as any).subpedidos?.[0]?.id || `sub-${order.id}`;
                        const subCode = (order as any).subpedidos?.[0]?.codigoSubpedido || `#${order.code || order.orderNumber}-A`;
                        openSubOrderChat({
                          subpedidoId: subId,
                          pedidoPrincipalId: order.id,
                          codigoSubpedido: subCode,
                          merchantId: order.merchantId,
                          merchantName: order.merchantName,
                          customerId: currentUser?.id,
                          customerName: currentUser?.name,
                          orderTitle: order.items?.[0]?.product?.name || `Pedido ${order.code}`,
                          orderStatus: order.status,
                          securityCode: order.pickupCode || order.securityCode,
                          orderTotal: order.totalAmount ?? (order as any).total
                        });
                      }}
                      className="relative px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mensagem Interna</span>
                      {(() => {
                        const unread = getUnreadSubOrderMessagesCount(
                          (order as any).subpedidos?.[0]?.id || `sub-${order.id}`,
                          currentUser?.id
                        );
                        if (unread > 0) {
                          return (
                            <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                              {unread}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </button>

                    {/* Review Actions for Completed Orders */}
                    {order.status === 'Concluído' && (
                      isOrderReviewedByCustomer(order.id) ? (
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Avaliação Realizada</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewingOrder(order)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Avaliar Estabelecimento</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: PICKUPS ONLY */}
      {activeTab === 'pickups' && (
        <div className="space-y-4">
          {pickupOrders.map((ord) => (
            <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{ord.merchantName}</span>
                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${getStatusBadge(ord.status)}`}>
                  ● {ord.status}
                </span>
              </div>

              <div className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-800 font-bold">Apresente este código no caixa:</p>
                  <p className="font-mono text-2xl font-black text-blue-950">{ord.pickupCode || ord.code}</p>
                </div>
                <button
                  onClick={() => copyCode(ord.pickupCode || ord.code)}
                  className="px-3 py-2 bg-white border border-blue-300 text-blue-700 text-xs font-bold rounded-xl"
                >
                  Copiar Código
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Endereço: {ord.customerAddress}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: TRIALS */}
      {activeTab === 'trials' && (
        <div className="space-y-4">
          {trialOrders.map((ord) => (
            <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{ord.merchantName}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
                  👗 Provador Agendado
                </span>
              </div>
              {ord.trialDetails && (
                <div className="p-3 bg-purple-50 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-purple-950">Data: {ord.trialDetails.date} às {ord.trialDetails.time}</p>
                  {ord.trialDetails.notes && <p className="text-purple-800">Obs: {ord.trialDetails.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {serviceBookings.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Nenhum serviço ou consulta agendada no momento.</p>
              <p className="text-xs text-slate-400 mt-1">Explore os prestadores e consultórios no marketplace para agendar horários com total transparência.</p>
            </div>
          ) : (
            serviceBookings.map((ord) => {
              const resp = ord.serviceDetails?.merchantResponse;
              const hasResponse = !!resp && resp.status !== 'PENDENTE';
              const isConfirmed = resp?.status === 'CONFIRMADO' || ord.status === 'Confirmado';
              const isRescheduled = resp?.status === 'REAGENDADO';
              const isCompleted = ord.status === 'Concluído' || resp?.status === 'CONCLUIDO';
              const isCancelled = ord.status === 'Cancelado' || resp?.status === 'RECUSADO';

              return (
                <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  {/* Top Bar with Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{ord.code}</span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs font-bold text-slate-800">{ord.merchantName}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isRescheduled
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : isCompleted
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        ● {isConfirmed ? 'Confirmado pelo Prestador' : isRescheduled ? 'Novo Horário Proposto' : isCompleted ? 'Atendimento Concluído' : isCancelled ? 'Cancelado / Recusado' : 'Aguardando Resposta'}
                      </span>
                    </div>
                  </div>

                  {/* Service Core Info */}
                  {ord.serviceDetails && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Serviço Contratado</span>
                        <div className="font-bold text-slate-900 text-sm">{ord.serviceDetails.serviceTitle}</div>
                        <div className="text-slate-600">Profissional: <strong>{ord.serviceDetails.professional}</strong></div>
                        <div className="text-slate-600">
                          Modalidade: <strong>{ord.serviceDetails.serviceLocation === 'DOMICILIO' ? 'Em Domicílio' : ord.serviceDetails.serviceLocation === 'ONLINE' ? 'Online / Remoto' : 'No Consultório / Estabelecimento'}</strong>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Data & Valor</span>
                        <div className="font-bold text-blue-700 text-sm">
                          {resp?.confirmedDate || ord.serviceDetails.scheduledDate} às {resp?.confirmedTime || ord.serviceDetails.scheduledTime}
                        </div>
                        <div className="text-slate-700 font-bold">
                          Valor: R$ {(resp?.confirmedPrice || ord.totalAmount || 0).toFixed(2).replace('.', ',')}
                          {ord.serviceDetails.pricingTypeSelected && (
                            <span className="text-[10px] text-slate-500 font-normal ml-1">
                              ({ord.serviceDetails.pricingTypeSelected === 'HORA' ? 'por hora' : ord.serviceDetails.pricingTypeSelected === 'DIARIA' ? 'diária' : ord.serviceDetails.pricingTypeSelected === 'MENSAL' ? 'mensalidade' : 'serviço'})
                            </span>
                          )}
                        </div>
                        {ord.customerAddress && (
                          <div className="text-[11px] text-slate-500 truncate">
                            Local: {ord.customerAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resposta Oficial do Prestador com Orientações */}
                  {resp && (
                    <div className={`p-4 rounded-xl border space-y-2 text-xs ${
                      isConfirmed
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : isRescheduled
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : isCancelled
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : 'bg-blue-50/70 border-blue-200 text-blue-950'
                    }`}>
                      <div className="flex items-center justify-between border-b pb-1.5 border-current/10 font-bold">
                        <div className="flex items-center space-x-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Resposta Oficial do Prestador ({resp.merchantAuthorName}):</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-75">{resp.respondedAt}</span>
                      </div>

                      <p className="leading-relaxed font-medium">"{resp.responseMessage}"</p>

                      {resp.instructionsForCustomer && (
                        <div className="p-2.5 bg-white/70 rounded-lg border border-current/15 mt-2 space-y-1">
                          <strong className="block text-[11px] uppercase tracking-wide">
                            📋 Orientações de Atendimento & Preparo:
                          </strong>
                          <span className="text-[11px]">{resp.instructionsForCustomer}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions (Mensagem Interna & Avaliação) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        const subId = (ord as any).subpedidos?.[0]?.id || `sub-${ord.id}`;
                        const subCode = (ord as any).subpedidos?.[0]?.codigoSubpedido || `#${ord.code}-A`;
                        openSubOrderChat({
                          subpedidoId: subId,
                          pedidoPrincipalId: ord.id,
                          codigoSubpedido: subCode,
                          merchantId: ord.merchantId,
                          merchantName: ord.merchantName,
                          customerId: currentUser?.id,
                          customerName: currentUser?.name,
                          orderTitle: ord.serviceDetails?.serviceTitle || `Agendamento #${ord.code}`,
                          orderStatus: ord.status,
                          securityCode: ord.securityCode,
                          orderTotal: ord.totalAmount
                        });
                      }}
                      className="relative px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-all flex items-center space-x-1.5 shadow-2xs active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mensagem Interna com o Prestador</span>
                      {(() => {
                        const unread = getUnreadSubOrderMessagesCount(
                          (ord as any).subpedidos?.[0]?.id || `sub-${ord.id}`,
                          currentUser?.id
                        );
                        if (unread > 0) {
                          return (
                            <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                              {unread}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </button>

                    {isCompleted && !isOrderReviewedByCustomer(ord.id) && (
                      <button
                        onClick={() => setReviewingOrder(ord)}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Avaliar Atendimento</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: FAVORITES */}
      {activeTab === 'favorites' && (
        <div>
          {favoriteProducts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Você ainda não favoritou nenhum produto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {favoriteProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-square object-cover rounded-xl mb-2"
                    />
                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{prod.name}</p>
                    <p className="text-[10px] text-slate-400">{prod.merchantName}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-black text-xs text-blue-600">
                      R$ {(prod.price ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCheckout(prod);
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: REPUTATION & AVALIAÇÕES */}
      {activeTab === 'reputation' && (
        <div className="space-y-6">
          {/* Customer Reputation Badge Component */}
          <CustomerReputationBadge
            summary={getCustomerReputationSummary(currentUser.id)}
            onOpenPolicy={() => openPolicyModal('merchant')}
          />

          {/* Reviews Given by Customer */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Avaliações que você enviou para lojas e profissionais</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Opiniões públicas e notas concedidas por você para serviços e produtos do comércio local.
                </p>
              </div>
              <button
                onClick={() => openPolicyModal('customer')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Política</span>
              </button>
            </div>

            {reviews.filter((r) => r.userId === currentUser.id).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                <Star className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-600">
                  Você ainda não avaliou nenhum pedido concluído.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Ao concluir suas compras, avalie as lojas para apoiar os comerciantes locais!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews
                  .filter((r) => r.userId === currentUser.id)
                  .map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-sm text-slate-900">
                            {rev.merchantName}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">
                            Pedido #{rev.orderCode} • {rev.createdAt}
                          </span>
                        </div>
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-amber-400' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        "{rev.comment}"
                      </p>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {rev.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Merchant Reply */}
                      {rev.merchantReply && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                          <span className="font-bold text-slate-900 block">
                            Resposta do Lojista ({rev.merchantReply.merchantAuthorName || rev.merchantName}):
                          </span>
                          <p className="text-slate-600">{rev.merchantReply.replyText}</p>
                          <span className="text-[10px] text-slate-400 block pt-1">
                            {rev.merchantReply.repliedAt}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Review Modal */}
      {reviewingOrder && (
        <CustomerReviewModal
          isOpen={!!reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          order={reviewingOrder}
          currentUser={currentUser}
          onSubmitReview={(reviewData) => {
            addCustomerReview(reviewData);
            setReviewingOrder(null);
          }}
          onOpenPolicy={() => openPolicyModal('customer')}
        />
      )}
    </div>
  );
};
