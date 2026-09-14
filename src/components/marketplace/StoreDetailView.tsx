import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Store,
  Star,
  MapPin,
  Clock,
  Truck,
  Package,
  Sparkles,
  Phone,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Heart,
  ShoppingBag,
  Eye,
  Check,
  Calendar,
  Share2,
  Award,
  FileText,
  Building,
  ChevronRight,
  X,
  Info,
  Camera
} from 'lucide-react';
import { Product, ServiceItem, StoreMerchant } from '../../types';
import { useApp } from '../../context/AppContext';

interface StoreDetailViewProps {
  merchantId: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onSelectService: (service: ServiceItem) => void;
  onOpenCheckout: (product: Product, initialModality?: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO') => void;
  onOpenBooking: (service: ServiceItem) => void;
  onSelectOtherStore: (storeId: string) => void;
}

export const StoreDetailView: React.FC<StoreDetailViewProps> = ({
  merchantId,
  onBack,
  onSelectProduct,
  onSelectService,
  onOpenCheckout,
  onOpenBooking,
  onSelectOtherStore
}) => {
  const {
    merchants,
    products,
    services,
    currentCity,
    addToCart,
    favorites,
    toggleFavorite,
    reviews,
    openSubOrderChat,
    currentUser,
    promptAuthRequirement
  } = useApp();

  const [activeTab, setActiveTab] = useState<'catalog' | 'about' | 'reviews'>('catalog');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<'ALL' | 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO'>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Find merchant
  const merchant = useMemo(() => {
    return merchants.find((m) => m.id === merchantId) || merchants[0];
  }, [merchants, merchantId]);

  // Get all products for this merchant
  const merchantProducts = useMemo(() => {
    if (!merchant) return [];
    return products.filter(
      (p) =>
        p.merchantId === merchant.id ||
        (merchant.name && p.merchantName?.toLowerCase() === merchant.name.toLowerCase())
    );
  }, [products, merchant]);

  // Get all services for this merchant
  const merchantServices = useMemo(() => {
    if (!merchant) return [];
    return services.filter(
      (s) =>
        s.merchantId === merchant.id ||
        (merchant.name && s.merchantName?.toLowerCase() === merchant.name.toLowerCase())
    );
  }, [services, merchant]);

  // Convert services into displayable items if needed
  const convertedServices: Product[] = useMemo(() => {
    return merchantServices.map((s) => ({
      id: s.id,
      merchantId: s.merchantId,
      merchantName: s.merchantName,
      merchantCategory: s.merchantCategory,
      merchantRating: s.merchantRating,
      merchantAddress: s.merchantAddress,
      name: s.title,
      description: s.description,
      price: s.price,
      images: [s.image],
      category: s.category,
      stock: 99,
      itemType: s.itemType || 'SERVICO',
      availableModalities: ['RETIRADA', 'DELIVERY'],
      rating: s.merchantRating || 5.0,
      reviewsCount: 24,
      status: 'active',
      createdAt: '2026-01-01'
    }));
  }, [merchantServices]);

  // All catalog items of this merchant
  const allStoreItems = useMemo(() => {
    return [...merchantProducts, ...convertedServices];
  }, [merchantProducts, convertedServices]);

  // Extract unique categories available in this store
  const availableStoreCategories = useMemo(() => {
    const cats = new Set<string>();
    allStoreItems.forEach((item) => {
      if (item.category) cats.add(item.category);
      if (item.subcategory) cats.add(item.subcategory);
    });
    return Array.from(cats);
  }, [allStoreItems]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return allStoreItems
      .filter((item) => {
        // Search filter
        if (storeSearchQuery.trim()) {
          const q = storeSearchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchCat = item.category?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Subcategory filter
        if (selectedSubCategory !== 'all') {
          if (item.category !== selectedSubCategory && item.subcategory !== selectedSubCategory) {
            return false;
          }
        }

        // Modality filter
        if (selectedModality === 'DELIVERY' && !item.availableModalities?.includes('DELIVERY')) {
          return false;
        }
        if (selectedModality === 'RETIRADA' && !item.availableModalities?.includes('RETIRADA')) {
          return false;
        }
        if (
          selectedModality === 'EXPERIMENTAÇÃO' &&
          !item.availableModalities?.includes('EXPERIMENTAÇÃO')
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0; // featured/default
      });
  }, [allStoreItems, storeSearchQuery, selectedSubCategory, selectedModality, sortBy]);

  // Other merchants for recommendation
  const otherMerchants = useMemo(() => {
    return merchants.filter((m) => m.id !== merchant?.id && m.status === 'approved').slice(0, 4);
  }, [merchants, merchant]);

  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!currentUser) {
      promptAuthRequirement('COMPRA', {
        title: product.name,
        price: product.price,
        merchantName: product.merchantName
      });
      return;
    }
    const defaultModality = product.availableModalities?.[0] || 'DELIVERY';
    addToCart({
      product,
      quantity: 1,
      selectedVariations: {},
      selectedModality: defaultModality
    });

    setAddedAnimationId(product.id);
    setTimeout(() => {
      setAddedAnimationId(null);
    }, 1500);
  };

  const handleShareStore = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert(`Link da loja ${merchant?.name} copiado com sucesso!`);
    }
  };

  if (!merchant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 mb-4">Loja não encontrada.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold text-xs"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4fbf6] pb-24 animate-in fade-in duration-200">
      {/* 1. TOP BREADCRUMB & RETURN BAR */}
      <div className="bg-white border-b border-emerald-900/10 sticky top-[57px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para o Início / Todas as Lojas</span>
          </button>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                merchant.isOpen
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  merchant.isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{merchant.isOpen ? 'Aberto Agora' : 'Fechado no Momento'}</span>
            </span>

            <button
              onClick={handleShareStore}
              className="p-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-900 transition-colors"
              title="Compartilhar Loja"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STORE HERO BANNER & PROFILE CARD */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-emerald-200/80 shadow-md overflow-hidden">
          {/* Cover Banner with Emerald Gradient */}
          <div className="h-32 sm:h-48 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 relative overflow-hidden">
            {merchant.banner ? (
              <img
                src={merchant.banner}
                alt={merchant.name}
                className="w-full h-full object-cover opacity-60"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-900/90 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LOJISTA VERIFICADO CACHOEIRAS</span>
              </span>
            </div>
          </div>

          {/* Profile Header Details */}
          <div className="px-4 sm:px-8 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
              {/* Logo & Store Name */}
              <div className="flex items-end space-x-3 sm:space-x-4">
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-white p-1 shadow-xl border-2 border-white shrink-0">
                  <img
                    src={merchant.logo}
                    alt={merchant.name}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="pb-1">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-emerald-950 leading-tight">
                      {merchant.name}
                    </h1>
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-emerald-700">
                    {merchant.category} {merchant.ownerName ? `• Por ${merchant.ownerName}` : ''}
                  </p>
                </div>
              </div>

              {/* Rating & Action Buttons */}
              <div className="flex items-center flex-wrap gap-2 pt-2 sm:pt-0">
                <div className="flex items-center space-x-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-black text-amber-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{merchant.rating}</span>
                  <span className="text-amber-700 font-normal">({merchant.reviewsCount} avaliações)</span>
                </div>

                {merchant.allowDirectChat !== false ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        promptAuthRequirement('Para conversar pelo chat interno com o lojista e tirar dúvidas, acesse sua conta ou cadastre-se gratuitamente.');
                        return;
                      }
                      openSubOrderChat({
                        subpedidoId: `inquiry-${merchant.id}-${currentUser.id}`,
                        codigoSubpedido: `#ATD-${merchant.name.substring(0, 3).toUpperCase()}`,
                        merchantId: merchant.id,
                        merchantName: merchant.name,
                        customerId: currentUser.id,
                        customerName: currentUser.name || 'Cliente Achei Aqui',
                        customerPhone: currentUser.phone,
                        orderTitle: `Atendimento Geral / Dúvidas - ${merchant.name}`,
                        orderStatus: 'Canal Aberto'
                      });
                    }}
                    className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm shadow-emerald-700/20 transition-all active:scale-95"
                    title="Conversar com o lojista através da comunicação interna"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat Interno</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium">
                    <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Chat Pausado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-3 border-y border-emerald-100 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">{merchant.address || merchant.neighborhood || currentCity}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">{merchant.openingHours || '08:00 às 19:00'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {merchant.isServiceProvider ? (
                  <>
                    <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="truncate">Atendimento com Agendamento</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">
                      {merchant.deliveryFee > 0 ? `Taxa: R$ ${merchant.deliveryFee.toFixed(2)}` : 'Entrega Grátis'}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                {merchant.isServiceProvider ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">Prestador Verificado</span>
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{merchant.deliveryTimeEstimate || '25-45 min'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Supported Modalities Badges */}
            <div className="pt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 mr-1">Modalidades aceitas:</span>
              {merchant.isServiceProvider ? (
                <>
                  {merchant.serviceButtonsConfig?.showHomeService !== false && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      Atendimento a domicílio
                    </span>
                  )}
                  {merchant.serviceButtonsConfig?.showStoreService !== false && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                      <Store className="w-3 h-3 text-blue-700" />
                      Atendimento na loja
                    </span>
                  )}
                  {merchant.serviceButtonsConfig?.showSchedule !== false && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-700" />
                      Agendamento Disponível
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-700" />
                    Entrega em Domicílio
                  </span>
                  {merchant.supportsPickup && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <Package className="w-3 h-3 text-emerald-700" />
                      Retirada no Balcão
                    </span>
                  )}
                  {merchant.supportsTrial && (
                    <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      Provador VIP
                    </span>
                  )}
                  {merchant.supportsAppointments && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      Atendimento com Hora Marcada
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 sm:px-8 border-t border-emerald-100 flex items-center space-x-2 sm:space-x-4 bg-emerald-50/40">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'catalog'
                  ? 'border-emerald-800 text-emerald-950'
                  : 'border-transparent text-slate-600 hover:text-emerald-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Todos os Produtos & Serviços ({allStoreItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'about'
                  ? 'border-emerald-800 text-emerald-950'
                  : 'border-transparent text-slate-600 hover:text-emerald-900'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Sobre a Loja & Dados</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 px-2 sm:px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-1.5 ${
                activeTab === 'reviews'
                  ? 'border-emerald-800 text-emerald-950'
                  : 'border-transparent text-slate-600 hover:text-emerald-900'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Avaliações ({merchant.reviewsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Filter and Search Bar specifically inside this store */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search input in this store */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={storeSearchQuery}
                    onChange={(e) => setStoreSearchQuery(e.target.value)}
                    placeholder={`Buscar nos produtos de ${merchant.name}...`}
                    className="w-full pl-9 pr-9 py-2 bg-emerald-50/50 hover:bg-emerald-50 focus:bg-white border border-emerald-200 focus:border-emerald-700 rounded-xl text-xs sm:text-sm text-slate-900 outline-none transition-all"
                  />
                  <Search className="w-4 h-4 text-emerald-700 absolute left-3 top-2.5 pointer-events-none" />
                  {storeSearchQuery && (
                    <button
                      onClick={() => setStoreSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-emerald-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort selector */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500 hidden sm:inline">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="featured">Destaques da Loja</option>
                    <option value="price-asc">Menor Preço</option>
                    <option value="price-desc">Maior Preço</option>
                    <option value="rating">Melhor Avaliados</option>
                  </select>
                </div>
              </div>

              {/* Modality & Subcategory Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-50">
                <button
                  onClick={() => setSelectedModality('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedModality === 'ALL'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  Todos ({allStoreItems.length})
                </button>
                <button
                  onClick={() => setSelectedModality('DELIVERY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedModality === 'DELIVERY'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  🛵 Entrega Rápida
                </button>
                {merchant.supportsPickup && (
                  <button
                    onClick={() => setSelectedModality('RETIRADA')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedModality === 'RETIRADA'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    🏬 Retirada Balcão
                  </button>
                )}
                {merchant.supportsTrial && (
                  <button
                    onClick={() => setSelectedModality('EXPERIMENTAÇÃO')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedModality === 'EXPERIMENTAÇÃO'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                    }`}
                  >
                    👗 Provador VIP
                  </button>
                )}
              </div>
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between text-xs text-emerald-900 font-bold px-1">
              <span>
                Mostrando {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'} no catálogo desta loja
              </span>
              {(storeSearchQuery || selectedSubCategory !== 'all' || selectedModality !== 'ALL') && (
                <button
                  onClick={() => {
                    setStoreSearchQuery('');
                    setSelectedSubCategory('all');
                    setSelectedModality('ALL');
                  }}
                  className="text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>

            {/* Product & Service Grid (ALL items) */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-emerald-100 p-10 text-center space-y-3">
                <Store className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Não encontramos nenhum item correspondente aos filtros nesta loja. Experimente limpar a busca.
                </p>
                <button
                  onClick={() => {
                    setStoreSearchQuery('');
                    setSelectedSubCategory('all');
                    setSelectedModality('ALL');
                  }}
                  className="px-4 py-2 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Ver Todos os Produtos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                {filteredItems.map((product) => {
                  const isFav = favorites.includes(product.id);
                  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                  const discountPercent = hasDiscount
                    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
                    : 0;
                  const isAdded = addedAnimationId === product.id;

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (product.itemType === 'SERVICO') {
                          const originalService = merchantServices.find((s) => s.id === product.id);
                          if (originalService) onSelectService(originalService);
                          else onSelectProduct(product);
                        } else {
                          onSelectProduct(product);
                        }
                      }}
                      className="group bg-white rounded-2xl border border-emerald-100/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer relative"
                    >
                      {/* Product Image Container */}
                      <div className="relative aspect-square w-full bg-emerald-50/50 overflow-hidden">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop&q=80'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />

                        {/* Modality Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {discountPercent > 0 && (
                            <span className="bg-red-500 text-white text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                              -{discountPercent}%
                            </span>
                          )}
                          {product.itemType === 'SERVICO' ? (
                            <span className="bg-blue-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Serviço
                            </span>
                          ) : product.availableModalities?.includes('EXPERIMENTAÇÃO') ? (
                            <span className="bg-emerald-800/95 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              Provador VIP
                            </span>
                          ) : null}
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className={`absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                            isFav
                              ? 'bg-red-50 text-red-500'
                              : 'bg-white/80 text-slate-400 hover:text-red-500 hover:bg-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug mb-1 group-hover:text-emerald-800 transition-colors">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Price & Action */}
                        <div className="pt-2 border-t border-emerald-50">
                          <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-sm sm:text-base font-black text-emerald-950">
                              R$ {(product.price ?? 0).toFixed(2).replace('.', ',')}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                                R$ {(product.originalPrice ?? 0).toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const isService = product.itemType === 'SERVICO' || merchant.isServiceProvider || (product.category || '').toUpperCase().includes('SERVI');
                              const showSchedule = isService ? merchant.serviceButtonsConfig?.showSchedule !== false : true;

                              if (isService) {
                                return showSchedule ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const originalService = merchantServices.find((s) => s.id === product.id);
                                      if (originalService) {
                                        onOpenBooking(originalService);
                                      } else {
                                        const serviceItem: ServiceItem = {
                                          id: product.id,
                                          merchantId: product.merchantId || merchant.id,
                                          merchantName: product.merchantName || merchant.name,
                                          merchantCategory: merchant.category || 'Serviços',
                                          merchantRating: merchant.rating || 5.0,
                                          merchantAddress: merchant.address || 'Cachoeiras de Macacu, RJ',
                                          title: product.name,
                                          description: product.description,
                                          price: product.price,
                                          durationMinutes: 60,
                                          category: product.category,
                                          subcategory: product.subcategory,
                                          itemType: product.itemType || 'SERVICO',
                                          image: product.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
                                          professionals: [merchant.name || 'Profissional'],
                                          availableDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
                                          availableHours: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                                          executionLocation: product.executionLocation || 'AMBOS',
                                          isQuoteBased: product.isQuoteBased
                                        };
                                        onOpenBooking(serviceItem);
                                      }
                                    }}
                                    className="flex-1 py-1.5 sm:py-2 px-2 rounded-lg text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Agendar horário com o prestador"
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">Agendar</span>
                                  </button>
                                ) : null;
                              }

                              return (
                                <button
                                  onClick={(e) => handleQuickAddToCart(e, product)}
                                  className={`flex-1 py-1.5 sm:py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    isAdded
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-700 hover:text-white active:scale-95'
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span className="text-[11px]">Adicionado</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingBag className="w-3.5 h-3.5" />
                                      <span className="text-[11px]">Comprar</span>
                                    </>
                                  )}
                                </button>
                              );
                            })()}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProduct(product);
                              }}
                              className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-800 transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {merchant.allowDirectChat !== false && merchant.serviceButtonsConfig?.showChat !== false && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!currentUser) {
                                    promptAuthRequirement('Para conversar pelo chat interno com o lojista/prestador, acesse sua conta ou cadastre-se gratuitamente.');
                                    return;
                                  }
                                  openSubOrderChat({
                                    subpedidoId: `product-inquiry-${product.id}-${currentUser.id}`,
                                    codigoSubpedido: `#PROD-${product.id.substring(0, 5).toUpperCase()}`,
                                    merchantId: product.merchantId || merchant.id,
                                    merchantName: product.merchantName || merchant.name,
                                    customerId: currentUser.id,
                                    customerName: currentUser.name || 'Cliente Achei Aqui',
                                    customerPhone: currentUser.phone,
                                    orderTitle: `Dúvida sobre: ${product.name}`,
                                    orderStatus: 'Consulta de Produto',
                                    orderTotal: product.price,
                                    productId: product.id,
                                    productName: product.name,
                                    productImage: product.images?.[0] || product.image,
                                    productPrice: product.price,
                                    isDirectProductChat: true
                                  });
                                }}
                                className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-800 transition-colors"
                                title="Conversar no chat interno"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SOBRE A LOJA */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950 mb-2">Sobre o Estabelecimento</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {merchant.description || 'Lojista local parceiro da plataforma Achei Aqui em Cachoeiras de Macacu.'}
                </p>
              </div>

              {merchant.credentials && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Credenciamento & Registro Profissional</span>
                  </div>
                  <p className="text-xs text-emerald-900">
                    <strong>Registro:</strong> {merchant.credentials.registrationNumber} ({merchant.credentials.registrationEntity})
                  </p>
                  {merchant.credentials.experienceYears && (
                    <p className="text-xs text-emerald-900">
                      <strong>Experiência:</strong> {merchant.credentials.experienceYears} anos de atuação em Cachoeiras de Macacu.
                    </p>
                  )}
                  {merchant.credentials.warrantyInfo && (
                    <p className="text-xs text-emerald-800">
                      <strong>Garantia:</strong> {merchant.credentials.warrantyInfo}
                    </p>
                  )}
                </div>
              )}

              {/* STORE GALLERY / FOTOS DO ESTABELECIMENTO */}
              {merchant.gallery && merchant.gallery.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Fotos do Estabelecimento & Portfólio ({merchant.gallery.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {merchant.gallery.map((photoUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200">
                        <img
                          src={photoUrl}
                          alt={`${merchant.name} foto ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {merchant.references && merchant.references.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Referências Comerciais & Profissionais
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {merchant.references.map((ref, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <p className="font-bold text-slate-900">{ref.name}</p>
                        <p className="text-slate-600 text-[11px]">{ref.relationshipOrRole}</p>
                        <p className="text-emerald-700 font-semibold mt-1">{ref.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Contact & Location */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Dados de Contato & Localização
                </h4>

                <div className="space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900">{merchant.address || 'Centro'}</p>
                      <p className="text-[11px] text-slate-500">{merchant.city || 'Cachoeiras de Macacu, RJ'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-semibold text-slate-900">{merchant.phone}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Horário: {merchant.openingHours}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-100">
                  <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Empresa Verificada na Cidade</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    CNPJ / Documento Oficial validado pela equipe do Achei Aqui.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AVALIAÇÕES */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">Avaliações Verificadas de Moradores</h3>
                <p className="text-xs text-slate-500">
                  Opiniões reais de clientes que compraram produtos ou contrataram serviços desta loja.
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-amber-50 px-4 py-2.5 rounded-2xl border border-amber-200">
                <div className="text-2xl font-black text-amber-900">{merchant.rating}</div>
                <div>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-amber-800">{merchant.reviewsCount} clientes avaliaram</p>
                </div>
              </div>
            </div>

            {/* Sample Reviews */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Mariana Silva (Centro)</span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  "Excelente atendimento! Os produtos vieram super bem embalados e a entrega no Centro foi em menos de 30 minutos. Recomendo muito."
                </p>
                <span className="text-[10px] text-slate-400">Há 3 dias • Compra Verificada</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Roberto Guimarães (Papucaia)</span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  "Muito pontual e confiável. Já é a terceira vez que compro nesta loja através do Achei Aqui e sempre fico 100% satisfeito."
                </p>
                <span className="text-[10px] text-slate-400">Há 1 semana • Compra Verificada</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. OTHER RECOMMENDED STORES */}
        {otherMerchants.length > 0 && (
          <div className="pt-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Outras Lojas & Comércios em {currentCity}
                </h3>
                <p className="text-xs text-emerald-700">Explore mais comércios locais recomendados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {otherMerchants.map((other) => (
                <div
                  key={other.id}
                  onClick={() => {
                    onSelectOtherStore(other.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl border border-emerald-100 p-3 shadow-xs hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all flex items-center space-x-3 group"
                >
                  <img
                    src={other.logo}
                    alt={other.name}
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-100 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800">
                      {other.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{other.category}</p>
                    <div className="flex items-center space-x-1 mt-0.5 text-[10px] text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{other.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
