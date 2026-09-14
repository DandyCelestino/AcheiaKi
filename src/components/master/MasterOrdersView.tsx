import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit3,
  Trash2,
  Eye,
  Truck,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Sparkles,
  CalendarCheck2,
  X,
  Save,
  Store,
  DollarSign,
  Send,
  UserCheck,
  Check,
  Ban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import { NotificationService } from '../../services/notification_service';

interface MasterOrdersViewProps {
  onOpenDossier?: (target: { userId?: string; merchantId?: string }) => void;
}

export const MasterOrdersView: React.FC<MasterOrdersViewProps> = ({ onOpenDossier }) => {
  const {
    orders,
    merchants,
    users,
    createOrder,
    updateOrderStatus,
    updateOrderDetailsByMaster,
    cancelOrderByMaster,
    forceCompleteOrderByMaster,
    deleteOrderByMaster,
    triggerToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');

  // Modals
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [cancelModal, setCancelModal] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Edit Order Form State
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});

  // New Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '(21) 99999-8888',
    deliveryAddress: 'Centro, Cachoeiras de Macacu',
    merchantId: merchants[0]?.id || '',
    modality: 'DELIVERY' as any,
    itemsSummary: '1x Combo Especial Macacu',
    subtotal: 35.0,
    deliveryFee: 5.0,
    paymentMethod: 'PIX (Chave Local)'
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.merchantName.toLowerCase().includes(q) ||
        (o.deliveryAddress && o.deliveryAddress.toLowerCase().includes(q)) ||
        (o.pickupCode && o.pickupCode.toLowerCase().includes(q));

      const matchesModality = modalityFilter === 'ALL' || o.modality === modalityFilter;
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchesMerchant = merchantFilter === 'ALL' || o.merchantId === merchantFilter;

      return matchesSearch && matchesModality && matchesStatus && matchesMerchant;
    });
  }, [orders, searchQuery, modalityFilter, statusFilter, merchantFilter]);

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setEditFormData({ ...order });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    updateOrderDetailsByMaster(editingOrder.id, editFormData);
    setEditingOrder(null);
  };

  const handleConfirmCancel = () => {
    if (!cancelModal) return;
    cancelOrderByMaster(cancelModal.id, cancelReason || 'Cancelado administrativamente pelo Master');
    setCancelModal(null);
    setCancelReason('');
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.customerName || !newOrderForm.merchantId) {
      triggerToast('Preencha os campos obrigatórios.');
      return;
    }

    const selMerchant = merchants.find((m) => m.id === newOrderForm.merchantId);
    const total = Number(newOrderForm.subtotal) + Number(newOrderForm.deliveryFee);

    createOrder({
      merchantId: newOrderForm.merchantId,
      merchantName: selMerchant?.name || 'Loja Macacu',
      customerName: newOrderForm.customerName,
      customerPhone: newOrderForm.customerPhone,
      deliveryAddress: newOrderForm.deliveryAddress,
      modality: newOrderForm.modality,
      items: [
        {
          id: `item-${Date.now()}`,
          name: newOrderForm.itemsSummary,
          price: Number(newOrderForm.subtotal),
          quantity: 1
        }
      ],
      total,
      subtotal: Number(newOrderForm.subtotal),
      deliveryFee: Number(newOrderForm.deliveryFee),
      paymentMethod: newOrderForm.paymentMethod,
      status: 'Confirmado'
    });

    setShowNewOrderModal(false);
  };

  const handleNotifyWhatsApp = (order: Order) => {
    NotificationService.notifyOrderEvent(order, 'ORDER_CONFIRMED');
    triggerToast(`Mensagem transacional reenviada para o WhatsApp de ${order.customerName}`);
  };

  const getModalityBadge = (modality: string) => {
    switch (modality) {
      case 'RETIRADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AGENDAMENTO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EXPERIMENTAÇÃO':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'DELIVERY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Aguardando':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmado':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Em Preparo':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Em Rota':
      case 'Pronto para Retirada':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Cancelado':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Central de Pedidos, Entregas & Provador VIP
              </h2>
              <p className="text-xs text-slate-500">
                Controle operacional de todas as transações, rotas de entrega e intervenção emergencial Master.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Inserir Pedido Manual</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (DEL-..., RET-...), cliente, loja, endereço..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Modalidades</option>
            <option value="DELIVERY">Delivery</option>
            <option value="RETIRADA">Retirada Balcão</option>
            <option value="EXPERIMENTAÇÃO">Provador VIP</option>
            <option value="AGENDAMENTO">Agendamento</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Em Preparo">Em Preparo</option>
            <option value="Em Rota">Em Rota</option>
            <option value="Pronto para Retirada">Pronto p/ Retirada</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Lojas</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          Exibindo <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos registrados
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Código & Modalidade</th>
                <th className="px-4 py-3.5">Cliente & Contato</th>
                <th className="px-4 py-3.5">Loja Parceira</th>
                <th className="px-4 py-3.5">Valor & Pagamento</th>
                <th className="px-4 py-3.5">Status do Pedido</th>
                <th className="px-4 py-3.5 text-right">Intervenção Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="font-mono font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span>{ord.code}</span>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${getModalityBadge(
                            ord.modality
                          )}`}
                        >
                          {ord.modality}
                        </span>
                      </div>
                      {ord.pickupCode && (
                        <div className="text-[10px] text-blue-600 font-mono">
                          PIN: {ord.pickupCode}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onOpenDossier && onOpenDossier({ userId: ord.customerId, merchantId: ord.merchantId })}
                      className="text-left group cursor-pointer"
                      title="Clique para abrir Dossiê do Cliente"
                    >
                      <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {ord.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{ord.customerPhone || '(21) 99999-0000'}</span>
                      </div>
                    </button>
                    {ord.deliveryAddress && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {ord.deliveryAddress}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => onOpenDossier && onOpenDossier({ merchantId: ord.merchantId })}
                      className="text-left group cursor-pointer"
                      title="Clique para abrir Dossiê do Estabelecimento"
                    >
                      <div className="font-semibold text-slate-800 group-hover:text-emerald-700 flex items-center space-x-1 transition-colors">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ord.merchantName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ord.items.length} item(ns)
                      </div>
                    </button>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 text-sm">
                      R$ {(ord.totalAmount ?? (ord as any).total ?? 0).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ord.paymentMethod || 'PIX'}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                      {ord.cancellationReason && (
                        <div className="text-[10px] text-rose-600 italic">
                          Motivo: {ord.cancellationReason}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Ver Detalhes */}
                      <button
                        onClick={() => setViewingOrder(ord)}
                        title="Ver Detalhes do Pedido"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Notificar WhatsApp */}
                      <button
                        onClick={() => handleNotifyWhatsApp(ord)}
                        title="Disparar Notificação WhatsApp"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Concluir Manualmente / Baixa Forçada */}
                      {ord.status !== 'Concluído' && ord.status !== 'Cancelado' && (
                        <button
                          onClick={() => forceCompleteOrderByMaster(ord.id)}
                          title="Forçar Baixa / Concluir Pedido"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-100/70 rounded-lg transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Editar Dados do Pedido */}
                      <button
                        onClick={() => handleOpenEdit(ord)}
                        title="Editar Informações do Pedido"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Cancelar com Motivo */}
                      {ord.status !== 'Cancelado' && (
                        <button
                          onClick={() => setCancelModal(ord)}
                          title="Cancelar Pedido (Master)"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Excluir Registro */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o registro do pedido ${ord.code}?`)) {
                            deleteOrderByMaster(ord.id);
                          }
                        }}
                        title="Excluir Registro"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VER DETALHES DO PEDIDO */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Detalhes do Pedido #{viewingOrder.code}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {viewingOrder.merchantName} • {viewingOrder.modality}
                </p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Cliente</span>
                  <strong className="text-slate-900">{viewingOrder.customerName}</strong>
                  <div className="text-[11px] text-slate-500">{viewingOrder.customerPhone}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Status Atual</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getStatusBadge(
                      viewingOrder.status
                    )}`}
                  >
                    {viewingOrder.status}
                  </span>
                </div>
              </div>

              {viewingOrder.deliveryAddress && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Endereço de Entrega</span>
                  <span className="font-medium text-slate-800">{viewingOrder.deliveryAddress}</span>
                </div>
              )}

              {/* Itens */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider text-slate-500">
                  Itens do Pedido ({viewingOrder.items.length})
                </h4>
                <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                      <div>
                        <strong className="text-slate-900">
                          {item.quantity}x {item.name}
                        </strong>
                        {item.selectedSize && (
                          <span className="text-[10px] text-slate-500 ml-2">Tam: {item.selectedSize}</span>
                        )}
                        {item.selectedColor && (
                          <span className="text-[10px] text-slate-500 ml-2">Cor: {item.selectedColor}</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-800">
                        R$ {((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {((viewingOrder as any).subtotal ?? viewingOrder.totalAmount ?? (viewingOrder as any).total ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span>R$ {(viewingOrder.deliveryFee ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Geral:</span>
                  <span>R$ {(viewingOrder.totalAmount ?? (viewingOrder as any).total ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setViewingOrder(null);
                  handleOpenEdit(viewingOrder);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Editar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR DADOS DO PEDIDO */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Editar Pedido #{editingOrder.code}
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status do Pedido</label>
                  <select
                    value={editFormData.status || editingOrder.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="Aguardando">Aguardando</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Em Preparo">Em Preparo</option>
                    <option value="Em Rota">Em Rota</option>
                    <option value="Pronto para Retirada">Pronto para Retirada</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone do Cliente</label>
                  <input
                    type="text"
                    value={editFormData.customerPhone || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, customerPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço de Entrega</label>
                <input
                  type="text"
                  value={editFormData.deliveryAddress || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, deliveryAddress: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entregador / Motorista</label>
                  <input
                    type="text"
                    value={editFormData.driverName || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, driverName: e.target.value })
                    }
                    placeholder="Ex: Motoboy André"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone do Entregador</label>
                  <input
                    type="text"
                    value={editFormData.driverPhone || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, driverPhone: e.target.value })
                    }
                    placeholder="(21) 99999-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas Internas Master</label>
                <textarea
                  rows={2}
                  value={editFormData.cancellationReason || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, cancellationReason: e.target.value })
                  }
                  placeholder="Justificativa ou nota de atendimento..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CANCELAR PEDIDO */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Cancelar Pedido #{cancelModal.code}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Esta ação altera o status para Cancelado e notifica o cliente.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Motivo do Cancelamento / Estorno:
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo formal..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO PEDIDO MANUAL */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Inserir Pedido Manual de Emergência
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customerName}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, customerName: e.target.value })
                    }
                    placeholder="Ex: Maria Pereira"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    value={newOrderForm.customerPhone}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })
                    }
                    placeholder="(21) 99999-8888"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loja Prestadora *</label>
                  <select
                    required
                    value={newOrderForm.merchantId}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, merchantId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modalidade</label>
                  <select
                    value={newOrderForm.modality}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, modality: e.target.value as any })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="DELIVERY">DELIVERY</option>
                    <option value="RETIRADA">RETIRADA BALCÃO</option>
                    <option value="EXPERIMENTAÇÃO">PROVADOR VIP</option>
                    <option value="AGENDAMENTO">AGENDAMENTO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço de Entrega</label>
                <input
                  type="text"
                  value={newOrderForm.deliveryAddress}
                  onChange={(e) =>
                    setNewOrderForm({ ...newOrderForm, deliveryAddress: e.target.value })
                  }
                  placeholder="Rua, Número, Bairro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resumo dos Itens</label>
                <input
                  type="text"
                  value={newOrderForm.itemsSummary}
                  onChange={(e) =>
                    setNewOrderForm({ ...newOrderForm, itemsSummary: e.target.value })
                  }
                  placeholder="Ex: 2x Pizza Média Calabresa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtotal (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOrderForm.subtotal}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        subtotal: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Taxa Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOrderForm.deliveryFee}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        deliveryFee: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Calculado</label>
                  <div className="px-3 py-2 bg-slate-100 rounded-lg font-bold text-slate-900">
                    R$ {(Number(newOrderForm.subtotal) + Number(newOrderForm.deliveryFee)).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Emitir Pedido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
