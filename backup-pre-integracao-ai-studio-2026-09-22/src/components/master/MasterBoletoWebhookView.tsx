import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BoletoWebhookEvent, WebhookGateway, BoletoBillingRequest, Order } from '../../types';
import { WEBHOOK_SIMULATION_TEMPLATES } from '../../data/initialWebhookData';
import { simularWebhookAsaas, obterStatusWebhookAsaas } from '../../services/asaasService';
import {
  Webhook,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Play,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Shield,
  Settings,
  Code,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  Sliders,
  Bell,
  Building2,
  UserCheck,
  Send,
  HelpCircle
} from 'lucide-react';

export const MasterBoletoWebhookView: React.FC = () => {
  const {
    webhookEvents,
    webhookConfig,
    updateWebhookConfig,
    processBoletoWebhook,
    reprocessWebhookEvent,
    deleteWebhookEvent,
    clearWebhookLogs,
    boletoRequests,
    salesAgents,
    orders,
    triggerToast
  } = useApp();

  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<'monitor' | 'asaas-orders' | 'simulator' | 'config' | 'docs'>('monitor');
  const [asaasStatusData, setAsaasStatusData] = useState<any>(null);
  const [isTestingAsaas, setIsTestingAsaas] = useState(false);
  const [asaasTestResult, setAsaasTestResult] = useState<any>(null);
  const [selectedOrderIdForAsaas, setSelectedOrderIdForAsaas] = useState<string>('');
  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAndGoLive = async () => {
    if (!window.confirm('Confirma a inicialização oficial de produção? Isso removerá entidades de teste e zerará os logs de webhook.')) {
      return;
    }
    setIsPurging(true);
    try {
      const resp = await fetch('/api/admin/init-production', { method: 'POST' });
      await resp.json();
      clearWebhookLogs();
      triggerToast('Ambiente de produção inicializado com sucesso! Logs e testes zerados.', 'success');
    } catch (e: any) {
      clearWebhookLogs();
      triggerToast('Logs locais zerados com sucesso.', 'info');
    } finally {
      setIsPurging(false);
    }
  };

  // Carregar status do endpoint do Asaas
  React.useEffect(() => {
    obterStatusWebhookAsaas().then((data) => {
      if (data) setAsaasStatusData(data);
    });
  }, []);

  // Search & Filter in Monitor
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'UNMATCHED' | 'IGNORED'>('ALL');
  const [gatewayFilter, setGatewayFilter] = useState<'ALL' | WebhookGateway>('ALL');

  // Modal / Detail View
  const [selectedEvent, setSelectedEvent] = useState<BoletoWebhookEvent | null>(null);
  const [reprocessBoletoCode, setReprocessBoletoCode] = useState('');

  // Simulator State
  const [simGateway, setSimGateway] = useState<WebhookGateway>('ASAAS');
  const [selectedBoletoId, setSelectedBoletoId] = useState<string>('');
  const [simCustomCode, setSimCustomCode] = useState<string>('');
  const [simPayloadJson, setSimPayloadJson] = useState<string>('');
  const [simHeadersJson, setSimHeadersJson] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    success: boolean;
    message: string;
    event?: BoletoWebhookEvent;
  } | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    triggerToast('Copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Pending/Unpaid boletos for easy simulation selection
  const pendingBoletos = useMemo(() => {
    return boletoRequests.filter((b) => b.status !== 'PAGAMENTO_CONFIRMADO' && b.status !== 'CANCELADO');
  }, [boletoRequests]);

  // Initial population of simulation payload
  const currentBoletoForSim = useMemo(() => {
    if (selectedBoletoId) {
      return boletoRequests.find((b) => b.id === selectedBoletoId);
    }
    return pendingBoletos[0] || boletoRequests[0];
  }, [selectedBoletoId, boletoRequests, pendingBoletos]);

  // Update simulator JSON when gateway or boleto changes
  React.useEffect(() => {
    const template = WEBHOOK_SIMULATION_TEMPLATES[simGateway];
    if (template && currentBoletoForSim) {
      const payload = template.generatePayload(
        currentBoletoForSim.code,
        currentBoletoForSim.amount,
        currentBoletoForSim.clientName
      );
      setSimPayloadJson(JSON.stringify(payload, null, 2));
      setSimHeadersJson(JSON.stringify(template.headers, null, 2));
      setSimCustomCode(currentBoletoForSim.code);
    }
  }, [simGateway, currentBoletoForSim]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return webhookEvents.filter((event) => {
      const matchesSearch =
        !searchTerm ||
        (event.boletoCode && event.boletoCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.clientName && event.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.agentName && event.agentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (event.externalTransactionId && event.externalTransactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        event.statusMessage.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
      const matchesGateway = gatewayFilter === 'ALL' || event.gateway === gatewayFilter;

      return matchesSearch && matchesStatus && matchesGateway;
    });
  }, [webhookEvents, searchTerm, statusFilter, gatewayFilter]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = webhookEvents.length;
    const successCount = webhookEvents.filter((e) => e.status === 'SUCCESS').length;
    const unmatchedCount = webhookEvents.filter((e) => e.status === 'UNMATCHED').length;
    const failedCount = webhookEvents.filter((e) => e.status === 'ERROR').length;
    const totalCommissionsReleased = webhookEvents
      .filter((e) => e.status === 'SUCCESS' && e.commissionReleased)
      .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
    const totalVolumePaid = webhookEvents
      .filter((e) => e.status === 'SUCCESS')
      .reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
    const avgDuration =
      total > 0
        ? Math.round(webhookEvents.reduce((acc, curr) => acc + (curr.durationMs || 100), 0) / total)
        : 0;

    return {
      total,
      successCount,
      unmatchedCount,
      failedCount,
      totalCommissionsReleased,
      totalVolumePaid,
      avgDuration
    };
  }, [webhookEvents]);

  // Execute Simulation
  const handleRunSimulation = () => {
    try {
      setIsSimulating(true);
      const parsedPayload = JSON.parse(simPayloadJson);
      let parsedHeaders: Record<string, string> = {};
      try {
        parsedHeaders = JSON.parse(simHeadersJson || '{}');
      } catch (e) {
        // ignore
      }

      setTimeout(() => {
        const result = processBoletoWebhook({
          gateway: simGateway,
          payload: parsedPayload,
          headers: parsedHeaders,
          manualBoletoCode: simCustomCode
        });

        setSimulationResult({
          success: result.success,
          message: result.message,
          event: result.event
        });
        setIsSimulating(false);
      }, webhookConfig.simulateDelayMs || 250);
    } catch (e: any) {
      setIsSimulating(false);
      triggerToast('Erro na simulação: JSON de payload inválido.');
    }
  };

  // Reprocess single event
  const handleReprocess = (event: BoletoWebhookEvent) => {
    const targetCode = reprocessBoletoCode || event.boletoCode;
    if (!targetCode) {
      triggerToast('Informe o código do boleto para vincular e reprocessar.');
      return;
    }
    const success = reprocessWebhookEvent(event.id, targetCode);
    if (success) {
      setSelectedEvent(null);
      setReprocessBoletoCode('');
      triggerToast('Evento reprocessado com sucesso! Comissão liberada.');
    } else {
      triggerToast('Falha ao reprocessar: código de boleto não encontrado.');
    }
  };

  const getGatewayBadge = (gateway: WebhookGateway) => {
    switch (gateway) {
      case 'ASAAS':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Asaas</span>;
      case 'MERCADO_PAGO':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">Mercado Pago</span>;
      case 'BANCO_INTER':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">Banco Inter</span>;
      case 'IUGU':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Iugu</span>;
      case 'GERENCIANET_EFI':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Efí / Gerencianet</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Generic API</span>;
    }
  };

  const getStatusBadge = (status: BoletoWebhookEvent['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Liquidado & Liberado
          </span>
        );
      case 'UNMATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" /> Boleto Não Encontrado
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" /> Falha no Processamento
          </span>
        );
      case 'IGNORED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <Clock className="w-3.5 h-3.5" /> Ignorado (Healthcheck)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="master-boleto-webhook-module">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium mb-3 border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              Webhook Engine v2.4 • Automação Financeira Ativa
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Webhook className="w-8 h-8 text-emerald-400" />
              Camada de Webhooks de Boletos & Comissões
            </h1>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-3xl">
              Captura em tempo real os avisos de quitação emitidos pelos gateways bancários brasileiros (Asaas, Mercado Pago, Banco Inter, Iugu e Efí),
              atualizando instantaneamente o status da cobrança e liberando a comissão do consultor comercial.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 text-right">
              <span className="text-xs text-emerald-300 uppercase tracking-wider block font-semibold">Endpoint Ativo</span>
              <code className="text-xs text-white font-sans">{webhookConfig.endpointPath}</code>
            </div>
            <button
              onClick={() => setActiveTab('simulator')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Testar Webhook
            </button>
            <button
              onClick={handlePurgeAndGoLive}
              disabled={isPurging}
              className="px-4 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 border border-rose-400/30"
              title="Limpar entidades de testes, zerar logs de webhook e inicializar produção oficial"
            >
              <Trash2 className="w-4 h-4" />
              {isPurging ? 'Inicializando...' : 'Zerar Logs & Go-Live'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Webhook className="w-4 h-4" />
            Logs de Eventos ({webhookEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('asaas-orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'asaas-orders'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            Webhooks Asaas & Pedidos
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Play className="w-4 h-4" />
            Simulador de Gateways
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configurações & Regras
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Code className="w-4 h-4" />
            Documentação de Integração
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Boletos Liquidados
            </span>
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.successCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              de {stats.total} eventos
            </span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
            Volume: R$ {stats.totalVolumePaid.toFixed(2)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Comissões Liberadas
            </span>
            <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              R$ {stats.totalCommissionsReleased.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Liberadas no ato da compensação
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fila de Não Identificados
            </span>
            <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.unmatchedCount}
            </span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
            {stats.unmatchedCount === 0 ? 'Tudo conciliado' : 'Requer conciliação manual'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tempo Médio Execução
            </span>
            <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.avgDuration} ms
            </span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            Execução assíncrona instantânea
          </div>
        </div>
      </div>

      {/* VIEW: MONITOR DE LOGS */}
      {activeTab === 'monitor' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código (ex: BOL-2026-001), cliente, vendedor ou TxID..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todos os Status</option>
                <option value="SUCCESS">Sucesso (Liquidados)</option>
                <option value="UNMATCHED">Não Identificados</option>
                <option value="ERROR">Falha / Erro</option>
                <option value="IGNORED">Ignorado / Healthcheck</option>
              </select>

              <select
                value={gatewayFilter}
                onChange={(e: any) => setGatewayFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">Todos os Gateways</option>
                <option value="ASAAS">Asaas</option>
                <option value="MERCADO_PAGO">Mercado Pago</option>
                <option value="BANCO_INTER">Banco Inter</option>
                <option value="IUGU">Iugu</option>
                <option value="GERENCIANET_EFI">Efí / Gerencianet</option>
                <option value="GENERIC">API Genérica</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Deseja realmente limpar todo o histórico de logs de webhook?')) {
                    clearWebhookLogs();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Logs
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Timestamp / Gateway</th>
                  <th className="px-4 py-3">Boleto / Ref</th>
                  <th className="px-4 py-3">Cliente / Pagador</th>
                  <th className="px-4 py-3">Consultor & Comissão</th>
                  <th className="px-4 py-3">Valor Liquidado</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      Nenhum evento de webhook encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {getGatewayBadge(evt.gateway)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(evt.receivedAt).toLocaleString('pt-BR')} ({evt.durationMs}ms)
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-sans font-bold text-slate-900 dark:text-white">
                          {evt.boletoCode || '—'}
                        </span>
                        {evt.externalTransactionId && (
                          <div className="text-[11px] font-sans text-slate-400 truncate max-w-[140px]" title={evt.externalTransactionId}>
                            TxID: {evt.externalTransactionId}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">
                          {evt.clientName || 'Não identificado'}
                        </div>
                        <div className="text-xs text-slate-400">{evt.eventType}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {evt.agentName || '—'}
                        </div>
                        {evt.commissionAmount ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            + R$ {evt.commissionAmount.toFixed(2)} (Liberada)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {evt.amountPaid ? `R$ ${evt.amountPaid.toFixed(2)}` : '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {getStatusBadge(evt.status)}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                          title="Inspecionar Payload & Headers"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => deleteWebhookEvent(evt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: WEBHOOKS ASAAS & BANCO DE DADOS DE PEDIDOS */}
      {activeTab === 'asaas-orders' && (
        <div className="space-y-6">
          {/* Status & Endpoint Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm md:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Endpoint Oficial do Asaas Ativo
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Processamento Automático de Pagamentos Asaas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                    O endpoint escuta notificações HTTP POST do Asaas em tempo real. Quando o cliente paga via Pix ou cartão, o status do pedido é atualizado automaticamente para <strong>Confirmado (PAGO)</strong>. Caso o prazo expire, o pedido passa automaticamente para <strong>Cancelado (EXPIRADO)</strong>.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Status do Servidor</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    ONLINE (200 OK)
                  </span>
                </div>
              </div>

              {/* Endpoint URLs Box */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Endpoint Principal</span>
                    <code className="text-xs font-sans font-bold text-slate-800 dark:text-slate-200 truncate block">
                      /api/webhooks/asaas
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/api/webhooks/asaas`, 'endpoint-main')}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-600 transition-colors shrink-0 ml-2"
                    title="Copiar URL"
                  >
                    {copiedKey === 'endpoint-main' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase">Endpoint Alternativo (Asaas SDK)</span>
                    <code className="text-xs font-sans font-bold text-slate-800 dark:text-slate-200 truncate block">
                      /api/asaas/webhook
                    </code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/api/asaas/webhook`, 'endpoint-alt')}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-emerald-600 transition-colors shrink-0 ml-2"
                    title="Copiar URL"
                  >
                    {copiedKey === 'endpoint-alt' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Teste Rápido de Webhook */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-sm text-white">Simulador de Eventos Asaas</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  Selecione um pedido e dispare uma notificação idêntica à que o Asaas envia para testar a conciliação automática imediata.
                </p>

                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Selecione o Pedido para Testar
                </label>
                <select
                  value={selectedOrderIdForAsaas}
                  onChange={(e) => setSelectedOrderIdForAsaas(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-3"
                >
                  <option value="">Selecione um pedido...</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber || o.code} - {o.customerName} (R$ {o.totalAmount.toFixed(2)}) • {o.status} / {o.paymentStatus || 'PENDENTE'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  disabled={isTestingAsaas}
                  onClick={async () => {
                    const targetOrd = orders.find((o) => o.id === selectedOrderIdForAsaas) || orders[0];
                    if (!targetOrd) {
                      triggerToast('Crie ou selecione um pedido primeiro.');
                      return;
                    }
                    setIsTestingAsaas(true);
                    try {
                      const res = await simularWebhookAsaas({
                        event: 'PAYMENT_CONFIRMED',
                        orderId: targetOrd.id,
                        orderCode: targetOrd.code || targetOrd.orderNumber,
                        value: targetOrd.totalAmount
                      });
                      setAsaasTestResult(res);
                      triggerToast(`Webhook Asaas Confirmado: Pedido ${targetOrd.orderNumber || targetOrd.code} agora está PAGO!`);
                    } catch (e: any) {
                      triggerToast(`Erro no teste: ${e.message}`);
                    } finally {
                      setIsTestingAsaas(false);
                    }
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isTestingAsaas ? 'Processando...' : 'Simular Confirmação'}
                </button>

                <button
                  disabled={isTestingAsaas}
                  onClick={async () => {
                    const targetOrd = orders.find((o) => o.id === selectedOrderIdForAsaas) || orders[0];
                    if (!targetOrd) {
                      triggerToast('Crie ou selecione um pedido primeiro.');
                      return;
                    }
                    setIsTestingAsaas(true);
                    try {
                      const res = await simularWebhookAsaas({
                        event: 'PAYMENT_OVERDUE',
                        orderId: targetOrd.id,
                        orderCode: targetOrd.code || targetOrd.orderNumber,
                        value: targetOrd.totalAmount
                      });
                      setAsaasTestResult(res);
                      triggerToast(`Webhook Asaas Expirado: Pedido ${targetOrd.orderNumber || targetOrd.code} agora está EXPIRADO!`);
                    } catch (e: any) {
                      triggerToast(`Erro no teste: ${e.message}`);
                    } finally {
                      setIsTestingAsaas(false);
                    }
                  }}
                  className="px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isTestingAsaas ? 'Processando...' : 'Simular Expiração'}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado do Teste Recente */}
          {asaasTestResult && (
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Última Resposta do Webhook Asaas
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-xs font-sans bg-slate-950 p-3 rounded-lg overflow-x-auto text-emerald-300">
                {JSON.stringify(asaasTestResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Tabela de Pedidos e Conciliação Asaas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Base de Pedidos & Conciliação em Tempo Real ({orders.length})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Os status refletem a base de dados sincronizada automaticamente pelas notificações do webhook.
                </p>
              </div>
              <button
                onClick={() => {
                  obterStatusWebhookAsaas().then((data) => {
                    if (data) setAsaasStatusData(data);
                    triggerToast('Dados do webhook atualizados.');
                  });
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3">Código / Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Lojista</th>
                    <th className="px-4 py-3">Valor Total</th>
                    <th className="px-4 py-3">Status Geral</th>
                    <th className="px-4 py-3">Status Pagamento</th>
                    <th className="px-4 py-3">Ações de Teste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {orders.map((ord) => {
                    const isPago = ord.paymentStatus === 'PAGO' || ord.status === 'Confirmado';
                    const isExp = ord.paymentStatus === 'EXPIRADO' || ord.status === 'Cancelado';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-sans font-bold text-slate-900 dark:text-white block">
                            {ord.orderNumber || ord.code}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans">
                            ID: {ord.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900 dark:text-white block">
                            {ord.customerName}
                          </span>
                          <span className="text-[11px] text-slate-400">{ord.customerPhone}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {ord.merchantName}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            Split Plataforma: R$ {(ord.commissionAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          R$ {ord.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              ord.status === 'Confirmado'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : ord.status === 'Cancelado'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-sans ${
                              isPago
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isExp
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {ord.paymentStatus || 'PENDENTE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={async () => {
                              setSelectedOrderIdForAsaas(ord.id);
                              const res = await simularWebhookAsaas({
                                event: 'PAYMENT_CONFIRMED',
                                orderId: ord.id,
                                orderCode: ord.code || ord.orderNumber,
                                value: ord.totalAmount
                              });
                              setAsaasTestResult(res);
                              triggerToast(`Webhook Asaas PAYMENT_CONFIRMED processado com sucesso!`);
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-[11px] transition-colors"
                            title="Disparar confirmação Asaas"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={async () => {
                              setSelectedOrderIdForAsaas(ord.id);
                              const res = await simularWebhookAsaas({
                                event: 'PAYMENT_OVERDUE',
                                orderId: ord.id,
                                orderCode: ord.code || ord.orderNumber,
                                value: ord.totalAmount
                              });
                              setAsaasTestResult(res);
                              triggerToast(`Webhook Asaas PAYMENT_OVERDUE processado com sucesso!`);
                            }}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded font-semibold text-[11px] transition-colors"
                            title="Disparar expiração Asaas"
                          >
                            Expirar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SIMULADOR DE GATEWAYS */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-3">
                <Sliders className="w-4 h-4 text-emerald-500" />
                Parâmetros da Simulação
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Selecione o Gateway de Pagamento
                  </label>
                  <select
                    value={simGateway}
                    onChange={(e: any) => setSimGateway(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ASAAS">Asaas (PAYMENT_RECEIVED)</option>
                    <option value="MERCADO_PAGO">Mercado Pago (payment.updated - Approved)</option>
                    <option value="BANCO_INTER">Banco Inter (Cobrança v2 - PAGO)</option>
                    <option value="IUGU">Iugu (invoice.status_changed - paid)</option>
                    <option value="GERENCIANET_EFI">Efí / Gerencianet (Notificação de Pagamento)</option>
                    <option value="GENERIC">Achei Aqui Direct API (JSON Padrão)</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {WEBHOOK_SIMULATION_TEMPLATES[simGateway]?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Vincular a Boleto Emitido no Sistema
                  </label>
                  <select
                    value={selectedBoletoId}
                    onChange={(e) => setSelectedBoletoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Selecione um boleto emitido...</option>
                    {boletoRequests.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.clientName} (R$ {b.amount.toFixed(2)}) • Status: {b.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Código do Boleto / Referência (Forçar no Payload)
                  </label>
                  <input
                    type="text"
                    value={simCustomCode}
                    onChange={(e) => setSimCustomCode(e.target.value)}
                    placeholder="Ex: BOL-2026-003"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-sans focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Altere para testar o comportamento com códigos não existentes (status UNMATCHED).
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processando Disparo...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Disparar Webhook de Simulação
                      </>
                    )}
                  </button>
                </div>

                {simulationResult && (
                  <div
                    className={`p-4 rounded-xl border text-sm ${
                      simulationResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {simulationResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                      Resultado da Execução:
                    </div>
                    <p className="text-xs">{simulationResult.message}</p>
                    {simulationResult.event && (
                      <div className="mt-2 text-[11px] space-y-1">
                        <div>
                          <strong>ID do Evento:</strong> {simulationResult.event.id}
                        </div>
                        <div>
                          <strong>Tempo de Execução:</strong> {simulationResult.event.durationMs} ms
                        </div>
                        {simulationResult.event.commissionReleased && (
                          <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                            ✓ Comissão de R$ {simulationResult.event.commissionAmount?.toFixed(2)} liberada com sucesso!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-500" />
                  Corpo do Payload JSON Enviado
                </h3>
                <span className="text-xs text-slate-400">Editável em tempo real</span>
              </div>
              <textarea
                value={simPayloadJson}
                onChange={(e) => setSimPayloadJson(e.target.value)}
                rows={16}
                className="w-full font-sans text-xs p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Headers HTTP Simulados
                </div>
                <textarea
                  value={simHeadersJson}
                  onChange={(e) => setSimHeadersJson(e.target.value)}
                  rows={3}
                  className="w-full font-sans text-xs p-2.5 bg-slate-900 text-slate-300 rounded-lg border border-slate-700 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: CONFIGURAÇÕES */}
      {activeTab === 'config' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-500" />
              Configurações da Camada de Webhooks & Automação Financeira
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Defina as regras automáticas de liquidação, credenciais de assinatura e gatilhos disparados na recepção de confirmações.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-700">
            {/* Security & Endpoint */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Segurança e Endpoint de Ingress
              </h4>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  URL do Endpoint Webhook (POST)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://acheiaqui.com.br/api/webhooks/boleto"
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-sans text-slate-800 dark:text-slate-200"
                  />
                  <button
                    onClick={() => copyToClipboard('https://acheiaqui.com.br/api/webhooks/boleto', 'endpoint')}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedKey === 'endpoint' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Chave Secreta de Assinatura (Webhook Secret Key)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={webhookConfig.secretKey}
                    onChange={(e) => updateWebhookConfig({ secretKey: e.target.value })}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-sans text-slate-800 dark:text-slate-200"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookConfig.secretKey, 'secret')}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedKey === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Utilizada na verificação do cabeçalho HMAC / X-Signature dos gateways.
                </span>
              </div>
            </div>

            {/* Automation Rules */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Regras de Disparo Automático
              </h4>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookConfig.autoReleaseCommission}
                    onChange={(e) => updateWebhookConfig({ autoReleaseCommission: e.target.checked })}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Liberar Comissão do Vendedor Imediatamente
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Muda o status da comissão para "LIBERADA" assim que a compensação bancária for confirmada pelo webhook.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookConfig.autoActivateClient}
                    onChange={(e) => updateWebhookConfig({ autoActivateClient: e.target.checked })}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Ativar Cadastro do Cliente Comercial (ATIVO_PAGO)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Muda o status de faturamento do cliente registrado pelo consultor de "PENDENTE_PAGAMENTO" para "ATIVO_PAGO".
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookConfig.autoApproveMerchant}
                    onChange={(e) => updateWebhookConfig({ autoApproveMerchant: e.target.checked })}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Aprovar Perfil do Lojista / Prestador na Plataforma
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Caso o cliente tenha loja ou perfil comercial cadastrado, aprova o status da loja automaticamente.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhookConfig.notifySalesAgentInApp}
                    onChange={(e) => updateWebhookConfig({ notifySalesAgentInApp: e.target.checked })}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                      Notificar Vendedor no App
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Dispara uma notificação in-app em tempo real para o consultor celebrando a liberação da comissão.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DOCUMENTAÇÃO & INSTRUÇÕES DE INTEGRAÇÃO */}
      {activeTab === 'docs' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-500" />
              Guia Prático de Integração de Webhooks para Boletos
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure a URL de notificação diretamente no painel do seu banco ou gateway de cobrança para ativação em produção.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Asaas</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">Recomendado</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No painel Asaas, acesse <strong>Configurações da Conta &gt; Integrações &gt; Webhooks &gt; Cobranças</strong>.
                Ative o evento <code>Cobrança Recebida (PAYMENT_RECEIVED)</code> e aponte para a URL do endpoint Achei Aqui.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-sans text-[11px] text-emerald-400 overflow-x-auto">
                externalReference = "BOL-YYYY-NNN"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Mercado Pago</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-100 text-cyan-800">IPN / Webhook</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No portal de desenvolvedores do Mercado Pago, crie um Webhook para o evento <code>Pagamentos (payment)</code>.
                O campo <code>external_reference</code> conterá o código do boleto emitido.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-sans text-[11px] text-cyan-300 overflow-x-auto">
                external_reference = "BOL-YYYY-NNN"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Banco Inter</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">API Cobrança v2</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Cadastre o webhook via endpoint <code>PUT /cobranca/v2/boletos/webhook</code> do Banco Inter.
                O campo <code>seuNumero</code> mapeará o código do boleto no Achei Aqui.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-sans text-[11px] text-orange-300 overflow-x-auto">
                seuNumero = "BOL-YYYY-NNN"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Iugu</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Faturas</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No painel da Iugu, configure o gatilho <code>invoice.status_changed</code> com filtro de status <code>paid</code>.
                O campo <code>order_id</code> conterá o código do boleto.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-sans text-[11px] text-emerald-300 overflow-x-auto">
                order_id = "BOL-YYYY-NNN"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">5. Efí Bank</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">Gerencianet</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Na Efí, ative as notificações de alteração de status de cobrança informando o parâmetro <code>custom_id</code>
                como o identificador do boleto comercial.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-sans text-[11px] text-purple-300 overflow-x-auto">
                custom_id = "BOL-YYYY-NNN"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">6. API Própria</h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">JSON Direto</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Qualquer sistema de automação ou ERP externo pode postar diretamente um JSON no endpoint informado com
                <code>{"{ boletoCode: 'BOL-...', amount: 49.90 }"}</code>.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg font-sans text-[11px] text-gray-300 overflow-x-auto">
                boletoCode = "BOL-YYYY-NNN"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getGatewayBadge(selectedEvent.gateway)}
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Detalhes do Evento: {selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl">
              <div>
                <span className="text-slate-400 block">Status:</span>
                <span className="font-semibold">{getStatusBadge(selectedEvent.status)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Boleto Vinculado:</span>
                <span className="font-sans font-bold text-slate-800 dark:text-slate-200">
                  {selectedEvent.boletoCode || 'Não identificado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Consultor Comercial:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedEvent.agentName || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Comissão Liberada:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedEvent.commissionAmount ? `R$ ${selectedEvent.commissionAmount.toFixed(2)}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">TxID / Gateway ID:</span>
                <span className="font-sans text-slate-700 dark:text-slate-300">
                  {selectedEvent.externalTransactionId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Data / Duração:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(selectedEvent.receivedAt).toLocaleString('pt-BR')} ({selectedEvent.durationMs} ms)
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Mensagem de Auditoria
              </span>
              <p className="text-xs p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                {selectedEvent.statusMessage}
              </p>
            </div>

            {/* Reprocess action for UNMATCHED */}
            {selectedEvent.status === 'UNMATCHED' && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  Vincular e Reprocessar Evento
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Informe o código do boleto correto para liquidar e liberar a comissão:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reprocessBoletoCode}
                    onChange={(e) => setReprocessBoletoCode(e.target.value)}
                    placeholder="Ex: BOL-2026-003"
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-sans"
                  />
                  <button
                    onClick={() => handleReprocess(selectedEvent)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reprocessar
                  </button>
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Payload JSON Recebido
              </span>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-sans text-xs overflow-x-auto max-h-60">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            {selectedEvent.headers && (
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                  Headers da Requisição
                </span>
                <pre className="p-3 bg-slate-950 text-slate-300 rounded-xl font-sans text-xs overflow-x-auto max-h-32">
                  {JSON.stringify(selectedEvent.headers, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

