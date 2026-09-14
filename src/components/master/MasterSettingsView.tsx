import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Save,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Radio,
  Percent,
  Truck,
  CheckCircle,
  Clock,
  Sparkles,
  Database,
  FileCode,
  Lock,
  Layers,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SystemSettings } from '../../types';

export const MasterSettingsView: React.FC = () => {
  const {
    systemSettings,
    updateSystemSettings,
    exportFullDatabaseSnapshot,
    importFullDatabaseSnapshot,
    resetDatabaseToDefaults,
    triggerToast
  } = useApp();

  const [formData, setFormData] = useState<SystemSettings>({ ...systemSettings });
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmWord, setResetConfirmWord] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(formData);
  };

  const handleExportSnapshot = () => {
    const jsonString = exportFullDatabaseSnapshot();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `acheiaqui_database_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Snapshot completo do banco de dados exportado com sucesso!');
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const success = importFullDatabaseSnapshot(importJsonText.trim());
    if (success) {
      setShowImportModal(false);
      setImportJsonText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    if (resetConfirmWord !== 'RESTAURAR') {
      triggerToast('Palavra de confirmação incorreta.');
      return;
    }
    resetDatabaseToDefaults();
    setShowResetModal(false);
    setResetConfirmWord('');
    setFormData({ ...systemSettings });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Parâmetros Globais, Políticas & Backup
              </h2>
              <p className="text-xs text-slate-500">
                Ajuste os parâmetros centrais da plataforma, taxas municipais, avisos de emergência e gestão de snapshots.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Parâmetros Principais */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Regras de Negócio & Políticas do Marketplace</span>
            </h3>

            {/* Taxas & Comissões */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Taxa de Comissão Padrão (%)
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.defaultCommissionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultCommissionRate: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Aplicada automaticamente a novas lojas cadastradas.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Taxa Municipal Base de Entrega (R$)
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="0.5"
                    value={formData.standardDeliveryFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        standardDeliveryFee: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Valor sugerido para corridas dentro do perímetro urbano.
                </span>
              </div>
            </div>

            {/* Provador VIP & Prazos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Prazo de Devolução Provador VIP (Dias)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxTrialDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTrialDays: parseInt(e.target.value) || 2
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Tempo máximo que o cliente pode reter a malinha de roupas em casa.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp de Suporte Central
                </label>
                <input
                  type="text"
                  value={formData.supportPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, supportPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Toggles de Acesso e Cadastro */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Auto-Aprovação de Lojistas</span>
                  <span className="text-[11px] text-slate-500">
                    Se ativado, novas lojas entram no catálogo instantaneamente sem aprovação manual.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoApproveMerchants}
                  onChange={(e) =>
                    setFormData({ ...formData, autoApproveMerchants: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Cadastro Público de Clientes</span>
                  <span className="text-[11px] text-slate-500">
                    Permite que novos munícipes criem conta livremente no marketplace.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowCustomerRegistration}
                  onChange={(e) =>
                    setFormData({ ...formData, allowCustomerRegistration: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Balão Flutuante de Notificações (Floating Ball)</span>
                  <span className="text-[11px] text-slate-500">
                    Exibe balões flutuantes fixos na tela para usuários logados com notificações pendentes, mantendo-os visíveis até que o usuário clique em 'X'.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableFloatingNotificationBall !== false}
                  onChange={(e) =>
                    setFormData({ ...formData, enableFloatingNotificationBall: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 block">Modo Manutenção Geral</span>
                  <span className="text-[11px] text-amber-700">
                    Suspende a realização de novos pedidos temporariamente.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenanceMode: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-600 rounded"
                />
              </div>
            </div>

            {/* Alerta de Transmissão Global */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">
                    Alerta de Transmissão na Home (Banner)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Exibe um comunicado em destaque para todos os visitantes do marketplace.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.broadcastAlertEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, broadcastAlertEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              {formData.broadcastAlertEnabled && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mensagem do Comunicado:
                  </label>
                  <input
                    type="text"
                    value={formData.broadcastMessage || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, broadcastMessage: e.target.value })
                    }
                    placeholder="Ex: Feriado municipal: lojas do centro funcionando até às 14h."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configurações</span>
              </button>
            </div>
          </form>
        </div>

        {/* Central de Snapshots & Recuperação de Desastres */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Snapshots & Backup Completo</span>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Exporte uma cópia completa de todos os dados do ecossistema (Usuários, Lojas, Catálogo, Pedidos, Auditoria) para armazenamento local e segurança.
            </p>

            <button
              onClick={handleExportSnapshot}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Snapshot (.json)</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Restaurar / Importar Snapshot</span>
            </button>
          </div>

          <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-rose-900 font-bold text-sm border-b border-rose-200 pb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Zona de Alto Risco</span>
            </div>

            <p className="text-rose-700 leading-relaxed">
              Restaura a base de dados original limpa com as lojas e usuários padrão de demonstração. Use com cautela.
            </p>

            <button
              onClick={() => setShowResetModal(true)}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center space-x-2 transition-colors shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resetar Banco para Padrão</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: IMPORTAR SNAPSHOT */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Restaurar Snapshot do Banco de Dados
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload de Arquivo JSON:
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ou Cole o Conteúdo do Backup (JSON):
                </label>
                <textarea
                  rows={8}
                  required
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"version": "2.0-SUPREMO", "users": [...], ...}'
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Validar & Restaurar Base</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE RESET DE FÁBRICA */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Restaurar Banco para Padrão Inicial
                </h3>
                <p className="text-[11px] text-slate-500">
                  Esta ação substituirá todos os dados pelos registros padrão de Cachoeiras de Macacu.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Digite <span className="text-rose-600 font-mono">RESTAURAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmWord}
                onChange={(e) => setResetConfirmWord(e.target.value)}
                placeholder="RESTAURAR"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center font-bold text-slate-900 outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmWord('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetConfirmWord !== 'RESTAURAR'}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold ${
                  resetConfirmWord === 'RESTAURAR'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Confirmar Restauração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
