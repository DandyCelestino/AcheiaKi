import React, { useState, useMemo } from 'react';
import {
  Users,
  MapPin,
  Building2,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  Briefcase,
  Search,
  Award,
  TrendingUp,
  X,
  Target,
  UserPlus,
  Phone,
  Mail,
  Layers,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SalesAgent, SalesRoleLevel, CommercialArea } from '../../types';

interface CommercialHierarchyManagerProps {
  onOpenCommissionModal?: (agent: SalesAgent) => void;
  onNavigateToOrganogram?: () => void;
  onNavigateToAnalytics?: () => void;
}

export const CommercialHierarchyManager: React.FC<CommercialHierarchyManagerProps> = ({
  onOpenCommissionModal,
  onNavigateToOrganogram,
  onNavigateToAnalytics
}) => {
  const {
    salesAgents,
    commercialAreas,
    addCommercialArea,
    updateCommercialArea,
    deleteCommercialArea,
    assignAgentHierarchyAndArea,
    updateSalesAgent,
    registeredClientsByAgents
  } = useApp();

  // Active view inside the hierarchy manager: 'squads' | 'areas' | 'matrix' | 'graphic'
  const [viewMode, setViewMode] = useState<'squads' | 'areas' | 'matrix' | 'graphic'>('squads');

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [agentToAssign, setAgentToAssign] = useState<SalesAgent | null>(null);

  // Assignment form state
  const [assignSupervisorId, setAssignSupervisorId] = useState<string>('');
  const [assignRoleLevel, setAssignRoleLevel] = useState<SalesRoleLevel>('CONSULTOR_SENIOR');
  const [assignRoleTitle, setAssignRoleTitle] = useState<string>('');
  const [assignRegion, setAssignRegion] = useState<string>('');
  const [assignMonthlyTarget, setAssignMonthlyTarget] = useState<number>(10);
  const [assignCommissionRate, setAssignCommissionRate] = useState<number>(15);

  // Area modal state
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<CommercialArea | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [areaSupervisorId, setAreaSupervisorId] = useState('');
  const [areaNeighborhoods, setAreaNeighborhoods] = useState<string[]>([]);
  const [neighborhoodInput, setNeighborhoodInput] = useState('');
  const [areaTarget, setAreaTarget] = useState<number>(20);
  const [areaNotes, setAreaNotes] = useState('');
  const [areaColor, setAreaColor] = useState('#3B82F6');

  // Supervisors & Coordinators list (eligible to lead squads)
  const leaders = useMemo(() => {
    return salesAgents.filter(
      (a) => a.roleLevel === 'COORDENADOR_REGIONAL' || a.roleLevel === 'SUPERVISOR_VENDAS'
    );
  }, [salesAgents]);

  const coordinators = useMemo(() => {
    return salesAgents.filter((a) => a.roleLevel === 'COORDENADOR_REGIONAL');
  }, [salesAgents]);

  const supervisors = useMemo(() => {
    return salesAgents.filter((a) => a.roleLevel === 'SUPERVISOR_VENDAS');
  }, [salesAgents]);

  const consultants = useMemo(() => {
    return salesAgents.filter(
      (a) => a.roleLevel === 'CONSULTOR_SENIOR' || a.roleLevel === 'CONSULTOR_JUNIOR'
    );
  }, [salesAgents]);

  // Quick statistics calculation
  const totalAgents = salesAgents.length;
  const totalSupervisors = leaders.length;
  const totalAreas = commercialAreas.length;

  // Count clients per agent
  const clientCountsByAgent = useMemo(() => {
    const counts: Record<string, number> = {};
    registeredClientsByAgents.forEach((client) => {
      counts[client.agentId] = (counts[client.agentId] || 0) + 1;
    });
    return counts;
  }, [registeredClientsByAgents]);

  // Filtered agents for matrix view
  const filteredAgents = useMemo(() => {
    return salesAgents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.assignedRegion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.roleTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        selectedRoleFilter === 'ALL' || agent.roleLevel === selectedRoleFilter;

      const matchesArea =
        selectedAreaFilter === 'ALL' || agent.assignedRegion === selectedAreaFilter;

      return matchesSearch && matchesRole && matchesArea;
    });
  }, [salesAgents, searchTerm, selectedRoleFilter, selectedAreaFilter]);

  // Handlers for opening Assignment Modal
  const openAssignModal = (agent: SalesAgent, preselectedSupervisorId?: string) => {
    setAgentToAssign(agent);
    setAssignSupervisorId(preselectedSupervisorId !== undefined ? preselectedSupervisorId : (agent.supervisorId || ''));
    setAssignRoleLevel(agent.roleLevel);
    setAssignRoleTitle(agent.roleTitle);
    setAssignRegion(agent.assignedRegion);
    setAssignMonthlyTarget(agent.monthlyTargetCount);
    setAssignCommissionRate(agent.commissionRatePercent);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentToAssign) return;

    // Call context function
    assignAgentHierarchyAndArea(
      agentToAssign.id,
      assignSupervisorId || undefined,
      assignRegion || 'Centro',
      assignRoleLevel,
      assignRoleTitle
    );

    // Update target and commission if changed
    updateSalesAgent(agentToAssign.id, {
      monthlyTargetCount: Number(assignMonthlyTarget),
      commissionRatePercent: Number(assignCommissionRate)
    });

    setIsAssignModalOpen(false);
    setAgentToAssign(null);
  };

  // Handlers for Area Modal
  const openNewAreaModal = () => {
    setAreaToEdit(null);
    setAreaName('');
    setAreaCode(`AREA-${Date.now().toString().slice(-4)}`);
    setAreaSupervisorId(leaders[0]?.id || '');
    setAreaNeighborhoods(['Centro']);
    setNeighborhoodInput('');
    setAreaTarget(20);
    setAreaNotes('');
    setAreaColor('#3B82F6');
    setIsAreaModalOpen(true);
  };

  const openEditAreaModal = (area: CommercialArea) => {
    setAreaToEdit(area);
    setAreaName(area.name);
    setAreaCode(area.code);
    setAreaSupervisorId(area.supervisorId || '');
    setAreaNeighborhoods([...area.neighborhoods]);
    setNeighborhoodInput('');
    setAreaTarget(area.targetMonthlyActivations);
    setAreaNotes(area.notes || '');
    setAreaColor(area.color || '#3B82F6');
    setIsAreaModalOpen(true);
  };

  const handleAddNeighborhood = () => {
    const trimmed = neighborhoodInput.trim();
    if (trimmed && !areaNeighborhoods.includes(trimmed)) {
      setAreaNeighborhoods([...areaNeighborhoods, trimmed]);
      setNeighborhoodInput('');
    }
  };

  const handleRemoveNeighborhood = (item: string) => {
    setAreaNeighborhoods(areaNeighborhoods.filter((n) => n !== item));
  };

  const handleSaveArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;

    const supObj = leaders.find((l) => l.id === areaSupervisorId);

    if (areaToEdit) {
      updateCommercialArea(areaToEdit.id, {
        name: areaName.trim(),
        code: areaCode.trim(),
        neighborhoods: areaNeighborhoods,
        supervisorId: areaSupervisorId || undefined,
        supervisorName: supObj?.name,
        targetMonthlyActivations: Number(areaTarget),
        notes: areaNotes.trim(),
        color: areaColor
      });
    } else {
      addCommercialArea({
        name: areaName.trim(),
        code: areaCode.trim(),
        neighborhoods: areaNeighborhoods.length > 0 ? areaNeighborhoods : ['Centro'],
        supervisorId: areaSupervisorId || undefined,
        supervisorName: supObj?.name,
        targetMonthlyActivations: Number(areaTarget),
        notes: areaNotes.trim(),
        color: areaColor
      });
    }

    setIsAreaModalOpen(false);
  };

  return (
    <div id="commercial-hierarchy-manager" className="space-y-6">
      {/* HEADER BANNER & CENTRAL VISIBILITY OVERVIEW */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  GestÃ£o de Hierarquia & AtribuiÃ§Ã£o de Ãreas
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Controle Central Master
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize consultores sob supervisores regionais, atribua territÃ³rios em Cachoeiras de Macacu e monitore o desempenho de cada squad comercial.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToAnalytics && (
              <button
                id="btn-view-analytics-dataviz"
                onClick={onNavigateToAnalytics}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Desempenho & Data Viz</span>
              </button>
            )}
            {onNavigateToOrganogram && (
              <button
                id="btn-view-tree-organogram"
                onClick={onNavigateToOrganogram}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Ver Diagrama Visual</span>
              </button>
            )}
            <button
              id="btn-new-commercial-area"
              onClick={openNewAreaModal}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Ãrea Comercial</span>
            </button>
          </div>
        </div>

        {/* METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>ForÃ§a de Vendas</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{totalAgents}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Vendedores cadastrados</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>LÃ­deres & Supervisores</span>
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{totalSupervisors}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Coordenadores e supervisores</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Ãreas / TerritÃ³rios</span>
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{totalAreas}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">RegiÃµes delimitadas</div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Clientes Angariados</span>
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-black text-purple-950">
              {registeredClientsByAgents.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">ComÃ©rcios & prestadores ativos</div>
          </div>
        </div>
      </div>

      {/* VIEW MODE NAVIGATION PILLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            id="tab-view-squads"
            onClick={() => setViewMode('squads')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'squads'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>EsquadrÃµes & Supervisores</span>
          </button>

          <button
            id="tab-view-areas"
            onClick={() => setViewMode('areas')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'areas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>TerritÃ³rios & Ãreas ({commercialAreas.length})</span>
          </button>

          <button
            id="tab-view-matrix"
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Matriz de AtribuiÃ§Ã£o ({salesAgents.length})</span>
          </button>

          <button
            id="tab-view-graphic"
            onClick={() => setViewMode('graphic')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'graphic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Modo GrÃ¡fico (Organograma)</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 px-3 flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Master Supremo: GestÃ£o hierÃ¡rquica centralizada
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ESQUADRÃ•ES & SUPERVISORES (SQUAD VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'squads' && (
        <div className="space-y-6">
          {/* SQUADS LED BY COORDINATORS / SUPERVISORS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {leaders.map((leader) => {
              // Subordinates of this leader
              const subordinates = salesAgents.filter((a) => a.supervisorId === leader.id);
              const squadClientsCount =
                (clientCountsByAgent[leader.id] || 0) +
                subordinates.reduce((acc, curr) => acc + (clientCountsByAgent[curr.id] || 0), 0);
              const squadTargetSum =
                leader.monthlyTargetCount +
                subordinates.reduce((acc, curr) => acc + curr.monthlyTargetCount, 0);

              return (
                <div
                  key={leader.id}
                  id={`squad-card-${leader.id}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  {/* SQUAD HEADER */}
                  <div className="p-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-blue-50/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={leader.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={leader.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900">{leader.name}</h3>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                leader.roleLevel === 'COORDENADOR_REGIONAL'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {leader.roleTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-600" />
                              {leader.assignedRegion}
                            </span>
                            <span>â€¢</span>
                            <span className="font-semibold text-slate-700">{leader.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-edit-leader-${leader.id}`}
                          onClick={() => openAssignModal(leader)}
                          title="Reatribuir lÃ­der / alterar cargo"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onOpenCommissionModal && (
                          <button
                            id={`btn-comm-leader-${leader.id}`}
                            onClick={() => onOpenCommissionModal(leader)}
                            title="Ajustar ComissÃ£o"
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {leader.commissionRatePercent}%
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SQUAD KPIS */}
                    <div className="mt-4 grid grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/70 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Equipe Direta</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {subordinates.length} consultores
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Clientes do Squad</div>
                        <div className="text-sm font-extrabold text-emerald-700">
                          {squadClientsCount} ativos
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Meta Acumulada</div>
                        <div className="text-sm font-extrabold text-blue-700">
                          {squadTargetSum} / mÃªs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SQUAD SUBORDINATES LIST */}
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        Consultores Subordinados ({subordinates.length})
                      </span>
                      <button
                        id={`btn-assign-sub-${leader.id}`}
                        onClick={() => {
                          // Pick first consultant not supervised by leader
                          const other = salesAgents.find((a) => a.id !== leader.id && a.supervisorId !== leader.id);
                          if (other) {
                            openAssignModal(other, leader.id);
                          } else if (salesAgents[0]) {
                            openAssignModal(salesAgents[0], leader.id);
                          }
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Vincular Consultor</span>
                      </button>
                    </div>

                    {subordinates.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">
                          Nenhum consultor atribuÃ­do a este supervisor no momento.
                        </p>
                        <button
                          onClick={() => {
                            const other = salesAgents.find((a) => a.id !== leader.id);
                            if (other) openAssignModal(other, leader.id);
                          }}
                          className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Atribuir um consultor agora
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {subordinates.map((sub) => {
                          const clientsCount = clientCountsByAgent[sub.id] || 0;
                          return (
                            <div
                              key={sub.id}
                              className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/80 transition-all flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={sub.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                                  alt={sub.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {sub.name}
                                    </p>
                                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                      {sub.roleTitle}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    {sub.assignedRegion} â€¢ {clientsCount} clientes ativos
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                                  {sub.commissionRatePercent}%
                                </span>
                                <button
                                  onClick={() => openAssignModal(sub)}
                                  title="Remanejar consultor ou alterar supervisor"
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SQUAD FOOTER */}
                  <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Supervisor: {leader.name}</span>
                    <a
                      href={`https://wa.me/55${leader.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WhatsApp do LÃ­der</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SQUAD DIRECT TO MASTER SUPREMO (NO INTERMEDIATE SUPERVISOR) */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-sm">
                  ADM
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    Reporte Direto ao Administrador Master Supremo
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      telecom.david@gmail.com
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consultores e coordenadores que respondem diretamente ao Master sem supervisÃ£o intermediÃ¡ria.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                {salesAgents.filter((a) => !a.supervisorId).length} membros diretos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {salesAgents
                .filter((a) => !a.supervisorId)
                .map((directAgent) => (
                  <div
                    key={directAgent.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <img
                        src={directAgent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={directAgent.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-900 truncate">
                          {directAgent.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {directAgent.assignedRegion}
                        </p>
                        <span className="text-[10px] text-indigo-700 font-semibold">
                          {directAgent.roleTitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openAssignModal(directAgent)}
                        title="Atribuir a um supervisor ou alterar Ã¡rea"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: TERRITÃ“RIOS & ÃREAS COMERCIAIS (AREA VIEW) */}
      {/* ========================================================================= */}
      {viewMode === 'areas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                DivisÃ£o Territorial de Cachoeiras de Macacu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                RegiÃµes de atuaÃ§Ã£o comercial com atribuiÃ§Ã£o de supervisor e equipe dedicada de consultores.
              </p>
            </div>
            <button
              onClick={openNewAreaModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Ãrea / Distrito</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {commercialAreas.map((area) => {
              // Agents working in this area
              const areaAgents = salesAgents.filter(
                (a) => a.assignedRegion.toLowerCase().includes(area.name.toLowerCase()) ||
                       area.neighborhoods.some((n) => a.assignedRegion.toLowerCase().includes(n.toLowerCase()))
              );

              // Supervisor responsible
              const supervisor = leaders.find((l) => l.id === area.supervisorId);

              // Clients in this area
              const clientsInArea = registeredClientsByAgents.filter((c) =>
                area.neighborhoods.some((n) => c.address?.toLowerCase().includes(n.toLowerCase())) ||
                c.planName?.toLowerCase().includes(area.name.toLowerCase())
              );

              return (
                <div
                  key={area.id}
                  id={`card-area-${area.id}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5">
                    {/* AREA HEADER */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: area.color || '#3B82F6' }}
                          ></span>
                          <h4 className="font-extrabold text-sm text-slate-900">{area.name}</h4>
                        </div>
                        <span className="text-[10px] font-sans font-bold text-slate-400 ml-5 block mt-0.5">
                          {area.code}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-edit-area-${area.id}`}
                          onClick={() => openEditAreaModal(area)}
                          title="Editar Ã¡rea e bairros"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir a Ã¡rea "${area.name}"?`)) {
                              deleteCommercialArea(area.id);
                            }
                          }}
                          title="Excluir Ã¡rea"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* SUPERVISOR ASSIGNED */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        Supervisor Geral da Ãrea
                      </span>
                      {supervisor ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={supervisor.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={supervisor.name}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {supervisor.name}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{supervisor.phone}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Nenhum supervisor designado</span>
                        </div>
                      )}
                    </div>

                    {/* NEIGHBORHOODS TAGS */}
                    <div className="mb-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Bairros & Localidades Cobertas
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {area.neighborhoods.map((n, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AREA METRICS */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">Vendedores na Ãrea</span>
                        <span className="text-xs font-extrabold text-slate-800">
                          {areaAgents.length} consultores
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-500 block">Meta AtivaÃ§Ãµes</span>
                        <span className="text-xs font-extrabold text-blue-700">
                          {area.targetMonthlyActivations} / mÃªs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AREA FOOTER */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {clientsInArea.length} cadastros no histÃ³rico
                    </span>
                    <button
                      onClick={() => openEditAreaModal(area)}
                      className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <span>Gerenciar Bairros</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: MATRIZ DE ATRIBUIÃ‡ÃƒO RÃPIDA (MATRIX TABLE) */}
      {/* ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, regiÃ£o..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-hidden text-slate-700"
              >
                <option value="ALL">Todos os Cargos</option>
                <option value="COORDENADOR_REGIONAL">Coordenador Regional</option>
                <option value="SUPERVISOR_VENDAS">Supervisor de Vendas</option>
                <option value="CONSULTOR_SENIOR">Consultor SÃªnior</option>
                <option value="CONSULTOR_JUNIOR">Consultor JÃºnior</option>
              </select>

              <select
                value={selectedAreaFilter}
                onChange={(e) => setSelectedAreaFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-hidden text-slate-700"
              >
                <option value="ALL">Todas as RegiÃµes</option>
                {commercialAreas.map((area) => (
                  <option key={area.id} value={area.name}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE OF AGENTS & ASSIGNMENTS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Vendedor / Consultor</th>
                  <th className="py-3.5 px-4">NÃ­vel & Cargo</th>
                  <th className="py-3.5 px-4">Supervisor Imediato</th>
                  <th className="py-3.5 px-4">Ãrea / TerritÃ³rio</th>
                  <th className="py-3.5 px-4">Meta MÃªs</th>
                  <th className="py-3.5 px-4">ComissÃ£o Fixada</th>
                  <th className="py-3.5 px-4 text-right">AÃ§Ã£o Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Nenhum vendedor localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => {
                    const supervisor = leaders.find((l) => l.id === agent.supervisorId);

                    return (
                      <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* VENDEDOR */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={agent.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={agent.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900">{agent.name}</p>
                              <p className="text-[11px] text-slate-500">{agent.phone}</p>
                            </div>
                          </div>
                        </td>

                        {/* CARGO */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              agent.roleLevel === 'COORDENADOR_REGIONAL'
                                ? 'bg-purple-100 text-purple-800'
                                : agent.roleLevel === 'SUPERVISOR_VENDAS'
                                ? 'bg-amber-100 text-amber-800'
                                : agent.roleLevel === 'CONSULTOR_SENIOR'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {agent.roleTitle}
                          </span>
                        </td>

                        {/* SUPERVISOR */}
                        <td className="py-3.5 px-4">
                          {supervisor ? (
                            <div className="flex items-center space-x-1.5">
                              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-bold text-slate-800">{supervisor.name}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                              <Shield className="w-3 h-3" />
                              Master Supremo
                            </span>
                          )}
                        </td>

                        {/* ÃREA */}
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {agent.assignedRegion}
                          </span>
                        </td>

                        {/* META */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900">
                            {agent.monthlyTargetCount}
                          </span>{' '}
                          <span className="text-[11px] text-slate-500">lojas</span>
                        </td>

                        {/* COMISSÃƒO */}
                        <td className="py-3.5 px-4">
                          <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {agent.commissionRatePercent}%
                          </span>
                        </td>

                        {/* AÃ‡ÃƒO */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`btn-reassign-${agent.id}`}
                            onClick={() => openAssignModal(agent)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Reatribuir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: MODO GRÃFICO - ORGANOGRAMA HIERÃRQUICO VISUAL */}
      {/* ========================================================================= */}
      {viewMode === 'graphic' && (
        <div id="commercial-hierarchy-modo-grafico" className="space-y-6">
          {/* Header do Organograma */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Modo GrÃ¡fico: Organograma HierÃ¡rquico Interativo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  VisualizaÃ§Ã£o da cadeia de comando comercial: Coordenadores &rarr; Supervisores &rarr; Consultores de Campo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-bold">
                {salesAgents.length} Profissionais Mapeados
              </span>
            </div>
          </div>

          {/* ÃRVORE HIERÃRQUICA VISUAL */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-x-auto">
            {/* NÃVEL 1: MASTER SUPREMO (APEX) */}
            <div className="flex flex-col items-center">
              <div className="bg-slate-950 text-white px-6 py-4 rounded-2xl border-2 border-amber-400/60 shadow-lg text-center max-w-sm w-full relative">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
                  VÃ©rtice de Comando
                </span>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-black text-white">Master Supremo / Admin Central</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  GestÃ£o Central de Cachoeiras de Macacu
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-around text-[10px] text-slate-300">
                  <span>{commercialAreas.length} RegiÃµes</span>
                  <span>&bull;</span>
                  <span>{salesAgents.length} Vendedores</span>
                  <span>&bull;</span>
                  <span>100% Autonomia</span>
                </div>
              </div>

              {/* Conector Vertical */}
              <div className="w-0.5 h-8 bg-slate-300"></div>
            </div>

            {/* NÃVEL 2: COORDENADORES REGIONAIS */}
            <div className="relative">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {coordinators.map((coord) => {
                  const supervisedByThisCoord = supervisors.filter((s) => s.supervisorId === coord.id);
                  const directConsultants = salesAgents.filter(
                    (a) => a.supervisorId === coord.id && a.roleLevel.startsWith('CONSULTOR')
                  );
                  const coordClients = clientCountsByAgent[coord.id] || 0;

                  return (
                    <div
                      key={coord.id}
                      className="bg-white rounded-2xl border-2 border-purple-300 shadow-md p-4 min-w-[280px] max-w-xs flex-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            Coordenador Regional
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {coord.commissionRatePercent}% Comiss.
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-sm shrink-0">
                            {coord.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-slate-900 leading-tight">
                              {coord.name}
                            </h5>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {coord.assignedRegion}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl text-[11px] space-y-1 mb-3">
                          <div className="flex justify-between text-slate-600">
                            <span>Lojas Credenciadas:</span>
                            <strong className="text-slate-900">{coordClients}</strong>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Meta Mensal:</span>
                            <strong className="text-slate-900">{coord.monthlyTargetCount} credenc.</strong>
                          </div>
                        </div>
                      </div>

                      {/* SUB-ÃRVORE: SUPERVISORES DESTE COORDENADOR */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Equipe Subordinada ({supervisedByThisCoord.length + directConsultants.length})
                        </span>

                        {supervisedByThisCoord.length === 0 && directConsultants.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic block">
                            Nenhum supervisor vinculado.
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            {supervisedByThisCoord.map((sup) => {
                              const supConsultants = salesAgents.filter((a) => a.supervisorId === sup.id);
                              return (
                                <div
                                  key={sup.id}
                                  className="bg-blue-50/70 p-2 rounded-lg border border-blue-100 flex items-center justify-between text-[11px]"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 block leading-tight">
                                      {sup.name}
                                    </span>
                                    <span className="text-[9px] text-blue-600 font-semibold">
                                      Supervisor &bull; {supConsultants.length} consultores
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => openAssignModal(sup)}
                                    className="p-1 text-blue-600 hover:text-blue-900 cursor-pointer"
                                    title="Ajustar atribuiÃ§Ã£o"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}

                            {directConsultants.map((cons) => (
                              <div
                                key={cons.id}
                                className="bg-slate-100/70 p-1.5 rounded-lg flex items-center justify-between text-[10px]"
                              >
                                <span className="font-medium text-slate-700">
                                  {cons.name} ({cons.roleLevel === 'CONSULTOR_SENIOR' ? 'SÃªnior' : 'JÃºnior'})
                                </span>
                                <span className="font-bold text-blue-600">{cons.commissionRatePercent}%</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => openAssignModal(coord)}
                          className="w-full mt-2 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar AtribuiÃ§Ã£o do Coordenador</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÃ‡ÃƒO EXTRA: SUPERVISORES INDEPENDENTES OU CONSULTOR DIRETO */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Matriz Visual de Consultores & Vendedores em Campo
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {consultants.map((cons) => {
                  const supervisor = leaders.find((l) => l.id === cons.supervisorId);
                  const clientCount = clientCountsByAgent[cons.id] || 0;
                  const targetPercent = Math.min(100, Math.round((clientCount / (cons.monthlyTargetCount || 1)) * 100));

                  return (
                    <div
                      key={cons.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          cons.roleLevel === 'CONSULTOR_SENIOR'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {cons.roleLevel === 'CONSULTOR_SENIOR' ? 'Consultor SÃªnior' : 'Consultor JÃºnior'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">
                          {cons.commissionRatePercent}%
                        </span>
                      </div>

                      <div>
                        <h6 className="text-xs font-black text-slate-900 leading-tight">
                          {cons.name}
                        </h6>
                        <span className="text-[10px] text-slate-500 block">
                          Sup: {supervisor ? supervisor.name : 'Master Direto'}
                        </span>
                      </div>

                      {/* Progresso de Metas */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                          <span>Meta ({clientCount}/{cons.monthlyTargetCount})</span>
                          <span>{targetPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              targetPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${targetPercent}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openAssignModal(cons)}
                        className="w-full py-1 text-[10px] font-bold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-slate-600 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Reatribuir</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ATRIBUIÃ‡ÃƒO & HIERARQUIZAÃ‡ÃƒO DE VENDEDOR */}
      {/* ========================================================================= */}
      {isAssignModalOpen && agentToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    HierarquizaÃ§Ã£o & AtribuiÃ§Ã£o de Vendedor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina subordinaÃ§Ã£o, Ã¡rea de atuaÃ§Ã£o e metas no organograma Master.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              {/* AGENT BADGE */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center space-x-3">
                <img
                  src={agentToAssign.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={agentToAssign.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{agentToAssign.name}</h4>
                  <p className="text-xs text-slate-500">
                    {agentToAssign.email} â€¢ {agentToAssign.phone}
                  </p>
                </div>
              </div>

              {/* CARGO E NÃVEL HIERÃRQUICO */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">NÃ­vel HierÃ¡rquico no Organograma</label>
                <select
                  value={assignRoleLevel}
                  onChange={(e) => {
                    const newLevel = e.target.value as SalesRoleLevel;
                    setAssignRoleLevel(newLevel);
                    // Automatic default role title suggestions
                    if (newLevel === 'COORDENADOR_REGIONAL') {
                      setAssignRoleTitle('Coordenador Comercial Regional');
                    } else if (newLevel === 'SUPERVISOR_VENDAS') {
                      setAssignRoleTitle('Supervisor de Vendas e ExpansÃ£o');
                    } else if (newLevel === 'CONSULTOR_SENIOR') {
                      setAssignRoleTitle('Consultor Comercial SÃªnior');
                    } else {
                      setAssignRoleTitle('Consultor Comercial JÃºnior');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 font-bold text-slate-800"
                >
                  <option value="COORDENADOR_REGIONAL">Coordenador Regional (NÃ­vel 1 - Lidera Supervisores)</option>
                  <option value="SUPERVISOR_VENDAS">Supervisor de Vendas (NÃ­vel 2 - Lidera Consultores)</option>
                  <option value="CONSULTOR_SENIOR">Consultor Comercial SÃªnior (NÃ­vel 3 - Campo)</option>
                  <option value="CONSULTOR_JUNIOR">Consultor Comercial JÃºnior (NÃ­vel 3 - Campo / Trainee)</option>
                </select>
              </div>

              {/* TÃTULO DO CARGO */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">TÃ­tulo Personalizado do Cargo</label>
                <input
                  type="text"
                  value={assignRoleTitle}
                  onChange={(e) => setAssignRoleTitle(e.target.value)}
                  placeholder="Ex: Consultor de Vendas Especialista em Papucaia"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 font-medium"
                />
              </div>

              {/* SUPERVISOR RESPONSÃVEL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Supervisor Imediato (Linha de SubordinaÃ§Ã£o)
                </label>
                <select
                  value={assignSupervisorId}
                  onChange={(e) => setAssignSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 font-medium"
                >
                  <option value="">Reporte Direto ao Administrador Master Supremo (Sem intermediÃ¡rio)</option>
                  {leaders
                    .filter((l) => l.id !== agentToAssign.id)
                    .map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name} ({leader.roleTitle} - {leader.assignedRegion})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  Ao selecionar um supervisor, o vendedor aparecerÃ¡ automaticamente agrupado sob o esquadrÃ£o dele.
                </p>
              </div>

              {/* ÃREA / TERRITÃ“RIO ATRIBUÃDO */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Ãrea / TerritÃ³rio de AtuaÃ§Ã£o</label>
                <div className="flex gap-2">
                  <select
                    value={assignRegion}
                    onChange={(e) => setAssignRegion(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 font-medium"
                  >
                    {commercialAreas.map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name} ({area.neighborhoods.slice(0, 3).join(', ')})
                      </option>
                    ))}
                    <option value="Centro & JapuÃ­ba">Centro & JapuÃ­ba</option>
                    <option value="Papucaia & Agrobrasil">Papucaia & Agrobrasil</option>
                    <option value="GuapiaÃ§u & CastÃ¡lia">GuapiaÃ§u & CastÃ¡lia</option>
                    <option value="ValÃ©rio & Funchal">ValÃ©rio & Funchal</option>
                    <option value="Boca do Mato & Ribeira">Boca do Mato & Ribeira</option>
                    <option value="Toda a RegiÃ£o Municipal">Toda a RegiÃ£o Municipal</option>
                  </select>
                </div>
              </div>

              {/* METAS & COMISSÃƒO */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Meta Mensal de Lojas</label>
                  <input
                    type="number"
                    min="1"
                    value={assignMonthlyTarget}
                    onChange={(e) => setAssignMonthlyTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ComissÃ£o Fixada (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={assignCommissionRate}
                    onChange={(e) => setAssignCommissionRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar AtribuiÃ§Ã£o Master</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAÃ‡ÃƒO / EDIÃ‡ÃƒO DE ÃREA COMERCIAL */}
      {/* ========================================================================= */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {areaToEdit ? 'Editar Ãrea Comercial' : 'Nova Ãrea / TerritÃ³rio Comercial'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Delimite distritos de Cachoeiras de Macacu para monitoramento comercial.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAreaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArea} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nome da Ãrea / RegiÃ£o</label>
                  <input
                    type="text"
                    required
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="Ex: Papucaia & Agrobrasil"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">CÃ³digo</label>
                  <input
                    type="text"
                    required
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    placeholder="AREA-01"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 font-sans text-slate-600"
                  />
                </div>
              </div>

              {/* SUPERVISOR RESPONSÃVEL DA ÃREA */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Supervisor Geral da RegiÃ£o
                </label>
                <select
                  value={areaSupervisorId}
                  onChange={(e) => setAreaSupervisorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 font-medium"
                >
                  <option value="">Sem supervisor geral designado</option>
                  {leaders.map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name} ({leader.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              {/* BAIRROS COBERTOS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Bairros & Localidades Inclusas
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={neighborhoodInput}
                    onChange={(e) => setNeighborhoodInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNeighborhood();
                      }
                    }}
                    placeholder="Digite o nome do bairro e aperte Enter ou +"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddNeighborhood}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1.5 min-h-12 max-h-24 overflow-y-auto">
                  {areaNeighborhoods.map((n, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium"
                    >
                      {n}
                      <button
                        type="button"
                        onClick={() => handleRemoveNeighborhood(n)}
                        className="hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* META DA ÃREA & COR */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Meta Mensal da Ãrea</label>
                  <input
                    type="number"
                    min="1"
                    value={areaTarget}
                    onChange={(e) => setAreaTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Cor de IdentificaÃ§Ã£o</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={areaColor}
                      onChange={(e) => setAreaColor(e.target.value)}
                      className="w-10 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                    />
                    <span className="text-xs font-sans text-slate-600">{areaColor}</span>
                  </div>
                </div>
              </div>

              {/* NOTAS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">AnotaÃ§Ãµes EstratÃ©gicas</label>
                <textarea
                  rows={2}
                  value={areaNotes}
                  onChange={(e) => setAreaNotes(e.target.value)}
                  placeholder="Ex: Polo forte em agronegÃ³cio, serviÃ§os mecÃ¢nicos e turismo ecolÃ³gico..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{areaToEdit ? 'Salvar AlteraÃ§Ãµes' : 'Criar Ãrea Comercial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

