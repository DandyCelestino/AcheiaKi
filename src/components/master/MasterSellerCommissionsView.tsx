import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SalesAgent } from '../../types';
import {
  Percent,
  ShieldCheck,
  Search,
  Save,
  CheckCircle2,
  Users,
  Building2,
  AlertCircle,
  Sparkles,
  Calculator,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

export const MasterSellerCommissionsView: React.FC = () => {
  const {
    currentUser,
    salesAgents,
    setSalesAgentCommission,
    addAuditLog,
    triggerToast
  } = useApp();

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Local draft state for rates and bonuses per agent
  const [draftRates, setDraftRates] = useState<Record<string, { rate: number; bonus: number }>>(() => {
    const initial: Record<string, { rate: number; bonus: number }> = {};
    salesAgents.forEach((agent) => {
      initial[agent.id] = {
        rate: agent.commissionRatePercent ?? 5,
        bonus: agent.commissionBonusPerActivation ?? 0
      };
    });
    return initial;
  });

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  // Mass rate state
  const [massRate, setMassRate] = useState<number>(5);
  const [massBonus, setMassBonus] = useState<number>(0);

  // Security barrier: only Master role can access
  if (currentUser?.role !== 'MASTER') {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 shadow-sm max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Acesso Exclusivo ao Administrador Master</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Apenas o usuário com perfil <strong>MASTER</strong> possui autorização para consultar, estipular e alterar os valores de comissão de cada vendedor e consultor comercial do sistema.
        </p>
      </div>
    );
  }

  // Get distinct regions
  const regions = useMemo(() => {
    const list = Array.from(new Set(salesAgents.map((a) => a.assignedRegion).filter(Boolean)));
    return ['ALL', ...list];
  }, [salesAgents]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return salesAgents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.cpf.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.assignedRegion.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = selectedRegion === 'ALL' || agent.assignedRegion === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [salesAgents, searchTerm, selectedRegion]);

  // Handle single agent rate change
  const handleRateChange = (agentId: string, rate: number) => {
    setDraftRates((prev) => ({
      ...prev,
      [agentId]: {
        ...(prev[agentId] || { rate: 5, bonus: 0 }),
        rate: Math.max(0, Math.min(100, rate))
      }
    }));
    setSavedStatus((prev) => ({ ...prev, [agentId]: false }));
  };

  const handleBonusChange = (agentId: string, bonus: number) => {
    setDraftRates((prev) => ({
      ...prev,
      [agentId]: {
        ...(prev[agentId] || { rate: 5, bonus: 0 }),
        bonus: Math.max(0, bonus)
      }
    }));
    setSavedStatus((prev) => ({ ...prev, [agentId]: false }));
  };

  // Save single agent
  const handleSaveSingle = (agent: SalesAgent) => {
    const draft = draftRates[agent.id] || { rate: agent.commissionRatePercent, bonus: agent.commissionBonusPerActivation };
    setSalesAgentCommission(agent.id, draft.rate, draft.bonus);

    setSavedStatus((prev) => ({ ...prev, [agent.id]: true }));
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [agent.id]: false }));
    }, 3000);
  };

  // Apply mass rate to all
  const handleApplyMassRate = () => {
    salesAgents.forEach((agent) => {
      setSalesAgentCommission(agent.id, massRate, massBonus);
    });

    const updated: Record<string, { rate: number; bonus: number }> = {};
    const statuses: Record<string, boolean> = {};
    salesAgents.forEach((a) => {
      updated[a.id] = { rate: massRate, bonus: massBonus };
      statuses[a.id] = true;
    });
    setDraftRates(updated);
    setSavedStatus(statuses);

    addAuditLog(
      'MASS_COMMISSION_UPDATE',
      `Master Supremo aplicou comissão padrão de ${massRate}% (bônus R$ ${massBonus}) para todos os ${salesAgents.length} vendedores da equipe.`,
      { category: 'FINANCIAL' }
    );
    triggerToast(`Taxa de ${massRate}% aplicada a todos os vendedores com sucesso!`);
  };

  // Calculate stats
  const averageRate = useMemo(() => {
    if (salesAgents.length === 0) return 0;
    const total = salesAgents.reduce((acc, a) => acc + (a.commissionRatePercent || 0), 0);
    return (total / salesAgents.length).toFixed(1);
  }, [salesAgents]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. CABEÇALHO OFICIAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Painel Exclusivo do Administrador Master</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Gestão Individual de Comissões dos Vendedores
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Como Administrador Master Supremo, determine a porcentagem exata de comissão e bônus que cada consultor ou vendedor recebe ao cadastrar novos lojistas e prestadores de serviços.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/70 p-4 rounded-2xl shrink-0 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Regras Oficiais do Organograma:</span>
            </div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• <strong>Usuário Comprador:</strong> R$ 0,00 (Grátis, sem comissão)</li>
              <li>• <strong>Prestador de Serviços:</strong> R$ 29,90 fixo</li>
              <li>• <strong>Lojista Comercial:</strong> Conforme o plano escolhido</li>
              <li>• <strong>Chave Pix Central do App:</strong> 30810800000139 (Bex Serviços)</li>
            </ul>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vendedores Cadastrados
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-white">{salesAgents.length}</span>
              <span className="text-xs text-blue-400 font-semibold">consultores</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Taxa Média Atual
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-amber-300">{averageRate}%</span>
              <span className="text-xs text-slate-400 font-medium">por contrato</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Comissão Padrão do Sistema
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">5.0%</span>
              <span className="text-xs text-emerald-400/80 font-medium">recomendada</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Titular do Sistema
            </span>
            <div className="flex items-baseline space-x-2 mt-1 truncate">
              <span className="text-xs font-bold text-white truncate">Bex Serviços</span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate">CNPJ 30.810.800/0001-39</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE AJUSTE EM MASSA (OPÇÃO RÁPIDA MASTER) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm font-black text-slate-900">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Definir Taxa em Massa para Toda a Equipe</span>
          </div>
          <p className="text-xs text-slate-500">
            Aplica uma porcentagem uniforme de comissão instantaneamente para todos os vendedores cadastrados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-700">Taxa (%):</span>
            <input
              type="number"
              min={0}
              max={100}
              value={massRate}
              onChange={(e) => setMassRate(Number(e.target.value))}
              className="w-16 text-center font-black text-blue-700 bg-white border border-slate-300 rounded-lg py-1 text-sm outline-none"
            />
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs font-bold text-slate-700">Bônus (R$):</span>
            <input
              type="number"
              min={0}
              value={massBonus}
              onChange={(e) => setMassBonus(Number(e.target.value))}
              className="w-16 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg py-1 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyMassRate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Aplicar a Todos ({salesAgents.length})</span>
          </button>
        </div>
      </div>

      {/* 3. FILTROS E PESQUISA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, email, CPF ou região..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Região:</span>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'Todas as Regiões' : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. LISTAGEM INDIVIDUAL DE VENDEDORES COM CONTROLE MASTER */}
      <div className="space-y-4">
        {filteredAgents.map((agent) => {
          const draft = draftRates[agent.id] || {
            rate: agent.commissionRatePercent ?? 5,
            bonus: agent.commissionBonusPerActivation ?? 0
          };
          const isSaved = savedStatus[agent.id];

          // Calculations for plans preview
          const prestadorCommission = (29.9 * draft.rate) / 100 + draft.bonus;
          const ouroCommission = (49.9 * draft.rate) / 100 + draft.bonus;
          const prataCommission = (59.9 * draft.rate) / 100 + draft.bonus;
          const premiumCommission = (199.9 * draft.rate) / 100 + draft.bonus;

          return (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 space-y-4"
            >
              {/* Header do Vendedor */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-4">
                  <img
                    src={
                      agent.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={agent.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-base text-slate-900">{agent.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {agent.roleTitle || 'Consultor Comercial'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>E-mail: <strong>{agent.email}</strong></span>
                      <span>Tel: <strong>{agent.phone}</strong></span>
                      <span>CPF: <strong>{agent.cpf}</strong></span>
                      <span>Região: <strong>{agent.assignedRegion}</strong></span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Chave Pix Repasse: <span className="font-mono font-bold text-slate-700">{agent.pixKey}</span> ({agent.pixKeyType})
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center space-x-1 ${
                      agent.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{agent.status === 'active' ? 'Vendedor Ativo' : 'Pendente'}</span>
                  </span>
                </div>
              </div>

              {/* Controles de Comissão (Master Exclusivo) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1">
                {/* Inputs de Taxa e Bônus */}
                <div className="md:col-span-5 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                    <label className="block text-[11px] font-extrabold text-blue-900 mb-1">
                      Comissão do Vendedor (%):
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={draft.rate}
                        onChange={(e) => handleRateChange(agent.id, Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-lg font-black text-blue-700 text-center outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="font-black text-base text-blue-800">%</span>
                    </div>
                    <span className="text-[10px] text-blue-700/80 block mt-1">
                      Sobre o valor total do plano
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                      Bônus Fixo Ativação (R$):
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-slate-500">R$</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draft.bonus}
                        onChange={(e) => handleBonusChange(agent.id, Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-lg font-black text-slate-800 text-center outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Adicional por novo cliente pago
                    </span>
                  </div>
                </div>

                {/* Simulador de Ganhos em Tempo Real */}
                <div className="md:col-span-5 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center space-x-1">
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Simulação de Ganhos com Taxa de {draft.rate}%:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Cálculo Oficial</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Prestador (R$ 29,90)</span>
                      <span className="text-xs font-black text-emerald-700">
                        R$ {prestadorCommission.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Lojista Ouro (R$ 49,90)</span>
                      <span className="text-xs font-black text-blue-700">
                        R$ {ouroCommission.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Lojista Prata (R$ 59,90)</span>
                      <span className="text-xs font-black text-indigo-700">
                        R$ {prataCommission.toFixed(2)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Premium (R$ 199,90)</span>
                      <span className="text-xs font-black text-purple-700">
                        R$ {premiumCommission.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão Salvar */}
                <div className="md:col-span-2 flex flex-col justify-center">
                  <button
                    type="button"
                    onClick={() => handleSaveSingle(agent)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs ${
                      isSaved
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-blue-400" />
                        <span>Salvar Taxa</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-slate-400 text-center mt-1">
                    Salva no registro Master
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAgents.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Nenhum vendedor localizado com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
