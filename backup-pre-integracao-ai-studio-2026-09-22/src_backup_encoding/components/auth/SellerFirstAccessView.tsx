import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound, LogOut, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SellerFirstAccessView: React.FC = () => {
  const { currentUser, updateUserPassword, logout, triggerToast } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Regras estritas solicitadas:
  // 1. MÃ­nimo de 8 caracteres
  // 2. A nova senha NÃƒO pode ser "12345678"
  // 3. ConfirmaÃ§Ã£o deve ser exatamente igual Ã  nova senha
  const hasMinLength = newPassword.length >= 8;
  const isDefaultPassword = newPassword === '12345678';
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // ValidaÃ§Ã£o 1: Tentativa de usar a senha padrÃ£o 12345678
    if (isDefaultPassword) {
      setErrorMessage('VocÃª precisa cadastrar uma nova senha diferente da senha padrÃ£o.');
      return;
    }

    // ValidaÃ§Ã£o 2: MÃ­nimo de 8 caracteres
    if (!hasMinLength) {
      setErrorMessage('A nova senha deve possuir no mÃ­nimo 8 caracteres.');
      return;
    }

    // ValidaÃ§Ã£o 3: ConfirmaÃ§Ã£o igual
    if (!isMatch) {
      setErrorMessage('A confirmaÃ§Ã£o da senha deve ser exatamente igual Ã  nova senha digitada.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = updateUserPassword(newPassword);
      setIsSubmitting(false);

      if (result && !result.success) {
        setErrorMessage(result.message || 'Falha ao atualizar senha. Tente novamente.');
      } else {
        triggerToast('Senha atualizada com sucesso! Portal do Vendedor liberado.');
      }
    }, 350);
  };

  return (
    <div
      id="seller-first-access-screen"
      className="min-h-screen w-full bg-slate-950 flex flex-col justify-between p-4 sm:p-6 select-none"
    >
      {/* Topo com branding institucional seguro */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2 text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs">
            AA
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            Achei Aqui <span className="text-emerald-400 text-xs font-semibold">Comercial</span>
          </span>
        </div>

        <button
          type="button"
          id="btn-first-access-logout"
          onClick={() => logout()}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 cursor-pointer"
          title="Encerrar sessÃ£o com seguranÃ§a"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Sair</span>
        </button>
      </header>

      {/* Card Central de Primeiro Acesso */}
      <main className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header Visual */}
          <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative overflow-hidden">
            <div className="absolute right-3 -bottom-4 opacity-10">
              <KeyRound className="w-32 h-32" />
            </div>

            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                <span>Troca ObrigatÃ³ria de Senha</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white">
                Primeiro acesso
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed">
                Bem-vindo Ã  equipe comercial! Para liberar o acesso ao seu Portal do Vendedor, cadastre uma nova senha pessoal e segura.
              </p>

              {currentUser && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Vendedor identificado:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">
                    {currentUser.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FormulÃ¡rio */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* NotificaÃ§Ã£o de Diretriz de SeguranÃ§a */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-950 mb-0.5">Credencial Inicial ProvisÃ³ria Detectada</strong>
                Sua conta foi inicializada com a senha padrÃ£o da plataforma (<span className="font-sans font-bold">12345678</span>). Por seguranÃ§a, ela deve ser substituÃ­da agora por uma nova senha pessoal de no mÃ­nimo 8 caracteres.
              </div>
            </div>

            {/* Mensagem de Erro de ValidaÃ§Ã£o */}
            {errorMessage && (
              <div
                id="seller-first-access-error"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-bold leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Campo 1: Nova Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-new-password">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="input-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Digite sua nova senha (mÃ­nimo 8 dÃ­gitos)"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 absolute right-3.5 top-3.5 p-0.5 cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo 2: Confirmar Nova Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-confirm-password">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  id="input-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Confirme exatamente a nova senha"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Checklist Visual de Regras de ValidaÃ§Ã£o */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <span className="font-extrabold text-[11px] text-slate-700 block mb-1">
                CritÃ©rios de Aceite:
              </span>

              <div className={`flex items-center space-x-2 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>MÃ­nimo de 8 caracteres</span>
              </div>

              <div
                className={`flex items-center space-x-2 ${
                  newPassword.length > 0 && !isDefaultPassword
                    ? 'text-emerald-700 font-bold'
                    : isDefaultPassword
                    ? 'text-rose-600 font-bold'
                    : 'text-slate-500'
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    newPassword.length > 0 && !isDefaultPassword
                      ? 'text-emerald-600'
                      : isDefaultPassword
                      ? 'text-rose-600'
                      : 'text-slate-300'
                  }`}
                />
                <span>Diferente da senha padrÃ£o (12345678)</span>
              </div>

              <div className={`flex items-center space-x-2 ${isMatch ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>ConfirmaÃ§Ã£o idÃªntica</span>
              </div>
            </div>

            {/* BotÃ£o de AÃ§Ã£o */}
            <button
              type="submit"
              id="btn-submit-first-access"
              disabled={isSubmitting || !hasMinLength || isDefaultPassword || !isMatch}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
                !isSubmitting && hasMinLength && !isDefaultPassword && isMatch
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer shadow-indigo-600/20'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirmando AlteraÃ§Ã£o...' : 'CONFIRMAR ALTERAÃ‡ÃƒO & LIBERAR PORTAL'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Prefere continuar depois? <span className="underline font-bold text-slate-700">Fazer Logout</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* RodapÃ© institucional */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[11px] text-slate-500">
        Achei Aqui Comercial â€¢ Cachoeiras de Macacu - RJ â€¢ AutenticaÃ§Ã£o Segura
      </footer>
    </div>
  );
};

