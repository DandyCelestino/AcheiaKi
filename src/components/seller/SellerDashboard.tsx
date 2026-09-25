import React, { useState, useEffect } from 'react';
import {
  Store,
  Package,
  Plus,
  ShoppingBag,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shirt,
  Truck,
  Bike,
  Navigation,
  TrendingUp,
  Users,
  Search,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  ExternalLink,
  QrCode,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Wrench,
  Hammer,
  ShieldCheck,
  Cpu,
  Star,
  ThumbsUp,
  Save,
  MapPin,
  Phone,
  Mail,
  Camera,
  Upload,
  Image as ImageIcon,
  Building,
  Crown,
  Lock,
  Unlock,
  CreditCard,
  BarChart3,
  DollarSign,
  Copy,
  Share2,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Order, OrderStatus, ItemType } from '../../types';
import { NotificationService } from '../../services/notification_service';
import { ReviewsList } from '../reviews/ReviewsList';
import { MerchantReviewModal } from '../reviews/MerchantReviewModal';
import { MerchantScheduleManager } from '../services/MerchantScheduleManager';
import { AppointmentResponseModal } from '../services/AppointmentResponseModal';
import { ImageUploadDropzone } from '../common/ImageUploadDropzone';
import { MEMBERSHIP_PLANS } from '../../data/membershipPlansData';
import { PixPaymentModal } from '../common/PixPaymentModal';
import { cadastrarLojistaAsaas } from '../../services/asaasService';
import { SellerFinancialBarChart } from './SellerFinancialBarChart';
import { RequestDeliveryModal } from './RequestDeliveryModal';

export const SellerDashboard: React.FC = () => {
  const {
    currentUser,
    merchants,
    products,
    orders,
    deliveryRides,
    cancelDeliveryRide,
    addProduct,
    updateProduct,
    deleteProduct,
    confirmOrderStock,
    rejectOrderStock,
    updateOrderStatus,
    validatePickupCode,
    updateStoreProfile,
    setCurrentEnvironment,
    triggerToast,
    reviews,
    addMerchantReview,
    replyToCustomerReview,
    isOrderReviewedByMerchant,
    openPolicyModal,
    openPlansModal,
    payOrderCommissionByMerchant,
    openSubOrderChat,
    getUnreadSubOrderMessagesCount
  } = useApp();

  const [requestDeliveryOrder, setRequestDeliveryOrder] = useState<Order | null>(null);

  // Find seller's active merchant store strictly matching the logged in user
  const currentStore =
    merchants.find((m) => m.id === currentUser?.merchantId) ||
    merchants.find((m) => m.ownerName?.toLowerCase() === currentUser?.name?.toLowerCase()) ||
    merchants.find((m) => m.ownerEmail?.toLowerCase() === currentUser?.email?.toLowerCase()) ||
    merchants.find((m) => m.contactPhone === currentUser?.phone) ||
    (currentUser?.role === 'MASTER' ? merchants[0] : undefined);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'financial' | 'products' | 'orders' | 'validate-pickup' | 'appointments' | 'schedule' | 'settings' | 'reviews'>('dashboard');
  const [reviewingOrderForCustomer, setReviewingOrderForCustomer] = useState<Order | null>(null);
  const [respondingAppointment, setRespondingAppointment] = useState<Order | null>(null);
  const [pixCommissionModalOrder, setPixCommissionModalOrder] = useState<Order | null>(null);

  // Prestador de Serviços: 1 serviço incluso (R$ 29,90), R$ 9,90 por serviço adicional
  const [extraServicePixModal, setExtraServicePixModal] = useState<{
    serviceName: string;
    amount: number;
    serviceIndex: number;
    productPayload: any;
    qrCodeUrl: string;
    pixCopiaECola: string;
  } | null>(null);
  const [copiedExtraServicePix, setCopiedExtraServicePix] = useState(false);

  // Identify if the active store is a service provider
  const isPrestador = Boolean(
    currentStore?.isServiceProvider ||
    currentStore?.category === 'prestadores-de-servicos' ||
    (currentUser as any)?.clientType === 'PRESTADOR' ||
    currentStore?.membershipTier === 'PRESTADOR'
  );

  // Filter store-specific data (including multi-store orders that contain items from this store)
  const storeProducts = currentStore ? products.filter((p) => p.merchantId === currentStore.id) : [];
  const storeOrders = currentStore
    ? orders.filter(
        (o) =>
          o.merchantId === currentStore.id ||
          o.itensPorLojista?.some((l: any) => l.lojistaId === currentStore.id)
      )
    : [];
  const pendingOrders = storeOrders.filter((o) => o.status !== 'Concluído' && o.status !== 'Cancelado');
  const storeReviews = currentStore ? reviews.filter((r) => r.merchantId === currentStore.id) : [];

  // Store Profile & Visual Identity State
  const [storeName, setStoreName] = useState(currentStore?.name || '');
  const [storeOwnerName, setStoreOwnerName] = useState(currentStore?.ownerName || '');
  const [storeCategory, setStoreCategory] = useState(currentStore?.category || 'COMÉRCIO EM GERAL');
  const [storeSubcategory, setStoreSubcategory] = useState(currentStore?.subcategory || '');
  const [storePhone, setStorePhone] = useState(currentStore?.contactPhone || currentStore?.phone || '');
  const [storeCnpjOrCpf, setStoreCnpjOrCpf] = useState(currentStore?.cnpjOrCpf || '');
  const [storeAddress, setStoreAddress] = useState(currentStore?.address || '');
  const [storeNeighborhood, setStoreNeighborhood] = useState(currentStore?.neighborhood || 'Centro');
  const [storeZipCode, setStoreZipCode] = useState(currentStore?.zipCode || '28680-000');
  const [storeDescription, setStoreDescription] = useState(currentStore?.description || '');
  const [storeOpeningHours, setStoreOpeningHours] = useState(currentStore?.openingHours || '08:00 às 18:00');
  const [storeDeliveryFee, setStoreDeliveryFee] = useState(currentStore?.deliveryFee !== undefined ? currentStore.deliveryFee.toString() : '0');
  const [storeDeliveryTime, setStoreDeliveryTime] = useState(currentStore?.deliveryTimeEstimate || '30-45 min');
  const [storeLogo, setStoreLogo] = useState(currentStore?.logo || '');
  const [storeBanner, setStoreBanner] = useState(currentStore?.banner || '');
  const [storeGallery, setStoreGallery] = useState<string[]>(currentStore?.gallery || []);
  const [storeSupportsPickup, setStoreSupportsPickup] = useState(currentStore?.supportsPickup ?? true);
  const [storeSupportsTrial, setStoreSupportsTrial] = useState(currentStore?.supportsTrial ?? false);
  const [storeSupportsAppointments, setStoreSupportsAppointments] = useState(currentStore?.supportsAppointments ?? true);
  const [storeAllowDirectChat, setStoreAllowDirectChat] = useState<boolean>(currentStore?.allowDirectChat ?? true);
  const [storeAsaasWalletId, setStoreAsaasWalletId] = useState(currentStore?.asaasWalletId || '');
  const [storeAsaasAccountId, setStoreAsaasAccountId] = useState(currentStore?.asaasAccountId || '');
  const [isCreatingAsaasSubaccount, setIsCreatingAsaasSubaccount] = useState(false);
  const [serviceButtonsConfig, setServiceButtonsConfig] = useState<{
    showSchedule?: boolean;
    showHomeService?: boolean;
    showStoreService?: boolean;
    showQuote?: boolean;
    showChat?: boolean;
  }>({
    showSchedule: currentStore?.serviceButtonsConfig?.showSchedule !== false,
    showHomeService: currentStore?.serviceButtonsConfig?.showHomeService !== false,
    showStoreService: currentStore?.serviceButtonsConfig?.showStoreService !== false,
    showQuote: currentStore?.serviceButtonsConfig?.showQuote !== false,
    showChat: currentStore?.serviceButtonsConfig?.showChat !== false
  });

  useEffect(() => {
    if (currentStore) {
      setStoreName(currentStore.name || '');
      setStoreOwnerName(currentStore.ownerName || '');
      setStoreCategory(currentStore.category || '');
      setStoreSubcategory(currentStore.subcategory || '');
      setStorePhone(currentStore.contactPhone || currentStore.phone || '');
      setStoreCnpjOrCpf(currentStore.cnpjOrCpf || '');
      setStoreAddress(currentStore.address || '');
      setStoreNeighborhood(currentStore.neighborhood || 'Centro');
      setStoreZipCode(currentStore.zipCode || '28680-000');
      setStoreDescription(currentStore.description || '');
      setStoreOpeningHours(currentStore.openingHours || '08:00 às 18:00');
      setStoreDeliveryFee(currentStore.deliveryFee !== undefined ? currentStore.deliveryFee.toString() : '0');
      setStoreDeliveryTime(currentStore.deliveryTimeEstimate || '30-45 min');
      setStoreLogo(currentStore.logo || '');
      setStoreBanner(currentStore.banner || '');
      setStoreGallery(currentStore.gallery || []);
      setStoreSupportsPickup(currentStore.supportsPickup ?? true);
      setStoreSupportsTrial(currentStore.supportsTrial ?? false);
      setStoreSupportsAppointments(currentStore.supportsAppointments ?? true);
      setStoreAllowDirectChat(currentStore.allowDirectChat ?? true);
      setStoreAsaasWalletId(currentStore.asaasWalletId || '');
      setStoreAsaasAccountId(currentStore.asaasAccountId || '');
      setServiceButtonsConfig({
        showSchedule: currentStore.serviceButtonsConfig?.showSchedule !== false,
        showHomeService: currentStore.serviceButtonsConfig?.showHomeService !== false,
        showStoreService: currentStore.serviceButtonsConfig?.showStoreService !== false,
        showQuote: currentStore.serviceButtonsConfig?.showQuote !== false,
        showChat: currentStore.serviceButtonsConfig?.showChat !== false
      });
    }
  }, [currentStore]);

  // Add / Edit Product / Service Modal Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProdItemType, setNewProdItemType] = useState<ItemType>(
    currentStore?.isServiceProvider ? 'SERVICO' : 'PRODUTO_FISICO'
  );
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(
    currentStore?.isServiceProvider ? 'prestadores-de-servicos' : (currentStore?.category?.toLowerCase()?.includes('moda') ? 'moda' : 'gastronomia')
  );
  const [newProdSubcategory, setNewProdSubcategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdEstimatedDuration, setNewProdEstimatedDuration] = useState('1 a 2 horas');
  const [newProdWarrantyDays, setNewProdWarrantyDays] = useState('90');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImages, setNewProdImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
  ]);
  const [allowDelivery, setAllowDelivery] = useState(true);
  const [allowPickup, setAllowPickup] = useState(true);
  const [allowTrial, setAllowTrial] = useState(currentStore?.supportsTrial ?? false);
  const [allowAppointment, setAllowAppointment] = useState(true);

  // New fields: Advance Fee / PIX / Furniture / Vehicles
  const [advanceFeeRequired, setAdvanceFeeRequired] = useState(false);
  const [advanceFeeAmount, setAdvanceFeeAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'CPF' | 'CNPJ' | 'TELEFONE' | 'EMAIL' | 'ALEATORIA'>('CPF');
  const [pixKey, setPixKey] = useState('');
  const [pixBeneficiaryName, setPixBeneficiaryName] = useState('');
  
  // Furniture options
  const [furnitureActionType, setFurnitureActionType] = useState<'BUY' | 'RENT' | 'BOTH'>('BOTH');
  const [rentPrice, setRentPrice] = useState('');
  const [rentPeriod, setRentPeriod] = useState<'DIA' | 'SEMANA' | 'MES' | 'EVENTO'>('MES');

  // Vehicle options
  const [vehicleActionType, setVehicleActionType] = useState<'RESERVE' | 'VISIT' | 'BOTH'>('BOTH');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleKm, setVehicleKm] = useState('');

  // Pickup validator state
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    order?: Order;
  } | null>(null);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setNewProdItemType(currentStore?.isServiceProvider ? 'SERVICO' : 'PRODUTO_FISICO');
    setNewProdName('');
    setNewProdCategory(currentStore?.isServiceProvider ? 'prestadores-de-servicos' : 'moda');
    setNewProdSubcategory('');
    setNewProdPrice('');
    setNewProdOriginalPrice('');
    setNewProdStock('10');
    setNewProdEstimatedDuration('1 a 2 horas');
    setNewProdWarrantyDays('90');
    setNewProdDesc('');
    setNewProdImages(['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80']);
    setAllowDelivery(true);
    setAllowPickup(true);
    setAllowTrial(currentStore?.supportsTrial ?? false);
    setAllowAppointment(true);
    setAdvanceFeeRequired(false);
    setAdvanceFeeAmount('');
    setPixKeyType('CPF');
    setPixKey('');
    setPixBeneficiaryName('');
    setFurnitureActionType('BOTH');
    setRentPrice('');
    setRentPeriod('MES');
    setVehicleActionType('BOTH');
    setVehicleYear('');
    setVehicleKm('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setNewProdItemType(prod.itemType || 'PRODUTO_FISICO');
    setNewProdName(prod.name);
    setNewProdCategory(prod.category || 'moda');
    setNewProdSubcategory(prod.subcategory || '');
    setNewProdPrice(prod.price ? prod.price.toString().replace('.', ',') : '');
    setNewProdOriginalPrice(prod.originalPrice ? prod.originalPrice.toString().replace('.', ',') : '');
    setNewProdStock(prod.stock ? prod.stock.toString() : '10');
    setNewProdEstimatedDuration(prod.estimatedDuration || '1 a 2 horas');
    setNewProdWarrantyDays(prod.warrantyDays ? prod.warrantyDays.toString() : '90');
    setNewProdDesc(prod.description || '');
    const initialImgs = prod.images && prod.images.length > 0 ? prod.images : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'];
    setNewProdImages(initialImgs);
    setAllowDelivery(prod.availableModalities?.includes('DELIVERY') ?? true);
    setAllowPickup(prod.availableModalities?.includes('RETIRADA') ?? true);
    setAllowTrial(prod.availableModalities?.includes('EXPERIMENTAÇÃO') ?? false);
    setAllowAppointment(prod.availableModalities?.includes('AGENDAMENTO' as any) ?? true);
    setAdvanceFeeRequired(prod.advanceFeeRequired || false);
    setAdvanceFeeAmount(prod.advanceFeeAmount ? prod.advanceFeeAmount.toString().replace('.', ',') : '');
    setPixKeyType(prod.pixKeyType || 'CPF');
    setPixKey(prod.pixKey || '');
    setPixBeneficiaryName(prod.pixBeneficiaryName || '');
    setFurnitureActionType(prod.furnitureActionType || 'BOTH');
    setRentPrice(prod.rentPrice ? prod.rentPrice.toString().replace('.', ',') : '');
    setRentPeriod(prod.rentPeriod || 'MES');
    setVehicleActionType(prod.vehicleActionType || 'BOTH');
    setVehicleYear(prod.vehicleYear || '');
    setVehicleKm(prod.vehicleKm || '');
    setIsAddModalOpen(true);
  };

  const handleToggleDirectChat = (forcedVal?: boolean) => {
    if (!currentStore) return;
    const nextVal = forcedVal !== undefined ? forcedVal : !storeAllowDirectChat;
    setStoreAllowDirectChat(nextVal);
    updateStoreProfile(currentStore.id, { allowDirectChat: nextVal });
    triggerToast(
      nextVal
        ? 'Chat interno ATIVADO! Clientes agora podem tirar dúvidas e mandar mensagens.'
        : 'Chat interno DESATIVADO! O botão de chat foi ocultado para os clientes nesta loja e produtos.'
    );
  };

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    updateStoreProfile(currentStore.id, {
      name: storeName.trim(),
      ownerName: storeOwnerName.trim(),
      category: storeCategory,
      subcategory: storeSubcategory.trim() || undefined,
      contactPhone: storePhone.trim(),
      phone: storePhone.trim(),
      cnpjOrCpf: storeCnpjOrCpf.trim(),
      address: storeAddress.trim(),
      neighborhood: storeNeighborhood,
      zipCode: storeZipCode.trim(),
      description: storeDescription.trim(),
      openingHours: storeOpeningHours.trim(),
      deliveryFee: parseFloat(storeDeliveryFee.replace(',', '.')) || 0,
      deliveryTimeEstimate: storeDeliveryTime.trim(),
      logo: storeLogo || currentStore.logo,
      banner: storeBanner || currentStore.banner,
      gallery: storeGallery,
      supportsPickup: storeSupportsPickup,
      supportsTrial: storeSupportsTrial,
      supportsAppointments: storeSupportsAppointments,
      allowDirectChat: storeAllowDirectChat,
      asaasWalletId: storeAsaasWalletId.trim() || undefined,
      asaasAccountId: storeAsaasAccountId.trim() || undefined,
      serviceButtonsConfig
    });

    triggerToast('Perfil e dados financeiros da loja atualizados com sucesso!');
  };

  const handleRegisterAsaasSubaccount = async () => {
    if (!currentStore) return;
    setIsCreatingAsaasSubaccount(true);
    try {
      const res = await cadastrarLojistaAsaas({
        nome: storeName || currentStore.name,
        documento: storeCnpjOrCpf || '12345678000199',
        email: currentStore.ownerEmail || currentUser?.email || 'contato@lojista.com',
        telefone: storePhone || currentStore.phone || '21999998888'
      });
      setStoreAsaasWalletId(res.walletIdDoLojista);
      setStoreAsaasAccountId(res.lojistaId);
      updateStoreProfile(currentStore.id, {
        asaasWalletId: res.walletIdDoLojista,
        asaasAccountId: res.lojistaId
      });
      triggerToast(`Subconta Asaas vinculada com sucesso! Wallet ID: ${res.walletIdDoLojista}`);
    } catch (err: any) {
      triggerToast(`Erro ao vincular conta Asaas: ${err?.message || 'Falha de comunicação'}`);
    } finally {
      setIsCreatingAsaasSubaccount(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    const modalities: ('DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO' | 'AGENDAMENTO')[] = [];
    if (allowDelivery) modalities.push('DELIVERY');
    if (allowPickup) modalities.push('RETIRADA');
    if (allowTrial) modalities.push('EXPERIMENTAÇÃO');
    if (allowAppointment) modalities.push('AGENDAMENTO');

    const parsedPrice = parseFloat(newProdPrice.replace(',', '.'));
    const parsedOriginalPrice = newProdOriginalPrice ? parseFloat(newProdOriginalPrice.replace(',', '.')) : undefined;
    const parsedAdvanceFee = advanceFeeRequired && advanceFeeAmount ? parseFloat(advanceFeeAmount.replace(',', '.')) : undefined;
    const parsedRentPrice = rentPrice ? parseFloat(rentPrice.replace(',', '.')) : undefined;
    const productImages = newProdImages.length > 0 ? newProdImages : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'];

    if (editingProduct) {
      // UPDATE EXISTING PRODUCT
      updateProduct(editingProduct.id, {
        name: newProdName,
        description: newProdDesc || 'Anunciado oficialmente pelo profissional/estabelecimento parceiro.',
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        images: productImages,
        image: productImages[0],
        category: newProdCategory,
        subcategory: newProdSubcategory || undefined,
        itemType: newProdItemType,
        estimatedDuration: newProdItemType !== 'PRODUTO_FISICO' ? newProdEstimatedDuration : undefined,
        warrantyDays: newProdWarrantyDays ? parseInt(newProdWarrantyDays, 10) : undefined,
        stock: newProdItemType === 'PRODUTO_FISICO' ? (parseInt(newProdStock, 10) || 1) : 999,
        availableModalities: modalities.length > 0 ? (modalities as any) : ['RETIRADA'],
        advanceFeeRequired,
        advanceFeeAmount: parsedAdvanceFee,
        pixKeyType: advanceFeeRequired ? pixKeyType : undefined,
        pixKey: advanceFeeRequired ? pixKey : undefined,
        pixBeneficiaryName: advanceFeeRequired ? pixBeneficiaryName : undefined,
        furnitureActionType,
        rentPrice: parsedRentPrice,
        rentPeriod,
        vehicleActionType,
        vehicleYear,
        vehicleKm
      });
      triggerToast(`Item "${newProdName}" atualizado com sucesso!`);
    } else {
      // CHECK TIER PRODUCT LIMIT
      const sellerTier = currentStore?.membershipTier || 'GRATIS';
      const plan = MEMBERSHIP_PLANS[sellerTier];
      if (plan.maxProducts !== 9999 && storeProducts.length >= plan.maxProducts) {
        triggerToast(`Seu plano atual (${plan.title}) permite cadastrar no máximo ${plan.maxProducts} produtos.`);
        openPlansModal();
        return;
      }

      const newProductPayload = {
        merchantId: currentStore?.id || 'm-custom',
        merchantName: currentStore?.name || 'Minha Loja',
        merchantCategory: currentStore?.category || 'Comércio',
        merchantRating: currentStore?.rating || 5.0,
        merchantAddress: currentStore ? `${currentStore.address} - ${currentStore.neighborhood}` : 'Cachoeiras de Macacu - RJ',
        name: newProdName,
        description: newProdDesc || 'Anunciado oficialmente pelo profissional/estabelecimento parceiro.',
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        images: productImages,
        image: productImages[0],
        category: newProdCategory,
        subcategory: newProdSubcategory || undefined,
        itemType: newProdItemType,
        estimatedDuration: newProdItemType !== 'PRODUTO_FISICO' ? newProdEstimatedDuration : undefined,
        warrantyDays: newProdWarrantyDays ? parseInt(newProdWarrantyDays, 10) : undefined,
        stock: newProdItemType === 'PRODUTO_FISICO' ? (parseInt(newProdStock, 10) || 1) : 999,
        availableModalities: modalities.length > 0 ? (modalities as any) : ['RETIRADA'],
        rating: 5.0,
        reviewsCount: 0,
        status: 'active' as const,
        advanceFeeRequired,
        advanceFeeAmount: parsedAdvanceFee,
        pixKeyType: advanceFeeRequired ? pixKeyType : undefined,
        pixKey: advanceFeeRequired ? pixKey : undefined,
        pixBeneficiaryName: advanceFeeRequired ? pixBeneficiaryName : undefined,
        furnitureActionType,
        rentPrice: parsedRentPrice,
        rentPeriod,
        vehicleActionType,
        vehicleYear,
        vehicleKm
      };

      // REGRA OFICIAL DO PRESTADOR DE SERVIÇOS:
      // O plano fixo de R$ 29,90 dá direito a 1 único serviço incluso.
      // A partir do 2º serviço, é cobrado R$ 9,90 para cada serviço adicional via Pix oficial do sistema (CNPJ 30810800000139).
      if (isPrestador && storeProducts.length >= 1) {
        const qrData = `00020126580014BR.GOV.BCB.PIX01143081080000013952040000530398654049.905802BR5925BEX SERVICOS E COMERCIOS6014CACHOEIRAS MAC62070503***6304`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

        setExtraServicePixModal({
          serviceName: newProdName,
          amount: 9.90,
          serviceIndex: storeProducts.length + 1,
          productPayload: newProductPayload,
          qrCodeUrl: qrUrl,
          pixCopiaECola: qrData
        });
        setIsAddModalOpen(false);
        return;
      }

      // CREATE NEW PRODUCT
      addProduct(newProductPayload);
      triggerToast(`Item "${newProdName}" publicado com sucesso!`);
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCodeInput) return;
    const res = validatePickupCode(pickupCodeInput);
    setValidationResult(res);
    if (res.success) {
      setPickupCodeInput('');
    }
  };

  if (!currentStore) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          Conta de Usuário / Consumidor (R$ 0,00 Grátis)
        </h2>
        <div className="max-w-lg space-y-3 mb-6 text-left bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
          <div className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
            <span className="text-base shrink-0">🛍️</span>
            <div>
              <strong className="text-white block mb-0.5">Acesso Exclusivo para Compras</strong>
              O cadastro de usuário é 100% gratuito (R$ 0,00). Conforme o regulamento oficial do sistema, contas de usuários não têm permissão para postar nenhum produto ou serviço, inserir banners ou interagir com o app de forma comercial, tendo acesso voltado exclusivamente para compras e agendamentos.
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-blue-300 leading-relaxed pt-3 border-t border-slate-700">
            <span className="text-base shrink-0">💼</span>
            <div>
              <strong className="text-blue-200 block mb-0.5">Deseja comercializar no Achei Aqui?</strong>
              Cadastre-se como <strong>Prestador de Serviços (R$ 29,90 fixo, inclui 1 serviço + R$ 9,90/adicional)</strong> ou escolha um dos nossos planos de <strong>Lojista</strong> com um dos nossos consultores comerciais autorizados.
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => { setCurrentEnvironment('MARKETPLACE');  }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
          >
            ← Voltar às Compras no Marketplace
          </button>
          <button
            onClick={openPlansModal}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Conhecer Planos Comerciais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* SELLER SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Store Info in Sidebar */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <img
                src={currentStore.logo}
                alt={currentStore.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover border border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                    Painel do Lojista
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].name}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white truncate leading-tight mt-0.5">
                  {currentStore.name}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">{currentStore.ownerName}</p>
              </div>
            </div>

            {/* Quick action to preview public store */}
            <button
              onClick={() => { setCurrentEnvironment('MARKETPLACE');  }}
              className="mt-3 w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Ver no Marketplace</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <button
              id="seller-nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center space-x-2.5 transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Visão Geral & Métricas</span>
            </button>

            <button
              id="seller-nav-financial"
              onClick={() => setActiveTab('financial')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center space-x-2.5 transition-colors ${
                activeTab === 'financial'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Financeiro & Repasse (10%)</span>
            </button>

            <button
              id="seller-nav-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Pedidos & Vendas</span>
              </div>
              {pendingOrders.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                  {pendingOrders.length}
                </span>
              )}
            </button>

            <button
              id="seller-nav-validate"
              onClick={() => setActiveTab('validate-pickup')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center space-x-2.5 transition-colors ${
                activeTab === 'validate-pickup'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>{currentStore?.isServiceProvider ? 'Validar Atendimento' : 'Validar Código Retirada'}</span>
            </button>

            <button
              id="seller-nav-products"
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Package className="w-4 h-4" />
                <span>{currentStore?.isServiceProvider ? 'Meus Serviços' : 'Meus Produtos'}</span>
              </div>
              <span className="text-slate-400 text-[11px]">{storeProducts.length}</span>
            </button>

            <button
              id="seller-nav-appointments"
              onClick={() => setActiveTab('appointments')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === 'appointments'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-4 h-4" />
                <span>Agendamentos de Clientes</span>
              </div>
              {storeOrders.filter((o) => o.modality === 'AGENDAMENTO' || o.modality === 'EXPERIMENTAÇÃO').length > 0 && (
                <span className="bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {storeOrders.filter((o) => o.modality === 'AGENDAMENTO' || o.modality === 'EXPERIMENTAÇÃO').length}
                </span>
              )}
            </button>

            <button
              id="seller-nav-schedule"
              onClick={() => setActiveTab('schedule')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center space-x-2.5 transition-colors ${
                activeTab === 'schedule'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Agenda & Preços (Hora/Dia/Mês)</span>
            </button>

            <button
              id="seller-nav-store-profile"
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center space-x-2.5 transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Perfil & Fotos da Loja</span>
            </button>

            <button
              id="seller-nav-reviews"
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Avaliações da Loja</span>
              </div>
              <span className="text-amber-400 font-bold text-xs">
                {currentStore?.rating?.toFixed(1) || '5.0'} ★
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Store Status */}
        <div className="p-4 border-t border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status da Loja:</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px]">
              ● Aberta e Operando
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
            <span className="text-slate-400">Chat com Clientes:</span>
            <button
              type="button"
              onClick={() => handleToggleDirectChat()}
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors cursor-pointer flex items-center space-x-1 ${
                storeAllowDirectChat
                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
              title="Clique para alternar o status do chat interno"
            >
              <span>{storeAllowDirectChat ? '● Ativado' : '○ Desativado'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* SELLER MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-screen space-y-6">
        {/* CABEÇALHO DO VENDEDOR - MODALIDADE ESCOLHIDA */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-4 sm:p-6 rounded-2xl border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Modalidade do Vendedor / Prestador
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs flex items-center gap-1.5 border border-amber-400">
                  <Crown className="w-3.5 h-3.5" />
                  {MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].title}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {currentStore.name}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="bg-black/30 border border-white/10 p-3 rounded-xl text-xs space-y-1 min-w-[210px]">
                <div className="flex justify-between text-slate-300">
                  <span>Limite de Produtos:</span>
                  <span className="font-bold text-white">
                    {storeProducts.length} / {MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].maxProducts === 9999 ? 'Ilimitados' : MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].maxProducts}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].maxProducts === 9999
                          ? 100
                          : Math.min(100, (storeProducts.length / MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].maxProducts) * 100)
                      }%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-amber-300 pt-0.5">
                  <span>Comissão: <strong>{MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].commissionRate}%</strong></span>
                  <span>{MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].monthlyPrice === 0 ? 'Grátis' : `R$ ${MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].monthlyPrice}/mês`}</span>
                </div>
              </div>

              <button
                onClick={openPlansModal}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Planos & Benefícios</span>
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-amber-200/90">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <strong>Regra de Dados do Comprador:</strong> {MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].buyerDataRule}
            </span>
          </div>
        </div>

        {/* TAB 1: DASHBOARD METRICS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Painel de Controle — {currentStore.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe seus pedidos, estoque e códigos de retirada em tempo real.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo Produto</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Pedidos Ativos</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {pendingOrders.length}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                  ↑ Sincronizados com o app
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Produtos Ativos</span>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {storeProducts.length}
                </p>
                <span className="text-[10px] text-blue-600 font-bold mt-1 block">
                  Visíveis no Marketplace
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Retiradas Pendentes</span>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                  {storeOrders.filter((o) => o.modality === 'RETIRADA' && o.status !== 'Concluído').length}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Aguardando código
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase">Avaliação Média</span>
                <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-1">
                  {currentStore.rating} ★
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {currentStore.reviewsCount} clientes avaliaram
                </span>
              </div>
            </div>

            {/* Quick Code Validator Banner */}
            <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-bold text-[10px] uppercase">
                  Código de Negociação & Balcão
                </span>
                <h3 className="text-lg font-bold">Cliente informou o Código de Segurança?</h3>
                <p className="text-xs text-blue-200">
                  Digite o código único (Ex: <strong>K7P4X9</strong> ou <strong>RET-8X42K9</strong>) para concluir a venda e entrega com segurança.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('validate-pickup')}
                className="px-5 py-2.5 bg-white text-blue-950 font-black text-xs sm:text-sm rounded-xl shadow-lg hover:bg-blue-50 transition-all flex items-center space-x-2 shrink-0"
              >
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Validar Código de Segurança</span>
              </button>
            </div>

            {/* GRÁFICO DE BARRAS RECHARTS: DEMONSTRATIVO FINANCEIRO (VALOR BRUTO VS LÍQUIDO APÓS DEDUÇÃO 10%) */}
            <SellerFinancialBarChart orders={storeOrders} currentStore={currentStore} />

            {/* PENDING STOCK CONFIRMATION NOTIFICATIONS */}
            {storeOrders.filter((o) => o.status === 'Aguardando' || o.stockConfirmationStatus === 'PENDING_STORE_CONFIRMATION').length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="font-black text-sm text-amber-900 uppercase tracking-wide">
                    Solicitações de Compra Pendentes de Confirmação ({storeOrders.filter((o) => o.status === 'Aguardando' || o.stockConfirmationStatus === 'PENDING_STORE_CONFIRMATION').length})
                  </h3>
                </div>

                {storeOrders
                  .filter((o) => o.status === 'Aguardando' || o.stockConfirmationStatus === 'PENDING_STORE_CONFIRMATION')
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:p-5 bg-amber-50/90 border-2 border-amber-300 rounded-2xl shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-amber-950 font-mono">
                            🔔 Solicitação de Compra {ord.orderNumber || ord.code}
                          </span>
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Cliente Verificado: ✓</span>
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                          ⏱️ Validade curta (15 minutos)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Produto:</span>
                          <span className="font-bold text-slate-900">{ord.items[0]?.productName || 'Produto'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Quantidade:</span>
                          <span className="font-bold text-slate-900">{ord.items[0]?.quantity || 1} un</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Valor Anunciado:</span>
                          <span className="font-black text-slate-900 text-sm">
                            R$ {(ord.totalAmount ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Modalidade:</span>
                          <span className="font-bold uppercase text-slate-800">{ord.modality}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs font-bold text-amber-950">
                          Você possui este produto disponível para pronta entrega/retirada?
                        </p>
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => confirmOrderStock(ord.id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <span>🟢 CONFIRMAR ESTOQUE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectOrderStock(ord.id)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <span>🔴 SEM ESTOQUE</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Recent Incoming Orders List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900">Últimos Pedidos Recebidos</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  Ver todos ({storeOrders.length})
                </button>
              </div>

              {storeOrders.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhum pedido ainda.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {storeOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {order.code}
                          </span>
                          <span className="text-xs text-slate-400">• {order.createdAt}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                            {order.modality}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">
                          Cliente: {order.customerName} ({order.customerPhone})
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black text-slate-900">
                          R$ {(order.totalAmount ?? (order as any).total ?? 0).toFixed(2).replace('.', ',')}
                        </span>

                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white outline-none"
                        >
                          <option value="Aguardando">Aguardando</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Em Preparo">Em Preparo</option>
                          <option value="Em Rota">Em Rota</option>
                          <option value="Pronto para Retirada">Pronto Retirada</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1.5: FINANCIAL & 10% DEDUCTION VIEW */}
        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Gestão Financeira & Split Automático Asaas
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe em tempo real o valor total bruto vendido, a dedução automática da comissão de 10% da plataforma e o valor líquido repassado para {currentStore.name}.
                </p>
              </div>
            </div>

            <SellerFinancialBarChart orders={storeOrders} currentStore={currentStore} />
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Catálogo de Produtos & Serviços</h2>
                <p className="text-xs text-slate-500">
                  Cadastre, edite preços, estoque, taxas de reserva/sinal e modalidades do seu negócio.
                </p>
              </div>

              <button
                id="btn-add-product"
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Novo Item</span>
              </button>
            </div>

            {/* AVISO DA COTA DO PRESTADOR DE SERVIÇOS (1 INCLUSO A R$ 29,90, R$ 9,90 POR ADICIONAL) */}
            {isPrestador && (
              <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                    🛠️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs sm:text-sm text-blue-950">
                        Regra Oficial do Prestador de Serviços (R$ 29,90/mês)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white uppercase">
                        1 Serviço Incluso
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      {storeProducts.length === 0
                        ? 'Seu plano fixo de R$ 29,90 inclui o cadastro de 1 único serviço. O primeiro serviço cadastrado faz parte da sua mensalidade.'
                        : storeProducts.length === 1
                        ? 'Você já possui o seu 1º serviço incluso ativo. A partir deste momento, será cobrado R$ 9,90/mês por cada serviço adicional cadastrado.'
                        : `Você possui 1 serviço incluso no plano base + ${storeProducts.length - 1} serviço(s) adicional(is) ativo(s) (R$ 9,90/mês cada).`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className="px-3 py-1.5 bg-white border border-blue-300 text-blue-900 rounded-xl text-xs font-black shadow-2xs">
                    {storeProducts.length} / 1 incluso
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        prod.status === 'active'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-500 text-white'
                      }`}
                    >
                      {prod.status === 'active' ? 'Publicado' : 'Pausado'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          prod.itemType === 'SERVICO'
                            ? 'bg-blue-100 text-blue-800'
                            : prod.itemType === 'INSTALACAO'
                            ? 'bg-amber-100 text-amber-800'
                            : prod.itemType === 'MANUTENCAO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {prod.itemType === 'SERVICO'
                            ? '🛠️ Serviço'
                            : prod.itemType === 'INSTALACAO'
                            ? '⚡ Instalação'
                            : prod.itemType === 'MANUTENCAO'
                            ? '🔧 Manutenção'
                            : '📦 Produto'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
                          • {prod.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{prod.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{prod.description}</p>
                      
                      {/* Badges de Taxa / Aluguel */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prod.advanceFeeRequired && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200">
                            Sinal: R$ {(prod.advanceFeeAmount ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        {prod.furnitureActionType && prod.furnitureActionType !== 'BUY' && prod.rentPrice && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200">
                            Aluguel: R$ {prod.rentPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Preço Principal</span>
                        <span className="font-black text-slate-900 text-base">
                          R$ {(prod.price ?? 0).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                          title="Editar e corrigir publicação"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => deleteProduct(prod.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: VALIDATE SECURITY & PICKUP CODE */}
        {activeTab === 'validate-pickup' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Validar Código de Segurança & Entrega</h2>
              <p className="text-xs text-slate-500">
                Digite o código fornecido pelo cliente (Ex: <strong>K7P4X9</strong>, <strong>#58291</strong> ou <strong>RET-8X42K9</strong>) para concluir a venda.
              </p>
            </div>

            <form onSubmit={handleValidateCode} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Código de Segurança / Retirada do Cliente
                </label>
                <input
                  type="text"
                  required
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ex: K7P4X9 ou #58291"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl font-mono text-lg font-black tracking-widest outline-none text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validar Código & Concluir Venda</span>
              </button>
            </form>

            {/* Validation Result Box */}
            {validationResult && (
              <div
                className={`p-5 rounded-2xl border ${
                  validationResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-sm mb-2">
                  {validationResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>{validationResult.success ? 'Código Validado & Venda Concluída!' : 'Atenção'}</span>
                </div>
                <p className="text-xs">{validationResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ORDERS FULL LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-slate-900">Gerenciador Geral de Pedidos & Reservas</h2>
                <p className="text-xs text-slate-500">
                  Acompanhe solicitações de compra, confirmações de estoque e validação por código de segurança.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {storeOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum pedido ou solicitação registrada ainda.
                </div>
              ) : (
                storeOrders.map((ord) => (
                  <div key={ord.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {ord.orderNumber || ord.code}
                        </span>
                        <span className="text-xs text-slate-400">• {ord.createdAt}</span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                          {ord.modality}
                        </span>
                        {ord.clientVerified && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                            Cliente Verificado ✓ {ord.verificationChannel ? `(${ord.verificationChannel})` : ''}
                          </span>
                        )}
                        {ord.securityCode && (
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black font-mono">
                            Cód: {ord.securityCode}
                          </span>
                        )}
                        {ord.stockConfirmationStatus === 'STOCK_CONFIRMED' && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Estoque Confirmado ✓
                          </span>
                        )}
                        {ord.stockConfirmationStatus === 'OUT_OF_STOCK' && (
                          <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold">
                            Sem Estoque
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {ord.status === 'Aguardando' && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => confirmOrderStock(ord.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Confirmar Estoque
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectOrderStock(ord.id)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Sem Estoque
                            </button>
                          </div>
                        )}

                        <select
                          value={ord.status}
                          onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-3 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white outline-none"
                        >
                          <option value="Aguardando">Aguardando</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Em Preparo">Em Preparo</option>
                          <option value="Em Rota">Em Rota</option>
                          <option value="Pronto para Retirada">Pronto para Retirada</option>
                          <option value="Concluído">Concluído</option>
                          <option value="Sem Estoque">Sem Estoque</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    {/* Order items info: Isolates this store's items if multi-store */}
                    {(() => {
                      const myStoreItens = ord.itensPorLojista?.find((l: any) => l.lojistaId === currentStore.id);
                      if (myStoreItens) {
                        return (
                          <div className="text-xs text-slate-700 bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl flex flex-wrap justify-between items-center gap-2">
                            <span>
                              <strong className="text-emerald-900">Seus Itens no Pedido:</strong>{' '}
                              {myStoreItens.itens.map((it: any) => `${it.productName} (x${it.quantity})`).join(', ')}
                            </span>
                            <span className="font-black text-emerald-900 text-sm">
                              Valor Loja: R$ {myStoreItens.subtotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl flex flex-wrap justify-between items-center gap-2">
                          <span>
                            <strong>Itens:</strong> {ord.items.map((it) => `${it.productName} (x${it.quantity})`).join(', ')}
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            Total: R$ {(ord.totalAmount ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      {ord.buyerDataUnlocked ? (
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center space-x-1 text-emerald-800 text-[11px] font-black mb-1">
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Dados do Comprador Liberados ✓</span>
                          </div>
                          <p className="text-xs text-slate-700">
                            <strong>Cliente:</strong> {ord.customerName} | <strong>Telefone:</strong> {ord.customerPhone}
                            {ord.customerEmail && ` | ${ord.customerEmail}`}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-[280px] space-y-1.5">
                          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-xs space-y-2">
                            <div className="flex items-start gap-2 text-amber-950">
                              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-black text-amber-900">
                                  🔒 Dados do comprador protegidos pela plataforma ({MEMBERSHIP_PLANS[currentStore.membershipTier || 'GRATIS'].name})
                                </p>
                                <p className="text-[11px] text-amber-800 leading-snug">
                                  Comissão da venda: <strong>R$ {(ord.commissionAmount ?? 0).toFixed(2).replace('.', ',')}</strong> ({ord.commissionRateApplied}%). Os contatos completos do cliente são liberados assim que a comissão for repassada e confirmada pelo administrador.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                              <span className="text-[10px] text-slate-500 font-semibold">
                                Status: {ord.commissionPaidToPlatform ? 'Comissão Informada (Aguardando Aprovação)' : 'Comissão Pendente'}
                              </span>
                              {ord.commissionPaidToPlatform ? (
                                <span className="px-2.5 py-1 bg-amber-200/80 text-amber-900 rounded-lg text-[11px] font-black flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Repasse Informado ao Master</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPixCommissionModalOrder(ord)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>Pagar Comissão via PIX (R$ {(ord.commissionAmount ?? 12.00).toFixed(2).replace('.', ',')})</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 pl-1">
                            <strong>Cliente:</strong> {ord.customerName ? ord.customerName.slice(0, 3) + '***' : 'Comprador'} | <strong>Telefone:</strong> (21) 9****-****
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 shrink-0">
                        {ord.status !== 'Concluído' && ord.status !== 'Cancelado' && ord.status !== 'Sem Estoque' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (ord.securityCode) {
                                setPickupCodeInput(ord.securityCode);
                                setActiveTab('validate-pickup');
                              }
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center space-x-1 border border-blue-200 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Validar Código</span>
                          </button>
                        )}

                        {ord.status === 'Concluído' && (
                          isOrderReviewedByMerchant(ord.id) ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Conduta Avaliada</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setReviewingOrderForCustomer(ord)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                            >
                              <Star className="w-3.5 h-3.5 fill-white" />
                              <span>Avaliar Conduta do Cliente</span>
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const subId = (ord as any).subpedidos?.[0]?.id || `sub-${ord.id}`;
                            const subCode = (ord as any).subpedidos?.[0]?.codigoSubpedido || `#${ord.orderNumber || ord.code}-A`;
                            openSubOrderChat({
                              subpedidoId: subId,
                              pedidoPrincipalId: ord.id,
                              codigoSubpedido: subCode,
                              merchantId: currentStore?.id,
                              merchantName: currentStore?.name,
                              customerId: ord.customerId,
                              customerName: ord.customerName,
                              customerPhone: ord.customerPhone,
                              orderTitle: ord.items?.[0]?.product?.name || `Pedido ${ord.code}`,
                              orderStatus: ord.status,
                              securityCode: ord.securityCode || ord.pickupCode,
                              orderTotal: ord.totalAmount ?? (ord as any).total
                            });
                          }}
                          className="relative px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors border border-emerald-300 active:scale-95 shadow-2xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mensagem Interna</span>
                          {(() => {
                            const unread = getUnreadSubOrderMessagesCount(
                              (ord as any).subpedidos?.[0]?.id || `sub-${ord.id}`,
                              currentUser?.id
                            );
                            if (unread > 0) {
                              return (
                                <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                                  {unread}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>Endereço / Destino:</strong> {ord.buyerDataUnlocked ? (ord.customerAddress || 'Retirada no Balcão') : 'Endereço protegido pela plataforma'}
                    </p>

                    {/* Delivery Achei Aqui V1 Integration */}
                    {(() => {
                      const linkedRide = deliveryRides.find(
                        (r) => r.orderId === ord.id || (ord.deliveryRideId && r.id === ord.deliveryRideId)
                      );

                      if (linkedRide) {
                        return (
                          <div className="mt-2 p-3 bg-gradient-to-r from-emerald-950/10 via-teal-950/5 to-slate-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Bike className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono font-black text-slate-900">{linkedRide.rideCode}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    linkedRide.status === 'FINALIZADA'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : linkedRide.status === 'AGUARDANDO_ENTREGADOR'
                                      ? 'bg-amber-100 text-amber-900 animate-pulse'
                                      : 'bg-blue-100 text-blue-900'
                                  }`}>
                                    ● {linkedRide.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  {linkedRide.status === 'AGUARDANDO_ENTREGADOR' && 'Procurando entregadores credenciados online no radar de Cachoeiras de Macacu...'}
                                  {linkedRide.status === 'ACEITA' && `Entregador a caminho da loja: ${linkedRide.driverName} (${linkedRide.driverVehiclePlate})`}
                                  {linkedRide.status === 'EM_COLETA' && `Entregador conferindo pacote na loja: ${linkedRide.driverName}`}
                                  {linkedRide.status === 'EM_TRANSITO' && `Entregador em trânsito para a entrega: ${linkedRide.driverName}`}
                                  {linkedRide.status === 'FINALIZADA' && 'Corrida finalizada com confirmação de código ✓'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 text-right">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold block">Distância / Frete</span>
                                <span className="font-black text-slate-900 text-xs">
                                  {linkedRide.distanceKm.toFixed(1)} km • R$ {linkedRide.totalFare.toFixed(2).replace('.', ',')}
                                </span>
                              </div>

                              {['AGUARDANDO_ENTREGADOR', 'ACEITA'].includes(linkedRide.status) && (
                                <button
                                  type="button"
                                  onClick={() => cancelDeliveryRide(linkedRide.id, 'Cancelado pelo lojista antes do despacho')}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition-colors border border-red-200 cursor-pointer"
                                >
                                  Cancelar Delivery
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (ord.status !== 'Cancelado' && ord.status !== 'Sem Estoque') {
                        return (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                              Precisa de entregador para despachar este pedido em Cachoeiras de Macacu?
                            </span>
                            <button
                              type="button"
                              onClick={() => setRequestDeliveryOrder(ord)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>Solicitar Delivery Achei Aqui</span>
                            </button>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: APPOINTMENTS & SERVICES */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Agendamentos, Consultas & Provador
                </h2>
                <p className="text-xs text-slate-500">
                  Responda com agilidade para confirmar horários, propor reagendamentos e enviar orientações transparentes aos clientes.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('schedule')}
                className="px-4 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
              >
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Configurar Minha Agenda & Preços</span>
              </button>
            </div>

            <div className="space-y-4">
              {storeOrders
                .filter((o) => o.modality === 'AGENDAMENTO' || o.modality === 'EXPERIMENTAÇÃO')
                .length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Nenhum agendamento recebido ainda.</p>
                  <p className="text-xs text-slate-400 mt-1">Configure seus horários vagos e tabela de preços na aba "Agenda & Preços" para atrair mais clientes locais.</p>
                </div>
              ) : (
                storeOrders
                  .filter((o) => o.modality === 'AGENDAMENTO' || o.modality === 'EXPERIMENTAÇÃO')
                  .map((booking) => {
                    const resp = booking.serviceDetails?.merchantResponse;
                    const isPending = !resp || resp.status === 'PENDENTE' || booking.status === 'Pendente';
                    const isConfirmed = resp?.status === 'CONFIRMADO' || booking.status === 'Confirmado';
                    const isRescheduled = resp?.status === 'REAGENDADO';
                    const isCompleted = booking.status === 'Concluído' || resp?.status === 'CONCLUIDO';
                    const isCancelled = booking.status === 'Cancelado' || resp?.status === 'RECUSADO';

                    return (
                      <div
                        key={booking.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-slate-900">{booking.code}</span>
                            <span className="text-xs text-slate-400">• {booking.createdAt}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                              {booking.modality}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isConfirmed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRescheduled
                                  ? 'bg-amber-100 text-amber-800'
                                  : isCompleted
                                  ? 'bg-blue-100 text-blue-800'
                                  : isCancelled
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-50 text-amber-900 border border-amber-300 font-black'
                              }`}
                            >
                              ● {isConfirmed ? 'Confirmado' : isRescheduled ? 'Reagendado' : isCompleted ? 'Concluído' : isCancelled ? 'Cancelado' : 'Aguardando Sua Resposta'}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Service Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Dados do Cliente</span>
                            <div className="font-bold text-slate-900 text-sm">{booking.customerName}</div>
                            <div className="text-slate-600">WhatsApp: <strong>{booking.customerPhone}</strong></div>
                            <div className="text-slate-600 truncate">Local / Endereço: {booking.customerAddress || 'No Estabelecimento'}</div>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Serviço Solicitado</span>
                            <div className="font-bold text-blue-700 text-sm">
                              {booking.serviceDetails?.serviceTitle || booking.items[0]?.name || 'Atendimento Personalizado'}
                            </div>
                            <div className="text-slate-700 font-medium">
                              Horário Solicitado: <strong>{booking.serviceDetails?.scheduledDate || booking.trialDetails?.date} às {booking.serviceDetails?.scheduledTime || booking.trialDetails?.time}</strong>
                            </div>
                            <div className="text-slate-700 font-bold">
                              Valor Previsto: R$ {(booking.totalAmount || 0).toFixed(2).replace('.', ',')}
                              {booking.serviceDetails?.pricingTypeSelected && (
                                <span className="text-[10px] text-slate-500 font-normal ml-1">
                                  ({booking.serviceDetails.pricingTypeSelected})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Customer Notes */}
                        {booking.serviceDetails?.customerNotes && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 space-y-1">
                            <strong className="block text-[11px] font-bold">💬 Observação / Sintoma informado pelo cliente:</strong>
                            <span>{booking.serviceDetails.customerNotes}</span>
                          </div>
                        )}

                        {/* Existing Response Display */}
                        {resp && resp.status !== 'PENDENTE' && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1.5">
                            <div className="flex items-center justify-between font-bold">
                              <span>Sua Resposta Registrada no Perfil do Cliente:</span>
                              <span className="text-[10px] opacity-75">{resp.respondedAt}</span>
                            </div>
                            <p className="font-medium italic">"{resp.responseMessage}"</p>
                            {resp.instructionsForCustomer && (
                              <p className="text-[11px] text-blue-800">
                                <strong>Orientações enviadas:</strong> {resp.instructionsForCustomer}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              const subId = (booking as any).subpedidos?.[0]?.id || `sub-${booking.id}`;
                              const subCode = (booking as any).subpedidos?.[0]?.codigoSubpedido || `#${booking.code}-A`;
                              openSubOrderChat({
                                subpedidoId: subId,
                                pedidoPrincipalId: booking.id,
                                codigoSubpedido: subCode,
                                merchantId: currentStore?.id,
                                merchantName: currentStore?.name,
                                customerId: booking.customerId,
                                customerName: booking.customerName,
                                customerPhone: booking.customerPhone,
                                orderTitle: booking.serviceDetails?.serviceTitle || `Agendamento #${booking.code}`,
                                orderStatus: booking.status,
                                securityCode: booking.securityCode,
                                orderTotal: booking.totalAmount
                              });
                            }}
                            className="relative px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-emerald-300 transition-colors active:scale-95 shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mensagem Interna</span>
                            {(() => {
                              const unread = getUnreadSubOrderMessagesCount(
                                (booking as any).subpedidos?.[0]?.id || `sub-${booking.id}`,
                                currentUser?.id
                              );
                              if (unread > 0) {
                                return (
                                  <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse">
                                    {unread}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </button>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setRespondingAppointment(booking)}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{resp && resp.status !== 'PENDENTE' ? 'Atualizar Resposta / Orientações' : 'Responder & Confirmar Agendamento'}</span>
                            </button>

                            {booking.status === 'Concluído' && (
                              isOrderReviewedByMerchant(booking.id) ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Conduta Avaliada</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setReviewingOrderForCustomer(booking)}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-all"
                                >
                                  <Star className="w-3.5 h-3.5 fill-white" />
                                  <span>Avaliar Conduta</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB: SCHEDULE & SERVICE PRICING TRANSPARENCY */}
        {activeTab === 'schedule' && currentStore && (
          <div className="space-y-6">
            <MerchantScheduleManager
              merchant={currentStore}
              onSave={(updatedMerchant) => {
                updateStoreProfile(updatedMerchant.id, updatedMerchant);
                triggerToast('Configurações de agenda, preços e credenciais salvas com sucesso!');
              }}
            />
          </div>
        )}

        {/* TAB: REVIEWS & REPUTATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Avaliações & Reputação da Loja
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe os depoimentos e critérios avaliados pelos clientes de Cachoeiras de Macacu e responda publicamente.
                </p>
              </div>

              <button
                onClick={() => openPolicyModal('merchant')}
                className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Política de Avaliações</span>
              </button>
            </div>

            <ReviewsList
              reviews={storeReviews}
              merchantId={currentStore?.id}
              merchantName={currentStore?.name}
              isMerchantOwner={true}
              onReplyReview={(reviewId, replyText) => {
                replyToCustomerReview(reviewId, replyText, currentStore?.name || 'Lojista');
              }}
              onOpenPolicy={() => openPolicyModal('merchant')}
            />
          </div>
        )}

        {/* TAB: STORE PROFILE & VISUAL IDENTITY */}
        {activeTab === 'settings' && currentStore && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-6 h-6 text-emerald-600" />
                  <span>Perfil & Identidade Visual do Estabelecimento</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Atualize sua marca, fotos do estabelecimento direto do celular ou computador, informações de contato e frete em Cachoeiras de Macacu.
                </p>
              </div>

              <button
                onClick={() => { setCurrentEnvironment('MARKETPLACE');  }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span>Ver Minha Loja no Guia</span>
              </button>
            </div>

            <form onSubmit={handleSaveStoreProfile} className="space-y-6">
              {/* SECTION: FOTOS E IDENTIDADE VISUAL */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Fotos & Identidade Visual (Upload do PC ou Smartphone)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Insira imagens diretamente do seu computador ou tire fotos na hora com a câmera do seu smartphone.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LOGO UPLOAD */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Logotipo / Foto de Perfil da Loja *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Exibido no cabeçalho do perfil, avatar nas buscas e sacola de compras.
                    </p>
                    <ImageUploadDropzone
                      multiple={false}
                      aspectRatio="circle"
                      value={storeLogo}
                      onChange={(img) => setStoreLogo(img as string)}
                      label="Alterar Logotipo da Loja"
                      helperText="Arraste ou selecione do computador/celular"
                    />
                  </div>

                  {/* BANNER / CAPA UPLOAD */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Banner / Capa Panorâmica da Loja *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Exibido no topo da página da sua loja no marketplace para atrair clientes.
                    </p>
                    <ImageUploadDropzone
                      multiple={false}
                      aspectRatio="banner"
                      value={storeBanner}
                      onChange={(img) => setStoreBanner(img as string)}
                      label="Alterar Capa da Loja"
                      helperText="Foto da fachada, balcão ou banner promocional"
                    />
                  </div>
                </div>

                {/* GALERIA DE FOTOS DO ESTABELECIMENTO / OFICINA / PORTFÓLIO */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Galeria de Fotos do Estabelecimento / Oficina / Portfólio (Até 8 Fotos)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Envie várias fotos do ambiente físico, consultório, equipe, estoque ou serviços finalizados. Clientes adoram ver a estrutura local antes de comprar ou agendar.
                  </p>
                  <ImageUploadDropzone
                    multiple={true}
                    maxImages={8}
                    aspectRatio="square"
                    value={storeGallery}
                    onChange={(imgs) => setStoreGallery(imgs as string[])}
                    label="Adicionar Fotos à Galeria da Loja"
                    helperText="Adicione várias fotos do computador ou tire fotos pelo smartphone"
                  />
                </div>
              </div>

              {/* SECTION: DADOS CADASTRAIS & CONTATO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Dados Cadastrais & Informações Comerciais</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Informações exibidas publicamente aos clientes em Cachoeiras de Macacu.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Comercial da Loja / Prestador *
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome do Responsável / Titular *
                    </label>
                    <input
                      type="text"
                      required
                      value={storeOwnerName}
                      onChange={(e) => setStoreOwnerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria Principal
                    </label>
                    <input
                      type="text"
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subcategoria / Especialidades
                    </label>
                    <input
                      type="text"
                      value={storeSubcategory}
                      onChange={(e) => setStoreSubcategory(e.target.value)}
                      placeholder="Ex: Confecções, Eletricista, Odontologia..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp Comercial *
                    </label>
                    <input
                      type="text"
                      required
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="(21) 99999-9999"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CNPJ ou CPF (Opcional para verificação)
                    </label>
                    <input
                      type="text"
                      value={storeCnpjOrCpf}
                      onChange={(e) => setStoreCnpjOrCpf(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descrição do Estabelecimento / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Conte sobre sua loja, tradição em Cachoeiras de Macacu, diferenciais e marcas trabalhadas..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Endereço (Rua e Número) *
                    </label>
                    <input
                      type="text"
                      required
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Av. Floriano Peixoto, 120"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bairro em Cachoeiras
                    </label>
                    <input
                      type="text"
                      value={storeNeighborhood}
                      onChange={(e) => setStoreNeighborhood(e.target.value)}
                      placeholder="Centro, Papucaia, Guapiaçu..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: MODALIDADES E ATENDIMENTO */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    {currentStore?.isServiceProvider ? (
                      <>
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>Políticas de Atendimento & Decisão de Botões do Prestador</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span>Políticas de Atendimento, Horários & Frete</span>
                      </>
                    )}
                  </h3>
                </div>

                {currentStore?.isServiceProvider ? (
                  /* Prestador de serviços: Horários e Tempo de Atendimento (Sem botões/campos de entrega grátis ou frete) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Horário de Atendimento
                      </label>
                      <input
                        type="text"
                        value={storeOpeningHours}
                        onChange={(e) => setStoreOpeningHours(e.target.value)}
                        placeholder="Seg a Sex: 08h às 18h / Sáb: 08h às 12h"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Duração Estimada por Atendimento
                      </label>
                      <input
                        type="text"
                        value={storeDeliveryTime}
                        onChange={(e) => setStoreDeliveryTime(e.target.value)}
                        placeholder="Ex: 50 min ou 1h a 2h"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  /* Lojista comercial: Horários, Frete e Tempo de Entrega */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Horário de Funcionamento
                      </label>
                      <input
                        type="text"
                        value={storeOpeningHours}
                        onChange={(e) => setStoreOpeningHours(e.target.value)}
                        placeholder="Seg a Sáb: 08h às 18h"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Taxa de Entrega Padrão (R$)
                      </label>
                      <input
                        type="text"
                        value={storeDeliveryFee}
                        onChange={(e) => setStoreDeliveryFee(e.target.value)}
                        placeholder="0,00 (Grátis) ou 8,00"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tempo Estimado de Entrega
                      </label>
                      <input
                        type="text"
                        value={storeDeliveryTime}
                        onChange={(e) => setStoreDeliveryTime(e.target.value)}
                        placeholder="30-50 min"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* MODALIDADES ACEITAS & BOTÕES EXIBIDOS */}
                {currentStore?.isServiceProvider ? (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-900">
                        Seleção de Botões & Modalidades Exibidas (Decisão do Prestador):
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Defina quais botões e opções de atendimento seus clientes verão nos cards e na sua página:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Botão Agendar */}
                      <label className={`flex items-start space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        serviceButtonsConfig.showSchedule !== false
                          ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={serviceButtonsConfig.showSchedule !== false}
                          onChange={(e) =>
                            setServiceButtonsConfig((prev) => ({ ...prev, showSchedule: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Botão "Agendar" (Direciona para Agendamento)</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Substitui "Comprar" por "Agendar" nos cards de apresentação.
                          </p>
                        </div>
                      </label>

                      {/* Atendimento a Domicílio */}
                      <label className={`flex items-start space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        serviceButtonsConfig.showHomeService !== false
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={serviceButtonsConfig.showHomeService !== false}
                          onChange={(e) =>
                            setServiceButtonsConfig((prev) => ({ ...prev, showHomeService: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Botão / Opção "Atendimento a domicílio"</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Informa que você atende na residência ou local do cliente.
                          </p>
                        </div>
                      </label>

                      {/* Atendimento na Loja */}
                      <label className={`flex items-start space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        serviceButtonsConfig.showStoreService !== false
                          ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={serviceButtonsConfig.showStoreService !== false}
                          onChange={(e) =>
                            setServiceButtonsConfig((prev) => ({ ...prev, showStoreService: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Botão / Opção "Atendimento na loja"</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Informa atendimento presencial no seu consultório ou loja física.
                          </p>
                        </div>
                      </label>

                      {/* Solicitar Orçamento */}
                      <label className={`flex items-start space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        serviceButtonsConfig.showQuote !== false
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={serviceButtonsConfig.showQuote !== false}
                          onChange={(e) =>
                            setServiceButtonsConfig((prev) => ({ ...prev, showQuote: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                            <span>Botão "Solicitar Orçamento"</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Habilita botão para o cliente solicitar proposta sob medida.
                          </p>
                        </div>
                      </label>

                      {/* Chat Direto */}
                      <label className={`flex items-start space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer sm:col-span-2 ${
                        serviceButtonsConfig.showChat !== false
                          ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="checkbox"
                          checked={serviceButtonsConfig.showChat !== false}
                          onChange={(e) =>
                            setServiceButtonsConfig((prev) => ({ ...prev, showChat: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                            <span>Botão "Chat com o Prestador"</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                            Exibe botão de chat interno direto nos cards para tirar dúvidas.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Modalidades de Atendimento Habilitadas na Loja:
                    </label>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={storeSupportsPickup}
                          onChange={(e) => setStoreSupportsPickup(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-slate-700">Retirada no Balcão com Código</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={storeSupportsAppointments}
                          onChange={(e) => setStoreSupportsAppointments(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-700">Agendamento de Horário / Visitas</span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100">
                        <input
                          type="checkbox"
                          checked={storeSupportsTrial}
                          onChange={(e) => setStoreSupportsTrial(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-semibold text-slate-700">Experimentação / Provador em Casa (Moda)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: STATUS DO CHAT INTERNO COM CLIENTES */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Chat Interno com Clientes (Atendimento Direto)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Defina se os clientes podem abrir conversas e tirar dúvidas diretamente com você pelos produtos e pelo perfil da sua loja.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto flex items-center space-x-1.5 ${
                      storeAllowDirectChat
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    <span>{storeAllowDirectChat ? '● Chat Ativado' : '○ Chat Desativado'}</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all bg-slate-50 border-slate-200">
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Disponibilidade do Chat Interno no Marketplace
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                      {storeAllowDirectChat
                        ? 'O botão de Chat Interno está VISÍVEL nos seus produtos cadastrados e no perfil da loja. Clientes podem enviar mensagens, dúvidas de estoque ou especificações técnicas.'
                        : 'O botão de Chat Interno está OCULTO e INDISPONÍVEL para os clientes nesta loja e em todos os seus produtos cadastrados. Útil para períodos de recesso, reformas ou folgas.'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      type="button"
                      id="toggle-seller-direct-chat"
                      onClick={() => handleToggleDirectChat()}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        storeAllowDirectChat ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      role="switch"
                      aria-checked={storeAllowDirectChat}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          storeAllowDirectChat ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-black text-slate-700 w-24">
                      {storeAllowDirectChat ? 'Ativado' : 'Desativado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: INTEGRAÇÃO FINANCEIRA ASAAS & SPLIT DE PAGAMENTOS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Integração Financeira Asaas (Split Automático de 90%)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure sua Subconta Asaas para receber automaticamente 90% do valor de cada venda via Pix ou Cartão no marketplace, já com os 10% da plataforma separados pelo Asaas.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto flex items-center space-x-1.5 ${
                      storeAsaasWalletId
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <span>{storeAsaasWalletId ? '● Subconta Conectada' : '○ Pendente de Vínculo'}</span>
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Wallet ID do Lojista no Asaas (Chave da Carteira)
                      </label>
                      <input
                        type="text"
                        value={storeAsaasWalletId}
                        onChange={(e) => setStoreAsaasWalletId(e.target.value)}
                        placeholder="wallet_lojista_exemplo"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Identificador da carteira Asaas que receberá o repasse líquido de 90%.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ID da Subconta Asaas (Opcional)
                      </label>
                      <input
                        type="text"
                        value={storeAsaasAccountId}
                        onChange={(e) => setStoreAsaasAccountId(e.target.value)}
                        placeholder="sub_acc_exemplo"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Código de registro da subconta cadastrada na API do Asaas.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        A liquidação de 90% cai direto na sua subconta Asaas com segurança bancária.
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isCreatingAsaasSubaccount}
                      onClick={handleRegisterAsaasSubaccount}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isCreatingAsaasSubaccount ? 'animate-spin' : ''}`} />
                      <span>
                        {isCreatingAsaasSubaccount
                          ? 'Cadastrando no Asaas...'
                          : storeAsaasWalletId
                          ? 'Recriar / Atualizar Subconta'
                          : 'Criar Subconta Asaas Automaticamente'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações do Perfil da Loja</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT PRODUCT / SERVICE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                  {editingProduct ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                  <span>{editingProduct ? 'Editar Publicação do Item' : 'Cadastrar Novo Item no Marketplace'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingProduct
                    ? 'Altere preços, estoque, sinais e modalidades do item publicado'
                    : 'Produtos físicos, serviços, móveis, locações ou veículos'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 text-xs">
              {/* Seletor de Tipo de Item */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Classificação do que você está anunciando: *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewProdItemType('SERVICO');
                      setNewProdCategory('prestadores-de-servicos');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                      newProdItemType === 'SERVICO'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">🛠️</span>
                    <span className="text-[11px] leading-tight">Serviço</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewProdItemType('INSTALACAO');
                      setNewProdCategory('instalacoes');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                      newProdItemType === 'INSTALACAO'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">âš¡</span>
                    <span className="text-[11px] leading-tight">Instalação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewProdItemType('MANUTENCAO');
                      setNewProdCategory('reparos');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                      newProdItemType === 'MANUTENCAO'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">🔧</span>
                    <span className="text-[11px] leading-tight">Manutenção</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewProdItemType('PRODUTO_FISICO');
                      setNewProdCategory('moda');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                      newProdItemType === 'PRODUTO_FISICO'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">📦</span>
                    <span className="text-[11px] leading-tight">Produto / Item</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {newProdItemType === 'PRODUTO_FISICO' ? 'Nome do Produto / Item *' : 'Título do Serviço / Instalação / Reparo *'}
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder={
                    newProdItemType === 'SERVICO'
                      ? 'Ex: Serviço de Eletricista Residencial / Troca de Fiação'
                      : newProdItemType === 'INSTALACAO'
                      ? 'Ex: Instalação e Montagem de Equipamentos Diversos'
                      : newProdItemType === 'MANUTENCAO'
                      ? 'Ex: Manutenção Preventiva e Conserto de Ar-Condicionado'
                      : 'Ex: Sofá Retrátil 3 Lugares / Ração Golden 15kg'
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {newProdItemType === 'PRODUTO_FISICO' ? 'Preço de Venda (R$) *' : 'Valor do Serviço / Orçamento (R$) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="89,90"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço Anterior De R$ (Opcional - Riscado)
                  </label>
                  <input
                    type="text"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    placeholder="120,00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria no Marketplace
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  >
                    <optgroup label="Prestadores & Especialidades">
                      <option value="prestadores-de-servicos">🛠️ Prestadores de Serviços</option>
                      <option value="instalacoes">⚡ Instalação & Manutenção de Equipamentos</option>
                      <option value="reparos">🔧 Reparos Rápidos & Consertos</option>
                      <option value="consultorios">🩺 Consultórios & Saúde</option>
                      <option value="beleza">✂️ Beleza & Estética</option>
                    </optgroup>
                    <optgroup label="Comércio & Aluguéis">
                      <option value="moveis-locacoes">🛋️ Móveis & Locações</option>
                      <option value="veiculos">🚗 Veículos & Automotivo</option>
                      <option value="petshop">🐾 Petshop & Animais</option>
                      <option value="gastronomia">🍔 Gastronomia & Delivery</option>
                      <option value="moda">👗 Moda & Vestuário</option>
                      <option value="eletronicos">💻 Celulares & Tecnologia</option>
                      <option value="mercado">🛒 Supermercado & Variedades</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subcategoria / Especialidade
                  </label>
                  <input
                    type="text"
                    value={newProdSubcategory}
                    onChange={(e) => setNewProdSubcategory(e.target.value)}
                    placeholder="Ex: Instalação e manutenção de equipamentos diversos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* SEÇÃO: MÓVEIS E LOCAÇÕES */}
              {(newProdCategory === 'moveis-locacoes' || newProdCategory.includes('moveis') || newProdCategory.includes('locac')) && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <span>🛋️ Opções de Aluguel e Compra</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 mb-1">Botões Exibidos</label>
                      <select
                        value={furnitureActionType}
                        onChange={(e) => setFurnitureActionType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                      >
                        <option value="BOTH">Alugar e Comprar (Ambos)</option>
                        <option value="RENT">Apenas Alugar</option>
                        <option value="BUY">Apenas Comprar</option>
                      </select>
                    </div>
                    {furnitureActionType !== 'BUY' && (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold text-blue-800 mb-1">Valor do Aluguel (R$)</label>
                          <input
                            type="text"
                            value={rentPrice}
                            onChange={(e) => setRentPrice(e.target.value)}
                            placeholder="45,00"
                            className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs outline-none font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-blue-800 mb-1">Período de Aluguel</label>
                          <select
                            value={rentPeriod}
                            onChange={(e) => setRentPeriod(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs outline-none"
                          >
                            <option value="DIA">Por Dia</option>
                            <option value="SEMANA">Por Semana</option>
                            <option value="MES">Por Mês</option>
                            <option value="EVENTO">Por Evento</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SEÇÃO: VEÍCULOS */}
              {(newProdCategory === 'veiculos' || newProdCategory.includes('veicul') || newProdCategory.includes('auto')) && (
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                  <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span>🚗 Informações do Veículo & Agendamento</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">Botões de Ação</label>
                      <select
                        value={vehicleActionType}
                        onChange={(e) => setVehicleActionType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs outline-none"
                      >
                        <option value="BOTH">Reservar Agora e Agendar Visita</option>
                        <option value="RESERVE">Apenas Reservar Agora</option>
                        <option value="VISIT">Apenas Agendar Visita</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">Ano de Fabricação</label>
                      <input
                        type="text"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        placeholder="Ex: 2022/2023"
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">Quilometragem</label>
                      <input
                        type="text"
                        value={vehicleKm}
                        onChange={(e) => setVehicleKm(e.target.value)}
                        placeholder="Ex: 42.000 km"
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SEÇÃO: COBRANÇA DE TAXA / SINAL DE RESERVA / AGENDAMENTO */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advanceFeeRequired}
                      onChange={(e) => setAdvanceFeeRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                    />
                    <span className="font-bold text-amber-950 text-xs">
                      Cobrar Taxa de Reserva / Sinal Antecipado por PIX
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-amber-800">
                  Ideal para garantir horários de agendamentos, segurar reservas de produtos ou sinal para deslocamento.
                </p>

                {advanceFeeRequired && (
                  <div className="space-y-3 pt-2 border-t border-amber-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">
                          Valor da Taxa / Sinal em R$ *
                        </label>
                        <input
                          type="text"
                          required={advanceFeeRequired}
                          value={advanceFeeAmount}
                          onChange={(e) => setAdvanceFeeAmount(e.target.value)}
                          placeholder="Ex: 30,00"
                          className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs outline-none font-bold text-amber-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">
                          Tipo de Chave PIX *
                        </label>
                        <select
                          value={pixKeyType}
                          onChange={(e) => setPixKeyType(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs outline-none"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                          <option value="TELEFONE">Telefone Celular</option>
                          <option value="EMAIL">E-mail</option>
                          <option value="ALEATORIA">Chave Aleatória (EVP)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">
                          Chave PIX do Recebedor *
                        </label>
                        <input
                          type="text"
                          required={advanceFeeRequired}
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          placeholder="Ex: 21999998888 ou email@loja.com"
                          className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">
                          Nome do Titular / Favorecido *
                        </label>
                        <input
                          type="text"
                          required={advanceFeeRequired}
                          value={pixBeneficiaryName}
                          onChange={(e) => setPixBeneficiaryName(e.target.value)}
                          placeholder="Ex: David Telecom ME / David da Silva"
                          className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {newProdItemType === 'PRODUTO_FISICO' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantidade em Estoque
                    </label>
                    <input
                      type="number"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tempo Estimado de Execução
                    </label>
                    <input
                      type="text"
                      value={newProdEstimatedDuration}
                      onChange={(e) => setNewProdEstimatedDuration(e.target.value)}
                      placeholder="Ex: 1 a 2 horas"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                )}

                {newProdItemType !== 'PRODUTO_FISICO' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Garantia do Serviço (dias)
                    </label>
                    <input
                      type="number"
                      value={newProdWarrantyDays}
                      onChange={(e) => setNewProdWarrantyDays(e.target.value)}
                      placeholder="90"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Garantia do Produto (dias)
                    </label>
                    <input
                      type="number"
                      value={newProdWarrantyDays}
                      onChange={(e) => setNewProdWarrantyDays(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <ImageUploadDropzone
                  multiple={true}
                  maxImages={6}
                  aspectRatio="square"
                  value={newProdImages}
                  onChange={(imgs) => setNewProdImages(imgs as string[])}
                  label={newProdItemType === 'PRODUTO_FISICO' ? 'Fotos do Produto (Upload do PC ou Câmera do Celular)' : 'Fotos do Serviço / Portfólio (Upload do PC ou Câmera do Celular)'}
                  helperText="A primeira foto será a capa principal. Você pode adicionar até 6 fotos direto do celular ou do computador."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição & O que está incluso
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Detalhes completos, termos de garantia, materiais inclusos, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Modalities allowed for this product */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Modalidades de Atendimento Habilitadas:
                </label>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowAppointment}
                      onChange={(e) => setAllowAppointment(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>{newProdItemType === 'SERVICO' ? 'Agendamento de Horário' : 'Atendimento / Visita com Agendamento'}</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDelivery}
                      onChange={(e) => setAllowDelivery(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>{newProdItemType === 'SERVICO' ? 'Atendimento a domicílio' : 'Entrega / Atendimento a Domicílio'}</span>
                  </label>

                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPickup}
                      onChange={(e) => setAllowPickup(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>{newProdItemType === 'SERVICO' ? 'Atendimento na loja' : 'Retirada / Balcão da Loja'}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 ${
                  editingProduct
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                }`}
              >
                {editingProduct ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>
                  {editingProduct
                    ? 'Salvar Alterações e Atualizar Publicação'
                    : newProdItemType === 'PRODUTO_FISICO'
                    ? 'Publicar Produto no Marketplace'
                    : 'Publicar Serviço / Especialidade no Marketplace'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MERCHANT REVIEW FOR CUSTOMER */}
      {reviewingOrderForCustomer && (
        <MerchantReviewModal
          isOpen={!!reviewingOrderForCustomer}
          onClose={() => setReviewingOrderForCustomer(null)}
          order={reviewingOrderForCustomer}
          merchantName={currentStore?.name || 'Lojista'}
          merchantOwnerName={currentUser?.name || currentStore?.ownerName}
          onSubmitReview={(reviewData) => {
            addMerchantReview(reviewData);
            setReviewingOrderForCustomer(null);
          }}
          onOpenPolicy={() => openPolicyModal('merchant')}
        />
      )}

      {/* MODAL: APPOINTMENT RESPONSE & CONFIRMATION */}
      {respondingAppointment && (
        <AppointmentResponseModal
          isOpen={!!respondingAppointment}
          onClose={() => setRespondingAppointment(null)}
          order={respondingAppointment}
          merchantName={currentStore?.name || 'Prestador de Serviços'}
          merchantOwnerName={currentUser?.name || currentStore?.ownerName}
          onRespondSuccess={(updatedOrder) => {
            // Updated in context via updateOrderStatus or similar
            setRespondingAppointment(null);
          }}
        />
      )}

      {/* MODAL: PIX COMMISSION PAYMENT MODAL */}
      {pixCommissionModalOrder && (
        <PixPaymentModal
          isOpen={!!pixCommissionModalOrder}
          onClose={() => setPixCommissionModalOrder(null)}
          title={`Comissão de Venda — Pedido #${pixCommissionModalOrder.orderNumber || pixCommissionModalOrder.code}`}
          subtitle="Pagamento da comissão da plataforma para liberação dos dados de contato e entrega do comprador."
          amount={pixCommissionModalOrder.commissionAmount || 12.00}
          paymentType="ORDER_COMMISSION"
          orderId={pixCommissionModalOrder.id}
          currentTierName={MEMBERSHIP_PLANS[currentStore?.membershipTier || 'GRATIS'].name}
          onConfirmSuccess={() => {
            payOrderCommissionByMerchant(pixCommissionModalOrder.id);
            setPixCommissionModalOrder(null);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL OFICIAL: TAXA DE SERVIÇO ADICIONAL DO PRESTADOR (R$ 9,90 VIA PIX) */}
      {/* ========================================================================= */}
      {extraServicePixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* HEADER */}
            <div className="bg-linear-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 relative">
              <button
                onClick={() => setExtraServicePixModal(null)}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Cancelar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                  Taxa de Serviço Adicional
                </span>
                <span className="text-[10px] text-blue-200">
                  CNPJ: 30810800000139
                </span>
              </div>

              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <QrCode className="w-6 h-6 text-amber-300" />
                Ativação do Serviço Adicional nº {extraServicePixModal.serviceIndex}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                O plano fixo de Prestador (R$ 29,90) inclui 1 único serviço. Para ativar este novo serviço, efetue o pagamento do valor de R$ 9,90 via PIX do sistema.
              </p>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-5">
              {/* CARD DETALHES */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Serviço a Cadastrar:</span>
                  <span className="font-black text-slate-900">{extraServicePixModal.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Condição do Plano:</span>
                  <span className="font-bold text-slate-700">1º Serviço incluso + Adicional</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Valor da Taxa Adicional:</span>
                  <span className="text-xl font-black text-blue-700">
                    R$ {extraServicePixModal.amount.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* QR CODE DISPLAY */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                <img
                  src={extraServicePixModal.qrCodeUrl}
                  alt="QR Code Pix do Sistema"
                  className="w-48 h-48 rounded-xl bg-white p-2 shadow-xs border border-slate-200"
                />
                <span className="text-[11px] font-bold text-slate-700 mt-2">
                  Beneficiário: Bex Serviços e Comércios, CNPJ 30.810.800/0001-39
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Chave Pix CNPJ: 30810800000139
                </span>
              </div>

              {/* COPIA E COLA */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Código Pix Copia e Cola:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={extraServicePixModal.pixCopiaECola}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-mono text-slate-700 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(extraServicePixModal.pixCopiaECola);
                      setCopiedExtraServicePix(true);
                      setTimeout(() => setCopiedExtraServicePix(false), 2000);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedExtraServicePix ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExtraServicePixModal(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  addProduct(extraServicePixModal.productPayload);
                  triggerToast(`Serviço adicional "${extraServicePixModal.serviceName}" cadastrado com sucesso!`);
                  setExtraServicePixModal(null);
                  setEditingProduct(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Pagamento e Publicar Serviço</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITAÇÃO DE DELIVERY V1 */}
      {requestDeliveryOrder && currentStore && (
        <RequestDeliveryModal
          isOpen={!!requestDeliveryOrder}
          onClose={() => setRequestDeliveryOrder(null)}
          order={requestDeliveryOrder}
          merchant={currentStore}
        />
      )}
    </div>
  );
};




