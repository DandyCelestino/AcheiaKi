import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MapPin,
  ShoppingBag,
  Heart,
  User as UserIcon,
  Store,
  ChevronDown,
  LogOut,
  X,
  Menu,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Compass,
  Wrench,
  Stethoscope,
  Scissors,
  UtensilsCrossed,
  Car,
  PawPrint,
  Home,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Phone,
  Tag,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES_TAXONOMY, CategoryTaxonomy } from '../../data/categoryTaxonomy';
import { Product, StoreMerchant, ServiceItem } from '../../types';
import { NotificationBellDropdown } from '../notifications/NotificationBellDropdown';

interface HeaderProps {
  onOpenAuth: (initialTab?: 'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver') => void;
  onOpenCart: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectCategory?: (catId: string) => void;
  selectedCategory?: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onToggleMobileMenu: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectStore?: (merchantId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenCart,
  searchQuery,
  setSearchQuery,
  onSelectCategory,
  selectedCategory = 'all',
  currentTab,
  setCurrentTab,
  onToggleMobileMenu,
  onSelectProduct,
  onSelectStore
}) => {
  const {
    currentUser,
    setCurrentEnvironment,
    currentCity,
    setCurrentCity,
    cart,
    favorites,
    logout,
    frontendConfig,
    openPolicyModal,
    openUserManualModal,
    merchants,
    products,
    services
  } = useApp();

  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeCategoryDropdown, setActiveCategoryDropdown] = useState<string | null>(null);
  const [showStoresDropdown, setShowStoresDropdown] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const CITIES = [
    'Cachoeiras de Macacu, RJ',
    'Papucaia - Cachoeiras, RJ',
    'Japuiíba - Cachoeiras, RJ',
    'Faraó - Cachoeiras, RJ',
    'Guapiaçu - Cachoeiras, RJ'
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveCategoryDropdown(null);
        setShowStoresDropdown(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Similarity Search Results across the entire database
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return { products: [], services: [], stores: [] };

    const searchTokens = q.split(/\s+/).filter(Boolean);

    const matchesTerms = (text: string) => {
      const lower = text.toLowerCase();
      return searchTokens.every((token) => lower.includes(token));
    };

    const matchedProducts = products.filter((p) => {
      if (p.status !== 'active') return false;
      const haystack = `${p.name} ${p.description || ''} ${p.category || ''} ${p.subcategory || ''} ${p.merchantName || ''} ${p.merchantCategory || ''}`;
      return matchesTerms(haystack);
    }).slice(0, 5);

    const matchedServices = services.filter((s) => {
      if (s.status !== 'active') return false;
      const haystack = `${s.title} ${s.description || ''} ${s.category || ''} ${s.subcategory || ''} ${s.merchantName || ''}`;
      return matchesTerms(haystack);
    }).slice(0, 4);

    const matchedStores = merchants.filter((m) => {
      if (m.status !== 'approved') return false;
      const haystack = `${m.name} ${m.description || ''} ${m.category || ''} ${m.subcategory || ''} ${m.neighborhood || ''} ${m.address || ''}`;
      return matchesTerms(haystack);
    }).slice(0, 4);

    return {
      products: matchedProducts,
      services: matchedServices,
      stores: matchedStores
    };
  }, [searchQuery, products, services, merchants]);

  const approvedStores = merchants.filter((m) => m.status === 'approved');

  const handleSelectShortcut = (category: CategoryTaxonomy, shortcutQuery?: string, shortcutId?: string) => {
    if (onSelectCategory) {
      onSelectCategory(category.id);
    }
    if (shortcutQuery) {
      setSearchQuery(shortcutQuery);
    }
    setActiveCategoryDropdown(null);
    setShowStoresDropdown(false);
    setCurrentTab('home');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleSelectEntireCategory = (categoryId: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    setSearchQuery('');
    setActiveCategoryDropdown(null);
    setShowStoresDropdown(false);
    setCurrentTab('home');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleOpenStoreFromDropdown = (storeId: string) => {
    if (onSelectStore) {
      onSelectStore(storeId);
    }
    setShowStoresDropdown(false);
    setActiveCategoryDropdown(null);
    setShowSearchSuggestions(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      {/* Top Banner Verde Serra da Mata */}
      <div className="relative bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-emerald-100 text-[11px] font-semibold py-1.5 px-3 sm:px-6 overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 opacity-20 mix-blend-luminosity pointer-events-none">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSamDps2myzG8QwRu24BwdyMLSzrZINmJoIxjaciwTCWQ&s=10"
            alt="Banner Cabeçalho"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-700/60 text-emerald-200 text-[10px] font-bold">
              🌿 Parque da Serra & Florestas
            </span>
            <span className="truncate">O shopping online das matas de Cachoeiras de Macacu - RJ</span>
          </div>

          <div className="flex items-center space-x-3 shrink-0 text-emerald-200 text-xs">
            <span className="hidden md:inline font-medium">Acesso seguro SSL • Cachoeiras de Macacu</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* Mobile Menu Hamburger + Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Hamburger Button for Mobile Drawer */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 transition-colors focus:outline-none"
              title="Abrir Menu de Categorias"
              aria-label="Abrir Menu Lateral de Categorias"
            >
              <Menu className="w-6 h-6 text-emerald-800" />
            </button>

            {/* Logo */}
            <button
              onClick={() => {
                setCurrentEnvironment('MARKETPLACE');
                setCurrentTab('home');
                if (onSelectCategory) onSelectCategory('all');
                setSearchQuery('');
              }}
              className="flex items-center space-x-2 text-left focus:outline-none group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-green-600 text-white font-black text-base sm:text-xl flex items-center justify-center shadow-md shadow-emerald-800/20 group-hover:scale-105 transition-transform shrink-0">
                {frontendConfig?.logoLetter || 'A'}
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-emerald-950 leading-none group-hover:text-emerald-800 transition-colors">
                  {frontendConfig?.siteTitle || 'Achei Aqui'}
                </h1>
                <span className="text-[9px] sm:text-[10px] text-emerald-700 font-extrabold tracking-wider uppercase flex items-center gap-1">
                  <span>🍃 Cachoeiras de Macacu</span>
                </span>
              </div>
            </button>

            {/* City Selector */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-emerald-900 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="max-w-[130px] truncate">{currentCity}</span>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              </button>

              {showCityDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50 animate-in fade-in duration-150">
                  <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800/60">
                    Selecione sua Região
                  </p>
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setCurrentCity(city);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        currentCity === city
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Global Search Bar (Desktop) with Live Similarity Search */}
          <div ref={searchContainerRef} className="flex-1 max-w-lg mx-2 hidden sm:block relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                placeholder="Buscar produtos, serviços, lojas ou ofertas em todo o banco..."
                className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-emerald-50/50 hover:bg-emerald-50 focus:bg-white border border-emerald-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 rounded-full text-xs sm:text-sm text-slate-900 placeholder-emerald-900/40 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-emerald-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Suggestions Dropdown */}
            {showSearchSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-emerald-200 p-3 z-50 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100 mb-2">
                  <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                    Resultados para "{searchQuery}"
                  </span>
                  <button
                    onClick={() => setShowSearchSuggestions(false)}
                    className="text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stores found */}
                {searchResults.stores.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[9px] font-black uppercase text-emerald-700 block px-1 mb-1">
                      🏪 Lojas & Estabelecimentos:
                    </span>
                    <div className="space-y-1">
                      {searchResults.stores.map((store) => (
                        <button
                          key={store.id}
                          onClick={() => handleOpenStoreFromDropdown(store.id)}
                          className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={store.logo}
                              alt={store.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-lg object-cover border border-emerald-100"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                                {store.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {store.neighborhood} • {store.category}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-500">
                            ★ {store.rating}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products found */}
                {searchResults.products.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[9px] font-black uppercase text-emerald-700 block px-1 mb-1">
                      📦 Produtos:
                    </span>
                    <div className="space-y-1">
                      {searchResults.products.map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => {
                            if (onSelectProduct) onSelectProduct(prod);
                            setShowSearchSuggestions(false);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center space-x-2">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-lg object-cover border border-emerald-100"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 truncate max-w-[220px]">
                                {prod.name}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {prod.merchantName}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-emerald-950">
                            R$ {(prod.price ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services found */}
                {searchResults.services.length > 0 && (
                  <div>
                    <span className="text-[9px] font-black uppercase text-emerald-700 block px-1 mb-1">
                      🛠️ Serviços & Consultórios:
                    </span>
                    <div className="space-y-1">
                      {searchResults.services.map((serv) => (
                        <button
                          key={serv.id}
                          onClick={() => {
                            setShowSearchSuggestions(false);
                            setCurrentTab('home');
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                              {serv.title}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {serv.merchantName} • {serv.category}
                            </p>
                          </div>
                          <span className="text-xs font-black text-emerald-950">
                            R$ {(serv.price ?? 0).toFixed(2).replace('.', ',')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.stores.length === 0 && searchResults.products.length === 0 && searchResults.services.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Nenhum resultado direto encontrado. Pressione Enter para buscar globalmente.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Action Buttons & Auth (Desktop and Mobile) */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Botão CADASTRE-SE - Visível APENAS para usuários NÃO cadastrados/logados */}
            {!currentUser && (
              <button
                id="header-register-btn"
                onClick={() => onOpenAuth('register-customer')}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] sm:text-xs font-black shadow-sm shadow-emerald-700/30 hover:shadow-md transition-all shrink-0 cursor-pointer"
                title="Cadastre-se na plataforma"
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>CADASTRE-SE</span>
              </button>
            )}

            {/* Favorites Icon (Desktop) */}
            <button
              onClick={() => setCurrentTab('account')}
              className="hidden sm:flex relative p-2 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors"
              title="Meus Favoritos"
            >
              <Heart className="w-5 h-5 text-emerald-800" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Notifications Bell Dropdown (In-App) */}
            <NotificationBellDropdown onNavigateTab={(tab) => setCurrentTab(tab as any)} />

            {/* Cart Icon (Desktop) */}
            <button
              onClick={onOpenCart}
              className="hidden sm:flex relative p-2 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors"
              title="Sacola de Compras"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-800" />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>

            <div className="hidden sm:block w-px h-6 bg-slate-200"></div>

            {/* Quick Access to Seller Portal when logged in as seller */}
            {(currentUser?.role === 'VENDEDOR' || currentUser?.role === 'REPRESENTANTE_COMERCIAL') && (
              <button
                id="header-btn-quick-seller-portal"
                onClick={() => setCurrentEnvironment('COMMERCIAL_PORTAL')}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                title="Retornar ao Meu Painel do Vendedor"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Painel do Vendedor</span>
              </button>
            )}

            {/* User Account / Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center space-x-1.5 p-1 rounded-full hover:bg-emerald-50 transition-colors ${
                    currentUser.role === 'VENDEDOR' || currentUser.role === 'REPRESENTANTE_COMERCIAL'
                      ? 'ring-2 ring-indigo-500/50'
                      : ''
                  }`}
                  title="Minha Conta"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-emerald-300"
                    />
                  ) : (
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
                      currentUser.role === 'VENDEDOR' || currentUser.role === 'REPRESENTANTE_COMERCIAL'
                        ? 'bg-indigo-600'
                        : 'bg-emerald-700'
                    } text-white flex items-center justify-center font-bold text-xs`}>
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <ChevronDown className="w-3 h-3 text-emerald-700 hidden sm:block" />
                </button>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50 animate-in fade-in duration-150">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 ${
                        currentUser.role === 'VENDEDOR' || currentUser.role === 'REPRESENTANTE_COMERCIAL'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      } text-[10px] font-bold rounded-full border`}>
                        Perfil: {currentUser.role}
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      {/* Acesso exclusivo do Vendedor Comercial: Retornar ao Portal do Vendedor Pessoal Imediatamente */}
                      {(currentUser.role === 'VENDEDOR' || currentUser.role === 'REPRESENTANTE_COMERCIAL') && (
                        <button
                          id="avatar-btn-seller-portal"
                          onClick={() => {
                            setCurrentEnvironment('COMMERCIAL_PORTAL');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-indigo-950 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 font-bold flex items-center justify-between border border-indigo-200 shadow-xs cursor-pointer transition-all mb-1.5"
                        >
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-indigo-700 shrink-0" />
                            <span>Meu Painel do Vendedor</span>
                          </div>
                          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                            Liberado
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setCurrentTab('account');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-medium flex items-center space-x-2"
                      >
                        <UserIcon className="w-4 h-4 text-emerald-700" />
                        <span>Minha Conta & Pedidos</span>
                      </button>

                      <button
                        onClick={() => {
                          openUserManualModal(currentUser.role === 'VENDEDOR' ? 'LOGISTAS' : 'CLIENTES');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-amber-900 bg-amber-50/70 hover:bg-amber-100 font-bold flex items-center space-x-2"
                      >
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <span>Manual de Uso & Normas</span>
                      </button>

                      <button
                        onClick={() => {
                          openPolicyModal('customer');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-medium flex items-center space-x-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Políticas de Avaliação</span>
                      </button>

                      {/* Acesso exclusivo do Lojista / Prestador de Serviço */}
                      {(currentUser.role === 'LOJISTA' || currentUser.role === 'PRESTADOR_SERVICO') && (
                        <button
                          id="avatar-btn-merchant-portal"
                          onClick={() => {
                            setCurrentEnvironment('SELLER_PORTAL');
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-emerald-800 hover:bg-emerald-100 font-bold flex items-center space-x-2"
                        >
                          <Store className="w-4 h-4 text-emerald-700" />
                          <span>Meu Painel do Lojista</span>
                        </button>
                      )}

                      {currentUser.role === 'MASTER' && (
                        <>
                          <button
                            onClick={() => {
                              setCurrentEnvironment('COMMERCIAL_PORTAL');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 font-bold flex items-center space-x-2"
                          >
                            <Briefcase className="w-4 h-4 text-indigo-700" />
                            <span>Portal da Equipe Comercial</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentEnvironment('MASTER_PANEL');
                              setShowProfileMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-emerald-900 hover:bg-emerald-100 font-bold flex items-center space-x-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            <span>Painel Administrativo Master</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Conta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors shrink-0"
              >
                Entrar
              </button>
            )}
          </div>
        </div>

        {/* 📱 MOBILE QUICK ACTION STRIP (FORMATADO PARA TODOS OS SMARTPHONES, SEMPRE VISÍVEL ABAIXO DE CADASTRE-SE) */}
        <div className="sm:hidden pt-1 pb-2 border-t border-emerald-100/70">
          <div className="grid grid-cols-4 gap-1.5 items-center">
            {/* 1. Gostei / Favoritos */}
            <button
              id="mobile-action-favorites"
              onClick={() => {
                setCurrentTab('account');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center justify-center space-x-1 py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-xs relative min-h-[44px]"
            >
              <Heart className={`w-4 h-4 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : 'text-emerald-700'}`} />
              <span className="text-[11px]">Gostei</span>
              {favorites.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-black">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* 2. Carrinho / Sacola */}
            <button
              id="mobile-action-cart"
              onClick={onOpenCart}
              className="flex items-center justify-center space-x-1 py-2 px-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl border border-emerald-900 text-xs font-bold transition-all active:scale-95 shadow-xs relative min-h-[44px]"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="text-[11px]">Carrinho</span>
              {cart.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-emerald-950 rounded-full text-[9px] font-black animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>

            {/* 3. Acesso Perfil / Minha Conta ou Meu Painel do Vendedor */}
            {(currentUser?.role === 'VENDEDOR' || currentUser?.role === 'REPRESENTANTE_COMERCIAL') ? (
              <button
                id="mobile-action-seller-portal"
                onClick={() => setCurrentEnvironment('COMMERCIAL_PORTAL')}
                className="flex items-center justify-center space-x-1 py-2 px-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs truncate min-h-[44px]"
                title="Retornar ao Meu Painel do Vendedor"
              >
                <Briefcase className="w-4 h-4 text-white shrink-0" />
                <span className="text-[11px] truncate">Meu Painel</span>
              </button>
            ) : (
              <button
                id="mobile-action-profile"
                onClick={() => {
                  if (currentUser) {
                    setCurrentTab('account');
                  } else {
                    onOpenAuth('login');
                  }
                }}
                className="flex items-center justify-center space-x-1 py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-xs truncate min-h-[44px]"
              >
                <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] truncate">
                  {currentUser ? (currentUser.name.split(' ')[0] || 'Conta') : 'Perfil'}
                </span>
              </button>
            )}

            {/* 4. Seleção Cidade / Região */}
            <button
              id="mobile-action-location"
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center justify-center space-x-0.5 py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-xs truncate min-h-[44px]"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-[10px] truncate max-w-[55px]">
                {currentCity.split(',')[0].replace(' - Cachoeiras', '')}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            </button>
          </div>

          {/* Mobile City Dropdown Modal */}
          {showCityDropdown && (
            <div className="mt-2 bg-white rounded-2xl shadow-xl border border-emerald-200 p-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-2 pb-1.5 border-b border-emerald-100 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  📍 Região em Cachoeiras de Macacu
                </span>
                <button
                  onClick={() => setShowCityDropdown(false)}
                  className="text-slate-400 hover:text-emerald-900 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setCurrentCity(city);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      currentCity === city
                        ? 'bg-emerald-800 text-white'
                        : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🌿 DESKTOP SUPERIOR CATEGORIES & STORES DROPDOWN MENU */}
        <div ref={dropdownRef} className="hidden md:block relative border-t border-emerald-100/80 py-1 max-w-full overflow-visible">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 text-xs">
            {/* Todos os Itens */}
            <button
              onClick={() => {
                handleSelectEntireCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-[11px] tracking-wide uppercase transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-950 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>TODAS AS CATEGORIAS</span>
            </button>

            {/* Menu Dropdown de LOJAS (Mostrando as lojas parceiras diretamente no dropdown) */}
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowStoresDropdown(!showStoresDropdown);
                  setActiveCategoryDropdown(null);
                }}
                className={`px-3 py-1.5 rounded-xl font-black text-[11px] tracking-wide uppercase flex items-center gap-1.5 transition-all ${
                  showStoresDropdown
                    ? 'bg-emerald-800 text-white shadow-md'
                    : selectedCategory === 'lojas'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-950 font-black border border-emerald-300/80 hover:bg-emerald-100'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span>LOJAS</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {approvedStores.length} lojas
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showStoresDropdown ? 'rotate-180 text-emerald-200' : 'text-slate-400'}`} />
              </button>

              {/* Dropdown Suspenso com Lojas de Cachoeiras */}
              {showStoresDropdown && (
                <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-emerald-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-emerald-100">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-emerald-700" />
                      <span className="font-black text-xs uppercase tracking-wider text-emerald-950">
                        Lojas & Comércios de Cachoeiras
                      </span>
                    </div>
                    <button
                      onClick={() => handleSelectEntireCategory('lojas')}
                      className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5"
                    >
                      <span>Ver todas</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                    {approvedStores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => handleOpenStoreFromDropdown(store.id)}
                        className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 flex items-center space-x-3 transition-colors border border-transparent hover:border-emerald-100 group"
                      >
                        <img
                          src={store.logo}
                          alt={store.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-emerald-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 truncate">
                            {store.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">
                            {store.neighborhood} • {store.category}
                          </p>
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px]">
                            <span className="font-bold text-amber-500">★ {store.rating}</span>
                            <span className="text-emerald-600 font-medium">Entrega e Retirada</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Outras Categorias com Dropdown de Subcategorias */}
            {CATEGORIES_TAXONOMY.filter((c) => c.id !== 'lojas').map((category, idx) => {
              const isOpen = activeCategoryDropdown === category.id;
              const isSelected = selectedCategory === category.id;
              const isRightSide = idx > 4;

              return (
                <div key={category.id} className="relative shrink-0">
                  <button
                    onClick={() => {
                      setActiveCategoryDropdown(isOpen ? null : category.id);
                      setShowStoresDropdown(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-[11px] tracking-wide uppercase flex items-center gap-1.5 transition-all ${
                      isOpen
                        ? 'bg-emerald-800 text-white shadow-md'
                        : isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : category.isFirstHighlight
                        ? 'bg-emerald-50 text-emerald-950 font-black border border-emerald-300/80 hover:bg-emerald-100'
                        : 'text-slate-800 hover:text-emerald-950 hover:bg-emerald-50'
                    }`}
                  >
                    <span>{category.name}</span>
                    {category.badge && !isSelected && !isOpen && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {category.badge}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-200' : 'text-slate-400'}`} />
                  </button>

                  {/* Dropdown de Subcategorias (em caixa baixa) */}
                  {isOpen && (
                    <div className={`absolute ${isRightSide ? 'right-0' : 'left-0'} mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-emerald-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-100">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs uppercase tracking-wider text-emerald-950">
                            {category.name}
                          </span>
                          {category.badge && (
                            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              {category.badge}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelectEntireCategory(category.id)}
                          className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5"
                        >
                          <span>Ver toda categoria</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        {category.description}
                      </p>

                      <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-none">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800/60 block px-2 mb-1">
                          Subcategorias ({category.shortcuts.length}):
                        </span>
                        {category.shortcuts.map((shortcut) => (
                          <button
                            key={shortcut.id}
                            onClick={() => handleSelectShortcut(category, shortcut.query, shortcut.id)}
                            className="w-full text-left px-2.5 py-2 rounded-xl text-xs lowercase font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-950 flex items-center justify-between transition-all group"
                          >
                            <span className="group-hover:translate-x-1 transition-transform">
                              {shortcut.label || shortcut.name}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Search Bar (under header for smartphone) */}
        <div className="pb-2.5 pt-0.5 sm:hidden">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos, lojas ou serviços em Cachoeiras..."
              className="w-full pl-9 pr-9 py-2.5 bg-emerald-50/70 border border-emerald-200 focus:bg-white focus:border-emerald-600 rounded-full text-xs text-slate-900 placeholder-emerald-900/40 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-emerald-700 absolute left-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
