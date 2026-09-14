import React, { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  Store,
  UserCheck,
  Megaphone,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Radio,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  InAppNotification,
  NotificationAudience,
  NotificationCategory,
  NotificationPriority,
  NotificationChannel
} from '../../types';
import { NOTIFICATION_CHANNELS_STATUS } from '../../services/notification_service';

export const MasterNotificationsView: React.FC = () => {
  const {
    currentUser,
    users,
    merchants,
    notifications,
    sendInAppNotification,
    deleteInAppNotification,
    openNotificationDetailModal,
    triggerToast
  } = useApp();

  // Form State
  const [targetAudience, setTargetAudience] = useState<NotificationAudience>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [category, setCategory] = useState<NotificationCategory>('COMUNICADO');
  const [priority, setPriority] = useState<NotificationPriority>('NORMAL');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [actionUrl, setActionUrl] = useState<string>('');
  const [actionLabel, setActionLabel] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Filter & Search State for Logs
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Metrics calculation
  const totalNotifications = notifications.length;
  const broadcastCount = notifications.filter((n) => n.audience === 'ALL').length;
  const merchantsCount = notifications.filter((n) => n.audience === 'ALL_MERCHANTS' || n.recipientMerchantId).length;
  const customersCount = notifications.filter((n) => n.audience === 'ALL_CUSTOMERS' || n.recipientUserId).length;

  const totalReads = notifications.reduce((acc, curr) => acc + curr.readBy.length, 0);
  const averageReadsPerNotif = totalNotifications > 0 ? (totalReads / totalNotifications).toFixed(1) : '0';

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      triggerToast('Preencha o título e o conteúdo da notificação.');
      return;
    }

    if (targetAudience === 'SPECIFIC_USER' && !selectedUserId) {
      triggerToast('Selecione o cliente específico destinatário.');
      return;
    }

    if (targetAudience === 'SPECIFIC_MERCHANT' && !selectedMerchantId) {
      triggerToast('Selecione a loja específica destinatária.');
      return;
    }

    setIsSending(true);

    try {
      let recipientName = 'Todos os Usuários';
      let recipientUserId: string | undefined;
      let recipientMerchantId: string | undefined;

      if (targetAudience === 'ALL_MERCHANTS') {
        recipientName = 'Todos os Lojistas & Prestadores';
      } else if (targetAudience === 'ALL_CUSTOMERS') {
        recipientName = 'Todos os Clientes';
      } else if (targetAudience === 'SPECIFIC_USER') {
        const foundUser = users.find((u) => u.id === selectedUserId);
        recipientName = foundUser?.name || 'Cliente';
        recipientUserId = selectedUserId;
      } else if (targetAudience === 'SPECIFIC_MERCHANT') {
        const foundMerchant = merchants.find((m) => m.id === selectedMerchantId);
        recipientName = foundMerchant?.name || 'Lojista';
        recipientMerchantId = selectedMerchantId;
      }

      sendInAppNotification({
        title,
        message,
        category,
        audience: targetAudience,
        recipientUserId,
        recipientMerchantId,
        recipientName,
        senderName: 'Administração Master Achei Aqui',
        senderRole: 'MASTER',
        priority,
        actionUrl: actionUrl || undefined,
        actionLabel: actionLabel || undefined
      });

      // Reset form
      setTitle('');
      setMessage('');
      setActionUrl('');
      setActionLabel('');
      setSelectedUserId('');
      setSelectedMerchantId('');
      setTargetAudience('ALL');

      triggerToast('Mensagem enviada com sucesso para o app dos usuários!');
    } catch (err) {
      console.error('Erro ao enviar notificação:', err);
      triggerToast('Erro ao enviar notificação.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredLogs = notifications.filter((n) => {
    if (audienceFilter !== 'ALL' && n.audience !== audienceFilter) return false;
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      return (
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term) ||
        (n.recipientName && n.recipientName.toLowerCase().includes(term)) ||
        (n.orderCode && n.orderCode.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const handleCopyLink = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      triggerToast('Conteúdo copiado para a área de transferência!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Canal Status */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-md border border-emerald-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Central de Notificações em Tempo Real</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Disparo de Mensagens & Relatórios Master
            </h2>
            <p className="text-xs text-emerald-100/80 max-w-2xl">
              Envie comunicados oficiais, avisos e notificações direcionadas a todos os usuários, a todos os lojistas, a clientes ou a indivíduos específicos usando a conexão de internet do app Achei Aqui.
            </p>
          </div>

          {/* Status dos Canais */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-emerald-900/60 border border-emerald-400/40 px-3 py-2 rounded-2xl flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <p className="text-[10px] text-emerald-200 uppercase font-bold">Canal In-App (Internet)</p>
                <p className="text-xs font-black text-white">🟢 ATIVO (100% Gratuito)</p>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-2xl flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <p className="text-[10px] text-slate-300 uppercase font-bold">WhatsApp & SMS</p>
                <p className="text-xs font-bold text-amber-300">🟡 STANDBY (Preservado)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytical Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200 font-semibold">Total de Mensagens</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{totalNotifications}</p>
            <span className="text-[10px] text-emerald-300">Histórico completo</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200 font-semibold">Transmitidas a Todos</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{broadcastCount}</p>
            <span className="text-[10px] text-emerald-300">Broadcast público</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200 font-semibold">Para Lojistas</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{merchantsCount}</p>
            <span className="text-[10px] text-emerald-300">Lojas & prestadores</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] text-emerald-200 font-semibold">Para Clientes</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{customersCount}</p>
            <span className="text-[10px] text-emerald-300">Pedidos & avisos</span>
          </div>
        </div>
      </div>

      {/* Grid: Formulário de Envio + Relatórios de Disparo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Formulário de Composição de Mensagens */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Compor Nova Notificação</h3>
              <p className="text-[11px] text-slate-500">Disparo imediato para a conta dos usuários</p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-3.5">
            {/* Público-Alvo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destinatário / Público-Alvo:
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as NotificationAudience)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              >
                <option value="ALL">📢 Todos os Usuários da Plataforma (Broadcast Geral)</option>
                <option value="ALL_MERCHANTS">🏪 Todos os Lojistas & Prestadores de Serviço</option>
                <option value="ALL_CUSTOMERS">🛍️ Todos os Clientes & Consumidores</option>
                <option value="SPECIFIC_MERCHANT">🎯 Lojista / Loja Específica</option>
                <option value="SPECIFIC_USER">👤 Cliente / Usuário Específico</option>
              </select>
            </div>

            {/* Se for Lojista Específico */}
            {targetAudience === 'SPECIFIC_MERCHANT' && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione a Loja:
                </label>
                <select
                  required
                  value={selectedMerchantId}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-950 outline-none"
                >
                  <option value="">-- Escolha um Estabelecimento --</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category} - {m.membershipTier || 'GRÁTIS'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Se for Usuário/Cliente Específico */}
            {targetAudience === 'SPECIFIC_USER' && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Cliente:
                </label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-blue-50/70 border border-blue-300 rounded-xl text-xs font-semibold text-blue-950 outline-none"
                >
                  <option value="">-- Escolha um Usuário Cadastrado --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email} - {u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Categoria e Prioridade */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                >
                  <option value="COMUNICADO">📢 Comunicado Oficial</option>
                  <option value="SISTEMA">⚙️ Sistema / Manutenção</option>
                  <option value="AVISO">🔔 Aviso Importante</option>
                  <option value="COMISSAO">💰 Planos & Comissões</option>
                  <option value="PROMO">✨ Promoção & Destaques</option>
                  <option value="SEGURANCA">🛡️ Segurança & LGPD</option>
                  <option value="URGENTE">⚠️ Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prioridade:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título da Notificação:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Novo recurso disponível no Achei Aqui"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mensagem Completa:
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva a mensagem que aparecerá no cabeçalho e na conta do usuário..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Botão de Ação / Link Opcional */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Link / Seção (Opcional):
                </label>
                <select
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="">Sem botão de link</option>
                  <option value="account">Minha Conta</option>
                  <option value="orders">Painel de Pedidos</option>
                  <option value="plans">Planos de Adesão</option>
                  <option value="home">Marketplace Principal</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Texto do Botão (Opcional):
                </label>
                <input
                  type="text"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Ex: Ver Planos"
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Disparando...' : 'Transmitir Notificação para o App'}</span>
            </button>
          </form>
        </div>

        {/* Painel Direito: Relatórios e Histórico de Notificações */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Header e Filtros */}
          <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Relatório de Notificações do Sistema</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {filteredLogs.length}
                </span>
              </div>

              <span className="text-[11px] text-slate-400 font-medium">
                Média de leituras: <strong className="text-emerald-700">{averageReadsPerNotif}</strong> por mensagem
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar destinatário, título..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                />
              </div>

              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
              >
                <option value="ALL">Todos os Públicos</option>
                <option value="ALL_MERCHANTS">Lojistas</option>
                <option value="ALL_CUSTOMERS">Clientes</option>
                <option value="SPECIFIC_MERCHANT">Loja Específica</option>
                <option value="SPECIFIC_USER">Cliente Específico</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
              >
                <option value="ALL">Todas as Categorias</option>
                <option value="COMUNICADO">Comunicados</option>
                <option value="PEDIDO">Pedidos</option>
                <option value="COMISSAO">Planos/Taxas</option>
                <option value="SEGURANCA">Segurança</option>
              </select>
            </div>
          </div>

          {/* Lista de Registros e Auditoria */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[560px] flex-1">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Bell className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-bold text-slate-600">Nenhum registro encontrado</p>
                <p className="text-[11px] text-slate-400">
                  Dispare um novo comunicado pelo formulário ao lado para gerar relatórios em tempo real.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const readCount = log.readBy.length;
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {log.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {log.audience === 'ALL'
                            ? '📢 Geral'
                            : log.audience === 'ALL_MERCHANTS'
                            ? '🏪 Lojistas'
                            : log.audience === 'ALL_CUSTOMERS'
                            ? '🛍️ Clientes'
                            : '👤 Privado'}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{log.title}</span>
                        {log.orderCode && (
                          <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                            #{log.orderCode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400 text-[11px] shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                          {readCount} {readCount === 1 ? 'leitura' : 'leituras'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl font-sans border border-slate-100 whitespace-pre-line">
                      {log.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-700">Destinatário:</span>
                        <span className="text-slate-600">{log.recipientName || 'Geral'}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          (Entregue via Internet do App)
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleCopyLink(log.message, log.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                          title="Copiar texto da mensagem"
                        >
                          {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === log.id ? 'Copiado!' : 'Copiar'}</span>
                        </button>

                        <button
                          onClick={() => openNotificationDetailModal(log)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <span>Visualizar como Usuário</span>
                        </button>

                        <button
                          onClick={() => deleteInAppNotification(log.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir notificação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterNotificationsView;
