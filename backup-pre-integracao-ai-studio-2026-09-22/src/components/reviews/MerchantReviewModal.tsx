import React, { useState } from 'react';
import {
  X,
  Star,
  UserCheck,
  Award,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  DollarSign,
  Shirt,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Order, MerchantToCustomerReview, MerchantReviewBehaviorCriteria } from '../../types';

interface MerchantReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSubmitReview: (review: Omit<MerchantToCustomerReview, 'id' | 'createdAt'>) => void;
  onOpenPolicy: () => void;
}

const BEHAVIOR_TAGS = [
  '⚡ Cliente Super Pontual',
  '💬 Comunicação Exemplar',
  '💰 Pagamento Imediato',
  '🛍️ Retirada Rápida no Balcão',
  '👗 Cuidado com Provador VIP',
  '🤝 Cordial e Respeitoso(a)',
  '🌟 Cliente 5 Estrelas',
  '🏠 Endereço de Fácil Acesso'
];

const BEHAVIOR_LABELS: { [key: number]: string } = {
  1: 'Comportamento Problemático ⚠️',
  2: 'Abaixo do Esperado 🙁',
  3: 'Comportamento Regular 😐',
  4: 'Bom Cliente! 👍',
  5: 'Cliente Exemplar / 5 Estrelas! 🌟'
};

export const MerchantReviewModal: React.FC<MerchantReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmitReview,
  onOpenPolicy
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Criteria
  const [punctuality, setPunctuality] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [paymentAndAgreements, setPaymentAndAgreements] = useState<number>(5);
  const [careAndRespect, setCareAndRespect] = useState<number>(5);

  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([
    '⚡ Cliente Super Pontual',
    '💬 Comunicação Exemplar',
    '💰 Pagamento Imediato'
  ]);
  const [recommendForOtherMerchants, setRecommendForOtherMerchants] = useState<boolean>(true);
  const [incidentReported, setIncidentReported] = useState<boolean>(false);
  const [incidentDetails, setIncidentDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

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
      alert('Por favor, informe uma breve nota sobre o atendimento ao cliente.');
      return;
    }

    setIsSubmitting(true);

    const behaviorCriteria: MerchantReviewBehaviorCriteria = {
      punctuality,
      communication,
      paymentAndAgreements,
      careAndRespect
    };

    onSubmitReview({
      orderId: order.id,
      orderCode: order.code,
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      userId: order.userId,
      userName: order.customerName,
      customerPhone: order.customerPhone,
      rating,
      behaviorCriteria,
      comment: comment.trim(),
      behaviorTags: selectedTags,
      recommendForOtherMerchants,
      incidentReported,
      incidentDetails: incidentReported ? incidentDetails : undefined
    });

    setIsSubmitting(false);
    onClose();
  };

  const activeDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-emerald-950 via-teal-950 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                  Avaliação de Conduta do Cliente
                </span>
                <span className="text-[11px] text-emerald-200">Pedido #{order.code}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Avaliar {order.customerName}
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
          {/* Client summary box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Cliente:</span>
              <p className="font-bold text-slate-900">{order.customerName}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp:</span>
              <p className="font-medium text-slate-700">{order.customerPhone}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Modalidade:</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-[10px] block w-fit">
                {order.modality}
              </span>
            </div>
          </div>

          {/* Main 1-5 Star Selection Banner */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-center space-y-3">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Classificação geral do comportamento do cliente
            </span>

            {/* Stars row */}
            <div className="flex items-center justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
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
            <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-black text-sm">
              {BEHAVIOR_LABELS[activeDisplayRating]}
            </div>
          </div>

          {/* Detailed Criteria */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Critérios de Conduta (1 a 5 Estrelas)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pontualidade */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Pontualidade
                  </span>
                  <span className="text-[10px] text-slate-500">Recebimento / Retirada</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setPunctuality(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= punctuality
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comunicação */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Comunicação
                  </span>
                  <span className="text-[10px] text-slate-500">Clareza e cordialidade</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setCommunication(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= communication
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pagamento e Combinados */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Pagamentos & Acordos
                  </span>
                  <span className="text-[10px] text-slate-500">Facilidade e cumprimento</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setPaymentAndAgreements(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= paymentAndAgreements
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuidado e Respeito */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-purple-600" />
                    Cuidado & Respeito
                  </span>
                  <span className="text-[10px] text-slate-500">Provador VIP e regras</span>
                </div>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setCareAndRespect(num)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        num <= careAndRespect
                          ? 'bg-emerald-600 text-white'
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

          {/* Quick Behavior Tags */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Destaques de Conduta
            </span>
            <div className="flex flex-wrap gap-2">
              {BEHAVIOR_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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
                Observações do Lojista / Prestador *
              </label>
              <span className="text-[11px] text-slate-400">
                {comment.length}/500 caracteres
              </span>
            </div>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Cliente muito educado(a), retirou o produto pontualmente no balcão e realizou o pagamento sem contratempos."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-emerald-500 outline-none leading-relaxed resize-none"
            />
          </div>

          {/* Recommendation to other merchants */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                Você recomenda este cliente para outros lojistas de Cachoeiras?
              </span>
              <span className="text-[10px] text-slate-500">
                Fortalece o Score de Confiança do Consumidor na cidade
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRecommendForOtherMerchants(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  recommendForOtherMerchants
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Sim!</span>
              </button>

              <button
                type="button"
                onClick={() => setRecommendForOtherMerchants(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  !recommendForOtherMerchants
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Não</span>
              </button>
            </div>
          </div>

          {/* Optional Incident Report */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={incidentReported}
                onChange={(e) => setIncidentReported(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Houve algum incidente grave com este pedido? (No-show, avaria ou recusa injustificada)
              </span>
            </label>

            {incidentReported && (
              <textarea
                rows={2}
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                placeholder="Descreva o ocorrido com moderação para análise da ouvidoria Achei Aqui..."
                className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-950 focus:bg-white outline-none"
              />
            )}
          </div>

          {/* Policy link callout */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Avaliação protegida pelo código de conduta do comércio local.</span>
            </div>
            <button
              type="button"
              onClick={onOpenPolicy}
              className="text-emerald-800 font-bold hover:underline shrink-0 ml-2"
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
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Avaliação do Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
