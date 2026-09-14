import React, { useState, useMemo } from 'react';
import {
  X,
  User as UserIcon,
  Store,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  ShoppingBag,
  DollarSign,
  Percent,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Star,
  Activity,
  Layers,
  Package,
  Wrench,
  ExternalLink,
  Lock,
  Edit3,
  Copy,
  Check,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Ban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, StoreMerchant, Order, Product, ServiceItem, CustomerToMerchantReview, AuditLog } from '../../types';

interface MasterDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  targetMerchantId?: string;
  initialTab?: 'overview' | 'orders' | 'sales' | 'catalog' | 'reviews' | 'audit' | 'security';
}

export const MasterDossierModal: React.FC<MasterDossierModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetMerchantId,
  initialTab = 'overview'
}) => {
  const {
    users,
    merchants,
    orders,
    products,
    services,
    reviews,
    auditLogs,
    updateUserByMaster,
    updateStoreProfile,
    setMerchantCommissionRate,
    blockUserByMaster,
    reactivateUserByMaster,
    suspendMerchant,
    reactivateMerchant,
    impersonateUser,
    triggerToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'sales' | 'catalog' | 'reviews' | 'audit' | 'security'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newCommissionInput, setNewCommissionInput] = useState<number | null>(null);

  // Find target entities
  const targetUser = useMemo(() => {
    if (targetUserId) return users.find((u) => u.id === targetUserId);
    if (targetMerchantId) {
      const m = merchants.find((m) => m.id === targetMerchantId);
      if (m) {
        return users.find((u) => u.id === m.id || u.merchantId === m.id || u.email?.toLowerCase() === m.email?.toLowerCase());
      }
    }
    return undefined;
  }, [users, merchants, targetUserId, targetMerchantId]);

  const targetMerchant = useMemo(() => {
    if (targetMerchantId) return merchants.find((m) => m.id === targetMerchantId);
    if (targetUser) {
      if (targetUser.merchantId) return merchants.find((m) => m.id === targetUser.merchantId);
      return merchants.find((m) => m.id === targetUser.id || m.email?.toLowerCase() === targetUser.email?.toLowerCase());
    }
    return undefined;
  }, [merchants, targetMerchantId, targetUser]);

  // If no user/merchant found, return null
  if (!isOpen || (!targetUser && !targetMerchant)) return null;

  const displayName = targetMerchant?.name || targetUser?.name || 'Cadastro';
  const displayRole = targetMerchant ? (targetMerchant.category === 'Serviços & Profissionais' ? 'PRESTADOR DE SERVIÇOS' : 'LOJISTA / COMÉRCIO') : (targetUser?.role || 'CLIENTE');
  const avatarUrl = targetMerchant?.logo || targetMerchant?.coverImage || targetUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80';

  // Purchases made by this customer
  const customerOrders = orders.filter((o) => {
    if (targetUser) {
      return o.customerId === targetUser.id || (o.customerPhone && targetUser.phone && o.customerPhone.replace(/\D/g, '') === targetUser.phone.replace(/\D/g, ''));
    }
    return false;
  });

  // Sales made by this merchant/store
  const merchantOrders = targetMerchant ? orders.filter((o) => o.merchantId === targetMerchant.id) : [];

  // Financial calculations
  const totalPurchasesAmount = customerOrders.reduce((acc, curr) => acc + (curr.totalAmount ?? (curr as any).total ?? 0), 0);
  const totalSalesAmount = merchantOrders.reduce((acc, curr) => acc + (curr.totalAmount ?? (curr as any).total ?? 0), 0);
  const commissionRate = targetMerchant?.commissionRate ?? 10;
  const totalCommissionGenerated = merchantOrders.reduce((acc, curr) => {
    const val = curr.totalAmount ?? (curr as any).total ?? 0;
    return acc + (val * (commissionRate / 100));
  }, 0);
  const netMerchantSales = totalSalesAmount - totalCommissionGenerated;

  // Products and services belonging to target merchant
  const merchantProducts = targetMerchant ? products.filter((p) => p.merchantId === targetMerchant.id) : [];
  const merchantServices = targetMerchant ? services.filter((s) => s.merchantId === targetMerchant.id) : [];

  // Reviews given or received
  const targetReviews = targetMerchant ? reviews.filter((r) => r.merchantId === targetMerchant.id) : [];

  // Audit Logs related to target user/merchant
  const targetAuditLogs = auditLogs.filter((log) => {
    return (
      (targetUser && (log.userId === targetUser.id || log.userEmail === targetUser.email)) ||
      (targetMerchant && (log.details.includes(targetMerchant.name) || log.details.includes(targetMerchant.id)))
    );
  });

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    triggerToast(`${fieldName} copiado com sucesso!`);
  };

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMerchant || newCommissionInput === null) return;
    setMerchantCommissionRate(targetMerchant.id, newCommissionInput);
    setNewCommissionInput(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* TOP HEADER - DOSSIÊ 360° */}
        <div className="bg-slate-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="relative group shrink-0">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md bg-slate-800"
              />
              <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-blue-600 text-white font-mono font-bold text-[9px] rounded-md shadow-xs">
                MASTER
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-lg sm:text-2xl font-black text-white truncate">
                  {displayName}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  displayRole.includes('PRESTADOR')
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : displayRole.includes('LOJISTA')
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {displayRole}
                </span>
                {targetUser?.status === 'blocked' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                    BLOQUEADO
                  </span>
                )}
                {targetMerchant?.status === 'approved' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ESTABELECIMENTO ATIVO
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                <span>ID: <strong className="font-mono text-slate-300">{targetUser?.id || targetMerchant?.id}</strong></span>
                <span>•</span>
                <span>Cadastrado em: {targetUser?.createdAt || targetMerchant?.submittedAt || 'Recente'}</span>
              </p>

              <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1.5 flex-wrap gap-y-1">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>{targetUser?.phone || targetMerchant?.phone || 'Sem telefone'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{targetUser?.email || targetMerchant?.email || 'Sem e-mail'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>{targetUser?.neighborhood || targetMerchant?.neighborhood || 'Centro, Cachoeiras de Macacu'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            {targetUser && (
              <button
                type="button"
                onClick={() => impersonateUser(targetUser.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                title="Acessar painel como este usuário"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Acessar Painel</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center space-x-1 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Visão Geral & Cadastro</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-600" />
            <span>Credenciais & Sigilo</span>
          </button>

          {customerOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Compras ({customerOrders.length})</span>
            </button>
          )}

          {targetMerchant && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('sales')}
                className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  activeTab === 'sales'
                    ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Vendas & Comissões ({merchantOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  activeTab === 'catalog'
                    ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Catálogo ({merchantProducts.length + merchantServices.length})</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-slate-700" />
            <span>Logs & Manifestações ({targetAuditLogs.length})</span>
          </button>
        </div>

        {/* TAB BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* 1. VISÃO GERAL & CADASTRO COMPLETO */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Compras (Cliente)</span>
                  <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {totalPurchasesAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <span className="text-[10px] text-slate-500">{customerOrders.length} pedidos realizados</span>
                </div>

                {targetMerchant && (
                  <>
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Faturamento Bruto (Loja)</span>
                      <p className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                        {totalSalesAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <span className="text-[10px] text-emerald-700">{merchantOrders.length} vendas registradas</span>
                    </div>

                    <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Comissão Retida Master</span>
                      <p className="text-base sm:text-lg font-black text-purple-950 mt-1">
                        {totalCommissionGenerated.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <span className="text-[10px] text-purple-700">Taxa atual: {commissionRate}%</span>
                    </div>

                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Repasse Líquido à Loja</span>
                      <p className="text-base sm:text-lg font-black text-blue-950 mt-1">
                        {netMerchantSales.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <span className="text-[10px] text-blue-700">Após dedução da comissão</span>
                    </div>
                  </>
                )}
              </div>

              {/* Personal & Business Dossier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados Pessoais / Fiscais */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Dados Pessoais & Documentação</span>
                  </h4>

                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500">Nome Completo:</span>
                      <span className="font-bold text-slate-900">{targetUser?.name || targetMerchant?.ownerName || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">CPF / CNPJ:</span>
                      <span className="font-mono font-bold text-slate-900">{targetUser?.cpf || targetMerchant?.cnpjOrCpf || 'Não cadastrado'}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Telefone Principal:</span>
                      <span className="font-mono font-bold text-slate-900">{targetUser?.phone || targetMerchant?.phone}</span>
                    </div>
                    {targetUser?.secondaryPhone && (
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Telefone Secundário:</span>
                        <span className="font-mono text-slate-700">{targetUser.secondaryPhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">E-mail:</span>
                      <span className="font-bold text-slate-900">{targetUser?.email || targetMerchant?.email}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Data de Nascimento:</span>
                      <span className="text-slate-800">{targetUser?.birthDate || 'Não informada'}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Gênero:</span>
                      <span className="text-slate-800">{targetUser?.gender || 'Não especificado'}</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Endereço Completo:</span>
                      <span className="font-bold text-slate-900 text-right max-w-[60%]">
                        {targetUser?.address || targetMerchant?.address || 'Centro, Cachoeiras de Macacu, RJ'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dados do Estabelecimento (se aplicável) */}
                {targetMerchant ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-blue-600" />
                      <span>Informações do Estabelecimento</span>
                    </h4>

                    <div className="space-y-2 text-xs divide-y divide-slate-100">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500">Razão Social / Nome Fantasia:</span>
                        <span className="font-bold text-slate-900">{targetMerchant.name}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Categoria de Atuação:</span>
                        <span className="font-bold text-blue-700">{targetMerchant.category}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Horário de Funcionamento:</span>
                        <span className="text-slate-800">{targetMerchant.openingHours || '08:00 às 18:00'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Taxa de Entrega Padrão:</span>
                        <span className="font-bold text-slate-900">
                          {targetMerchant.deliveryFee ? `R$ ${targetMerchant.deliveryFee.toFixed(2)}` : 'Grátis / Sob Consulta'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Tempo de Entrega Estimado:</span>
                        <span className="text-slate-800">{targetMerchant.deliveryTimeEstimate || '30-45 min'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Modalidades Ativas:</span>
                        <span className="text-slate-900 text-right">
                          {[
                            targetMerchant.supportsPickup && 'Retirada',
                            targetMerchant.supportsTrial && 'Provador VIP',
                            targetMerchant.supportsAppointments && 'Agendamento',
                            'Delivery'
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Comissão da Plataforma:</span>
                        <span className="font-mono font-black text-purple-700">{commissionRate}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Preferências de VIP / Medidas do Cliente */
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Perfil VIP & Preferências de Consumo</span>
                    </h4>

                    <div className="space-y-2 text-xs divide-y divide-slate-100">
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500">Tamanho de Roupas (Superior):</span>
                        <span className="font-bold text-slate-900">{targetUser?.measurements?.topSize || 'M (Padrão)'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Tamanho de Calçados:</span>
                        <span className="font-bold text-slate-900">{targetUser?.measurements?.shoeSize || '38'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Corte Preferido:</span>
                        <span className="text-slate-800">{targetUser?.measurements?.preferredFit || 'Normal'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Cores Favoritas:</span>
                        <span className="text-slate-800">{targetUser?.measurements?.favoriteColors?.join(', ') || 'Preto, Azul Marinho, Branco'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-500">Modalidade Preferida:</span>
                        <span className="text-slate-800">{targetUser?.preferences?.preferredModality || 'DELIVERY'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. CREDENCIAIS & SIGILO ABSOLUTO */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start space-x-3">
                <Lock className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 space-y-1">
                  <p className="font-bold">Acesso Restrito ao Administrador Master Supremo</p>
                  <p>
                    As contas são individuais e resguardadas sob absoluto sigilo entre usuários e comerciantes.
                    Apenas você, como Master, possui acesso a credenciais, dados de identificação e redefinições de acesso.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Credenciais de Autenticação do Usuário
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">E-mail de Login:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={targetUser?.email || targetMerchant?.email || ''}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(targetUser?.email || targetMerchant?.email || '', 'E-mail')}
                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                        title="Copiar"
                      >
                        {copiedField === 'E-mail' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Senha do Cadastro:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        readOnly
                        value={targetUser?.password || '••••••••'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                        title={showPassword ? 'Ocultar Senha' : 'Ver Senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(targetUser?.password || '', 'Senha')}
                        className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                        title="Copiar Senha"
                      >
                        {copiedField === 'Senha' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {targetMerchant && (
                  <div className="pt-4 border-t border-slate-200">
                    <h5 className="text-xs font-bold text-slate-800 mb-2">Comissão Personalizada da Loja / Prestador</h5>
                    <form onSubmit={handleSaveCommission} className="flex items-center space-x-2 max-w-sm">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={newCommissionInput !== null ? newCommissionInput : commissionRate}
                          onChange={(e) => setNewCommissionInput(parseFloat(e.target.value) || 0)}
                          className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs font-bold font-mono outline-none focus:border-blue-600"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
                      </div>
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Atualizar Taxa
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. HISTÓRICO DE COMPRAS (COMO CLIENTE) */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Histórico de Pedidos Realizados ({customerOrders.length})
              </h4>

              {customerOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  Nenhum pedido realizado por este usuário até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-300 transition-all text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-slate-900">{order.code}</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">
                            {order.modality}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            order.status === 'Concluído'
                              ? 'bg-emerald-50 text-emerald-800'
                              : order.status === 'Cancelado'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          Loja: <strong>{order.merchantName}</strong> • {order.itemsSummary || '1 item'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {order.createdAt || 'Data recente'} • Entrega: {order.deliveryAddress || 'Retirada'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm block">
                          {(order.totalAmount ?? (order as any).total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        {order.securityCode && (
                          <span className="font-mono text-[10px] text-purple-700 font-bold">
                            Cód: {order.securityCode}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. VENDAS & COMISSÕES (COMO LOJA / PRESTADOR) */}
          {activeTab === 'sales' && targetMerchant && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Vendas Registradas no Estabelecimento ({merchantOrders.length})
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  Comissão Base: <strong className="text-purple-700">{commissionRate}%</strong>
                </span>
              </div>

              {merchantOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  Nenhuma venda registrada para este estabelecimento ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {merchantOrders.map((order) => {
                    const total = order.totalAmount ?? (order as any).total ?? 0;
                    const commission = total * (commissionRate / 100);
                    const net = total - commission;

                    return (
                      <div
                        key={order.id}
                        className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-slate-900">{order.code}</span>
                            <span className="font-bold text-slate-800">Cliente: {order.customerName}</span>
                            <span className="text-slate-400">({order.customerPhone})</span>
                          </div>
                          <p className="text-slate-600">
                            Itens: {order.itemsSummary || 'Itens diversos'} • Status: <strong>{order.status}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400">{order.createdAt}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-right bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-bold">Bruto</span>
                            <span className="font-black text-slate-900">
                              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-purple-700 block uppercase font-bold">Comissão Master</span>
                            <span className="font-black text-purple-800">
                              {commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-emerald-700 block uppercase font-bold">Líquido Loja</span>
                            <span className="font-black text-emerald-800">
                              {net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. CATÁLOGO DE PRODUTOS & SERVIÇOS */}
          {activeTab === 'catalog' && targetMerchant && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Catálogo de Produtos & Serviços ({merchantProducts.length + merchantServices.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {merchantProducts.map((prod) => (
                  <div key={prod.id} className="p-3 bg-white border border-slate-200 rounded-xl flex space-x-3 items-center">
                    <img
                      src={prod.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120'}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-xs block truncate">{prod.name}</span>
                      <span className="text-xs font-black text-emerald-700">
                        {prod.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Estoque: {prod.stock} un.</span>
                    </div>
                  </div>
                ))}

                {merchantServices.map((srv) => (
                  <div key={srv.id} className="p-3 bg-white border border-slate-200 rounded-xl flex space-x-3 items-center">
                    <img
                      src={srv.images[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120'}
                      alt={srv.title}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-xs block truncate">{srv.title}</span>
                      <span className="text-xs font-black text-purple-700">
                        {srv.price ? srv.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob Orçamento'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{srv.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. LOGS & AUDITORIA */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Eventos e Manifestações Registradas no Sistema ({targetAuditLogs.length})
              </h4>

              {targetAuditLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  Nenhum evento crítico registrado especificamente para este cadastro.
                </div>
              ) : (
                <div className="space-y-2">
                  {targetAuditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <span>IP: {log.ipAddress}</span>
                        <span>•</span>
                        <span>Dispositivo: {log.device}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Dossiê de Auditoria Master • Sigilo Total Garantido
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
          >
            Fechar Dossiê
          </button>
        </div>

      </div>
    </div>
  );
};
