import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  Reply,
  CheckCircle2,
  Filter,
  Store,
  Sparkles,
  Info,
  Calendar
} from 'lucide-react';
import { CustomerToMerchantReview } from '../../types';

interface ReviewsListProps {
  reviews: CustomerToMerchantReview[];
  merchantId?: string;
  merchantName?: string;
  isMerchantOwner?: boolean;
  onReplyReview?: (reviewId: string, replyText: string) => void;
  onOpenPolicy?: () => void;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  merchantId,
  merchantName,
  isMerchantOwner = false,
  onReplyReview,
  onOpenPolicy
}) => {
  const [selectedFilter, setSelectedFilter] = useState<number | 'all'>('all');
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.rating === selectedFilter;
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
      : 5.0;

  // Criteria averages
  const avgQuality =
    totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + (curr.criteria?.quality || curr.rating), 0) / totalReviews
      : 5.0;
  const avgPunctuality =
    totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + (curr.criteria?.punctuality || curr.rating), 0) / totalReviews
      : 5.0;
  const avgService =
    totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + (curr.criteria?.service || curr.rating), 0) / totalReviews
      : 5.0;
  const avgCostBenefit =
    totalReviews > 0
      ? reviews.reduce((acc, curr) => acc + (curr.criteria?.costBenefit || curr.rating), 0) / totalReviews
      : 5.0;

  const recommendPercent =
    totalReviews > 0
      ? Math.round((reviews.filter((r) => r.recommend).length / totalReviews) * 100)
      : 100;

  const handleSendReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    if (onReplyReview) {
      onReplyReview(reviewId, replyText.trim());
    }
    setReplyingReviewId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Top Rating Summary Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Average Score */}
          <div className="text-center md:text-left space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Média Geral de Avaliações
            </span>
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">
                {averageRating.toFixed(1)}
              </span>
              <div className="space-y-0.5 text-left">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(averageRating) ? 'fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-semibold block">
                  {totalReviews} {totalReviews === 1 ? 'avaliação verificada' : 'avaliações verificadas'}
                </span>
              </div>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <ThumbsUp className="w-3 h-3 mr-1" />
                {recommendPercent}% recomendam este estabelecimento
              </span>
            </div>
          </div>

          {/* Criteria Bars */}
          <div className="col-span-2 space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>💎 Qualidade</span>
                  <span>{avgQuality.toFixed(1)} / 5.0</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(avgQuality / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>⏱️ Pontualidade</span>
                  <span>{avgPunctuality.toFixed(1)} / 5.0</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${(avgPunctuality / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>💬 Atendimento</span>
                  <span>{avgService.toFixed(1)} / 5.0</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${(avgService / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>🏷️ Custo-Benefício</span>
                  <span>{avgCostBenefit.toFixed(1)} / 5.0</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{ width: `${(avgCostBenefit / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar & Policy Link */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="font-bold text-slate-500 mr-1 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filtrar:
            </span>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-xl font-bold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((ratingNum) => {
              const count = reviews.filter((r) => r.rating === ratingNum).length;
              return (
                <button
                  key={ratingNum}
                  onClick={() => setSelectedFilter(ratingNum)}
                  className={`px-2.5 py-1 rounded-xl font-bold transition-all flex items-center space-x-1 ${
                    selectedFilter === ratingNum
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{ratingNum}★</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {onOpenPolicy && (
            <button
              onClick={onOpenPolicy}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Política de Avaliações Achei Aqui</span>
            </button>
          )}
        </div>
      </div>

      {/* Reviews Item Cards */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Nenhuma avaliação encontrada neste filtro.</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4"
            >
              {/* Review Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {rev.userAvatar ? (
                    <img
                      src={rev.userAvatar}
                      alt={rev.userName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center">
                      {rev.userName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">{rev.userName}</h4>
                      {rev.verifiedPurchase && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Compra Verificada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span>Pedido #{rev.orderCode}</span>
                      <span>•</span>
                      <span>{rev.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Stars and recommend badge */}
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rev.rating ? 'fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  {rev.recommend && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center">
                      <ThumbsUp className="w-3 h-3 mr-1" /> Recomenda
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                "{rev.comment}"
              </p>

              {/* Tags */}
              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.tags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Merchant Reply Section */}
              {rev.merchantReply ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      <span>Resposta de {rev.merchantReply.merchantAuthorName || rev.merchantName}:</span>
                    </span>
                    <span className="text-[11px]">{rev.merchantReply.repliedAt}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {rev.merchantReply.replyText}
                  </p>
                </div>
              ) : (
                isMerchantOwner && (
                  <div className="pt-2">
                    {replyingReviewId === rev.id ? (
                      <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escreva uma resposta pública e cordial para este cliente..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setReplyingReviewId(null)}
                            className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSendReply(rev.id)}
                            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                          >
                            Enviar Resposta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingReviewId(rev.id);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Responder como Estabelecimento</span>
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
