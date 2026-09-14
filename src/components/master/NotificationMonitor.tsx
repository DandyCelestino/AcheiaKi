import React, { useState, useEffect } from 'react';
import {
  Send,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Phone,
  Database,
  Search,
  Filter,
  MessageSquare,
  ShieldAlert,
  ExternalLink,
  Copy,
  Check,
  CheckCheck
} from 'lucide-react';
import { NotificationService, getSupabaseClient } from '../../services/notification_service';
import { NotificationLog, NotificationChannel, NotificationEventType } from '../../types';
import { useApp } from '../../context/AppContext';

export const NotificationMonitor: React.FC = () => {
  const { orders, triggerToast } = useApp();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Test dispatch form
  const [testRecipientName, setTestRecipientName] = useState('Cliente Teste');
  const [testRecipientPhone, setTestRecipientPhone] = useState('(21) 98765-4321');
  const [testChannel, setTestChannel] = useState<NotificationChannel>('WHATSAPP');
  const [testEventType, setTestEventType] = useState<NotificationEventType>('ORDER_PLACED');
  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste transacional enviada pelo Achei Aqui.');
  const [isSending, setIsSending] = useState(false);

  const supabaseActive = !!getSupabaseClient();

  const loadLogs = () => {
    const data = NotificationService.getHistory();
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (channelFilter !== 'ALL' && log.channel !== channelFilter) return false;
    if (eventTypeFilter !== 'ALL' && log.eventType !== eventTypeFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = log.recipientName?.toLowerCase().includes(q);
      const matchPhone = log.recipientPhone?.includes(q);
      const matchMsg = log.message?.toLowerCase().includes(q);
      const matchCode = log.orderCode?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg && !matchCode) return false;
    }
    return true;
  });

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipientPhone.trim()) {
      triggerToast('Informe o telefone do destinatário.');
      return;
    }

    setIsSending(true);
    await NotificationService.sendNotification({
      eventType: testEventType,
      recipientName: testRecipientName,
      recipientPhone: testRecipientPhone,
      channel: testChannel,
      title: `Teste de Notificação [${testEventType}]`,
      message: testMessage,
      metadata: { isManualTest: true, timestamp: new Date().toISOString() }
    });

    setIsSending(false);
    loadLogs();
    triggerToast('Notificação transacional disparada e persistida no Supabase!');
  };

  const handleCopyLink = (phone: string, message: string, id: string) => {
    const link = NotificationService.generateWhatsAppDeepLink(phone, message);
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    triggerToast('Link do WhatsApp copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Header com Status do Banco Supabase & Estatísticas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              Gateway de Mensagens Transacionais & Supabase
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 ${
                supabaseActive
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{supabaseActive ? 'Supabase Conectado (Live)' : 'Modo Resiliente Local (Ativo)'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro automático de eventos de pedidos, reservas, provador VIP e autenticação para o comércio de Cachoeiras de Macacu.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Logs</span>
          </button>
        </div>
      </div>

      {/* Grid: Formulário de Disparo Manual + Lista de Notificações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Disparador de Teste */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Send className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Disparar Mensagem de Teste</h3>
          </div>

          <form onSubmit={handleSendTest} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Destinatário</label>
              <input
                type="text"
                required
                value={testRecipientName}
                onChange={(e) => setTestRecipientName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                required
                value={testRecipientPhone}
                onChange={(e) => setTestRecipientPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canal</label>
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">E-mail</option>
                  <option value="PUSH">Push</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Evento</label>
                <select
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value as NotificationEventType)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="ORDER_PLACED">Novo Pedido</option>
                  <option value="ORDER_READY_PICKUP">Pronto Retirada</option>
                  <option value="TRIAL_REQUESTED">Provador VIP</option>
                  <option value="SERVICE_BOOKED">Agendamento</option>
                  <option value="PASSWORD_RESET">Código Segurança</option>
                  <option value="WELCOME">Boas-vindas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo da Mensagem</label>
              <textarea
                rows={3}
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Enviando...' : 'Disparar & Salvar no Supabase'}</span>
            </button>
          </form>
        </div>

        {/* Painel Direito: Lista de Logs de Auditoria de Notificações */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          {/* Barra de Filtros */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-sm text-slate-900">Histórico de Disparos Transacionais</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {filteredLogs.length}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar destinatário..."
                  className="pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </div>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none"
              >
                <option value="ALL">Todos os Canais</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">E-mail</option>
              </select>
            </div>
          </div>

          {/* Lista de Registros */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px] flex-1">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Nenhuma notificação registrada ainda.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Faça um pedido no marketplace ou dispare um teste para ver os logs em tempo real.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.channel === 'WHATSAPP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.channel === 'EMAIL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {log.channel}
                      </span>
                      <span className="font-bold text-xs text-slate-800">{log.title}</span>
                      {log.orderCode && (
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          #{log.orderCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="flex items-center text-emerald-600 font-semibold ml-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-0.5">{log.status}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-xl font-mono text-[11px] border border-slate-100">
                    {log.message}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">{log.recipientName}</span>
                      <span className="text-slate-400">({log.recipientPhone})</span>
                    </div>

                    {log.channel === 'WHATSAPP' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopyLink(log.recipientPhone, log.message, log.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          {copiedId === log.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === log.id ? 'Copiado!' : 'Copiar Link'}</span>
                        </button>
                        <a
                          href={NotificationService.generateWhatsAppDeepLink(log.recipientPhone, log.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default NotificationMonitor;
