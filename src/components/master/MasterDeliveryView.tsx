import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryRide, DeliveryDriver, DeliveryDriverStatus } from '../../types';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Package,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Settings,
  Store,
  MapPin,
  ChevronRight,
  Phone,
  Power,
  RotateCcw,
  Sparkles,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { SvgBarChart, SvgPieChart } from '../common/SvgCharts';
import { DeliveryApprovalQueueView } from './DeliveryApprovalQueueView';

export const MasterDeliveryView: React.FC = () => {
  const {
    deliveryRides,
    deliveryDrivers,
    approveDeliveryDriver,
    rejectDeliveryDriver,
    blockDeliveryDriver,
    unblockDeliveryDriver,
    suspendDeliveryDriver,
    cancelDeliveryRide,
    updateDeliveryTariffs,
    systemSettings,
    triggerToast
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'approval_queue' | 'rides' | 'drivers' | 'tariffs' | 'charts'>('approval_queue');
  const [rideStatusFilter, setRideStatusFilter] = useState<string>('all');
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para rejeição ou bloqueio de entregador com motivo
  const [actionDriverModal, setActionDriverModal] = useState<{
    driver: DeliveryDriver;
    action: 'REJECT' | 'BLOCK' | 'SUSPEND';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Modal de auditoria detalhada de uma corrida
  const [selectedRideDetails, setSelectedRideDetails] = useState<DeliveryRide | null>(null);

  // Edição de tarifas
  const [ratePerKmInput, setRatePerKmInput] = useState(
    (systemSettings?.deliveryRatePerKm ?? 1.0).toFixed(2)
  );
  const [platformFeeInput, setPlatformFeeInput] = useState(
    (systemSettings?.deliveryPlatformFee ?? 2.0).toFixed(2)
  );

  // Estatísticas do Radar Master
  const stats = useMemo(() => {
    const totalRides = deliveryRides.length;
    const pendingAnalysisCount = deliveryRides.filter((r) =>
      r.status === 'AGUARDANDO_ANALISE' || r.status === 'CORRECAO_SOLICITADA'
    ).length;
    const activeRides = deliveryRides.filter((r) =>
      ['AGUARDANDO_ENTREGADOR', 'ACEITA', 'EM_COLETA', 'COLETADA', 'EM_TRANSITO'].includes(r.status)
    ).length;
    const completedRides = deliveryRides.filter((r) => r.status === 'FINALIZADA').length;
    const onlineDrivers = deliveryDrivers.filter((d) => d.operationalStatus === 'ONLINE').length;

    const totalDriverEarnings = deliveryRides
      .filter((r) => r.status === 'FINALIZADA')
      .reduce((sum, r) => sum + r.driverEarnings, 0);

    const totalPlatformRevenue = deliveryRides
      .filter((r) => r.status === 'FINALIZADA')
      .reduce((sum, r) => sum + r.platformFee, 0);

    return {
      totalRides,
      pendingAnalysisCount,
      activeRides,
      completedRides,
      onlineDrivers,
      totalDriverEarnings,
      totalPlatformRevenue
    };
  }, [deliveryRides, deliveryDrivers]);

  // Dados para Modo Gráfico de Delivery & Logística
  const deliveryChartsData = useMemo(() => {
    // Veículos
    const vehicleCounts: Record<string, number> = {
      MOTO: 0,
      CARRO: 0,
      BIKE: 0,
      VAN: 0
    };
    deliveryDrivers.forEach((d) => {
      const type = (d.vehicleType || 'MOTO').toUpperCase();
      if (vehicleCounts[type] !== undefined) {
        vehicleCounts[type]++;
      } else {
        vehicleCounts['MOTO']++;
      }
    });
    const vehicleDistribution = [
      { name: 'Motocicleta', value: vehicleCounts.MOTO, color: '#10B981' },
      { name: 'Carro / Utilitário', value: vehicleCounts.CARRO, color: '#3B82F6' },
      { name: 'Bicicleta / E-Bike', value: vehicleCounts.BIKE, color: '#F59E0B' },
      { name: 'Van / Fiorino', value: vehicleCounts.VAN, color: '#8B5CF6' }
    ].filter((i) => i.value > 0);

    // Status Corridas
    const statusCounts: Record<string, number> = {};
    deliveryRides.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    const rideStatusDistribution = [
      { name: 'Finalizada', value: statusCounts['FINALIZADA'] || 0, color: '#10B981' },
      { name: 'Em Trânsito / Rota', value: (statusCounts['EM_TRANSITO'] || 0) + (statusCounts['EM_COLETA'] || 0), color: '#3B82F6' },
      { name: 'Aguardando', value: (statusCounts['AGUARDANDO_ENTREGADOR'] || 0) + (statusCounts['ACEITA'] || 0), color: '#F59E0B' },
      { name: 'Cancelada', value: statusCounts['CANCELADA'] || 0, color: '#EF4444' }
    ].filter((i) => i.value > 0);

    const financialData = [
      { name: 'Repasse Entregadores', valor: stats.totalDriverEarnings },
      { name: 'Receita Plataforma Master', valor: stats.totalPlatformRevenue }
    ];

    return {
      vehicleDistribution: vehicleDistribution.length > 0 ? vehicleDistribution : [{ name: 'Motocicleta', value: 1, color: '#10B981' }],
      rideStatusDistribution: rideStatusDistribution.length > 0 ? rideStatusDistribution : [{ name: 'Aguardando', value: 1, color: '#F59E0B' }],
      financialData
    };
  }, [deliveryDrivers, deliveryRides, stats]);

  // Filtro de Corridas
  const filteredRides = useMemo(() => {
    return deliveryRides.filter((r) => {
      const matchesStatus = rideStatusFilter === 'all' || r.status === rideStatusFilter;
      const matchesSearch =
        !searchQuery ||
        r.rideCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.driverName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [deliveryRides, rideStatusFilter, searchQuery]);

  // Filtro de Entregadores
  const filteredDrivers = useMemo(() => {
    return deliveryDrivers.filter((d) => {
      const matchesStatus = driverStatusFilter === 'all' || d.status === driverStatusFilter;
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.cpf.includes(searchQuery) ||
        d.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [deliveryDrivers, driverStatusFilter, searchQuery]);

  // Handler de aprovação direta de entregador
  const handleApproveDriver = async (driverId: string) => {
    await approveDeliveryDriver(driverId);
  };

  // Handler de envio de ação com motivo (rejeitar, suspender, bloquear)
  const handleConfirmDriverAction = async () => {
    if (!actionDriverModal) return;
    const { driver, action } = actionDriverModal;
    const reason = actionReason.trim() || 'Determinação da equipe Master de segurança operacional.';

    if (action === 'REJECT') {
      await rejectDeliveryDriver(driver.id, reason);
    } else if (action === 'BLOCK') {
      await blockDeliveryDriver(driver.id, reason);
    } else if (action === 'SUSPEND') {
      await suspendDeliveryDriver(driver.id, reason);
    }

    setActionDriverModal(null);
    setActionReason('');
  };

  // Handler para salvar novas tarifas
  const handleSaveTariffs = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(ratePerKmInput);
    const fee = parseFloat(platformFeeInput);

    if (isNaN(rate) || rate <= 0 || isNaN(fee) || fee <= 0) {
      triggerToast('Valores de tarifas inválidos.');
      return;
    }

    await updateDeliveryTariffs(rate, fee);
  };

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO & KPIS LIVE OPS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Bike className="w-6 h-6 text-emerald-600" />
            <span>Supervisão Master de Delivery & Entregadores</span>
          </h2>
          <p className="text-xs text-slate-500">
            Controle operacional de ponta a ponta: corridas em tempo real, credenciamento de motoristas e parametrização financeira.
          </p>
        </div>
      </div>

      {/* KPIS GERAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Corridas Ativas</span>
          <p className="text-2xl font-black text-amber-600">{stats.activeRides}</p>
          <span className="text-[10px] text-amber-700 font-semibold">Em andamento agora</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Finalizadas</span>
          <p className="text-2xl font-black text-emerald-600">{stats.completedRides}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Ciclos concluídos</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Entregadores Online</span>
          <p className="text-2xl font-black text-blue-600">{stats.onlineDrivers}</p>
          <span className="text-[10px] text-blue-700 font-semibold">Disponíveis no radar</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Corridas</span>
          <p className="text-2xl font-black text-slate-900">{stats.totalRides}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Histórico completo</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Repasse Entregadores</span>
          <p className="text-xl font-black text-emerald-600">
            R$ {stats.totalDriverEarnings.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold">R$ 1,00/km liquidado</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Receita Plataforma</span>
          <p className="text-xl font-black text-purple-600">
            R$ {stats.totalPlatformRevenue.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[10px] text-purple-700 font-semibold">R$ 2,00 / solicitação</span>
        </div>
      </div>

      {/* 2. SUB-ABAS MASTER */}
      <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto pb-px">
        <button
          type="button"
          id="btn-subtab-approval-queue"
          onClick={() => setActiveSubTab('approval_queue')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'approval_queue'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Solicitações aguardando análise</span>
          {stats.pendingAnalysisCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
              {stats.pendingAnalysisCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rides')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'rides'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Monitor de Corridas ({deliveryRides.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('drivers')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'drivers'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Credenciamento de Entregadores ({deliveryDrivers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tariffs')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeSubTab === 'tariffs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Parâmetros de Tarifas & Regras V1</span>
        </button>

        <button
          type="button"
          id="btn-subtab-delivery-modo-grafico"
          onClick={() => setActiveSubTab('charts')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
            activeSubTab === 'charts'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Modo Gráfico & Radar Operacional</span>
        </button>
      </div>

      {/* SUB-ABA: FILA DE APROVAÇÃO (SEÇÃO 5 E 6) */}
      {activeSubTab === 'approval_queue' && (
        <DeliveryApprovalQueueView
          onNavigateToRide={(rideId) => {
            setActiveSubTab('rides');
            setRideStatusFilter('all');
            const found = deliveryRides.find((r) => r.id === rideId);
            if (found) setSelectedRideDetails(found);
          }}
        />
      )}

      {/* 3. CONTEÚDO DA SUB-ABA: CORRIDAS */}
      {activeSubTab === 'rides' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Filtrar por Status:</span>
              <select
                value={rideStatusFilter}
                onChange={(e) => setRideStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">Todas as Corridas</option>
                <option value="AGUARDANDO_ENTREGADOR">Aguardando Entregador</option>
                <option value="ACEITA">Aceita</option>
                <option value="EM_COLETA">Em Coleta</option>
                <option value="EM_TRANSITO">Em Trânsito</option>
                <option value="FINALIZADA">Finalizada</option>
                <option value="OCORRENCIA">Ocorrência</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar código, loja, cliente ou entregador..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tabela de Corridas */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredRides.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma corrida encontrada para os filtros selecionados.
              </div>
            ) : (
              filteredRides.map((ride) => (
                <div key={ride.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-sm text-slate-900">{ride.rideCode}</span>
                      <span className="text-xs text-slate-400">• Pedido: {ride.orderCode}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ride.status === 'FINALIZADA'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ride.status === 'AGUARDANDO_ENTREGADOR'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : ride.status === 'CANCELADA'
                            ? 'bg-slate-100 text-slate-500'
                            : ride.status === 'OCORRENCIA'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        ● {ride.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRideDetails(ride)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Ver Timeline & Auditoria
                      </button>

                      {['AGUARDANDO_ENTREGADOR', 'ACEITA'].includes(ride.status) && (
                        <button
                          type="button"
                          onClick={() => cancelDeliveryRide(ride.id, 'Cancelado via painel Master Administrativo')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancelar Corrida
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Origem (Loja):</span>
                      <p className="font-bold text-slate-900">{ride.merchantName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{ride.originAddress}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Destino (Cliente):</span>
                      <p className="font-bold text-slate-900">{ride.customerName}</p>
                      <p className="text-slate-500 text-[11px] truncate">{ride.destinationAddress}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Entregador Alocado:</span>
                      {ride.driverName ? (
                        <div>
                          <p className="font-bold text-emerald-800">{ride.driverName}</p>
                          <p className="text-slate-500 text-[11px]">
                            {ride.driverVehicleType} • Placa: {ride.driverVehiclePlate}
                          </p>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-semibold italic">Aguardando aceite...</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-100 gap-2">
                    <div className="flex items-center space-x-3 text-slate-500">
                      <span>Distância: <strong>{ride.distanceKm.toFixed(1)} km</strong></span>
                      <span>•</span>
                      <span>Repasse Entregador: <strong className="text-emerald-700">R$ {ride.driverEarnings.toFixed(2).replace('.', ',')}</strong></span>
                      <span>•</span>
                      <span>Taxa Plataforma: <strong className="text-purple-700">R$ {ride.platformFee.toFixed(2).replace('.', ',')}</strong></span>
                      <span>•</span>
                      <span>Total: <strong className="text-slate-900">R$ {ride.totalFare.toFixed(2).replace('.', ',')}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Cód. Segurança Cliente:
                      </span>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                        {ride.confirmationCode}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. CONTEÚDO DA SUB-ABA: ENTREGADORES */}
      {activeSubTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Status Cadastral:</span>
              <select
                value={driverStatusFilter}
                onChange={(e) => setDriverStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">Todos os Entregadores</option>
                <option value="PENDENTE">Pendentes de Aprovação</option>
                <option value="APROVADO">Aprovados</option>
                <option value="REPROVADO">Reprovados</option>
                <option value="BLOQUEADO">Bloqueados</option>
                <option value="SUSPENSO">Suspensos</option>
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, CPF ou placa..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredDrivers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhum entregador encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredDrivers.map((driver) => (
                <div key={driver.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4 min-w-[240px]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 text-sm">{driver.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            driver.status === 'APROVADO'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : driver.status === 'PENDENTE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {driver.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            driver.operationalStatus === 'ONLINE'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {driver.operationalStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        CPF: {driver.cpf} • CNH: {driver.cnhNumber} ({driver.cnhCategory}) • Tel: {driver.phone}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Veículo: <strong>{driver.vehicleModel}</strong> ({driver.vehicleType}) • Placa:{' '}
                        <strong className="font-mono text-emerald-800">{driver.vehiclePlate}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Ganhos Acumulados</span>
                      <span className="font-black text-emerald-600 text-sm">
                        R$ {driver.totalEarnings.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{driver.totalDeliveries} entregas</span>
                    </div>

                    {/* Ações Master de Autorização */}
                    <div className="flex items-center space-x-1.5">
                      {driver.status === 'PENDENTE' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveDriver(driver.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionDriverModal({ driver, action: 'REJECT' })}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Reprovar
                          </button>
                        </>
                      )}

                      {driver.status === 'APROVADO' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionDriverModal({ driver, action: 'SUSPEND' })}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors"
                          >
                            Suspender
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionDriverModal({ driver, action: 'BLOCK' })}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors"
                          >
                            Bloquear
                          </button>
                        </>
                      )}

                      {(driver.status === 'BLOQUEADO' || driver.status === 'SUSPENSO') && (
                        <button
                          type="button"
                          onClick={() => unblockDeliveryDriver(driver.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center space-x-1"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Reativar Cadastro</span>
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

      {/* 5. CONTEÚDO DA SUB-ABA: TARIFAS & PARÂMETROS */}
      {activeSubTab === 'tariffs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Parâmetros Oficiais de Precificação V1</h3>
            <p className="text-xs text-slate-500 mt-1">
              Conforme definido no documento do MVP: Remuneração por KM para o entregador e taxa fixa da plataforma Achei Aqui.
            </p>
          </div>

          <form onSubmit={handleSaveTariffs} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Remuneração do Entregador (R$ por KM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.10"
                    min="0.50"
                    value={ratePerKmInput}
                    onChange={(e) => setRatePerKmInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Padrão V1: R$ 1,00 / km</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Taxa da Plataforma por Solicitação (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    min="1.00"
                    value={platformFeeInput}
                    onChange={(e) => setPlatformFeeInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Padrão V1: R$ 2,00 por corrida</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Impacto Operacional das Tarifas:</span>
              </p>
              <p className="text-[11px] text-amber-800">
                A alteração das tarifas afeta imediatamente as novas solicitações de delivery criadas pelos lojistas. Corridas já em andamento mantêm os valores acordados no momento do aceite.
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Salvar Novas Tarifas
            </button>
          </form>
        </div>
      )}

      {/* 5. CONTEÚDO DA SUB-ABA: MODO GRÁFICO & RADAR OPERACIONAL */}
      {activeSubTab === 'charts' && (
        <div id="master-delivery-modo-grafico" className="space-y-6">
          {/* Header Gráfico */}
          <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Modo Gráfico: Logística & Frota de Cachoeiras de Macacu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização da distribuição de modal de transporte, status das corridas e divisão financeira da operação.
                </p>
              </div>
            </div>

            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/40 font-bold">
              {stats.onlineDrivers} Entregadores Online Agora
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gráfico 1: Veículos da Frota */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Distribuição por Modal de Transporte</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Veículos cadastrados pelos parceiros entregadores.
                </p>
              </div>

              <div className="py-4">
                <SvgPieChart
                  data={deliveryChartsData.vehicleDistribution}
                  size={190}
                  innerRadius={45}
                  outerRadius={75}
                  showLegend={true}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
                Total de {deliveryDrivers.length} motoristas credenciados
              </div>
            </div>

            {/* Gráfico 2: Status Operacional das Corridas */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span>Status das Corridas</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proporção de corridas finalizadas, em rota e canceladas.
                </p>
              </div>

              <div className="py-4">
                <SvgPieChart
                  data={deliveryChartsData.rideStatusDistribution}
                  size={190}
                  innerRadius={45}
                  outerRadius={75}
                  showLegend={true}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center font-medium">
                Total de {deliveryRides.length} corridas solicitadas
              </div>
            </div>

            {/* Gráfico 3: Comparativo Financeiro */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span>Repasse vs. Receita Plataforma</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Liquidação aos condutores (R$ 1/km) vs taxa fixa Master (R$ 2).
                </p>
              </div>

              <div className="py-4">
                <SvgBarChart
                  data={deliveryChartsData.financialData}
                  xKey="name"
                  series={[
                    { key: 'valor', name: 'Total Liquidado (R$)', color: '#059669' }
                  ]}
                  height={180}
                  yFormatter={(val) => `R$ ${val.toFixed(0)}`}
                  tooltipFormatter={(val) =>
                    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  }
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>Total Operado:</span>
                <span className="text-slate-900 font-black">
                  {(stats.totalDriverEarnings + stats.totalPlatformRevenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AÇÃO COM MOTIVO (REPROVAR, SUSPENDER, BLOQUEAR ENTREGADOR) */}
      {actionDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-base">
              {actionDriverModal.action === 'REJECT' && 'Reprovar Cadastro do Entregador'}
              {actionDriverModal.action === 'BLOCK' && 'Bloquear Entregador'}
              {actionDriverModal.action === 'SUSPEND' && 'Suspender Entregador Temporariamente'}
            </h3>
            <p className="text-xs text-slate-600">
              Entregador: <strong>{actionDriverModal.driver.name}</strong> ({actionDriverModal.driver.vehiclePlate})
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Justificativa Operacional:</label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Informe o motivo para registro nos logs de auditoria..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActionDriverModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDriverAction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                Confirmar Ação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TIMELINE & AUDITORIA DE CORRIDA */}
      {selectedRideDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Auditoria de Entrega</span>
                <h3 className="font-mono text-lg font-black text-slate-900">{selectedRideDetails.rideCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRideDetails(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 block">Dados Financeiros da Corrida:</span>
                <p className="text-slate-600">
                  Distância: {selectedRideDetails.distanceKm.toFixed(1)} km | Repasse Entregador: R$ {selectedRideDetails.driverEarnings.toFixed(2).replace('.', ',')} | Taxa Plataforma: R$ {selectedRideDetails.platformFee.toFixed(2).replace('.', ',')}
                </p>
                <p className="font-bold text-emerald-800">
                  Total Pago: R$ {selectedRideDetails.totalFare.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 block">Histórico de Eventos / Timeline:</span>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                  {selectedRideDetails.history?.map((evt, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">{evt.status}</span>
                        <span className="text-[10px] text-slate-400">• {new Date(evt.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
