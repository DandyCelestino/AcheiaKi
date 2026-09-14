import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  KeyRound,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Eye,
  LogIn,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  Save,
  FileSpreadsheet,
  Ruler,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, CustomerAddress, VipMeasurements } from '../../types';

interface MasterUsersViewProps {
  onOpenDossier?: (target: { userId?: string; merchantId?: string }) => void;
}

export const MasterUsersView: React.FC<MasterUsersViewProps> = ({ onOpenDossier }) => {
  const {
    users,
    currentUser,
    orders,
    createUserByMaster,
    updateUserByMaster,
    blockUserByMaster,
    suspendUserByMaster,
    reactivateUserByMaster,
    deleteUserByMaster,
    resetUserPasswordByMaster,
    toggleUserVerificationByMaster,
    impersonateUser,
    triggerToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'suspended' | 'blocked'>('ALL');
  
  // Modals
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionReasonModal, setActionReasonModal] = useState<{
    user: User;
    actionType: 'block' | 'suspend';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Create Form State
  const [newUserData, setNewUserData] = useState({
    name: '',
    nickname: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    role: 'CLIENTE' as UserRole,
    city: 'Cachoeiras de Macacu, RJ',
    address: '',
    neighborhood: 'Centro',
    cpf: '',
    birthDate: '',
    gender: 'Prefiro não informar' as any,
    isEmailVerified: true,
    status: 'active' as const
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.cpf && u.cpf.includes(q)) ||
        (u.neighborhood && u.neighborhood.toLowerCase().includes(q));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const userStatus = u.status || 'active';
      const matchesStatus = statusFilter === 'ALL' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      nickname: user.nickname || '',
      email: user.email,
      phone: user.phone,
      secondaryPhone: user.secondaryPhone || '',
      role: user.role,
      city: user.city || 'Cachoeiras de Macacu, RJ',
      address: user.address || '',
      neighborhood: user.neighborhood || 'Centro',
      cpf: user.cpf || '',
      birthDate: user.birthDate || '',
      gender: user.gender || 'Prefiro não informar',
      generalNotes: user.generalNotes || '',
      isEmailVerified: user.isEmailVerified ?? true
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUserByMaster(editingUser.id, editFormData);
    setEditingUser(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email) {
      triggerToast('Preencha ao menos o nome e e-mail.');
      return;
    }
    createUserByMaster(newUserData);
    setShowCreateModal(false);
    setNewUserData({
      name: '',
      nickname: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      role: 'CLIENTE',
      city: 'Cachoeiras de Macacu, RJ',
      address: '',
      neighborhood: 'Centro',
      cpf: '',
      birthDate: '',
      gender: 'Prefiro não informar',
      isEmailVerified: true,
      status: 'active'
    });
  };

  const handleConfirmStatusAction = () => {
    if (!actionReasonModal) return;
    const { user, actionType } = actionReasonModal;
    if (actionType === 'block') {
      blockUserByMaster(user.id, actionReason || 'Bloqueio administrativo');
    } else {
      suspendUserByMaster(user.id, actionReason || 'Suspensão preventiva');
    }
    setActionReasonModal(null);
    setActionReason('');
  };

  const getUserOrdersCount = (userId: string) => {
    return orders.filter((o) => o.userId === userId || o.customerName === users.find(u => u.id === userId)?.name).length;
  };

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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Gestão Integral de Usuários & Contas
              </h2>
              <p className="text-xs text-slate-500">
                Controle total sobre Clientes, Lojistas, Entregadores e Administradores no município.
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
            <span>Cadastrar Usuário</span>
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
            placeholder="Pesquisar por nome, e-mail, telefone, CPF ou bairro..."
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="CLIENTE">Clientes</option>
            <option value="VENDEDOR">Vendedores / Lojas</option>
            <option value="MASTER">Master Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
        <span>
          Exibindo <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuários registrados
        </span>
      </div>

      {/* Users Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Usuário & Contato</th>
                <th className="px-4 py-3.5">Perfil</th>
                <th className="px-4 py-3.5">Bairro / Cidade</th>
                <th className="px-4 py-3.5">Status & Segurança</th>
                <th className="px-4 py-3.5">Ficha & Pedidos</th>
                <th className="px-4 py-3.5 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const status = u.status || 'active';
                const ordersCount = getUserOrdersCount(u.id);

                return (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => onOpenDossier ? onOpenDossier({ userId: u.id }) : setViewingUser(u)}
                          className="relative group cursor-pointer"
                          title="Clique na foto para abrir o Dossiê 360°"
                        >
                          <img
                            src={
                              u.avatar ||
                              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80`
                            }
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                          />
                          {u.twoFactorEnabled && (
                            <span
                              title="2FA Ativado"
                              className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 text-white rounded-full"
                            >
                              <ShieldCheck className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenDossier ? onOpenDossier({ userId: u.id }) : setViewingUser(u)}
                            className="text-left group cursor-pointer"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 flex items-center space-x-1.5 transition-colors">
                              <span>{u.name}</span>
                              {u.nickname && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({u.nickname})
                                </span>
                              )}
                            </div>
                          </button>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'MASTER'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'VENDEDOR'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center space-x-1 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{u.neighborhood || 'Centro'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {u.city || 'Cachoeiras de Macacu, RJ'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div>
                          {status === 'active' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>Ativo</span>
                            </span>
                          )}
                          {status === 'suspended' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Suspenso</span>
                            </span>
                          )}
                          {status === 'blocked' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              <span>Bloqueado</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 text-[10px]">
                          <button
                            onClick={() => toggleUserVerificationByMaster(u.id)}
                            className={`px-1.5 py-0.5 rounded border transition-colors ${
                              u.isEmailVerified
                                ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Clique para alternar validação"
                          >
                            {u.isEmailVerified ? 'Email Verificado' : 'Email Pendente'}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5 text-slate-600 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <ShoppingBag className="w-3 h-3 text-slate-400" />
                          <span><strong>{ordersCount}</strong> pedidos realizados</span>
                        </div>
                        {u.addresses && u.addresses.length > 0 && (
                          <div className="text-[10px] text-blue-600 font-medium">
                            {u.addresses.length} endereço(s) cadastrados
                          </div>
                        )}
                        {u.measurements && (
                          <div className="text-[10px] text-purple-600 font-medium flex items-center space-x-1">
                            <Ruler className="w-2.5 h-2.5" />
                            <span>Ficha VIP completa ({u.measurements.topSize}/{u.measurements.shoeSize})</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Ver Ficha Completa */}
                        <button
                          onClick={() => setViewingUser(u)}
                          title="Ver Ficha Cadastral Completa"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Editar Cadastro"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Resetar Senha */}
                        <button
                          onClick={() => resetUserPasswordByMaster(u.id)}
                          title="Resetar Senha / Gerar Temporária"
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Toggle (Block/Suspend/Reactivate) */}
                        {status === 'active' ? (
                          <>
                            <button
                              onClick={() =>
                                setActionReasonModal({ user: u, actionType: 'suspend' })
                              }
                              title="Suspender Temporariamente"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setActionReasonModal({ user: u, actionType: 'block' })
                              }
                              title="Bloquear Acesso"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => reactivateUserByMaster(u.id)}
                            title="Reativar Usuário"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-bold"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Impersonate / Assumir Sessão */}
                        <button
                          onClick={() => impersonateUser(u)}
                          title={`Assumir sessão de ${u.name}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-100/70 rounded-lg transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                        </button>

                        {/* Excluir (Se não for o próprio Master) */}
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Tem certeza que deseja excluir o usuário "${u.name}" definitivamente? Esta ação é auditada.`
                                )
                              ) {
                                deleteUserByMaster(u.id);
                              }
                            }}
                            title="Excluir Usuário"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VER FICHA CADASTRAL COMPLETA */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ficha Cadastral & Perfil VIP: {viewingUser.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ID: {viewingUser.id} • Perfil: {viewingUser.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Resumo Principal */}
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={
                    viewingUser.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                  }
                  alt={viewingUser.name}
                  className="w-16 h-16 rounded-full object-cover border border-slate-300"
                />
                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900">{viewingUser.name}</div>
                  <div className="text-slate-500">CPF: {viewingUser.cpf || 'Não cadastrado'}</div>
                  <div className="text-slate-500">
                    Data Nasc: {viewingUser.birthDate || 'Não informada'} • Gênero:{' '}
                    {viewingUser.gender || 'Não informado'}
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold">
                    Criado em: {viewingUser.createdAt}
                  </div>
                </div>
              </div>

              {/* Contatos */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider text-slate-500">
                  Canais de Contato
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">E-mail</span>
                    <span className="font-bold text-slate-800">{viewingUser.email}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Telefone Principal</span>
                    <span className="font-bold text-slate-800">{viewingUser.phone}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Telefone Recados</span>
                    <span className="font-bold text-slate-800">
                      {viewingUser.secondaryPhone || 'Nenhum'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Contato de Emergência</span>
                    <span className="font-bold text-slate-800">
                      {viewingUser.emergencyContact
                        ? `${viewingUser.emergencyContact.name} (${viewingUser.emergencyContact.relationship}) - ${viewingUser.emergencyContact.phone}`
                        : 'Nenhum'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Endereços */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider text-slate-500">
                  Endereços Registrados ({viewingUser.addresses?.length || 0})
                </h4>
                {viewingUser.addresses && viewingUser.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {viewingUser.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span>{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`} -{' '}
                            {addr.neighborhood}, {addr.city} - {addr.state}
                          </div>
                          {addr.referencePoint && (
                            <div className="text-[10px] text-slate-400">
                              Ref: {addr.referencePoint}
                            </div>
                          )}
                          {addr.deliveryInstructions && (
                            <div className="text-[10px] text-slate-500 italic">
                              Instruções: {addr.deliveryInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-400">
                    Endereço básico cadastrado: {viewingUser.address || 'Nenhum'} (
                    {viewingUser.neighborhood || 'Centro'})
                  </div>
                )}
              </div>

              {/* Ficha de Medidas VIP */}
              {viewingUser.measurements && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider text-slate-500">
                    Ficha de Medidas & Provador VIP
                  </h4>
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-purple-700 block">Tamanho Superior</span>
                      <strong className="text-slate-900">{viewingUser.measurements.topSize}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-700 block">Calça / Inferior</span>
                      <strong className="text-slate-900">{viewingUser.measurements.bottomSize}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-700 block">Calçado</span>
                      <strong className="text-slate-900">{viewingUser.measurements.shoeSize}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-700 block">Altura / Peso</span>
                      <span className="text-slate-800">
                        {viewingUser.measurements.height || '-'} / {viewingUser.measurements.weight || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-700 block">Caimento</span>
                      <span className="text-slate-800">{viewingUser.measurements.preferredFit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-700 block">Estilos</span>
                      <span className="text-slate-800">
                        {viewingUser.measurements.stylePreferences?.join(', ') || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setViewingUser(null);
                  handleOpenEdit(viewingUser);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Editar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CADASTRO DO USUÁRIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Editar Cadastro: {editingUser.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apelido / Nome Social</label>
                  <input
                    type="text"
                    value={editFormData.nickname || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
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
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perfil / Cargo</label>
                  <select
                    value={editFormData.role || 'CLIENTE'}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="CLIENTE">CLIENTE</option>
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="MASTER">MASTER</option>
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
                  <label className="block font-bold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={editFormData.cpf || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço Principal</label>
                <input
                  type="text"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  placeholder="Rua, Número, Complemento"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas Administrativas / Observações</label>
                <textarea
                  rows={2}
                  value={editFormData.generalNotes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, generalNotes: e.target.value })}
                  placeholder="Observações visíveis apenas para a equipe administrativa..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Status de E-mail Verificado</span>
                  <span className="text-[11px] text-slate-500">
                    Permite login direto sem pendência de confirmação
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.isEmailVerified ?? true}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, isEmailVerified: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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

      {/* MODAL: CRIAR NOVO USUÁRIO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cadastrar Novo Usuário no Sistema
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
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apelido / Social</label>
                  <input
                    type="text"
                    value={newUserData.nickname}
                    onChange={(e) => setNewUserData({ ...newUserData, nickname: e.target.value })}
                    placeholder="Ex: Joãozinho"
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
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="(21) 99999-8888"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Perfil</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="CLIENTE">CLIENTE</option>
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="MASTER">MASTER ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bairro em Macacu</label>
                  <select
                    value={newUserData.neighborhood}
                    onChange={(e) => setNewUserData({ ...newUserData, neighborhood: e.target.value })}
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
                  <label className="block font-bold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={newUserData.cpf}
                    onChange={(e) => setNewUserData({ ...newUserData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={newUserData.address}
                  onChange={(e) => setNewUserData({ ...newUserData, address: e.target.value })}
                  placeholder="Rua, Número, Referência"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
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
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MOTIVO DE BLOQUEIO OU SUSPENSÃO */}
      {actionReasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {actionReasonModal.actionType === 'block'
                    ? `Bloquear Acesso: ${actionReasonModal.user.name}`
                    : `Suspender Temporariamente: ${actionReasonModal.user.name}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Esta ação é registrada no log de auditoria do sistema.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Justificativa / Motivo Administrativo:
              </label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Informe o motivo formal (ex: contestações indevidas, verificação cadastral)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActionReasonModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusAction}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold ${
                  actionReasonModal.actionType === 'block'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Confirmar {actionReasonModal.actionType === 'block' ? 'Bloqueio' : 'Suspensão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
