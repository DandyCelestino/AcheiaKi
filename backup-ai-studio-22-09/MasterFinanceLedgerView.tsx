import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BoletoBillingRequest, MembershipTier } from '../../types';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Store,
  Wrench,
  Percent,
  Download,
  Eye,
  Calendar,
  UserCheck,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  Building2,
  Receipt
} from 'lucide-react';

export const MasterFinanceLedgerView: React.FC = () => {
  const {
    boletoRequests,
    merchants,
    salesAgents,
    confirmBoletoPaymentAndReleaseCommission,
    cancelBoletoRequest,
    triggerToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LOJISTA' | 'PRESTADOR'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAGAMENTO_CONFIRMADO' | 'PENDENTE' | 'CANCELADO'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<BoletoBillingRequest | null>(null);

  // Filtered entries
  const filteredRecords = useMemo(() => {
    return boletoRequests.filter((item) => {
      const matchesSearch =
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.neighborhood || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.agentName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'PRESTADOR' && item.clientType === 'PRESTADOR') ||
        (filterType === 'LOJISTA' && item.clientType !== 'PRESTADOR');

      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'PAGAMENTO_CONFIRMADO' && item.status === 'PAGAMENTO_CONFIRMADO') ||
        (filterStatus === 'CANCELADO' && item.status === 'CANCELADO') ||
        (filterStatus === 'PENDENTE' && item.status !== 'PAGAMENTO_CONFIRMADO' && item.status !== 'CANCELADO');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [boletoRequests, searchTerm, filterType, filterStatus]);

  // Aggregated KPIs
  const totalRevenue = useMemo(() => {
    return boletoRequests
      .filter((b) => b.status === 'PAGAMENTO_CONFIRMADO')
      .reduce((sum, b) => sum + b.amount, 0);
  }, [boletoRequests]);

  const totalCommissions = useMemo(() => {
    return boletoRequests
      .filter((b) => b.status === 'PAGAMENTO_CONFIRMADO')
      .reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [boletoRequests]);

  const totalPlatformNet = useMemo(() => {
    return totalRevenue - totalCommissions;
  }, [totalRevenue, totalCommissions]);

  const activePlansCount = useMemo(() => {
    return boletoRequests.filter((b) => b.status === 'PAGAMENTO_CONFIRMADO').length;
  }, [boletoRequests]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getPlanBadge = (tier: MembershipTier) => {
    switch (tier) {
      case 'PREMIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300">DIAMANTE / VIP</span>;
      case 'OURO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-900 border border-yellow-300">OURO</span>;
      case 'PRATA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-800 border border-slate-300">PRATA</span>;
      case 'BRONZE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">BRONZE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">GRÁTIS / START</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-sm border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full uppercase tracking-wider">
                Auditoria Financeira Master
              </span>
              <span className="text-xs text-slate-400">• Divisões Automatizadas</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-400" />
              Painel Financeiro — Entradas de Planos & Divisões
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Registro contábil de todas as mensalidades e adesões de Lojistas e Prestadores de Serviços em Cachoeiras de Macacu, com discriminação automática de taxa da plataforma, comissão de vendedores e status de liberação do painel.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerToast('Relatório contábil gerado com sucesso!')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-600 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Exportar CSV / Contábil
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Faturado em Planos
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {activePlansCount} adesões liquidadas
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Taxa Líquida da Plataforma
            </div>
            <div className="text-2xl font-black text-indigo-900 mt-1">
              {formatCurrency(totalPlatformNet)}
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
              Receita retida da plataforma
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Comissões de Vendedores
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {formatCurrency(totalCommissions)}
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">
              Repasses da força comercial
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assinaturas Ativas
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {activePlansCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Com acesso regular ao painel
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-finance-ledger"
            type="text"
            placeholder="Buscar por parceiro, CPF/CNPJ, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('LOJISTA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'LOJISTA' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lojistas
            </button>
            <button
              onClick={() => setFilterType('PRESTADOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterType === 'PRESTADOR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prestadores
            </button>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Status: Todos
            </button>
            <button
              onClick={() => setFilterStatus('PAGAMENTO_CONFIRMADO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'PAGAMENTO_CONFIRMADO'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmados
            </button>
            <button
              onClick={() => setFilterStatus('PENDENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'PENDENTE'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Quem Pagou (Parceiro)</th>
                <th className="py-3.5 px-4">Quando Pagou</th>
                <th className="py-3.5 px-4">Forma</th>
                <th className="py-3.5 px-4">Plano Contratado</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4">Divisão dos Valores</th>
                <th className="py-3.5 px-4 text-center">Status da Liberação</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-600">Nenhum registro financeiro encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ajuste os filtros ou aguarde novas entradas de planos de lojistas e prestadores.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isPaid = item.status === 'PAGAMENTO_CONFIRMADO';
                  const isCanceled = item.status === 'CANCELADO';
                  const isService = item.clientType === 'PRESTADOR';
                  const platformShare = Math.max(0, item.amount - item.commissionAmount);

                  // Detect payment method
                  const paymentMethodDisplay = item.masterNotes?.toLowerCase().includes('pix')
                    ? 'PIX Asaas'
                    : item.masterNotes?.toLowerCase().includes('cart')
                    ? 'Cartão'
                    : 'Boleto Bancário';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPaid ? 'bg-emerald-50/15' : isCanceled ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Quem Pagou */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isService ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isService ? <Wrench className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <span>{item.clientName}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                                {isService ? 'Prestador' : 'Lojista'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Doc: {item.documentNumber} • {item.neighborhood || 'Cachoeiras de Macacu'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Cód: {item.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Quando Pagou */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(item.paidAt || item.requestedAt)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.paidAt ? 'Confirmado' : 'Aguardando quitação'}
                        </div>
                      </td>

                      {/* Forma de Pagamento */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                          {paymentMethodDisplay}
                        </span>
                      </td>

                      {/* Plano Contratado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getPlanBadge(item.chosenPlan)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Ciclo: {item.billingFrequency || 'MENSAL'}
                        </div>
                      </td>

                      {/* Valor Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900">
                          {formatCurrency(item.amount)}
                        </div>
                      </td>

                      {/* Divisão dos Valores */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 min-w-[200px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-indigo-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-indigo-600" /> Taxa Plataforma:
                            </span>
                            <span className="font-black text-indigo-900">
                              {formatCurrency(platformShare)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-amber-800 font-medium flex items-center gap-1">
                              <Percent className="w-3 h-3 text-amber-600" /> Comissão ({item.agentName || 'Direta'}):
                            </span>
                            <span className="font-bold text-amber-900">
                              {formatCurrency(item.commissionAmount)} ({item.commissionRatePercent}%)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status da Liberação */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ACESSO LIBERADO
                          </span>
                        ) : isCanceled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            CANCELADO / BLOQUEADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            PAINEL BLOQUEADO (AGUARDANDO)
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Ver Dossiê Financeiro Completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isPaid && !isCanceled && (
                            <button
                              onClick={() => {
                                confirmBoletoPaymentAndReleaseCommission(
                                  item.id,
                                  'Liberação forçada de acesso confirmada diretamente pelo Master Supremo.'
                                );
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                              title="Liberar Acesso Imediatamente"
                            >
                              <Unlock className="w-3 h-3" />
                              Liberar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes da Entrada Financeira */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Comprovante de Entrada Contábil</h3>
                  <p className="text-xs text-slate-500">Cód: {selectedRecord.code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Estabelecimento / Prestador:</span>
                <span className="font-bold text-slate-900">{selectedRecord.clientName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">CPF ou CNPJ:</span>
                <span className="font-mono text-slate-900">{selectedRecord.documentNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Tipo:</span>
                <span className="font-bold text-slate-900">
                  {selectedRecord.clientType === 'PRESTADOR' ? 'Prestador de Serviços' : 'Lojista Comercial'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Plano Contratado:</span>
                <div>{getPlanBadge(selectedRecord.chosenPlan)}</div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Data e Hora do Pagamento:</span>
                <span className="font-medium text-slate-900">{formatDate(selectedRecord.paidAt || selectedRecord.requestedAt)}</span>
              </div>
            </div>

            {/* Split Breakdown Card */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center justify-between">
                <span>Discriminação do Repasse</span>
                <span className="text-sm font-black text-emerald-900">{formatCurrency(selectedRecord.amount)}</span>
              </div>
              <div className="h-px bg-emerald-200" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-800">Taxa Retida pela Plataforma:</span>
                <span className="font-black text-emerald-950">
                  {formatCurrency(Math.max(0, selectedRecord.amount - selectedRecord.commissionAmount))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-800">Comissão do Vendedor ({selectedRecord.agentName || 'Direta'}):</span>
                <span className="font-black text-amber-950">
                  {formatCurrency(selectedRecord.commissionAmount)} ({selectedRecord.commissionRatePercent}%)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Chave Pix do Vendedor:</span>
                <span className="font-mono text-slate-700 text-[11px]">{selectedRecord.agentPixKey}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-100 p-3 rounded-xl">
              <strong>Nota da Auditoria:</strong> {selectedRecord.masterNotes || 'Pagamento confirmado e registrado no livro contábil da plataforma.'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
