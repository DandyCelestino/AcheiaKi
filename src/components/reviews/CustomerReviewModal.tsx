import React, { useState } from 'react';
import {
  X,
  Star,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Store,
  Wrench,
  Camera,
  Info
} from 'lucide-react';
import { Order, CustomerToMerchantReview, CustomerReviewCriteria } from '../../types';

interface CustomerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmitReview: (review: Omit<CustomerToMerchantReview, 'id' | 'createdAt'>) => void;
  onOpenPolicy: () => void;
}

const QUICK_TAGS = [
  '⭐ Entrega Super Rápida',
  '💎 Produto Impecável',
  '💬 Atendimento Nota 10',
  '⏱️ Pontualidade Britânica',
  '🏷️ Preço Justo',
  '📦 Embalagem Bem Feita',
  '🛠️ Serviço Profissional',
  '🤝 Super Recomendo'
];

const RATING_LABELS: { [key: number]: string } = {
  1: 'Muito Ruim 😞',
  2: 'Ruim 🙁',
  3: 'Regular 😐',
  4: 'Muito Bom! 😊',
  5: 'Excelente! Perfeito! 🌟'
};

export const CustomerReviewModal: React.FC<CustomerReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmitReview,
  onOpenPolicy
}) => {
  const [globalRating, setGlobalRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Criteria ratings
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [costBenefitRating, setCostBenefitRating] = useState<number>(5);

  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const isService = order.type === 'SERVICO' || order.modality === 'AGENDAMENTO';

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Por favor, escreva um breve comentário sobre sua experiência.');
      return;
    }

    setIsSubmitting(true);

    const criteria: CustomerReviewCriteria = {
      quality: qualityRating,
      punctuality: punctualityRating,
      service: serviceRating,
      costBenefit: costBenefitRating
    };

    onSubmitReview({
      orderId: order.id,
      orderCode: order.code,
      userId: order.userId,
      userName: order.customerName,
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      targetType: isService ? 'PRESTADOR_SERVICO' : 'LOJA',
      rating: globalRating,
      criteria,
      comment: comment.trim(),
      tags: selectedTags,
      recommend,
      verifiedPurchase: true,
      status: 'active'
    });

    setIsSubmitting(false);
    onClose();
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : globalRating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              {isService ? <Wrench className="w-6 h-6" /> : <Store className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Avaliação de Compra Verificada
                </span>
                <span className="text-[11px] text-blue-200">Pedido #{order.code}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Avaliar {order.merchantName}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main 1-5 Star Selection Banner */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Como foi sua experiência geral com este pedido?
            </span>

            {/* Stars row */}
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setGlobalRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 sm:p-2 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                      star <= activeDisplayRating
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-xs'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Dynamic Label */}
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-black text-sm">
              {RATING_LABELS[activeDisplayRating]}
            </div>
          </div>

          {/* Detailed Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Classificação por Critérios (1 a 5)
              </span>
              <span className="text-[11px] text-slate-400">Opcional ajuste fino</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Qualidade */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    💎 Qualidade do {isService ? 'Serviço' : 'Produto'}
                  </span>
                  <span className="text-[10px] text-slate-500">Acabamento e satisfação</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setQualityRating(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= qualityRating
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pontualidade */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    ⏱️ Pontualidade
                  </span>
                  <span className="text-[10px] text-slate-500">Prazo de entrega ou horário</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setPunctualityRating(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= punctualityRating
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atendimento */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    💬 Atendimento & Atenção
                  </span>
                  <span className="text-[10px] text-slate-500">Cordialidade e suporte</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setServiceRating(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= serviceRating
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custo-Benefício */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    🏷️ Custo-Benefício
                  </span>
                  <span className="text-[10px] text-slate-500">Preço e valor agregado</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setCostBenefitRating(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= costBenefitRating
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tags Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Destaques Rápidos
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Comment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seu Comentário Detalhado *
              </label>
              <span className="text-[11px] text-slate-400">
                {comment.length}/500 caracteres
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência, o que mais gostou no produto/serviço e como foi a entrega ou atendimento em Cachoeiras..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-blue-500 outline-none leading-relaxed resize-none"
            />
          </div>

          {/* Recommendation Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                Você recomendaria este estabelecimento para outros moradores?
              </span>
              <span className="text-[10px] text-slate-500">
                Ajuda outros clientes de Cachoeiras de Macacu a descobrirem os melhores comércios
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRecommend(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  recommend
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Sim!</span>
              </button>

              <button
                type="button"
                onClick={() => setRecommend(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  !recommend
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Não</span>
              </button>
            </div>
          </div>

          {/* Policy link callout */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Sua avaliação é protegida pelas diretrizes do Achei Aqui.</span>
            </div>
            <button
              type="button"
              onClick={onOpenPolicy}
              className="text-blue-700 font-bold hover:underline shrink-0 ml-2"
            >
              Ver Política
            </button>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publicar Avaliação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
