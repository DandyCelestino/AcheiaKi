import React, { useState } from 'react';
import {
  Star,
  Award,
  ShieldCheck,
  UserCheck,
  Clock,
  MessageSquare,
  DollarSign,
  Shirt,
  ThumbsUp,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { CustomerReputationSummary, MerchantToCustomerReview } from '../../types';

interface CustomerReputationBadgeProps {
  summary?: CustomerReputationSummary;
  showDetailsModal?: boolean;
  compact?: boolean;
  onOpenPolicy?: () => void;
}

export const CustomerReputationBadge: React.FC<CustomerReputationBadgeProps> = ({
  summary,
  compact = false,
  onOpenPolicy
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!summary) {
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>Novo Cliente Achei Aqui</span>
      </div>
    );
  }

  const { averageScore, totalEvaluations, badges, recommendationPercentage, reviews } = summary;

  if (compact) {
    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
        title="Ver reputação no comércio local"
      >
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span>{averageScore.toFixed(1)}</span>
        <span className="text-[10px] text-emerald-600 font-semibold">
          ({totalEvaluations} {totalEvaluations === 1 ? 'avaliação' : 'avaliações'})
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-4 sm:p-5 rounded-2xl border border-emerald-800/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase">
                Score de Confiança Local
              </span>
              <span className="text-[11px] text-emerald-200">
                {recommendationPercentage}% de aprovação pelos lojistas
              </span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <div className="flex items-center text-amber-400">
                <Star className="w-5 h-5 fill-amber-400" />
                <span className="ml-1 text-lg font-black text-white">
                  {averageScore.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-400 text-xs">
                • {totalEvaluations} {totalEvaluations === 1 ? 'avaliação de lojista' : 'avaliações de lojistas'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-white/10 text-emerald-200 text-[11px] font-bold border border-white/10"
              >
                ✓ {badge}
              </span>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center space-x-1"
          >
            <span>Ver Ficha</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-5 bg-linear-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-black text-base text-white">
                    Ficha de Reputação do Cliente
                  </h3>
                  <p className="text-xs text-emerald-200">{summary.userName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Metric Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Pontualidade</span>
                  <span className="text-base font-black text-emerald-700">
                    ★ {summary.punctualityScore.toFixed(1)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Comunicação</span>
                  <span className="text-base font-black text-emerald-700">
                    ★ {summary.communicationScore.toFixed(1)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Pagamento</span>
                  <span className="text-base font-black text-emerald-700">
                    ★ {summary.paymentScore.toFixed(1)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Cuidado / Regras</span>
                  <span className="text-base font-black text-emerald-700">
                    ★ {summary.careScore.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Avaliações Recebidas de Lojistas ({reviews.length})
                </h4>

                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">
                          {rev.merchantName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Pedido #{rev.orderCode} • {rev.createdAt}
                        </span>
                      </div>
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="ml-1 text-xs font-black text-slate-900">{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 italic">"{rev.comment}"</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rev.behaviorTags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {onOpenPolicy && (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    onOpenPolicy();
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Ler Política de Avaliação
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl ml-auto"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
