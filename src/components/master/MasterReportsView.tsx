import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Store,
  Wrench,
  ShoppingBag,
  Calendar,
  Filter,
  Download,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Percent,
  Truck,
  Eye,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Order, StoreMerchant, User } from '../../types';

interface MasterReportsViewProps {
  onOpenDossier: (target: { userId?: string; merchantId?: string }) => void;
}

export const MasterReportsView: React.FC<MasterReportsViewProps> = ({ onOpenDossier }) => {
  const {
    users,
    merchants,
    orders,
    products,
    services,
    auditLogs,
    triggerToast
  } = useApp();

  const [datePeriod, setDatePeriod] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all'>('today');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Count distinct categories of registrations
  const customersCount = useMemo(() => {
    return users.filter((u) => u.role === 'CLIENTE' || !u.role).length;
  }, [users]);

  const merchantsCount = useMemo(() => {
    return merchants.filter((m) => m.category !== 'Serviços & Profissionais').length;
  }, [merchants]);

  const serviceProvidersCount = useMemo(() => {
    return merchants.filter((m) => m.category === 'Serviços & Profissionais').length +
      users.filter((u) => u.role === 'VENDEDOR' && !merchants.some(m => m.id === u.merchantId)).length;
  }, [merchants, users]);

  // Date Filtering Calculation
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOf7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter((order) => {
      // Parse order creation date (fallback to true if date unparseable)
      let matchesDate = true;
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt);
        if (!isNaN(orderDate.getTime())) {
          if (datePeriod === 'today') {
            matchesDate = orderDate >= startOfToday;
          } else if (datePeriod === 'yesterday') {
            matchesDate = orderDate >= startOfYesterday && orderDate < startOfToday;
          } else if (datePeriod === '7days') {
            matchesDate = orderDate >= startOf7DaysAgo;
          } else if (datePeriod === 'month') {
            matchesDate = orderDate >= startOfMonth;
          }
        }
      }

      const matchesMerchant = selectedMerchantFilter === 'ALL' || order.merchantId === selectedMerchantFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        order.code.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.merchantName.toLowerCase().includes(q) ||
        (order.securityCode && order.securityCode.toLowerCase().includes(q));

      return matchesDate && matchesMerchant && matchesSearch;
    });
  }, [orders, datePeriod, selectedMerchantFilter, searchQuery]);

  // Financial Metrics Calculation
  const totalGMV = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'Cancelado' && o.status !== 'Sem Estoque')
      .reduce((acc, curr) => acc + (curr.totalAmount ?? (curr as any).total ?? 0), 0);
  }, [filteredOrders]);

  const totalCommissions = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'Cancelado' && o.status !== 'Sem Estoque')
      .reduce((acc, curr) => {
        const merchant = merchants.find((m) => m.id === curr.merchantId);
        const rate = merchant?.commissionRate ?? 10;
        const amount = curr.totalAmount ?? (curr as any).total ?? 0;
        return acc + (amount * (rate / 100));
      }, 0);
  }, [filteredOrders, merchants]);

  const netMerchantsPayout = totalGMV - totalCommissions;

  const completedOrdersCount = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'Concluído').length;
  }, [filteredOrders]);

  const activeReservationsCount = useMemo(() => {
    return filteredOrders.filter((o) => o.stockConfirmationStatus === 'STOCK_CONFIRMED' && o.status !== 'Concluído').length;
  }, [filteredOrders]);

  // Ranking by Merchant
  const merchantPerformance = useMemo(() => {
    const map = new Map<string, { merchant: StoreMerchant; orderCount: number; gmv: number; commission: number }>();

    merchants.forEach((m) => {
      map.set(m.id, { merchant: m, orderCount: 0, gmv: 0, commission: 0 });
    });

    filteredOrders.forEach((o) => {
      if (o.status !== 'Cancelado' && o.status !== 'Sem Estoque') {
        const val = o.totalAmount ?? (o as any).total ?? 0;
        const entry = map.get(o.merchantId);
        if (entry) {
          entry.orderCount += 1;
          entry.gmv += val;
          entry.commission += val * ((entry.merchant.commissionRate ?? 10) / 100);
        }
      }
    });

    return Array.from(map.values())
      .filter((item) => item.gmv > 0 || item.orderCount > 0)
      .sort((a, b) => b.gmv - a.gmv);
  }, [merchants, filteredOrders]);

  // Real-Time Audit Activity Feed
  const recentEvents = useMemo(() => {
    return auditLogs.slice(0, 15);
  }, [auditLogs]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'Codigo,Data,Cliente,Telefone,Estabelecimento,ValorBruto,ComissaoMaster,LiquidoLoja,Modalidade,Status\n';
    const rows = filteredOrders.map((o) => {
      const m = merchants.find((m) => m.id === o.merchantId);
      const rate = m?.commissionRate ?? 10;
      const total = o.totalAmount ?? (o as any).total ?? 0;
      const comm = total * (rate / 100);
      const net = total - comm;
      return `"${o.code}","${o.createdAt}","${o.customerName}","${o.customerPhone}","${o.merchantName}",${total.toFixed(2)},${comm.toFixed(2)},${net.toFixed(2)},"${o.modality}","${o.status}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vendas_acheiaqui_${datePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Relatório CSV exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & PERIOD FILTER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Relatórios Diários & Movimentações em Tempo Real
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhamento consolidado de vendas, comissões arrecadadas, reservas e movimentações no comércio de Cachoeiras de Macacu.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Period Selector Pills */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setDatePeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePeriod === 'today' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              Hoje (Ao Vivo)
            </button>
            <button
              type="button"
              onClick={() => setDatePeriod('yesterday')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePeriod === 'yesterday' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => setDatePeriod('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePeriod === '7days' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => setDatePeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePeriod === 'month' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => setDatePeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datePeriod === 'all' ? 'bg-white text-blue-700 shadow-xs font-black' : 'hover:text-slate-900'
              }`}
            >
              Todo o Período
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* REGISTRATION METRICS - QUANTIDADE DE CADASTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Clientes / Usuários */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Clientes Cadastrados
            </span>
            <div className="text-2xl font-black text-slate-900">
              {customersCount}
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Contas Ativas com Sigilo
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Lojistas / Comércio */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Lojistas & Comércios
            </span>
            <div className="text-2xl font-black text-slate-900">
              {merchantsCount}
            </div>
            <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
              <Store className="w-3 h-3" />
              {products.length} Produtos Cadastrados
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Prestadores de Serviços */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Prestadores de Serviços
            </span>
            <div className="text-2xl font-black text-slate-900">
              {serviceProvidersCount}
            </div>
            <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              {services.length} Serviços Ativos
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FINANCIAL METRICS - GMV, COMISSÕES, REPASSE E RESERVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="p-4 bg-linear-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Volume de Vendas (GMV)
          </span>
          <div className="text-2xl font-black text-white">
            {totalGMV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-[10px] text-blue-300 block">
            {filteredOrders.length} pedidos no período
          </span>
        </div>

        {/* Comissões do Master */}
        <div className="p-4 bg-linear-to-br from-purple-900 to-indigo-950 text-white rounded-2xl shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block">
            Comissões Arrecadadas (Master)
          </span>
          <div className="text-2xl font-black text-purple-200">
            {totalCommissions.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-[10px] text-purple-300 block">
            Receita líquida da plataforma
          </span>
        </div>

        {/* Repasse Líquido aos Lojistas */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Repasse Líquido aos Lojistas
          </span>
          <div className="text-2xl font-black text-emerald-800">
            {netMerchantsPayout.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-[10px] text-slate-500 block">
            Faturamento líquido dos parceiros
          </span>
        </div>

        {/* Reservas & Conclusões */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Pedidos Concluídos & Reservas
          </span>
          <div className="text-2xl font-black text-slate-900">
            {completedOrdersCount} <span className="text-xs font-normal text-slate-400">concluídos</span>
          </div>
          <span className="text-[10px] text-amber-700 font-bold block">
            {activeReservationsCount} reservas ativas de estoque
          </span>
        </div>
      </div>

      {/* DETAILED ORDERS & SALES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Extrato Completo de Vendas & Comissões
            </h3>
            <p className="text-xs text-slate-500">
              Clique na foto ou nome do cliente/lojista para inspecionar o Dossiê 360°.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por código, cliente ou loja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-600 w-56"
              />
            </div>

            <select
              value={selectedMerchantFilter}
              onChange={(e) => setSelectedMerchantFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none font-bold text-slate-700"
            >
              <option value="ALL">Todas as Lojas</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nenhuma venda registrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Estabelecimento</th>
                  <th className="px-4 py-3">Bruto</th>
                  <th className="px-4 py-3">Comissão Master</th>
                  <th className="px-4 py-3">Líquido Loja</th>
                  <th className="px-4 py-3">Modalidade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Dossiê</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const merchant = merchants.find((m) => m.id === order.merchantId);
                  const rate = merchant?.commissionRate ?? 10;
                  const total = order.totalAmount ?? (order as any).total ?? 0;
                  const comm = total * (rate / 100);
                  const net = total - comm;
                  const userMatch = users.find((u) => u.id === order.customerId || u.phone === order.customerPhone);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-black text-slate-900 block">{order.code}</span>
                        {order.securityCode && (
                          <span className="font-mono text-[10px] text-purple-700 font-bold">
                            Cód: {order.securityCode}
                          </span>
                        )}
                      </td>

                      {/* Cliente com foto clicável */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ userId: userMatch?.id || order.customerId })}
                          className="flex items-center space-x-2 text-left group cursor-pointer"
                        >
                          <img
                            src={userMatch?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                            alt={order.customerName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                          />
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 block transition-colors">
                              {order.customerName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</span>
                          </div>
                        </button>
                      </td>

                      {/* Loja com foto clicável */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ merchantId: order.merchantId })}
                          className="flex items-center space-x-2 text-left group cursor-pointer"
                        >
                          <img
                            src={merchant?.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80'}
                            alt={order.merchantName}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                          />
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-emerald-700 block transition-colors">
                              {order.merchantName}
                            </span>
                            <span className="text-[10px] text-slate-400">{merchant?.category || 'Comércio'}</span>
                          </div>
                        </button>
                      </td>

                      <td className="px-4 py-3 font-black text-slate-900">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-purple-700 block">
                          {comm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">({rate}%)</span>
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-800">
                        {net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {order.modality}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'Concluído'
                            ? 'bg-emerald-50 text-emerald-800'
                            : order.status === 'Cancelado'
                            ? 'bg-red-50 text-red-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDossier({ userId: userMatch?.id || order.customerId, merchantId: order.merchantId })}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Abrir Dossiê 360°"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RANKING DOS ESTABELECIMENTOS & FEED DE EVENTOS EM TEMPO REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Performance por Estabelecimento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Faturamento & Comissões por Estabelecimento</span>
          </h3>

          {merchantPerformance.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma venda computada para os estabelecimentos no período.
            </div>
          ) : (
            <div className="space-y-2">
              {merchantPerformance.map((item) => (
                <div
                  key={item.merchant.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onOpenDossier({ merchantId: item.merchant.id })}
                    className="flex items-center space-x-3 text-left group cursor-pointer"
                  >
                    <img
                      src={item.merchant.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80'}
                      alt={item.merchant.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                    />
                    <div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 text-xs block transition-colors">
                        {item.merchant.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.orderCount} vendas • Taxa: {item.merchant.commissionRate ?? 10}%
                      </span>
                    </div>
                  </button>

                  <div className="text-right">
                    <span className="font-black text-slate-900 text-xs block">
                      {item.gmv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-purple-700 font-bold">
                      Comissão: {item.commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transmissão de Manifestações & Eventos ao Vivo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Manifestações & Eventos em Tempo Real</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
              Feed Master Ativo
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {recentEvents.map((log) => (
              <div
                key={log.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{log.details}</p>
                <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-mono">
                  <span>Usuário: {log.userEmail}</span>
                  <span>•</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
