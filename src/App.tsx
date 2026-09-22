import React, { useState, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/marketplace/Header';
import { BottomNav } from './components/marketplace/BottomNav';
import { MobileCategoryDrawer } from './components/marketplace/MobileCategoryDrawer';
import { HomeView } from './components/marketplace/HomeView';
import { StoreDetailView } from './components/marketplace/StoreDetailView';
import { CustomerAccountView } from './components/marketplace/CustomerAccountView';
import { ProductDetailModal } from './components/marketplace/ProductDetailModal';
import { CheckoutModal } from './components/marketplace/CheckoutModal';
import { ServiceBookingModal } from './components/marketplace/ServiceBookingModal';
import { AuthModal } from './components/marketplace/AuthModal';
import { MandatoryPasswordChangeModal } from './components/auth/MandatoryPasswordChangeModal';
import { SellerFirstAccessView } from './components/auth/SellerFirstAccessView';
import { ExclusiveAccessGate } from './components/auth/ExclusiveAccessGate';
import { PlatformAccessGate } from './components/auth/PlatformAccessGate';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { MasterAdminPanel } from './components/master/MasterAdminPanel';
import { SalesDashboard } from './components/sales/SalesDashboard';
import { DeliveryDriverDashboard } from './components/delivery/DeliveryDriverDashboard';
import { DeliveryRegisterModal } from './components/delivery/DeliveryRegisterModal';
import { FloatingNotificationBall } from './components/notifications/FloatingNotificationBall';
import { SubOrderChatModal } from './components/chat/SubOrderChatModal';
import { CATEGORIES_TAXONOMY } from './data/categoryTaxonomy';
import { Product, ServiceItem, Order } from './types';
import { ShoppingBag, X, Trash2, ArrowRight, CheckCircle2, UserPlus, Compass, ShieldCheck, ShieldAlert, FileText, Scale, Crown, Sparkles, BookOpen, Store, Briefcase, Bike, MapPin, Truck } from 'lucide-react';
import { calculateDeliveryDistance, estimateDeliveryFare, getAllCachoeirasNeighborhoods } from './services/distanceService';

function MarketplaceApp() {
  const {
    currentUser,
    currentEnvironment,
    setCurrentEnvironment,
    cart,
    removeFromCart,
    clearCart,
    toastMessage,
    frontendConfig,
    openCopyrightModal,
    openPrivacyModal,
    openTermsModal,
    openPlansModal,
    openPolicyModal,
    openUserManualModal,
    promptAuthRequirement,
    isAuthModalOpen,
    authModalTab,
    openAuthModal,
    closeAuthModal,
    merchants,
    systemSettings
  } = useApp();

  // Navigation tabs in marketplace
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver'>('login');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutCartItems, setCheckoutCartItems] = useState<any[]>([]);
  const [checkoutModality, setCheckoutModality] = useState<'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO'>('DELIVERY');
  const [checkoutVariations, setCheckoutVariations] = useState<{ [key: string]: string }>({});
  const [checkoutDeliveryAddress, setCheckoutDeliveryAddress] = useState<string>('');
  const [checkoutDeliveryNeighborhood, setCheckoutDeliveryNeighborhood] = useState<string>('Centro');
  const [checkoutDeliveryFee, setCheckoutDeliveryFee] = useState<number>(0);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryRegisterModalOpen, setDeliveryRegisterModalOpen] = useState(false);

  // Estado de Entrega Definido Ainda no Carrinho
  const [cartWantDelivery, setCartWantDelivery] = useState<boolean>(false);
  const [cartDeliveryNeighborhood, setCartDeliveryNeighborhood] = useState<string>(currentUser?.neighborhood || 'Centro');
  const [cartDeliveryAddress, setCartDeliveryAddress] = useState<string>(currentUser?.address || '');

  // Cálculo da Entrega no Carrinho usando o Portal de Entrega Existente
  const cartStoreDeliveries = useMemo(() => {
    if (!cart || cart.length === 0) return [];
    const uniqueMerchants: { [id: string]: { id: string; name: string; neighborhood: string; address: string } } = {};
    cart.forEach((item) => {
      const mId = item.product.merchantId || 'loja_default';
      const mName = item.product.merchantName || 'Loja Parceira';
      if (!uniqueMerchants[mId]) {
        const mObj = merchants.find((m) => m.id === mId || m.name?.toLowerCase() === mName.toLowerCase());
        uniqueMerchants[mId] = {
          id: mId,
          name: mName,
          neighborhood: mObj?.neighborhood || 'Centro',
          address: mObj?.address || 'Centro, Cachoeiras de Macacu - RJ'
        };
      }
    });

    const ratePerKm = systemSettings?.deliveryRatePerKm ?? 1.0;
    const platformFee = systemSettings?.deliveryPlatformFee ?? 2.0;

    return Object.values(uniqueMerchants).map((m) => {
      const dist = calculateDeliveryDistance(m.neighborhood || m.address, cartDeliveryNeighborhood || 'Centro');
      const fare = estimateDeliveryFare(dist.distanceKm, ratePerKm, platformFee);
      return {
        merchantId: m.id,
        merchantName: m.name,
        originNeighborhood: m.neighborhood,
        destNeighborhood: cartDeliveryNeighborhood || 'Centro',
        distanceKm: dist.distanceKm,
        fee: fare.totalFare
      };
    });
  }, [cart, merchants, cartDeliveryNeighborhood, systemSettings]);

  const cartTotalDeliveryFee = useMemo(() => {
    return Number(cartStoreDeliveries.reduce((sum, d) => sum + d.fee, 0).toFixed(2));
  }, [cartStoreDeliveries]);

  const cartProductsSubtotal = useMemo(() => {
    return Number(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2));
  }, [cart]);

  const handleOpenAuth = (initialTab: 'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver' = 'login') => {
    openAuthModal(initialTab);
    setAuthInitialTab(initialTab);
    setAuthModalOpen(true);
  };

  const handleOpenCheckout = (
    product?: Product | null,
    modality: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO' = 'DELIVERY',
    variations: { [key: string]: string } = {},
    cartItemsToCheckout: any[] = [],
    deliveryInfo?: { address?: string; neighborhood?: string; fee?: number }
  ) => {
    const effectiveItems = cartItemsToCheckout.length > 0 ? cartItemsToCheckout : (product ? [{ product, quantity: 1, selectedVariations: variations }] : []);
    const itemsTotal = effectiveItems.reduce((s, it) => s + it.product.price * it.quantity, 0);
    const delivFee = modality === 'DELIVERY' ? (deliveryInfo?.fee ?? (cartWantDelivery ? cartTotalDeliveryFee : 0)) : 0;
    const finalTotal = itemsTotal + delivFee;

    if (!currentUser) {
      promptAuthRequirement('COMPRA', {
        title: product?.name || (effectiveItems.length > 0 ? `${effectiveItems.length} itens na sacola` : 'Finalizar Pedido'),
        price: finalTotal,
        merchantName: product?.merchantName
      });
      return;
    }
    setCheckoutProduct(product || null);
    setCheckoutCartItems(cartItemsToCheckout);
    setCheckoutModality(modality);
    setCheckoutVariations(variations);
    if (deliveryInfo?.address !== undefined) {
      setCheckoutDeliveryAddress(deliveryInfo.address);
    } else {
      setCheckoutDeliveryAddress(cartDeliveryAddress);
    }
    if (deliveryInfo?.neighborhood !== undefined) {
      setCheckoutDeliveryNeighborhood(deliveryInfo.neighborhood);
    } else {
      setCheckoutDeliveryNeighborhood(cartDeliveryNeighborhood);
    }
    setCheckoutDeliveryFee(delivFee);
    setSelectedProduct(null); // Close detail modal if open
  };

  const handleOpenBooking = (service: ServiceItem) => {
    if (!currentUser) {
      promptAuthRequirement('AGENDAMENTO', {
        title: service.title,
        merchantName: service.merchantName,
        price: service.price
      });
      return;
    }
    setSelectedService(service);
  };

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // FLUXO DE PRIMEIRO ACESSO OBRIGATÓRIO DO VENDEDOR:
  // Se o usuário autenticado for Vendedor e ainda estiver com primeiro acesso pendente
  // (needsPasswordChange === true ou password === '12345678'):
  // NÃO liberar o Portal do Vendedor nem qualquer rota da plataforma.
  // Exibir SOMENTE a tela de alteração de senha ('Primeiro acesso').
  // Não permitir contornar essa etapa através de: URL, refresh, botão voltar ou manipulação de estado.
  const isSellerUser =
    currentUser?.role === 'VENDEDOR' || currentUser?.role === 'REPRESENTANTE_COMERCIAL';
  const isSellerFirstAccessPending =
    isSellerUser && (currentUser?.needsPasswordChange === true || currentUser?.password === '12345678');

  if (isSellerFirstAccessPending) {
    return <SellerFirstAccessView />;
  }

  // If in Seller Portal
  if (currentEnvironment === 'SELLER_PORTAL') {
    const isAllowedSeller =
      currentUser?.role === 'LOJISTA' ||
      currentUser?.role === 'PRESTADOR_SERVICO' ||
      (currentUser?.role === 'VENDEDOR' && !!currentUser.merchantId) ||
      currentUser?.role === 'MASTER';

    if (!isAllowedSeller) {
      return (
        <ExclusiveAccessGate
          requiredRole="LOJISTA"
          title="Portal do Lojista & Prestador"
          subtitle="Área exclusiva para comerciantes e profissionais prestadores credenciados."
        />
      );
    }

    return (
      <div className="relative min-h-screen">
        <SellerDashboard />
        <MandatoryPasswordChangeModal />
        <FloatingNotificationBall />
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // If in Master Admin Panel
  if (currentEnvironment === 'MASTER_PANEL') {
    if (currentUser?.role !== 'MASTER') {
      return (
        <ExclusiveAccessGate
          requiredRole="MASTER"
          title="Painel Master Administrativo"
          subtitle="Acesso restrito de alta segurança. Requer autenticação do Administrador Master com confirmação em duas etapas (2FA)."
        />
      );
    }

    return (
      <div className="relative min-h-screen">
        <MasterAdminPanel />
        <MandatoryPasswordChangeModal />
        <FloatingNotificationBall />
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // If in Commercial Team / Sales Agent Portal
  if (currentEnvironment === 'COMMERCIAL_PORTAL') {
    const isAllowedCommercial =
      currentUser?.role === 'VENDEDOR' ||
      currentUser?.role === 'REPRESENTANTE_COMERCIAL' ||
      currentUser?.role === 'MASTER';

    if (!isAllowedCommercial) {
      return (
        <ExclusiveAccessGate
          requiredRole="VENDEDOR"
          title="Portal da Equipe Comercial"
          subtitle="Área exclusiva para consultores de vendas, coordenadores e representantes autorizados Achei Aqui."
        />
      );
    }

    return (
      <div className="relative min-h-screen">
        <SalesDashboard />
        <MandatoryPasswordChangeModal />
        <FloatingNotificationBall />
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // If in Delivery Driver Portal (V1)
  if (currentEnvironment === 'DELIVERY_PORTAL') {
    const isAllowedDelivery =
      currentUser?.role === 'ENTREGADOR' ||
      currentUser?.role === 'MASTER';

    if (!isAllowedDelivery) {
      return (
        <ExclusiveAccessGate
          requiredRole="ENTREGADOR"
          title="Portal do Entregador Parceiro"
          subtitle="Área restrita para entregadores e motoboys credenciados Achei Aqui Delivery."
        />
      );
    }

    return (
      <div className="relative min-h-screen">
        <DeliveryDriverDashboard />
        <MandatoryPasswordChangeModal />
        <FloatingNotificationBall />
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-bold flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT: PLATAFORMA PÚBLICA DE VENDAS (MARKETPLACE)
  return (
    <div className="min-h-screen bg-[#f4fbf6] flex flex-col justify-between selection:bg-emerald-200">
      <div>
        {/* Header com Tema Verde Parque da Serra & Menu Superior Desktop */}
        <Header
          onOpenAuth={handleOpenAuth}
          onOpenCart={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            if (selectedStoreId) setSelectedStoreId(null);
          }}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            if (selectedStoreId) setSelectedStoreId(null);
          }}
          selectedCategory={selectedCategory}
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            if (selectedStoreId) setSelectedStoreId(null);
          }}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onSelectStore={(storeId) => handleSelectStore(storeId)}
        />

        {/* Barra de Notificação e Acesso Direto do Vendedor Comercial no Marketplace */}
        {(currentUser?.role === 'VENDEDOR' || currentUser?.role === 'REPRESENTANTE_COMERCIAL') && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white px-4 py-2 text-xs border-b border-indigo-700/50 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Briefcase className="w-4 h-4 text-indigo-300 shrink-0" />
              <span className="truncate">
                Sessão de Consultor Ativa: <strong>{currentUser.name}</strong> • Você está visualizando o marketplace como vendedor.
              </span>
            </div>
            <button
              onClick={() => setCurrentEnvironment('COMMERCIAL_PORTAL')}
              className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-all shrink-0 flex items-center space-x-1.5 shadow-xs cursor-pointer active:scale-95"
              title="Retornar ao Meu Painel do Vendedor"
            >
              <span>Retornar ao Meu Painel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Main View */}
        <main className="min-h-[70vh]">
          {selectedStoreId ? (
            <StoreDetailView
              merchantId={selectedStoreId}
              onBack={() => {
                setSelectedStoreId(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onSelectService={(s) => handleOpenBooking(s)}
              onOpenCheckout={handleOpenCheckout}
              onOpenBooking={handleOpenBooking}
              onSelectOtherStore={(storeId) => {
                setSelectedStoreId(storeId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : currentTab === 'account' || currentTab === 'account-orders' ? (
            <CustomerAccountView
              onSelectProduct={(p) => setSelectedProduct(p)}
              onOpenCheckout={(p) => handleOpenCheckout(p)}
              onOpenAuth={() => handleOpenAuth('login')}
            />
          ) : (
            <HomeView
              onSelectProduct={(p) => setSelectedProduct(p)}
              onSelectService={(s) => handleOpenBooking(s)}
              onOpenCheckout={handleOpenCheckout}
              onOpenBooking={handleOpenBooking}
              onSelectStore={handleSelectStore}
              searchQuery={searchQuery}
              setSearchQuery={(q) => {
                setSearchQuery(q);
                if (selectedStoreId) setSelectedStoreId(null);
              }}
              selectedCategory={selectedCategory}
              setSelectedCategory={(cat) => {
                setSelectedCategory(cat);
                if (selectedStoreId) setSelectedStoreId(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Drawer Lateral para Mobile com Categorias em CAIXA ALTA e Subcategorias em caixa baixa */}
      <MobileCategoryDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedStoreId(null);
          setSearchQuery('');
          setCurrentTab('home');
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        onSelectShortcut={(catId, query) => {
          setSelectedCategory(catId);
          setSelectedStoreId(null);
          if (query) setSearchQuery(query);
          setCurrentTab('home');
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
      />

      {/* Footer Verde Floresta Serra da Macacu */}
      <footer className="bg-emerald-950 text-emerald-300/80 text-xs py-10 border-t border-emerald-900 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-emerald-800 to-green-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                  {frontendConfig?.logoLetter || 'A'}
                </div>
                <h4 className="text-white font-black text-base">{frontendConfig?.siteTitle || 'Achei Aqui'}</h4>
              </div>
              <p className="text-emerald-300/70 text-xs leading-relaxed">
                Inspirado nas verdes matas e florestas do Parque Estadual e da serra de Cachoeiras de Macacu. Conectando moradores, prestadores e comércios locais.
              </p>
              <div className="pt-2">
                <button
                  onClick={openPlansModal}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-500/40 rounded-xl text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 hover:bg-amber-500/30 transition-all shadow-xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Conhecer Nossos Planos & Taxas</span>
                </button>
              </div>
            </div>

            <div>
              <h5 className="text-white font-bold mb-3 uppercase text-[11px] tracking-wider text-emerald-200">
                Departamentos & Categorias
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                {CATEGORIES_TAXONOMY.slice(0, 5).map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSearchQuery('');
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors text-left"
                    >
                      {cat.nameCapitalized}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold mb-3 uppercase text-[11px] tracking-wider text-emerald-200">
                Acesso & Modalidades
              </h5>
              <ul className="space-y-2 text-[11px]">
                {!currentUser && (
                  <li>
                    <button
                      onClick={() => handleOpenAuth('register-customer')}
                      className="text-white font-bold hover:text-emerald-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cadastre-se Gratuitamente</span>
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => handleOpenAuth('register-merchant')}
                    className="text-emerald-300 font-semibold hover:text-white flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quero Vender na Plataforma</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOpenAuth('register-driver')}
                    className="text-amber-400 font-semibold hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bike className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quero ser Entregador Parceiro</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleOpenAuth('login')}
                    className="hover:text-white"
                  >
                    Entrar na Minha Conta
                  </button>
                </li>
                <li>
                  <button
                    onClick={openPlansModal}
                    className="text-amber-300/90 font-medium hover:text-amber-200 flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Planos Grátis, Bronze, Prata, Ouro e Premium</span>
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold mb-3 uppercase text-[11px] tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Normas & Transparência Legal</span>
              </h5>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <button
                    onClick={() => openUserManualModal('CLIENTES')}
                    className="text-amber-300 hover:text-white flex items-center gap-1.5 text-left group font-semibold"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-200 shrink-0" />
                    <span>Manual Passo a Passo do Cliente</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openUserManualModal('LOGISTAS')}
                    className="text-amber-300 hover:text-white flex items-center gap-1.5 text-left group font-semibold"
                  >
                    <Store className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-200 shrink-0" />
                    <span>Manual Passo a Passo do Lojista</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={openCopyrightModal}
                    className="text-emerald-300 hover:text-white flex items-center gap-1.5 text-left group"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-200 shrink-0" />
                    <span className="font-medium">Direitos Autorais (Bex Serviços e Comércios)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={openPrivacyModal}
                    className="text-emerald-300 hover:text-white flex items-center gap-1.5 text-left group"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-200 shrink-0" />
                    <span>Política de Privacidade (LGPD)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={openTermsModal}
                    className="text-emerald-300 hover:text-white flex items-center gap-1.5 text-left group"
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-200 shrink-0" />
                    <span>Termos de Uso & Regras Comerciais</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openPolicyModal('customer')}
                    className="text-emerald-300 hover:text-white flex items-center gap-1.5 text-left group"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-200 shrink-0" />
                    <span>Política de Avaliações Mútuas</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Legal Bar & Copyright Declaration */}
          <div className="border-t border-emerald-900/80 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-emerald-400/70 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span>© 2026 Achei Aqui - Cachoeiras de Macacu - RJ.</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-emerald-300 font-semibold">Autoria e Titularidade: Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <button onClick={openCopyrightModal} className="hover:text-white underline underline-offset-4 decoration-emerald-700">
                Direitos Autorais
              </button>
              <button onClick={openPrivacyModal} className="hover:text-white underline underline-offset-4 decoration-emerald-700">
                Privacidade & LGPD
              </button>
              <button onClick={openTermsModal} className="hover:text-white underline underline-offset-4 decoration-emerald-700">
                Termos de Uso
              </button>
              <button onClick={openPlansModal} className="text-amber-300 hover:text-amber-100 font-bold underline underline-offset-4 decoration-amber-600">
                Tabela de Planos & Taxas
              </button>
            </div>
          </div>

          {/* DOCUMENTAÇÃO E PORTAIS OFICIAIS */}
          <div className="mt-4 pt-4 border-t border-emerald-900/50 bg-emerald-950/40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2 text-emerald-300 font-bold text-[11px]">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Documentação da Plataforma & Manuais Oficiais:</span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <button
                  onClick={() => openUserManualModal('CLIENTES')}
                  className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-amber-300 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-emerald-700/60 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manual do Cliente</span>
                </button>
                <button
                  onClick={() => openUserManualModal('LOGISTAS')}
                  className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-purple-300 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-emerald-700/60 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Store className="w-3.5 h-3.5 text-purple-400" />
                  <span>Manual do Lojista</span>
                </button>
                <button
                  onClick={() => openUserManualModal('LEGAL')}
                  className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-blue-300 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-emerald-700/60 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>Normas & LGPD</span>
                </button>
                <button
                  onClick={openPlansModal}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-amber-500/40 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Planos & Banners</span>
                </button>
                <button
                  onClick={() => setCurrentEnvironment('COMMERCIAL_PORTAL')}
                  className="px-3 py-1.5 bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-indigo-700/60 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Acesso exclusivo para Vendedores e Representantes Comerciais"
                >
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Portal Vendedor</span>
                </button>
                <button
                  onClick={() => setCurrentEnvironment('DELIVERY_PORTAL')}
                  className="px-3 py-1.5 bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-emerald-700/60 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  title="Acesso exclusivo para Entregadores e Motoboys"
                >
                  <Bike className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Portal Entregador</span>
                </button>
                {currentUser?.role === 'MASTER' && (
                  <button
                    onClick={() => setCurrentEnvironment('MASTER_PANEL')}
                    className="px-3 py-1.5 bg-blue-900/70 hover:bg-blue-800 text-blue-200 hover:text-white rounded-xl text-[11px] font-bold transition-all border border-blue-700/60 flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    title="Acesso reservado ao Administrador Master"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                    <span>Painel Master</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* MODAL: PRODUCT DETAILS */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onOpenCheckout={handleOpenCheckout}
        onOpenBooking={handleOpenBooking}
        onSelectStore={handleSelectStore}
      />

      {/* MODAL: CHECKOUT & REQUEST */}
      <CheckoutModal
        isOpen={!!checkoutProduct || checkoutCartItems.length > 0}
        onClose={() => {
          setCheckoutProduct(null);
          setCheckoutCartItems([]);
        }}
        product={checkoutProduct}
        cartItems={checkoutCartItems}
        initialModality={checkoutModality}
        initialDeliveryAddress={checkoutDeliveryAddress}
        initialDeliveryNeighborhood={checkoutDeliveryNeighborhood}
        initialDeliveryFee={checkoutDeliveryFee}
        selectedVariations={checkoutVariations}
        onOrderSuccess={(order) => {
          // Keep modal open on confirmation screen
        }}
      />

      {/* MODAL: SERVICE BOOKING */}
      <ServiceBookingModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBookingSuccess={() => {
          // Success handles inside modal
        }}
      />

      {/* MODAL: AUTH / LOGIN / REGISTER */}
      <AuthModal
        isOpen={authModalOpen || isAuthModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          closeAuthModal();
        }}
        initialTab={isAuthModalOpen ? authModalTab : authInitialTab}
      />

      {/* MODAL: CADASTRO DE ENTREGADOR PARCEIRO */}
      <DeliveryRegisterModal
        isOpen={deliveryRegisterModalOpen}
        onClose={() => setDeliveryRegisterModalOpen(false)}
      />

      {/* MODAL: SLIDE-OVER SHOPPING CART */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            {/* Cart Header */}
            <div className="p-4 border-b border-emerald-100 flex items-center justify-between bg-emerald-900 text-white">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">Minha Sacola ({cart.length})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="text-slate-800 font-bold text-sm">Sua sacola está vazia</p>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto">
                    Explore os produtos e comércios de Cachoeiras de Macacu e adicione seus itens favoritos.
                  </p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    Ver Produtos & Lojas
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex space-x-3 items-center">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-emerald-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-semibold truncate">
                        {item.product.merchantName}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-extrabold text-emerald-900">
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Qtd: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer: Novo Fluxo de Entrega Definida no Carrinho */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-emerald-100 bg-emerald-50/50 space-y-3">
                {/* Pergunta: Deseja receber por entrega? */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Deseja receber os produtos por entrega?</span>
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Opcional</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCartWantDelivery(false)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !cartWantDelivery
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>NÃO (Retirada)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCartWantDelivery(true)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        cartWantDelivery
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>SIM (Entrega)</span>
                    </button>
                  </div>

                  {/* Se SIM: Solicitar endereço e calcular pelo Portal de Entrega */}
                  {cartWantDelivery && (
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>Seu Bairro em Cachoeiras de Macacu:</span>
                        </label>
                        <select
                          value={cartDeliveryNeighborhood}
                          onChange={(e) => setCartDeliveryNeighborhood(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-medium"
                        >
                          {getAllCachoeirasNeighborhoods().map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase">
                          Rua, Número e Complemento:
                        </label>
                        <input
                          type="text"
                          value={cartDeliveryAddress}
                          onChange={(e) => setCartDeliveryAddress(e.target.value)}
                          placeholder="Ex: Rua Central, 120"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                        />
                      </div>

                      {/* Discriminação da entrega por loja parceira */}
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200/60 space-y-1">
                        <span className="text-[10px] font-extrabold text-emerald-900 block">
                          Cálculo pelo Portal de Entrega ({cartStoreDeliveries.length} origem(ns)):
                        </span>
                        {cartStoreDeliveries.map((sd) => (
                          <div key={sd.merchantId} className="flex justify-between text-[11px] text-emerald-800">
                            <span className="truncate max-w-[180px]">
                              • {sd.merchantName} ({sd.originNeighborhood} → {sd.destNeighborhood}):
                            </span>
                            <span className="font-bold shrink-0">
                              R$ {sd.fee.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resumo de Valores */}
                <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Produtos ({cart.reduce((s, it) => s + it.quantity, 0)} itens):</span>
                    <span className="font-bold text-white">
                      R$ {cartProductsSubtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Taxa de Entrega:</span>
                    <span className="font-bold text-emerald-300">
                      {cartWantDelivery
                        ? `+ R$ ${cartTotalDeliveryFee.toFixed(2).replace('.', ',')}`
                        : 'R$ 0,00 (Retirada)'}
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-1.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">TOTAL FINAL:</span>
                    <span className="text-base text-emerald-400 font-black">
                      R${' '}
                      {(
                        cartProductsSubtotal +
                        (cartWantDelivery ? cartTotalDeliveryFee : 0)
                      )
                        .toFixed(2)
                        .replace('.', ',')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    if (cart.length > 0) {
                      handleOpenCheckout(
                        cart[0]?.product,
                        cartWantDelivery ? 'DELIVERY' : 'RETIRADA',
                        {},
                        cart,
                        {
                          address: cartDeliveryAddress,
                          neighborhood: cartDeliveryNeighborhood,
                          fee: cartWantDelivery ? cartTotalDeliveryFee : 0
                        }
                      );
                    }
                  }}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Avançar para Checkout Asaas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CHAT E MENSAGENS INTERNAS DE SUBPEDIDOS */}
      <SubOrderChatModal />

      {/* BALÕES FLUTUANTES DE NOTIFICAÇÕES (PERSISTENTES ATÉ O 'X') */}
      <FloatingNotificationBall />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MarketplaceApp />
    </AppProvider>
  );
}
