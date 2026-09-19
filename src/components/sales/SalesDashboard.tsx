import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MembershipTier } from '../../types';
import {
  SALES_ORGANOGRAM_CONFIG,
  SERVICE_PROVIDER_BASE_PRICE,
  SERVICE_PROVIDER_EXTRA_SERVICE_PRICE,
  VENDOR_COMMISSION_PERCENT
} from '../../data/membershipPlansData';
import { generatePixCopiaECola, getPixQrCodeImageUrl } from '../../services/pix_payment_service';
import {
  Briefcase,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Building2,
  MapPin,
  Phone,
  Mail,
  Award,
  Target,
  Search,
  Copy,
  Check,
  QrCode,
  CreditCard,
  Download,
  Calendar,
  Percent,
  Sparkles,
  ExternalLink,
  Store,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  BarChart2,
  Share2,
  X,
  Layers,
  ShoppingBag,
  Wrench,
  UserCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const SalesDashboard: React.FC = () => {
  const {
    currentUser,
    salesAgents,
    currentSalesAgent,
    setCurrentSalesAgent,
    registeredClientsByAgents,
    boletoRequests,
    commercialGoals,
    createAgentRegisteredClient,
    setCurrentEnvironment,
    triggerToast
  } = useApp();

  // Active agent: strictly bound to logged-in user if VENDEDOR/REPRESENTANTE_COMERCIAL
  const userAgent = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.role === 'VENDEDOR' || currentUser.role === 'REPRESENTANTE_COMERCIAL') {
      const cleanEmail = currentUser.email.toLowerCase().trim();
      const found = salesAgents.find(
        (a) =>
          a.email.toLowerCase().trim() === cleanEmail ||
          a.id === currentUser.id ||
          `user-${a.id}` === currentUser.id ||
          a.id === currentUser.id.replace('user-', '')
      );
      if (found) return found;

      // Fallback seguro caso o vendedor tenha sido registrado e ainda não sincronizado no array salesAgents
      return {
        id: currentUser.id,
        name: currentUser.name || 'Vendedor Comercial',
        email: currentUser.email,
        phone: currentUser.phone || '(21) 98844-3322',
        role: (currentUser.role === 'REPRESENTANTE_COMERCIAL' ? 'REPRESENTANTE_COMERCIAL' : 'VENDEDOR') as any,
        status: 'ATIVO' as const,
        pixKey: (currentUser as any).pixKey || currentUser.phone || currentUser.email,
        pixKeyType: 'ALEATORIA' as const,
        assignedRegion: 'Cachoeiras de Macacu',
        commissionRate: 10,
        createdAt: currentUser.createdAt || new Date().toISOString()
      };
    }
    return currentSalesAgent || salesAgents[0];
  }, [currentUser, salesAgents, currentSalesAgent]);

  // Isolamento estrito de vendedor:
  // Vendedor A -> Portal do Vendedor A. Vendedor B -> Portal do Vendedor B.
  // Um vendedor jamais pode herdar perfil de outro vendedor.
  const agent = useMemo(() => {
    if (currentUser?.role === 'VENDEDOR' || currentUser?.role === 'REPRESENTANTE_COMERCIAL') {
      return userAgent;
    }
    return userAgent || currentSalesAgent || salesAgents[0];
  }, [currentUser, userAgent, currentSalesAgent, salesAgents]);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'organogram' | 'new-client' | 'my-boletos' | 'my-goals' | 'team'>('overview');

  // New client form state
  const [clientType, setClientType] = useState<'LOJISTA' | 'PRESTADOR' | 'USUARIO'>('LOJISTA');
  const [clientName, setClientName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [clientPhone, setClientPhone] = useState('(21) 9');
  const [clientEmail, setClientEmail] = useState('');
  const [neighborhood, setNeighborhood] = useState('Centro');
  const [city] = useState('Cachoeiras de Macacu');
  const [chosenPlan, setChosenPlan] = useState<MembershipTier>('OURO');
  const [billingFrequency, setBillingFrequency] = useState<'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'>('MENSAL');
  const [requestBoletoImmediately, setRequestBoletoImmediately] = useState(true);
  const [notes, setNotes] = useState('');

  // Search in my boletos
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Pix oficial do sistema pós-cadastro
  const [pixModalData, setPixModalData] = useState<{
    clientName: string;
    clientType: 'LOJISTA' | 'PRESTADOR' | 'USUARIO';
    planTitle: string;
    amount: number;
    commissionAmount: number;
    commissionPercent: number;
    pixCopiaECola: string;
    qrCodeUrl: string;
    phone: string;
    pixKey: string;
    beneficiary: string;
  } | null>(null);

  // Regras de precificação conforme o organograma oficial
  const isUserRegistration = clientType === 'USUARIO';
  const isProviderRegistration = clientType === 'PRESTADOR';
  const isMerchantRegistration = clientType === 'LOJISTA';

  // Plan pricing lookup
  const planPrices: Record<MembershipTier, number> = {
    GRATIS: 0,
    BRONZE: 19.90,
    PRATA: 59.90,
    OURO: 49.90,
    PREMIUM: 199.90,
    MASTER: 0
  };

  // Preço cobrado conforme o tipo de cadastro
  const selectedPlanPrice = isUserRegistration
    ? 0
    : isProviderRegistration
    ? SERVICE_PROVIDER_BASE_PRICE // Fixo R$ 29,90
    : planPrices[chosenPlan];

  // Comissão do vendedor: exatamente 5% do valor total do plano vendido
  const calculatedCommissionNumber = isUserRegistration
    ? 0
    : Number(((selectedPlanPrice * VENDOR_COMMISSION_PERCENT) / 100).toFixed(2));
  const calculatedCommission = calculatedCommissionNumber.toFixed(2);

  // Agent's registered clients
  const myClients = useMemo(() => {
    if (!agent) return [];
    return registeredClientsByAgents.filter((c) => c.agentId === agent.id);
  }, [registeredClientsByAgents, agent]);

  // Agent's boleto requests
  const myBoletos = useMemo(() => {
    if (!agent) return [];
    return boletoRequests.filter((b) => b.agentId === agent.id);
  }, [boletoRequests, agent]);

  // Agent's financial metrics
  const totalCommissionLiberada = useMemo(() => {
    return myBoletos
      .filter((b) => b.commissionStatus === 'LIBERADA' || b.commissionStatus === 'PAGA')
      .reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [myBoletos]);

  const totalCommissionPaga = useMemo(() => {
    return myBoletos
      .filter((b) => b.commissionStatus === 'PAGA')
      .reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [myBoletos]);

  const totalCommissionAguardando = useMemo(() => {
    return myBoletos
      .filter((b) => b.commissionStatus === 'PENDENTE')
      .reduce((sum, b) => sum + b.commissionAmount, 0);
  }, [myBoletos]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerToast('Código copiado com sucesso!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRegisterClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    const normalizedClientType = isUserRegistration ? 'USUARIO' : clientType;
    const finalPlan = isUserRegistration ? 'GRATIS' : isProviderRegistration ? 'BRONZE' : chosenPlan;

    createAgentRegisteredClient(
      {
        agentId: agent.id,
        agentName: agent.name,
        clientType: normalizedClientType,
        name: clientName,
        tradeName: tradeName || clientName,
        documentNumber,
        email: clientEmail,
        phone: clientPhone,
        neighborhood,
        city,
        chosenPlan: finalPlan,
        notes
      },
      {
        shouldRequestBoleto: !isUserRegistration,
        billingFrequency,
        customAmount: selectedPlanPrice
      }
    );

    // Se for prestador ou lojista, gera QR Code oficial do Pix do app (CNPJ 30810800000139) e abre modal
    if (!isUserRegistration && selectedPlanPrice > 0) {
      const txid = `BOL${Date.now().toString().slice(-8)}`;
      const pixCode = generatePixCopiaECola({
        pixKey: SALES_ORGANOGRAM_CONFIG.pixKeyClean,
        receiverName: SALES_ORGANOGRAM_CONFIG.beneficiary,
        receiverCity: 'CACHOEIRAS DE MACACU',
        amount: selectedPlanPrice,
        txid
      });
      const qrUrl = getPixQrCodeImageUrl(pixCode);

      setPixModalData({
        clientName: tradeName || clientName,
        clientType: normalizedClientType,
        planTitle: isProviderRegistration
          ? 'Prestador de Serviços (Fixo R$ 29,90 - 1 serviço incluso)'
          : `Lojista - Plano ${chosenPlan} (R$ ${selectedPlanPrice.toFixed(2)})`,
        amount: selectedPlanPrice,
        commissionAmount: calculatedCommissionNumber,
        commissionPercent: VENDOR_COMMISSION_PERCENT,
        pixCopiaECola: pixCode,
        qrCodeUrl: qrUrl,
        phone: clientPhone,
        pixKey: SALES_ORGANOGRAM_CONFIG.pixKeyClean,
        beneficiary: SALES_ORGANOGRAM_CONFIG.beneficiary
      });
      triggerToast('Cadastro efetuado e QR Code Pix gerado!');
    } else {
      triggerToast('Cliente cadastrado com sucesso! Cadastro 100% gratuito (somente compras).');
      setActiveTab('overview');
    }

    // Reset form
    setClientName('');
    setTradeName('');
    setDocumentNumber('');
    setClientPhone('(21) 9');
    setClientEmail('');
    setNotes('');
  };

  if (!agent) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Nenhum vendedor selecionado ou configurado no sistema.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* 1. TOPBAR DO VENDEDOR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  Achei Aqui
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Portal do Vendedor
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Força Comercial & Vendas Externas</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser?.role === 'MASTER' ? (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400 text-[11px]">Visualizando como:</span>
                <select
                  value={agent.id}
                  onChange={(e) => {
                    const found = salesAgents.find((a) => a.id === e.target.value);
                    if (found) setCurrentSalesAgent(found);
                  }}
                  className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
                >
                  {salesAgents.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                      {a.name} ({a.roleTitle})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400 text-[11px]">Consultor:</span>
                <span className="text-white font-bold text-xs">{agent.name}</span>
              </div>
            )}

            <button
              id="sales-btn-view-marketplace"
              onClick={() => setCurrentEnvironment('MARKETPLACE')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-slate-700 cursor-pointer shadow-xs active:scale-95"
              title="Navegar no Marketplace conectado como vendedor"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Ver Marketplace</span>
            </button>

            {currentUser?.role === 'MASTER' && (
              <button
                onClick={() => setCurrentEnvironment('MASTER_PANEL')}
                className="px-3 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-blue-700/60 cursor-pointer"
                title="Voltar ao Painel Master"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>Painel Master</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. AGENT PROFILE HEADER & BANNER */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-8 border-b border-blue-800/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={agent.avatar}
                alt={agent.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-black text-white">{agent.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 uppercase">
                    {agent.roleTitle}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-blue-200">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    Região: {agent.assignedRegion}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-400" />
                    {agent.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    Pix: {agent.pixKey}
                  </span>
                </div>
              </div>
            </div>

            {/* COMMISSION BADGE DEFINED BY MASTER */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-3.5 rounded-2xl flex items-center space-x-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-200 block">
                  Sua Comissão Master
                </span>
                <span className="text-xl font-black text-white">
                  {agent.commissionRatePercent}%
                </span>
                <span className="text-[11px] text-amber-300 font-bold block">
                  + R$ {agent.commissionBonusPerActivation} bônus por ativação
                </span>
              </div>
            </div>
          </div>

          {/* QUICK METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                Clientes Cadastrados
              </span>
              <span className="text-xl font-black text-white mt-1 block">
                {myClients.length}
              </span>
              <span className="text-[10px] text-slate-300">
                Meta do mês: {agent.monthlyTargetCount}
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                Boletos Solicitados
              </span>
              <span className="text-xl font-black text-white mt-1 block">
                {myBoletos.length}
              </span>
              <span className="text-[10px] text-amber-300 font-semibold">
                {myBoletos.filter((b) => b.status === 'PENDENTE_EMISSAO').length} aguardando envio Master
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                Comissão Liberada
              </span>
              <span className="text-xl font-black text-emerald-300 mt-1 block">
                R$ {totalCommissionLiberada.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-200">
                Pronta para repasse Pix
              </span>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-blue-200 block">
                Comissão Paga via Pix
              </span>
              <span className="text-xl font-black text-blue-200 mt-1 block">
                R$ {totalCommissionPaga.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-300">
                Confirmado pelo Master
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center space-x-2 border-b border-slate-200 bg-white p-2 rounded-xl shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Visão Geral & Gráficos</span>
          </button>

          <button
            onClick={() => setActiveTab('organogram')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'organogram'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Organograma Oficial do Sistema</span>
          </button>

          <button
            onClick={() => setActiveTab('new-client')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'new-client'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Novo Cadastro & Gerar PIX</span>
          </button>

          <button
            onClick={() => setActiveTab('my-boletos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-boletos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Meus Boletos & Comissões ({myBoletos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my-goals')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'my-goals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Metas Lançadas pelo Master ({commercialGoals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'team'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Equipe de Vendas</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUBTAB 1: VISÃO GERAL & GRÁFICOS */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 mt-6">
            {/* GRÁFICOS ESTATÍSTICOS DE VENDAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* GRÁFICO 1: EVOLUÇÃO DE CADASTROS & VENDAS */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Evolução de Cadastros e Vendas Mensais
                    </h3>
                    <p className="text-xs text-slate-500">
                      Total de novos clientes e lojistas credenciados por você
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    +34% este mês
                  </span>
                </div>

                {/* SVG BAR CHART */}
                <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100">
                  {[
                    { month: 'Out', count: 6, val: 320 },
                    { month: 'Nov', count: 9, val: 540 },
                    { month: 'Dez', count: 14, val: 890 },
                    { month: 'Jan', count: 11, val: 670 },
                    { month: 'Fev', count: 16, val: 990 },
                    { month: 'Mar', count: myClients.length + 5, val: 1250 }
                  ].map((bar, idx) => {
                    const maxHeight = 150;
                    const height = Math.max(25, (bar.count / 22) * maxHeight);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-black text-blue-700">
                          {bar.count} lojas
                        </span>
                        <div
                          className="w-full bg-linear-to-t from-blue-600 to-indigo-500 rounded-t-lg transition-all duration-500 hover:brightness-110"
                          style={{ height: `${height}px` }}
                        ></div>
                        <span className="text-[11px] font-bold text-slate-600 mt-1">
                          {bar.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>Média de 12 cadastros/mês</span>
                  <span className="font-bold text-blue-600">Total acumulado: R$ 4.660,00</span>
                </div>
              </div>

              {/* GRÁFICO 2: DISTRIBUIÇÃO DE PLANOS */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    Planos Mais Vendidos
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Proporção por categoria de adesão
                  </p>

                  <div className="space-y-3">
                    {[
                      { name: 'Plano Prata (R$ 59,90)', pct: 45, color: 'bg-slate-400' },
                      { name: 'Plano Ouro (R$ 49,90)', pct: 30, color: 'bg-amber-400' },
                      { name: 'Plano Bronze (R$ 19,90)', pct: 15, color: 'bg-amber-700' },
                      { name: 'Plano Premium (R$ 199,90)', pct: 10, color: 'bg-purple-600' }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="text-slate-900">{item.pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full`}
                            style={{ width: `${item.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 text-xs">
                  <span className="font-bold text-amber-950 block">Dica Comercial:</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    O Plano Prata é o campeão de vendas em Cachoeiras de Macacu por incluir destaque no Provador VIP.
                  </p>
                </div>
              </div>
            </div>

            {/* MEUS ÚLTIMOS CLIENTES CADASTRADOS */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-600" />
                  Últimos Clientes Cadastrados por Você
                </h3>
                <button
                  onClick={() => setActiveTab('new-client')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Novo Cadastro</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {myClients.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Você ainda não cadastrou nenhum cliente. Clique na aba acima para iniciar seu primeiro cadastro!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myClients.slice(0, 6).map((cli) => (
                    <div
                      key={cli.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                            {cli.clientType}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cli.billingStatus === 'ATIVO_PAGO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cli.billingStatus === 'BOLETO_ENVIADO'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {cli.billingStatus === 'ATIVO_PAGO'
                              ? 'Ativo & Pago'
                              : cli.billingStatus === 'BOLETO_ENVIADO'
                              ? 'Boleto Enviado'
                              : 'Aguardando Boleto'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{cli.tradeName}</h4>
                        <span className="text-[11px] text-slate-500">Resp: {cli.name}</span>
                        <p className="text-[11px] text-blue-700 font-bold mt-1">
                          Plano {cli.chosenPlan}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{cli.neighborhood}</span>
                        <a
                          href={`https://wa.me/55${cli.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB: ORGANOGRAMA OFICIAL DO SISTEMA */}
        {/* ========================================================================= */}
        {activeTab === 'organogram' && (
          <div className="space-y-6 mt-6">
            {/* BANNER INSTITUCIONAL BEX */}
            <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 rounded-3xl shadow-md border border-blue-500/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      Estrutura Oficial de Vendas & Comissões
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Bex Serviços e Comércios
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Organograma Comercial do Sistema Achei Aqui
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
                    Entenda o fluxo completo de credenciamento, cobrança via PIX oficial (CNPJ 30.810.800/0001-39) e as regras específicas para cada categoria cadastrada.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('new-client')}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Iniciar Novo Cadastro</span>
                </button>
              </div>
            </div>

            {/* FLUXOGRAMA HIERÁRQUICO */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-8">
              {/* NÍVEL 1: MATRIZ / MASTER SUPREMO */}
              <div className="flex flex-col items-center text-center">
                <div className="w-full max-w-lg bg-slate-900 text-white p-5 rounded-2xl border-2 border-blue-500 shadow-md relative">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm mb-2 shadow-sm">
                    ADM
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    {SALES_ORGANOGRAM_CONFIG.beneficiary}
                  </h3>
                  <p className="text-xs text-blue-300 font-mono mt-0.5">
                    CNPJ Oficial: {SALES_ORGANOGRAM_CONFIG.officialCnpj}
                  </p>
                  <span className="mt-2 inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-[10px] font-bold border border-blue-400/30">
                    Chave Pix Central do App: {SALES_ORGANOGRAM_CONFIG.pixKeyClean}
                  </span>
                </div>

                {/* LINHA CONECTORA */}
                <div className="w-0.5 h-8 bg-blue-400 my-1"></div>

                {/* NÍVEL 2: VENDEDOR / CONSULTOR COMERCIAL */}
                <div className="w-full max-w-md bg-linear-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-md border-2 border-blue-300">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Briefcase className="w-5 h-5 text-amber-300" />
                    <h4 className="font-black text-sm uppercase tracking-wide">
                      Vendedor Comercial (Você: {agent.name})
                    </h4>
                  </div>
                  <p className="text-xs text-blue-100">
                    Cadastra clientes, prestadores e lojistas em campo e gera o QR Code Pix do sistema.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-xs">
                    <Percent className="w-3.5 h-3.5" />
                    <span>COMISSÃO OFICIAL: 5% DO VALOR TOTAL DO PLANO VENDIDO</span>
                  </div>
                </div>

                {/* LINHA CONECTORA TRIPLA */}
                <div className="w-0.5 h-8 bg-slate-300 my-1"></div>
              </div>

              {/* NÍVEL 3: OS 3 TIPOS DE CADASTRO */}
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider text-center mb-4">
                  Os Três Ramos Oficiais de Cadastro & Suas Regras
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* CARD 1: CLIENTE / USUÁRIO COMUM */}
                  <div className="bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 text-[10px] font-black uppercase">
                          100% Gratuito
                        </span>
                        <UserCheck className="w-5 h-5 text-emerald-700" />
                      </div>

                      <div>
                        <h5 className="text-base font-black text-emerald-950">
                          1. Cliente / Usuário Comum
                        </h5>
                        <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                          Consumidor final do aplicativo
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Taxa de Cadastro:</span>
                          <span className="font-black text-emerald-700 text-sm">R$ 0,00</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Mensalidade:</span>
                          <span className="font-black text-emerald-700">R$ 0,00 (Isento)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Comissão Vendedor:</span>
                          <span className="font-bold text-slate-500">R$ 0,00</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-emerald-900 font-medium bg-emerald-100/50 p-3 rounded-xl">
                        <p className="font-bold text-emerald-950 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Permissões do Usuário:
                        </p>
                        <p>• Comprar produtos no Marketplace</p>
                        <p>• Solicitar orçamentos e agendamentos</p>
                        <p>• Visualizar lojas e provador virtual</p>
                      </div>

                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900">
                        <p className="font-black text-red-950 flex items-center gap-1 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          Restrição Comercial Estrita:
                        </p>
                        <p>
                          Não tem direito de postar nenhum produto, não pode cadastrar serviços, não pode inserir banners e não pode interagir no app de forma comercial.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setClientType('USUARIO');
                        setActiveTab('new-client');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cadastrar Usuário Grátis
                    </button>
                  </div>

                  {/* CARD 2: PRESTADOR DE SERVIÇOS */}
                  <div className="bg-amber-50/60 border-2 border-amber-400 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-950 text-[10px] font-black uppercase">
                          Taxa Fixa R$ 29,90
                        </span>
                        <Wrench className="w-5 h-5 text-amber-700" />
                      </div>

                      <div>
                        <h5 className="text-base font-black text-amber-950">
                          2. Prestador de Serviços
                        </h5>
                        <p className="text-xs text-amber-900 font-semibold mt-0.5">
                          Eletricistas, encanadores, mecânicos, diaristas...
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-amber-300 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Assinatura Mensal:</span>
                          <span className="font-black text-amber-800 text-sm">R$ 29,90/mês</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Serviço Incluso:</span>
                          <span className="font-bold text-slate-800">1 serviço ativo</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Serviço Adicional:</span>
                          <span className="font-bold text-amber-900">+ R$ 9,90/mês cada</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-700 font-bold">Comissão Vendedor (5%):</span>
                          <span className="font-black text-emerald-600">R$ 1,50</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-amber-950 font-medium bg-amber-100/50 p-3 rounded-xl">
                        <p className="font-bold text-amber-950 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          Regras Determinadas:
                        </p>
                        <p>• Sujeito às regras comerciais da plataforma</p>
                        <p>• Pode postar um único serviço no plano base</p>
                        <p>• A partir disso, será cobrado R$ 9,90 além para cada serviço adicional</p>
                        <p>• Cobrança via Pix oficial do app (CNPJ 30810800000139)</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setClientType('PRESTADOR');
                        setActiveTab('new-client');
                      }}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cadastrar Prestador (R$ 29,90)
                    </button>
                  </div>

                  {/* CARD 3: LOJISTA COMERCIAL */}
                  <div className="bg-blue-50/60 border-2 border-blue-300 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-blue-200 text-blue-950 text-[10px] font-black uppercase">
                          Lojista Escolhe Plano
                        </span>
                        <Store className="w-5 h-5 text-blue-700" />
                      </div>

                      <div>
                        <h5 className="text-base font-black text-blue-950">
                          3. Lojista Comercial
                        </h5>
                        <p className="text-xs text-blue-900 font-semibold mt-0.5">
                          Lojas de roupas, calçados, autopeças, óticas...
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Plano Bronze:</span>
                          <span className="font-bold text-slate-800">R$ 19,90 (Comissão: R$ 1,00)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Plano Ouro:</span>
                          <span className="font-bold text-slate-800">R$ 49,90 (Comissão: R$ 2,50)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Plano Prata:</span>
                          <span className="font-bold text-slate-800">R$ 59,90 (Comissão: R$ 3,00)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 font-medium">Plano Premium:</span>
                          <span className="font-bold text-slate-800">R$ 199,90 (Comissão: R$ 10,00)</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-700 font-bold">Comissão Vendedor:</span>
                          <span className="font-black text-emerald-600">5% do valor do plano</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-blue-950 font-medium bg-blue-100/50 p-3 rounded-xl">
                        <p className="font-bold text-blue-950 flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          Finalização & Pix:
                        </p>
                        <p>• Vendedor finaliza o cadastro e gera QR Code</p>
                        <p>• Pix gerado com CNPJ 30810800000139</p>
                        <p>• Sinalização em tempo real da comissão de 5%</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setClientType('LOJISTA');
                        setActiveTab('new-client');
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cadastrar Lojista (Escolher Plano)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: NOVO CADASTRO & GERAR PIX OFICIAL */}
        {/* ========================================================================= */}
        {activeTab === 'new-client' && (
          <div className="max-w-3xl mx-auto mt-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 tracking-wider">
                    Organograma Oficial • Bex Serviços e Comércios
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Chave Pix do Sistema: <strong className="font-mono text-slate-800">{SALES_ORGANOGRAM_CONFIG.pixKeyClean}</strong>
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 mt-1 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Cadastrar Cliente, Prestador ou Lojista
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha os dados abaixo. Para Prestador ou Lojista, o sistema gera o QR Code Pix oficial na hora e sinaliza sua comissão de 5%.
                </p>
              </div>

              <form onSubmit={handleRegisterClientSubmit} className="space-y-5 text-xs">
                {/* 1. SELEÇÃO DO TIPO DE CADASTRO CONFORME O ORGANOGRAMA */}
                <div>
                  <label className="font-bold text-slate-800 block mb-2 text-xs">
                    Selecione a Categoria no Organograma Comercial:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* OPÇÃO 1: USUÁRIO COMUM */}
                    <button
                      type="button"
                      onClick={() => setClientType('USUARIO')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        clientType === 'USUARIO'
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs ring-2 ring-emerald-400/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs block">Cliente Comum</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                          Grátis (R$ 0,00)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block leading-tight">
                        Sem mensalidades. Somente compras no app. Não pode postar produtos nem banners.
                      </span>
                    </button>

                    {/* OPÇÃO 2: PRESTADOR DE SERVIÇOS */}
                    <button
                      type="button"
                      onClick={() => setClientType('PRESTADOR')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        clientType === 'PRESTADOR'
                          ? 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-xs ring-2 ring-amber-400/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs block">Prestador Serviços</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-950">
                          Fixo R$ 29,90
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block leading-tight">
                        1 serviço incluso. Extra: +R$ 9,90 cada. Pix oficial CNPJ. Comissão 5% (R$ 1,50).
                      </span>
                    </button>

                    {/* OPÇÃO 3: LOJISTA COMERCIAL */}
                    <button
                      type="button"
                      onClick={() => setClientType('LOJISTA')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        clientType === 'LOJISTA'
                          ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-xs ring-2 ring-blue-400/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs block">Lojista Comercial</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-200 text-blue-900">
                          Escolhe Plano
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block leading-tight">
                        Comércio físico. Escolhe o plano mensal. Pix oficial CNPJ. Comissão 5% do plano.
                      </span>
                    </button>
                  </div>
                </div>

                {/* BANNER DINÂMICO DE REGRAS EXPLICATIVAS */}
                {isUserRegistration && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-emerald-950 text-xs">
                        Regra de Cadastro de Usuário / Consumidor:
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        O cadastro de usuário é <strong>100% gratuito (R$ 0,00)</strong> e não possui mensalidades. 
                        O usuário tem acesso liberado para fazer compras, pedidos e agendamentos no app. 
                        <strong>Atenção:</strong> Clientes compradores não têm direito de postar nenhum produto, 
                        nem inserir banners, nem interagir de forma comercial no aplicativo.
                      </p>
                    </div>
                  </div>
                )}

                {isProviderRegistration && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950 text-xs">
                        Regra de Cadastro de Prestador de Serviços:
                      </p>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        O prestador de serviços paga o valor <strong>fixo de R$ 29,90</strong>. Ele estará sujeito às regras já determinadas, 
                        podendo postar <strong>um único serviço</strong>. A partir disso, será cobrado <strong>R$ 9,90 além para cada serviço adicional</strong>. 
                        O pagamento é via Pix oficial do app (CNPJ 30810800000139) e você, vendedor, recebe <strong>5% de comissão (R$ 1,50)</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {isMerchantRegistration && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
                    <Store className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-blue-950 text-xs">
                        Regra de Cadastro de Lojista Comercial:
                      </p>
                      <p className="text-[11px] text-blue-900 leading-relaxed">
                        O lojista escolhe o plano de acordo com o tamanho do catálogo. Ao finalizar, o sistema gera o QR Code Pix oficial do app 
                        (Chave CNPJ 30810800000139 - Bex Serviços e Comércios) sinalizando imediatamente para o vendedor a 
                        <strong> comissão de 5% do valor total do plano vendido</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. DADOS DO CLIENTE / ESTABELECIMENTO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Nome Completo do Responsável:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isUserRegistration ? 'Apelido / Como prefere ser chamado:' : 'Nome Comercial / Nome Fantasia:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isUserRegistration ? 'Ex: Carlos Oliveira' : 'Ex: Auto Peças Macacu'}
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isMerchantRegistration ? 'CNPJ ou CPF:' : 'CPF do Titular:'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isMerchantRegistration ? '00.000.000/0001-00' : '000.000.000-00'}
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      WhatsApp / Celular:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(21) 99999-8888"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      E-mail de Contato:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contato@exemplo.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Bairro em Cachoeiras de Macacu:
                    </label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Centro, Papucaia, Castália, Japuíba..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Cidade de Atuação:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={city}
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* 3. SE FOR LOJISTA: ESCOLHA DO PLANO */}
                {isMerchantRegistration && (
                  <div className="pt-2">
                    <label className="font-bold text-slate-700 block mb-2">
                      Indique o Plano Escolhido pelo Lojista:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          tier: 'BRONZE' as const,
                          name: 'Plano Bronze',
                          price: 19.90,
                          desc: 'Catálogo básico + WhatsApp',
                          comm: 'R$ 1,00'
                        },
                        {
                          tier: 'OURO' as const,
                          name: 'Plano Ouro',
                          price: 49.90,
                          desc: 'Destaque regional + vitrine',
                          comm: 'R$ 2,50'
                        },
                        {
                          tier: 'PRATA' as const,
                          name: 'Plano Prata',
                          price: 59.90,
                          desc: 'Provador VIP + 50 produtos',
                          comm: 'R$ 3,00'
                        },
                        {
                          tier: 'PREMIUM' as const,
                          name: 'Plano Premium',
                          price: 199.90,
                          desc: 'Banners exclusivos + topo',
                          comm: 'R$ 10,00'
                        }
                      ].map((plan) => (
                        <button
                          type="button"
                          key={plan.tier}
                          onClick={() => setChosenPlan(plan.tier)}
                          className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            chosenPlan === plan.tier
                              ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-black text-xs text-slate-900 block">
                            {plan.name}
                          </span>
                          <span className="text-sm font-black text-blue-700 block mt-0.5">
                            R$ {plan.price.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal">/mês</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-1">
                            {plan.desc}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-600 block mt-2 pt-1 border-t border-slate-100">
                            Comissão (5%): {plan.comm}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. SINALIZAÇÃO DE VALOR E COMISSÃO DO VENDEDOR */}
                {!isUserRegistration && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">
                          Valor da Assinatura / Plano:
                        </span>
                        <span className="text-2xl font-black text-slate-950 mt-0.5 block">
                          R$ {selectedPlanPrice.toFixed(2)}
                          <span className="text-xs font-normal text-slate-500"> /mês</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isProviderRegistration 
                            ? 'Inclui 1 serviço. Serviços adicionais: R$ 9,90 cada'
                            : `Plano ${chosenPlan} selecionado`}
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-emerald-300 text-right shadow-xs">
                        <span className="text-[10px] uppercase font-black text-slate-500 block">
                          Sua Comissão Sinalizada (5%)
                        </span>
                        <span className="text-xl font-black text-emerald-600 block mt-0.5">
                          R$ {calculatedCommission}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Pix Oficial: {SALES_ORGANOGRAM_CONFIG.beneficiary}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span>
                        Ao clicar no botão abaixo, o <strong>QR Code Pix</strong> com o CNPJ <strong>30810800000139</strong> será gerado na hora para o cliente pagar.
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Observações Internas (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Cliente prefere pagar no dia 10 e quer receber o comprovante no WhatsApp."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-3 font-black rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer ${
                      isUserRegistration
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : isProviderRegistration
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span>
                      {isUserRegistration
                        ? 'Finalizar Cadastro Gratuito (R$ 0,00)'
                        : isProviderRegistration
                        ? `Finalizar Cadastro & Gerar QR Code PIX (R$ ${selectedPlanPrice.toFixed(2)})`
                        : `Finalizar Cadastro & Gerar QR Code PIX (R$ ${selectedPlanPrice.toFixed(2)})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: MEUS BOLETOS & COMISSÕES */}
        {/* ========================================================================= */}
        {activeTab === 'my-boletos' && (
          <div className="space-y-4 mt-6">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar boleto por cliente, código ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <button
                onClick={() => setActiveTab('new-client')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Cadastro & Boleto</span>
              </button>
            </div>

            {/* LIST */}
            <div className="space-y-3">
              {myBoletos.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-sm text-slate-800">
                    Nenhuma solicitação de boleto ativa
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cadastre um novo lojista ou cliente para iniciar a emissão de boletos.
                  </p>
                </div>
              ) : (
                myBoletos
                  .filter(
                    (b) =>
                      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      b.documentNumber.includes(searchTerm)
                  )
                  .map((bol) => (
                    <div
                      key={bol.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                            {bol.code}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              bol.status === 'PENDENTE_EMISSAO'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : bol.status === 'BOLETO_ENVIADO'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : bol.status === 'PAGAMENTO_CONFIRMADO'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {bol.status === 'PENDENTE_EMISSAO'
                              ? '⏳ Aguardando Envio pelo Master'
                              : bol.status === 'BOLETO_ENVIADO'
                              ? '📬 Boleto Enviado ao Cliente'
                              : bol.status === 'PAGAMENTO_CONFIRMADO'
                              ? '✅ Pagamento Confirmado'
                              : '❌ Cancelado'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <span>
                            Vencimento:{' '}
                            <strong className="text-slate-800">
                              {new Date(bol.dueDate).toLocaleDateString('pt-BR')}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* DATA GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Cliente
                          </span>
                          <span className="font-black text-slate-900 block text-sm">
                            {bol.clientName}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            CPF/CNPJ: {bol.documentNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {bol.clientPhone} • {bol.neighborhood}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Plano Contratado
                          </span>
                          <span className="font-black text-blue-950 block text-sm">
                            {bol.planTitle}
                          </span>
                          <span className="text-sm font-black text-slate-800">
                            R$ {bol.amount.toFixed(2)} ({bol.billingFrequency})
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Sua Comissão
                          </span>
                          <span className="text-base font-black text-emerald-600 block">
                            R$ {bol.commissionAmount.toFixed(2)}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              bol.commissionStatus === 'PENDENTE'
                                ? 'bg-amber-100 text-amber-800'
                                : bol.commissionStatus === 'LIBERADA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : bol.commissionStatus === 'PAGA'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {bol.commissionStatus === 'PENDENTE'
                              ? 'Aguardando Pagamento do Cliente'
                              : bol.commissionStatus === 'LIBERADA'
                              ? 'Liberada (Aguardando Pix)'
                              : bol.commissionStatus === 'PAGA'
                              ? 'Comissão Paga via Pix'
                              : 'Cancelada'}
                          </span>
                        </div>
                      </div>

                      {/* BARCODE / HELPER FOR SELLER TO ASSIST CLIENT */}
                      {bol.barcodeDigits && (
                        <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-blue-900 block">
                                Linha Digitável do Boleto para Envio ao Cliente:
                              </span>
                              <code className="text-[11px] font-mono font-bold text-slate-800 select-all block truncate">
                                {bol.barcodeDigits}
                              </code>
                            </div>
                            <button
                              onClick={() => handleCopy(bol.barcodeDigits!, bol.id)}
                              className="px-3 py-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                            >
                              {copiedId === bol.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedId === bol.id ? 'Copiado!' : 'Copiar Código'}</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 text-[11px]">
                            <span className="text-slate-500">
                              Ajude seu cliente enviando um lembrete direto no WhatsApp:
                            </span>
                            <a
                              href={`https://wa.me/55${bol.clientPhone.replace(
                                /\D/g,
                                ''
                              )}?text=Ol%C3%A1%20${encodeURIComponent(
                                bol.clientName
                              )}!%20Aqui%20%C3%A9%20${encodeURIComponent(
                                agent.name
                              )}%20do%20Achei%20Aqui.%20Segue%20a%20linha%20digit%C3%A1vel%20do%20seu%20boleto%20${encodeURIComponent(
                                bol.code
                              )}:%20${encodeURIComponent(bol.barcodeDigits)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Enviar no WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* PIX RECEIPT IF COMMISSION IS PAID */}
                      {bol.commissionStatus === 'PAGA' && bol.commissionPaymentReceipt && (
                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
                          <span className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Comissão de R$ {bol.commissionAmount.toFixed(2)} repassada via Pix pelo
                            Master!
                          </span>
                          <span className="font-mono text-[11px] text-emerald-800">
                            Comprovante: {bol.commissionPaymentReceipt}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: METAS LANÇADAS PELO MASTER */}
        {/* ========================================================================= */}
        {activeTab === 'my-goals' && (
          <div className="space-y-4 mt-6">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Campanhas & Metas Lançadas pelo Administrador Master
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bata as metas mensais para receber premiações adicionais no Pix além da sua comissão contratual padrão.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commercialGoals.map((goal) => {
                const percent = Math.min(
                  100,
                  Math.round((myClients.length / goal.targetCount) * 100)
                );
                return (
                  <div
                    key={goal.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800">
                          {goal.targetMonth}
                        </span>
                        <h4 className="font-black text-base text-slate-900 mt-1">{goal.title}</h4>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Prazo final: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                        {percent}%
                      </div>
                    </div>

                    {/* PROGRESS */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Seus Cadastros Atuais:</span>
                        <span className="text-indigo-700">
                          {myClients.length} de {goal.targetCount} cadastros
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* BONUS PRIZE */}
                    <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs flex items-center space-x-3">
                      <Award className="w-6 h-6 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">
                          Bônus / Premiação Especial do Master
                        </span>
                        <span className="font-extrabold text-amber-950 text-xs">
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
        {/* SUBTAB 5: ORGANOGRAMA & EQUIPE */}
        {/* ========================================================================= */}
        {activeTab === 'team' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 mt-6 space-y-6">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Estrutura & Posição na Força Comercial
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Você faz parte da equipe comercial oficial do Achei Aqui em Cachoeiras de Macacu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesAgents.map((ag) => (
                <div
                  key={ag.id}
                  className={`p-4 rounded-xl border transition-all ${
                    ag.id === agent.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={ag.avatar}
                      alt={ag.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900">{ag.name}</h4>
                        {ag.id === agent.id && (
                          <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block">{ag.roleTitle}</span>
                      <span className="text-[10px] text-blue-700 font-bold block">
                        Região: {ag.assignedRegion}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL OFICIAL: QR CODE PIX DO SISTEMA (CNPJ 30810800000139) */}
      {/* ========================================================================= */}
      {pixModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* HEADER */}
            <div className="bg-linear-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 relative">
              <button
                onClick={() => {
                  setPixModalData(null);
                  setActiveTab('my-boletos');
                }}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-slate-950">
                  PIX Oficial do Sistema
                </span>
                <span className="text-[10px] text-blue-200">
                  CNPJ: 30810800000139
                </span>
              </div>

              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <QrCode className="w-6 h-6 text-amber-300" />
                QR Code PIX Gerado com Sucesso!
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                Apresente o QR Code ao cliente ou envie o código Copia e Cola no WhatsApp para pagamento imediato.
              </p>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-5">
              {/* CARD DE DADOS DA TRANSAÇÃO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Cliente / Estabelecimento:</span>
                  <span className="font-black text-slate-900">{pixModalData.clientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Plano / Categoria:</span>
                  <span className="font-bold text-slate-800">{pixModalData.planTitle}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-600 font-bold">Valor Total a Pagar:</span>
                  <span className="text-xl font-black text-blue-700">
                    R$ {pixModalData.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-900 block">
                      Sua Comissão (5% do Valor Total):
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Sinalizada ao vendedor no sistema
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-700">
                    R$ {pixModalData.commissionAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* QR CODE DISPLAY */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                <img
                  src={pixModalData.qrCodeUrl}
                  alt="QR Code Pix do Sistema Achei Aqui"
                  className="w-48 h-48 rounded-xl bg-white p-2 shadow-sm border border-slate-200"
                />
                <span className="text-[11px] font-bold text-slate-700 mt-2">
                  Beneficiário Oficial: {pixModalData.beneficiary}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Chave Pix CNPJ: {pixModalData.pixKey}
                </span>
              </div>

              {/* COPIA E COLA */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Código Pix Copia e Cola:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixModalData.pixCopiaECola}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-mono text-slate-700 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(pixModalData.pixCopiaECola, 'modal-pix')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedId === 'modal-pix' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ENVIAR WHATSAPP */}
              {pixModalData.phone && (
                <a
                  href={`https://wa.me/55${pixModalData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá ${pixModalData.clientName}! Segue o código Pix para ativação da sua conta no Achei Aqui:\n\n*Valor:* R$ ${pixModalData.amount.toFixed(2)}\n*Beneficiário:* ${pixModalData.beneficiary}\n*Chave CNPJ:* 30810800000139\n\n*Pix Copia e Cola:*\n${pixModalData.pixCopiaECola}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar Código Pix no WhatsApp do Cliente</span>
                </a>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setPixModalData(null);
                  setActiveTab('my-boletos');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Concluir e Ver Meus Boletos / Cobranças
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
