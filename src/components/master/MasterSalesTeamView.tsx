import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SalesAgent,
  BoletoBillingRequest,
  CommercialGoal,
  SalesOrganogramNode,
  AgentRegisteredClient
} from '../../types';
import {
  Briefcase,
  TrendingUp,
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Send,
  Building2,
  MapPin,
  Phone,
  Mail,
  Award,
  Target,
  ChevronRight,
  Search,
  Filter,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Download,
  Calendar,
  Percent,
  Sparkles,
  X,
  ExternalLink,
  Edit2,
  Plus,
  CreditCard,
  Layers,
  Shield,
  BarChart3,
  Webhook
} from 'lucide-react';
import { CommercialHierarchyManager } from './CommercialHierarchyManager';
import { CommercialDataVizView } from './CommercialDataVizView';
import { MasterBoletoWebhookView } from './MasterBoletoWebhookView';

interface MasterSalesTeamViewProps {
  initialSubTab?: 'organogram' | 'hierarchy' | 'analytics' | 'agents' | 'boletos' | 'webhooks' | 'clients' | 'goals';
}

export const MasterSalesTeamView: React.FC<MasterSalesTeamViewProps> = ({
  initialSubTab = 'organogram'
}) => {
  const {
    salesAgents,
    boletoRequests,
    registeredClientsByAgents,
    commercialGoals,
    addSalesAgent,
    updateSalesAgent,
    setSalesAgentCommission,
    markBoletoAsSent,
    confirmBoletoPaymentAndReleaseCommission,
    cancelBoletoRequest,
    markCommissionAsPaidToAgent,
    addCommercialGoal,
    deleteCommercialGoal,
    setCurrentEnvironment,
    triggerToast
  } = useApp();

  // Active sub-tab inside the Sales view
  const [activeSubTab, setActiveSubTab] = useState<'organogram' | 'hierarchy' | 'analytics' | 'agents' | 'boletos' | 'webhooks' | 'clients' | 'goals'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [boletoStatusFilter, setBoletoStatusFilter] = useState<'ALL' | BoletoBillingRequest['status']>('ALL');
  const [clientTypeFilter, setClientTypeFilter] = useState<'ALL' | 'LOJISTA' | 'PRESTADOR' | 'USUARIO_VIP'>('ALL');

  // Modals state
  const [isNewAgentModalOpen, setIsNewAgentModalOpen] = useState(false);
  const [isEditCommissionModalOpen, setIsEditCommissionModalOpen] = useState(false);
  const [selectedAgentForCommission, setSelectedAgentForCommission] = useState<SalesAgent | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(15);
  const [newBonusPerActivation, setNewBonusPerActivation] = useState<number>(20);

  // Send boleto modal
  const [selectedBoletoToSend, setSelectedBoletoToSend] = useState<BoletoBillingRequest | null>(null);
  const [boletoBarcodeDigits, setBoletoBarcodeDigits] = useState('');
  const [boletoPixCode, setBoletoPixCode] = useState('');
  const [boletoNotes, setBoletoNotes] = useState('');

  // Confirm payment modal
  const [selectedBoletoToConfirm, setSelectedBoletoToConfirm] = useState<BoletoBillingRequest | null>(null);
  const [confirmPaymentNotes, setConfirmPaymentNotes] = useState('');

  // Pay commission modal
  const [selectedBoletoToPayCommission, setSelectedBoletoToPayCommission] = useState<BoletoBillingRequest | null>(null);
  const [pixReceiptCode, setPixReceiptCode] = useState('');

  // New Goal Modal
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetMonth: 'Março/2026',
    targetCount: 20,
    targetRevenue: 1500,
    bonusPrizeDescription: 'R$ 300 no Pix + Certificado Destaque',
    deadline: '2026-03-31'
  });

  // New Agent Form
  const [agentForm, setAgentForm] = useState<{
    name: string;
    email: string;
    phone: string;
    cpf: string;
    pixKey: string;
    roleLevel: 'SUPERVISOR' | 'COORDENADOR' | 'CONSULTOR';
    roleTitle: string;
    assignedRegion: string;
    commissionRatePercent: number;
    commissionBonusPerActivation: number;
    monthlyTargetCount: number;
    parentId?: string;
  }>({
    name: '',
    email: '',
    phone: '(21) 9',
    cpf: '',
    pixKey: '',
    roleLevel: 'CONSULTOR',
    roleTitle: 'Consultor Comercial Externo',
    assignedRegion: 'Cachoeiras de Macacu - Centro',
    commissionRatePercent: 15,
    commissionBonusPerActivation: 20,
    monthlyTargetCount: 15,
    parentId: salesAgents[0]?.id
  });

  // Copied state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    triggerToast('Copiado para a área de transferência!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // KPIs
  const totalAgents = salesAgents.length;
  const activeAgents = salesAgents.filter((a) => a.status === 'ACTIVE').length;
  const totalClientsRegistered = registeredClientsByAgents.length;
  const pendingBoletos = boletoRequests.filter((b) => b.status === 'PENDENTE_EMISSAO').length;
  
  const totalCommissionGenerated = useMemo(() => {
    return boletoRequests.reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [boletoRequests]);

  const totalCommissionReleased = useMemo(() => {
    return boletoRequests
      .filter((b) => b.commissionStatus === 'LIBERADA' || b.commissionStatus === 'PAGA')
      .reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [boletoRequests]);

  const totalCommissionPaid = useMemo(() => {
    return boletoRequests
      .filter((b) => b.commissionStatus === 'PAGA')
      .reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [boletoRequests]);

  // Filtered boletos
  const filteredBoletos = useMemo(() => {
    return boletoRequests.filter((req) => {
      const matchSearch =
        req.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.documentNumber.includes(searchTerm);
      const matchStatus = boletoStatusFilter === 'ALL' || req.status === boletoStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [boletoRequests, searchTerm, boletoStatusFilter]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return registeredClientsByAgents.filter((cli) => {
      const matchSearch =
        cli.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cli.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cli.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cli.documentNumber.includes(searchTerm);
      const matchType = clientTypeFilter === 'ALL' || cli.clientType === clientTypeFilter;
      return matchSearch && matchType;
    });
  }, [registeredClientsByAgents, searchTerm, clientTypeFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOPO & BANNER DE GESTÃO COMERCIAL */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 tracking-wider">
                Módulo Comercial Supremo
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Operacional
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-400" />
              Gestão de Vendedores & Equipe Comercial
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Supervisão central do Administrador Master: acompanhe vendedores atrelados, defina comissões personalizadas, aprove o envio de boletos bancários aos clientes cadastrados e libere comissões após a confirmação de pagamento.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentEnvironment('COMMERCIAL_PORTAL')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-xs"
              title="Abrir a visão exata que o vendedor vê"
            >
              <ExternalLink className="w-4 h-4 text-blue-400" />
              <span>Ver Como Vendedor</span>
            </button>
            <button
              onClick={() => setIsNewGoalModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-xs"
            >
              <Target className="w-4 h-4" />
              <span>+ Lançar Meta</span>
            </button>
            <button
              onClick={() => setIsNewAgentModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-md shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Novo Vendedor</span>
            </button>
          </div>
        </div>

        {/* METRIC CARDS OVERVIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Vendedores Ativos
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-black text-white">{activeAgents}</span>
              <span className="text-[11px] text-slate-400">/ {totalAgents} total</span>
            </div>
            <span className="text-[10px] text-blue-400 font-medium mt-0.5 block">100% comissionados</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Clientes Cadastrados
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-black text-white">{totalClientsRegistered}</span>
              <span className="text-[11px] text-emerald-400 font-bold">pela equipe</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Lojistas & Prestadores</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Boletos Pendentes
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-black text-amber-300">{pendingBoletos}</span>
              <span className="text-[11px] text-amber-400/80 font-semibold">a emitir</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Aguardam envio</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Comissões Geradas
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-black text-white">
                R$ {totalCommissionGenerated.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Total em contratos</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Comissões Liberadas
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-black text-emerald-400">
                R$ {totalCommissionReleased.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-300/80 font-medium mt-0.5 block">Pós-confirmação</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Repassadas (Pix)
            </span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-black text-blue-300">
                R$ {totalCommissionPaid.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Comprovante anexado</span>
          </div>
        </div>
      </div>

      {/* 2. SUB-BARRA DE NAVEGAÇÃO INTERNA */}
      <div className="flex items-center space-x-2 border-b border-slate-200 bg-white p-2 rounded-xl shadow-xs overflow-x-auto">
        <button
          id="tab-sub-organogram"
          onClick={() => setActiveSubTab('organogram')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'organogram'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organograma Comercial Operante</span>
        </button>

        <button
          id="tab-sub-hierarchy"
          onClick={() => setActiveSubTab('hierarchy')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'hierarchy'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Hierarquia & Atribuição de Áreas</span>
          <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-md bg-blue-100 text-blue-800 font-extrabold">
            Módulo Master
          </span>
        </button>

        <button
          id="tab-sub-analytics"
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Desempenho & Data Viz</span>
          <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
            Recharts
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('agents')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'agents'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cadastro & Gestão de Vendedores ({salesAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('boletos')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'boletos'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Solicitações de Boletos & Comissões ({boletoRequests.length})</span>
          {pendingBoletos > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white font-extrabold">
              {pendingBoletos}
            </span>
          )}
        </button>

        <button
          id="tab-sub-webhooks"
          onClick={() => setActiveSubTab('webhooks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'webhooks'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Webhook className="w-4 h-4 text-emerald-500" />
          <span>Webhooks & Liquidação Automática</span>
          <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
            Gateways
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('clients')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'clients'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Clientes Cadastrados pela Equipe ({registeredClientsByAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('goals')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'goals'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Metas Comerciais Lançadas ({commercialGoals.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: ORGANOGRAMA COMERCIAL FUNCIONAL & OPERANTE */}
      {/* ========================================================================= */}
      {activeSubTab === 'organogram' && (
        <div className="space-y-6">
          {/* BANNER DE GESTÃO CENTRALIZADA */}
          <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  Controle Central de Hierarquização & Atribuição Territorial
                </h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  Vincule consultores a supervisores, distribua bairros de Cachoeiras de Macacu e defina metas por esquadrão.
                </p>
              </div>
            </div>
            <button
              id="btn-goto-hierarchy-module"
              onClick={() => setActiveSubTab('hierarchy')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-blue-950 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>Gerenciar Hierarquias e Áreas</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Estrutura Hierárquica da Força Comercial
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organograma operacional com subordinação direta ao Administrador Master Supremo. Clique nos agentes para gerenciar comissões e dados.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200 text-[11px]">
                  Administração Master
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px]">
                  Coordenação
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">
                  Supervisão
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                  Consultoria Externa
                </span>
              </div>
            </div>

            {/* TREE DIAGRAM */}
            <div className="relative py-4 flex flex-col items-center">
              {/* NÓ MASTER SUPREMO (TOPO) */}
              <div className="w-full max-w-md bg-linear-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-lg border-2 border-blue-500/40 text-center relative z-10">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg mx-auto shadow-md border-2 border-white/20">
                  ADM
                </div>
                <h3 className="font-extrabold text-sm text-white mt-2">
                  Administrador Master Supremo
                </h3>
                <p className="text-[11px] text-blue-300 font-medium">
                  Autoridade Única de Emissão de Boletos & Liberação de Comissões
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-300">
                  <span className="bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                    Supervisão Geral
                  </span>
                  <span className="bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded-full font-bold">
                    Controle Total de Taxas
                  </span>
                </div>
              </div>

              {/* LINHA CONECTORA VERTICAL */}
              <div className="w-0.5 h-10 bg-slate-300 my-0"></div>

              {/* NÍVEL 1: COORDENADORES GERAIS */}
              {salesAgents
                .filter((a) => a.roleLevel === 'COORDENADOR_REGIONAL' || (a.roleLevel as string) === 'COORDENADOR')
                .map((coord) => {
                  const coordClients = registeredClientsByAgents.filter((c) => c.agentId === coord.id).length;
                  return (
                    <div key={coord.id} className="w-full flex flex-col items-center">
                      <div className="w-full max-w-sm bg-blue-50 border-2 border-blue-300 text-slate-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-600 text-white">
                            {coord.roleTitle}
                          </span>
                          <span className="text-xs font-black text-blue-900">
                            Comissão: {coord.commissionRatePercent}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-3">
                          <img
                            src={coord.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={coord.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 truncate">
                              {coord.name}
                            </h4>
                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {coord.assignedRegion}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span>{coord.phone}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">
                                {coordClients} clientes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex items-center justify-between text-xs">
                          <button
                            onClick={() => {
                              setSelectedAgentForCommission(coord);
                              setNewCommissionRate(coord.commissionRatePercent);
                              setNewBonusPerActivation(coord.commissionBonusPerActivation);
                              setIsEditCommissionModalOpen(true);
                            }}
                            className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Taxa Master</span>
                          </button>
                          <button
                            onClick={() => setActiveSubTab('hierarchy')}
                            className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Reatribuir</span>
                          </button>
                          <a
                            href={`https://wa.me/55${coord.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>

                      {/* LINHA PARA SUBORDINADOS */}
                      <div className="w-0.5 h-8 bg-slate-300"></div>

                      {/* NÍVEL 2: SUPERVISORES & CONSULTORES */}
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
                        {salesAgents
                          .filter((a) => a.id !== coord.id)
                          .map((agent) => {
                            const agentClients = registeredClientsByAgents.filter((c) => c.agentId === agent.id).length;
                            return (
                              <div
                                key={agent.id}
                                className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        agent.roleLevel === 'SUPERVISOR_VENDAS' || (agent.roleLevel as string) === 'SUPERVISOR'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {agent.roleTitle}
                                    </span>
                                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {agent.commissionRatePercent}% Comiss.
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-3 mt-2">
                                    <img
                                      src={agent.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                                      alt={agent.name}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-bold text-xs text-slate-900 truncate">
                                        {agent.name}
                                      </h5>
                                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                        {agent.assignedRegion}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg text-center text-[11px]">
                                    <div>
                                      <span className="text-slate-500 text-[10px] block">Clientes</span>
                                      <span className="font-extrabold text-slate-800">
                                        {agentClients}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 text-[10px] block">Meta Mês</span>
                                      <span className="font-extrabold text-blue-700">
                                        {agent.monthlyTargetCount} lojas
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                  <button
                                    onClick={() => {
                                      setSelectedAgentForCommission(agent);
                                      setNewCommissionRate(agent.commissionRatePercent);
                                      setNewBonusPerActivation(agent.commissionBonusPerActivation);
                                      setIsEditCommissionModalOpen(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Comissão</span>
                                  </button>
                                  <button
                                    onClick={() => setActiveSubTab('hierarchy')}
                                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                                  >
                                    <Layers className="w-3 h-3" />
                                    <span>Área / Squad</span>
                                  </button>
                                  <a
                                    href={`https://wa.me/55${agent.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px]"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Contato</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: HIERARQUIA & ATRIBUIÇÃO DE ÁREAS (MÓDULO CENTRALIZADO MASTER) */}
      {/* ========================================================================= */}
      {activeSubTab === 'hierarchy' && (
        <CommercialHierarchyManager
          onOpenCommissionModal={(agent) => {
            setSelectedAgentForCommission(agent);
            setNewCommissionRate(agent.commissionRatePercent);
            setNewBonusPerActivation(agent.commissionBonusPerActivation);
            setIsEditCommissionModalOpen(true);
          }}
          onNavigateToOrganogram={() => setActiveSubTab('organogram')}
          onNavigateToAnalytics={() => setActiveSubTab('analytics')}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: DATA VISUALIZATION COMERCIAL & METAS (RECHARTS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'analytics' && (
        <CommercialDataVizView
          onNavigateToTab={(tab) => setActiveSubTab(tab)}
          onOpenCommissionModal={(agent) => {
            setSelectedAgentForCommission(agent);
            setNewCommissionRate(agent.commissionRatePercent);
            setNewBonusPerActivation(agent.commissionBonusPerActivation);
            setIsEditCommissionModalOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CADASTRO & GESTÃO COMPLETA DE VENDEDORES */}
      {/* ========================================================================= */}
      {activeSubTab === 'agents' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar vendedor por nome, CPF, telefone ou região..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setIsNewAgentModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Novo Vendedor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesAgents
              .filter(
                (a) =>
                  a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.cpf.includes(searchTerm) ||
                  a.assignedRegion.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                        />
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            {agent.name}
                          </h3>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              agent.roleLevel === 'COORDENADOR'
                                ? 'bg-blue-100 text-blue-800'
                                : agent.roleLevel === 'SUPERVISOR'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {agent.roleTitle}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          agent.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {agent.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>

                    {/* METRIC BOXES */}
                    <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Taxa de Comissão
                        </span>
                        <span className="text-base font-black text-blue-600">
                          {agent.commissionRatePercent}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          + R$ {agent.commissionBonusPerActivation} bônus
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">
                          Clientes Cadastrados
                        </span>
                        <span className="text-base font-black text-slate-800">
                          {agent.totalClientsCount}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          Meta: {agent.monthlyTargetCount}
                        </span>
                      </div>
                    </div>

                    {/* CONTACT & PIX */}
                    <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Região:
                        </span>
                        <span className="font-semibold text-slate-700">{agent.assignedRegion}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> WhatsApp:
                        </span>
                        <span className="font-semibold text-slate-700">{agent.phone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" /> Chave Pix:
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-800 truncate max-w-[140px]">
                          {agent.pixKey}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedAgentForCommission(agent);
                        setNewCommissionRate(agent.commissionRatePercent);
                        setNewBonusPerActivation(agent.commissionBonusPerActivation);
                        setIsEditCommissionModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Comissão Master</span>
                    </button>
                    <a
                      href={`https://wa.me/55${agent.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Falar</span>
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: SOLICITAÇÕES DE BOLETOS & LIBERAÇÃO DE COMISSÃO */}
      {/* ========================================================================= */}
      {activeSubTab === 'boletos' && (
        <div className="space-y-4">
          {/* FILTER BAR */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, código do boleto, CPF/CNPJ ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
              <span className="text-slate-400 font-bold text-[11px] mr-1">Status:</span>
              {(['ALL', 'PENDENTE_EMISSAO', 'BOLETO_ENVIADO', 'PAGAMENTO_CONFIRMADO', 'CANCELADO'] as const).map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setBoletoStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      boletoStatusFilter === st
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Todos'
                      : st === 'PENDENTE_EMISSAO'
                      ? 'Pendentes'
                      : st === 'BOLETO_ENVIADO'
                      ? 'Enviados'
                      : st === 'PAGAMENTO_CONFIRMADO'
                      ? 'Pagos'
                      : 'Cancelados'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* LIST OF BOLETO REQUESTS */}
          <div className="space-y-3">
            {filteredBoletos.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-800">Nenhuma solicitação encontrada</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Não há solicitações de boletos para os filtros selecionados.
                </p>
              </div>
            ) : (
              filteredBoletos.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                        {req.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          req.status === 'PENDENTE_EMISSAO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : req.status === 'BOLETO_ENVIADO'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : req.status === 'PAGAMENTO_CONFIRMADO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status === 'PENDENTE_EMISSAO'
                          ? '⏳ Pendente de Emissão pelo Master'
                          : req.status === 'BOLETO_ENVIADO'
                          ? '📬 Boleto Enviado ao Cliente'
                          : req.status === 'PAGAMENTO_CONFIRMADO'
                          ? '✅ Pagamento Confirmado'
                          : '❌ Cancelado'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-400">
                        Solicitado em:{' '}
                        <strong className="text-slate-700">
                          {new Date(req.requestedAt).toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Vencimento:{' '}
                        <strong className="text-slate-700">
                          {new Date(req.dueDate).toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* CLIENT & BILLING INFO */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Cliente Cadastrado
                      </span>
                      <span className="font-extrabold text-slate-900 block text-sm">
                        {req.clientName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        CPF/CNPJ: {req.documentNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {req.neighborhood} • {req.clientPhone}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Plano & Valor
                      </span>
                      <span className="font-extrabold text-blue-950 block text-sm">
                        {req.planTitle} ({req.billingFrequency})
                      </span>
                      <span className="text-base font-black text-slate-900">
                        R$ {req.amount.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Vendedor Responsável
                      </span>
                      <span className="font-bold text-slate-800 block text-sm">
                        {req.agentName}
                      </span>
                      <span className="text-[11px] text-blue-700 font-bold">
                        Taxa Master: {req.commissionRatePercent}%
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Pix: {req.agentPixKey}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Comissão do Vendedor
                      </span>
                      <span className="text-base font-black text-emerald-600 block">
                        R$ {req.commissionAmount.toFixed(2)}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.commissionStatus === 'PENDENTE'
                            ? 'bg-amber-100 text-amber-800'
                            : req.commissionStatus === 'LIBERADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.commissionStatus === 'PAGA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.commissionStatus === 'PENDENTE'
                          ? 'Aguardando Pagto do Boleto'
                          : req.commissionStatus === 'LIBERADA'
                          ? 'Liberada (Aguardando Pix)'
                          : req.commissionStatus === 'PAGA'
                          ? 'Comissão Paga via Pix'
                          : 'Cancelada'}
                      </span>
                    </div>
                  </div>

                  {/* WEBHOOK AUTOMATION BADGE IF CONFIRMED VIA WEBHOOK */}
                  {req.webhookConfirmed && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
                          Webhook {req.webhookGateway}
                        </span>
                        <span className="text-emerald-900 font-medium">
                          Compensação bancária capturada via Webhook. Comissão liberada automaticamente.
                          {req.externalTransactionId && (
                            <span className="font-mono text-slate-500 ml-1">
                              (TxID: {req.externalTransactionId})
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveSubTab('webhooks')}
                        className="px-2.5 py-1 bg-white text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
                      >
                        <Webhook className="w-3.5 h-3.5" />
                        <span>Ver no Webhook Engine &rarr;</span>
                      </button>
                    </div>
                  )}

                  {/* DETAILS (BARCODE, PIX, RECEIPT) IF AVAILABLE */}
                  {req.barcodeDigits && (
                    <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-blue-900 font-bold block">
                          Linha Digitável do Boleto:
                        </span>
                        <code className="text-[11px] font-mono font-bold text-slate-700 select-all truncate block">
                          {req.barcodeDigits}
                        </code>
                      </div>
                      <button
                        onClick={() => handleCopy(req.barcodeDigits!, req.id)}
                        className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                      >
                        {copiedCode === req.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedCode === req.id ? 'Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                  )}

                  {/* MASTER ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                    <div className="text-xs text-slate-500 italic">
                      {req.masterNotes || 'Aguardando ação do Administrador Master.'}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* ACTION 1: EMITIR & ENVIAR BOLETO */}
                      {req.status === 'PENDENTE_EMISSAO' && (
                        <button
                          onClick={() => {
                            setSelectedBoletoToSend(req);
                            setBoletoBarcodeDigits(
                              `34191.79001 01043.510047 91020.150008 4 ${Math.floor(
                                10000000000000 + Math.random() * 90000000000000
                              )}`
                            );
                            setBoletoPixCode(
                              `00020126580014br.gov.bcb.pix0136achei-aqui-bol-${req.code}5204000053039865405${req.amount.toFixed(
                                2
                              )}5802BR5921Achei Aqui Cobranca6014Cachoeiras Mac62070503BOL6304`
                            );
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Emitir & Enviar Boleto</span>
                        </button>
                      )}

                      {/* ACTION 2: CONFIRMAR PAGAMENTO & LIBERAR COMISSÃO */}
                      {req.status === 'BOLETO_ENVIADO' && (
                        <button
                          onClick={() => {
                            setSelectedBoletoToConfirm(req);
                            setConfirmPaymentNotes(
                              'Pagamento bancário compensado. Estabelecimento ativado e comissão liberada para o consultor.'
                            );
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmar Pagamento & Liberar Comissão</span>
                        </button>
                      )}

                      {/* ACTION 3: PAGAR COMISSÃO VIA PIX */}
                      {req.commissionStatus === 'LIBERADA' && (
                        <button
                          onClick={() => {
                            setSelectedBoletoToPayCommission(req);
                            setPixReceiptCode(`PIX-E2E-${Date.now()}`);
                          }}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Pagar Comissão (R$ {req.commissionAmount.toFixed(2)}) via Pix</span>
                        </button>
                      )}

                      {/* ACTION 4: CANCELAR */}
                      {req.status !== 'CANCELADO' && req.status !== 'PAGAMENTO_CONFIRMADO' && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente cancelar a solicitação ${req.code}?`)) {
                              cancelBoletoRequest(req.id, 'Cancelado pelo Administrador Master.');
                            }
                          }}
                          className="px-2.5 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: WEBHOOKS & LIQUIDAÇÃO AUTOMÁTICA DE BOLETOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'webhooks' && (
        <MasterBoletoWebhookView />
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CLIENTES CADASTRADOS PELA EQUIPE */}
      {/* ========================================================================= */}
      {activeSubTab === 'clients' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, fantasia, CPF/CNPJ ou vendedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 font-bold text-[11px] mr-1">Tipo:</span>
              {(['ALL', 'LOJISTA', 'PRESTADOR', 'USUARIO_VIP'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setClientTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    clientTypeFilter === t
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'ALL'
                    ? 'Todos'
                    : t === 'LOJISTA'
                    ? 'Lojistas'
                    : t === 'PRESTADOR'
                    ? 'Prestadores'
                    : 'VIPs'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.clientType === 'LOJISTA'
                            ? 'bg-purple-100 text-purple-800'
                            : client.clientType === 'PRESTADOR'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {client.clientType === 'LOJISTA'
                          ? 'Lojista / Comércio'
                          : client.clientType === 'PRESTADOR'
                          ? 'Prestador de Serviços'
                          : 'Usuário VIP'}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                        {client.tradeName || client.name}
                      </h3>
                      {client.tradeName && (
                        <span className="text-[11px] text-slate-500 block">
                          Resp: {client.name}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        client.billingStatus === 'ATIVO_PAGO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : client.billingStatus === 'BOLETO_ENVIADO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {client.billingStatus === 'ATIVO_PAGO'
                        ? 'Ativo & Pago'
                        : client.billingStatus === 'BOLETO_ENVIADO'
                        ? 'Boleto Enviado'
                        : 'Aguardando Boleto'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plano Escolhido:</span>
                      <span className="font-bold text-blue-700">Plano {client.chosenPlan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Documento:</span>
                      <span className="font-mono">{client.documentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Localização:</span>
                      <span>
                        {client.neighborhood}, {client.city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cadastrado por:</span>
                      <span className="font-bold text-slate-800">{client.agentName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Cadastrado em: {new Date(client.registeredAt).toLocaleDateString('pt-BR')}
                  </span>
                  <a
                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: METAS & CAMPANHAS COMERCIAIS */}
      {/* ========================================================================= */}
      {activeSubTab === 'goals' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Metas Oficiais do Administrador Master
              </h3>
              <p className="text-xs text-slate-500">
                Estas metas aparecem em tempo real no painel de cada vendedor cadastrado.
              </p>
            </div>

            <button
              onClick={() => setIsNewGoalModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Lançar Nova Meta</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commercialGoals.map((goal) => {
              const percent = Math.min(
                100,
                Math.round((goal.currentAchievedCount / goal.targetCount) * 100)
              );
              return (
                <div
                  key={goal.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {goal.targetMonth}
                      </span>
                      <h4 className="font-black text-base text-slate-900 mt-1">{goal.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Excluir a meta "${goal.title}"?`)) {
                          deleteCommercialGoal(goal.id);
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg"
                      title="Excluir meta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Progresso de Cadastros:</span>
                      <span className="text-indigo-700">
                        {goal.currentAchievedCount} de {goal.targetCount} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-linear-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* FINANCIAL AND PRIZE */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Faturamento Alvo
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        R$ {goal.targetRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Premiação / Bônus
                      </span>
                      <span className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {goal.bonusPrizeDescription}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRAR NOVO VENDEDOR */}
      {/* ========================================================================= */}
      {isNewAgentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Novo Vendedor / Consultor</h3>
                  <p className="text-[11px] text-slate-500">Defina comissões e metas sob sua supervisão</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewAgentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addSalesAgent({
                  ...agentForm,
                  status: 'ACTIVE',
                  avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
                  totalSalesVolume: 0,
                  totalClientsCount: 0
                });
                setIsNewAgentModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo do Consultor:</label>
                <input
                  type="text"
                  required
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail:</label>
                  <input
                    type="email"
                    required
                    value={agentForm.email}
                    onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                    placeholder="carlos@acheiaqui.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    required
                    value={agentForm.phone}
                    onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                    placeholder="(21) 98888-7777"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF Oficial:</label>
                  <input
                    type="text"
                    required
                    value={agentForm.cpf}
                    onChange={(e) => setAgentForm({ ...agentForm, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chave Pix para Repasses:</label>
                  <input
                    type="text"
                    required
                    value={agentForm.pixKey}
                    onChange={(e) => setAgentForm({ ...agentForm, pixKey: e.target.value })}
                    placeholder="Chave Pix (CPF, Celular ou E-mail)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nível Hierárquico:</label>
                  <select
                    value={agentForm.roleLevel}
                    onChange={(e) => {
                      const lvl = e.target.value as any;
                      setAgentForm({
                        ...agentForm,
                        roleLevel: lvl,
                        roleTitle:
                          lvl === 'COORDENADOR'
                            ? 'Coordenador Geral'
                            : lvl === 'SUPERVISOR'
                            ? 'Supervisor de Vendas'
                            : 'Consultor Comercial Externo'
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CONSULTOR">Consultor Externo</option>
                    <option value="SUPERVISOR">Supervisor Comercial</option>
                    <option value="COORDENADOR">Coordenador Regional</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Região de Atuação:</label>
                  <input
                    type="text"
                    required
                    value={agentForm.assignedRegion}
                    onChange={(e) => setAgentForm({ ...agentForm, assignedRegion: e.target.value })}
                    placeholder="Ex: Papucaia / Castália"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* TAXA DE COMISSÃO DEFINIDA PELO MASTER */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
                <span className="font-black text-blue-900 block text-xs flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" />
                  Comissão Decidida pelo Administrador Master:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Taxa de Comissão (%):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={agentForm.commissionRatePercent}
                      onChange={(e) =>
                        setAgentForm({
                          ...agentForm,
                          commissionRatePercent: Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-blue-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Bônus de Ativação (R$):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={agentForm.commissionBonusPerActivation}
                      onChange={(e) =>
                        setAgentForm({
                          ...agentForm,
                          commissionBonusPerActivation: Number(e.target.value)
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-emerald-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAgentModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Cadastrar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUSTAR COMISSÃO DO VENDEDOR (MASTER) */}
      {/* ========================================================================= */}
      {isEditCommissionModalOpen && selectedAgentForCommission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Comissão do Vendedor</h3>
                  <p className="text-[11px] text-slate-500">{selectedAgentForCommission.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditCommissionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Como Administrador Master Supremo, defina a porcentagem exata que{' '}
                <strong>{selectedAgentForCommission.name}</strong> receberá sobre cada contrato pago.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Taxa de Comissão (% sobre valor do plano):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-black text-lg text-blue-700 text-center"
                  />
                  <span className="text-base font-black text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Bônus Fixo por Ativação Paga (R$):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newBonusPerActivation}
                  onChange={(e) => setNewBonusPerActivation(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                Exemplo: Em um plano Ouro de <strong>R$ 49,90</strong>, o vendedor receberá{' '}
                <strong className="text-emerald-700">
                  R$ {((49.9 * newCommissionRate) / 100 + newBonusPerActivation).toFixed(2)}
                </strong>{' '}
                de comissão após confirmação do pagamento.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCommissionModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSalesAgentCommission(
                      selectedAgentForCommission.id,
                      newCommissionRate,
                      newBonusPerActivation
                    );
                    setIsEditCommissionModalOpen(false);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Salvar Nova Taxa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMITIR & REGISTRAR ENVIO DE BOLETO */}
      {/* ========================================================================= */}
      {selectedBoletoToSend && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Emitir Boleto Bancário: {selectedBoletoToSend.code}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cliente: {selectedBoletoToSend.clientName} (R${' '}
                    {selectedBoletoToSend.amount.toFixed(2)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBoletoToSend(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Gere e registre os dados do boleto bancário oficial para envio ao cliente cadastrado
                pelo vendedor <strong>{selectedBoletoToSend.agentName}</strong>.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Linha Digitável / Código de Barras:
                </label>
                <input
                  type="text"
                  value={boletoBarcodeDigits}
                  onChange={(e) => setBoletoBarcodeDigits(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Código Pix Copia e Cola (Bolepix Integrado):
                </label>
                <textarea
                  rows={2}
                  value={boletoPixCode}
                  onChange={(e) => setBoletoPixCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações do Master:</label>
                <input
                  type="text"
                  placeholder="Ex: Boleto registrado no banco Itaú, com vencimento em 7 dias."
                  value={boletoNotes}
                  onChange={(e) => setBoletoNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold block">Enviar direto no WhatsApp do Cliente:</span>
                  <span className="text-[11px] text-emerald-700">{selectedBoletoToSend.clientPhone}</span>
                </div>
                <a
                  href={`https://wa.me/55${selectedBoletoToSend.clientPhone.replace(
                    /\D/g,
                    ''
                  )}?text=Ol%C3%A1%20${encodeURIComponent(
                    selectedBoletoToSend.clientName
                  )}!%20Aqui%20%C3%A9%20do%20Achei%20Aqui.%20Segue%20o%20boleto%20do%20seu%20${encodeURIComponent(
                    selectedBoletoToSend.planTitle
                  )}:%20${encodeURIComponent(boletoBarcodeDigits)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Abrir WhatsApp</span>
                </a>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBoletoToSend(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markBoletoAsSent(selectedBoletoToSend.id, {
                      barcodeDigits: boletoBarcodeDigits,
                      pixCopiaECola: boletoPixCode,
                      masterNotes: boletoNotes
                    });
                    setSelectedBoletoToSend(null);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirmar Envio do Boleto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR PAGAMENTO & LIBERAR COMISSÃO */}
      {/* ========================================================================= */}
      {selectedBoletoToConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Confirmar Pagamento do Boleto
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedBoletoToConfirm.code} • {selectedBoletoToConfirm.clientName}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex justify-between">
                  <span>Valor do Boleto Pago:</span>
                  <strong className="text-sm">
                    R$ {selectedBoletoToConfirm.amount.toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Vendedor:</span>
                  <strong>{selectedBoletoToConfirm.agentName}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200 text-emerald-950 font-bold">
                  <span>Comissão a Liberar ({selectedBoletoToConfirm.commissionRatePercent}%):</span>
                  <span className="text-base font-black text-emerald-700">
                    R$ {selectedBoletoToConfirm.commissionAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Notas de Baixa pelo Master:
                </label>
                <input
                  type="text"
                  value={confirmPaymentNotes}
                  onChange={(e) => setConfirmPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <p className="text-slate-500 text-[11px] leading-relaxed">
                Ao confirmar, o status do boleto mudará para{' '}
                <strong className="text-slate-800">PAGAMENTO_CONFIRMADO</strong>, a comissão do
                vendedor será marcada como <strong className="text-emerald-700">LIBERADA</strong> e o
                cliente/lojista passará a ter status ativo no catálogo Achei Aqui.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBoletoToConfirm(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmBoletoPaymentAndReleaseCommission(
                      selectedBoletoToConfirm.id,
                      confirmPaymentNotes
                    );
                    setSelectedBoletoToConfirm(null);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Confirmar & Liberar Comissão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAGAR COMISSÃO AO VENDEDOR VIA PIX */}
      {/* ========================================================================= */}
      {selectedBoletoToPayCommission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Repasse de Comissão via Pix
                </h3>
                <p className="text-xs text-slate-500">
                  Vendedor: {selectedBoletoToPayCommission.agentName}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 text-purple-950 space-y-1.5">
                <div className="flex justify-between">
                  <span>Valor da Comissão:</span>
                  <span className="text-base font-black text-purple-700">
                    R$ {selectedBoletoToPayCommission.commissionAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Chave Pix Cadastrada:</span>
                  <code className="font-mono font-bold text-purple-900">
                    {selectedBoletoToPayCommission.agentPixKey}
                  </code>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Referência:</span>
                  <span>Boleto {selectedBoletoToPayCommission.code}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Código / Autenticação do Pix:
                </label>
                <input
                  type="text"
                  value={pixReceiptCode}
                  onChange={(e) => setPixReceiptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBoletoToPayCommission(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    markCommissionAsPaidToAgent(
                      selectedBoletoToPayCommission.id,
                      pixReceiptCode
                    );
                    setSelectedBoletoToPayCommission(null);
                  }}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Confirmar Repasse Pix
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LANÇAR NOVA META COMERCIAL */}
      {/* ========================================================================= */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Lançar Nova Meta Comercial</h3>
                  <p className="text-[11px] text-slate-500">Definida pelo Administrador Master</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCommercialGoal({
                  ...goalForm,
                  currentAchievedCount: 0,
                  currentAchievedRevenue: 0,
                  status: 'ACTIVE'
                });
                setIsNewGoalModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título da Meta / Campanha:</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="Ex: Campanha de Expansão Lojistas Cachoeiras"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mês de Referência:</label>
                  <input
                    type="text"
                    required
                    value={goalForm.targetMonth}
                    onChange={(e) => setGoalForm({ ...goalForm, targetMonth: e.target.value })}
                    placeholder="Março/2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data Limite (Prazo):</label>
                  <input
                    type="date"
                    required
                    value={goalForm.deadline}
                    onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alvo de Cadastros:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={goalForm.targetCount}
                    onChange={(e) => setGoalForm({ ...goalForm, targetCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Faturamento Estimado (R$):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={goalForm.targetRevenue}
                    onChange={(e) =>
                      setGoalForm({ ...goalForm, targetRevenue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Premiação / Bônus do Vendedor:</label>
                <input
                  type="text"
                  required
                  value={goalForm.bonusPrizeDescription}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, bonusPrizeDescription: e.target.value })
                  }
                  placeholder="Ex: R$ 300 no Pix + Destaque Comercial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewGoalModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Lançar Meta Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
