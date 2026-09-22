import React from 'react';
import {
  ShoppingBag,
  Calendar,
  UserPlus,
  LogIn,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface AuthPromptDetails {
  title?: string;
  description?: string;
  merchantName?: string;
  price?: number;
}

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: 'COMPRA' | 'AGENDAMENTO' | 'GERAL';
  details?: AuthPromptDetails;
  onRegister: () => void;
  onLogin: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  actionType,
  details,
  onRegister,
  onLogin
}) => {
  if (!isOpen) return null;

  const isPurchase = actionType === 'COMPRA';
  const isBooking = actionType === 'AGENDAMENTO';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-300/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800/80 border border-emerald-600/40 text-emerald-300 flex items-center justify-center shadow-md">
              {isPurchase ? (
                <ShoppingBag className="w-6 h-6 text-emerald-300" />
              ) : isBooking ? (
                <Calendar className="w-6 h-6 text-emerald-300" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {isPurchase ? 'Finalização de Compra' : isBooking ? 'Agendamento de Serviço' : 'Acesso Restrito'}
              </span>
              <h3 className="text-lg font-black text-white mt-0.5 leading-tight">
                {isPurchase
                  ? 'Cadastre-se ou Entre para Comprar'
                  : isBooking
                  ? 'Cadastre-se ou Entre para Agendar'
                  : 'Cadastre-se ou Faça Login'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-emerald-200/90 leading-relaxed mt-1">
            {isPurchase
              ? 'Para comprar itens, escolher entrega ou retirada e finalizar seu pedido com os lojistas, você precisa de uma conta.'
              : isBooking
              ? 'Para solicitar agendamentos de horário com profissionais locais e receber confirmação, você precisa de uma conta.'
              : 'Para acessar este recurso na plataforma Achei Aqui, faça login ou cadastre-se gratuitamente.'}
          </p>
        </div>

        {/* Selected Item Context (if available) */}
        {details?.title && (
          <div className="mx-5 -mt-3 relative z-10 bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-bold uppercase tracking-wider text-[10px]">
                {isPurchase ? 'Item que você deseja comprar:' : 'Serviço que você deseja agendar:'}
              </span>
              {details.price !== undefined && (
                <span className="font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                  R$ {details.price.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            <p className="font-extrabold text-slate-900 text-sm mt-1 truncate">
              {details.title}
            </p>
            {details.merchantName && (
              <p className="text-[11px] text-slate-600 mt-0.5">
                Estabelecimento: <strong className="text-slate-800">{details.merchantName}</strong>
              </p>
            )}
          </div>
        )}

        {/* Benefits list */}
        <div className="p-5 space-y-4">
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>Cadastro 100% Gratuito:</strong> Leva menos de 1 minuto e você só precisa de nome e e-mail.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>Comércio Seguro de Cachoeiras de Macacu:</strong> Seus dados ficam protegidos e você fala direto com o comerciante.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-snug">
                <strong>Acompanhamento em Tempo Real:</strong> Notificações sobre a entrega, retirada ou confirmação de horário.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Primary: Cadastrar */}
            <button
              id="auth-prompt-btn-register"
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastre-se Gratuitamente</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
            </button>

            {/* Secondary: Login */}
            <button
              id="auth-prompt-btn-login"
              onClick={() => {
                onClose();
                onLogin();
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 border border-slate-200 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-700" />
              <span>Já Tenho Cadastro (Fazer Login)</span>
            </button>

            {/* Dismiss */}
            <button
              onClick={onClose}
              className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Continuar apenas navegando no marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
