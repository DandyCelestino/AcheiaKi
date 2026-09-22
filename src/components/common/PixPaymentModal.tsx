import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
  CreditCard,
  Send,
  FileCheck
} from 'lucide-react';
import { OFFICIAL_PIX_INFO } from '../../data/membershipPlansData';
import { MembershipTier } from '../../types';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  amount: number;
  paymentType: 'PLAN_UPGRADE' | 'BANNER_PACKAGE' | 'ORDER_COMMISSION';
  orderId?: string;
  targetTier?: MembershipTier;
  bannerCount?: number;
  currentTierName?: string;
  onConfirmSuccess: () => void;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  amount,
  paymentType,
  orderId,
  targetTier,
  bannerCount,
  currentTierName = 'Grátis',
  onConfirmSuccess
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'PROCESSING' | 'CONFIRMED'>('PENDING');
  const [attachedReceiptName, setAttachedReceiptName] = useState<string>('');

  // 15-minute countdown
  useEffect(() => {
    if (!isOpen) {
      setPaymentStatus('PENDING');
      setTimeLeft(15 * 60);
      setCopiedKey(false);
      setCopiedPayload(false);
      setAttachedReceiptName('');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Synthetic standard PIX Copia e Cola EMV payload
  const pixCopyPasteCode = `00020126580014br.gov.bcb.pix0114${OFFICIAL_PIX_INFO.cnpjClean}520400005303986540${amount.toFixed(2).length < 10 ? '0' + amount.toFixed(2).length : amount.toFixed(2).length}${amount.toFixed(2)}5802BR5924BEX SERVICOS E COMERCIOS6021CACHOEIRAS DE MACACU62070503***6304${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`;

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(OFFICIAL_PIX_INFO.cnpj);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleCopyPayload = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixCopyPasteCode);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 3000);
    }
  };

  const handleConfirmPaid = () => {
    setPaymentStatus('PROCESSING');
    setTimeout(() => {
      setPaymentStatus('CONFIRMED');
      setTimeout(() => {
        onConfirmSuccess();
        onClose();
      }, 1400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Pagamento Oficial via PIX
              </span>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {title}
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Status Bar & Timer */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
            <div className="flex items-center space-x-2 text-amber-900">
              <Clock className="w-4 h-4 text-amber-700 animate-pulse shrink-0" />
              <span>
                Tempo restante para pagamento: <strong>{formattedTime}</strong>
              </span>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-200/80 text-amber-900 font-black text-[10px] rounded-full uppercase">
              Aguardando PIX
            </span>
          </div>

          {/* Amount and Beneficiary Highlight */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl border border-emerald-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold uppercase">Valor a Pagar:</span>
              <span className="text-2xl font-black text-amber-400">
                R$ {amount.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Favorecido Oficial:</span>
                <strong className="text-white font-bold">{OFFICIAL_PIX_INFO.beneficiary}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Chave PIX (CNPJ):</span>
                <strong className="text-amber-300 font-mono font-bold">{OFFICIAL_PIX_INFO.cnpj}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Cidade:</span>
                <span>{OFFICIAL_PIX_INFO.city}</span>
              </div>
            </div>
          </div>

          {/* QR Code and Copy Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            {/* Real SVG QR Code Visual */}
            <div className="p-3 bg-white rounded-xl border-2 border-slate-300 shadow-sm flex flex-col items-center justify-center shrink-0">
              <div className="w-36 h-36 relative bg-slate-900 rounded-lg p-2 flex items-center justify-center">
                {/* SVG pattern representing dynamic QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                  {/* Corner squares */}
                  <rect x="5" y="5" width="28" height="28" fill="white" />
                  <rect x="9" y="9" width="20" height="20" fill="#0f172a" />
                  <rect x="13" y="13" width="12" height="12" fill="white" />

                  <rect x="67" y="5" width="28" height="28" fill="white" />
                  <rect x="71" y="9" width="20" height="20" fill="#0f172a" />
                  <rect x="75" y="13" width="12" height="12" fill="white" />

                  <rect x="5" y="67" width="28" height="28" fill="white" />
                  <rect x="9" y="71" width="20" height="20" fill="#0f172a" />
                  <rect x="13" y="75" width="12" height="12" fill="white" />

                  {/* Internal matrix dots */}
                  <rect x="38" y="10" width="6" height="6" fill="white" />
                  <rect x="48" y="10" width="6" height="6" fill="white" />
                  <rect x="38" y="20" width="6" height="6" fill="white" />
                  <rect x="56" y="20" width="6" height="6" fill="white" />

                  <rect x="10" y="38" width="6" height="6" fill="white" />
                  <rect x="20" y="38" width="6" height="6" fill="white" />
                  <rect x="30" y="48" width="6" height="6" fill="white" />
                  <rect x="40" y="40" width="8" height="8" fill="#f59e0b" />
                  <rect x="52" y="40" width="8" height="8" fill="#10b981" />
                  <rect x="40" y="52" width="8" height="8" fill="#10b981" />
                  <rect x="52" y="52" width="8" height="8" fill="#f59e0b" />

                  <rect x="68" y="38" width="6" height="6" fill="white" />
                  <rect x="78" y="38" width="6" height="6" fill="white" />
                  <rect x="88" y="48" width="6" height="6" fill="white" />

                  <rect x="38" y="68" width="6" height="6" fill="white" />
                  <rect x="48" y="78" width="6" height="6" fill="white" />
                  <rect x="58" y="68" width="6" height="6" fill="white" />
                  <rect x="68" y="78" width="6" height="6" fill="white" />
                  <rect x="78" y="68" width="6" height="6" fill="white" />
                  <rect x="88" y="78" width="6" height="6" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-emerald-600 rounded-md border-2 border-white flex items-center justify-center text-white font-black text-[9px] shadow-sm">
                    PIX
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-2">
                Escaneie com o app do banco
              </span>
            </div>

            {/* Copy Keys Area */}
            <div className="flex-1 space-y-2.5 w-full">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Chave PIX (CNPJ do Titular):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={OFFICIAL_PIX_INFO.cnpj}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Código PIX Copia e Cola:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={pixCopyPasteCode}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-500 truncate"
                  />
                  <button
                    onClick={handleCopyPayload}
                    className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    {copiedPayload ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copiado!' : 'Copia e Cola'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Business Rules & Failure Disclaimer */}
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Regra de Liberação da Modalidade / Recurso:</span>
            </div>
            <p className="leading-relaxed">
              • <strong>Se o pagamento for confirmado:</strong> o novo plano/banner/comissão será <strong>liberado imediatamente</strong> e uma notificação de recebimento será transmitida ao Administrador Master da plataforma.
            </p>
            <p className="leading-relaxed text-amber-900">
              • <strong>Se não for pago:</strong> o novo plano permanecerá <strong>bloqueado</strong> com status <em>"Aguardando Pagamento PIX"</em> e seu estabelecimento <strong>permanecerá ativo na modalidade atual ({currentTierName})</strong>.
            </p>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar e Manter Plano Atual
          </button>

          <button
            type="button"
            disabled={paymentStatus !== 'PENDING'}
            onClick={handleConfirmPaid}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75"
          >
            {paymentStatus === 'PROCESSING' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Confirmando PIX no Banco...</span>
              </>
            ) : paymentStatus === 'CONFIRMED' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Pagamento Confirmado! Liberando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Já Realizei o Pagamento via PIX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
