import React, { useState, useMemo } from 'react';
import { SvgBarChart, SvgPieChart, SvgAreaChart } from '../common/SvgCharts';
import {
  TrendingUp,
  BarChart3,
  DollarSign,
  Target,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Filter,
  Layers,
  ArrowUpRight,
  Sparkles,
  Briefcase,
  Store,
  ChevronRight,
  ShieldCheck,
  Building2,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SalesAgent, BoletoBillingRequest, AgentRegisteredClient, CommercialGoal } from '../../types';

interface CommercialDataVizViewProps {
  onNavigateToTab?: (tab: 'organogram' | 'hierarchy' | 'agents' | 'boletos' | 'clients' | 'goals') => void;
  onOpenCommissionModal?: (agent: SalesAgent) => void;
}

export const CommercialDataVizView: React.FC<CommercialDataVizViewProps> = ({
  onNavigateToTab,
  onOpenCommissionModal
}) => {
  const {
    salesAgents,
    boletoRequests,
    registeredClientsByAgents,
    commercialGoals,
    commercialAreas
  } = useApp();

  // Filters
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('ALL');
  const [metricViewMode, setMetricViewMode] = useState<'REVENUE' | 'ACTIVATIONS'>('REVENUE');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'CURRENT_MONTH' | 'LAST_3_MONTHS'>('ALL');

  // Supervisors and Coordinators who lead teams
  const supervisors = useMemo(() => {
    return salesAgents.filter(
      (a) =>
        a.roleLevel === 'COORDENADOR_REGIONAL' ||
        a.roleLevel === 'SUPERVISOR_VENDAS' ||
        (a.roleLevel as string) === 'COORDENADOR' ||
        (a.roleLevel as string) === 'SUPERVISOR'
    );
  }, [salesAgents]);

  // Filtered agents based on chosen supervisor
  const filteredAgents = useMemo(() => {
    if (selectedSupervisorId === 'ALL') {
      return salesAgents;
    }
    if (selectedSupervisorId === 'DIRECT_MASTER') {
      // Agents that have no supervisor or report directly to master
      return salesAgents.filter((a) => !a.supervisorId);
    }
    // Supervisor itself + all subordinates
    return salesAgents.filter(
      (a) => a.id === selectedSupervisorId || a.supervisorId === selectedSupervisorId
    );
  }, [salesAgents, selectedSupervisorId]);

  const filteredAgentIds = useMemo(() => {
    return new Set(filteredAgents.map((a) => a.id));
  }, [filteredAgents]);

  // Filtered boletos based on the filtered agents
  const filteredBoletos = useMemo(() => {
    return boletoRequests.filter((b) => filteredAgentIds.has(b.agentId));
  }, [boletoRequests, filteredAgentIds]);

  // Filtered clients based on the filtered agents
  const filteredClients = useMemo(() => {
    return registeredClientsByAgents.filter((c) => filteredAgentIds.has(c.agentId));
  }, [registeredClientsByAgents, filteredAgentIds]);

  // -------------------------------------------------------------
  // KPI CALCULATIONS FOR THE SELECTED SCOPE
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    // Total gross sales from paid boletos
    const paidBoletos = filteredBoletos.filter((b) => b.status === 'PAGAMENTO_CONFIRMADO');
    const totalRevenue = paidBoletos.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Potential / Pending revenue
    const pendingBoletos = filteredBoletos.filter((b) => b.status !== 'PAGAMENTO_CONFIRMADO' && b.status !== 'CANCELADO');
    const pendingRevenue = pendingBoletos.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Commissions breakdown
    const commissionsPaid = filteredBoletos
      .filter((b) => b.commissionStatus === 'PAGA')
      .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

    const commissionsReleased = filteredBoletos
      .filter((b) => b.commissionStatus === 'LIBERADA')
      .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

    const commissionsPending = filteredBoletos
      .filter((b) => b.commissionStatus === 'PENDENTE' && b.status !== 'CANCELADO')
      .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

    const totalCommissions = commissionsPaid + commissionsReleased + commissionsPending;

    // Total targets vs actual activations
    const targetActivationsTotal = filteredAgents.reduce(
      (sum, a) => sum + (a.monthlyTargetCount || 0),
      0
    );
    const targetRevenueTotal = filteredAgents.reduce(
      (sum, a) => sum + (a.monthlyTargetRevenue || 0),
      0
    );

    const actualActivationsCount = filteredClients.length;
    const goalAchievementPercent =
      targetActivationsTotal > 0
        ? Math.round((actualActivationsCount / targetActivationsTotal) * 100)
        : 0;

    const revenueAchievementPercent =
      targetRevenueTotal > 0 ? Math.round((totalRevenue / targetRevenueTotal) * 100) : 0;

    return {
      totalRevenue,
      pendingRevenue,
      totalCommissions,
      commissionsPaid,
      commissionsReleased,
      commissionsPending,
      targetActivationsTotal,
      targetRevenueTotal,
      actualActivationsCount,
      goalAchievementPercent,
      revenueAchievementPercent,
      activeAgentsCount: filteredAgents.length
    };
  }, [filteredBoletos, filteredClients, filteredAgents]);

  // -------------------------------------------------------------
  // CHART 1: DESEMPENHO POR VENDEDOR (VENDAS & ATIVAÇÕES)
  // -------------------------------------------------------------
  const salesPerformanceData = useMemo(() => {
    return filteredAgents.map((agent) => {
      const agentBoletos = filteredBoletos.filter((b) => b.agentId === agent.id);
      const paidBoletos = agentBoletos.filter((b) => b.status === 'PAGAMENTO_CONFIRMADO');
      const revenue = paidBoletos.reduce((sum, b) => sum + (b.amount || 0), 0);
      const pendingRevenue = agentBoletos
        .filter((b) => b.status !== 'PAGAMENTO_CONFIRMADO' && b.status !== 'CANCELADO')
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      const clientsCount = filteredClients.filter((c) => c.agentId === agent.id).length;
      const targetCount = agent.monthlyTargetCount || 10;
      const targetRevenue = agent.monthlyTargetRevenue || 1500;

      const firstName = agent.name.split(' ')[0] + ' ' + (agent.name.split(' ')[1] || '');

      return {
        id: agent.id,
        name: firstName,
        fullName: agent.name,
        roleTitle: agent.roleTitle,
        region: agent.assignedRegion,
        revenue: Number(revenue.toFixed(2)),
        pendingRevenue: Number(pendingRevenue.toFixed(2)),
        totalPotential: Number((revenue + pendingRevenue).toFixed(2)),
        clientsCount,
        targetCount,
        targetRevenue,
        ratePercent: agent.commissionRatePercent
      };
    });
  }, [filteredAgents, filteredBoletos, filteredClients]);

  // -------------------------------------------------------------
  // CHART 2: COMISSÕES GERADAS POR VENDEDOR (Pagas vs Liberadas vs Pendentes)
  // -------------------------------------------------------------
  const commissionsByAgentData = useMemo(() => {
    return filteredAgents.map((agent) => {
      const agentBoletos = filteredBoletos.filter((b) => b.agentId === agent.id);

      const pagas = agentBoletos
        .filter((b) => b.commissionStatus === 'PAGA')
        .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

      const liberadas = agentBoletos
        .filter((b) => b.commissionStatus === 'LIBERADA')
        .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

      const pendentes = agentBoletos
        .filter((b) => b.commissionStatus === 'PENDENTE' && b.status !== 'CANCELADO')
        .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

      const total = pagas + liberadas + pendentes;
      const firstName = agent.name.split(' ')[0] + ' ' + (agent.name.split(' ')[1] || '');

      return {
        name: firstName,
        fullName: agent.name,
        role: agent.roleLevel,
        comissaoPaga: Number(pagas.toFixed(2)),
        comissaoLiberada: Number(liberadas.toFixed(2)),
        comissaoPendente: Number(pendentes.toFixed(2)),
        totalComissao: Number(total.toFixed(2)),
        taxaPercent: agent.commissionRatePercent
      };
    });
  }, [filteredAgents, filteredBoletos]);

  // -------------------------------------------------------------
  // CHART 3: META ALCANÇADA (TARGET VS REALIZADO)
  // -------------------------------------------------------------
  const goalsAchievementData = useMemo(() => {
    return filteredAgents.map((agent) => {
      const actualCount = filteredClients.filter((c) => c.agentId === agent.id).length;
      const targetCount = agent.monthlyTargetCount || 10;
      const percent = targetCount > 0 ? Math.round((actualCount / targetCount) * 100) : 0;

      const agentBoletos = filteredBoletos.filter(
        (b) => b.agentId === agent.id && b.status === 'PAGAMENTO_CONFIRMADO'
      );
      const actualRevenue = agentBoletos.reduce((sum, b) => sum + (b.amount || 0), 0);
      const targetRevenue = agent.monthlyTargetRevenue || 1500;
      const revenuePercent = targetRevenue > 0 ? Math.round((actualRevenue / targetRevenue) * 100) : 0;

      const firstName = agent.name.split(' ')[0] + ' ' + (agent.name.split(' ')[1] || '');

      return {
        name: firstName,
        fullName: agent.name,
        realizadoLojas: actualCount,
        metaLojas: targetCount,
        percentualLojas: percent,
        realizadoReceita: Number(actualRevenue.toFixed(2)),
        metaReceita: targetRevenue,
        percentualReceita: revenuePercent,
        status: percent >= 100 ? 'BATIDA' : percent >= 70 ? 'EM_RITMO' : 'ATENCAO'
      };
    });
  }, [filteredAgents, filteredClients, filteredBoletos]);

  // -------------------------------------------------------------
  // CHART 4: DISTRIBUIÇÃO POR TIPO DE CLIENTE E PLANO
  // -------------------------------------------------------------
  const clientTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      LOJISTA: 0,
      PRESTADOR: 0,
      USUARIO_VIP: 0
    };

    filteredClients.forEach((c) => {
      if (c.clientType === 'LOJISTA') counts.LOJISTA += 1;
      else if (c.clientType === 'PRESTADOR') counts.PRESTADOR += 1;
      else counts.USUARIO_VIP += 1;
    });

    return [
      { name: 'Comércio / Lojas', value: counts.LOJISTA, color: '#3B82F6' },
      { name: 'Prestadores de Serviços', value: counts.PRESTADOR, color: '#10B981' },
      { name: 'Assinantes VIP', value: counts.USUARIO_VIP, color: '#8B5CF6' }
    ].filter((item) => item.value > 0);
  }, [filteredClients]);

  // Plan Distribution
  const planDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      BRONZE: 0,
      PRATA: 0,
      OURO: 0,
      PREMIUM: 0,
      GRATIS: 0
    };

    filteredClients.forEach((c) => {
      if (counts[c.chosenPlan] !== undefined) {
        counts[c.chosenPlan] += 1;
      }
    });

    const colors: Record<string, string> = {
      BRONZE: '#CD7F32',
      PRATA: '#94A3B8',
      OURO: '#F59E0B',
      PREMIUM: '#3B82F6',
      GRATIS: '#10B981'
    };

    return Object.entries(counts)
      .filter(([_, val]) => val > 0)
      .map(([plan, val]) => ({
        name: `Plano ${plan}`,
        value: val,
        color: colors[plan] || '#64748B'
      }));
  }, [filteredClients]);

  // -------------------------------------------------------------
  // CHART 5: EVOLUÇÃO TEMPORAL MENSAL (SIMULADA / HISTÓRICA)
  // -------------------------------------------------------------
  const temporalTrendData = useMemo(() => {
    // Aggregation of 2026 timeline
    return [
      { mes: 'Jan/26', vendas: 4, receita: 380, comissoes: 68 },
      { mes: 'Fev/26', vendas: 9, receita: 820, comissoes: 145 },
      { mes: 'Mar/26', vendas: 14, receita: 1490, comissoes: 278 },
      { mes: 'Abr/26', vendas: 18, receita: 2150, comissoes: 395 },
      { mes: 'Mai/26', vendas: 22, receita: 2840, comissoes: 512 },
      { mes: 'Jun/26', vendas: 27, receita: 3490, comissoes: 630 }
    ];
  }, []);

  // Supervisor name for badge
  const activeSupervisorObj = useMemo(() => {
    if (selectedSupervisorId === 'ALL') return null;
    return salesAgents.find((a) => a.id === selectedSupervisorId);
  }, [salesAgents, selectedSupervisorId]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER & BARRA DE FILTROS INTELIGENTES */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200/60">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span>Data Visualization Comercial & Metas</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Recharts Analytics
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Desempenho analítico consolidado, comissões geradas e atingimento de metas da força de vendas.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLES DE FILTRAGEM (SUPERVISOR & MÉTRICA) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SELETOR DE SUPERVISOR */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Filtrar por Supervisor:</span>
            <select
              id="select-supervisor-filter"
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Todos os Supervisores & Equipes ({salesAgents.length} consultores)</option>
              {supervisors.map((sup) => {
                const teamCount = salesAgents.filter(
                  (a) => a.id === sup.id || a.supervisorId === sup.id
                ).length;
                return (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.roleTitle.split(' ')[0]} - {teamCount} no time)
                  </option>
                );
              })}
              <option value="DIRECT_MASTER">Reporte Direto ao Master (Sem Supervisor)</option>
            </select>
          </div>

          {/* TOGGLE MÉTRICA: FATURAMENTO R$ VS ATIVAÇÕES */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              id="btn-metric-revenue"
              onClick={() => setMetricViewMode('REVENUE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                metricViewMode === 'REVENUE'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Receita (R$)</span>
            </button>
            <button
              id="btn-metric-activations"
              onClick={() => setMetricViewMode('ACTIVATIONS')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                metricViewMode === 'ACTIVATIONS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Ativações (Lojas)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BANNER INFORMATIVO DO FILTRO ATIVO */}
      {selectedSupervisorId !== 'ALL' && (
        <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-blue-900">
              Exibindo métricas do esquadrão liderado por{' '}
              <strong className="text-blue-950 font-extrabold">
                {activeSupervisorObj?.name || 'Subordinação Direta Master'}
              </strong>
              {activeSupervisorObj?.assignedRegion ? ` (Área: ${activeSupervisorObj.assignedRegion})` : ''} •{' '}
              <span className="font-semibold">{filteredAgents.length} consultores analisados</span>.
            </span>
          </div>
          <button
            onClick={() => setSelectedSupervisorId('ALL')}
            className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
          >
            Limpar Filtro e Ver Toda a Rede
          </button>
        </div>
      )}

      {/* 3. CARDS DE KPIS CONSOLIDADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Confirmado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Faturamento Confirmado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            R$ {kpis.totalRevenue.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Pendente/Emissão:</span>
            <span className="font-bold text-amber-700">R$ {kpis.pendingRevenue.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Comissões Geradas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Comissões Geradas</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            R$ {kpis.totalCommissions.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="text-emerald-700 font-bold">R$ {kpis.commissionsPaid.toFixed(2)} pagas</span>
            <span className="text-blue-700 font-bold">R$ {kpis.commissionsReleased.toFixed(2)} liberadas</span>
          </div>
        </div>

        {/* Card 3: Ativações / Contratos Realizados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Ativações Realizadas</span>
            <Store className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{kpis.actualActivationsCount}</span>
            <span className="text-xs text-slate-400 font-medium">de {kpis.targetActivationsTotal} meta</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                kpis.goalAchievementPercent >= 100
                  ? 'bg-emerald-500'
                  : kpis.goalAchievementPercent >= 70
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(kpis.goalAchievementPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Taxa de Atingimento de Meta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Atingimento da Meta</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-2xl font-black ${
                kpis.goalAchievementPercent >= 100
                  ? 'text-emerald-700'
                  : kpis.goalAchievementPercent >= 70
                  ? 'text-blue-700'
                  : 'text-amber-700'
              }`}
            >
              {kpis.goalAchievementPercent}%
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {kpis.goalAchievementPercent >= 100
                ? 'Superada'
                : kpis.goalAchievementPercent >= 70
                ? 'No Ritmo'
                : 'Atenção'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Meta Financeira:</span>
            <span className="font-bold text-slate-700">{kpis.revenueAchievementPercent}% atingida</span>
          </div>
        </div>
      </div>

      {/* 4. BLOCO PRINCIPAL DE GRÁFICOS: DESEMPENHO E COMISSÕES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: DESEMPENHO DE VENDAS POR VENDEDOR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <span>Desempenho Comercial por Vendedor</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                  {metricViewMode === 'REVENUE' ? 'Receita R$' : 'Lojas Ativadas'}
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparativo de resultados individuais da equipe selecionada.
              </p>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('agents')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Equipe</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full pt-2">
            {metricViewMode === 'REVENUE' ? (
              <SvgBarChart
                data={salesPerformanceData}
                xKey="name"
                height={280}
                series={[
                  { key: 'revenue', name: 'Receita Paga (R$)', color: '#3B82F6' },
                  { key: 'pendingRevenue', name: 'Receita Pendente (R$)', color: '#93C5FD' }
                ]}
                yFormatter={(val) => `R$${val}`}
                tooltipFormatter={(val, key) => `R$ ${Number(val).toFixed(2)}`}
                labelFormatter={(item) => (item ? `${item.fullName} (${item.region})` : '')}
              />
            ) : (
              <SvgBarChart
                data={salesPerformanceData}
                xKey="name"
                height={280}
                series={[
                  { key: 'clientsCount', name: 'Lojas Ativadas', color: '#10B981' },
                  { key: 'targetCount', name: 'Meta Estabelecida', color: '#CBD5E1' }
                ]}
                yFormatter={(val) => `${val} lojas`}
                tooltipFormatter={(val, key) => `${val} lojas (${key === 'clientsCount' ? 'Realizado' : 'Meta'})`}
                labelFormatter={(item) => (item ? `${item.fullName} (${item.region})` : '')}
              />
            )}
          </div>
        </div>

        {/* GRÁFICO 2: COMISSÕES GERADAS POR VENDEDOR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <span>Comissões Geradas por Vendedor</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  Repasses Pix
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores pagos, liberados aguardando repasse e pendentes de liquidação.
              </p>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('boletos')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Gestão de Boletos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full pt-2">
            <SvgBarChart
              data={commissionsByAgentData}
              xKey="name"
              height={280}
              series={[
                { key: 'comissaoPaga', name: 'Paga (Pix)', color: '#10B981' },
                { key: 'comissaoLiberada', name: 'Liberada', color: '#3B82F6' },
                { key: 'comissaoPendente', name: 'Pendente', color: '#F59E0B' }
              ]}
              yFormatter={(val) => `R$${val}`}
              tooltipFormatter={(val, key) =>
                `R$ ${Number(val).toFixed(2)} (${
                  key === 'comissaoPaga' ? 'Paga via Pix' : key === 'comissaoLiberada' ? 'Liberada (A Pagar)' : 'Pendente'
                })`
              }
              labelFormatter={(item) => (item ? `${item.fullName} (Taxa: ${item.taxaPercent}%)` : '')}
            />
          </div>
        </div>
      </div>

      {/* 5. SEGUNDA LINHA: META ALCANÇADA (% REALIZADO) & EVOLUÇÃO TEMPORAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO 3: METAS ALCANÇADAS (COMPARATIVO REALIZADO VS META) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
                <span>Atingimento de Metas Individuais (Realizado vs Meta)</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                  Mês Atual
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Percentual de cumprimento da meta de ativação de lojistas e prestadores.
              </p>
            </div>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('goals')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Metas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* LISTAGEM DETALHADA COM BARRA DE PROGRESSO */}
          <div className="space-y-3.5">
            {goalsAchievementData.map((agentGoal) => (
              <div
                key={agentGoal.name}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{agentGoal.fullName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        agentGoal.status === 'BATIDA'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : agentGoal.status === 'EM_RITMO'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {agentGoal.percentualLojas}% Concluído
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900">{agentGoal.realizadoLojas}</span>
                    <span className="text-slate-400 font-normal"> / {agentGoal.metaLojas} lojas</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="font-bold text-blue-700">
                      R$ {agentGoal.realizadoReceita.toFixed(2)}
                    </span>
                    <span className="text-slate-400 font-normal">
                      {' '}
                      / R$ {agentGoal.metaReceita.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      agentGoal.status === 'BATIDA'
                        ? 'bg-emerald-500'
                        : agentGoal.status === 'EM_RITMO'
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(agentGoal.percentualLojas, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* GRÁFICO DE SUPORTE - METAS */}
          <div className="w-full pt-2">
            <SvgBarChart
              data={goalsAchievementData}
              xKey="name"
              height={220}
              series={[
                { key: 'percentualLojas', name: 'Atingimento (%)', color: '#6366F1' }
              ]}
              yFormatter={(val) => `${val}%`}
              tooltipFormatter={(val) => `${val}% de Atingimento da Meta`}
            />
          </div>
        </div>

        {/* GRÁFICO 4: DISTRIBUIÇÃO DE CLIENTES POR TIPO (PIE CHART) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <span>Segmentação de Cadastros</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                {filteredClients.length} totais
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Divisão entre comércios, profissionais liberais e assinantes.
            </p>
          </div>

          <div className="w-full flex items-center justify-center py-2">
            {clientTypeDistribution.length > 0 ? (
              <SvgPieChart
                data={clientTypeDistribution}
                size={190}
                innerRadius={45}
                outerRadius={75}
              />
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs font-medium">
                Nenhum cliente cadastrado neste escopo.
              </div>
            )}
          </div>

          {/* PLANOS BREAKDOWN PILLS */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Planos Mais Vendidos
            </span>
            <div className="flex flex-wrap gap-1.5">
              {planDistribution.map((p) => (
                <span
                  key={p.name}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}:</span>
                  <strong className="text-slate-900">{p.value}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. EVOLUÇÃO TEMPORAL GERAL & PROJEÇÃO DE CRESCIMENTO */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <span>Curva de Evolução Temporal & Tendência de Vendas (2026)</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                Histórico Consolidado
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume financeiro transacionado (R$) e novas ativações comerciais ao longo dos meses.
            </p>
          </div>
        </div>

        <div className="w-full pt-2">
          <SvgAreaChart
            data={temporalTrendData}
            xKey="mes"
            height={260}
            series={[
              { key: 'receita', name: 'Faturamento Bruto (R$)', color: '#3B82F6' },
              { key: 'comissoes', name: 'Comissões Equipe (R$)', color: '#10B981' }
            ]}
            yFormatter={(val) => `R$${val}`}
            tooltipFormatter={(val, key) =>
              `R$ ${Number(val).toFixed(2)} (${key === 'receita' ? 'Faturamento Total' : 'Comissões Repassadas'})`
            }
          />
        </div>
      </div>

      {/* 7. TABELA ANALÍTICA DE DESEMPENHO INDIVIDUAL DETALHADO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
              Matriz Analítica de Performance & Repasses
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Detalhamento de cada vendedor do esquadrão com metas e status de comissão.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg">
            {filteredAgents.length} consultores no filtro
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Vendedor & Cargo</th>
                <th className="px-4 py-3">Supervisor Direto</th>
                <th className="px-4 py-3">Área de Atuação</th>
                <th className="px-4 py-3 text-center">Ativações / Meta</th>
                <th className="px-4 py-3 text-center">% Meta</th>
                <th className="px-4 py-3 text-right">Faturamento</th>
                <th className="px-4 py-3 text-right">Comissões (R$)</th>
                <th className="px-4 py-3 text-center">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.map((agent) => {
                const agentClients = filteredClients.filter((c) => c.agentId === agent.id).length;
                const agentBoletos = filteredBoletos.filter((b) => b.agentId === agent.id);
                const paidBoletos = agentBoletos.filter((b) => b.status === 'PAGAMENTO_CONFIRMADO');
                const revenue = paidBoletos.reduce((sum, b) => sum + (b.amount || 0), 0);

                const comPaid = agentBoletos
                  .filter((b) => b.commissionStatus === 'PAGA')
                  .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
                const comReleased = agentBoletos
                  .filter((b) => b.commissionStatus === 'LIBERADA')
                  .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

                const percent = agent.monthlyTargetCount > 0
                  ? Math.round((agentClients / agent.monthlyTargetCount) * 100)
                  : 0;

                return (
                  <tr key={agent.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={agent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={agent.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{agent.name}</div>
                          <div className="text-[10px] text-slate-500">{agent.roleTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700 font-medium">
                        {agent.supervisorName || (
                          <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md text-[10px]">
                            Direto ao Master
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {agent.assignedRegion}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-900">{agentClients}</span>
                      <span className="text-slate-400"> / {agent.monthlyTargetCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          percent >= 100
                            ? 'bg-emerald-100 text-emerald-800'
                            : percent >= 70
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {percent}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      R$ {revenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-emerald-700">R$ {comPaid.toFixed(2)} pagas</div>
                      {comReleased > 0 && (
                        <div className="text-[10px] text-blue-700 font-semibold">
                          + R$ {comReleased.toFixed(2)} liberadas
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {onOpenCommissionModal && (
                        <button
                          onClick={() => onOpenCommissionModal(agent)}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Ajustar Taxa ({agent.commissionRatePercent}%)
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
