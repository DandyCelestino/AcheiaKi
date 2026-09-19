import React, { useState } from 'react';
import {
  X,
  User,
  Store,
  ShieldCheck,
  Mail,
  Lock,
  Phone,
  MapPin,
  Building,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  RefreshCw,
  HelpCircle,
  Check,
  ShieldAlert,
  Crown,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../data/initialData';
import { CATEGORIES_TAXONOMY, getSubcategoriesByCategory } from '../../data/categoryTaxonomy';
import { MEMBERSHIP_PLANS } from '../../data/membershipPlansData';
import { MembershipTier } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register-customer' | 'register-merchant' | 'register-seller' | 'register-representative' | 'forgot-password' | 'resend-confirmation';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login'
}) => {
  const {
    login,
    verifyTwoFactorCode,
    resendTwoFactorCode,
    loginAsUser,
    registerCustomer,
    registerMerchant,
    registerCommercialUser,
    requestPasswordReset,
    completePasswordReset,
    resendEmailConfirmation,
    currentCity,
    triggerToast
  } = useApp();

  const [tab, setTab] = useState<'login' | 'register-customer' | 'register-merchant' | 'register-seller' | 'register-representative' | 'forgot-password' | 'resend-confirmation'>(initialTab);

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 2FA Authentication Flow State
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState('');
  const [simulated2FACode, setSimulated2FACode] = useState<string | null>(null);
  const [pending2FAEmail, setPending2FAEmail] = useState('');
  const [pending2FARole, setPending2FARole] = useState<string | null>(null);
  const [pending2FAName, setPending2FAName] = useState<string | null>(null);
  const [isResending2FA, setIsResending2FA] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Customer registration state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerConfirmPassword, setCustomerConfirmPassword] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerIdDocument, setCustomerIdDocument] = useState('');
  const [customerStreet, setCustomerStreet] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('Centro');
  const [customerComplement, setCustomerComplement] = useState('');
  const [customerZipCode, setCustomerZipCode] = useState('28680-000');
  const [customerRefName, setCustomerRefName] = useState('');
  const [customerRefPhone, setCustomerRefPhone] = useState('');
  const [customerTier, setCustomerTier] = useState<MembershipTier>('GRATIS');
  const [customerTermsAccepted, setCustomerTermsAccepted] = useState(true);

  // Merchant / Provider registration state
  const [merchantType, setMerchantType] = useState<'STORE' | 'SERVICE_PROVIDER'>('SERVICE_PROVIDER');
  const [merchantTier, setMerchantTier] = useState<MembershipTier>('GRATIS');
  const [commercialName, setCommercialName] = useState('');
  const [commercialEmail, setCommercialEmail] = useState('');
  const [commercialPassword, setCommercialPassword] = useState('');
  const [commercialConfirmPassword, setCommercialConfirmPassword] = useState('');
  const [commercialPhone, setCommercialPhone] = useState('');
  const [commercialCpf, setCommercialCpf] = useState('');
  const [commercialIdDocument, setCommercialIdDocument] = useState('');
  const [commercialTermsAccepted, setCommercialTermsAccepted] = useState(false);

  const [merchantOwnerName, setMerchantOwnerName] = useState('');
  const [merchantStoreName, setMerchantStoreName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPassword, setMerchantPassword] = useState('');
  const [merchantConfirmPassword, setMerchantConfirmPassword] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [merchantCnpjOrCpf, setMerchantCnpjOrCpf] = useState('');
  const [cnpjConsultado, setCnpjConsultado] = useState(false);
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [dadosCnpj, setDadosCnpj] = useState<any>(null);
  const [merchantIdDocument, setMerchantIdDocument] = useState('');
  const [merchantCategory, setMerchantCategory] = useState('PRESTADORES DE SERVIÃ‡OS');
  const [merchantSubcategory, setMerchantSubcategory] = useState('eletricistas residenciais & prediais');
  const [merchantStreet, setMerchantStreet] = useState('');
  const [merchantNumber, setMerchantNumber] = useState('');
  const [merchantNeighborhood, setMerchantNeighborhood] = useState('Centro');
  const [merchantZipCode, setMerchantZipCode] = useState('28680-000');
  const [merchantDesc, setMerchantDesc] = useState('');
  const [merchantHours, setMerchantHours] = useState('08:00 Ã s 18:00');
  
  // Mandatory Professional References (minimum 2)
  const [ref1Name, setRef1Name] = useState('');
  const [ref1Phone, setRef1Phone] = useState('');
  const [ref1Role, setRef1Role] = useState('');
  const [ref2Name, setRef2Name] = useState('');
  const [ref2Phone, setRef2Phone] = useState('');
  const [ref2Role, setRef2Role] = useState('');

  const [supportsPickup, setSupportsPickup] = useState(true);
  const [supportsTrial, setSupportsTrial] = useState(false);
  const [supportsAppointments, setSupportsAppointments] = useState(true);
  const [supportsDelivery, setSupportsDelivery] = useState(true);
  const [merchantTermsAccepted, setMerchantTermsAccepted] = useState(true);

  // Forgot password flow state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [simulatedReceivedCode, setSimulatedReceivedCode] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  // Resend confirmation email state
  const [resendEmail, setResendEmail] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginEmail.trim()) {
      setErrorMessage(
        'Por favor, informe seu e-mail de acesso cadastrado.'
      );
      return;
    }

    if (!loginPassword) {
      setErrorMessage(
        'Por favor, digite sua senha de acesso.'
      );
      return;
    }

    const result = await login(
      loginEmail,
      loginPassword,
      rememberMe
    );

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(
        result.message ||
        'Credenciais invÃ¡lidas. Verifique seu e-mail e senha.'
      );
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!twoFactorCodeInput.trim() || twoFactorCodeInput.trim().length < 6) {
      setErrorMessage('Por favor, digite o cÃ³digo de 6 dÃ­gitos recebido.');
      return;
    }

    const result = verifyTwoFactorCode(pending2FAEmail, twoFactorCodeInput.trim(), rememberMe);

    if (result.success) {
      setIs2FAStep(false);
      onClose();
    } else {
      setErrorMessage(result.message || 'CÃ³digo de 2 etapas invÃ¡lido ou expirado.');
    }
  };

  const handleResend2FA = () => {
    setIsResending2FA(true);
    setErrorMessage(null);
    const result = resendTwoFactorCode(pending2FAEmail);
    setSimulated2FACode(result.simulatedCode);
    setSuccessMessage(result.message);
    setTimeout(() => {
      setIsResending2FA(false);
    }, 1200);
  };

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerEmail.trim() || !customerPassword.trim()) {
      setErrorMessage('Por favor, preencha todos os campos cadastrais obrigatÃ³rios.');
      return;
    }

    if (!customerCpf.trim()) {
      setErrorMessage('O CPF Ã© obrigatÃ³rio para validaÃ§Ã£o de seguranÃ§a e emissÃ£o de notas.');
      return;
    }

    if (!customerIdDocument.trim()) {
      setErrorMessage('O Documento de Identidade (RG / CNH) Ã© obrigatÃ³rio.');
      return;
    }

    if (!customerStreet.trim() || !customerNumber.trim() || !customerNeighborhood.trim()) {
      setErrorMessage('O EndereÃ§o completo (Rua, NÃºmero e Bairro) Ã© obrigatÃ³rio.');
      return;
    }

    if (customerPassword.length < 6) {
      setErrorMessage('A senha deve conter no mÃ­nimo 6 caracteres.');
      return;
    }

    if (customerPassword !== customerConfirmPassword) {
      setErrorMessage('As senhas digitadas nÃ£o coincidem.');
      return;
    }

    if (!customerTermsAccepted) {
      setErrorMessage('VocÃª deve aceitar os Termos de Uso e PolÃ­tica de Privacidade.');
      return;
    }

    const fullAddress = `${customerStreet}, ${customerNumber}${
      customerComplement ? ' (' + customerComplement + ')' : ''
    } - ${customerNeighborhood}, Cachoeiras de Macacu`;

    const references = customerRefName.trim() ? [
      {
        name: customerRefName.trim(),
        phone: customerRefPhone.trim() || customerPhone,
        relationshipOrRole: 'Contato de ReferÃªncia Residencial'
      }
    ] : [];

    registerCustomer(
      {
        name: customerName,
        email: customerEmail,
        phone: customerPhone || '(21) 98888-0000',
        address: fullAddress,
        neighborhood: customerNeighborhood,
        cpf: customerCpf,
        idDocument: customerIdDocument,
        references,
        city: currentCity,
        membershipTier: customerTier
      },
      customerPassword,
      customerTier
    );
    onClose();
  };

  const handleRegisterCommercial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      !commercialName.trim() ||
      !commercialEmail.trim() ||
      !commercialPassword.trim()
    ) {
      setErrorMessage('Preencha nome, e-mail e senha.');
      return;
    }

    if (!commercialCpf.trim()) {
      setErrorMessage('O CPF ? obrigat?rio.');
      return;
    }

    if (!commercialIdDocument.trim()) {
      setErrorMessage('O Documento de Identidade (RG / CNH) ? obrigat?rio.');
      return;
    }

    if (commercialPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (commercialPassword !== commercialConfirmPassword) {
      setErrorMessage('A confirma??o de senha n?o confere.');
      return;
    }

    if (!commercialTermsAccepted) {
      setErrorMessage('Voc? deve aceitar os Termos de Uso e Pol?tica de Privacidade.');
      return;
    }

    const role =
      tab === 'register-representative'
        ? 'REPRESENTANTE_COMERCIAL'
        : 'VENDEDOR';

    try {
      await registerCommercialUser(
        {
          name: commercialName.trim(),
          email: commercialEmail.trim(),
          phone: commercialPhone.trim(),
          cpf: commercialCpf.trim(),
          idDocument: commercialIdDocument.trim(),
          city: currentCity
        },
        commercialPassword,
        role
      );

      onClose();
    } catch (error: any) {
      setErrorMessage(
        error?.message || 'N?o foi poss?vel concluir o cadastro.'
      );
    }
  };

  const handleConsultarCnpj = async () => {
    const cnpj = merchantCnpjOrCpf.replace(/\D/g, '');

    if (cnpj.length !== 14) {
      setErrorMessage('Digite um CNPJ válido com 14 dígitos.');
      return;
    }

    setConsultandoCnpj(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/cnpj/${cnpj}`);

      if (!response.ok) {
        const erro = await response.json().catch(() => null);
        throw new Error(erro?.erro || 'CNPJ não encontrado.');
      }

      const dados = await response.json();

      setDadosCnpj(dados);
      setCnpjConsultado(true);

      if (dados.razao_social) {
        setMerchantStoreName(dados.nome_fantasia || dados.razao_social);
      }

      if (dados.cep) {
        setMerchantZipCode(dados.cep);
      }

      if (dados.logradouro) {
        setMerchantStreet(dados.logradouro);
      }

      if (dados.numero) {
        setMerchantNumber(dados.numero);
      }

      if (dados.bairro) {
        setMerchantNeighborhood(dados.bairro);
      }

      setSuccessMessage('CNPJ consultado com sucesso. Confira os dados antes de continuar.');
    } catch (error: any) {
      setDadosCnpj(null);
      setCnpjConsultado(false);
      setErrorMessage(error?.message || 'Não foi possível consultar o CNPJ.');
    } finally {
      setConsultandoCnpj(false);
    }
  };

  const handleRegisterMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!merchantStoreName.trim() || !merchantOwnerName.trim() || !merchantEmail.trim() || !merchantPassword.trim()) {
      setErrorMessage('Preencha os campos obrigatÃ³rios do responsÃ¡vel e do serviÃ§o/loja.');
      return;
    }

    if (!merchantCnpjOrCpf.trim()) {
      setErrorMessage('O CPF ou CNPJ do prestador/lojista Ã© estritamente obrigatÃ³rio.');
      return;
    }

    if (!merchantIdDocument.trim()) {
      setErrorMessage('O Documento Oficial de Identidade (RG / CNH) Ã© obrigatÃ³rio para credenciamento.');
      return;
    }

    if (!merchantStreet.trim() || !merchantNumber.trim() || !merchantNeighborhood.trim()) {
      setErrorMessage('O EndereÃ§o completo (Rua, NÃºmero e Bairro em Cachoeiras) Ã© obrigatÃ³rio.');
      return;
    }

    // References validation - minimum 2 references required
    if (!ref1Name.trim() || !ref1Phone.trim() || !ref1Role.trim()) {
      setErrorMessage('A ReferÃªncia Profissional 1 Ã© obrigatÃ³ria (Nome, Telefone e ServiÃ§o Prestado / RelaÃ§Ã£o).');
      return;
    }

    if (!ref2Name.trim() || !ref2Phone.trim() || !ref2Role.trim()) {
      setErrorMessage('A ReferÃªncia Profissional 2 Ã© obrigatÃ³ria (Nome, Telefone e ServiÃ§o Prestado / RelaÃ§Ã£o).');
      return;
    }

    if (merchantPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (merchantPassword !== merchantConfirmPassword) {
      setErrorMessage('A confirmaÃ§Ã£o de senha nÃ£o confere.');
      return;
    }

    if (!merchantTermsAccepted) {
      setErrorMessage('VocÃª deve concordar com os Termos de Parceria e VerificaÃ§Ã£o Achei Aqui.');
      return;
    }

    const fullAddress = `${merchantStreet}, ${merchantNumber} - ${merchantNeighborhood}, Cachoeiras de Macacu - RJ`;
    const references = [
      { name: ref1Name.trim(), phone: ref1Phone.trim(), relationshipOrRole: ref1Role.trim() },
      { name: ref2Name.trim(), phone: ref2Phone.trim(), relationshipOrRole: ref2Role.trim() }
    ];

    const isService = merchantType === 'SERVICE_PROVIDER' || 
      ['servicos', 'instalacoes', 'reparos', 'consertos', 'marido-de-aluguel', 'ServiÃ§os Gerais', 'Prestadores de ServiÃ§os'].some(cat =>
        merchantCategory.toLowerCase().includes(cat.toLowerCase())
      );

    registerMerchant(
      {
        name: merchantStoreName,
        ownerName: merchantOwnerName,
        category: merchantCategory,
        subcategory: merchantSubcategory,
        phone: merchantPhone || '(21) 99999-1234',
        cnpjOrCpf: merchantCnpjOrCpf,
      cnpjData: dadosCnpj,
        idDocument: merchantIdDocument,
        address: fullAddress,
        street: merchantStreet,
        number: merchantNumber,
        neighborhood: merchantNeighborhood,
        zipCode: merchantZipCode,
        references,
        city: currentCity,
        isServiceProvider: isService,
        offeredItemTypes: isService ? ['SERVICO', 'INSTALACAO', 'MANUTENCAO'] : ['PRODUTO_FISICO'],
        isVerifiedProvider: true,
        description: merchantDesc || (isService ? 'Prestador verificado com documentaÃ§Ã£o e referÃªncias confirmadas.' : 'Estabelecimento local oficial em Cachoeiras de Macacu.'),
        openingHours: merchantHours,
        supportsPickup,
        supportsTrial,
        supportsAppointments,
        membershipTier: merchantTier
      },
      {
        name: merchantOwnerName,
        email: merchantEmail,
        phone: merchantPhone,
        cpf: merchantCnpjOrCpf,
        idDocument: merchantIdDocument,
        references,
        membershipTier: merchantTier
      },
      merchantPassword,
      merchantTier
    );
    onClose();
  };

  const handleSendResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!forgotEmail.trim()) {
      setErrorMessage('Informe o e-mail cadastrado na plataforma.');
      return;
    }

    const res = requestPasswordReset(forgotEmail);
    if (res.success) {
      setSimulatedReceivedCode(res.simulatedCode || '849201');
      setResetCode(res.simulatedCode || '849201');
      setSuccessMessage(res.message);
      setResetStep(2);
    }
  };

  const handleFinishPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newResetPassword !== confirmResetPassword) {
      setErrorMessage('As novas senhas digitadas nÃ£o coincidem.');
      return;
    }

    const res = completePasswordReset(forgotEmail, resetCode, newResetPassword);
    if (res.success) {
      setSuccessMessage('Senha atualizada com sucesso! VocÃª jÃ¡ pode entrar.');
      setTimeout(() => {
        setTab('login');
        setLoginEmail(forgotEmail);
        setResetStep(1);
        setSuccessMessage(null);
      }, 1800);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleResendConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!resendEmail.trim()) {
      setErrorMessage('Digite seu e-mail para receber a verificaÃ§Ã£o.');
      return;
    }

    const res = resendEmailConfirmation(resendEmail);
    if (res.success) {
      setSuccessMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Superior Moderno */}
        <div className="bg-[#0F172A] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base leading-none text-white tracking-tight">
                  Achei Aqui
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Seguro & LGPD
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">Marketplace de Cachoeiras de Macacu, RJ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'login'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Entrar na Plataforma</span>
          </button>

          <button
            onClick={() => {
              setTab('register-customer');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'register-customer'
                ? 'border-blue-600 text-blue-600 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar Conta de Cliente</span>
          </button>

          <button
            onClick={() => {
              setTab('register-merchant');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'register-merchant'
                ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Quero Vender</span>
          </button>

          <button
            onClick={() => {
              setTab('register-seller');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'register-seller'
                ? 'border-violet-600 text-violet-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-violet-600" />
            <span>Vendedor</span>
          </button>

          <button
            onClick={() => {
              setTab('register-representative');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'register-representative'
                ? 'border-amber-600 text-amber-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-600" />
            <span>Representante</span>
          </button>
        </div>

        {/* Body Content com Rolagem Suave */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-800 space-y-4">
          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* 2FA STEP SCREEN (TWO-FACTOR AUTHENTICATION) */}
          {is2FAStep && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2 py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  ConfirmaÃ§Ã£o em Duas Etapas (2FA)
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Acesso de alta seguranÃ§a para <span className="font-bold text-slate-800">{pending2FAName}</span> ({pending2FARole}).
                  Digite o cÃ³digo de verificaÃ§Ã£o de 6 dÃ­gitos gerado para o seu dispositivo.
                </p>
              </div>

              {/* InformaÃ§Ã£o do CÃ³digo Simulado / ProduÃ§Ã£o */}
              {simulated2FACode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                  <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">CÃ³digo de SeguranÃ§a Token (SMS/WhatsApp):</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-extrabold tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300 text-slate-900">
                        {simulated2FACode}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTwoFactorCodeInput(simulated2FACode)}
                        className="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        Auto-preencher
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    Digite o cÃ³digo de 6 dÃ­gitos
                  </label>
                  <div className="relative max-w-xs mx-auto">
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={twoFactorCodeInput}
                      onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full text-center tracking-[0.5em] font-mono text-2xl py-3 bg-slate-50 border-2 border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl outline-none font-bold text-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar Identidade e Acessar</span>
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIs2FAStep(false);
                        setErrorMessage(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 font-medium"
                    >
                      â† Voltar ao login
                    </button>

                    <button
                      type="button"
                      onClick={handleResend2FA}
                      disabled={isResending2FA}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResending2FA ? 'animate-spin' : ''}`} />
                      <span>Reenviar cÃ³digo</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: ENTRAR NA PLATAFORMA */}
          {!is2FAStep && tab === 'login' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Entrar na Plataforma
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Acesso seguro e restrito. Cada usuÃ¡rio tem acesso exclusivo ao seu respectivo painel de controle e pedidos.
                </p>
              </div>

              {/* InformaÃ§Ã£o de SeguranÃ§a e Isolamento */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">SeguranÃ§a de Acesso Exclusivo:</span> Contas de Vendedores e Administradores possuem confirmaÃ§Ã£o em 2 etapas (2FA) e isolamento rigoroso de permissÃµes.
                </div>
              </div>
              {/* FormulÃ¡rio de Login */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail cadastrado
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Senha de acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot-password');
                        setForgotEmail(loginEmail);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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

                {/* Lembrar Acesso & InformaÃ§Ãµes de SeguranÃ§a */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                    />
                    <span>Lembrar acesso neste dispositivo</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setTab('resend-confirmation');
                      setResendEmail(loginEmail);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 underline text-[11px]"
                  >
                    Confirmar e-mail novamente
                  </button>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
                >
                  <span>ENTRAR</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Ainda nÃ£o possui uma conta?{' '}
                  <button
                    onClick={() => setTab('register-customer')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Criar minha conta
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CADASTRO DE CLIENTE */}
          {tab === 'register-customer' && (
            <form onSubmit={handleRegisterCustomer} className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Criar Conta de Cliente
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cadastre-se com dados verificados para comprar produtos, agendar serviÃ§os e solicitar provador VIP.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="mariana@exemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(21) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Documentos ObrigatÃ³rios do Cliente (CPF e ID/RG) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Documentos de ValidaÃ§Ã£o ObrigatÃ³rios (SeguranÃ§a Local)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      CPF do Titular *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Documento de Identidade (RG / CNH) *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerIdDocument}
                      onChange={(e) => setCustomerIdDocument(e.target.value)}
                      placeholder="Ex: RJ-12.345.678-9 DETRAN"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                {cnpjConsultado && dadosCnpj && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-emerald-800">Dados encontrados</div>
                    <div><strong>Razão Social:</strong> {dadosCnpj.razao_social}</div>
                    <div><strong>Nome Fantasia:</strong> {dadosCnpj.nome_fantasia || "Não informado"}</div>
                    <div><strong>Situação:</strong> {dadosCnpj.descricao_situacao_cadastral}</div>
                    <div><strong>Endereço:</strong> {dadosCnpj.logradouro || ""}, {dadosCnpj.numero || "S/N"} - {dadosCnpj.bairro || ""}</div>
                    <div><strong>Cidade:</strong> {dadosCnpj.municipio || ""} - {dadosCnpj.uf || ""}</div>
                  </div>
                )}
              </div>

              {/* Senhas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha (mÃ­nimo 6 dÃ­gitos) *
                  </label>
                  <input
                    type="password"
                    required
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={customerConfirmPassword}
                    onChange={(e) => setCustomerConfirmPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* EndereÃ§o ObrigatÃ³rio */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>EndereÃ§o Completo em Cachoeiras de Macacu *</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={customerStreet}
                      onChange={(e) => setCustomerStreet(e.target.value)}
                      placeholder="Rua / Avenida *"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={customerNumber}
                      onChange={(e) => setCustomerNumber(e.target.value)}
                      placeholder="NÃºmero *"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={customerNeighborhood}
                    onChange={(e) => setCustomerNeighborhood(e.target.value)}
                    placeholder="Bairro (ex: Centro, Papucaia) *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={customerComplement}
                    onChange={(e) => setCustomerComplement(e.target.value)}
                    placeholder="Complemento / Apto"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Contato de ReferÃªncia Residencial / EmergÃªncia (Opcional):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={customerRefName}
                      onChange={(e) => setCustomerRefName(e.target.value)}
                      placeholder="Nome do contato de referÃªncia"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                    <input
                      type="tel"
                      value={customerRefPhone}
                      onChange={(e) => setCustomerRefPhone(e.target.value)}
                      placeholder="Telefone / WhatsApp"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modalidade / Plano de UsuÃ¡rio (GrÃ¡tis, Bronze, Prata, Ouro, Premium) */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-slate-50 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-950">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Escolha a sua Modalidade de Cadastro:</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {MEMBERSHIP_PLANS[customerTier].title}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(MEMBERSHIP_PLANS) as MembershipTier[]).map((t) => {
                    const plan = MEMBERSHIP_PLANS[t];
                    const isSelected = customerTier === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomerTier(t)}
                        className={`p-2 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[11px] font-black uppercase ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {plan.name}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <p className={`text-[10px] font-extrabold ${isSelected ? 'text-amber-100' : 'text-amber-700'}`}>
                            {plan.monthlyPrice === 0 ? 'GrÃ¡tis' : `R$ ${plan.monthlyPrice}/mÃªs`}
                          </p>
                        </div>
                        <p className={`text-[9px] mt-1 line-clamp-2 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                          {plan.highlights?.[0] || plan.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Termos & LGPD */}
              <div className="pt-1">
                <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={customerTermsAccepted}
                    onChange={(e) => setCustomerTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                  />
                  <span>
                    Concordo com os <strong className="text-slate-800">Termos de Uso</strong> e autorizo o tratamento dos meus dados conforme as diretrizes da <strong className="text-slate-800">LGPD</strong>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                id="btn-register-customer-submit"
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>CRIAR MINHA CONTA</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  JÃ¡ possui conta cadastrada?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Fazer Login
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 3: CADASTRO DE LOJISTA / PRESTADOR DE SERVIÃ‡OS */}
          {(tab === 'register-seller' || tab === 'register-representative') && (
            <form onSubmit={handleRegisterCommercial} className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  {tab === 'register-representative'
                    ? 'Cadastro de Representante Comercial'
                    : 'Cadastro de Vendedor'}
                </h4>

                <p className="text-xs text-slate-500 mt-0.5">
                  Crie sua conta profissional para atuar no Achei Aqui.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={commercialName}
                    onChange={(e) => setCommercialName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={commercialEmail}
                    onChange={(e) => setCommercialEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={commercialPhone}
                    onChange={(e) => setCommercialPhone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={commercialCpf}
                    onChange={(e) => setCommercialCpf(e.target.value)}
                    placeholder="CPF"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RG / CNH *
                  </label>
                  <input
                    type="text"
                    required
                    value={commercialIdDocument}
                    onChange={(e) => setCommercialIdDocument(e.target.value)}
                    placeholder="Documento de identidade"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={commercialPassword}
                    onChange={(e) => setCommercialPassword(e.target.value)}
                    placeholder="M?nimo 6 caracteres"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={commercialConfirmPassword}
                    onChange={(e) => setCommercialConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={commercialTermsAccepted}
                  onChange={(e) => setCommercialTermsAccepted(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-xs text-slate-600">
                  Concordo com os Termos de Uso e Pol?tica de Privacidade do Achei Aqui.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
              >
                {tab === 'register-representative'
                  ? 'Criar Conta de Representante'
                  : 'Criar Conta de Vendedor'}
              </button>
            </form>
          )}

          {tab === 'register-merchant' && (
            <form onSubmit={handleRegisterMerchant} className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMerchantType('SERVICE_PROVIDER');
                      setMerchantCategory('Prestadores de ServiÃ§os');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      merchantType === 'SERVICE_PROVIDER'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>ðŸ› ï¸ Prestador de ServiÃ§os / Marido de Aluguel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMerchantType('STORE');
                      setMerchantCategory('Gastronomia & Delivery');
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      merchantType === 'STORE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>ðŸª Lojista / ComÃ©rcio FÃ­sico</span>
                  </button>
                </div>

                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md mb-1 ${
                  merchantType === 'SERVICE_PROVIDER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {merchantType === 'SERVICE_PROVIDER' ? 'Credenciamento com CPF, ID e ReferÃªncias ObrigatÃ³rios' : 'Credenciamento de ComÃ©rcio Local'}
                </span>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  {merchantType === 'SERVICE_PROVIDER' ? 'Cadastrar como Prestador de ServiÃ§os' : 'Cadastrar Minha Loja Comercial'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {merchantType === 'SERVICE_PROVIDER' 
                    ? 'Receba pedidos de instalaÃ§Ãµes, reparos rÃ¡pidos, consertos e serviÃ§os gerais com perfil verificado em Cachoeiras.'
                    : 'Venda online, ofereÃ§a retirada no balcÃ£o e delivery para os moradores de Cachoeiras de Macacu.'}
                </p>
              </div>

              {/* ResponsÃ¡vel e Nome da Empresa / ServiÃ§o */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do ResponsÃ¡vel / Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantOwnerName}
                    onChange={(e) => setMerchantOwnerName(e.target.value)}
                    placeholder="Ex: Edson Marcondes"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {merchantType === 'SERVICE_PROVIDER' ? 'Nome do ServiÃ§o / Nome Fantasia *' : 'Nome Fantasia da Loja *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantStoreName}
                    onChange={(e) => setMerchantStoreName(e.target.value)}
                    placeholder={merchantType === 'SERVICE_PROVIDER' ? 'Ex: Marido de Aluguel Macacu' : 'Ex: Boutique das Flores'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Contatos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Contato / NotificaÃ§Ãµes *
                  </label>
                  <input
                    type="email"
                    required
                    value={merchantEmail}
                    onChange={(e) => setMerchantEmail(e.target.value)}
                    placeholder="contato@exemplo.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp para Pedidos / Agendamentos *
                  </label>
                  <input
                    type="tel"
                    required
                    value={merchantPhone}
                    onChange={(e) => setMerchantPhone(e.target.value)}
                    placeholder="(21) 98855-4433"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* DOCUMENTOS OBRIGATÃ“RIOS: CPF/CNPJ e ID/RG */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span>DocumentaÃ§Ã£o ObrigatÃ³ria para ValidaÃ§Ã£o e Selo Verificado</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      CPF ou CNPJ do Profissional / Loja *
                    </label>
                    <div className="flex gap-2">
  <input
    type="text"
    required
    value={merchantCnpjOrCpf}
    onChange={(e) => {
      setMerchantCnpjOrCpf(e.target.value);
      setCnpjConsultado(false);
    }}
    placeholder="Ex: 458.129.832-10 ou CNPJ"
    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
  />
  <button
    type="button"
    onClick={handleConsultarCnpj}
    disabled={consultandoCnpj}
    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
  >
    {consultandoCnpj ? 'Consultando...' : 'Consultar CNPJ'}
  </button>
</div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Documento de Identidade ID / RG / CNH *
                    </label>
                    <input
                      type="text"
                      required
                      value={merchantIdDocument}
                      onChange={(e) => setMerchantIdDocument(e.target.value)}
                      placeholder="Ex: 14.892.410-2 DETRAN/RJ"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                {cnpjConsultado && dadosCnpj && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-emerald-800">Dados encontrados</div>
                    <div><strong>Razão Social:</strong> {dadosCnpj.razao_social}</div>
                    <div><strong>Nome Fantasia:</strong> {dadosCnpj.nome_fantasia || "Não informado"}</div>
                    <div><strong>Situação:</strong> {dadosCnpj.descricao_situacao_cadastral}</div>
                    <div><strong>Endereço:</strong> {dadosCnpj.logradouro || ""}, {dadosCnpj.numero || "S/N"} - {dadosCnpj.bairro || ""}</div>
                    <div><strong>Cidade:</strong> {dadosCnpj.municipio || ""} - {dadosCnpj.uf || ""}</div>
                  </div>
                )}
              </div>

              {/* Senhas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha de Acesso ao Painel (mÃ­nimo 6 dÃ­gitos) *
                  </label>
                  <input
                    type="password"
                    required
                    value={merchantPassword}
                    onChange={(e) => setMerchantPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={merchantConfirmPassword}
                    onChange={(e) => setMerchantConfirmPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Categoria e Subcategoria */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CATEGORIA PRINCIPAL (CAIXA ALTA) *
                    </label>
                    <select
                      value={merchantCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setMerchantCategory(newCat);
                        const subs = getSubcategoriesByCategory(newCat);
                        if (subs.length > 0) {
                          setMerchantSubcategory(subs[0].name);
                        } else {
                          setMerchantSubcategory('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none font-bold uppercase"
                    >
                      {CATEGORIES_TAXONOMY.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} {cat.isFirstHighlight ? 'â˜… (DESTAQUE)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subcategoria de AtuaÃ§Ã£o (caixa baixa) *
                    </label>
                    <select
                      value={merchantSubcategory}
                      onChange={(e) => setMerchantSubcategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none font-medium lowercase"
                    >
                      {getSubcategoriesByCategory(merchantCategory).map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HorÃ¡rio de Atendimento
                  </label>
                  <input
                    type="text"
                    value={merchantHours}
                    onChange={(e) => setMerchantHours(e.target.value)}
                    placeholder="Ex: 08:00 Ã s 18:00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* ENDEREÃ‡O OBRIGATÃ“RIO DO PRESTADOR / LOJA */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>EndereÃ§o Completo em Cachoeiras de Macacu *</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      value={merchantStreet}
                      onChange={(e) => setMerchantStreet(e.target.value)}
                      placeholder="Rua / Avenida do Atendimento ou Oficina *"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={merchantNumber}
                      onChange={(e) => setMerchantNumber(e.target.value)}
                      placeholder="NÃºmero *"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={merchantNeighborhood}
                    onChange={(e) => setMerchantNeighborhood(e.target.value)}
                    placeholder="Bairro (ex: Centro, Papucaia, JapuÃ­ba) *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={merchantZipCode}
                    onChange={(e) => setMerchantZipCode(e.target.value)}
                    placeholder="CEP (ex: 28680-000)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* REFERÃŠNCIAS PROFISSIONAIS OBRIGATÃ“RIAS (MÃNIMO 2) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>ReferÃªncias Profissionais ObrigatÃ³rias (MÃ­nimo 2 ReferÃªncias) *</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Para seguranÃ§a dos clientes e moradores da cidade, informe clientes anteriores, comÃ©rcios ou condomÃ­nios onde vocÃª jÃ¡ prestou serviÃ§os.
                </p>

                {/* ReferÃªncia 1 */}
                <div className="p-2.5 bg-white rounded-lg border border-amber-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800">ReferÃªncia 1 (ObrigatÃ³ria):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={ref1Name}
                      onChange={(e) => setRef1Name(e.target.value)}
                      placeholder="Nome do cliente/empresa *"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={ref1Phone}
                      onChange={(e) => setRef1Phone(e.target.value)}
                      placeholder="Telefone / WhatsApp *"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={ref1Role}
                      onChange={(e) => setRef1Role(e.target.value)}
                      placeholder="ServiÃ§o prestado / RelaÃ§Ã£o *"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
                    />
                  </div>
                </div>

                {/* ReferÃªncia 2 */}
                <div className="p-2.5 bg-white rounded-lg border border-amber-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-800">ReferÃªncia 2 (ObrigatÃ³ria):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={ref2Name}
                      onChange={(e) => setRef2Name(e.target.value)}
                      placeholder="Nome do cliente/empresa *"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={ref2Phone}
                      onChange={(e) => setRef2Phone(e.target.value)}
                      placeholder="Telefone / WhatsApp *"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={ref2Role}
                      onChange={(e) => setRef2Role(e.target.value)}
                      placeholder="ServiÃ§o prestado / RelaÃ§Ã£o *"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* DescriÃ§Ã£o dos ServiÃ§os */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Breve ApresentaÃ§Ã£o dos ServiÃ§os / Especialidades
                </label>
                <textarea
                  rows={2}
                  value={merchantDesc}
                  onChange={(e) => setMerchantDesc(e.target.value)}
                  placeholder="Ex: InstalaÃ§Ã£o de ar condicionado, reparos elÃ©tricos e hidrÃ¡ulicos com ferramentas de precisÃ£o e pontualidade."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              {/* Modalidades que aceita */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Tipos de Atendimento Oferecidos:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supportsAppointments}
                      onChange={(e) => setSupportsAppointments(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Visita / Agendamento em DomicÃ­lio</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supportsPickup}
                      onChange={(e) => setSupportsPickup(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Na Oficina / BalcÃ£o</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supportsDelivery}
                      onChange={(e) => setSupportsDelivery(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Entrega de PeÃ§as / Produtos</span>
                  </label>
                </div>
              </div>

              {/* Modalidade / Plano Escolhido do Vendedor (GrÃ¡tis, Bronze, Prata, Ouro, Premium) */}
              <div className="p-4 bg-gradient-to-br from-amber-50/80 via-white to-slate-50 border border-amber-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-950">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>Selecione a Modalidade do seu Estabelecimento / ServiÃ§o *</span>
                  </div>
                  <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {MEMBERSHIP_PLANS[merchantTier].title}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {(Object.keys(MEMBERSHIP_PLANS) as MembershipTier[]).map((t) => {
                    const plan = MEMBERSHIP_PLANS[t];
                    const isSelected = merchantTier === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMerchantTier(t)}
                        className={`p-2.5 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {plan.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                          </div>
                          <p className={`text-xs font-extrabold ${isSelected ? 'text-amber-100' : 'text-amber-700'}`}>
                            {plan.monthlyPrice === 0 ? 'GrÃ¡tis' : `R$ ${plan.monthlyPrice}/mÃªs`}
                          </p>
                          <p className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-amber-200' : 'text-slate-500'}`}>
                            {plan.maxProducts === 9999 ? 'Produtos Ilimitados' : `AtÃ© ${plan.maxProducts} produtos`}
                          </p>
                        </div>
                        <div className={`mt-2 pt-1.5 border-t text-[10px] ${
                          isSelected ? 'border-amber-400/50 text-amber-100' : 'border-slate-100 text-slate-500'
                        }`}>
                          <span>ComissÃ£o: <strong>{plan.commissionRate}%</strong></span>
                          {plan.tier === 'GRATIS' && (
                            <p className={`text-[9px] mt-0.5 ${isSelected ? 'text-amber-200' : 'text-amber-800 font-semibold'}`}>
                              â€¢ Pague somente se vender
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 bg-amber-100/60 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">ðŸ’¡ Regra da Modalidade:</span>
                  <span>{MEMBERSHIP_PLANS[merchantTier].buyerDataRule}</span>
                </div>
              </div>

              {/* Termos Lojista/Prestador */}
              <div className="pt-1">
                <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={merchantTermsAccepted}
                    onChange={(e) => setMerchantTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                  />
                  <span>
                    Declaro a veracidade do <strong className="text-slate-800">CPF, ID e ReferÃªncias informadas</strong> e concordo com os Termos de Credenciamento Achei Aqui.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                id="btn-register-merchant-submit"
                className={`w-full py-3 px-6 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 ${
                  merchantType === 'SERVICE_PROVIDER'
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                <span>{merchantType === 'SERVICE_PROVIDER' ? 'FINALIZAR CADASTRO DE PRESTADOR' : 'CADASTRAR MINHA LOJA'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 4: ESQUECI MINHA SENHA (RECUPERAÃ‡ÃƒO SEGURA) */}
          {tab === 'forgot-password' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  RecuperaÃ§Ã£o de Senha
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informe o seu e-mail cadastrado para enviarmos as instruÃ§Ãµes de redefiniÃ§Ã£o com cÃ³digo de seguranÃ§a.
                </p>
              </div>

              {resetStep === 1 ? (
                <form onSubmit={handleSendResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail da Conta
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
                  >
                    <span>ENVIAR CÃ“DIGO DE RECUPERAÃ‡ÃƒO</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleFinishPasswordReset} className="space-y-4">
                  {simulatedReceivedCode && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-blue-900 block">
                        ðŸ”‘ CÃ³digo de verificaÃ§Ã£o gerado para teste:
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-black text-blue-950 tracking-widest">
                          {simulatedReceivedCode}
                        </span>
                        <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-semibold">
                          Preenchido automaticamente
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CÃ³digo de 6 dÃ­gitos recebido *
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-sm font-bold tracking-widest focus:bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nova Senha *
                      </label>
                      <input
                        type="password"
                        required
                        value={newResetPassword}
                        onChange={(e) => setNewResetPassword(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirmar Nova Senha *
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmResetPassword}
                        onChange={(e) => setConfirmResetPassword(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
                  >
                    <span>REDEFINIR SENHA</span>
                    <KeyRound className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setResetStep(1);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  â† Voltar para o Login
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CONFIRMAR E-MAIL NOVAMENTE */}
          {tab === 'resend-confirmation' && (
            <form onSubmit={handleResendConfirmation} className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Confirmar E-mail
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  NÃ£o recebeu o link de ativaÃ§Ã£o da sua conta? Digite o e-mail cadastrado para reenviarmos imediatamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail da Conta
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <span>REENVIAR LINK DE CONFIRMAÃ‡ÃƒO</span>
                <RefreshCw className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  â† Voltar para o Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
