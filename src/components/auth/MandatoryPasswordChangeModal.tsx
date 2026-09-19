import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MandatoryPasswordChangeModal: React.FC = () => {
  const { currentUser, updateUserPassword } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser || !currentUser.needsPasswordChange) {
    return null;
  }

  // Security Criteria Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && isMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isFormValid) {
      setErrorMessage('Por favor, atenda a todos os critérios de segurança exigidos para a nova senha.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = updateUserPassword(newPassword);
      setIsSubmitting(false);
      if (!result.success) {
        setErrorMessage(result.message);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header de Alerta de Segurança */}
        <div className="bg-amber-600 text-white p-5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black shrink-0">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-black text-base leading-tight">
              Alteração Obrigatória de Senha
            </h3>
            <p className="text-amber-100 text-xs mt-0.5">
              Primeiro acesso de segurança — {currentUser.name}
            </p>
          </div>
        </div>

        {/* Corpo do Modal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <strong className="block font-bold mb-0.5">🛡️ Diretriz de Proteção da Plataforma:</strong>
            Para garantir a segurança dos dados dos usuários e a integridade do marketplace, você deve definir uma nova senha forte antes de continuar.
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nova Senha de Acesso
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Defina sua nova senha"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 absolute right-3 top-3 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Checklist de Validação em Tempo Real */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
            <span className="font-bold text-[11px] text-slate-800 block mb-1">Requisitos de Segurança:</span>
            <div className={`flex items-center space-x-2 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Mínimo de 8 caracteres</span>
            </div>
            <div className={`flex items-center space-x-2 ${hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Pelo menos 1 letra maiúscula</span>
            </div>
            <div className={`flex items-center space-x-2 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Pelo menos 1 número</span>
            </div>
            <div className={`flex items-center space-x-2 ${hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasSpecial ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Pelo menos 1 caractere especial (!@#$%)</span>
            </div>
            <div className={`flex items-center space-x-2 ${isMatch ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
              <span>Confirmação de senha idêntica</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-3 px-6 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center space-x-2 transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Atualizando Senha...' : 'SALVAR NOVA SENHA & LIBERAR ACESSO'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
