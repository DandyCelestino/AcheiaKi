import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Bike,
  Car,
  Truck,
  Eye,
  RefreshCw,
  Store,
  User,
  Phone,
  FileText,
  Check,
  Copy,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DeliveryRide, DeliveryRideStatus } from '../../types';
import { getDeliveryStatusConfig } from '../../services/deliveryStateMachine';
import { calculateDeliveryPricing } from '../../services/distanceService';

interface DeliveryApprovalQueueViewProps {
  onNavigateToRide?: (rideId: string) => void;
}

export const DeliveryApprovalQueueView: React.FC<DeliveryApprovalQueueViewProps> = ({
  onNavigateToRide
}) => {
  const {
    deliveryRides,
    deliveryDrivers,
    systemSettings,
    approveDeliveryRide,
    rejectDeliveryRide,
    requestCorrectionDeliveryRide,
    currentUser
  } = useApp();

  // Filtros locais
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDENTES' | 'AGUARDANDO_ANALISE' | 'CORRECAO_SOLICITADA' | 'DISPONIVEL_ENTREGADORES' | 'TODAS'>('PENDENTES');

  // Modais de aÃ§Ã£o
  const [approvingRide, setApprovingRide] = useState<DeliveryRide | null>(null);
  const [rejectingRide, setRejectingRide] = useState<DeliveryRide | null>(null);
  const [correctingRide, setCorrectingRide] = useState<DeliveryRide | null>(null);
  const [viewingDetailRide, setViewingDetailRide] = useState<DeliveryRide | null>(null);

  // Campos dos modais
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [dispatchMode, setDispatchMode] = useState<'RADAR' | 'DRIVER'>('RADAR');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Tarifas vigentes para recÃ¡lculo
  const ratePerKm = systemSettings?.deliveryRatePerKm ?? 1.0;
  const minimumFare = systemSettings?.deliveryMinimumFare ?? 5.0;
  const platformFeeUpTo10Km = systemSettings?.deliveryPlatformFeeUpTo10Km ?? systemSettings?.deliveryPlatformFee ?? 5.0;
  const platformFeeUpTo20Km = systemSettings?.deliveryPlatformFeeUpTo20Km ?? 4.0;
  const platformFeeAbove20Km = systemSettings?.deliveryPlatformFeeAbove20Km ?? 3.5;

  const getPlatformFeeForDistance = (distanceKm: number) =>
    distanceKm <= 10
      ? platformFeeUpTo10Km
      : distanceKm <= 20
        ? platformFeeUpTo20Km
        : platformFeeAbove20Km;
  // Filtragem de solicitaÃ§Ãµes
  const filteredRides = useMemo(() => {
    return deliveryRides.filter((ride) => {
      // Filtro de status
      if (statusFilter === 'PENDENTES') {
        if (ride.status !== 'AGUARDANDO_ANALISE' && ride.status !== 'CORRECAO_SOLICITADA') {
          return false;
        }
      } else if (statusFilter === 'AGUARDANDO_ANALISE') {
        if (ride.status !== 'AGUARDANDO_ANALISE') return false;
      } else if (statusFilter === 'CORRECAO_SOLICITADA') {
        if (ride.status !== 'CORRECAO_SOLICITADA') return false;
      } else if (statusFilter === 'DISPONIVEL_ENTREGADORES') {
        if (ride.status !== 'DISPONIVEL_ENTREGADORES') return false;
      }

      // Filtro de texto
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        ride.rideCode?.toLowerCase().includes(term) ||
        ride.orderCode?.toLowerCase().includes(term) ||
        ride.orderId?.toLowerCase().includes(term) ||
        ride.merchantName?.toLowerCase().includes(term) ||
        ride.customerName?.toLowerCase().includes(term) ||
        ride.originAddress?.toLowerCase().includes(term) ||
        ride.destinationAddress?.toLowerCase().includes(term) ||
        ride.destinationNeighborhood?.toLowerCase().includes(term)
      );
    });
  }, [deliveryRides, statusFilter, searchTerm]);

  // Contadores
  const stats = useMemo(() => {
    const aguardando = deliveryRides.filter((r) => r.status === 'AGUARDANDO_ANALISE').length;
    const correcao = deliveryRides.filter((r) => r.status === 'CORRECAO_SOLICITADA').length;
    const liberadas = deliveryRides.filter((r) => r.status === 'DISPONIVEL_ENTREGADORES').length;
    const total = deliveryRides.length;
    return { aguardando, correcao, liberadas, total };
  }, [deliveryRides]);

  // Entregadores elegÃ­veis online para opÃ§Ã£o de despacho direto
  const eligibleDrivers = useMemo(() => {
    return deliveryDrivers.filter((d) => d.status === 'APROVADO' && d.operationalStatus === 'ONLINE');
  }, [deliveryDrivers]);

  // Copiar cÃ³digo
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Ãcone do veÃ­culo
  const renderVehicleBadge = (tipo?: string) => {
    const t = tipo?.toUpperCase();
    if (t === 'CARRO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Car className="w-3.5 h-3.5" />
          Carro
        </span>
      );
    }
    if (t === 'BICICLETA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Bike className="w-3.5 h-3.5" />
          Bicicleta
        </span>
      );
    }
    if (t === 'VAN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Truck className="w-3.5 h-3.5" />
          Van / UtilitÃ¡rio
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Bike className="w-3.5 h-3.5" />
        Moto (PadrÃ£o)
      </span>
    );
  };

  // Submeter aprovaÃ§Ã£o com recÃ¡lculo backend e auditoria
  const handleConfirmApproval = async () => {
    if (!approvingRide) return;
    setIsProcessing(true);
    try {
      const result = await approveDeliveryRide(
        approvingRide.id,
        dispatchMode,
        dispatchMode === 'DRIVER' ? selectedDriverId : undefined
      );
      if (result.success) {
        setApprovingRide(null);
        setDispatchMode('RADAR');
        setSelectedDriverId('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Submeter rejeiÃ§Ã£o
  const handleConfirmRejection = async () => {
    if (!rejectingRide) return;
    if (!rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      const result = await rejectDeliveryRide(rejectingRide.id, rejectionReason);
      if (result.success) {
        setRejectingRide(null);
        setRejectionReason('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Submeter solicitaÃ§Ã£o de correÃ§Ã£o
  const handleConfirmCorrection = async () => {
    if (!correctingRide) return;
    if (!correctionReason.trim()) return;
    setIsProcessing(true);
    try {
      const result = await requestCorrectionDeliveryRide(correctingRide.id, correctionReason);
      if (result.success) {
        setCorrectingRide(null);
        setCorrectionReason('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatar data/hora
  const formatDateTime = (isoOrStr?: string) => {
    if (!isoOrStr) return 'NÃ£o registrada';
    try {
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return isoOrStr;
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoOrStr;
    }
  };

  return (
    <div id="delivery-approval-queue-view" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Controle Operacional Master AcheiAqui
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              SolicitaÃ§Ãµes aguardando anÃ¡lise
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Fila oficial de validaÃ§Ã£o de entregas em Cachoeiras de Macacu. Verifique os dados das rotas,
              recalcule tarifas no backend e libere as corridas no radar de entregadores com registro de auditoria completo.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-center">
              <div className="text-amber-400 text-2xl font-bold">{stats.aguardando}</div>
              <div className="text-amber-200/70 text-xs font-medium mt-0.5">Aguardando AnÃ¡lise</div>
            </div>
            <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-3 text-center">
              <div className="text-orange-400 text-2xl font-bold">{stats.correcao}</div>
              <div className="text-orange-200/70 text-xs font-medium mt-0.5">CorreÃ§Ã£o Pedida</div>
            </div>
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-center">
              <div className="text-emerald-400 text-2xl font-bold">{stats.liberadas}</div>
              <div className="text-emerald-200/70 text-xs font-medium mt-0.5">Liberadas no Radar</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 text-center">
              <div className="text-white text-2xl font-bold">{stats.total}</div>
              <div className="text-slate-400 text-xs font-medium mt-0.5">Total Registradas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Input de Busca */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-approval-queue-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nÂº da entrega, pedido, lojista, cliente, bairro..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="tab-filter-pendentes"
            onClick={() => setStatusFilter('PENDENTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'PENDENTES'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Pendentes ({stats.aguardando + stats.correcao})
          </button>
          <button
            id="tab-filter-aguardando"
            onClick={() => setStatusFilter('AGUARDANDO_ANALISE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'AGUARDANDO_ANALISE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Aguardando AnÃ¡lise ({stats.aguardando})
          </button>
          <button
            id="tab-filter-correcao"
            onClick={() => setStatusFilter('CORRECAO_SOLICITADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'CORRECAO_SOLICITADA'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            CorreÃ§Ã£o Solicitada ({stats.correcao})
          </button>
          <button
            id="tab-filter-disponivel"
            onClick={() => setStatusFilter('DISPONIVEL_ENTREGADORES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'DISPONIVEL_ENTREGADORES'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            No Radar ({stats.liberadas})
          </button>
          <button
            id="tab-filter-todas"
            onClick={() => setStatusFilter('TODAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'TODAS'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todas ({stats.total})
          </button>
        </div>
      </div>

      {/* Lista de SolicitaÃ§Ãµes */}
      {filteredRides.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">Nenhuma solicitaÃ§Ã£o encontrada</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            {statusFilter === 'PENDENTES'
              ? 'NÃ£o hÃ¡ solicitaÃ§Ãµes de entrega pendentes de anÃ¡lise neste momento. Bom trabalho!'
              : 'Nenhum resultado corresponde aos filtros ou ao termo de busca aplicado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRides.map((ride) => {
            const statusConfig = getDeliveryStatusConfig(ride.status);
            const isPendingAnalysis = ride.status === 'AGUARDANDO_ANALISE';
            const isCorrectionRequested = ride.status === 'CORRECAO_SOLICITADA';
            const distance = ride.distanceKm || ride.distancia || 0;
            const vehicle = ride.vehicleType || ride.tipo_veiculo || 'MOTO';
            const totalFee = ride.totalDeliveryFee || ride.valor_calculado || 0;
            const driverEarnings = ride.driverEarnings || ride.valor_entregador || 0;
            const platformCut = ride.platformFeeApplied || (totalFee - driverEarnings) || getPlatformFeeForDistance(ride.distanceKm || ride.distancia || 0);
            const rideNumber = ride.rideCode || `DEL-${ride.id.slice(-5).toUpperCase()}`;
            const orderRef = ride.orderCode || ride.orderId || 'S/N';
            const requestDate = ride.data_solicitacao 
              ? `${ride.data_solicitacao} ${ride.hora_solicitacao || ''}`
              : ride.createdAt || ride.calculationTimestamp;

            return (
              <div
                key={ride.id}
                id={`approval-card-${ride.id}`}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all shadow-md hover:border-slate-700 ${
                  isPendingAnalysis
                    ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/10'
                    : isCorrectionRequested
                    ? 'border-orange-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-orange-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Header do Card com NÃºmero da Entrega, Pedido, Status e Data/Hora */}
                <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Entrega:</span>
                      <span className="text-base font-mono font-bold text-white tracking-wide">
                        {rideNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(rideNumber)}
                        title="Copiar nÃºmero da entrega"
                        className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                      >
                        {copiedCode === rideNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Pedido:</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {orderRef}
                      </span>
                    </div>

                    {renderVehicleBadge(vehicle)}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDateTime(requestDate)}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Corpo do Card com todas as especificaÃ§Ãµes obrigatÃ³rias */}
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Coluna 1: Lojista & Ponto de Coleta (Origem) */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider">
                          Lojista (Origem / Coleta)
                        </div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {ride.merchantName}
                        </div>
                        {ride.merchantPhone && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{ride.merchantPhone}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-1.5 text-xs text-slate-300 mt-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{ride.originAddress || ride.origem || 'EndereÃ§o da loja'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Cliente & Destino */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                          Cliente (Destino / Entrega)
                        </div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {ride.customerName}
                        </div>
                        {ride.customerPhone && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{ride.customerPhone}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-1.5 text-xs text-slate-300 mt-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ride.destinationAddress || ride.destino || 'EndereÃ§o do cliente'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 3: MÃ©tricas (DistÃ¢ncia, Valor da Entrega, RemuneraÃ§Ã£o Entregador) */}
                  <div className="lg:col-span-4 bg-slate-950/50 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                        <span>Detalhamento TarifÃ¡rio</span>
                        <span className="text-indigo-400 font-mono font-bold">
                          {distance.toFixed(1)} km
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>RemuneraÃ§Ã£o Entregador:</span>
                          <span className="font-semibold text-emerald-400 font-mono">
                            R$ {driverEarnings.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Taxa Central AcheiAqui:</span>
                          <span className="font-mono">R$ {platformCut.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-800 my-1" />
                        <div className="flex items-center justify-between text-white font-bold text-sm">
                          <span>Valor Total Entrega:</span>
                          <span className="text-emerald-400 font-mono">
                            R$ {totalFee.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Tarifa base: R$ {ratePerKm.toFixed(2)}/km</span>
                      <span className="text-slate-500">Cachoeiras de Macacu</span>
                    </div>
                  </div>
                </div>

                {/* ObservaÃ§Ãµes e Motivos de CorreÃ§Ã£o/RejeiÃ§Ã£o */}
                <div className="px-4 sm:px-5 pb-4 space-y-2">
                  {ride.observacoes && (
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 font-medium">ObservaÃ§Ãµes da Entrega: </strong>
                        <span>{ride.observacoes}</span>
                      </div>
                    </div>
                  )}

                  {ride.correctionRequestedReason && (
                    <div className="bg-orange-950/30 p-3 rounded-lg border border-orange-500/30 flex items-start gap-2 text-xs text-orange-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-orange-400 font-semibold">CorreÃ§Ã£o Solicitada pelo Master: </strong>
                        <span>{ride.correctionRequestedReason}</span>
                        {ride.correctionRequestedAt && (
                          <div className="text-[11px] text-orange-400/70 mt-0.5">
                            Registrado em: {formatDateTime(ride.correctionRequestedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {ride.rejectionReason && (
                    <div className="bg-red-950/30 p-3 rounded-lg border border-red-500/30 flex items-start gap-2 text-xs text-red-200">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-red-400 font-semibold">Motivo da RejeiÃ§Ã£o: </strong>
                        <span>{ride.rejectionReason}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Barra de AÃ§Ãµes Operacionais */}
                <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-details-${ride.id}`}
                      onClick={() => setViewingDetailRide(ride)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      Detalhes & Auditoria
                    </button>

                    {onNavigateToRide && (
                      <button
                        onClick={() => onNavigateToRide(ride.id)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium ml-1"
                      >
                        <span>Abrir no Monitor</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* AÃ§Ãµes principais solicitadas: APROVAR | REJEITAR | SOLICITAR CORREÃ‡ÃƒO */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* SOLICITAR CORREÃ‡ÃƒO */}
                    <button
                      id={`btn-correct-${ride.id}`}
                      onClick={() => {
                        setCorrectingRide(ride);
                        setCorrectionReason(ride.correctionRequestedReason || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-orange-500/30 text-xs font-semibold transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      SOLICITAR CORREÃ‡ÃƒO
                    </button>

                    {/* REJEITAR */}
                    <button
                      id={`btn-reject-${ride.id}`}
                      onClick={() => {
                        setRejectingRide(ride);
                        setRejectionReason(ride.rejectionReason || '');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      REJEITAR
                    </button>

                    {/* APROVAR */}
                    <button
                      id={`btn-approve-${ride.id}`}
                      onClick={() => {
                        setApprovingRide(ride);
                        setDispatchMode('RADAR');
                        setSelectedDriverId('');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      APROVAR
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: APROVAÃ‡ÃƒO DO MASTER COM RECÃLCULO E VALIDAÃ‡Ã•ES (SEÃ‡ÃƒO 6)         */}
      {/* ========================================================================= */}
      {approvingRide && (() => {
        const distance = approvingRide.distanceKm || approvingRide.distancia || 0;
        const recalculated = calculateDeliveryPricing(distance, ratePerKm, getPlatformFeeForDistance(distance), 'Centro', 'Centro', minimumFare, platformFeeUpTo10Km, platformFeeUpTo20Km, platformFeeAbove20Km);
        const isValidDistance = distance > 0 && distance <= 60;
        const isValidOrigin = !!(approvingRide.merchantName && (approvingRide.originAddress || approvingRide.origem));
        const isValidDest = !!(approvingRide.customerName && (approvingRide.destinationAddress || approvingRide.destino));
        const isValidOrder = !!(approvingRide.orderId || approvingRide.orderCode);
        const isValidValues = recalculated.totalDeliveryFee > 0 && recalculated.driverEarnings > 0;
        const allValid = isValidDistance && isValidOrigin && isValidDest && isValidOrder && isValidValues;

        const nextUniqueCode = approvingRide.rideCode?.startsWith('DEL-')
          ? approvingRide.rideCode
          : `DEL-${Math.floor(10000 + Math.random() * 90000)}`;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-b border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      AprovaÃ§Ã£o Operacional do Master
                    </h3>
                    <p className="text-xs text-slate-400">
                      ValidaÃ§Ã£o de dados, recÃ¡lculo de tarifa backend e liberaÃ§Ã£o de entrega
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setApprovingRide(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* ConteÃºdo com os 8 requisitos detalhados */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* 1. Checklist de ValidaÃ§Ã£o de Dados */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    1. ValidaÃ§Ã£o de Dados Cadastrais da Entrega
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <CheckCircle2 className={`w-4 h-4 ${isValidOrigin ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span className="text-slate-300">
                        Origem / Lojista: <strong>{approvingRide.merchantName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <CheckCircle2 className={`w-4 h-4 ${isValidDest ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span className="text-slate-300">
                        Destino / Cliente: <strong>{approvingRide.customerName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <CheckCircle2 className={`w-4 h-4 ${isValidOrder ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span className="text-slate-300">
                        Pedido Vinculado: <strong>{approvingRide.orderCode || approvingRide.orderId}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      <CheckCircle2 className={`w-4 h-4 ${isValidDistance ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span className="text-slate-300">
                        DistÃ¢ncia da Rota: <strong>{distance.toFixed(1)} km</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2, 3 e 4. RecÃ¡lculo TarifÃ¡rio no Backend & ValidaÃ§Ã£o de DistÃ¢ncia e Valores */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-indigo-400" />
                      2. RecÃ¡lculo de Tarifa no Backend & ValidaÃ§Ã£o
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Tarifa Validada
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">DistÃ¢ncia Validada</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {distance.toFixed(1)} km
                      </div>
                      <div className="text-[10px] text-slate-500">Raio Cachoeiras</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Repasse Entregador</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        R$ {recalculated.driverEarnings.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ({distance.toFixed(1)} x R$ {ratePerKm.toFixed(2)})
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Valor Total Entrega</div>
                      <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                        R$ {recalculated.totalDeliveryFee.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">+ R$ {recalculated.platformFee.toFixed(2)} taxa</div>
                    </div>
                  </div>
                </div>

                {/* 5. Identificador Ãšnico da Entrega & Status Alvo */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">5. Identificador Ãšnico da Entrega:</div>
                    <div className="text-sm font-mono font-bold text-white">{nextUniqueCode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">6. PrÃ³ximo Status:</div>
                    <div className="text-xs font-semibold text-emerald-400 font-mono">
                      DISPONIVEL_ENTREGADORES
                    </div>
                  </div>
                </div>

                {/* 8. Modo de DisponibilizaÃ§Ã£o no Portal de Entregadores */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    8. DisponibilizaÃ§Ã£o aos Entregadores Credenciados
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      onClick={() => setDispatchMode('RADAR')}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        dispatchMode === 'RADAR'
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-white ring-1 ring-emerald-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dispatch_mode"
                        checked={dispatchMode === 'RADAR'}
                        onChange={() => setDispatchMode('RADAR')}
                        className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-xs font-bold">Abrir no Radar (PadrÃ£o)</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Disponibiliza no portal para todos os entregadores elegÃ­veis online em Cachoeiras.
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setDispatchMode('DRIVER')}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        dispatchMode === 'DRIVER'
                          ? 'bg-indigo-950/30 border-indigo-500/50 text-white ring-1 ring-indigo-500/50'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dispatch_mode"
                        checked={dispatchMode === 'DRIVER'}
                        onChange={() => setDispatchMode('DRIVER')}
                        className="mt-0.5 text-indigo-500 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold">Direcionar a Entregador</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Atribuir exclusivamente para um profissional especÃ­fico online.
                        </div>
                      </div>
                    </label>
                  </div>

                  {dispatchMode === 'DRIVER' && (
                    <div className="mt-2.5">
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/40 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Selecione um entregador credenciado online...</option>
                        {eligibleDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.vehicleModel} - Placa: {d.vehiclePlate}) - {d.vehicleType}
                          </option>
                        ))}
                      </select>
                      {eligibleDrivers.length === 0 && (
                        <p className="text-[11px] text-amber-400 mt-1">
                          Nenhum entregador estÃ¡ com status ONLINE no momento. Recomenda-se abrir no Radar.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 7. Registro de Auditoria Informativo */}
                <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>7. Registro de Auditoria: </strong>
                    SerÃ¡ gravado registro imutÃ¡vel com ator (
                    {currentUser?.name || 'Master AcheiAqui'}), horÃ¡rio exato, valores recalculados e status
                    atualizado.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setApprovingRide(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-approval-modal"
                  onClick={handleConfirmApproval}
                  disabled={!allValid || isProcessing || (dispatchMode === 'DRIVER' && !selectedDriverId)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  )}
                  CONFIRMAR APROVAÃ‡ÃƒO & LIBERAR
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: REJEITAR SOLICITAÃ‡ÃƒO (EXIGE MOTIVO OBRIGATÃ“RIO)                  */}
      {/* ========================================================================= */}
      {rejectingRide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-red-950/60 to-slate-900 border-b border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Rejeitar SolicitaÃ§Ã£o de Entrega</h3>
                  <p className="text-xs text-red-300/80">
                    Entrega {rejectingRide.rideCode} | Pedido {rejectingRide.orderCode || rejectingRide.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingRide(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-lg text-xs text-red-200">
                <strong>AtenÃ§Ã£o:</strong> Ao rejeitar a solicitaÃ§Ã£o, ela nÃ£o serÃ¡ disponibilizada aos entregadores.
                O motivo informado ficarÃ¡ gravado no log de auditoria e visÃ­vel ao lojista.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Motivo da RejeiÃ§Ã£o (ObrigatÃ³rio) *
                </label>
                <textarea
                  id="rejection-reason-textarea"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: EndereÃ§o de destino fora do municÃ­pio de Cachoeiras de Macacu, carga nÃ£o condizente com veÃ­culos disponÃ­veis, pedido cancelado pelo lojista..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
                {!rejectionReason.trim() && (
                  <p className="text-[11px] text-red-400 mt-1">
                    * Ã‰ obrigatÃ³rio descrever o motivo da rejeiÃ§Ã£o para registrar na auditoria.
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingRide(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-rejection-modal"
                onClick={handleConfirmRejection}
                disabled={!rejectionReason.trim() || isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-red-900/30 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <XCircle className="w-4 h-4 text-white" />
                )}
                CONFIRMAR REJEIÃ‡ÃƒO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SOLICITAR CORREÃ‡ÃƒO (EXIGE MOTIVO OBRIGATÃ“RIO)                    */}
      {/* ========================================================================= */}
      {correctingRide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-orange-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-orange-950/60 to-slate-900 border-b border-orange-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Solicitar CorreÃ§Ã£o de Dados</h3>
                  <p className="text-xs text-orange-300/80">
                    Entrega {correctingRide.rideCode} | Lojista: {correctingRide.merchantName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCorrectingRide(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-950/20 border border-orange-500/20 p-3 rounded-lg text-xs text-orange-200">
                <strong>Como funciona:</strong> A solicitaÃ§Ã£o voltarÃ¡ para o lojista com o status{' '}
                <span className="font-mono font-semibold">CORRECAO_SOLICITADA</span>. O lojista farÃ¡ os ajustes
                necessÃ¡rios e poderÃ¡ reenviar a entrega para anÃ¡lise.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  OrientaÃ§Ãµes de CorreÃ§Ã£o para o Lojista (ObrigatÃ³rio) *
                </label>
                <textarea
                  id="correction-reason-textarea"
                  rows={4}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Ex: Favor informar o nÃºmero do endereÃ§o do cliente e ponto de referÃªncia. O peso estimado ultrapassa o baÃº de motocicleta, favor alterar para Carro/UtilitÃ¡rio..."
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                {!correctionReason.trim() && (
                  <p className="text-[11px] text-orange-400 mt-1">
                    * Descreva as correÃ§Ãµes necessÃ¡rias para que o lojista possa corrigir e reenviar.
                  </p>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setCorrectingRide(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-correction-modal"
                onClick={handleConfirmCorrection}
                disabled={!correctionReason.trim() || isProcessing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-orange-900/30 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-slate-950" />
                )}
                ENVIAR SOLICITAÃ‡ÃƒO DE CORREÃ‡ÃƒO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DETALHES COMPLETOS & HISTÃ“RICO DE AUDITORIA                      */}
      {/* ========================================================================= */}
      {viewingDetailRide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Auditoria & HistÃ³rico da Entrega #{viewingDetailRide.rideCode}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pedido: {viewingDetailRide.orderCode || viewingDetailRide.orderId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDetailRide(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Timeline de auditoria */}
              <div>
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Linha do Tempo de Auditoria ({viewingDetailRide.history?.length || 0} eventos)
                </div>

                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {viewingDetailRide.history?.map((h, idx) => (
                    <div key={idx} className="relative flex items-start gap-3.5 pl-1.5">
                      <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 shrink-0 mt-1 z-10" />
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-indigo-400">{h.status}</span>
                          <span className="text-[11px] text-slate-500">{formatDateTime(h.timestamp)}</span>
                        </div>
                        <p className="text-xs text-slate-200">{h.description}</p>
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Ator: {h.actorName || 'Sistema'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {h.actorRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setViewingDetailRide(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
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


