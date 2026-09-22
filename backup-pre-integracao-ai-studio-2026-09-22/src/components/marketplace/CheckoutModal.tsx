import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Package,
  Shirt,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  Send,
  Phone,
  MessageSquare,
  Lock,
  RefreshCw,
  Store,
  Check,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Radio,
  Sparkles,
  Smartphone,
  Zap,
  QrCode
} from 'lucide-react';
import { Product, ModalityType, Order, NotificationChannel } from '../../types';
import { useApp } from '../../context/AppContext';
import { NotificationService } from '../../services/notification_service';
import { PixPaymentModule } from './PixPaymentModule';
import {
  sendVerificationCodeViaGateway,
  getVerificationGatewayStatus,
  generateVerificationCode,
  normalizePhoneNumber,
  SendVerificationResult
} from '../../services/verification_gateway_service';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialModality?: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO';
  selectedVariations?: { [key: string]: string };
  onOrderSuccess: (order: Order) => void;
}

type CheckoutStep = 'FORM' | 'PHONE_VERIFY' | 'AWAITING_STOCK' | 'STOCK_CONFIRMED' | 'OUT_OF_STOCK';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  initialModality = 'DELIVERY',
  selectedVariations = {},
  onOrderSuccess
}) => {
  const { currentUser, createOrder, confirmOrderStock, rejectOrderStock, currentCity, triggerToast, openSubOrderChat, promptAuthRequirement, merchants } = useApp();

  useEffect(() => {
    if (isOpen && !currentUser) {
      onClose();
      promptAuthRequirement('COMPRA', {
        title: product?.name,
        price: product?.price,
        merchantName: product?.merchantName
      });
    }
  }, [isOpen, currentUser]);

  // Current Step
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('FORM');

  // Step 1: Customer Interest Data
  const [modality, setModality] = useState<ModalityType>(initialModality);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerCpf, setCustomerCpf] = useState(currentUser?.cnpjOrCpf || '');
  const [customerAddress, setCustomerAddress] = useState(currentUser?.address || '');
  const [deliveryMethod, setDeliveryMethod] = useState<'motoboy' | 'correios'>('motoboy');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [paymentChoice, setPaymentChoice] = useState<'PIX' | 'DIRECT'>('PIX');
  const [activeConfirmedTab, setActiveConfirmedTab] = useState<'PIX' | 'CODE'>('PIX');

  // Step 1: Trial details if modality is trial
  const [trialDate, setTrialDate] = useState('2026-08-31');
  const [trialTime, setTrialTime] = useState('15:00');
  const [trialNotes, setTrialNotes] = useState('');

  // Step 2: Verification Code & Gateway Integration
  const [generatedSmsCode, setGeneratedSmsCode] = useState('482913');
  const [enteredSmsCode, setEnteredSmsCode] = useState('');
  const [verificationChannel, setVerificationChannel] = useState<NotificationChannel>('WHATSAPP');
  const [isDispatchingCode, setIsDispatchingCode] = useState(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<SendVerificationResult | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isClientVerified, setIsClientVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const gatewayStatus = getVerificationGatewayStatus();

  // Active Order state
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Timers
  const [stockTimerSeconds, setStockTimerSeconds] = useState(15 * 60); // 15 min
  const [reservationTimerSeconds, setReservationTimerSeconds] = useState(30 * 60); // 30 min

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('FORM');
      setCustomerName(currentUser?.name || '');
      setCustomerPhone(currentUser?.phone || '');
      setCustomerEmail(currentUser?.email || '');
      setCustomerCpf(currentUser?.cnpjOrCpf || '');
      setCustomerAddress(currentUser?.address || '');
      setModality(initialModality);
      setQuantity(1);
      setTermsAccepted(true);
      setActiveOrder(null);
      setIsClientVerified(false);
      setVerifyError('');
      setVerificationChannel(gatewayStatus.defaultChannel || 'WHATSAPP');
      setLastDispatchResult(null);
      setResendCooldown(0);
      
      const randomCode = generateVerificationCode();
      setGeneratedSmsCode(randomCode);
      setEnteredSmsCode('');
      setStockTimerSeconds(15 * 60);
      setReservationTimerSeconds(30 * 60);
    }
  }, [isOpen, currentUser, initialModality]);

  // Resend cooldown timer (30 seconds)
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Stock response countdown (15 minutes)
  useEffect(() => {
    let interval: any;
    if (currentStep === 'AWAITING_STOCK' && stockTimerSeconds > 0) {
      interval = setInterval(() => {
        setStockTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, stockTimerSeconds]);

  // Reservation countdown (30 minutes)
  useEffect(() => {
    let interval: any;
    if (currentStep === 'STOCK_CONFIRMED' && reservationTimerSeconds > 0) {
      interval = setInterval(() => {
        setReservationTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, reservationTimerSeconds]);

  if (!isOpen || !product) return null;

  const deliveryFee = modality === 'DELIVERY' ? (deliveryMethod === 'motoboy' ? 7.00 : 18.50) : 0;
  const itemsTotal = product.price * quantity;
  const grandTotal = itemsTotal + deliveryFee;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // STEP 1 SUBMIT -> DISPATCH VIA GATEWAY & GO TO PHONE VERIFICATION
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      triggerToast('Por favor, informe seu nome completo.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 8) {
      triggerToast('Por favor, informe um número de telefone/WhatsApp válido.');
      return;
    }
    if (!customerEmail.trim()) {
      triggerToast('Por favor, informe seu e-mail para contato.');
      return;
    }
    if (modality === 'DELIVERY' && !customerAddress.trim()) {
      triggerToast('Por favor, informe o endereço de entrega em Cachoeiras de Macacu.');
      return;
    }
    if (!termsAccepted) {
      triggerToast('Por favor, aceite os termos de consulta e reserva local.');
      return;
    }

    // Generate new code and dispatch via Gateway
    const newCode = generateVerificationCode();
    setGeneratedSmsCode(newCode);
    setEnteredSmsCode('');
    setVerifyError('');
    setCurrentStep('PHONE_VERIFY');
    setIsDispatchingCode(true);

    try {
      const result = await sendVerificationCodeViaGateway({
        phone: customerPhone,
        code: newCode,
        customerName,
        channel: verificationChannel,
        productName: product.name
      });
      setLastDispatchResult(result);
      setResendCooldown(30);
      triggerToast(`Código de verificação enviado via ${verificationChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}!`);
    } catch (err: any) {
      console.error('Erro ao enviar via gateway:', err);
    } finally {
      setIsDispatchingCode(false);
    }
  };

  // RE-DISPATCH VERIFICATION CODE
  const handleResendCode = async (channelOverride?: NotificationChannel) => {
    if (resendCooldown > 0 && !channelOverride) return;
    const targetChannel = channelOverride || verificationChannel;
    setIsDispatchingCode(true);
    setVerifyError('');

    try {
      const result = await sendVerificationCodeViaGateway({
        phone: customerPhone,
        code: generatedSmsCode,
        customerName,
        channel: targetChannel,
        productName: product.name
      });
      setLastDispatchResult(result);
      setVerificationChannel(targetChannel);
      setResendCooldown(30);
      triggerToast(`Código reenviado com sucesso via ${targetChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}!`);
    } catch (err: any) {
      triggerToast(`Erro ao reenviar código: ${err.message}`);
    } finally {
      setIsDispatchingCode(false);
    }
  };

  // STEP 2 SUBMIT -> VALIDATE PHONE CODE & CREATE ORDER IN 'AWAITING_STOCK'
  const handleConfirmPhoneVerification = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (enteredSmsCode.trim() !== generatedSmsCode) {
      setVerifyError('Código de segurança incorreto. Verifique o código de 6 dígitos recebido.');
      return;
    }

    setIsClientVerified(true);
    setVerifyError('');

    // Generate Order
    const randomOrderNum = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let secCode = '';
    for (let i = 0; i < 6; i++) {
      secCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const targetMerchant = merchants.find(
      (m) => m.id === product.merchantId || m.name?.toLowerCase() === product.merchantName?.toLowerCase()
    );
    const asaasWalletId = targetMerchant?.asaasWalletId || `wallet_${product.merchantId || 'lojista_default'}`;
    const comissaoPlataforma = +(grandTotal * 0.10).toFixed(2);
    const repasseLojista = +(grandTotal - comissaoPlataforma).toFixed(2);

    const created = createOrder({
      userId: currentUser?.id || `guest-${Date.now()}`,
      orderNumber: randomOrderNum,
      securityCode: secCode,
      clientVerified: true,
      verificationPhoneCode: generatedSmsCode,
      verificationChannel,
      customerName,
      customerPhone,
      customerEmail,
      customerCpf,
      termsAccepted: true,
      stockConfirmationStatus: 'PENDING_STORE_CONFIRMATION',
      stockConfirmationExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      reservationExpiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      customerAddress: modality === 'DELIVERY' ? customerAddress : `Retirada / Balcão em ${product.merchantName}`,
      merchantId: product.merchantId,
      merchantName: product.merchantName,
      asaasWalletId,
      asaasSplitDetails: [
        {
          walletId: 'wallet_master_acheiaqui_mei',
          fixedValue: comissaoPlataforma,
          description: 'Comissão Plataforma Achei Aqui (10% MEI)'
        },
        {
          walletId: asaasWalletId,
          fixedValue: repasseLojista,
          description: `Repasse Líquido Lojista (90%) - ${product.merchantName}`
        }
      ],
      type: 'PRODUTO',
      items: [
        {
          productId: product.id,
          productName: product.name,
          productImage: product.images[0],
          quantity,
          price: product.price,
          selectedVariation: selectedVariations
        }
      ],
      modality,
      status: 'Aguardando',
      paymentMethod: paymentChoice === 'PIX' ? 'PIX' : 'A_COMBINAR',
      paymentStatus: 'PENDENTE',
      totalAmount: grandTotal,
      deliveryFee,
      trialDetails:
        modality === 'EXPERIMENTAÇÃO'
          ? {
              date: trialDate,
              time: trialTime,
              notes: trialNotes
            }
          : undefined
    });

    setActiveOrder(created);
    onOrderSuccess(created);
    setCurrentStep('AWAITING_STOCK');
    triggerToast(`Cliente Verificado ✓! Solicitação ${created.orderNumber || created.code} enviada à loja.`);
  };

  // QUICK SIMULATOR: LOJA CONFIRMA ESTOQUE IMEDIATAMENTE
  const handleSimulateStoreConfirmStock = () => {
    if (!activeOrder) return;
    confirmOrderStock(activeOrder.id);
    setActiveOrder((prev) => (prev ? { ...prev, status: 'Confirmado', stockConfirmationStatus: 'STOCK_CONFIRMED' } : null));
    setActiveConfirmedTab(paymentChoice === 'PIX' ? 'PIX' : 'CODE');
    setCurrentStep('STOCK_CONFIRMED');
    triggerToast('A loja confirmou o estoque do produto! Reserva de 30 minutos ativada.');
  };

  // QUICK SIMULATOR: LOJA INFORMA SEM ESTOQUE
  const handleSimulateStoreRejectStock = () => {
    if (!activeOrder) return;
    rejectOrderStock(activeOrder.id, 'Produto esgotado no estoque físico.');
    setActiveOrder((prev) => (prev ? { ...prev, status: 'Sem Estoque', stockConfirmationStatus: 'OUT_OF_STOCK' } : null));
    setCurrentStep('OUT_OF_STOCK');
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      triggerToast(`${label} copiado!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {currentStep === 'FORM' && 'Confirme seu Interesse & Reserva'}
                {currentStep === 'PHONE_VERIFY' && 'Validação de Telefone / SMS'}
                {currentStep === 'AWAITING_STOCK' && 'Aguardando Confirmação da Loja'}
                {currentStep === 'STOCK_CONFIRMED' && 'Produto Confirmado & Código de Negociação'}
                {currentStep === 'OUT_OF_STOCK' && 'Produto Indisponível na Loja'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {product.merchantName} • Consulta e Reserva Local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-slate-800/90 px-4 py-2 flex items-center justify-between text-[11px] font-bold text-slate-300 border-b border-slate-700">
          <div className={`flex items-center space-x-1 ${currentStep === 'FORM' ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">1</span>
            <span>Interesse</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center space-x-1 ${currentStep === 'PHONE_VERIFY' ? 'text-emerald-400' : isClientVerified ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">2</span>
            <span>Validação</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center space-x-1 ${currentStep === 'AWAITING_STOCK' ? 'text-amber-400' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">3</span>
            <span>Estoque</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center space-x-1 ${currentStep === 'STOCK_CONFIRMED' ? 'text-emerald-400 font-black' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">4</span>
            <span>Negociação</span>
          </div>
        </div>

        {/* CONSULTATION BANNER EXPLAINER */}
        <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <p className="text-[11px] leading-tight">
              <strong>Sem cobrança de cartão no app:</strong> Você reserva o item com validação e negocia o pagamento (PIX, Cartão ou Dinheiro) diretamente com a loja.
            </p>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-slate-800 space-y-4">
          {/* ======================================================== */}
          {/* STEP 1: CLIENT INTEREST FORM */}
          {/* ======================================================== */}
          {currentStep === 'FORM' && (
            <form onSubmit={handleProceedToVerification} className="space-y-4">
              {/* Product Preview Box */}
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover bg-white"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-emerald-700 font-black">
                    R$ {(product.price ?? 0).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Loja anunciante: <strong>{product.merchantName}</strong>
                  </p>
                  {Object.keys(selectedVariations).length > 0 && (
                    <p className="text-[10px] text-slate-500 truncate">
                      {Object.entries(selectedVariations)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="flex items-center space-x-1 border border-slate-200 rounded-lg bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 text-slate-600 font-bold hover:bg-slate-100 rounded"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold px-1.5">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 text-slate-600 font-bold hover:bg-slate-100 rounded"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Modality Choice Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Forma de Recebimento / Atendimento:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Delivery Option */}
                  {product.availableModalities.includes('DELIVERY') && (
                    <button
                      type="button"
                      onClick={() => setModality('DELIVERY')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        modality === 'DELIVERY'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-emerald-600 mb-1" />
                      <p className="text-xs font-bold text-slate-900">Entrega</p>
                      <p className="text-[10px] text-slate-500">Motoboy local</p>
                    </button>
                  )}

                  {/* Pickup Option */}
                  {product.availableModalities.includes('RETIRADA') && (
                    <button
                      type="button"
                      onClick={() => setModality('RETIRADA')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        modality === 'RETIRADA'
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Package className="w-4 h-4 text-blue-600 mb-1" />
                      <p className="text-xs font-bold text-slate-900">Retirada</p>
                      <p className="text-[10px] text-slate-500">Balcão da loja</p>
                    </button>
                  )}

                  {/* Trial Option */}
                  {product.availableModalities.includes('EXPERIMENTAÇÃO') && (
                    <button
                      type="button"
                      onClick={() => setModality('EXPERIMENTAÇÃO')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        modality === 'EXPERIMENTAÇÃO'
                          ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-100'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Shirt className="w-4 h-4 text-purple-600 mb-1" />
                      <p className="text-xs font-bold text-slate-900">Provador</p>
                      <p className="text-[10px] text-slate-500">Testar na loja</p>
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery specific fields */}
              {modality === 'DELIVERY' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Tipo de Envio:</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('motoboy')}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] ${
                          deliveryMethod === 'motoboy'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border text-slate-600'
                        }`}
                      >
                        Motoboy Local (+R$ 7,00)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('correios')}
                        className={`px-2.5 py-1 rounded-md font-bold text-[11px] ${
                          deliveryMethod === 'correios'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border text-slate-600'
                        }`}
                      >
                        Correios (+R$ 18,50)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Endereço de Entrega (Rua, Número e Bairro em Cachoeiras) *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Ex: Av. Floriano Peixoto, 150 - Centro, Cachoeiras de Macacu"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-600 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Retirada Info */}
              {modality === 'RETIRADA' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-blue-700" />
                    <span>Retirada Direta no Estabelecimento</span>
                  </p>
                  <p className="text-[11px] text-blue-800">
                    Endereço: <strong>{product.merchantAddress}</strong>
                  </p>
                </div>
              )}

              {/* Client Contact Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase">Seus Dados de Contato & Verificação:</span>
                  <span className="text-[10px] text-slate-400">Protegidos até a confirmação</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp (Para Código SMS) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(21) 98765-4321"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>
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
                      placeholder="seuemail@exemplo.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CPF (Opcional para Recibo/Garantia)
                    </label>
                    <input
                      type="text"
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-emerald-600 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento / Liquidação Desejada */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase">
                    Forma de Pagamento & Liquidação:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Garantia Achei Aqui
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('PIX')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      paymentChoice === 'PIX'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-black text-xs text-slate-900">Pix (Split Asaas)</span>
                      </div>
                      <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                        Split Ativo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">
                      QR Code e Copia e Cola com separação automática no Asaas: 10% plataforma MEI e 90% lojista.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('DIRECT')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      paymentChoice === 'DIRECT'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-black text-xs text-slate-900">Direto com a Loja</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">
                      Pagar na retirada ou entrega (dinheiro ou maquininha física de cartão).
                    </p>
                  </button>
                </div>
              </div>

              {/* Terms Acceptance Checkbox */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-start space-x-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 text-[11px] leading-relaxed">
                    Declaro interesse no produto e concordo que a plataforma atua como <strong>guia de consulta e reserva local</strong>. O pagamento será combinado e efetuado diretamente com o lojista após a confirmação de estoque.
                  </span>
                </label>
              </div>

              {/* Order Total Summary */}
              <div className="p-3.5 bg-slate-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({quantity}x item):</span>
                  <span>R$ {(itemsTotal ?? 0).toFixed(2).replace('.', ',')}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {(deliveryFee ?? 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Valor Estimado do Pedido:</span>
                  <span className="text-emerald-700 font-black">
                    R$ {(grandTotal ?? 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Avançar para Verificação por SMS/WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: PHONE VERIFICATION (GATEWAY SMS / WHATSAPP) */}
          {/* ======================================================== */}
          {currentStep === 'PHONE_VERIFY' && (
            <div className="space-y-4 py-1">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  Verificação de Número por Gateway
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Validamos o seu número através de gateway de segurança para confirmar sua autenticidade antes do envio da reserva à loja.
                </p>
              </div>

              {/* Gateway Connection & Provider Status Pill */}
              <div className="p-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs shadow-xs">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${gatewayStatus.isRealGatewayActive ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${gatewayStatus.isRealGatewayActive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  </span>
                  <span className="font-sans text-[11px] text-slate-300">
                    {gatewayStatus.activeProvider}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-slate-200">
                  {gatewayStatus.isRealGatewayActive ? 'ONLINE' : 'SANDBOX / DEV'}
                </span>
              </div>

              {/* Channel Selector (WhatsApp vs SMS) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Canal de Envio do Código:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationChannel('WHATSAPP');
                      handleResendCode('WHATSAPP');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      verificationChannel === 'WHATSAPP'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationChannel('SMS');
                      handleResendCode('SMS');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      verificationChannel === 'SMS'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-200 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>SMS Tradicional</span>
                  </button>
                </div>
              </div>

              {/* Dispatch Info & Code Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Destinatário:</span>
                  <span className="font-sans font-bold text-slate-900">
                    {normalizePhoneNumber(customerPhone).display || customerPhone}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-600">Status de Envio:</span>
                  {isDispatchingCode ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Disparando via Gateway...
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Enviado com Sucesso
                    </span>
                  )}
                </div>

                {/* Test helper for sandbox/demonstration preview */}
                <div className="pt-2 flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    Código de Teste: <strong className="font-sans text-slate-800">{generatedSmsCode}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredSmsCode(generatedSmsCode)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-xs transition-all cursor-pointer"
                  >
                    Preencher Código
                  </button>
                </div>

                {/* WhatsApp Web direct link if available */}
                {lastDispatchResult?.deepLink && (
                  <div className="pt-1 text-right">
                    <a
                      href={lastDispatchResult.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 underline"
                    >
                      <span>Abrir mensagem no WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Verification Code Form */}
              <form onSubmit={handleConfirmPhoneVerification} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 text-center uppercase tracking-wider mb-1.5">
                    Digite o código de 6 dígitos:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    value={enteredSmsCode}
                    onChange={(e) => setEnteredSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="482913"
                    className="w-full max-w-xs mx-auto block px-4 py-2.5 text-center font-sans text-2xl sm:text-3xl font-black tracking-widest bg-white border-2 border-slate-300 rounded-xl outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all"
                  />
                  {verifyError && (
                    <p className="text-xs text-red-600 font-bold text-center mt-2 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{verifyError}</span>
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isDispatchingCode}
                    onClick={() => handleResendCode()}
                    className={`font-bold flex items-center gap-1 ${
                      resendCooldown > 0 || isDispatchingCode
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-emerald-700 hover:text-emerald-800 underline cursor-pointer'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isDispatchingCode ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Reenviar código em ${resendCooldown}s`
                        : 'Não recebeu? Reenviar Código'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('FORM')}
                    className="text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Alterar número
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('FORM')}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Validar Código & Enviar Pedido</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: AWAITING STORE STOCK CONFIRMATION */}
          {/* ======================================================== */}
          {currentStep === 'AWAITING_STOCK' && activeOrder && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CLIENTE VERIFICADO ✓</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  🔔 Solicitação de Compra {activeOrder.orderNumber || activeOrder.code}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A loja <strong>{product.merchantName}</strong> recebeu o seu pedido e está verificando o estoque físico.
                </p>
              </div>

              {/* 15-Minute Countdown Box */}
              <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl text-center space-y-2">
                <p className="text-xs text-amber-900 font-bold uppercase tracking-wider">
                  Tempo limite para a loja confirmar disponibilidade:
                </p>
                <div className="font-sans text-3xl font-black text-amber-950">
                  {formatTimer(stockTimerSeconds)}
                </div>
                <p className="text-[11px] text-amber-800">
                  A loja possui 15 minutos para confirmar o produto. Se confirmado, ele ficará <strong>reservado para você por 30 minutos</strong>.
                </p>
              </div>

              {/* Order Quick Specs */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Produto Solicitado:</span>
                  <span className="font-bold text-slate-900">{product.name} (x{quantity})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Valor Anunciado:</span>
                  <span className="font-black text-slate-900">
                    R$ {(grandTotal ?? 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Modalidade:</span>
                  <span className="font-bold uppercase text-slate-900">{modality}</span>
                </div>
              </div>

              {/* STORE ACTION SIMULATION (FOR QUICK TESTING IN PREVIEW) */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <p className="text-[11px] text-slate-400 font-bold uppercase">
                  Painel de Demonstração (Resposta da Loja Parceira):
                </p>
                <p className="text-xs text-slate-300">
                  No sistema real, o lojista clica no painel dele. Para testar o fluxo agora:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateStoreConfirmStock}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>🟢 CONFIRMAR ESTOQUE</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateStoreRejectStock}
                    className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>🔴 SEM ESTOQUE</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: STOCK CONFIRMED & SECURITY NEGOTIATION CODE */}
          {/* ======================================================== */}
          {currentStep === 'STOCK_CONFIRMED' && activeOrder && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Produto Confirmado pelo Vendedor!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A loja <strong>{product.merchantName}</strong> confirmou a disponibilidade e está pronta para concluir a negociação.
                </p>
              </div>

              {/* 30-Minute Reservation Timer Box */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Reserva Ativa Garantida:</span>
                </div>
                <span className="font-sans text-sm font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  ⏱️ {formatTimer(reservationTimerSeconds)}
                </span>
              </div>

              {/* SELETOR DE MÉTODO DE LIQUIDAÇÃO / PAGAMENTO */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setActiveConfirmedTab('PIX')}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    activeConfirmedTab === 'PIX'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Pagar via Pix</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      activeConfirmedTab === 'PIX'
                        ? 'bg-white/25 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Instantâneo
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveConfirmedTab('CODE')}
                  className={`py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    activeConfirmedTab === 'CODE'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Código Presencial</span>
                </button>
              </div>

              {/* CONTEÚDO DA ABA SELECIONADA */}
              {activeConfirmedTab === 'PIX' ? (
                <PixPaymentModule
                  order={activeOrder}
                  onPaymentSuccess={(updatedOrder) => {
                    setActiveOrder(updatedOrder);
                  }}
                />
              ) : (
                /* SECURITY NEGOTIATION CODE BOX */
                <div className="p-5 bg-linear-to-br from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/30 text-blue-200 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-300" />
                    <span>Código de Segurança & Negociação</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-blue-200 font-medium">
                      PEDIDO <strong>{activeOrder.orderNumber || activeOrder.code}</strong>
                    </p>
                    <div className="flex items-center justify-center space-x-2 my-2">
                      <span className="font-sans text-3xl sm:text-4xl font-black text-white bg-blue-800/80 px-5 py-2 rounded-2xl shadow-inner border border-blue-400/40 tracking-widest">
                        {activeOrder.securityCode || 'K7P4X9'}
                      </span>
                      <button
                        onClick={() => handleCopyText(activeOrder.securityCode || 'K7P4X9', 'Código de Segurança')}
                        className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all"
                        title="Copiar Código"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-blue-200 max-w-sm mx-auto leading-relaxed">
                    Esse código aparece tanto para você quanto para a loja. <strong>Quando a entrega ou retirada for realizada:</strong> você informa o código → a loja confirma no painel → o pedido é concluído.
                  </p>
                </div>
              )}

              {/* ORDER DETAILS SUMMARY */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Loja:</span>
                  <span className="font-bold text-slate-900">{product.merchantName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Produto:</span>
                  <span className="font-bold text-slate-900">{product.name} (x{quantity})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Valor:</span>
                  <span className="font-black text-slate-900">
                    R$ {(grandTotal ?? 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Disponibilidade:</span>
                  <span className="font-bold text-emerald-600">Confirmada ✓</span>
                </div>
              </div>

              {/* DIRECT INTERNAL MESSAGE BUTTON */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const subId = (activeOrder as any).subpedidos?.[0]?.id || `sub-${activeOrder.id}`;
                    const subCode = (activeOrder as any).subpedidos?.[0]?.codigoSubpedido || `#${activeOrder.code || activeOrder.orderNumber || 'PED'}-A`;
                    openSubOrderChat({
                      subpedidoId: subId,
                      pedidoPrincipalId: activeOrder.id,
                      codigoSubpedido: subCode,
                      merchantId: product.merchantId,
                      merchantName: product.merchantName,
                      customerId: currentUser?.id,
                      customerName: currentUser?.name || customerName,
                      customerPhone: customerPhone,
                      orderTitle: product.name,
                      orderStatus: activeOrder.status || 'Confirmado',
                      securityCode: activeOrder.securityCode || activeOrder.pickupCode,
                      orderTotal: grandTotal
                    });
                    onClose();
                  }}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2 active:scale-98"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Mensagem Interna com a Loja</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Concluir e Continuar Navegando
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: OUT OF STOCK NOTIFICATION */}
          {/* ======================================================== */}
          {currentStep === 'OUT_OF_STOCK' && activeOrder && (
            <div className="space-y-5 py-4 text-center">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900">
                  Produto Sem Estoque no Momento
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  A loja <strong>{product.merchantName}</strong> informou que o produto <strong>{product.name}</strong> está esgotado temporariamente.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                Nenhum valor foi cobrado e sua solicitação foi encerrada. Você pode procurar produtos semelhantes de outros comerciantes de Cachoeiras de Macacu.
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all"
              >
                Voltar ao Marketplace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

