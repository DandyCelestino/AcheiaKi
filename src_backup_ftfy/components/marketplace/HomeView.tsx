import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  MapPin,
  Star,
  Truck,
  Package,
  Shirt,
  Store,
  ChevronRight,
  Flame,
  Tag,
  ArrowRight,
  ShieldCheck,
  Heart,
  SlidersHorizontal,
  X,
  Compass
} from 'lucide-react';
import { Product, ServiceItem, StoreMerchant } from '../../types';
import { useApp } from '../../context/AppContext';
import { INITIAL_BANNERS } from '../../data/initialData';
import { CATEGORIES_TAXONOMY, matchItemToCategory } from '../../data/categoryTaxonomy';
import { CategoryProductBlock } from './CategoryProductBlock';
import { FullWidthCarouselBanner } from './FullWidthCarouselBanner';
import { CachoeirasInteractiveMap } from './CachoeirasInteractiveMap';

interface HomeViewProps {
  onSelectProduct: (product: Product) => void;
  onSelectService: (service: ServiceItem) => void;
  onOpenCheckout: (product: Product, initialModality?: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO') => void;
  onOpenBooking: (service: ServiceItem) => void;
  onSelectStore?: (merchantId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectProduct,
  onSelectService,
  onOpenCheckout,
  onOpenBooking,
  onSelectStore,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const {
    products,
    services,
    merchants,
    currentCity,
    interCategoryBanners,
    frontendConfig,
    adSpaces
  } = useApp();

  const [activeModalityFilter, setActiveModalityFilter] = useState<'ALL' | 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO'>('ALL');
  const [currentHeroBannerIdx, setCurrentHeroBannerIdx] = useState(0);

  // Filter products by modality and similarity search across all database fields
  const searchTokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const matchesSearch = (haystack: string) => {
    if (searchTokens.length === 0) return true;
    const lower = haystack.toLowerCase();
    // Matches if all search words are present anywhere in the item details
    return searchTokens.every((token) => lower.includes(token));
  };

  const activeProducts = products.filter((prod) => {
    if (prod.status !== 'active') return false;

    // Multi-term similarity search
    if (searchTokens.length > 0) {
      const specsText = prod.specs ? Object.values(prod.specs).join(' ') : '';
      const fullText = `${prod.name} ${prod.description || ''} ${prod.merchantName || ''} ${prod.category || ''} ${prod.subcategory || ''} ${prod.merchantCategory || ''} ${prod.merchantAddress || ''} ${specsText}`;
      if (!matchesSearch(fullText)) return false;
    }

    // Modality filter
    if (activeModalityFilter === 'DELIVERY' && !prod.availableModalities?.includes('DELIVERY')) {
      return false;
    }
    if (activeModalityFilter === 'RETIRADA' && !prod.availableModalities?.includes('RETIRADA')) {
      return false;
    }
    if (activeModalityFilter === 'EXPERIMENTAÇÃO' && !prod.availableModalities?.includes('EXPERIMENTAÇÃO')) {
      return false;
    }

    return true;
  });

  // Convert active services into unified displayable items
  const convertedServices: Product[] = services
    .filter((s) => {
      if (s.status !== 'active') return false;
      if (searchTokens.length > 0) {
        const fullText = `${s.title} ${s.description || ''} ${s.merchantName || ''} ${s.category || ''} ${s.subcategory || ''} ${s.merchantCategory || ''} ${s.merchantAddress || ''}`;
        if (!matchesSearch(fullText)) return false;
      }
      return true;
    })
    .map((s) => ({
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
      subcategory: s.subcategory,
      advanceFeeRequired: s.advanceFeeRequired,
      advanceFeeAmount: s.advanceFeeAmount,
      pixKey: s.pixKey,
      pixKeyType: s.pixKeyType,
      pixBeneficiaryName: s.pixBeneficiaryName,
      stock: 99,
      itemType: s.itemType || 'SERVICO',
      availableModalities: ['RETIRADA', 'DELIVERY'],
      rating: s.merchantRating || 5.0,
      reviewsCount: 32,
      status: 'active',
      createdAt: '2026-01-01'
    }));

  const allActivePostings = [...activeProducts, ...convertedServices];
  const approvedMerchants = merchants.filter((m) => m.status === 'approved');
  const currentHeroBanner = INITIAL_BANNERS[currentHeroBannerIdx] || INITIAL_BANNERS[0];

  // Categories to display
  const categoriesToDisplay = selectedCategory !== 'all'
    ? CATEGORIES_TAXONOMY.filter((c) => c.id === selectedCategory)
    : CATEGORIES_TAXONOMY;

  return (
    <div className="space-y-6 sm:space-y-10 pb-20">
      {/* 1. TOP ANNOUNCEMENT BAR (Serra da Mata Emerald Theme) */}
      {frontendConfig?.topAnnouncementActive && frontendConfig?.topAnnouncementText && (
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white text-xs font-bold py-2 px-4 text-center shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{frontendConfig.topAnnouncementText}</span>
        </div>
      )}

      {/* 2. HERO PROMOTIONAL BANNER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
        <div
          className={`relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-slate-950/90 text-white shadow-xl min-h-[220px] sm:min-h-[280px] flex items-center border border-emerald-800/40`}
        >
          {/* Background Image Banner */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSamDps2myzG8QwRu24BwdyMLSzrZINmJoIxjaciwTCWQ&s=10"
              alt="Banner de Destaque Achei Aqui"
              className="w-full h-full object-cover object-center transform scale-105"
              referrerPolicy="no-referrer"
              loading="eager"
            />
            {/* Dark & Emerald Overlay for contrast and readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-emerald-950/85 to-slate-950/60" />
          </div>

          <div className="relative z-10 p-5 sm:p-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-600/30 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-[11px] sm:text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>🌿 PARQUE DA SERRA • 100% LOCAL</span>
            </div>

            <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {currentHeroBanner.title}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-none">
              {currentHeroBanner.subtitle}
            </p>

            <div className="pt-2 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => {
                  if (currentHeroBanner.categoryFilter) {
                    setSelectedCategory(currentHeroBanner.categoryFilter);
                  }
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg active:scale-95 transition-all flex items-center space-x-2"
              >
                <span>{currentHeroBanner.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentHeroBannerIdx((prev) => (prev + 1) % INITIAL_BANNERS.length)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
              >
                Próximo Destaque ({currentHeroBannerIdx + 1}/{INITIAL_BANNERS.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de Filtro Ativo do Menu Superior (se selecionado) */}
      {selectedCategory !== 'all' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase text-emerald-950">
                Categoria selecionada via menu:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wide">
                {CATEGORIES_TAXONOMY.find((c) => c.id === selectedCategory)?.name || selectedCategory}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center space-x-1 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver todas as categorias</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. LOJAS VERIFICADAS EM DESTAQUE */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-emerald-950 leading-tight">
              Lojas & Estabelecimentos em Destaque
            </h3>
            <p className="text-xs text-emerald-700">
              Comércio e lojistas verificados em {currentCity}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              document.getElementById('mapa-interativo-cachoeiras')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ver no Mapa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {approvedMerchants.map((store) => (
            <div
              key={store.id}
              onClick={() => {
                if (onSelectStore) {
                  onSelectStore(store.id);
                } else {
                  const storeFirstProduct = products.find((p) => p.merchantId === store.id);
                  if (storeFirstProduct) onSelectProduct(storeFirstProduct);
                }
              }}
              className="bg-white rounded-2xl border border-emerald-100 p-3.5 shadow-xs hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all flex items-center space-x-3.5 group"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-emerald-50 shrink-0 border border-emerald-100">
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                    {store.name}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 truncate">{store.category}</p>
                <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-600">
                  <span className="flex items-center text-amber-600 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                    {store.rating} ({store.reviewsCount})
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">{store.deliveryTimeEstimate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. MAPA INTERATIVO (LEAFLET.JS) - PONTOS DE INTERESSE & LOJISTAS */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8" id="mapa-interativo-cachoeiras">
        <CachoeirasInteractiveMap
          merchants={merchants}
          onSelectStore={onSelectStore}
        />
      </div>

      {/* 6. CATEGORY PRODUCT BLOCKS WITH INTER-CATEGORY BANNERS */}
      <div className="space-y-8 sm:space-y-12">
        {categoriesToDisplay.map((category) => {
          const categoryPostings = allActivePostings.filter((p) =>
            matchItemToCategory(
              {
                name: p.name,
                category: p.category,
                merchantCategory: p.merchantCategory,
                description: p.description
              },
              category.id
            )
          );

          // Fallback if empty to ensure visual consistency
          const displayedItems = categoryPostings.length > 0
            ? categoryPostings
            : allActivePostings.slice(0, 8);

          // Check if there is an inter-category banner configured after this category
          const linkedInterBanner = interCategoryBanners.find(
            (b) => b.targetCategoryAfter === category.id && b.status === 'active'
          );

          return (
            <React.Fragment key={category.id}>
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                {/* Category Product Block */}
                <CategoryProductBlock
                  categoryKey={category.id}
                  categoryTitle={category.name}
                  categoryIcon={category.icon}
                  categoryDescription={category.description}
                  products={displayedItems}
                  onSelectProduct={onSelectProduct}
                  onSelectStore={onSelectStore}
                  onOpenBooking={onOpenBooking}
                  onNavigateToCategory={(catKey) => {
                    setSelectedCategory(catKey);
                    setSearchQuery('');
                  }}
                />
              </div>

              {/* Autoplay Inter-Category Banner Carousel */}
              {linkedInterBanner && linkedInterBanner.slides.length > 0 && (
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                  <FullWidthCarouselBanner
                    banner={linkedInterBanner}
                    onSlideClick={(slide) => {
                      if (slide.linkUrl) {
                        setSelectedCategory(slide.linkUrl);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
