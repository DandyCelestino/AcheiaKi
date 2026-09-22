import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryRide, DeliveryOperationalStatus } from '../../types';
import {
  Bike,
  Car,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Power,
  DollarSign,
  Package,
  Navigation,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  LogOut,
  ChevronRight,
  Info,
  Calendar,
  KeyRound,
  Store,
  UserCheck
} from 'lucide-react';

export const DeliveryDriverDashboard: React.FC = () => {
  const {
    currentUser,
    currentDeliveryDriver,
    deliveryDrivers,
    deliveryRides,
    setCurrentEnvironment,
    setDriverOperationalStatus,
    acceptDeliveryRide,
    startRidePickup,
    confirmRideCollected,
    deliverRide,
    reportRideIncident,
    cancelDeliveryRide,
    toastMessage,
    systemSettings
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'history' | 'profile'>('radar');
  const [confirmationCodeInput, setConfirmationCodeInput] = useState('');
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [incidentModalRideId, setIncidentModalRideId] = useState<string | null>(null);
  const [incidentNotes, setIncidentNotes] = useState('');

  // Identifica o perfil do entregador ativo
  const activeDriver = useMemo(() => {
    if (currentDeliveryDriver) {
      const live = deliveryDrivers.find((d) => d.id === currentDeliveryDriver.id);
      return live || currentDeliveryDriver;
    }
    // Fallback se logado como entregador
    return deliveryDrivers.find(
      (d) => d.userId === currentUser?.id || d.email.toLowerCase() === currentUser?.email.toLowerCase()
    ) || deliveryDrivers[0];
  }, [currentDeliveryDriver, deliveryDrivers, currentUser]);

  // Corrida ativa em andamento com este entregador
  const activeRide = useMemo(() => {
    if (!activeDriver) return null;
    return deliveryRides.find(
      (r) =>
        r.driverId === activeDriver.id &&
        ['ACEITA', 'EM_COLETA', 'COLETADA', 'EM_TRANSITO'].includes(r.status)
    );
  }, [activeDriver, deliveryRides]);

  // Corridas disponÃ­veis no radar (abertas e aguardando entregador)
  const availableRides = useMemo(() => {
    return deliveryRides.filter((r) => r.status === 'AGUARDANDO_ENTREGADOR' && !r.driverId);
  }, [deliveryRides]);

  // HistÃ³rico de corridas finalizadas ou atendidas pelo motorista
  const myCompletedRides = useMemo(() => {
    if (!activeDriver) return [];
    return deliveryRides.filter((r) => r.driverId === activeDriver.id && r.status === 'FINALIZADA');
  }, [activeDriver, deliveryRides]);

  // Toggle de status operacional (Online / Offline)
  const handleToggleOnline = async () => {
    if (!activeDriver) return;
    const newStatus: DeliveryOperationalStatus =
      activeDriver.operationalStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    await setDriverOperationalStatus(activeDriver.id, newStatus);
  };

  // Aceitar corrida no radar
  const handleAcceptRide = async (rideId: string) => {
    if (!activeDriver) return;
    await acceptDeliveryRide(rideId, activeDriver.id);
  };

  // Submeter confirmaÃ§Ã£o com cÃ³digo de 4 dÃ­gitos do cliente
  const handleSubmitConfirmationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    setConfirmError(null);

    const res = await deliverRide(activeRide.id, confirmationCodeInput);
    if (res.success) {
      setIsConfirmingDelivery(false);
      setConfirmationCodeInput('');
    } else {
      setConfirmError(res.message);
    }
  };

  // Registrar incidente
  const handleReportIncident = async () => {
    if (!incidentModalRideId || !incidentNotes.trim()) return;
    await reportRideIncident(incidentModalRideId, incidentNotes.trim());
    setIncidentModalRideId(null);
    setIncidentNotes('');
  };

  const isApproved = activeDriver?.status === 'APROVADO';
  const isOnline = activeDriver?.operationalStatus === 'ONLINE';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. TOP BAR DO ENTREGADOR */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-white text-base tracking-tight">Achei Aqui</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Delivery V1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeDriver?.name || 'Entregador Parceiro'} â€¢ {activeDriver?.vehicleType} ({activeDriver?.vehiclePlate})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Status Online Toggle */}
            <button
              id="btn-toggle-driver-online"
              type="button"
              onClick={handleToggleOnline}
              disabled={!isApproved}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black flex items-center space-x-2 transition-all shadow-md ${
                !isApproved
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-white animate-pulse' : 'text-slate-400'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            {/* Voltar ao Marketplace */}
            <button
              type="button"
              onClick={() => setCurrentEnvironment('MARKETPLACE')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Voltar ao Achei Aqui Marketplace"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. AVISOS DE STATUS DO CADASTRO */}
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
        {activeDriver?.status === 'PENDENTE' && (
          <div className="bg-amber-950/50 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200 flex items-start space-x-3 mb-4">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-bold text-amber-300 text-sm">Cadastro em AnÃ¡lise pela AdministraÃ§Ã£o Master</p>
              <p className="text-amber-200/80 mt-1 leading-relaxed">
                Seus documentos (CNH e veÃ­culo) estÃ£o sendo verificados. Assim que aprovado pelo Master, vocÃª poderÃ¡ ficar Online e receber corridas remuneradas em Cachoeiras de Macacu.
              </p>
            </div>
          </div>
        )}

        {(activeDriver?.status === 'BLOQUEADO' || activeDriver?.status === 'SUSPENSO') && (
          <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-4 text-xs text-red-200 flex items-start space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300 text-sm">Conta {activeDriver.status}</p>
              <p className="text-red-200/80 mt-1 leading-relaxed">
                Motivo: {activeDriver.statusReason || 'Entre em contato com o suporte Master para esclarecer pendÃªncias operacionais.'}
              </p>
            </div>
          </div>
        )}

        {/* 3. KPIS RÃPIDOS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Ganhos Totais</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-400">
              R$ {(activeDriver?.totalEarnings || 0).toFixed(2).replace('.', ',')}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">R$ 1,00/km garantido</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Entregas Feitas</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">
              {activeDriver?.totalDeliveries || 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">ConcluÃ­das com sucesso</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>No Radar Agora</span>
              <Navigation className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-400">
              {availableRides.length}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Aguardando entregador</p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>AvaliaÃ§Ã£o</span>
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-yellow-400">
              {(activeDriver?.rating || 5.0).toFixed(1)} â˜…
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Excelente conduta</p>
          </div>
        </div>

        {/* 4. SUB-TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 space-x-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveSubTab('radar')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeSubTab === 'radar'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Radar & Corrida Ativa</span>
            {activeRide && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeSubTab === 'history'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Meu HistÃ³rico de Ganhos ({myCompletedRides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
              activeSubTab === 'profile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Meu Cadastro & VeÃ­culo</span>
          </button>
        </div>

        {/* 5. TAB: RADAR & CORRIDA ATIVA */}
        {activeSubTab === 'radar' && (
          <div className="space-y-6">
            {/* CORRIDA ATIVA EM ANDAMENTO (MÃXIMA PRIORIDADE) */}
            {activeRide ? (
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/30 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">
                        Corrida em Andamento
                      </span>
                      <h3 className="font-sans text-xl font-black text-white">
                        {activeRide.rideCode}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                      Status: {activeRide.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncidentModalRideId(activeRide.id)}
                      className="px-3 py-1 rounded-full bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-bold transition-colors"
                    >
                      OcorrÃªncia
                    </button>
                  </div>
                </div>

                {/* Trajeto Origem & Destino */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origem: Estabelecimento */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                      <Store className="w-4 h-4" />
                      <span>PONTO DE COLETA (LOJA)</span>
                    </div>
                    <p className="font-bold text-white text-base">{activeRide.merchantName}</p>
                    <p className="text-xs text-slate-300 flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{activeRide.originAddress} ({activeRide.originNeighborhood})</span>
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                      <span>Telefone da Loja:</span>
                      <a
                        href={`tel:${activeRide.merchantPhone}`}
                        className="font-bold text-amber-400 hover:underline flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{activeRide.merchantPhone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Destino: Cliente */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                      <MapPin className="w-4 h-4" />
                      <span>DESTINO DA ENTREGA (CLIENTE)</span>
                    </div>
                    <p className="font-bold text-white text-base">{activeRide.customerName}</p>
                    <p className="text-xs text-slate-300 flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{activeRide.destinationAddress} ({activeRide.destinationNeighborhood})</span>
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                      <span>Telefone do Cliente:</span>
                      <a
                        href={`tel:${activeRide.customerPhone}`}
                        className="font-bold text-emerald-400 hover:underline flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{activeRide.customerPhone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Detalhes Financeiros da Corrida */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">DistÃ¢ncia Calculada:</span>
                      <span className="text-sm font-black text-white">{activeRide.distanceKm.toFixed(1)} km</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">RemuneraÃ§Ã£o do Entregador:</span>
                      <span className="text-xl font-black text-emerald-400">
                        R$ {activeRide.driverEarnings.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTÃ•ES DE PROGRESSÃƒO OPERACIONAL DO CICLO DE ENTREGA */}
                <div className="pt-2 space-y-3">
                  {activeRide.status === 'ACEITA' && (
                    <button
                      id="btn-start-pickup"
                      type="button"
                      onClick={() => startRidePickup(activeRide.id)}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>INICIAR DESLOCAMENTO ATÃ‰ O ESTABELECIMENTO</span>
                    </button>
                  )}

                  {activeRide.status === 'EM_COLETA' && (
                    <button
                      id="btn-confirm-collected"
                      type="button"
                      onClick={() => confirmRideCollected(activeRide.id)}
                      className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-sm font-black flex items-center justify-center space-x-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>PACOTE CONFERIDO: CONFIRMAR COLETA NA LOJA</span>
                    </button>
                  )}

                  {activeRide.status === 'EM_TRANSITO' && (
                    <div className="space-y-3">
                      {!isConfirmingDelivery ? (
                        <button
                          id="btn-open-deliver-modal"
                          type="button"
                          onClick={() => setIsConfirmingDelivery(true)}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-sm font-black flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-pulse"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>CHEGUEI NO DESTINO: DIGITAR CÃ“DIGO DO CLIENTE</span>
                        </button>
                      ) : (
                        <form
                          onSubmit={handleSubmitConfirmationCode}
                          className="p-5 bg-slate-950 border border-emerald-500/50 rounded-2xl space-y-4 animate-in fade-in"
                        >
                          <div className="text-center space-y-1">
                            <span className="text-xs text-emerald-400 font-black uppercase tracking-wider">
                              ValidaÃ§Ã£o de Entrega Segura
                            </span>
                            <h4 className="text-base font-bold text-white">
                              Solicite o cÃ³digo de 4 dÃ­gitos ao cliente
                            </h4>
                            <p className="text-xs text-slate-400">
                              O cliente possui este cÃ³digo na tela de acompanhamento de pedidos dele.
                            </p>
                          </div>

                          <div className="max-w-xs mx-auto">
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="0000"
                              value={confirmationCodeInput}
                              onChange={(e) => setConfirmationCodeInput(e.target.value.replace(/\D/g, ''))}
                              className="w-full py-3 text-center font-sans text-3xl font-black text-white tracking-widest bg-slate-900 border-2 border-emerald-500 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/30"
                              autoFocus
                            />
                          </div>

                          {confirmError && (
                            <p className="text-xs text-red-400 text-center font-bold">{confirmError}</p>
                          )}

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsConfirmingDelivery(false);
                                setConfirmError(null);
                              }}
                              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={confirmationCodeInput.length !== 4}
                              className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              <span>VALIDAR & CONCLUIR ENTREGA</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* RADAR DE CORRIDAS DISPONÃVEIS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center space-x-2">
                    <span>Corridas DisponÃ­veis no Radar</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {availableRides.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cachoeiras de Macacu, RJ â€¢ Toque para aceitar e garantir a corrida
                  </p>
                </div>
              </div>

              {!isOnline ? (
                <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-3xl space-y-3">
                  <Power className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="font-bold text-white text-base">VocÃª estÃ¡ Offline</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Ative o botÃ£o "ONLINE" no topo da tela para visualizar e aceitar corridas em tempo real.
                  </p>
                  {isApproved && (
                    <button
                      type="button"
                      onClick={handleToggleOnline}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30"
                    >
                      Ficar Online Agora
                    </button>
                  )}
                </div>
              ) : availableRides.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-3xl space-y-3">
                  <Navigation className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                  <h4 className="font-bold text-white text-base">Radar Procurando Corridas...</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Nenhuma nova entrega pendente no momento. Assim que um lojista finalizar um pedido e solicitar delivery, ela aparecerÃ¡ automaticamente aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-sans font-black text-sm text-emerald-400">
                            {ride.rideCode}
                          </span>
                          <span className="text-[10px] text-slate-400">â€¢ Pedido: {ride.orderCode}</span>
                        </div>
                        <span className="text-lg font-black text-emerald-400">
                          R$ {ride.driverEarnings.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start space-x-2">
                          <Store className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 text-[10px] block">Coleta:</span>
                            <span className="font-bold text-white">{ride.merchantName}</span>
                            <span className="text-slate-400 text-[11px] block">{ride.originNeighborhood}</span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 text-[10px] block">Entrega:</span>
                            <span className="font-bold text-white">{ride.customerName}</span>
                            <span className="text-slate-400 text-[11px] block">{ride.destinationNeighborhood}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-400">
                          <span>DistÃ¢ncia: </span>
                          <strong className="text-white">{ride.distanceKm.toFixed(1)} km</strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAcceptRide(ride.id)}
                          disabled={!!activeRide}
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all ${
                            activeRide
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{activeRide ? 'JÃ¡ em corrida' : 'ACEITAR CORRIDA'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. TAB: HISTÃ“RICO DE ENTREGAS */}
        {activeSubTab === 'history' && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-black text-white">HistÃ³rico de Entregas & Ganhos</h3>
              <p className="text-xs text-slate-400">
                Registro oficial de corridas finalizadas com confirmaÃ§Ã£o por cÃ³digo.
              </p>
            </div>

            {myCompletedRides.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma corrida finalizada ainda. Suas entregas concluÃ­das aparecerÃ£o aqui com os valores creditados.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 overflow-hidden">
                {myCompletedRides.map((ride) => (
                  <div key={ride.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-bold text-white">{ride.rideCode}</span>
                        <span className="text-[10px] text-slate-500">â€¢ {new Date(ride.finalizedAt || ride.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Finalizada âœ“
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {ride.merchantName} ({ride.originNeighborhood}) âž” {ride.customerName} ({ride.destinationNeighborhood})
                      </p>
                      <p className="text-[10px] text-slate-500">
                        DistÃ¢ncia: {ride.distanceKm.toFixed(1)} km â€¢ CÃ³digo validado: {ride.confirmationCode}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400 block">
                        + R$ {ride.driverEarnings.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-slate-500">Saldo DisponÃ­vel</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. TAB: PERFIL & VEÃCULO */}
        {activeSubTab === 'profile' && activeDriver && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Dados do Entregador & VeÃ­culo</h3>
              <p className="text-xs text-slate-400">
                InformaÃ§Ãµes cadastradas para faturamento e autorizaÃ§Ã£o de transporte.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Nome Completo:</span>
                <p className="font-bold text-white text-sm">{activeDriver.name}</p>
                <p className="text-slate-400">{activeDriver.email} â€¢ {activeDriver.phone}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Documentos:</span>
                <p className="font-bold text-white text-sm">CPF: {activeDriver.cpf}</p>
                <p className="text-slate-400">CNH: {activeDriver.cnhNumber} ({activeDriver.cnhCategory})</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">VeÃ­culo Credenciado:</span>
                <p className="font-bold text-white text-sm">
                  {activeDriver.vehicleModel} ({activeDriver.vehicleColor || activeDriver.vehicleType})
                </p>
                <p className="text-emerald-400 font-sans font-bold">Placa: {activeDriver.vehiclePlate}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Chave PIX para Repasses:</span>
                <p className="font-bold text-white font-sans text-sm">{activeDriver.pixKey || 'NÃ£o informada'}</p>
                <p className="text-slate-400">Repasses gerenciados pela plataforma</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE OCORRÃŠNCIA */}
      {incidentModalRideId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-black text-white text-base">Registrar OcorrÃªncia na Corrida</h3>
            </div>
            <p className="text-xs text-slate-400">
              Descreva o imprevisto (ex: endereÃ§o incorreto, loja fechada, cliente ausente). O alerta serÃ¡ encaminhado imediatamente Ã  equipe Master.
            </p>

            <textarea
              rows={3}
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Descreva o motivo da ocorrÃªncia com clareza..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-400"
            />

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIncidentModalRideId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleReportIncident}
                disabled={!incidentNotes.trim()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md"
              >
                Enviar OcorrÃªncia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

