import React, { useState } from 'react';
import {
  Layout,
  Menu,
  Sliders,
  Type,
  FileText,
  Phone,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavMenuItem, FrontendCustomization } from '../../types';

export const MasterFrontendView: React.FC = () => {
  const {
    frontendConfig,
    updateFrontendConfig,
    addNavMenuItem,
    updateNavMenuItem,
    deleteNavMenuItem,
    reorderNavMenuItems,
    triggerToast
  } = useApp();

  const [activeSection, setActiveSection] = useState<'header' | 'menus' | 'home-layout' | 'merchant-rules' | 'footer'>('header');

  // Form local states
  const [headerForm, setHeaderForm] = useState({
    siteTitle: frontendConfig.siteTitle,
    siteSubtitle: frontendConfig.siteSubtitle,
    logoLetter: frontendConfig.logoLetter,
    logoImageUrl: frontendConfig.logoImageUrl || '',
    topAnnouncementText: frontendConfig.topAnnouncementText,
    topAnnouncementActive: frontendConfig.topAnnouncementActive,
    headerCtaText: frontendConfig.headerCtaText,
    headerCtaLink: frontendConfig.headerCtaLink
  });

  const [layoutForm, setLayoutForm] = useState({
    categoryProductsLimit: frontendConfig.categoryProductsLimit || 24,
    categoryBlockSize: frontendConfig.categoryBlockSize || 4,
    enableInterCategoryBanners: frontendConfig.enableInterCategoryBanners !== false,
    categoryOrder: frontendConfig.categoryOrder || ['gastronomia', 'moda', 'eletronicos', 'flores', 'beleza', 'mercado']
  });

  const [rulesForm, setRulesForm] = useState({
    merchantPostingPolicy: frontendConfig.merchantPostingPolicy || 'FREE',
    maxProductsPerMerchant: frontendConfig.maxProductsPerMerchant || 60,
    allowMerchantHighlightAuction: frontendConfig.allowMerchantHighlightAuction !== false
  });

  const [footerForm, setFooterForm] = useState({
    footerAboutText: frontendConfig.footerAboutText,
    footerSupportPhone: frontendConfig.footerSupportPhone,
    footerSupportEmail: frontendConfig.footerSupportEmail,
    footerSupportWhatsApp: frontendConfig.footerSupportWhatsApp,
    footerAddress: frontendConfig.footerAddress,
    footerCopyrightText: frontendConfig.footerCopyrightText,
    footerCol1Title: frontendConfig.footerCol1Title,
    footerCol2Title: frontendConfig.footerCol2Title,
    footerCol3Title: frontendConfig.footerCol3Title
  });

  // Modal for new menu item
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [menuItemForm, setMenuItemForm] = useState<{
    label: string;
    target: string;
    badge: string;
    isVisible: boolean;
  }>({
    label: '',
    target: 'home',
    badge: '',
    isVisible: true
  });

  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    updateFrontendConfig(headerForm);
    triggerToast('Cabeçalho atualizado com sucesso no frontend!');
  };

  const handleSaveLayout = (e: React.FormEvent) => {
    e.preventDefault();
    updateFrontendConfig(layoutForm);
    triggerToast('Layout da Home e vitrines de produtos atualizados!');
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateFrontendConfig(rulesForm);
    triggerToast('Políticas de postagens de lojistas salvas!');
  };

  const handleSaveFooter = (e: React.FormEvent) => {
    e.preventDefault();
    updateFrontendConfig(footerForm);
    triggerToast('Rodapé atualizado no frontend!');
  };

  const handleOpenMenuModal = (item?: NavMenuItem) => {
    if (item) {
      setEditingMenuItemId(item.id);
      setMenuItemForm({
        label: item.label,
        target: item.target,
        badge: item.badge || '',
        isVisible: item.isVisible
      });
    } else {
      setEditingMenuItemId(null);
      setMenuItemForm({
        label: '',
        target: 'home',
        badge: '',
        isVisible: true
      });
    }
    setIsMenuModalOpen(true);
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMenuItemId) {
      updateNavMenuItem(editingMenuItemId, menuItemForm);
    } else {
      addNavMenuItem({
        ...menuItemForm,
        order: frontendConfig.navMenuItems.length + 1
      });
    }
    setIsMenuModalOpen(false);
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const items = [...frontendConfig.navMenuItems];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    // update orders
    const updated = items.map((it, idx) => ({ ...it, order: idx + 1 }));
    reorderNavMenuItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Layout className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Controle Total do Frontend & Menus
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Personalize o cabeçalho, rodapé, barra de avisos, regras de postagens e a exibição de produtos (4 em 4 itens, até 24 amostras por categoria).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Live Sync Ativo
          </span>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('header')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
            activeSection === 'header'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Type className="w-4 h-4" />
          Cabeçalho & Broadcast
        </button>

        <button
          onClick={() => setActiveSection('menus')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
            activeSection === 'menus'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Menu className="w-4 h-4" />
          Menus do Sistema ({frontendConfig.navMenuItems.length})
        </button>

        <button
          onClick={() => setActiveSection('home-layout')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
            activeSection === 'home-layout'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Vitrines (4 em 4 / 24 Amostras)
        </button>

        <button
          onClick={() => setActiveSection('merchant-rules')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
            activeSection === 'merchant-rules'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Regras de Postagens
        </button>

        <button
          onClick={() => setActiveSection('footer')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${
            activeSection === 'footer'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Rodapé & Suporte
        </button>
      </div>

      {/* SECTION 1: HEADER & BROADCAST */}
      {activeSection === 'header' && (
        <form onSubmit={handleSaveHeader} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Identidade Visual do Cabeçalho</h2>
            <p className="text-xs text-slate-500">Nome da marca, slogan e botão de ação principal do topo.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título do Marketplace</label>
              <input
                type="text"
                value={headerForm.siteTitle}
                onChange={(e) => setHeaderForm({ ...headerForm, siteTitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Subtítulo</label>
              <input
                type="text"
                value={headerForm.siteSubtitle}
                onChange={(e) => setHeaderForm({ ...headerForm, siteSubtitle: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ícone / Letra do Logo</label>
              <input
                type="text"
                maxLength={2}
                value={headerForm.logoLetter}
                onChange={(e) => setHeaderForm({ ...headerForm, logoLetter: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm uppercase text-center font-black"
              />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Barra de Anúncio / Broadcast Superior (Topo da Página)
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerForm.topAnnouncementActive}
                  onChange={(e) => setHeaderForm({ ...headerForm, topAnnouncementActive: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-amber-900">Exibir Barra de Aviso</span>
              </label>
            </div>

            <input
              type="text"
              value={headerForm.topAnnouncementText}
              onChange={(e) => setHeaderForm({ ...headerForm, topAnnouncementText: e.target.value })}
              placeholder="Digite o texto do aviso exibido para todos os clientes..."
              className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Texto do Botão CTA do Topo</label>
              <input
                type="text"
                value={headerForm.headerCtaText}
                onChange={(e) => setHeaderForm({ ...headerForm, headerCtaText: e.target.value })}
                placeholder="Ex: Quero Vender na Loja"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ação / Destino do Botão</label>
              <select
                value={headerForm.headerCtaLink}
                onChange={(e) => setHeaderForm({ ...headerForm, headerCtaLink: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="register-merchant">Cadastro de Novo Lojista</option>
                <option value="ad-spaces">Mídia & Anúncios</option>
                <option value="categories">Explorar Categorias</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              Salvar Cabeçalho
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: MENUS DO SISTEMA */}
      {activeSection === 'menus' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Itens do Menu de Navegação</h2>
              <p className="text-xs text-slate-500">Adicione, edite, oculte ou reordene os links do menu do topo.</p>
            </div>
            <button
              onClick={() => handleOpenMenuModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> Adicionar Link
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {frontendConfig.navMenuItems.map((item, index) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveMenu(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveMenu(index, 'down')}
                      disabled={index === frontendConfig.navMenuItems.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.badge}
                        </span>
                      )}
                      {!item.isVisible && (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">
                          Oculto
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">Destino: #{item.target}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateNavMenuItem(item.id, { isVisible: !item.isVisible })}
                    className={`p-1.5 rounded-lg border ${
                      item.isVisible
                        ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                        : 'border-slate-200 text-slate-400 bg-slate-50'
                    }`}
                    title={item.isVisible ? 'Ocultar item' : 'Exibir item'}
                  >
                    {item.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenMenuModal(item)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteNavMenuItem(item.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: HOME LAYOUT & VITRINES */}
      {activeSection === 'home-layout' && (
        <form onSubmit={handleSaveLayout} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Vitrines por Categoria & Banners Inter-Categorias
            </h2>
            <p className="text-xs text-slate-500">
              Controle exato da exibição de 4 em 4 imagens de produtos e limite de 24 amostras por categoria.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Limite de Amostras de Produtos por Categoria
              </label>
              <input
                type="number"
                min={4}
                max={48}
                step={4}
                value={layoutForm.categoryProductsLimit}
                onChange={(e) => setLayoutForm({ ...layoutForm, categoryProductsLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Padrão configurado: <strong>24 amostras</strong> de produtos por categoria.
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Tamanho do Bloco / Imagens por Visualização
              </label>
              <input
                type="number"
                min={2}
                max={8}
                value={layoutForm.categoryBlockSize}
                onChange={(e) => setLayoutForm({ ...layoutForm, categoryBlockSize: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Padrão configurado: <strong>de 4 em 4 imagens</strong> com paginação suave.
              </span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-blue-900 block">
                Banners de Largura Total Entre Categorias (Carrossel 3 Imagens)
              </span>
              <span className="text-xs text-blue-700">
                Intercala carrosséis de 3 imagens automáticas com anunciantes entre cada vitrine.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={layoutForm.enableInterCategoryBanners}
                onChange={(e) => setLayoutForm({ ...layoutForm, enableInterCategoryBanners: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              Salvar Vitrines & Layout
            </button>
          </div>
        </form>
      )}

      {/* SECTION 4: REGRAS DE POSTAGENS */}
      {activeSection === 'merchant-rules' && (
        <form onSubmit={handleSaveRules} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Disponibilidade & Regras de Postagens de Lojistas
            </h2>
            <p className="text-xs text-slate-500">
              Defina como os lojistas podem cadastrar e disponibilizar produtos no marketplace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Política de Aprovação de Postagens
              </label>
              <select
                value={rulesForm.merchantPostingPolicy}
                onChange={(e) => setRulesForm({ ...rulesForm, merchantPostingPolicy: e.target.value as 'FREE' | 'MODERATED' | 'PAID_SUBSCRIPTION' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
              >
                <option value="FREE">Livre (Postagem Imediata na Loja)</option>
                <option value="MODERATED">Moderada (Aguardar Aprovação do Master)</option>
                <option value="PAID_SUBSCRIPTION">Apenas Lojistas com Plano/Assinatura Ativa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Limite de Produtos Ativos por Lojista
              </label>
              <input
                type="number"
                value={rulesForm.maxProductsPerMerchant}
                onChange={(e) => setRulesForm({ ...rulesForm, maxProductsPerMerchant: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              Salvar Regras de Postagens
            </button>
          </div>
        </form>
      )}

      {/* SECTION 5: FOOTER */}
      {activeSection === 'footer' && (
        <form onSubmit={handleSaveFooter} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Personalização do Rodapé Institucional</h2>
            <p className="text-xs text-slate-500">Textos institucionais, telefones, WhatsApp oficial e dados de copyright.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Texto Sobre a Plataforma (Sobre Nós)</label>
            <textarea
              rows={3}
              value={footerForm.footerAboutText}
              onChange={(e) => setFooterForm({ ...footerForm, footerAboutText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Fixo / Central</label>
              <input
                type="text"
                value={footerForm.footerSupportPhone}
                onChange={(e) => setFooterForm({ ...footerForm, footerSupportPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Oficial de Suporte</label>
              <input
                type="text"
                value={footerForm.footerSupportWhatsApp}
                onChange={(e) => setFooterForm({ ...footerForm, footerSupportWhatsApp: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Suporte</label>
              <input
                type="text"
                value={footerForm.footerSupportEmail}
                onChange={(e) => setFooterForm({ ...footerForm, footerSupportEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Endereço da Sede Local</label>
            <input
              type="text"
              value={footerForm.footerAddress}
              onChange={(e) => setFooterForm({ ...footerForm, footerAddress: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Texto de Copyright</label>
            <input
              type="text"
              value={footerForm.footerCopyrightText}
              onChange={(e) => setFooterForm({ ...footerForm, footerCopyrightText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              Salvar Rodapé
            </button>
          </div>
        </form>
      )}

      {/* MODAL: Edit/Add Menu Item */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingMenuItemId ? 'Editar Item do Menu' : 'Novo Item do Menu'}
            </h3>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rótulo / Texto do Link</label>
                <input
                  type="text"
                  required
                  value={menuItemForm.label}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, label: e.target.value })}
                  placeholder="Ex: Super Promoções"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destino / Categoria</label>
                <select
                  value={menuItemForm.target}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, target: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="home">Início</option>
                  <option value="gastronomia">Gastronomia & Delivery</option>
                  <option value="moda">Moda & Roupas</option>
                  <option value="beleza">Beleza & Barbearia</option>
                  <option value="eletronicos">Celulares & Tech</option>
                  <option value="flores">Flores & Presentes</option>
                  <option value="ad-spaces">Espaços Publicitários</option>
                  <option value="vender">Quero Vender</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Opcional</label>
                <input
                  type="text"
                  value={menuItemForm.badge}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, badge: e.target.value })}
                  placeholder="Ex: Novo, 50% OFF, VIP"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
