import React from 'react';
import {
  Home,
  Menu,
  ShoppingBag,
  Heart,
  User,
  Package
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: (initialTab?: 'login' | 'register-customer' | 'register-merchant') => void;
  onOpenMobileMenu: () => void;
  onOpenCart?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAuth,
  onOpenMobileMenu,
  onOpenCart
}) => {
  const { currentUser, favorites, cart } = useApp();

  return (
    <nav aria-label="Navegação móvel" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-t border-emerald-900/15 px-1.5 py-1 shadow-2xl safe-area-pb">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {/* 1. Início */}
        <button
          id="mobile-nav-home"
          onClick={() => {
            setCurrentTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            currentTab === 'home'
              ? 'text-emerald-800 font-black'
              : 'text-slate-600 hover:text-emerald-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'text-emerald-800 stroke-[2.5]' : 'text-slate-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Início</span>
        </button>

        {/* 2. Menu Lateral de Categorias */}
        <button
          id="mobile-nav-categories"
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all text-slate-600 hover:text-emerald-900"
        >
          <div className="relative">
            <Menu className="w-5 h-5 text-emerald-800" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Menu</span>
        </button>

        {/* 3. Gostei (Favoritos / Coração) */}
        <button
          id="mobile-nav-favorites"
          onClick={() => {
            setCurrentTab('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            currentTab === 'account'
              ? 'text-emerald-800 font-black'
              : 'text-slate-600 hover:text-emerald-800'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : 'text-slate-500'}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-black leading-none border border-white">
                {favorites.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Gostei</span>
        </button>

        {/* 4. Carrinho / Sacola de Compras */}
        <button
          id="mobile-nav-cart"
          onClick={() => {
            if (onOpenCart) {
              onOpenCart();
            }
          }}
          className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all text-slate-600 hover:text-emerald-800"
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${cart.length > 0 ? 'text-emerald-800' : 'text-slate-500'}`} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[9px] font-black leading-none border border-white animate-pulse">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Carrinho</span>
        </button>

        {/* 5. Perfil / Conta */}
        <button
          id="mobile-nav-account"
          onClick={() => {
            if (!currentUser) {
              onOpenAuth('login');
            } else {
              setCurrentTab('account');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            currentTab === 'account'
              ? 'text-emerald-800 font-black'
              : 'text-slate-600 hover:text-emerald-800'
          }`}
        >
          <User className={`w-5 h-5 ${currentUser ? 'text-emerald-800' : 'text-slate-500'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">
            {currentUser ? 'Perfil' : 'Entrar'}
          </span>
        </button>
      </div>
    </nav>
  );
};

