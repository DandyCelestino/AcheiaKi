import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  CalendarCheck2,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Truck,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Plus,
  Building2,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  Radio,
  Check,
  Layers,
  Menu,
  Settings,
  ShieldAlert,
  Sliders,
  DollarSign,
  TrendingUp,
  Activity,
  ShoppingBag,
  MessageSquare,
  Lock,
  UserCheck,
  Megaphone,
  Layout,
  BarChart3,
  Briefcase,
  Percent,
  Webhook,
  Bike,
  Receipt
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StoreMerchant, Order, OrderStatus } from '../../types';
import { MasterUsersView } from './MasterUsersView';
import { MasterMerchantsView } from './MasterMerchantsView';
import { MasterCatalogView } from './MasterCatalogView';
import { MasterOrdersView } from './MasterOrdersView';
import { MasterAuditView } from './MasterAuditView';
import { MasterSettingsView } from './MasterSettingsView';
import { MasterAdSpacesView } from './MasterAdSpacesView';
import { MasterFrontendView } from './MasterFrontendView';
import { NotificationMonitor } from './NotificationMonitor';
import { MasterReportsView } from './MasterReportsView';
import { MasterDossierModal } from './MasterDossierModal';
import { MasterSalesTeamView } from './MasterSalesTeamView';
import { MasterBoletoWebhookView } from './MasterBoletoWebhookView';
import { MasterSellerCommissionsView } from './MasterSellerCommissionsView';
import { MasterDeliveryView } from './MasterDeliveryView';
import { MasterFinanceLedgerView } from './MasterFinanceLedgerView';
import { DeliveryApprovalQueueView } from './DeliveryApprovalQueueView';

export const MasterAdminPanel: React.FC = () => {
  const {
    currentUser,
    users,
    merchants,
    orders,
    products,
    services,
    systemSettings,
    salesAgents,
    boletoRequests,
    deliveryRides,
    deliveryDrivers,
    approveMerchant,
    rejectMerchant,
    updateOrderStatus,
    setCurrentEnvironment,
    triggerToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'finance-ledger' | 'reports' | 'seller-commissions' | 'sales-team' | 'sales-analytics' | 'boleto-webhooks' | 'users' | 'merchants' | 'catalog' | 'orders' | 'delivery' | 'delivery-queue' | 'ad-spaces' | 'frontend' | 'audit' | 'notifications' | 'settings'
  >('dashboard');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLiveOpsActive, setIsLiveOpsActive] = useState(true);
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);

  // Dossier 360 Modal State
  const [dossierTarget, setDossierTarget] = useState<{ userId?: string; merchantId?: string } | null>(null);

  const handleOpenDossier = (target: { userId?: string; merchantId?: string }) => {
    setDossierTarget(target);
  };

  // Statistics
  const pendingMerchants = useMemo(() => {
    return merchants.filter((m) => m.status === 'pending');
  }, [merchants]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status !== 'Concluído' && o.status !== 'Cancelado').length;
  }, [orders]);

  const totalGMV = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'Cancelado')
      .reduce((acc, curr) => acc + (curr.totalAmount ?? (curr as any).total ?? 0), 0);
  }, [orders]);

  const blockedUsersCount = useMemo(() => {
    return users.filter((u) => u.status === 'blocked' || u.status === 'suspended').length;
  }, [users]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-hidden selection:bg-blue-100">
      {/* 1. SIDEBAR NAVEGAÇÃO MASTER SUPREMO */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:flex`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Marca Achei Aqui Master */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs shadow-blue-500/30">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-base tracking-tight leading-tight">
                  Achei Aqui
                </span>
                <span className="text-[10px] text-blue-400 font-semibold tracking-wide uppercase">
                  Master Supremo
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick link to public marketplace */}
          <div className="p-3 shrink-0">
            <button
              onClick={() => setCurrentEnvironment('MARKETPLACE')}
              className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Marketplace Público</span>
            </button>
          </div>

          {/* Menu Principal */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Centro de Controle
            </div>

            {/* Dashboard / Radar Geral */}
            <button
              id="tab-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Radar Geral & Live Ops</span>
            </button>

            {/* Painel Financeiro & Registros Contábeis de Planos */}
            <button
              id="tab-finance-ledger"
              onClick={() => {
                setActiveTab('finance-ledger');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'finance-ledger'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Receipt className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Painel Financeiro (Planos)</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                {boletoRequests.length}
              </span>
            </button>

            {/* Relatórios Diários & Movimentações */}
            <button
              id="tab-reports"
              onClick={() => {
                setActiveTab('reports');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Relatórios & Modo Gráfico</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                AO VIVO
              </span>
            </button>

            {/* NOVO: Comissões dos Vendedores (Exclusivo Master) */}
            <button
              id="tab-seller-commissions"
              onClick={() => {
                setActiveTab('seller-commissions');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'seller-commissions'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Percent className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Comissões de Vendedores</span>
              </div>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded-full font-bold">
                MASTER
              </span>
            </button>

            {/* Gestão de Vendedores & Boletos (Equipe Comercial) */}
            <button
              id="tab-sales-team"
              onClick={() => {
                setActiveTab('sales-team');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'sales-team'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="w-4 h-4 shrink-0 text-blue-400" />
                <span>Vendedores & Boletos</span>
              </div>
              {boletoRequests.filter((b) => b.status === 'PENDENTE_EMISSAO').length > 0 ? (
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full text-amber-300 font-bold">
                  {boletoRequests.filter((b) => b.status === 'PENDENTE_EMISSAO').length}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-300">
                  {salesAgents.length}
                </span>
              )}
            </button>

            {/* NOVO: Data Visualization Comercial & Metas (Recharts) */}
            <button
              id="tab-sales-analytics"
              onClick={() => {
                setActiveTab('sales-analytics');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'sales-analytics'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Analytics & Metas Vendas</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                Recharts
              </span>
            </button>

            {/* NOVO: Camada de Webhooks de Boletos & Comissões */}
            <button
              id="tab-boleto-webhooks"
              onClick={() => {
                setActiveTab('boleto-webhooks');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'boleto-webhooks'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Webhook className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Webhooks & Liquidação</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                Gateways
              </span>
            </button>

            {/* Gestão de Usuários */}
            <button
              id="tab-users"
              onClick={() => {
                setActiveTab('users');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Gestão de Usuários</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-300">
                {users.length}
              </span>
            </button>

            {/* Gestão de Lojas */}
            <button
              id="tab-merchants"
              onClick={() => {
                setActiveTab('merchants');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'merchants'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Store className="w-4 h-4 shrink-0" />
                <span>Lojas & Prestadores</span>
              </div>
              {pendingMerchants.length > 0 ? (
                <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full text-amber-300 font-bold">
                  {pendingMerchants.length}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-300">
                  {merchants.length}
                </span>
              )}
            </button>

            {/* Catálogo Global */}
            <button
              id="tab-catalog"
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Package className="w-4 h-4 shrink-0" />
                <span>Catálogo de Produtos</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-300">
                {products.length}
              </span>
            </button>

            {/* Central de Pedidos */}
            <button
              id="tab-orders"
              onClick={() => {
                setActiveTab('orders');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Pedidos & Provador VIP</span>
              </div>
              {activeOrdersCount > 0 && (
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded-full text-emerald-300 font-bold">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Supervisão de Delivery & Entregadores V1 */}
            <button
              id="tab-delivery"
              onClick={() => {
                setActiveTab('delivery');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'delivery'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Bike className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Entregas & Delivery V1</span>
              </div>
              {deliveryRides.filter((r) => ['AGUARDANDO_ENTREGADOR', 'ACEITA', 'EM_COLETA', 'EM_TRANSITO'].includes(r.status)).length > 0 ? (
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded-full text-emerald-300 font-bold">
                  {deliveryRides.filter((r) => ['AGUARDANDO_ENTREGADOR', 'ACEITA', 'EM_COLETA', 'EM_TRANSITO'].includes(r.status)).length}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-300">
                  {deliveryRides.length}
                </span>
              )}
            </button>

            {/* Fila de Aprovação de Entregas (Item 5 e 6) */}
            <button
              id="tab-delivery-queue"
              onClick={() => {
                setActiveTab('delivery-queue');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'delivery-queue'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Solicitações em Análise</span>
              </div>
              {deliveryRides.filter((r) => r.status === 'AGUARDANDO_ANALISE' || r.status === 'CORRECAO_SOLICITADA').length > 0 ? (
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {deliveryRides.filter((r) => r.status === 'AGUARDANDO_ANALISE' || r.status === 'CORRECAO_SOLICITADA').length}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400">
                  0
                </span>
              )}
            </button>

            <div className="pt-4 px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Monetização & Frontend
            </div>

            {/* Gestão de Publicidade & Leilões */}
            <button
              id="tab-ad-spaces"
              onClick={() => {
                setActiveTab('ad-spaces');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'ad-spaces'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Megaphone className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Mídia, Banners & Leilões</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                PRO
              </span>
            </button>

            {/* Controle do Frontend & Menus */}
            <button
              id="tab-frontend"
              onClick={() => {
                setActiveTab('frontend');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'frontend'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Layout className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Controle do Frontend & Menus</span>
            </button>

            <div className="pt-4 px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Governança & Segurança
            </div>

            {/* Auditoria */}
            <button
              id="tab-audit"
              onClick={() => {
                setActiveTab('audit');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Logs & Auditoria</span>
            </button>

            {/* Monitor de Notificações */}
            <button
              id="tab-notifications"
              onClick={() => {
                setActiveTab('notifications');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Disparos WhatsApp / API</span>
            </button>

            {/* Parâmetros & Backup */}
            <button
              id="tab-settings"
              onClick={() => {
                setActiveTab('settings');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Configurações & Backup</span>
            </button>
          </nav>

          {/* User profile banner at bottom */}
          <div className="p-3 mt-auto border-t border-slate-800/80 bg-slate-950/30 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                {currentUser?.name?.charAt(0) || 'M'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Administrador Master'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentUser?.email || 'telecom.david@gmail.com'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. ÁREA PRINCIPAL DE CONTEÚDO */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Master */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Achei Aqui • Macacu
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="text-sm md:text-base font-bold text-slate-900 capitalize">
                {activeTab === 'dashboard' && 'Radar Geral & Live Ops'}
                {activeTab === 'reports' && 'Relatórios Diários, Comissões & Movimentações em Tempo Real'}
                {activeTab === 'users' && 'Gestão de Usuários & Contas'}
                {activeTab === 'merchants' && 'Lojas & Prestadores de Serviços'}
                {activeTab === 'catalog' && 'Catálogo Global de Produtos & Serviços'}
                {activeTab === 'orders' && 'Central de Pedidos, Entregas & Provador VIP'}
                {activeTab === 'delivery' && 'Supervisão de Delivery & Entregadores V1'}
                {activeTab === 'delivery-queue' && 'Solicitações aguardando análise (Aprovação Master)'}
                {activeTab === 'audit' && 'Logs de Auditoria & Segurança'}
                {activeTab === 'notifications' && 'Monitor de Disparos WhatsApp & Supabase'}
                {activeTab === 'settings' && 'Parâmetros da Plataforma & Backup'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live Ops indicator */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live Ops Ativo</span>
            </div>

            {/* Quick Environment Switch */}
            <button
              onClick={() => setCurrentEnvironment('MARKETPLACE')}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Abrir Loja Pública"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Broadcast Warning if active */}
        {systemSettings.broadcastAlertEnabled && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>
                <strong>Aviso de Transmissão Ativo na Home:</strong>{' '}
                {systemSettings.broadcastMessage}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-[11px] underline hover:text-white"
            >
              Configurar
            </button>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* TAB: RADAR GERAL / DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Transacionado */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Volume Transacionado</span>
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      R$ {totalGMV.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-emerald-600 flex items-center space-x-1 font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>{orders.length} pedidos processados</span>
                    </div>
                  </div>

                  {/* Pedidos Ativos */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Pedidos em Andamento</span>
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {activeOrdersCount}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entregas e retiradas em tempo real
                    </div>
                  </div>

                  {/* Lojas Ativas */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Lojas & Prestadores</span>
                      <Store className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {merchants.length}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{merchants.filter((m) => m.status === 'approved').length} ativas</span>
                      {pendingMerchants.length > 0 && (
                        <span className="text-amber-600 font-bold">
                          {pendingMerchants.length} pendente(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Usuários Cadastrados */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span>Munícipes & Clientes</span>
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {users.length}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {blockedUsersCount > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {blockedUsersCount} suspenso/bloqueado
                        </span>
                      ) : (
                        <span>100% com acesso regular</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action Alerts */}
                {pendingMerchants.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-bold text-amber-900 text-xs">
                          {pendingMerchants.length} solicitação(ões) de credenciamento pendente(s)
                        </div>
                        <div className="text-[11px] text-amber-700">
                          {pendingMerchants.map((m) => m.name).join(', ')}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('merchants')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                    >
                      Avaliar Lojas
                    </button>
                  </div>
                )}

                {/* Alerta de Solicitações de Entrega Aguardando Análise (Seções 5 e 6) */}
                {deliveryRides.filter((r) => r.status === 'AGUARDANDO_ANALISE' || r.status === 'CORRECAO_SOLICITADA').length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-amber-950 text-xs flex items-center gap-2">
                          <span>
                            {deliveryRides.filter((r) => r.status === 'AGUARDANDO_ANALISE' || r.status === 'CORRECAO_SOLICITADA').length} solicitação(ões) de entrega aguardando análise
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                            Ação do Master Necessária
                          </span>
                        </div>
                        <div className="text-[11px] text-amber-800 mt-0.5">
                          Valide os dados, recalcule as tarifas e libere as corridas no radar de entregadores elegíveis.
                        </div>
                      </div>
                    </div>
                    <button
                      id="btn-goto-delivery-analysis-queue"
                      onClick={() => setActiveTab('delivery-queue')}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm cursor-pointer"
                    >
                      Acessar Fila de Análise
                    </button>
                  </div>
                )}

                {/* Live Operations & Quick Table Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Últimos Pedidos em Andamento */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          Últimos Pedidos em Rota / Balcão
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Ver todos ({orders.length})
                      </button>
                    </div>

                    <div className="space-y-2">
                      {orders.slice(0, 5).map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => handleOpenDossier({ userId: ord.customerId, merchantId: ord.merchantId })}
                          className="p-3 bg-slate-50 hover:bg-blue-50/50 cursor-pointer rounded-xl border border-slate-200/70 flex items-center justify-between transition-colors text-xs group"
                          title="Clique para abrir Dossiê 360°"
                        >
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 flex items-center space-x-2 transition-colors">
                              <span>{ord.code}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                • {ord.merchantName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Cliente: <strong className="text-slate-700">{ord.customerName}</strong> ({ord.modality})
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              R$ {(ord.totalAmount ?? (ord as any).total ?? 0).toFixed(2)}
                            </div>
                            <div className="text-[10px] font-bold text-blue-600">
                              {ord.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lojas em Destaque & Status */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Store className="w-4 h-4 text-amber-600" />
                        <h3 className="font-bold text-slate-900 text-sm">
                          Estabelecimentos Cadastrados
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('merchants')}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Gerenciar ({merchants.length})
                      </button>
                    </div>

                    <div className="space-y-2">
                      {merchants.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleOpenDossier({ merchantId: m.id })}
                          className="p-3 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer rounded-xl border border-slate-200/70 flex items-center justify-between transition-colors text-xs group"
                          title="Clique na loja para abrir Dossiê 360°"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={m.logo}
                              alt={m.name}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                            />
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {m.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {m.category} • {m.neighborhood}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PAINEL FINANCEIRO — REGISTROS & ENTRADAS DE PLANOS */}
            {activeTab === 'finance-ledger' && <MasterFinanceLedgerView />}

            {/* TAB: RELATÓRIOS & TEMPO REAL */}
            {activeTab === 'reports' && <MasterReportsView onOpenDossier={handleOpenDossier} />}

            {/* TAB: COMISSÕES DOS VENDEDORES (CONTROLE EXCLUSIVO MASTER) */}
            {activeTab === 'seller-commissions' && <MasterSellerCommissionsView />}

            {/* TAB: EQUIPE COMERCIAL & VENDEDORES ATRELADOS */}
            {activeTab === 'sales-team' && <MasterSalesTeamView />}

            {/* TAB: DATA VISUALIZATION COMERCIAL (RECHARTS) */}
            {activeTab === 'sales-analytics' && <MasterSalesTeamView initialSubTab="analytics" />}

            {/* TAB: WEBHOOKS DE BOLETOS & AUTOMAÇÃO FINANCEIRA */}
            {activeTab === 'boleto-webhooks' && <MasterBoletoWebhookView />}

            {/* TAB: GESTÃO DE USUÁRIOS */}
            {activeTab === 'users' && <MasterUsersView onOpenDossier={handleOpenDossier} />}

            {/* TAB: GESTÃO DE LOJAS */}
            {activeTab === 'merchants' && <MasterMerchantsView onOpenDossier={handleOpenDossier} />}

            {/* TAB: CATÁLOGO */}
            {activeTab === 'catalog' && <MasterCatalogView />}

            {/* TAB: PEDIDOS */}
            {activeTab === 'orders' && <MasterOrdersView onOpenDossier={handleOpenDossier} />}

            {/* TAB: DELIVERY & ENTREGADORES V1 */}
            {activeTab === 'delivery' && <MasterDeliveryView />}

            {/* TAB: FILA DE APROVAÇÃO DE ENTREGAS (ITENS 5 E 6) */}
            {activeTab === 'delivery-queue' && (
              <DeliveryApprovalQueueView onNavigateToRide={() => setActiveTab('delivery')} />
            )}

            {/* TAB: MÍDIA, BANNERS & LEILÕES */}
            {activeTab === 'ad-spaces' && <MasterAdSpacesView />}

            {/* TAB: CONTROLE DO FRONTEND & MENUS */}
            {activeTab === 'frontend' && <MasterFrontendView />}

            {/* TAB: AUDITORIA */}
            {activeTab === 'audit' && <MasterAuditView />}

            {/* TAB: NOTIFICAÇÕES */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <NotificationMonitor />
              </div>
            )}

            {/* TAB: CONFIGURAÇÕES & BACKUP */}
            {activeTab === 'settings' && <MasterSettingsView />}
          </div>
        </main>
      </div>

      {/* MODAL SUPREMO: DOSSIÊ 360° DO USUÁRIO OU ESTABELECIMENTO */}
      {dossierTarget && (
        <MasterDossierModal
          targetUserId={dossierTarget.userId}
          targetMerchantId={dossierTarget.merchantId}
          onClose={() => setDossierTarget(null)}
        />
      )}
    </div>
  );
};
