import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Zap,
  Award,
  HelpCircle,
  ArrowRight,
  Lock,
  Eye,
  ShoppingBag,
  CheckCircle2,
  Image as ImageIcon,
  QrCode,
  Layers,
  Crown,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import {
  MEMBERSHIP_PLANS_LIST,
  BANNER_PACKAGES,
  calculateBannerPackagePrice,
  OFFICIAL_PIX_INFO,
  MAX_BANNER_QUANTITY
} from '../../data/membershipPlansData';
import { MembershipTier } from '../../types';
import { PixPaymentModal } from '../common/PixPaymentModal';
import { useApp } from '../../context/AppContext';

interface MembershipPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: MembershipTier;
  onSelectTier?: (tier: MembershipTier) => void;
}

export const MembershipPlansModal: React.FC<MembershipPlansModalProps> = ({
  isOpen,
  onClose,
  currentTier = 'GRATIS',
  onSelectTier
}) => {
  const { currentUser, upgradeMerchantPlan, triggerToast, addAuditLog } = useApp();
  const [activeTab, setActiveTab] = useState<'PLANS' | 'BANNERS'>('PLANS');
  const [selectedBilling, setSelectedBilling] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [customBannerQty, setCustomBannerQty] = useState<number>(3);

  // PIX Modal State
  const [pixModalData, setPixModalData] = useState<{
    isOpen: boolean;
    title: string;
    amount: number;
    paymentType: 'PLAN_UPGRADE' | 'BANNER_PACKAGE';
    targetTier?: MembershipTier;
    bannerCount?: number;
  }>({
    isOpen: false,
    title: '',
    amount: 0,
    paymentType: 'PLAN_UPGRADE'
  });

  if (!isOpen) return null;

  const handleStartPlanUpgrade = (tier: MembershipTier) => {
    const plan = MEMBERSHIP_PLANS_LIST.find((p) => p.tier === tier);
    if (!plan) return;

    if (tier === 'GRATIS') {
      if (onSelectTier) onSelectTier('GRATIS');
      if (currentUser?.merchantId) upgradeMerchantPlan(currentUser.merchantId, 'GRATIS');
      triggerToast('Plano Grátis selecionado com sucesso!');
      onClose();
      return;
    }

    const price = selectedBilling === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
    setPixModalData({
      isOpen: true,
      title: `Mudança para ${plan.name} (${selectedBilling === 'MONTHLY' ? 'Mensal' : 'Anual'})`,
      amount: price,
      paymentType: 'PLAN_UPGRADE',
      targetTier: tier
    });
  };

  const handleStartBannerPurchase = (qty: number) => {
    const price = calculateBannerPackagePrice(qty);
    setPixModalData({
      isOpen: true,
      title: `Contratação de ${qty} Banner(es) de Destaque`,
      amount: price,
      paymentType: 'BANNER_PACKAGE',
      bannerCount: qty
    });
  };

  const handlePixSuccess = () => {
    if (pixModalData.paymentType === 'PLAN_UPGRADE' && pixModalData.targetTier) {
      if (currentUser?.merchantId) {
        upgradeMerchantPlan(currentUser.merchantId, pixModalData.targetTier);
      }
      if (onSelectTier) {
        onSelectTier(pixModalData.targetTier);
      }
      triggerToast(`Plano ${pixModalData.targetTier} liberado com sucesso! Notificação enviada ao Master.`);
    } else if (pixModalData.paymentType === 'BANNER_PACKAGE' && pixModalData.bannerCount) {
      addAuditLog(
        'CONTRATACAO_BANNERS_PIX',
        `Lojista contratou ${pixModalData.bannerCount} banner(es) por R$ ${pixModalData.amount.toFixed(2)} via PIX para Bex Serviços e Comércios, CNPJ 30.810.800/0001-39.`
      );
      triggerToast(`Pacote de ${pixModalData.bannerCount} Banners ativado! Notificação enviada ao Master.`);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 text-white p-4 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-500 flex items-center justify-center text-white font-black shadow-md shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Planos & Modalidades de Vendedor e Lojista
                </span>
                <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                  Tabela de Benefícios, Comissões & Banners de Destaque
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs between Store Plans and Banner Plans */}
          <div className="bg-slate-100 px-4 sm:px-6 pt-3 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('PLANS')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer border-t border-x ${
                  activeTab === 'PLANS'
                    ? 'bg-white text-emerald-950 border-slate-200 shadow-xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-950'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Modalidades de Lojista & Prestador</span>
              </button>

              <button
                onClick={() => setActiveTab('BANNERS')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer border-t border-x ${
                  activeTab === 'BANNERS'
                    ? 'bg-white text-purple-950 border-slate-200 shadow-xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-950'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>Planos para Banners de Destaque</span>
                <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.2 rounded-full">
                  R$ 199+
                </span>
              </button>
            </div>

            {activeTab === 'PLANS' && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-200/80 p-1 rounded-xl shrink-0 mb-2">
                <button
                  onClick={() => setSelectedBilling('MONTHLY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBilling === 'MONTHLY'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setSelectedBilling('YEARLY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    selectedBilling === 'YEARLY'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Anual</span>
                  <span className="text-[8px] bg-amber-400 text-slate-950 px-1 rounded font-black">2 MESES OFF</span>
                </button>
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {activeTab === 'PLANS' ? (
              <>
                {/* Notice on PIX and Rules */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <strong className="block font-bold text-slate-900">
                        Pagamentos Oficiais via Chave PIX: {OFFICIAL_PIX_INFO.cnpj}
                      </strong>
                      <span className="text-slate-600 text-[11px]">
                        Titular oficial: {OFFICIAL_PIX_INFO.beneficiary}. A modalidade é liberada após a confirmação.
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 self-end sm:self-auto">
                    Se não for pago: Permanece no plano atual ({currentTier})
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                  {MEMBERSHIP_PLANS_LIST.map((plan) => {
                    const isCurrent = currentTier === plan.tier;
                    const isMaster = plan.tier === 'MASTER';
                    const isPremium = plan.tier === 'PREMIUM';
                    const isGratis = plan.tier === 'GRATIS';

                    const price = selectedBilling === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
                    const period = selectedBilling === 'MONTHLY' ? '/mês' : '/ano';

                    return (
                      <div
                        key={plan.tier}
                        className={`rounded-2xl border-2 p-3.5 flex flex-col justify-between transition-all relative ${
                          isMaster
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-lg ring-2 ring-indigo-500/40'
                            : isPremium
                            ? 'border-purple-500 bg-purple-50/40 shadow-md ring-2 ring-purple-400/30'
                            : isCurrent
                            ? 'border-emerald-500 bg-emerald-50/30 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {isMaster && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                            👑 Master Exclusivo
                          </div>
                        )}
                        {isPremium && !isMaster && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                            Recomendado
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${plan.badgeBg}`}>
                              {plan.badgeLabel}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Atual
                              </span>
                            )}
                          </div>

                          <h3 className="font-black text-slate-900 text-sm leading-snug">{plan.name}</h3>

                          {/* Price */}
                          <div className="my-2.5">
                            {isGratis ? (
                              <div className="text-lg font-black text-emerald-700">
                                R$ 0,00
                                <span className="text-[10px] font-normal text-slate-500 block">Sem mensalidade</span>
                              </div>
                            ) : (
                              <div className="text-lg font-black text-slate-900">
                                R$ {price.toFixed(2).replace('.', ',')}
                                <span className="text-[10px] font-normal text-slate-500">{period}</span>
                              </div>
                            )}
                          </div>

                          {/* Specs */}
                          <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                            <div className="flex justify-between items-center text-slate-700">
                              <span>Produtos:</span>
                              <strong className="text-slate-900 text-right">
                                {plan.tier === 'GRATIS'
                                  ? '1 prod. (após 3m: 5)'
                                  : plan.maxProducts > 1000
                                  ? 'Ilimitados 🚀'
                                  : `Até ${plan.maxProducts}`}
                              </strong>
                            </div>
                            <div className="flex justify-between items-center text-slate-700">
                              <span>Comissão:</span>
                              <strong className="text-emerald-700 font-bold text-right">
                                {plan.tier === 'MASTER'
                                  ? '0% Permanente'
                                  : `0% (3m) ➔ ${plan.commissionRate}%`}
                              </strong>
                            </div>
                          </div>

                          {/* Highlights */}
                          <ul className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                            {plan.highlights.slice(0, 5).map((h, i) => (
                              <li key={i} className="flex items-start space-x-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* CTA Action with PIX Modal Trigger */}
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                          <button
                            onClick={() => handleStartPlanUpgrade(plan.tier)}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-200 text-slate-700 cursor-default'
                                : isMaster
                                ? 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-md'
                                : isPremium
                                ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-xs'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isCurrent ? (
                              <span>Plano Atual</span>
                            ) : (
                              <>
                                <span>{isGratis ? 'Voltar p/ Grátis' : 'Mudar com PIX'}</span>
                                {!isGratis && <ArrowRight className="w-3.5 h-3.5" />}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rule Focus Box */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                  <div className="flex items-center space-x-2 font-black text-xs uppercase tracking-wider text-amber-800">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Regra de Liberação de Dados do Comprador & Comissão</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    No <strong>Plano Grátis</strong>, o lojista começa com 1 produto cadastrado sem comissão nos primeiros 3 meses (após, limite de 5 produtos e comissão de 12%). Nos planos <strong>Bronze (R$ 19,90)</strong>, <strong>Prata (R$ 59,90)</strong>, <strong>Ouro (R$ 49,90)</strong> e <strong>Premium (R$ 199,90)</strong>, você tem <strong>3 meses sem comissão</strong> e usufrui de marketing digital agressivo para clientes de todo o município e região. No <strong>Plano Master (R$ 599,90)</strong>, você conta com <strong>0% de comissão permanente</strong> e assessoria completa com todos os serviços de marketing digital para lojistas!
                  </p>
                </div>
              </>
            ) : (
              /* TAB: PLANOS DE BANNERS DE DESTAQUE */
              <div className="space-y-6">
                {/* Banner Header Info Box */}
                <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-purple-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Regras & Tabela de Planos de Banners de Destaque
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-full uppercase">
                      Teto: Até 6 Banners
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Os valores de banners começam em <strong>R$ 199,00 para até 3 banners</strong>. Acima de 3 banners, cobra-se por quantidade adicional de <strong>R$ 49,00 por banner</strong>, não ultrapassando a quantidade máxima permitida de <strong>6 banners</strong> por anunciante.
                  </p>
                </div>

                {/* Interactive Banner Simulator / Quick Buy */}
                <div className="bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">
                      Simulador Rápido de Banners
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      Quantos banners você deseja veicular?
                    </h4>
                    <p className="text-xs text-slate-600">
                      Selecione de 1 a {MAX_BANNER_QUANTITY} banners para calcular o valor com as regras oficiais.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-purple-200 shadow-xs">
                    <button
                      onClick={() => setCustomBannerQty((prev) => Math.max(1, prev - 1))}
                      disabled={customBannerQty <= 1}
                      className="w-9 h-9 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center px-3">
                      <span className="text-2xl font-black text-purple-950 block leading-none">
                        {customBannerQty}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        {customBannerQty === 1 ? 'Banner' : 'Banners'}
                      </span>
                    </div>
                    <button
                      onClick={() => setCustomBannerQty((prev) => Math.min(MAX_BANNER_QUANTITY, prev + 1))}
                      disabled={customBannerQty >= MAX_BANNER_QUANTITY}
                      className="w-9 h-9 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Valor Total:</span>
                      <span className="text-2xl font-black text-purple-950">
                        R$ {calculateBannerPackagePrice(customBannerQty).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/mês</span>
                    </div>
                    <button
                      onClick={() => handleStartBannerPurchase(customBannerQty)}
                      className="px-5 py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Contratar via PIX</span>
                    </button>
                  </div>
                </div>

                {/* Banner Packages Table */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {BANNER_PACKAGES.map((pkg) => {
                    const isBaseTrio = pkg.quantity === 3;
                    const isMax = pkg.quantity === 6;

                    return (
                      <div
                        key={pkg.quantity}
                        className={`rounded-2xl border-2 p-4 flex flex-col justify-between transition-all relative ${
                          pkg.recommended
                            ? 'border-purple-500 bg-purple-50/40 shadow-md ring-2 ring-purple-400/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {isBaseTrio && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                            Melhor Custo-Benefício
                          </div>
                        )}
                        {isMax && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                            Limite Máximo (6 Banners)
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-100 text-purple-900 rounded-md">
                              {pkg.quantity} {pkg.quantity === 1 ? 'Banner' : 'Banners'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {pkg.quantity <= 3 ? 'Tarifa Base' : `+${pkg.quantity - 3} adicional`}
                            </span>
                          </div>

                          <h4 className="font-black text-slate-900 text-sm mb-1">{pkg.title}</h4>
                          <p className="text-[11px] text-slate-600 leading-snug mb-3">
                            {pkg.description}
                          </p>

                          <div className="my-2 p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                            <span className="text-xs text-slate-500 font-bold">Mensalidade:</span>
                            <span className="text-lg font-black text-purple-950">
                              R$ {pkg.monthlyPrice.toFixed(2).replace('.', ',')}
                              <span className="text-[10px] font-normal text-slate-500">/mês</span>
                            </span>
                          </div>

                          <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                            {pkg.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start space-x-1.5">
                                <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleStartBannerPurchase(pkg.quantity)}
                            className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Pagar R$ {pkg.monthlyPrice.toFixed(2).replace('.', ',')} no PIX</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Chave PIX Oficial CNPJ: <strong>{OFFICIAL_PIX_INFO.cnpj}</strong> • Bex Serviços e Comércios
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* PIX Payment Modal */}
      <PixPaymentModal
        isOpen={pixModalData.isOpen}
        onClose={() => setPixModalData((prev) => ({ ...prev, isOpen: false }))}
        title={pixModalData.title}
        amount={pixModalData.amount}
        paymentType={pixModalData.paymentType}
        targetTier={pixModalData.targetTier}
        bannerCount={pixModalData.bannerCount}
        currentTierName={currentTier}
        onConfirmSuccess={handlePixSuccess}
      />
    </>
  );
};

