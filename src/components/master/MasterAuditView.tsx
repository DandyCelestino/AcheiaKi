import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  User,
  Laptop,
  Globe,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  Lock,
  MessageSquare,
  ShoppingBag,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditCategory, AuditSeverity, AuditLog } from '../../types';

export const MasterAuditView: React.FC = () => {
  const { auditLogs, clearAuditLogs, triggerToast, getAuditStats, exportAuditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const stats = useMemo(() => {
    return getAuditStats();
  }, [getAuditStats, auditLogs]);

  // Unique actions list for filter
  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((log) => set.add(log.action));
    return Array.from(set).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        log.action.toLowerCase().includes(q) ||
        log.userEmail.toLowerCase().includes(q) ||
        (log.userName && log.userName.toLowerCase().includes(q)) ||
        (log.entityId && log.entityId.toLowerCase().includes(q)) ||
        log.details.toLowerCase().includes(q) ||
        (log.ipAddress && log.ipAddress.includes(q)) ||
        (log.device && log.device.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'ALL' || (log.category || 'GENERAL') === categoryFilter;
      const matchesSeverity = severityFilter === 'ALL' || (log.severity || 'INFO') === severityFilter;
      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

      return matchesSearch && matchesCategory && matchesSeverity && matchesAction;
    });
  }, [auditLogs, searchQuery, categoryFilter, severityFilter, actionFilter]);

  const getActionColor = (action: string, category?: AuditCategory, severity?: AuditSeverity) => {
    if (severity === 'CRITICAL' || severity === 'SECURITY') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (severity === 'WARNING') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (category === 'FINANCIAL') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (category === 'COMMUNICATION') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (category === 'ORDER') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getCategoryBadge = (cat?: AuditCategory) => {
    switch (cat) {
      case 'SECURITY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Segurança</span>;
      case 'DATA_PRIVACY':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">LGPD / Dados</span>;
      case 'COMMUNICATION':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Mensagens</span>;
      case 'ORDER':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Pedidos</span>;
      case 'FINANCIAL':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Financeiro</span>;
      case 'USER_MANAGEMENT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Usuários</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Geral</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                Auditoria, Rastreabilidade & Segurança
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                  Total Compliance LGPD
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Registro imutável de mensagens em subpedidos, mudanças de status, liberações de dados do comprador e intervenções master.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportAuditLogs('csv')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
            title="Exportar em formato CSV (Excel/Planilhas)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => exportAuditLogs('json')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
            title="Exportar arquivo JSON completo com metadados"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Deseja arquivar e reiniciar a lista de logs? Esta ação gerará um registro de auditoria AUDIT_LOGS_PURGE.'
                )
              ) {
                clearAuditLogs();
              }
            }}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reiniciar Logs</span>
          </button>
        </div>
      </div>

      {/* Rastreabilidade Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total de Eventos</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <span className="text-[10px] text-slate-400">Registrados em banco</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Liberação de Dados (LGPD)</span>
            <Lock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.dataReleaseCount}</p>
          <span className="text-[10px] text-rose-500 font-medium">Acessos a dados do comprador</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700">Mensagens em Chats</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-1">{stats.messageEventsCount}</p>
          <span className="text-[10px] text-indigo-500 font-medium">Interações em subpedidos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">Status & Estoque</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.statusChangesCount}</p>
          <span className="text-[10px] text-blue-500 font-medium">Ciclo de vida dos pedidos</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por ação, usuário, ID de pedido, IP, detalhes..."
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

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas Categorias</option>
            <option value="SECURITY">Segurança</option>
            <option value="DATA_PRIVACY">Privacidade / LGPD</option>
            <option value="COMMUNICATION">Comunicação / Chat</option>
            <option value="ORDER">Pedidos & Estoque</option>
            <option value="FINANCIAL">Financeiro & Taxas</option>
            <option value="USER_MANAGEMENT">Usuários & Lojas</option>
            <option value="SYSTEM">Sistema & Backup</option>
          </select>

          {/* Severidade */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas Severidades</option>
            <option value="CRITICAL">Crítica / Alta</option>
            <option value="SECURITY">Segurança</option>
            <option value="WARNING">Aviso / Warning</option>
            <option value="INFO">Informativo</option>
          </select>

          {/* Ação */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500 max-w-[180px]"
          >
            <option value="ALL">Todas Ações</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table / Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3.5">Data & Hora</th>
                <th className="px-4 py-3.5">Categoria</th>
                <th className="px-4 py-3.5">Ação / Evento</th>
                <th className="px-4 py-3.5">Usuário / Papel</th>
                <th className="px-4 py-3.5">Detalhes & Rastreabilidade</th>
                <th className="px-4 py-3.5 text-right">Origem (IP/Dispositivo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum registro de auditoria encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getCategoryBadge(log.category)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getActionColor(
                          log.action,
                          log.category,
                          log.severity
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800 flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.userName || log.userEmail}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="font-medium text-slate-600">{log.userRole || 'VISITANTE'}</span>
                        {log.userId && <span>• ID: {log.userId}</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-slate-800 font-medium max-w-lg leading-relaxed">
                        {log.details}
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(log.metadata).map(([key, value]) => {
                            if (typeof value === 'object') return null;
                            return (
                              <span key={key} className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {key}: {String(value)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="text-[11px] text-slate-600 font-mono">
                        {log.ipAddress || '127.0.0.1'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px] inline-block">
                        {log.device || 'Navegador Web'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
