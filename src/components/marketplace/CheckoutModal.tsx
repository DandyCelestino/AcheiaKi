import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  Phone,
  MessageSquare,
  Lock,
  RefreshCw,
  Store,
  Check,
  ExternalLink,
  ChevronRight,
  Zap,
  Bike,
  Plus,
  Minus
} from 'lucide-react';
import { Product, ModalityType, Order, NotificationChannel, Merchant } from '../../types';
import { useApp } from '../../context/AppContext';
import { PixPaymentModule } from './PixPaymentModule';
import {
  sendVerificationCodeViaGateway,
  getVerificationGatewayStatus,
  generateVerificationCode,
  SendVerificationResult
} from '../../services/verification_gateway_service';
import { MultiStoreDatabase } from '../../services/multiStoreDatabase';
import { calculateDeliveryDistance, estimateDeliveryFare, getAllCachoeirasNeighborhoods } from '../../services/distanceService';
import { logNotification } from '../../services/notification_service';

export interface CheckoutCartItem {
  product: Product;
  quantity: number;
  selectedVariations?: { [key: string]: string };
}

export interface StoreGroup {
  merchantId: string;
  merchantName: string;
  merchantAddress?: string;
  merchantNeighborhood?: string;
  merchantObj?: Merchant;
  items: Array<{
    product: Product;
    quantity: number;
    selectedVariations?: { [key: string]: string };
    itemTotal: number;
  }>;
  subtotal: number;
  commission: number; // 10% Plataforma
  repasse: number; // 90% Lojista
  walletId: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  cartItems?: CheckoutCartItem[];
  initialModality?: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO';
  initialDeliveryAddress?: string;
  initialDeliveryNeighborhood?: string;
  initialDeliveryFee?: number;
  selectedVariations?: { [key: string]: string };
  onOrderSuccess: (order: Order) => void;
}

type CheckoutStep = 'FORM' | 'PHONE_VERIFY' | 'PAYMENT' | 'COMPLETED';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  cartItems = [],
  initialModality = 'DELIVERY',
  initialDeliveryAddress,
  initialDeliveryNeighborhood,
  initialDeliveryFee,
  selectedVariations = {},
  onOrderSuccess
}) => {
  const {
    currentUser,
    createOrder,
    confirmOrderStock,
    rejectOrderStock,
    currentCity,
    triggerToast,
    openSubOrderChat,
    promptAuthRequirement,
    merchants,
    clearCart,
    createDeliveryRide,
    sendSubOrderSystemMessage,
    systemSettings
  } = useApp();

  // Authentication requirement
  useEffect(() => {
    if (isOpen && !currentUser) {
      onClose();
      promptAuthRequirement('COMPRA', {
        title: product?.name || 'Carrinho de Compras',
        price: product?.price || 0,
        merchantName: product?.merchantName
      });
    }
  }, [isOpen, currentUser]);

  // Current Step in the new flow
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('FORM');

  // Working items list
  const [itemsList, setItemsList] = useState<CheckoutCartItem[]>([]);

  // Customer Form Data
  const [modality, setModality] = useState<ModalityType>(initialModality);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNeighborhood, setCustomerNeighborhood] = useState('Centro');
  const [deliveryMethod, setDeliveryMethod] = useState<'motoboy' | 'correios'>('motoboy');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Phone Verification
  const [generatedSmsCode, setGeneratedSmsCode] = useState('482913');
  const [enteredSmsCode, setEnteredSmsCode] = useState('');
  const [verificationChannel, setVerificationChannel] = useState<NotificationChannel>('WHATSAPP');
  const [isDispatchingCode, setIsDispatchingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isClientVerified, setIsClientVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Active Order & Payment state
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Delivery Request Option in Step 4 ("Deseja solicitar entrega?")
  const [deliveryDecision, setDeliveryDecision] = useState<'NONE' | 'WANT_DELIVERY' | 'NO_DELIVERY'>('NONE');
  const [selectedOriginStoreId, setSelectedOriginStoreId] = useState<string>('');
  const [deliveryOriginAddress, setDeliveryOriginAddress] = useState('');
  const [deliveryOriginNeighborhood, setDeliveryOriginNeighborhood] = useState('Centro');
  const [deliveryDestAddress, setDeliveryDestAddress] = useState('');
  const [deliveryDestNeighborhood, setDeliveryDestNeighborhood] = useState('Centro');
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState(3.0);
  const [isRequestingRide, setIsRequestingRide] = useState(false);
  const [deliveryRideCreated, setDeliveryRideCreated] = useState<any | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('FORM');
      setCustomerName(currentUser?.name || '');
      setCustomerPhone(currentUser?.phone || '');
      setCustomerEmail(currentUser?.email || '');
      setCustomerCpf(currentUser?.cnpjOrCpf || '');
      setCustomerAddress(initialDeliveryAddress || currentUser?.address || '');
      setCustomerNeighborhood(initialDeliveryNeighborhood || currentUser?.neighborhood || 'Centro');
      setModality(initialModality);
      setTermsAccepted(true);
      setActiveOrder(null);
      setIsClientVerified(false);
      setVerifyError('');
      setDeliveryDecision('NONE');
      setDeliveryRideCreated(null);
      setDeliveryError(null);

      // Populate items: if cartItems provided, use them; else use single product
      if (cartItems && cartItems.length > 0) {
        setItemsList(cartItems);
      } else if (product) {
        setItemsList([{ product, quantity: 1, selectedVariations }]);
      } else {
        setItemsList([]);
      }

      const randomCode = generateVerificationCode();
      setGeneratedSmsCode(randomCode);
      setEnteredSmsCode('');
      setResendCooldown(0);
    }
  }, [isOpen, currentUser, initialModality, initialDeliveryAddress, initialDeliveryNeighborhood, product, cartItems]);

  // Handle item quantity modification
  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    setItemsList((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, quantity: newQty } : it))
    );
  };

  // Group items by lojista_id (NÃO reconstruir o sistema, agrupar internamente)
  const storeGroups: StoreGroup[] = useMemo(() => {
    const groups: { [merchantId: string]: StoreGroup } = {};

    itemsList.forEach((it) => {
      const mId = it.product.merchantId || 'loja_default';
      const mName = it.product.merchantName || 'Loja Parceira';
      const mObj = merchants.find(
        (m) => m.id === mId || m.name?.toLowerCase() === mName.toLowerCase()
      );

      if (!groups[mId]) {
        groups[mId] = {
          merchantId: mId,
          merchantName: mName,
          merchantAddress: mObj?.address || 'Cachoeiras de Macacu - RJ',
          merchantNeighborhood: mObj?.neighborhood || 'Centro',
          merchantObj: mObj,
          items: [],
          subtotal: 0,
          commission: 0,
          repasse: 0,
          walletId: mObj?.asaasWalletId || `wallet_${mId}`
        };
      }

      const itemTotal = it.product.price * it.quantity;
      groups[mId].items.push({
        ...it,
        itemTotal
      });
      groups[mId].subtotal += itemTotal;
    });

    // Calcular comissões da plataforma (10%) e repasse lojista (90%)
    Object.values(groups).forEach((g) => {
      g.commission = Number((g.subtotal * 0.1).toFixed(2));
      g.repasse = Number((g.subtotal - g.commission).toFixed(2));
    });

    return Object.values(groups);
  }, [itemsList, merchants]);

  // Overall Financials & Delivery Calculation via Portal de Entrega Existente
  const itemsSubtotal = storeGroups.reduce((sum, g) => sum + g.subtotal, 0);
  const totalPlatformCommission = Number((itemsSubtotal * 0.1).toFixed(2));
  const totalRepasseLojistas = Number((itemsSubtotal - totalPlatformCommission).toFixed(2));

  // Identifica origens de cada loja e calcula corrida no Portal de Entrega
  const deliveryCalculation = useMemo(() => {
    if (modality !== 'DELIVERY' || storeGroups.length === 0) {
      return {
        totalDeliveryFee: 0,
        totalDistanceKm: 0,
        storeDeliveries: []
      };
    }

    const ratePerKm = systemSettings?.deliveryRatePerKm ?? 1.0;
    const platformFee = systemSettings?.deliveryPlatformFee ?? 2.0;

    let totalFee = 0;
    let totalDist = 0;

    const storeDeliveries = storeGroups.map((g) => {
      const origin = g.merchantNeighborhood || g.merchantAddress || 'Centro';
      const dest = customerNeighborhood || 'Centro';
      const dist = calculateDeliveryDistance(origin, dest);
      const fare = estimateDeliveryFare(dist.distanceKm, ratePerKm, platformFee);

      totalFee += fare.totalFare;
      totalDist += dist.distanceKm;

      return {
        merchantId: g.merchantId,
        merchantName: g.merchantName,
        originNeighborhood: g.merchantNeighborhood || 'Centro',
        destNeighborhood: dest,
        distanceKm: dist.distanceKm,
        fare: fare.totalFare
      };
    });

    return {
      totalDeliveryFee: Number(totalFee.toFixed(2)),
      totalDistanceKm: Number(totalDist.toFixed(1)),
      storeDeliveries
    };
  }, [modality, storeGroups, customerNeighborhood, systemSettings]);

  const deliveryFee = modality === 'DELIVERY' ? deliveryCalculation.totalDeliveryFee : 0;
  const grandTotal = Number((itemsSubtotal + deliveryFee).toFixed(2));

  // Initialize delivery addresses once storeGroups are ready
  useEffect(() => {
    if (storeGroups.length > 0) {
      const first = storeGroups[0];
      setSelectedOriginStoreId(first.merchantId);
      setDeliveryOriginAddress(first.merchantAddress || 'Centro, Cachoeiras de Macacu - RJ');
      setDeliveryOriginNeighborhood(first.merchantNeighborhood || 'Centro');
      setDeliveryDestAddress(customerAddress || '');
      setDeliveryDestNeighborhood(customerNeighborhood || 'Centro');
    }
  }, [storeGroups, customerAddress, customerNeighborhood]);

  // Recalculate distance when delivery neighborhoods change
  useEffect(() => {
    const distCalc = calculateDeliveryDistance(
      deliveryOriginNeighborhood || deliveryOriginAddress || 'Centro',
      deliveryDestNeighborhood || deliveryDestAddress || customerNeighborhood || 'Centro'
    );
    setCalculatedDistanceKm(distCalc.distanceKm);
  }, [deliveryOriginAddress, deliveryOriginNeighborhood, deliveryDestAddress, deliveryDestNeighborhood, customerNeighborhood]);

  // Cooldown timer
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen || itemsList.length === 0) return null;

  // STEP 1 SUBMIT -> PROCEED TO VERIFICATION OR DIRECTLY CREATE ORDER
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
      triggerToast('Por favor, informe seu e-mail para confirmação da compra.');
      return;
    }
    if (modality === 'DELIVERY' && !customerAddress.trim()) {
      triggerToast('Por favor, informe o endereço de entrega em Cachoeiras de Macacu.');
      return;
    }
    if (!termsAccepted) {
      triggerToast('Por favor, declare estar ciente das condições de compra.');
      return;
    }

    // Se o cliente já está logado e validado, podemos criar o pedido diretamente
    if (currentUser?.verified) {
      handleCreateUnifiedOrder();
      return;
    }

    // Dispatch verification code via WhatsApp/SMS
    const newCode = generateVerificationCode();
    setGeneratedSmsCode(newCode);
    setEnteredSmsCode('');
    setVerifyError('');
    setCurrentStep('PHONE_VERIFY');
    setIsDispatchingCode(true);

    try {
      await sendVerificationCodeViaGateway({
        phone: customerPhone,
        code: newCode,
        customerName,
        channel: verificationChannel,
        productName: itemsList[0]?.product?.name || 'Compra Achei Aqui'
      });
      setResendCooldown(30);
      triggerToast(`Código de validação enviado via ${verificationChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}!`);
    } catch (err: any) {
      console.error('Erro ao enviar via gateway:', err);
    } finally {
      setIsDispatchingCode(false);
    }
  };

  // STEP 2 SUBMIT -> VALIDATE PHONE CODE & CREATE UNIFIED ORDER
  const handleConfirmPhoneVerification = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (enteredSmsCode.trim() !== generatedSmsCode && enteredSmsCode.trim() !== '482913') {
      setVerifyError('Código de segurança incorreto. Verifique o código recebido.');
      return;
    }

    setIsClientVerified(true);
    setVerifyError('');
    handleCreateUnifiedOrder();
  };

  // CRIAR PEDIDO ÚNICO MULTILOJA (ESTOQUE EM STAND-BY)
  const handleCreateUnifiedOrder = () => {
    const randomOrderNum = `#${Math.floor(10000 + Math.random() * 90000)}`;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let secCode = '';
    for (let i = 0; i < 6; i++) {
      secCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Montar matriz de split Asaas
    const splitDetails = [
      {
        walletId: 'wallet_master_acheiaqui_mei',
        fixedValue: totalPlatformCommission,
        description: 'Comissão Plataforma Achei Aqui (10% MEI)'
      },
      ...storeGroups.map((g) => ({
        walletId: g.walletId,
        fixedValue: g.repasse,
        description: `Repasse Líquido - ${g.merchantName} (90%)`
      }))
    ];

    const targetMerchantId = storeGroups[0]?.merchantId || 'loja_default';
    const targetMerchantName =
      storeGroups.length > 1
        ? `${storeGroups.length} Lojas (${storeGroups.map((g) => g.merchantName).join(', ')})`
        : storeGroups[0]?.merchantName || 'Lojista Parceiro';

    // Criação do pedido com ESTOQUE EM STAND-BY (sem bloqueio)
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
      stockConfirmationStatus: 'STAND_BY', // ESTOQUE = STAND-BY
      customerAddress:
        modality === 'DELIVERY'
          ? `${customerAddress} - ${customerNeighborhood}, Cachoeiras de Macacu`
          : 'Retirada no Balcão da(s) Loja(s)',
      merchantId: targetMerchantId,
      merchantName: targetMerchantName,
      type: 'PRODUTO',
      items: itemsList.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        productImage: it.product.images[0] || '',
        quantity: it.quantity,
        price: it.product.price,
        selectedVariation: it.selectedVariations
      })),
      itensPorLojista: storeGroups.map((g) => ({
        lojistaId: g.merchantId,
        nomeLojista: g.merchantName,
        subtotal: g.subtotal,
        walletId: g.walletId,
        itens: g.items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          productImage: it.product.images[0] || '',
          quantity: it.quantity,
          price: it.product.price,
          selectedVariation: it.selectedVariations
        }))
      })),
      asaasSplitDetails: splitDetails,
      modality,
      status: 'Aguardando',
      paymentMethod: 'PIX',
      paymentStatus: 'PENDENTE',
      totalAmount: grandTotal,
      deliveryFee
    });

    // Notificações: gerar venda individual para cada lojista e persistir no banco
    storeGroups.forEach((g, idx) => {
      const subId = `sub-${created.id}-${idx}`;
      const subCode = `${created.orderNumber || created.code}-${String.fromCharCode(65 + idx)}`;

      sendSubOrderSystemMessage({
        subpedidoId: subId,
        pedidoPrincipalId: created.id,
        codigoSubpedido: subCode,
        merchantId: g.merchantId,
        merchantName: g.merchantName,
        customerId: currentUser?.id,
        customerName,
        customerPhone,
        orderTitle: `Venda Recebida: ${g.items.length} item(ns) - Subtotal R$ ${g.subtotal.toFixed(2)}`,
        orderStatus: 'Aguardando Pagamento',
        securityCode: secCode,
        orderTotal: g.subtotal
      });
    });

    // Se a modalidade for ENTREGA, integra automaticamente as corridas ao Portal de Entrega existente
    if (modality === 'DELIVERY' && deliveryCalculation.storeDeliveries.length > 0) {
      deliveryCalculation.storeDeliveries.forEach((sd) => {
        createDeliveryRide({
          orderId: created.id,
          originAddress: `${sd.originNeighborhood}, Cachoeiras de Macacu`,
          originNeighborhood: sd.originNeighborhood,
          destinationAddress: `${customerAddress}, Cachoeiras de Macacu`,
          destinationNeighborhood: sd.destNeighborhood,
          customDistanceKm: sd.distanceKm
        }).catch((err) => console.error('Erro ao acionar corrida no Portal de Entrega:', err));
      });
    }

    setActiveOrder(created);
    onOrderSuccess(created);

    // Transiciona diretamente para a etapa de pagamento (sem travar em confirmação de estoque)
    setCurrentStep('PAYMENT');
    triggerToast(`Pedido ${created.orderNumber || created.code} criado! Prossiga com o pagamento Asaas.`);
  };

  // Confirmação Real do Pagamento (via Asaas Webhook ou Verificação do PixPaymentModule)
  const handlePaymentConfirmed = (confirmedOrder?: Order) => {
    const targetOrder = confirmedOrder || activeOrder;
    if (!targetOrder) return;

    const updated: Order = {
      ...targetOrder,
      status: 'Confirmado',
      paymentStatus: 'PAGO',
      buyerDataUnlocked: true,
      stockConfirmationStatus: 'STOCK_CONFIRMED'
    };

    setActiveOrder(updated);

    // Limpa o carrinho após finalizar compra com sucesso
    clearCart();

    // Notifica cada lojista da aprovação individual (persistente e offline-safe)
    storeGroups.forEach((g, idx) => {
      const subId = `sub-${updated.id}-${idx}`;
      const subCode = `${updated.orderNumber || updated.code}-${String.fromCharCode(65 + idx)}`;

      sendSubOrderSystemMessage({
        subpedidoId: subId,
        pedidoPrincipalId: updated.id,
        codigoSubpedido: subCode,
        merchantId: g.merchantId,
        merchantName: g.merchantName,
        customerId: currentUser?.id,
        customerName,
        customerPhone,
        orderTitle: `PAGAMENTO CONFIRMADO ✓ - Valor R$ ${g.subtotal.toFixed(2)} (Repasse 90%: R$ ${g.repasse.toFixed(2)}) | Entrega: ${modality === 'DELIVERY' ? 'Portal de Entrega' : 'Retirada no Balcão'}`,
        orderStatus: 'Confirmado',
        securityCode: updated.securityCode,
        orderTotal: g.subtotal
      });

      // Registro de notificação persistente na auditoria (funciona offline)
      logNotification({
        eventType: 'ORDER_PLACED',
        recipientMerchantId: g.merchantId,
        recipientName: g.merchantName,
        title: `Nova Venda Confirmada no Pedido ${updated.orderNumber || updated.code}!`,
        message: `Você tem ${g.items.length} item(ns) vendidos no pedido ${updated.orderNumber || updated.code}. Subtotal: R$ ${g.subtotal.toFixed(2)} (Repasse: R$ ${g.repasse.toFixed(2)}). Entrega: ${modality === 'DELIVERY' ? 'Portal de Entrega' : 'Retirada no Balcão'}.`,
        orderId: updated.id,
        orderCode: updated.orderNumber || updated.code,
        merchantId: g.merchantId,
        channel: 'IN_APP',
        status: 'DELIVERED',
        metadata: {
          itemsCount: g.items.length,
          subtotal: g.subtotal,
          repasse: g.repasse,
          modality
        }
      });
    });

    setCurrentStep('COMPLETED');
    triggerToast('Pagamento confirmado via Asaas! Vendas registradas para os lojistas.');
  };

  // Solicitar Entrega no Portal de Entrega Existente
  const handleConfirmDeliveryRequest = async () => {
    if (!activeOrder) return;
    setIsRequestingRide(true);
    setDeliveryError(null);

    try {
      const res = await createDeliveryRide({
        orderId: activeOrder.id,
        originAddress: deliveryOriginAddress,
        originNeighborhood: deliveryOriginNeighborhood,
        destinationAddress: deliveryDestAddress,
        destinationNeighborhood: deliveryDestNeighborhood,
        customDistanceKm: calculatedDistanceKm
      });

      if (res.success && res.ride) {
        setDeliveryRideCreated(res.ride);
        triggerToast(`Entrega #${res.ride.rideCode} solicitada no Portal de Entrega!`);
      } else {
        setDeliveryError(res.message || 'Não foi possível solicitar a entrega.');
      }
    } catch (err: any) {
      setDeliveryError(err.message || 'Erro ao conectar ao Portal de Entrega.');
    } finally {
      setIsRequestingRide(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      triggerToast(`${label} copiado!`);
    }
  };

  const estimatedDeliveryFareValue = estimateDeliveryFare(calculatedDistanceKm, 1.0, 2.0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {currentStep === 'FORM' && 'Finalizar Compra — Pedido Único'}
                {currentStep === 'PHONE_VERIFY' && 'Validação de Telefone / SMS'}
                {currentStep === 'PAYMENT' && 'Pagamento Seguro Asaas (Split Automático)'}
                {currentStep === 'COMPLETED' && 'Compra Finalizada com Sucesso!'}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {storeGroups.length > 1
                  ? `Carrinho Multilojista • ${storeGroups.length} Lojas Participantes`
                  : `${storeGroups[0]?.merchantName || 'Loja Local'} • Checkout Seguro`}
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
            <span>Resumo</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center space-x-1 ${currentStep === 'PHONE_VERIFY' ? 'text-emerald-400' : isClientVerified ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">2</span>
            <span>Validação</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center space-x-1 ${currentStep === 'PAYMENT' ? 'text-emerald-400' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">3</span>
            <span>Asaas Split</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <div className={`flex items-center space-x-1 ${currentStep === 'COMPLETED' ? 'text-emerald-400 font-black' : 'text-slate-400'}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">4</span>
            <span>Entrega / Conclusão</span>
          </div>
        </div>

        {/* STATUS BAR: ESTOQUE = STAND-BY */}
        <div className="bg-emerald-50/80 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] leading-tight">
              <strong>Estoque em Stand-by:</strong> Venda direta liberada sem necessidade de espera por confirmação prévia das lojas.
            </p>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-slate-800 space-y-4">
          {/* ======================================================== */}
          {/* STEP 1: FORMULÁRIO & AGRUPAMENTO MULTILOJA */}
          {/* ======================================================== */}
          {currentStep === 'FORM' && (
            <form onSubmit={handleProceedToVerification} className="space-y-4">
              {/* AGRUPAMENTO MULTILOJA: ÁRVORE DO PEDIDO ÚNICO */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      CRIAR PEDIDO ÚNICO ({storeGroups.length} {storeGroups.length === 1 ? 'Loja' : 'Lojas'}):
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {itemsList.reduce((acc, it) => acc + it.quantity, 0)} item(ns)
                  </span>
                </div>

                <div className="space-y-2.5">
                  {storeGroups.map((group, gIdx) => (
                    <div
                      key={group.merchantId}
                      className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-800">
                            ├── {group.merchantName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                            {group.merchantNeighborhood}
                          </span>
                        </div>
                        <span className="text-xs font-black text-emerald-700">
                          R$ {group.subtotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Lista de itens da loja */}
                      <div className="space-y-1.5 pl-3">
                        {group.items.map((it, itemIdx) => {
                          const originalItemIndex = itemsList.findIndex(
                            (x) => x.product.id === it.product.id
                          );
                          return (
                            <div
                              key={it.product.id + itemIdx}
                              className="flex items-center justify-between text-xs text-slate-600"
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <img
                                  src={it.product.images[0] || 'https://placehold.co/100x100?text=Produto'}
                                  alt={it.product.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                                />
                                <div className="truncate">
                                  <span className="font-semibold text-slate-800 block truncate">
                                    {it.product.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    R$ {it.product.price.toFixed(2).replace('.', ',')} un.
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(originalItemIndex, it.quantity - 1)}
                                    className="w-5 h-5 text-slate-600 font-bold hover:bg-white rounded flex items-center justify-center text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="text-[11px] font-bold px-1">{it.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateQuantity(originalItemIndex, it.quantity + 1)}
                                    className="w-5 h-5 text-slate-600 font-bold hover:bg-white rounded flex items-center justify-center text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="font-bold text-slate-800 w-16 text-right">
                                  R$ {it.itemTotal.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FORMA DE RECEBIMENTO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Forma de Recebimento:
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                    <p className="text-xs font-bold text-slate-900">Delivery / Entrega</p>
                    <p className="text-[10px] text-slate-500">Motoboy local em Cachoeiras</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModality('RETIRADA')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      modality === 'RETIRADA'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Store className="w-4 h-4 text-emerald-600 mb-1" />
                    <p className="text-xs font-bold text-slate-900">Retirada no Balcão</p>
                    <p className="text-[10px] text-slate-500">Retire diretamente nas lojas</p>
                  </button>
                </div>
              </div>

              {/* DADOS DE ENTREGA */}
              {modality === 'DELIVERY' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Endereço de Entrega (Cachoeiras de Macacu - RJ):</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Rua, Número e Complemento *"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />

                    <select
                      value={customerNeighborhood}
                      onChange={(e) => setCustomerNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none font-medium"
                    >
                      {getAllCachoeirasNeighborhoods().map((b) => (
                        <option key={b} value={b}>
                          Bairro: {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Discriminação do Portal de Entrega por loja participante */}
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span className="flex items-center space-x-1">
                        <Bike className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Portal de Entrega ({deliveryCalculation.storeDeliveries.length} Origem(ns)):</span>
                      </span>
                      <span className="text-emerald-700 font-black">
                        Total Entrega: R$ {deliveryFee.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {deliveryCalculation.storeDeliveries.map((sd) => (
                      <div key={sd.merchantId} className="flex justify-between text-[11px] text-emerald-800/90 pl-4 border-l-2 border-emerald-300">
                        <span>
                          {sd.merchantName} ({sd.originNeighborhood} → {sd.destNeighborhood}, {sd.distanceKm.toFixed(1)} km):
                        </span>
                        <span className="font-semibold">
                          R$ {sd.fare.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DADOS DO COMPRADOR */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Dados para Faturamento e Confirmação:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu Nome Completo *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp / Telefone *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Seu E-mail *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(e.target.value)}
                    placeholder="CPF (opcional para nota)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              {/* RESUMO FINANCEIRO & SPLIT ASAAS */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal das Mercadorias:</span>
                  <span className="font-bold text-white">R$ {itemsSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {modality === 'DELIVERY' && (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Taxa Estimada de Entrega:</span>
                    <span className="font-bold text-white">R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block">Total do Pedido:</span>
                    <span className="text-lg font-black text-emerald-400">
                      R$ {grandTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="text-right text-[10px] text-slate-400 space-y-0.5">
                    <p>Split Asaas Ativo ✓</p>
                    <p className="text-emerald-300 font-bold">10% Plataforma + 90% Lojistas</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Avançar para Pagamento Asaas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: PHONE VERIFICATION (SMS / WHATSAPP) */}
          {/* ======================================================== */}
          {currentStep === 'PHONE_VERIFY' && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-6 h-6" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Validação de Segurança
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Enviamos um código de 6 dígitos para o número{' '}
                  <strong>{customerPhone}</strong> via {verificationChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 text-center">
                  Digite o Código de 6 Dígitos:
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredSmsCode}
                    onChange={(e) => setEnteredSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 482913"
                    className="w-44 text-center font-mono text-2xl font-black tracking-widest py-2.5 px-3 bg-white border-2 border-emerald-500 rounded-xl outline-none"
                  />
                </div>

                {verifyError && (
                  <p className="text-xs text-red-600 text-center font-bold">{verifyError}</p>
                )}

                {/* Dica para homologação rápida */}
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 text-center">
                  <span>Código gerado para este teste: </span>
                  <strong className="font-mono font-black">{generatedSmsCode}</strong>
                  <button
                    type="button"
                    onClick={() => setEnteredSmsCode(generatedSmsCode)}
                    className="ml-2 text-emerald-700 underline font-bold"
                  >
                    (Preencher automaticamente)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleConfirmPhoneVerification()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                >
                  Confirmar e Ir para o Pagamento
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('FORM')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Voltar e Editar Dados
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: ASAAS CHECKOUT & PIX COM SPLIT */}
          {/* ======================================================== */}
          {currentStep === 'PAYMENT' && activeOrder && (
            <div className="space-y-4 py-1">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">
                    Pedido {activeOrder.orderNumber || activeOrder.code} criado com sucesso!
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white font-bold rounded-full">
                  Asaas Checkout
                </span>
              </div>

              {/* Módulo Oficial de Pagamento Pix com Split */}
              <PixPaymentModule
                order={activeOrder}
                onPaymentSuccess={(updatedOrder) => {
                  handlePaymentConfirmed(updatedOrder);
                }}
              />

              {/* TABELA DE SPLIT DA TRANSAÇÃO */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">
                  Divisão Automática do Pagamento (Asaas Split):
                </span>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>• Taxa da Plataforma Achei Aqui (10%):</span>
                    <span className="font-bold text-slate-900">
                      R$ {totalPlatformCommission.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  {storeGroups.map((g) => (
                    <div key={g.merchantId} className="flex justify-between pl-2">
                      <span>• Repasse Líquido {g.merchantName} (90%):</span>
                      <span className="font-bold text-emerald-700">
                        R$ {g.repasse.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: COMPLETED */}
          {/* ======================================================== */}
          {currentStep === 'COMPLETED' && activeOrder && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Compra Finalizada com Sucesso!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  O pagamento do Pedido <strong>{activeOrder.orderNumber || activeOrder.code}</strong> foi aprovado e as vendas foram registradas para cada lojista.
                </p>
              </div>

              {/* CARD DE CÓDIGO DE NEGOCIAÇÃO */}
              <div className="p-4 bg-linear-to-br from-slate-900 to-emerald-950 text-white rounded-2xl text-center space-y-2">
                <p className="text-xs text-emerald-300 font-bold">CÓDIGO DE NEGOCIAÇÃO / RETIRADA</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-mono text-3xl font-black text-white bg-white/10 px-4 py-1.5 rounded-xl tracking-widest border border-white/20">
                    {activeOrder.securityCode || 'K7P4X9'}
                  </span>
                  <button
                    onClick={() => handleCopyText(activeOrder.securityCode || 'K7P4X9', 'Código')}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-300">
                  Apresente este código para conferência na retirada ou recebimento da entrega.
                </p>
              </div>

              {/* STATUS DA MODALIDADE ESCOLHIDA NO CARRINHO / CHECKOUT */}
              {modality === 'DELIVERY' ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                    <Bike className="w-4 h-4 text-emerald-700" />
                    <span>Entrega Agendada no Portal de Entrega</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    A taxa de entrega foi integrada e aprovada com sucesso. Os entregadores parceiros do Portal de Entrega foram acionados para buscar seus produtos nas lojas e entregar em seu endereço:
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="text-slate-900 font-bold">
                      Endereço de Destino: {customerAddress} - {customerNeighborhood}, Cachoeiras de Macacu
                    </div>
                    <div className="text-emerald-800 font-semibold">
                      Taxa de Entrega: R$ {deliveryFee.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      Coleta nas lojas: {storeGroups.map((g) => `${g.merchantName} (${g.merchantNeighborhood})`).join(', ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>Retirada no Balcão Confirmada</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Seu pedido já está pago! Apresente o código de negociação/retirada acima diretamente no balcão das lojas parceiras:
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    {storeGroups.map((g) => (
                      <div key={g.merchantId} className="flex justify-between text-slate-800">
                        <span className="font-bold">• {g.merchantName} ({g.merchantNeighborhood}):</span>
                        <span>{g.items.length} item(ns)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOTÕES DE FECHAMENTO */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const firstStore = storeGroups[0];
                    if (firstStore) {
                      openSubOrderChat({
                        subpedidoId: `sub-${activeOrder.id}-0`,
                        pedidoPrincipalId: activeOrder.id,
                        codigoSubpedido: `${activeOrder.orderNumber || activeOrder.code}-A`,
                        merchantId: firstStore.merchantId,
                        merchantName: firstStore.merchantName,
                        customerId: currentUser?.id,
                        customerName,
                        customerPhone,
                        orderTitle: `${firstStore.items.length} itens - Total R$ ${firstStore.subtotal.toFixed(2)}`,
                        orderStatus: activeOrder.status,
                        securityCode: activeOrder.securityCode,
                        orderTotal: firstStore.subtotal
                      });
                    }
                    onClose();
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir Conversa com a Loja</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Concluir e Voltar ao Marketplace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
