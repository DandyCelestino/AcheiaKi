import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronDown,
  Compass,
  Layers,
  Sparkles,
  UserPlus,
  Store,
  User,
  Heart,
  Package,
  MapPin,
  Check
} from 'lucide-react';
import { CATEGORIES_TAXONOMY, CategoryTaxonomy } from '../../data/categoryTaxonomy';
import { useApp } from '../../context/AppContext';

interface MobileCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectShortcut: (categoryId: string, query?: string) => void;
  onOpenAuth: (tab: 'login' | 'register-customer' | 'register-merchant') => void;
  selectedCategory: string;
}

export const MobileCategoryDrawer: React.FC<MobileCategoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  onSelectShortcut,
  onOpenAuth,
  selectedCategory
}) => {
  const { currentUser, currentCity, logout } = useApp();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-emerald-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer on the Left */}
      <div className="relative w-[85%] max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        {/* Drawer Header Verde Parque da Serra */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-black text-white text-base">
              A
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white leading-none">
                MENU DE CATEGORIAS
              </h3>
              <p className="text-[10px] text-emerald-200 mt-0.5">
                🌿 Cachoeiras de Macacu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cadastro Acessível & Destaque de Perfil */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-2">
          {currentUser ? (
            <div className="flex items-center space-x-2 truncate">
              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-emerald-950 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-emerald-700">{currentUser.role}</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('register-customer');
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>CADASTRE-SE</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="py-2 px-3 bg-white border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl"
              >
                Entrar
              </button>
            </div>
          )}
        </div>

        {/* Categories List (CAIXA ALTA) with sub-shortcuts (caixa baixa) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-100">
          <div className="pb-1.5">
            <button
              onClick={() => {
                onSelectCategory('all');
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-800 hover:bg-emerald-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>TODAS AS CATEGORIAS</span>
              </div>
              {selectedCategory === 'all' && <Check className="w-4 h-4 text-emerald-300" />}
            </button>
          </div>

          <div className="pt-2 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-900/60 px-3 mb-1">
              Departamentos & Serviços:
            </p>

            {CATEGORIES_TAXONOMY.map((cat) => {
              const isExpanded = expandedCategory === cat.id;
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`rounded-xl overflow-hidden border transition-all ${
                    cat.isFirstHighlight
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-xs'
                      : 'border-emerald-100/60 bg-white'
                  }`}
                >
                  {/* Category Header (CAIXA ALTA) */}
                  <div className="flex items-center justify-between p-2.5 hover:bg-emerald-50/70 transition-colors">
                    <button
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onClose();
                      }}
                      className="flex-1 text-left flex items-center space-x-2 pr-2"
                    >
                      <span className={`text-xs font-black tracking-wide uppercase ${
                        isSelected ? 'text-emerald-900 font-extrabold' : 'text-slate-800'
                      }`}>
                        {cat.name}
                      </span>
                      {cat.badge && (
                        <span className="text-[9px] font-extrabold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded">
                          {cat.badge}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                      className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100"
                      title="Ver atalhos"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-emerald-800' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Shortcuts List (caixa baixa) */}
                  {isExpanded && (
                    <div className="bg-emerald-50/40 p-2 border-t border-emerald-100 space-y-1">
                      <p className="text-[10px] text-slate-500 px-2 py-0.5 leading-tight">
                        {cat.description}
                      </p>
                      {cat.shortcuts.map((shortcut) => (
                        <button
                          key={shortcut.id}
                          onClick={() => {
                            onSelectShortcut(cat.id, shortcut.query);
                            onClose();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs lowercase font-medium text-slate-700 hover:bg-emerald-100 hover:text-emerald-950 flex items-center justify-between transition-colors"
                        >
                          <span>{shortcut.label}</span>
                          <ChevronRight className="w-3 h-3 text-emerald-600" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-emerald-900 text-emerald-100 text-xs border-t border-emerald-800 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenAuth('register-merchant');
            }}
            className="w-full py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-emerald-300" />
            <span>Quero Vender no Achei Aqui</span>
          </button>

          <p className="text-[10px] text-emerald-300/80 text-center">
            Plataforma 100% Cachoeirense 🌿
          </p>
        </div>
      </div>
    </div>
  );
};
