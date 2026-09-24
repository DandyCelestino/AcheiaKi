import React, { useState, useEffect } from 'react';
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
  Briefcase,
  Bike,
  Wrench,
  Car,
  CreditCard,
  QrCode,
  Receipt,
  Copy,
  CheckCircle,
  CheckSquare,
  Layers,
  AlertTriangle,
  Building2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../data/initialData';
import { CATEGORIES_TAXONOMY, getSubcategoriesByCategory } from '../../data/categoryTaxonomy';
import { MEMBERSHIP_PLANS } from '../../data/membershipPlansData';
import { MembershipTier, DeliveryVehicleType, StoreMerchant, BoletoBillingRequest } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver' | 'forgot-password' | 'resend-confirmation' | 'plan-checkout' | 'plan-success' | 'driver-pending-approval' | 'change-temporary-password';
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
    registerDeliveryDriver,
    requestPasswordReset,
    completePasswordReset,
    resendEmailConfirmation,
    confirmMerchantPlanPayment,
    completeInitialPasswordChange,
    currentCity,
    triggerToast,
    salesAgents,
    users,
    setCurrentEnvironment
  } = useApp();

  const resolveInitialTab = (t?: string): 'login' | 'register-customer' | 'register-merchant' | 'register-driver' | 'forgot-password' | 'resend-confirmation' | 'plan-checkout' | 'plan-success' | 'driver-pending-approval' | 'change-temporary-password' => {
    if (t === 'register-provider') return 'register-merchant';
    if (t === 'register-driver') return 'register-driver';
    if (t === 'register-merchant') return 'register-merchant';
    if (t === 'register-customer') return 'register-customer';
    if (t === 'forgot-password') return 'forgot-password';
    if (t === 'resend-confirmation') return 'resend-confirmation';
    if (t === 'plan-checkout') return 'plan-checkout';
    if (t === 'plan-success') return 'plan-success';
    if (t === 'driver-pending-approval') return 'driver-pending-approval';
    if (t === 'change-temporary-password') return 'change-temporary-password';
    return 'login';
  };

  const [tab, setTab] = useState<
    | 'login'
    | 'register-customer'
    | 'register-merchant'
    | 'register-driver'
    | 'forgot-password'
    | 'resend-confirmation'
    | 'plan-checkout'
    | 'plan-success'
    | 'driver-pending-approval'
    | 'change-temporary-password'
  >(() => resolveInitialTab(initialTab));

  // Common UI State
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sellerRedirectNotice, setSellerRedirectNotice] = useState(false);

  // 2FA Authentication Flow State
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState('');
  const [simulated2FACode, setSimulated2FACode] = useState<string | null>(null);
  const [pending2FAEmail, setPending2FAEmail] = useState('');
  const [pending2FARole, setPending2FARole] = useState<string | null>(null);
  const [pending2FAName, setPending2FAName] = useState<string | null>(null);
  const [isResending2FA, setIsResending2FA] = useState(false);

  // Login form state
  const loginEmailRef = React.useRef('');
  const loginPasswordRef = React.useRef('');

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
  const [customerTier, setCustomerTier] = useState<MembershipTier>('GRATIS');
  const [customerTermsAccepted, setCustomerTermsAccepted] = useState(true);
  const [customerDisclaimerAccepted, setCustomerDisclaimerAccepted] = useState(false);

  // Merchant / Provider registration state
  const [merchantType, setMerchantType] = useState<'STORE' | 'SERVICE_PROVIDER'>('SERVICE_PROVIDER');
  const [merchantTier, setMerchantTier] = useState<MembershipTier>('GRATIS');
  const [merchantOwnerName, setMerchantOwnerName] = useState('');
  const [merchantStoreName, setMerchantStoreName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPassword, setMerchantPassword] = useState('');
  const [merchantConfirmPassword, setMerchantConfirmPassword] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [merchantCnpjOrCpf, setMerchantCnpjOrCpf] = useState('');
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
  const [merchantDisclaimerAccepted, setMerchantDisclaimerAccepted] = useState(false);

  // Forgot password flow state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [simulatedReceivedCode, setSimulatedReceivedCode] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');

  // Resend confirmation email state
  const [resendEmail, setResendEmail] = useState('');

  // Delivery Driver registration state
  const [driverName, setDriverName] = useState('');
  const [driverCpf, setDriverCpf] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverConfirmPassword, setDriverConfirmPassword] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverCnhNumber, setDriverCnhNumber] = useState('');
  const [driverCnhCategory, setDriverCnhCategory] = useState<'A' | 'B' | 'AB'>('A');
  const [driverVehicleType, setDriverVehicleType] = useState<DeliveryVehicleType>('MOTO');
  const [driverVehicleModel, setDriverVehicleModel] = useState('');
  const [driverVehiclePlate, setDriverVehiclePlate] = useState('');
  const [driverVehicleColor, setDriverVehicleColor] = useState('');
  const [driverPixKey, setDriverPixKey] = useState('');
  const [driverTermsAccepted, setDriverTermsAccepted] = useState(true);
  const [isDriverSubmitting, setIsDriverSubmitting] = useState(false);

  // Checkout & Payment for Registered Merchant / Provider
  const [pendingCheckoutMerchant, setPendingCheckoutMerchant] = useState<StoreMerchant | null>(null);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<MembershipTier>('PRATA');
  const [checkoutBillingCycle, setCheckoutBillingCycle] = useState<'MENSAL' | 'TRIMESTRAL' | 'ANUAL'>('MENSAL');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'PIX' | 'BOLETO' | 'CARTAO'>('PIX');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedPaymentReceipt, setConfirmedPaymentReceipt] = useState<BoletoBillingRequest | null>(null);

  // First Access Password Change for Vendedor / User
  const [pendingPasswordChangeEmail, setPendingPasswordChangeEmail] = useState('');
  const [newInitialPassword, setNewInitialPassword] = useState('');
  const [confirmInitialPassword, setConfirmInitialPassword] = useState('');

  useEffect(() => {
    if (isOpen && initialTab) {
      setTab(resolveInitialTab(initialTab));
      if (initialTab === 'register-merchant') {
        setMerchantType('STORE');
      } else if (initialTab === 'register-provider') {
        setMerchantType('SERVICE_PROVIDER');
      }
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const getPlanBasePrice = (tier: MembershipTier, isService: boolean): number => {
    if (isService) return 29.90;
    switch (tier) {
      case 'BRONZE': return 19.90;
      case 'PRATA': return 59.90;
      case 'OURO': return 49.90;
      case 'PREMIUM':
      case 'MASTER': return 199.90;
      default: return 29.90;
    }
  };

  const getCheckoutTotal = (): { total: number; discount: number; months: number; platformNet: number; sellerCommission: number } => {
    const isService = pendingCheckoutMerchant?.isServiceProvider ?? false;
    const baseMonthly = getPlanBasePrice(selectedCheckoutPlan, isService);
    let months = 1;
    let discountPercent = 0;

    if (checkoutBillingCycle === 'TRIMESTRAL') {
      months = 3;
      discountPercent = 0.05;
    } else if (checkoutBillingCycle === 'ANUAL') {
      months = 12;
      discountPercent = 0.15;
    }

    const subtotal = baseMonthly * months;
    const discount = subtotal * discountPercent;
    const total = subtotal - discount;

    const sellerCommission = Number((total * 0.15).toFixed(2));
    const platformNet = Number((total - sellerCommission).toFixed(2));

    return { total: Number(total.toFixed(2)), discount: Number(discount.toFixed(2)), months, platformNet, sellerCommission };
  };

  const handleConfirmPlanPayment = () => {
    if (!pendingCheckoutMerchant) return;
    setIsProcessingPayment(true);
    setErrorMessage(null);

    const { total } = getCheckoutTotal();

    try {
      const res = confirmMerchantPlanPayment({
        merchantId: pendingCheckoutMerchant.id,
        planTier: selectedCheckoutPlan,
        billingFrequency: checkoutBillingCycle,
        amount: total,
        paymentMethod: checkoutPaymentMethod,
        autoLogin: false
      });

      if (res.success) {
        setConfirmedPaymentReceipt(res.boletoRequest || null);
        setTab('plan-success');
        triggerToast('Pagamento do plano confirmado e acesso liberado com sucesso!');
      } else {
        setErrorMessage(res.message || 'Erro ao processar ativaÃ§Ã£o do plano.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao confirmar pagamento.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleEnterSellerPortalAfterPayment = () => {
    if (pendingCheckoutMerchant) {
      const owner = users.find(u => u.email.toLowerCase() === pendingCheckoutMerchant.ownerEmail?.toLowerCase())
        || users.find(u => u.storeId === pendingCheckoutMerchant.id);
      if (owner) {
        loginAsUser(owner);
      }
      setCurrentEnvironment('SELLER_PORTAL');
    }
    onClose();
  };

  const handleSaveInitialPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newInitialPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mÃ­nimo 6 caracteres.');
      return;
    }

    if (newInitialPassword !== confirmInitialPassword) {
      setErrorMessage('A confirmaÃ§Ã£o da nova senha nÃ£o confere.');
      return;
    }

    const res = completeInitialPasswordChange(pendingPasswordChangeEmail, newInitialPassword);
    if (res.success) {
      triggerToast('Senha definitiva salva com sucesso! Acesso liberado ao Painel Comercial.');
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSellerRedirectNotice(false);

    if (!loginEmailRef.current.trim() || !loginPasswordRef.current.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    const result = login(loginEmailRef.current, loginPasswordRef.current, rememberMe);

    if (result.requires2FA) {
      setIs2FAStep(true);
      setPending2FAEmail(loginEmailRef.current.trim().toLowerCase());
      setPending2FARole(result.user?.role || 'VENDEDOR');
      setPending2FAName(result.user?.name || 'UsuÃ¡rio');
      setSimulated2FACode(result.simulated2FACode || '749210');
      setTwoFactorCodeInput('');
      setSuccessMessage(result.message || 'CÃ³digo de confirmaÃ§Ã£o de 2 etapas gerado com sucesso.');
      return;
    }

    if (result.requiresPasswordChange) {
      setTab('change-temporary-password');
      setPendingPasswordChangeEmail(result.user?.email || loginEmailRef.current.trim().toLowerCase());
      setSuccessMessage('Primeiro acesso detectado. Ã‰ obrigatÃ³rio criar sua nova senha definitiva antes de entrar no painel.');
      return;
    }

    if (result.success) {
      onClose();
    } else {
      setErrorMessage(result.message || 'Credenciais invÃ¡lidas. Verifique seu e-mail e senha.');
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

    if (!customerDisclaimerAccepted) {
      setErrorMessage('VocÃª deve declarar ciÃªncia de que a Achei Aqui Ã© uma plataforma de intermediaÃ§Ã£o e que Ã© sua responsabilidade checar a existÃªncia da loja/prestador antes de fechar negÃ³cios.');
      return;
    }

    const fullAddress = `${customerStreet}, ${customerNumber}${
      customerComplement ? ' (' + customerComplement + ')' : ''
    } - ${customerNeighborhood}, Cachoeiras de Macacu`;

    registerCustomer(
      {
        name: customerName,
        email: customerEmail,
        phone: customerPhone || '(21) 98888-0000',
        address: fullAddress,
        neighborhood: customerNeighborhood,
        cpf: customerCpf,
        idDocument: customerIdDocument,
        references: [],
        city: currentCity,
        membershipTier: customerTier
      },
      customerPassword,
      customerTier
    );
    onClose();
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

    // ReferÃªncias profissionais: OBRIGATÃ“RIAS APENAS PARA PRESTADORES DE SERVIÃ‡O
    if (merchantType === 'SERVICE_PROVIDER') {
      if (!ref1Name.trim() || !ref1Phone.trim() || !ref1Role.trim()) {
        setErrorMessage('A ReferÃªncia Profissional 1 Ã© obrigatÃ³ria para prestadores de serviÃ§os (Nome, Telefone e ServiÃ§o Prestado / RelaÃ§Ã£o).');
        return;
      }

      if (!ref2Name.trim() || !ref2Phone.trim() || !ref2Role.trim()) {
        setErrorMessage('A ReferÃªncia Profissional 2 Ã© obrigatÃ³ria para prestadores de serviÃ§os (Nome, Telefone e ServiÃ§o Prestado / RelaÃ§Ã£o).');
        return;
      }
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

    if (!merchantDisclaimerAccepted) {
      setErrorMessage('VocÃª deve declarar ciÃªncia de que a plataforma atua na intermediaÃ§Ã£o e que a responsabilidade das negociaÃ§Ãµes Ã© exclusivamente das partes.');
      return;
    }

    const fullAddress = `${merchantStreet}, ${merchantNumber} - ${merchantNeighborhood}, Cachoeiras de Macacu - RJ`;
    const references = merchantType === 'SERVICE_PROVIDER' ? [
      { name: ref1Name.trim(), phone: ref1Phone.trim(), relationshipOrRole: ref1Role.trim() },
      { name: ref2Name.trim(), phone: ref2Phone.trim(), relationshipOrRole: ref2Role.trim() }
    ] : [];

    const isService = merchantType === 'SERVICE_PROVIDER' || 
      ['servicos', 'instalacoes', 'reparos', 'consertos', 'marido-de-aluguel', 'ServiÃ§os Gerais', 'Prestadores de ServiÃ§os'].some(cat =>
        merchantCategory.toLowerCase().includes(cat.toLowerCase())
      );

    const newMerchant = registerMerchant(
      {
        name: merchantStoreName,
        ownerName: merchantOwnerName,
        category: merchantCategory,
        subcategory: merchantSubcategory,
        phone: merchantPhone || '(21) 99999-1234',
        cnpjOrCpf: merchantCnpjOrCpf,
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
      merchantTier,
      true // requiresPayment = true
    );
    setPendingCheckoutMerchant(newMerchant);
    setSelectedCheckoutPlan(isService ? 'PRATA' : (merchantTier === 'GRATIS' ? 'BRONZE' : merchantTier));
    setTab('plan-checkout');
  };

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!driverName.trim() || !driverCpf.trim() || !driverEmail.trim() || !driverPassword.trim() || !driverPhone.trim() || !driverCnhNumber.trim() || !driverVehicleModel.trim() || !driverVehiclePlate.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatÃ³rios do credenciamento de entregador.');
      return;
    }

    if (driverPassword.length < 6) {
      setErrorMessage('A senha deve ter no mÃ­nimo 6 dÃ­gitos.');
      return;
    }

    if (driverPassword !== driverConfirmPassword) {
      setErrorMessage('A confirmaÃ§Ã£o da senha nÃ£o confere.');
      return;
    }

    if (!driverTermsAccepted) {
      setErrorMessage('VocÃª deve aceitar os termos de prestaÃ§Ã£o de serviÃ§os de entrega parceira.');
      return;
    }

    setIsDriverSubmitting(true);
    const res = await registerDeliveryDriver({
      name: driverName.trim(),
      cpf: driverCpf.trim(),
      email: driverEmail.trim().toLowerCase(),
      password: driverPassword,
      phone: driverPhone.trim(),
      address: driverAddress.trim() || `Cachoeiras de Macacu, RJ`,
      cnhNumber: driverCnhNumber.trim(),
      cnhCategory: driverCnhCategory,
      vehicleType: driverVehicleType,
      vehicleModel: driverVehicleModel.trim(),
      vehiclePlate: driverVehiclePlate.trim().toUpperCase(),
      vehicleColor: driverVehicleColor.trim(),
      pixKey: driverPixKey.trim() || driverCpf.trim()
    });
    setIsDriverSubmitting(false);

    if (res.success) {
      setSuccessMessage('Cadastro de entregador enviado com sucesso!');
      triggerToast('Cadastro enviado para aprovaÃ§Ã£o!');
      setTab('driver-pending-approval');
    } else {
      setErrorMessage(res.message);
    }
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
        loginEmailRef.current = forgotEmail;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header Superior Moderno (shrink-0) */}
        <div className="bg-[#0F172A] text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-sm">
              AA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base leading-none text-white tracking-tight">
                  Achei Aqui
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Seguro & LGPD
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">Plataforma Comercial e de ServiÃ§os â€¢ Cachoeiras de Macacu, RJ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation PrimÃ¡ria (shrink-0) */}
        {!(tab === 'plan-checkout' || tab === 'plan-success' || tab === 'driver-pending-approval' || tab === 'change-temporary-password') ? (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 min-h-[44px] ${
                tab === 'login' || tab === 'forgot-password' || tab === 'resend-confirmation'
                  ? 'border-blue-600 text-blue-600 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Entrar na Conta</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (tab === 'login' || tab === 'forgot-password' || tab === 'resend-confirmation') {
                  setTab('register-customer');
                }
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 min-h-[44px] ${
                tab.startsWith('register-')
                  ? 'border-emerald-600 text-emerald-700 bg-white font-black shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cadastre-se na Plataforma</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">
                {tab === 'plan-checkout' && 'Etapa de Pagamento: AtivaÃ§Ã£o do Plano do Estabelecimento'}
                {tab === 'plan-success' && 'AtivaÃ§Ã£o ConcluÃ­da: Comprovante e LiberaÃ§Ã£o'}
                {tab === 'driver-pending-approval' && 'Credenciamento de Entregador: Protocolo em AnÃ¡lise'}
                {tab === 'change-temporary-password' && 'SeguranÃ§a do Acesso: Troca ObrigatÃ³ria de Senha'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              Achei Aqui SeguranÃ§a
            </span>
          </div>
        )}

        {/* ABAS PERMANENTES E VISÃVEIS DE MODALIDADE DE CADASTRO (shrink-0) */}
        {tab.startsWith('register-') && (
          <div className="bg-slate-100/95 border-b border-slate-200 p-2.5 sm:p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Modalidade de Cadastro (Selecione o seu perfil):</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full">
                Dados Protegidos
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {/* 1. Cliente */}
              <button
                type="button"
                onClick={() => {
                  setTab('register-customer');
                  setErrorMessage(null);
                }}
                className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[46px] cursor-pointer ${
                  tab === 'register-customer'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold ring-2 ring-blue-400/50'
                    : 'bg-white text-slate-700 hover:bg-blue-50/70 border-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <User className={`w-3.5 h-3.5 ${tab === 'register-customer' ? 'text-white' : 'text-blue-600'}`} />
                  <span className="text-xs font-black">Cliente</span>
                </div>
                <span className={`text-[10px] font-medium leading-tight ${tab === 'register-customer' ? 'text-blue-100' : 'text-slate-400'}`}>
                  Compras & ServiÃ§os
                </span>
              </button>

              {/* 2. Prestador de ServiÃ§os */}
              <button
                type="button"
                onClick={() => {
                  setTab('register-merchant');
                  setMerchantType('SERVICE_PROVIDER');
                  setMerchantCategory('PRESTADORES DE SERVIÃ‡OS');
                  setErrorMessage(null);
                }}
                className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[46px] cursor-pointer ${
                  tab === 'register-merchant' && merchantType === 'SERVICE_PROVIDER'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-bold ring-2 ring-amber-400/50'
                    : 'bg-white text-slate-700 hover:bg-amber-50/70 border-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Wrench className={`w-3.5 h-3.5 ${tab === 'register-merchant' && merchantType === 'SERVICE_PROVIDER' ? 'text-white' : 'text-amber-600'}`} />
                  <span className="text-xs font-black">Prestador</span>
                </div>
                <span className={`text-[10px] font-medium leading-tight ${tab === 'register-merchant' && merchantType === 'SERVICE_PROVIDER' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Reparos & ServiÃ§os
                </span>
              </button>

              {/* 3. Lojista */}
              <button
                type="button"
                onClick={() => {
                  setTab('register-merchant');
                  setMerchantType('STORE');
                  setMerchantCategory('COMÃ‰RCIO & LOJAS FÃSICAS');
                  setErrorMessage(null);
                }}
                className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[46px] cursor-pointer ${
                  tab === 'register-merchant' && merchantType === 'STORE'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold ring-2 ring-emerald-400/50'
                    : 'bg-white text-slate-700 hover:bg-emerald-50/70 border-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Store className={`w-3.5 h-3.5 ${tab === 'register-merchant' && merchantType === 'STORE' ? 'text-white' : 'text-emerald-600'}`} />
                  <span className="text-xs font-black">Lojista</span>
                </div>
                <span className={`text-[10px] font-medium leading-tight ${tab === 'register-merchant' && merchantType === 'STORE' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Loja FÃ­sica & BalcÃ£o
                </span>
              </button>

              {/* 4. Entregador Parceiro */}
              <button
                type="button"
                onClick={() => {
                  setTab('register-driver');
                  setErrorMessage(null);
                }}
                className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center min-h-[46px] cursor-pointer ${
                  tab === 'register-driver'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm font-bold ring-2 ring-indigo-400/50'
                    : 'bg-white text-slate-700 hover:bg-indigo-50/70 border-slate-200 font-medium'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Bike className={`w-3.5 h-3.5 ${tab === 'register-driver' ? 'text-white' : 'text-indigo-600'}`} />
                  <span className="text-xs font-black">Entregador</span>
                </div>
                <span className={`text-[10px] font-medium leading-tight ${tab === 'register-driver' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Delivery & Corridas
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Body Content com Rolagem Suave (flex-1 overflow-y-auto) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 space-y-4">
          {/* Feedback Alerts */}
          {sellerRedirectNotice && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-3 animate-in fade-in">
              <div className="flex items-start space-x-2.5">
                <Briefcase className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-sm text-indigo-900">Acesso Exclusivo pelo Portal do Vendedor</strong>
                  <p className="text-indigo-800 leading-relaxed mt-1">
                    Detectamos credencial de consultor comercial. O acesso de vendedores Ã© realizado <strong>Ãºnica e exclusivamente pelo Portal do Vendedor</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentEnvironment('COMMERCIAL_PORTAL');
                }}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Ir para o Portal do Vendedor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {errorMessage && !sellerRedirectNotice && (
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

              {/* InformaÃ§Ã£o do CÃ³digo 2FA */}
              {simulated2FACode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
                  <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">CÃ³digo de SeguranÃ§a Token (SMS/WhatsApp):</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-extrabold tracking-widest bg-white px-2 py-0.5 rounded border border-amber-300 text-slate-900">
                        {simulated2FACode}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        (Insira manualmente o cÃ³digo abaixo)
                      </span>
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
                  <span className="font-bold text-slate-800">SeguranÃ§a de Acesso:</span> Digite seu e-mail e sua senha de acesso cadastrados. Contas de alto privilÃ©gio possuem confirmaÃ§Ã£o de seguranÃ§a em duas etapas (2FA).
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
                      defaultValue={loginEmailRef.current}
                      onChange={(e) => { loginEmailRef.current = e.target.value; }}
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
                        setForgotEmail(loginEmailRef.current);
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
                      defaultValue={loginPasswordRef.current}
                      onChange={(e) => { loginPasswordRef.current = e.target.value; }}
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
                      setResendEmail(loginEmailRef.current);
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
              </div>

              {/* Cadastro Gratuito do Cliente - Sem seleÃ§Ã£o de planos nem cobranÃ§as */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cadastro 100% Gratuito (R$ 0,00)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  O cadastro de cliente comprador Ã© totalmente livre de mensalidades e sem cobranÃ§a de taxas. Tenha acesso a todas as lojas, produtos, agendamentos e delivery de Cachoeiras de Macacu.
                </p>
              </div>

              {/* Termos & LGPD */}
              <div className="pt-1 space-y-2">
                <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={customerTermsAccepted}
                    onChange={(e) => setCustomerTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 shrink-0"
                  />
                  <span>
                    Concordo com os <strong className="text-slate-800">Termos de Uso</strong> e autorizo o tratamento dos meus dados conforme as diretrizes da <strong className="text-slate-800">LGPD</strong>.
                  </span>
                </label>

                {/* Termo ObrigatÃ³rio de IntermediaÃ§Ã£o e Responsabilidade */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      id="checkbox-customer-disclaimer"
                      required
                      checked={customerDisclaimerAccepted}
                      onChange={(e) => setCustomerDisclaimerAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-amber-300 shrink-0"
                    />
                    <span className="text-slate-700 text-[11px] leading-relaxed">
                      <strong className="text-amber-950 font-bold">CondiÃ§Ã£o ObrigatÃ³ria de Cadastro:</strong> Declaro ciÃªncia de que a plataforma Achei Aqui Ã© um canal de intermediaÃ§Ã£o tecnolÃ³gica e divulgaÃ§Ã£o. As informaÃ§Ãµes sÃ£o checadas periodicamente por nÃ³s, porÃ©m o cliente deve constatar e certificar a existÃªncia da loja e do prestador antes de fechar qualquer negÃ³cio. A responsabilidade por compras, serviÃ§os e negÃ³cios realizados Ã© estritamente do cliente e do prestador/lojista.
                    </span>
                  </label>
                </div>
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
          {tab === 'register-merchant' && (
            <form onSubmit={handleRegisterMerchant} className="space-y-4">
              <div>
                <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md mb-1.5 ${
                  merchantType === 'SERVICE_PROVIDER' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {merchantType === 'SERVICE_PROVIDER' ? 'Credenciamento de Prestador de ServiÃ§os com ReferÃªncias' : 'Credenciamento de ComÃ©rcio Local & Lojista'}
                </span>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  {merchantType === 'SERVICE_PROVIDER' ? 'Cadastrar como Prestador de ServiÃ§os' : 'Cadastrar Minha Loja Comercial'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {merchantType === 'SERVICE_PROVIDER' 
                    ? 'Receba pedidos de instalaÃ§Ãµes, reparos rÃ¡pidos, consertos e serviÃ§os gerais com perfil verificado em Cachoeiras de Macacu.'
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
                    <input
                      type="text"
                      required
                      value={merchantCnpjOrCpf}
                      onChange={(e) => setMerchantCnpjOrCpf(e.target.value)}
                      placeholder="Ex: 458.129.832-10 ou CNPJ"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
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

              {/* REFERÃŠNCIAS PROFISSIONAIS OBRIGATÃ“RIAS (SOMENTE PARA PRESTADORES DE SERVIÃ‡OS) */}
              {merchantType === 'SERVICE_PROVIDER' && (
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
              )}

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

              {/* Modalidade / Plano: Lojista vs Prestador de ServiÃ§os */}
              {merchantType === 'SERVICE_PROVIDER' ? (
                <div className="p-4 bg-gradient-to-br from-blue-50/90 via-white to-slate-50 border border-blue-200 rounded-xl space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-950">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Plano Ãšnico e EspecÃ­fico: Prestador de ServiÃ§os</span>
                    </div>
                    <span className="text-[11px] font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
                      R$ 29,90/mÃªs
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Plano exclusivo desenhado para autÃ´nomos, eletricistas, encanadores, pintores e profissionais de serviÃ§os em Cachoeiras de Macacu.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span><strong>1 serviÃ§o incluso</strong> no catÃ¡logo oficial</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>ServiÃ§os adicionais: <strong>R$ 9,90/mÃªs</strong> cada</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Selo de <strong>Perfil Verificado</strong> com referÃªncias</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Atendimento direto via WhatsApp e orÃ§amento</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-amber-50/80 via-white to-slate-50 border border-amber-200 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-950">
                      <Crown className="w-4 h-4 text-amber-600" />
                      <span>Selecione o Plano Comercial da sua Loja *</span>
                    </div>
                    <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {MEMBERSHIP_PLANS[merchantTier].title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {(['BRONZE', 'PRATA', 'OURO', 'PREMIUM'] as MembershipTier[]).map((t) => {
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
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2.5 bg-amber-100/60 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                    <span className="font-bold shrink-0">ðŸ’¡ Regra do Plano:</span>
                    <span>{MEMBERSHIP_PLANS[merchantTier].buyerDataRule}</span>
                  </div>
                </div>
              )}

              {/* Termos Lojista/Prestador */}
              <div className="pt-1 space-y-2">
                <label className="flex items-start space-x-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={merchantTermsAccepted}
                    onChange={(e) => setMerchantTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 shrink-0"
                  />
                  <span>
                    Declaro a veracidade dos dados cadastrais informados (CPF/CNPJ e Documentos) e concordo com os Termos de Credenciamento Achei Aqui.
                  </span>
                </label>

                {/* Termo ObrigatÃ³rio de IntermediaÃ§Ã£o e Responsabilidade */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                  <label className="flex items-start space-x-2.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      id="checkbox-merchant-disclaimer"
                      required
                      checked={merchantDisclaimerAccepted}
                      onChange={(e) => setMerchantDisclaimerAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-amber-300 shrink-0"
                    />
                    <span className="text-slate-700 text-[11px] leading-relaxed">
                      <strong className="text-amber-950 font-bold">CondiÃ§Ã£o ObrigatÃ³ria de Cadastro:</strong> Declaro ciÃªncia de que a plataforma Achei Aqui atua exclusivamente na intermediaÃ§Ã£o e divulgaÃ§Ã£o local. As informaÃ§Ãµes sÃ£o checadas periodicamente por nÃ³s, porÃ©m o cliente deve constatar a existÃªncia da loja e do prestador antes de fechar o negÃ³cio. NÃ£o nos responsabilizamos por compras e negÃ³cios realizados por eles, sendo a responsabilidade restrita Ã s partes negociantes.
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                id="btn-register-merchant-submit"
                className={`w-full py-3.5 px-6 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 min-h-[46px] cursor-pointer ${
                  merchantType === 'SERVICE_PROVIDER'
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                <span>{merchantType === 'SERVICE_PROVIDER' ? 'FINALIZAR CADASTRO DE PRESTADOR' : 'CADASTRAR MINHA LOJA'}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB: CADASTRO COMPLETO DE ENTREGADOR PARCEIRO */}
          {tab === 'register-driver' && (
            <form onSubmit={handleRegisterDriver} className="space-y-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md mb-1 bg-indigo-100 text-indigo-800">
                  Credenciamento Oficial de Entregador Parceiro
                </span>
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Cadastrar como Entregador Parceiro
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Receba chamadas de corridas e entregas de compras do comÃ©rcio de Cachoeiras de Macacu com repasse 100% via PIX.
                </p>
              </div>

              {/* InformaÃ§Ãµes Pessoais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF (ObrigatÃ³rio para repasses) *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverCpf}
                    onChange={(e) => setDriverCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Contato & Senha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={driverEmail}
                    onChange={(e) => setDriverEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Senhas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Senha de Acesso (MÃ­nimo 6 dÃ­gitos) *
                  </label>
                  <input
                    type="password"
                    required
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    required
                    value={driverConfirmPassword}
                    onChange={(e) => setDriverConfirmPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* HabilitaÃ§Ã£o CNH */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Dados da CNH & HabilitaÃ§Ã£o:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NÃºmero de Registro da CNH *
                    </label>
                    <input
                      type="text"
                      required
                      value={driverCnhNumber}
                      onChange={(e) => setDriverCnhNumber(e.target.value)}
                      placeholder="Ex: 01234567890"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria da CNH *
                    </label>
                    <select
                      value={driverCnhCategory}
                      onChange={(e) => setDriverCnhCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    >
                      <option value="A">Categoria A (Motocicletas)</option>
                      <option value="B">Categoria B (AutomÃ³veis)</option>
                      <option value="AB">Categoria AB (Moto e Carro)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* VeÃ­culo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">VeÃ­culo Utilizado para Entregas:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['MOTO', 'CARRO', 'BICICLETA', 'VAN'] as DeliveryVehicleType[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDriverVehicleType(v)}
                      className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                        driverVehicleType === v
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-2 ring-indigo-400/40'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {v === 'MOTO' && 'ðŸï¸ Moto'}
                      {v === 'CARRO' && 'ðŸš— Carro'}
                      {v === 'BICICLETA' && 'ðŸš² Bicicleta'}
                      {v === 'VAN' && 'ðŸš UtilitÃ¡rio'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    required
                    value={driverVehicleModel}
                    onChange={(e) => setDriverVehicleModel(e.target.value)}
                    placeholder="Modelo (ex: Honda CG 160) *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={driverVehiclePlate}
                    onChange={(e) => setDriverVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Placa (ex: ABC1D23) *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none uppercase font-mono"
                  />
                  <input
                    type="text"
                    value={driverVehicleColor}
                    onChange={(e) => setDriverVehicleColor(e.target.value)}
                    placeholder="Cor (ex: Vermelha)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* EndereÃ§o & Chave PIX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bairro / EndereÃ§o em Cachoeiras de Macacu
                  </label>
                  <input
                    type="text"
                    value={driverAddress}
                    onChange={(e) => setDriverAddress(e.target.value)}
                    placeholder="Ex: Centro, Rua das Flores, 50"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chave PIX para Repasses dos Fares *
                  </label>
                  <input
                    type="text"
                    required
                    value={driverPixKey}
                    onChange={(e) => setDriverPixKey(e.target.value)}
                    placeholder="CPF, Telefone, E-mail ou AleatÃ³ria"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Termos de Parceria */}
              <div className="pt-1">
                <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    required
                    checked={driverTermsAccepted}
                    onChange={(e) => setDriverTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 shrink-0"
                  />
                  <span className="leading-relaxed">
                    Declaro que os dados fornecidos e a CNH sÃ£o verÃ­dicos e vÃ¡lidos. Estou ciente de que as entregas serÃ£o despachadas via radar geolocalizado e que a prestaÃ§Ã£o de serviÃ§os segue as regras da plataforma Achei Aqui.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isDriverSubmitting}
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[46px]"
              >
                {isDriverSubmitting ? (
                  <span>ENVIANDO CADASTRO...</span>
                ) : (
                  <>
                    <span>FINALIZAR CADASTRO DE ENTREGADOR</span>
                    <Bike className="w-4 h-4" />
                  </>
                )}
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

          {/* ========================================================================= */}
          {/* TAB: CHECKOUT OBRIGATÃ“RIO DO PLANO (LOJISTAS E PRESTADORES DE SERVIÃ‡OS) */}
          {/* ========================================================================= */}
          {tab === 'plan-checkout' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-emerald-950">AtivaÃ§Ã£o ObrigatÃ³ria do Plano</h4>
                  <p className="text-xs text-emerald-800 leading-snug">
                    Seu cadastro foi registrado com sucesso no sistema! Para liberar seu acesso ao painel de controle e ativar sua vitrine no Achei Aqui, efetue o pagamento do plano escolhido.
                  </p>
                </div>
              </div>

              {/* Detalhes do Estabelecimento */}
              {pendingCheckoutMerchant && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{pendingCheckoutMerchant.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pendingCheckoutMerchant.isServiceProvider ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pendingCheckoutMerchant.isServiceProvider ? 'Prestador de ServiÃ§os' : 'Lojista Comercial'}
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px]">
                    CNPJ/CPF: {pendingCheckoutMerchant.cnpjOrCpf} â€¢ {pendingCheckoutMerchant.neighborhood || 'Cachoeiras de Macacu'}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    ResponsÃ¡vel: {pendingCheckoutMerchant.ownerName} ({pendingCheckoutMerchant.ownerPhone})
                  </p>
                </div>
              )}

              {/* Seletor de Planos */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Selecione o Plano Desejado:
                </label>

                {pendingCheckoutMerchant?.isServiceProvider ? (
                  <div className="border-2 border-amber-500 bg-amber-50/70 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4 text-amber-700" />
                        <span className="font-black text-xs text-amber-950">Plano Prestador de ServiÃ§os Verificado</span>
                      </div>
                      <span className="font-black text-sm text-amber-900">R$ 29,90/mÃªs</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Selo oficial de verificaÃ§Ã£o com referÃªncias checadas, recebimento direto de orÃ§amentos pelo WhatsApp, busca municipal por bairro e 0% de retenÃ§Ã£o nos seus serviÃ§os prestados.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { tier: 'BRONZE' as MembershipTier, name: 'Bronze', price: 'R$ 19,90', desc: 'AtÃ© 15 itens, vitrine bÃ¡sica' },
                      { tier: 'PRATA' as MembershipTier, name: 'Prata', price: 'R$ 59,90', desc: 'AtÃ© 50 itens, delivery integrado', popular: true },
                      { tier: 'OURO' as MembershipTier, name: 'Ouro', price: 'R$ 49,90', desc: 'AtÃ© 150 itens, relatÃ³rios' },
                      { tier: 'PREMIUM' as MembershipTier, name: 'Premium', price: 'R$ 199,90', desc: 'Ilimitado, destaque topo' },
                    ].map((p) => (
                      <button
                        key={p.tier}
                        type="button"
                        onClick={() => setSelectedCheckoutPlan(p.tier)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          selectedCheckoutPlan === p.tier
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {p.popular && (
                          <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                            Popular
                          </span>
                        )}
                        <span className="font-black text-xs text-slate-900 block">{p.name}</span>
                        <span className="font-black text-sm text-emerald-700 block">{p.price}</span>
                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* FrequÃªncia de CobranÃ§a */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ciclo de Faturamento:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MENSAL' as const, label: 'Mensal', badge: 'PadrÃ£o' },
                    { id: 'TRIMESTRAL' as const, label: 'Trimestral', badge: '5% OFF' },
                    { id: 'ANUAL' as const, label: 'Anual', badge: '15% OFF' },
                  ].map((cycle) => (
                    <button
                      key={cycle.id}
                      type="button"
                      onClick={() => setCheckoutBillingCycle(cycle.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        checkoutBillingCycle === cycle.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs block">{cycle.label}</span>
                      <span className="text-[10px] text-blue-700 font-semibold">{cycle.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Forma de Pagamento:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'PIX' as const, label: 'PIX InstantÃ¢neo', icon: QrCode, badge: 'LiberaÃ§Ã£o Imediata' },
                    { id: 'CARTAO' as const, label: 'CartÃ£o de CrÃ©dito', icon: CreditCard, badge: 'AprovaÃ§Ã£o Direta' },
                    { id: 'BOLETO' as const, label: 'Boleto BancÃ¡rio', icon: FileText, badge: 'Asaas Gateway' },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setCheckoutPaymentMethod(method.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          checkoutPaymentMethod === method.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                        <span className="text-xs block leading-tight">{method.label}</span>
                        <span className="text-[9px] text-emerald-700 font-medium">{method.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QR Code Simulado para PIX */}
              {checkoutPaymentMethod === 'PIX' && (
                <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      QR Code PIX Asaas (SimulaÃ§Ã£o em Tempo Real)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      Copia e Cola Ativo
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg font-mono text-[10px] break-all text-slate-300 border border-slate-700">
                    00020126580014BR.GOV.BCB.PIX0136acheiaqui-{pendingCheckoutMerchant?.id || 'demo'}520400005303986540{getCheckoutTotal().total.toFixed(2)}5802BR5925ACHEI AQUI CACHOEIRAS6009CACHOEIRAS62070503***6304E8A2
                  </div>
                </div>
              )}

              {/* Resumo Financeiro & Registros ContÃ¡beis */}
              {(() => {
                const { total, discount, months, platformNet, sellerCommission } = getCheckoutTotal();
                return (
                  <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Subtotal ({months} {months === 1 ? 'mÃªs' : 'meses'}):</span>
                      <span className="font-semibold">R$ {(total + discount).toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between text-emerald-700 font-bold">
                        <span>Desconto Promocional:</span>
                        <span>- R$ {discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                      <span>Total a Pagar:</span>
                      <span className="text-emerald-700 text-base">R$ {total.toFixed(2)}</span>
                    </div>

                    {/* DivisÃµes ObrigatÃ³rias Transparentes */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase">
                        DiscriminaÃ§Ã£o ContÃ¡bil ObrigatÃ³ria:
                      </span>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>â€¢ Taxa Operacional Achei Aqui:</span>
                        <span className="font-bold font-mono">R$ {platformNet.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-blue-700">
                        <span>â€¢ ComissÃ£o do Vendedor Credenciado (15%):</span>
                        <span className="font-bold font-mono">R$ {sellerCommission.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* BotÃµes de AÃ§Ã£o */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleConfirmPlanPayment}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>{isProcessingPayment ? 'PROCESSANDO ATIVAÃ‡ÃƒO...' : 'CONFIRMAR PAGAMENTO E LIBERAR PAINEL'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerToast('AtenÃ§Ã£o: Seu cadastro estÃ¡ pendente de pagamento. O acesso ao painel permanecerÃ¡ bloqueado atÃ© a quitaÃ§Ã£o.');
                    onClose();
                  }}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center cursor-pointer"
                >
                  Pagar Mais Tarde (Acesso ao painel continuarÃ¡ bloqueado)
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: COMPROVANTE DE PAGAMENTO & ACESSO LIBERADO COM SUCESSO */}
          {/* ========================================================================= */}
          {tab === 'plan-success' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  Pagamento Confirmado! Acesso Liberado
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Seu estabelecimento estÃ¡ oficialmente ativado na plataforma Achei Aqui Cachoeiras de Macacu.
                  Os lanÃ§amentos financeiros e divisÃµes contÃ¡beis foram registrados com sucesso.
                </p>
              </div>

              {/* Recibo Oficial */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-700">Comprovante de AtivaÃ§Ã£o</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    STATUS: APROVADO & ATIVO
                  </span>
                </div>

                <div className="space-y-1 text-slate-600 text-[11px]">
                  <p><strong>CÃ³digo da OperaÃ§Ã£o:</strong> <span className="font-mono">{confirmedPaymentReceipt?.code || 'BLT-REC-OK'}</span></p>
                  <p><strong>Estabelecimento:</strong> {pendingCheckoutMerchant?.name}</p>
                  <p><strong>Plano Ativado:</strong> {confirmedPaymentReceipt?.planTitle || 'Plano Oficial Achei Aqui'}</p>
                  <p><strong>Valor Quitado:</strong> <span className="text-emerald-700 font-bold text-xs">R$ {(confirmedPaymentReceipt?.amount || 0).toFixed(2)}</span></p>
                  <p><strong>Forma de QuitaÃ§Ã£o:</strong> {confirmedPaymentReceipt?.paymentMethod || 'PIX InstantÃ¢neo'}</p>
                  <p><strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnterSellerPortalAfterPayment}
                className="w-full max-w-md mx-auto py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>ACESSAR MEU PAINEL AGORA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ENTREGADOR CADASTRADO â€” AGUARDANDO APROVAÃ‡ÃƒO DO MASTER */}
          {/* ========================================================================= */}
          {tab === 'driver-pending-approval' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">
                  Cadastro de Entregador Recebido!
                </h4>
                <p className="text-sm font-bold text-amber-800 mt-1">
                  Aguarde AprovaÃ§Ã£o do Administrador Master
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-950 space-y-2 max-w-md mx-auto leading-relaxed">
                <p className="font-semibold">
                  Seus dados pessoais, CNH e documentaÃ§Ã£o do veÃ­culo foram encaminhados com sucesso para a moderaÃ§Ã£o da plataforma em Cachoeiras de Macacu.
                </p>
                <div className="p-2.5 bg-white/80 rounded-lg border border-amber-300 space-y-1">
                  <span className="font-bold text-amber-900 block text-[11px] uppercase">
                    ðŸ›¡ï¸ Regra Operacional de SeguranÃ§a:
                  </span>
                  <p className="text-[11px] text-slate-700">
                    Por critÃ©rios de conformidade, antecedentes e seguranÃ§a no trÃ¢nsito, o entregador parceiro <strong>NÃƒO tem acesso imediato ao sistema</strong> apÃ³s o cadastro. O acesso sÃ³ Ã© liberado apÃ³s a anÃ¡lise documental e aprovaÃ§Ã£o do Master.
                  </p>
                </div>
                <p className="text-[11px] text-amber-900">
                  Assim que sua conta for aprovada pelo Master, vocÃª receberÃ¡ a notificaÃ§Ã£o de confirmaÃ§Ã£o e poderÃ¡ fazer login diretamente no Portal dos Entregadores.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-md mx-auto py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Entendido, Fechar Janela</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: VENDEDOR â€” PRIMEIRO ACESSO COM TROCA OBRIGATÃ“RIA DE SENHA */}
          {/* ========================================================================= */}
          {tab === 'change-temporary-password' && (
            <form onSubmit={handleSaveInitialPassword} className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-indigo-950">Primeiro Acesso â€” Troca ObrigatÃ³ria de Senha</h4>
                  <p className="text-xs text-indigo-800 leading-snug">
                    Sua conta foi criada exclusivamente pelo Administrador Master com uma senha temporÃ¡ria provisÃ³ria. Por conformidade e seguranÃ§a da equipe de vendas, defina sua nova senha definitiva.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail da Conta
                </label>
                <input
                  type="email"
                  disabled
                  value={pendingPasswordChangeEmail}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha Definitiva (MÃ­nimo 6 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newInitialPassword}
                    onChange={(e) => setNewInitialPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
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
                    minLength={6}
                    value={confirmInitialPassword}
                    onChange={(e) => setConfirmInitialPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-indigo-500 outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                âš ï¸ <strong>AtenÃ§Ã£o:</strong> Sem a alteraÃ§Ã£o da senha temporÃ¡ria, o vendedor nÃ£o terÃ¡ autorizaÃ§Ã£o para operar o painel comercial.
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>SALVAR NOVA SENHA E ENTRAR NO PAINEL</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};






