import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Store,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface ExclusiveAccessGateProps {
  requiredRole: UserRole;
  title: string;
  subtitle: string;
}

export const ExclusiveAccessGate: React.FC<ExclusiveAccessGateProps> = ({
  requiredRole,
  title,
  subtitle
}) => {
  const {
    currentUser,
    login,
    verifyTwoFactorCode,
    resendTwoFactorCode,
    setCurrentEnvironment,
    loginAsUser,
    logout
  } = useApp();

  const [email, setEmail] = useState(
    requiredRole === 'MASTER'
      ? 'telecom.david@gmail.com'
      : requiredRole === 'REPRESENTANTE_COMERCIAL'
      ? 'carlos.comercial@acheiaqui.com.br'
      : 'carlos@boutiquedasflores.com.br'
  );
  const [password, setPassword] = useState(
    requiredRole === 'MASTER' ? 'telecom2026!' : '123456'
  );
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const targetEnv =
    requiredRole === 'MASTER'
      ? 'MASTER_PANEL'
      : requiredRole === 'REPRESENTANTE_COMERCIAL'
      ? 'COMMERCIAL_PORTAL'
      : 'SELLER_PORTAL';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe suas credenciais completas.');
      return;
    }

    const res = login(email.trim(), password, true);

    if (res.requires2FA) {
      if (res.user?.role !== requiredRole && requiredRole === 'MASTER') {
        setErrorMessage('Esta conta não possui privilégios de Administrador Master.');
        return;
      }
      setIs2FAStep(true);
      setSimulatedCode(res.simulated2FACode || '749210');
      setSuccessMessage(res.message || 'Código de 2ª etapa enviado com sucesso.');
      return;
    }

    if (res.success) {
      if (res.user?.role !== requiredRole && requiredRole === 'MASTER') {
        setErrorMessage('Acesso restrito a Administradores Master.');
        return;
      }
      setCurrentEnvironment(targetEnv);
    } else {
      setErrorMessage(res.message || 'Falha na autenticação. Verifique suas credenciais.');
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!twoFactorCode.trim() || twoFactorCode.trim().length < 6) {
      setErrorMessage('Digite o código de 6 dígitos recebido.');
      return;
    }

    const res = verifyTwoFactorCode(email.trim(), twoFactorCode.trim(), true);
    if (!res.success) {
      setErrorMessage(res.message || 'Código de autenticação em 2 etapas inválido.');
    } else {
      setCurrentEnvironment(targetEnv);
    }
  };

  const handleResend = () => {
    setIsResending(true);
    const res = resendTwoFactorCode(email.trim());
    setSimulatedCode(res.simulatedCode);
    setSuccessMessage(res.message);
    setTimeout(() => setIsResending(false), 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base">
            A
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white">
            Achei Aqui <span className="text-blue-400 font-normal">| Segurança de Acessos</span>
          </span>
        </div>

        <button
          onClick={() => setCurrentEnvironment('MARKETPLACE')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Marketplace</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Icon */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-1">
              {requiredRole === 'MASTER' ? (
                <ShieldAlert className="w-7 h-7" />
              ) : (
                <Store className="w-7 h-7" />
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Current Logged In Status Banner if wrong user */}
          {currentUser && currentUser.role !== requiredRole && !is2FAStep && (
            <div className="mb-4 p-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Você está conectado como:</p>
                  <p className="font-bold text-white">
                    {currentUser.name} ({currentUser.role === 'CUSTOMER' ? 'Usuário / Cliente Grátis R$ 0,00' : currentUser.role})
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentEnvironment('MARKETPLACE')}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Voltar ao App
                  </button>
                  <button
                    onClick={logout}
                    className="px-2.5 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              </div>

              {currentUser.role === 'CUSTOMER' && (
                <div className="p-2.5 bg-blue-950/70 border border-blue-800/80 rounded-xl text-[11px] text-blue-200 space-y-1">
                  <p className="font-bold text-blue-100 flex items-center gap-1.5">
                    <span>ℹ️</span> Perfil de Usuário Gratuito (R$ 0,00)
                  </p>
                  <p className="leading-relaxed">
                    O cadastro de usuário é 100% gratuito e exclusivo para realizar compras e agendamentos no marketplace. Usuários não possuem permissão para postar produtos, inserir banners ou interagir comercialmente. Para anunciar, solicite um credenciamento como <strong>Prestador de Serviços (R$ 29,90)</strong> ou <strong>Lojista</strong> com nossa equipe comercial.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2FA Confirmation Step */}
          {is2FAStep ? (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>Código de Verificação 2FA:</span>
                </div>
                {simulatedCode && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-base font-black tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-blue-400">
                      {simulatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTwoFactorCode(simulatedCode)}
                      className="text-[11px] text-blue-400 hover:underline font-bold"
                    >
                      Preencher código
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
                  Digite o código de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl outline-none font-bold text-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmar Código 2FA</span>
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIs2FAStep(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ← Alterar credenciais
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>Reenviar token</span>
                </button>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  E-mail do Administrador / Lojista
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@acheiaqui.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Senha de acesso
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Autenticar com Confirmação em 2 Etapas</span>
              </button>
            </form>
          )}

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolamento total de painéis e criptografia de ponta a ponta</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-600">
        Plataforma Achei Aqui • Cachoeiras de Macacu / RJ • Protocolo de Segurança Rigoroso
      </footer>
    </div>
  );
};
