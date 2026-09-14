import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Edit3,
  Trash2,
  Eye,
  LogIn,
  MapPin,
  Phone,
  Mail,
  Percent,
  Clock,
  Truck,
  Sparkles,
  RefreshCw,
  X,
  Save,
  Building2,
  CalendarCheck,
  Check,
  Ban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StoreMerchant, User } from '../../types';

interface MasterMerchantsViewProps {
  onOpenDossier?: (target: { userId?: string; merchantId?: string }) => void;
}

export const MasterMerchantsView: React.FC<MasterMerchantsViewProps> = ({ onOpenDossier }) => {
  const {
    merchants,
    users,
    products,
    approveMerchant,
    rejectMerchant,
    suspendMerchant,
    reactivateMerchant,
    deleteMerchant,
    updateStoreProfile,
    createMerchantByMaster,
    setMerchantCommissionRate,
    impersonateUser,
    setCurrentEnvironment,
    triggerToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'approved' | 'pending' | 'suspended' | 'rejected'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals
  const [viewingMerchant, setViewingMerchant] = useState<StoreMerchant | null>(null);
  const [editingMerchant, setEditingMerchant] = useState<StoreMerchant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState<StoreMerchant | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [commissionModal, setCommissionModal] = useState<StoreMerchant | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState(10);

  // Create Form State
  const [newMerchantData, setNewMerchantData] = useState<Omit<StoreMerchant, 'id' | 'submittedAt'>>({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    cnpjOrCpf: '',
    category: 'Gastronomia & Delivery',
    description: '',
    address: 'Centro, Cachoeiras de Macacu',
    neighborhood: 'Centro',
    city: 'Cachoeiras de Macacu, RJ',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 0,
    isOpen: true,
    openingHours: '09:00 às 22:00',
    deliveryFee: 5.0,
    deliveryTimeEstimate: '30-45 min',
    supportsPickup: true,
    supportsTrial: false,
    supportsAppointments: false,
    commissionRate: 10,
    status: 'approved'
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<StoreMerchant>>({});

  const categories = [
    'Gastronomia & Delivery',
    'Moda & Provador VIP',
    'Supermercados & Mercearias',
    'Farmácias & Saúde',
    'Serviços & Profissionais',
    'Beleza & Estética',
    'Pet Shop & Veterinária',
    'Construção & Casa'
  ];

  const macacuNeighborhoods = [
    'Centro',
    'Castália',
    'Papucaia',
    'Japuíba',
    'Guapiaçu',
    'Funchal',
    'Boa Vista',
    'Gangazes',
    'Ribeira',
    'Boca do Mato',
    'Valério',
    'Maraporã',
    'Vila Macuco'
  ];

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.cnpjOrCpf && m.cnpjOrCpf.includes(q)) ||
        (m.neighborhood && m.neighborhood.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [merchants, searchQuery, statusFilter, categoryFilter]);

  const handleOpenEdit = (merchant: StoreMerchant) => {
    setEditingMerchant(merchant);
    setEditFormData({ ...merchant });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;
    updateStoreProfile(editingMerchant.id, editFormData);
    setEditingMerchant(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantData.name || !newMerchantData.email) {
      triggerToast('Preencha os campos obrigatórios.');
      return;
    }
    createMerchantByMaster(newMerchantData);
    setShowCreateModal(false);
  };

  const handleConfirmSuspend = () => {
    if (!suspendModal) return;
    suspendMerchant(suspendModal.id, suspendReason || 'Suspensão preventiva por decisão Master');
    setSuspendModal(null);
    setSuspendReason('');
  };

  const handleSaveCommission = () => {
    if (!commissionModal) return;
    setMerchantCommissionRate(commissionModal.id, newCommissionRate);
    setCommissionModal(null);
  };

  const handleLoginAsMerchant = (merchant: StoreMerchant) => {
    const owner = users.find((u) => u.merchantId === merchant.id || u.email === merchant.email);
    if (owner) {
      impersonateUser(owner);
    } else {
      // Create temporary owner session
      const tempUser: User = {
        id: `temp-seller-${merchant.id}`,
        name: merchant.ownerName,
        email: merchant.email,
        phone: merchant.phone,
        role: 'VENDEDOR',
        merchantId: merchant.id,
        city: merchant.city,
        createdAt: new Date().toISOString()
      };
      impersonateUser(tempUser);
    }
  };

  const getMerchantProductsCount = (merchantId: string) => {
    return products.filter((p) => p.merchantId === merchantId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Gestão Integral de Lojas & Prestadores
              </h2>
              <p className="text-xs text-slate-500">
                Credenciamento, aprovação, moderação de comissões e intervenção direta em estabelecimentos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Estabelecimento</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome da loja, responsável, CNPJ, telefone ou bairro..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="approved">Aprovadas / Ativas</option>
            <option value="pending">Aguardando Aprovação</option>
            <option value="suspended">Suspensas</option>
            <option value="rejected">Rejeitadas</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          Exibindo <strong>{filteredMerchants.length}</strong> de <strong>{merchants.length}</strong> lojas parceiras
        </span>
      </div>

      {/* Merchants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Estabelecimento</th>
                <th className="px-4 py-3.5">Categoria & Bairro</th>
                <th className="px-4 py-3.5">Modalidades</th>
                <th className="px-4 py-3.5">Status & Avaliação</th>
                <th className="px-4 py-3.5">Comissão & Catálogo</th>
                <th className="px-4 py-3.5 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMerchants.map((m) => {
                const pCount = getMerchantProductsCount(m.id);
                const comm = m.commissionRate ?? 10;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => onOpenDossier ? onOpenDossier({ merchantId: m.id }) : setViewingMerchant(m)}
                          className="relative group cursor-pointer"
                          title="Clique na foto/logo para abrir o Dossiê 360°"
                        >
                          <img
                            src={m.logo}
                            alt={m.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                          />
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenDossier ? onOpenDossier({ merchantId: m.id }) : setViewingMerchant(m)}
                            className="text-left group cursor-pointer"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 flex items-center space-x-1.5 transition-colors">
                              <span>{m.name}</span>
                              {m.isOpen ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aberta agora" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300" title="Fechada" />
                              )}
                            </div>
                          </button>
                          <div className="text-[11px] text-slate-500">
                            Resp: <strong className="text-slate-700">{m.ownerName}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            CNPJ: {m.cnpjOrCpf} • {m.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{m.category}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{m.neighborhood || 'Centro'}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Delivery
                        </span>
                        {m.supportsPickup && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Retirada
                          </span>
                        )}
                        {m.supportsTrial && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            VIP Provador
                          </span>
                        )}
                        {m.supportsAppointments && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Agendamento
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div>
                          {m.status === 'approved' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>Aprovada</span>
                            </span>
                          )}
                          {m.status === 'pending' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>Pendente</span>
                            </span>
                          )}
                          {m.status === 'suspended' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Ban className="w-3 h-3" />
                              <span>Suspensa</span>
                            </span>
                          )}
                          {m.status === 'rejected' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              <XCircle className="w-3 h-3" />
                              <span>Rejeitada</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500">
                          ★ <strong>{m.rating}</strong> ({m.reviewsCount} avaliações)
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => {
                              setCommissionModal(m);
                              setNewCommissionRate(m.commissionRate ?? 10);
                            }}
                            className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold text-[10px] flex items-center space-x-1"
                            title="Clique para ajustar comissão"
                          >
                            <Percent className="w-2.5 h-2.5" />
                            <span>{comm}% Comissão</span>
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          <strong>{pCount}</strong> produtos no catálogo
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Ações de aprovação pendente */}
                        {m.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveMerchant(m.id)}
                              title="Aprovar Cadastro"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => rejectMerchant(m.id)}
                              title="Rejeitar Cadastro"
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Ver Perfil */}
                        <button
                          onClick={() => setViewingMerchant(m)}
                          title="Visualizar Perfil Completo"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Editar Loja */}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          title="Editar Loja"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Suspender / Reativar */}
                        {m.status === 'approved' && (
                          <button
                            onClick={() => setSuspendModal(m)}
                            title="Suspender Loja"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {m.status === 'suspended' && (
                          <button
                            onClick={() => reactivateMerchant(m.id)}
                            title="Reativar Loja"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-bold"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Entrar como Lojista (Painel Vendedor) */}
                        <button
                          onClick={() => handleLoginAsMerchant(m)}
                          title={`Acessar Painel Vendedor de ${m.name}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-100/70 rounded-lg transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </button>

                        {/* Excluir Loja */}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Tem certeza que deseja excluir a loja "${m.name}"? Esta ação removerá a loja do catálogo.`
                              )
                            ) {
                              deleteMerchant(m.id);
                            }
                          }}
                          title="Excluir Loja"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VER DETALHES DA LOJA */}
      {viewingMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <img
                  src={viewingMerchant.logo}
                  alt={viewingMerchant.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-300"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{viewingMerchant.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    ID: {viewingMerchant.id} • {viewingMerchant.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingMerchant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={viewingMerchant.coverImage}
                  alt={viewingMerchant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white">
                    <div className="font-bold text-base">{viewingMerchant.name}</div>
                    <div className="text-xs text-slate-200">{viewingMerchant.description}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Proprietário(a)</span>
                  <span className="font-bold text-slate-800">{viewingMerchant.ownerName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">CNPJ / CPF</span>
                  <span className="font-bold text-slate-800">{viewingMerchant.cnpjOrCpf}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Telefone de Pedidos</span>
                  <span className="font-bold text-slate-800">{viewingMerchant.phone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">E-mail Corporativo</span>
                  <span className="font-bold text-slate-800">{viewingMerchant.email}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">Endereço de Operação</div>
                <div className="text-slate-600">
                  {viewingMerchant.address} - {viewingMerchant.neighborhood}, {viewingMerchant.city}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Horário: <strong>{viewingMerchant.openingHours}</strong> • Taxa padrão de entrega: R${' '}
                  {(viewingMerchant.deliveryFee ?? 0).toFixed(2)}
                </div>
              </div>

              {viewingMerchant.statusReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                  <div className="font-bold text-[11px] mb-0.5">Motivo Administrativo:</div>
                  <div>{viewingMerchant.statusReason}</div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setViewingMerchant(null);
                  handleOpenEdit(viewingMerchant);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Editar Estabelecimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR LOJA */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Editar Loja: {editingMerchant.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingMerchant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsável Legal *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.ownerName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={editFormData.category || categories[0]}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro em Macacu</label>
                  <select
                    value={editFormData.neighborhood || 'Centro'}
                    onChange={(e) => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    {macacuNeighborhoods.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Taxa Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.deliveryFee ?? 5}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, deliveryFee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Horário de Funcionamento</label>
                  <input
                    type="text"
                    value={editFormData.openingHours || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, openingHours: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Modalidades Suportadas</div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.supportsPickup ?? true}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, supportsPickup: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Retirada Balcão</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.supportsTrial ?? false}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, supportsTrial: e.target.checked })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Provador VIP</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editFormData.supportsAppointments ?? false}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, supportsAppointments: e.target.checked })
                      }
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span>Agendamentos</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMerchant(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTAR COMISSÃO */}
      {commissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-purple-600">
              <Percent className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-sm">
                Ajustar Comissão: {commissionModal.name}
              </h3>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Taxa de Comissão do Marketplace (%):
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold text-slate-900 outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Taxa padrão do sistema: 10%. Pode ser personalizada por parceiro.
              </span>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setCommissionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCommission}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
              >
                Salvar Taxa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUSPENDER LOJA */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Suspender Loja: {suspendModal.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  A loja ficará invisível para pedidos até ser reativada.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Motivo da Suspensão / Moderação:
              </label>
              <textarea
                rows={3}
                required
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Informe o motivo (ex: pendência contratual, problemas em entregas)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSuspendModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Confirmar Suspensão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRAR NOVA LOJA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Credenciar Novo Estabelecimento
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={newMerchantData.name}
                    onChange={(e) => setNewMerchantData({ ...newMerchantData, name: e.target.value })}
                    placeholder="Ex: Pastelaria Macacu"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Responsável *</label>
                  <input
                    type="text"
                    required
                    value={newMerchantData.ownerName}
                    onChange={(e) =>
                      setNewMerchantData({ ...newMerchantData, ownerName: e.target.value })
                    }
                    placeholder="Ex: Carlos Eduardo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={newMerchantData.email}
                    onChange={(e) => setNewMerchantData({ ...newMerchantData, email: e.target.value })}
                    placeholder="contato@pastelaria.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newMerchantData.phone}
                    onChange={(e) => setNewMerchantData({ ...newMerchantData, phone: e.target.value })}
                    placeholder="(21) 99999-7777"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newMerchantData.category}
                    onChange={(e) => setNewMerchantData({ ...newMerchantData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro</label>
                  <select
                    value={newMerchantData.neighborhood}
                    onChange={(e) =>
                      setNewMerchantData({ ...newMerchantData, neighborhood: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    {macacuNeighborhoods.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNPJ / CPF</label>
                  <input
                    type="text"
                    value={newMerchantData.cnpjOrCpf}
                    onChange={(e) =>
                      setNewMerchantData({ ...newMerchantData, cnpjOrCpf: e.target.value })
                    }
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar e Ativar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
