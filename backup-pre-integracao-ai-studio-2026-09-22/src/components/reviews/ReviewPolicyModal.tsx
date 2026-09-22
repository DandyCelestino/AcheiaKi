import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Star,
  Store,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Award,
  Sparkles,
  Info,
  ChevronRight,
  HeartHandshake,
  MessageSquare
} from 'lucide-react';
import { REVIEW_POLICY_DATA } from '../../data/reviewPolicyData';

interface ReviewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'customer' | 'merchant' | 'moderation';
}

export const ReviewPolicyModal: React.FC<ReviewPolicyModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'customer'
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant' | 'moderation'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Diretrizes Oficiais
                </span>
                <span className="text-[11px] text-slate-400">
                  {REVIEW_POLICY_DATA.lastUpdated}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {REVIEW_POLICY_DATA.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('customer')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'customer'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>Cliente → Loja & Prestador</span>
          </button>

          <button
            onClick={() => setActiveTab('merchant')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'merchant'
                ? 'border-emerald-600 text-emerald-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Lojista → Cliente</span>
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === 'moderation'
                ? 'border-purple-600 text-purple-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-500" />
            <span>Moderação & Integridade</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Mission intro */}
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start space-x-3 text-xs text-blue-900 leading-relaxed">
            <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-blue-950 font-bold mb-0.5">
                Compromisso com o Comércio de Cachoeiras de Macacu
              </strong>
              {REVIEW_POLICY_DATA.intro}
            </div>
          </div>

          {/* TAB 1: CLIENTE PARA LOJISTA */}
          {activeTab === 'customer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span>Como o Cliente Avalia Lojas e Prestadores</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Garantia de que apenas clientes reais e compras verificadas expressam sua opinião.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {REVIEW_POLICY_DATA.sections[0].rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {rule.heading}
                      </h4>
                      {rule.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                          {rule.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Critérios Breakdown Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Os 4 Pilares de Avaliação de Estabelecimentos</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg block">💎</span>
                    <span className="text-xs font-bold text-slate-800">Qualidade</span>
                    <p className="text-[10px] text-slate-500">Produto ou serviço</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg block">⏱️</span>
                    <span className="text-xs font-bold text-slate-800">Pontualidade</span>
                    <p className="text-[10px] text-slate-500">Entrega e prazos</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg block">💬</span>
                    <span className="text-xs font-bold text-slate-800">Atendimento</span>
                    <p className="text-[10px] text-slate-500">Atenção e respeito</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg block">🏷️</span>
                    <span className="text-xs font-bold text-slate-800">Custo-Benefício</span>
                    <p className="text-[10px] text-slate-500">Preço justo</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOJISTA PARA CLIENTE */}
          {activeTab === 'merchant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <span>Como o Lojista Avalia a Conduta do Cliente</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Valorização do cliente pontual e proteção contra abusos no comércio local.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {REVIEW_POLICY_DATA.sections[1].rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl border border-slate-200 hover:border-emerald-200 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {rule.heading}
                      </h4>
                      {rule.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                          {rule.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Benefícios do Cliente 5 Estrelas */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-900 to-teal-900 text-white space-y-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black">
                    Vantagens do Selo "Cliente Confiável / 5 Estrelas"
                  </h4>
                </div>
                <ul className="text-xs text-emerald-100 space-y-1 pl-5 list-disc">
                  <li>Aprovação instantânea de pedidos de <strong>Provador VIP em domicílio</strong> sem taxa de caução.</li>
                  <li>Prioridade no despacho do motoboy nos horários de pico.</li>
                  <li>Acesso a cupons de cashback e promoções fechadas dos lojistas de Cachoeiras.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: MODERAÇÃO & INTEGRIDADE */}
          {activeTab === 'moderation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-purple-600" />
                    <span>Moderação, Condutas Proibidas & Canal de Ouvidoria</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Regras rígidas para manter o ambiente saudável, respeitoso e livre de fraudes.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {REVIEW_POLICY_DATA.sections[2].rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        {rule.heading}
                      </h4>
                      {rule.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                          {rule.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Precisa de mediação ou quer denunciar uma avaliação abusiva?</strong>
                  <p className="mt-0.5 text-amber-800">
                    Entre em contato com nossa central de atendimento pelo WhatsApp ou email (suporte@acheiaquicachoeiras.com.br) indicando o código do pedido.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Achei Aqui • Segurança e Transparência Local
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            Entendido e Concordo
          </button>
        </div>
      </div>
    </div>
  );
};
