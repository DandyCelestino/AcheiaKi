import React, { useState } from 'react';
import {
  Megaphone,
  Gavel,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Store,
  Calendar,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AdSpace, InterCategoryBanner, CarouselSlide, AdSpaceType, AdCommercialType } from '../../types';

export const MasterAdSpacesView: React.FC = () => {
  const {
    adSpaces,
    addAdSpace,
    updateAdSpace,
    deleteAdSpace,
    placeAdBid,
    acceptAuctionWinner,
    sellAdSpaceDirectly,
    interCategoryBanners,
    addInterCategoryBanner,
    updateInterCategoryBanner,
    deleteInterCategoryBanner,
    toggleInterCategoryBannerStatus,
    merchants
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ad-spaces' | 'inter-banners' | 'auction-bids'>('ad-spaces');

  // Modal / Form state for Ad Space
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [spaceForm, setSpaceForm] = useState<{
    name: string;
    locationDescription: string;
    type: AdSpaceType;
    dimensions: string;
    commercialType: AdCommercialType;
    status: 'AVAILABLE' | 'IN_AUCTION' | 'SOLD' | 'PAUSED';
    fixedPricePerWeek: number;
    fixedPricePerMonth: number;
    minimumBid: number;
    auctionEndDate: string;
    activeMerchantId: string;
  }>({
    name: '',
    locationDescription: '',
    type: 'INTER_CATEGORY',
    dimensions: '1200x380 Full-Width Carrossel',
    commercialType: 'AUCTION',
    status: 'IN_AUCTION',
    fixedPricePerWeek: 150,
    fixedPricePerMonth: 500,
    minimumBid: 300,
    auctionEndDate: '2026-09-15',
    activeMerchantId: ''
  });

  // Modal / Form state for Inter-Category Banner (3-Slide Carousel)
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    title: string;
    targetCategoryAfter: string;
    autoplayIntervalSeconds: number;
    sponsorMerchantId: string;
    adSpaceId: string;
    status: 'active' | 'paused' | 'draft';
    slides: CarouselSlide[];
  }>({
    title: '',
    targetCategoryAfter: 'gastronomia',
    autoplayIntervalSeconds: 4,
    sponsorMerchantId: '',
    adSpaceId: '',
    status: 'active',
    slides: [
      {
        id: 's1',
        title: 'Título do Slide 1',
        subtitle: 'Subtítulo descritivo do slide 1',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Comprar Agora',
        badge: 'DESTAQUE',
        linkUrl: 'gastronomia'
      },
      {
        id: 's2',
        title: 'Título do Slide 2',
        subtitle: 'Subtítulo descritivo do slide 2',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Ver Cardápio',
        badge: 'OFERTA',
        linkUrl: 'gastronomia'
      },
      {
        id: 's3',
        title: 'Título do Slide 3',
        subtitle: 'Subtítulo descritivo do slide 3',
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Pedir Delivery',
        badge: 'PROMOÇÃO',
        linkUrl: 'gastronomia'
      }
    ]
  });

  // Manual Bid Placing State
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedAuctionSpace, setSelectedAuctionSpace] = useState<AdSpace | null>(null);
  const [bidMerchantId, setBidMerchantId] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bidNotes, setBidNotes] = useState('');

  // Direct Sale Modal State
  const [directSaleModalOpen, setDirectSaleModalOpen] = useState(false);
  const [directSaleSpace, setDirectSaleSpace] = useState<AdSpace | null>(null);
  const [directSaleMerchantId, setDirectSaleMerchantId] = useState('');
  const [directSalePeriod, setDirectSalePeriod] = useState<'week' | 'month'>('month');
  const [directSalePrice, setDirectSalePrice] = useState(500);

  // Totals calculations
  const totalRevenue = adSpaces.reduce((acc, s) => acc + (s.revenueTotal || 0), 0);
  const totalImpressions = adSpaces.reduce((acc, s) => acc + (s.impressionsCount || 0), 0);
  const totalClicks = adSpaces.reduce((acc, s) => acc + (s.clicksCount || 0), 0);
  const activeAuctionsCount = adSpaces.filter((s) => s.status === 'IN_AUCTION').length;

  const handleOpenSpaceModal = (space?: AdSpace) => {
    if (space) {
      setEditingSpaceId(space.id);
      setSpaceForm({
        name: space.name,
        locationDescription: space.locationDescription,
        type: space.type,
        dimensions: space.dimensions,
        commercialType: space.commercialType,
        status: space.status,
        fixedPricePerWeek: space.fixedPricePerWeek || 150,
        fixedPricePerMonth: space.fixedPricePerMonth || 500,
        minimumBid: space.minimumBid || 300,
        auctionEndDate: space.auctionEndDate || '2026-09-15',
        activeMerchantId: space.activeMerchantId || ''
      });
    } else {
      setEditingSpaceId(null);
      setSpaceForm({
        name: '',
        locationDescription: '',
        type: 'INTER_CATEGORY',
        dimensions: '1200x380 Full-Width Carrossel',
        commercialType: 'AUCTION',
        status: 'IN_AUCTION',
        fixedPricePerWeek: 150,
        fixedPricePerMonth: 500,
        minimumBid: 300,
        auctionEndDate: '2026-09-15',
        activeMerchantId: ''
      });
    }
    setIsSpaceModalOpen(true);
  };

  const handleSaveSpace = (e: React.FormEvent) => {
    e.preventDefault();
    const merchant = merchants.find((m) => m.id === spaceForm.activeMerchantId);
    if (editingSpaceId) {
      updateAdSpace(editingSpaceId, {
        ...spaceForm,
        activeMerchantName: merchant ? merchant.tradeName : undefined
      });
    } else {
      addAdSpace({
        ...spaceForm,
        activeMerchantName: merchant ? merchant.tradeName : undefined
      });
    }
    setIsSpaceModalOpen(false);
  };

  const handleOpenBannerModal = (banner?: InterCategoryBanner) => {
    if (banner) {
      setEditingBannerId(banner.id);
      setBannerForm({
        title: banner.title,
        targetCategoryAfter: banner.targetCategoryAfter,
        autoplayIntervalSeconds: banner.autoplayIntervalSeconds || 4,
        sponsorMerchantId: banner.sponsorMerchantId || '',
        adSpaceId: banner.adSpaceId || '',
        status: banner.status,
        slides: banner.slides || []
      });
    } else {
      setEditingBannerId(null);
      setBannerForm({
        title: '',
        targetCategoryAfter: 'gastronomia',
        autoplayIntervalSeconds: 4,
        sponsorMerchantId: '',
        adSpaceId: '',
        status: 'active',
        slides: [
          {
            id: 's1',
            title: 'Destaque Promocional Slide 1',
            subtitle: 'Texto atrativo do produto ou oferta',
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80',
            actionText: 'Aproveitar Oferta',
            badge: 'PATROCINADO',
            linkUrl: 'gastronomia'
          },
          {
            id: 's2',
            title: 'Destaque Promocional Slide 2',
            subtitle: 'Texto atrativo do segundo slide',
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
            actionText: 'Conferir Catálogo',
            badge: 'DESTAQUE',
            linkUrl: 'gastronomia'
          },
          {
            id: 's3',
            title: 'Destaque Promocional Slide 3',
            subtitle: 'Texto atrativo do terceiro slide',
            imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop&q=80',
            actionText: 'Fazer Pedido',
            badge: 'EXCLUSIVO',
            linkUrl: 'gastronomia'
          }
        ]
      });
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const merchant = merchants.find((m) => m.id === bannerForm.sponsorMerchantId);
    if (editingBannerId) {
      updateInterCategoryBanner(editingBannerId, {
        ...bannerForm,
        sponsorMerchantName: merchant ? merchant.tradeName : undefined
      });
    } else {
      addInterCategoryBanner({
        ...bannerForm,
        sponsorMerchantName: merchant ? merchant.tradeName : undefined
      });
    }
    setIsBannerModalOpen(false);
  };

  const handleUpdateSlide = (index: number, updates: Partial<CarouselSlide>) => {
    setBannerForm((prev) => ({
      ...prev,
      slides: prev.slides.map((s, idx) => (idx === index ? { ...s, ...updates } : s))
    }));
  };

  const handleOpenBidModal = (space: AdSpace) => {
    setSelectedAuctionSpace(space);
    const min = (space.currentHighestBid || space.minimumBid || 100) + 20;
    setBidAmount(min);
    setBidMerchantId(merchants[0]?.id || '');
    setBidNotes('');
    setBidModalOpen(true);
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuctionSpace || !bidMerchantId) return;
    const merchant = merchants.find((m) => m.id === bidMerchantId);
    placeAdBid(
      selectedAuctionSpace.id,
      bidMerchantId,
      merchant ? merchant.tradeName : 'Lojista Local',
      bidAmount,
      bidNotes
    );
    setBidModalOpen(false);
  };

  const handleOpenDirectSale = (space: AdSpace) => {
    setDirectSaleSpace(space);
    setDirectSaleMerchantId(merchants[0]?.id || '');
    setDirectSalePeriod('month');
    setDirectSalePrice(space.fixedPricePerMonth || 500);
    setDirectSaleModalOpen(true);
  };

  const handleSubmitDirectSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSaleSpace || !directSaleMerchantId) return;
    const merchant = merchants.find((m) => m.id === directSaleMerchantId);
    sellAdSpaceDirectly(
      directSaleSpace.id,
      directSaleMerchantId,
      merchant ? merchant.tradeName : 'Lojista Parceiro',
      directSalePrice,
      directSalePeriod
    );
    setDirectSaleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Gestão de Publicidade, Banners & Leilões
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Controle total sobre espaços publicitários na Home, carrosséis de 3 imagens entre categorias e comercialização direta ou via leilão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-ad-space"
            onClick={() => handleOpenSpaceModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Espaço
          </button>
          <button
            id="btn-add-inter-banner"
            onClick={() => handleOpenBannerModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <ImageIcon className="w-4 h-4" />
            Novo Banner Carrossel
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Total</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> Mídia e Patrocínios
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Leilões Ativos</span>
            <Gavel className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{activeAuctionsCount}</p>
          <span className="text-[11px] text-amber-600 font-bold mt-1 block">
            Posições em disputa
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Impressões Totais</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {totalImpressions.toLocaleString('pt-BR')}
          </p>
          <span className="text-[11px] text-blue-600 font-bold mt-1 block">
            Visualizações nos banners
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Cliques Registrados</span>
            <MousePointer className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {totalClicks.toLocaleString('pt-BR')}
          </p>
          <span className="text-[11px] text-purple-600 font-bold mt-1 block">
            Conversão direta
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 pt-3 rounded-t-xl">
        <button
          id="tab-ad-spaces"
          onClick={() => setActiveTab('ad-spaces')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ad-spaces'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Espaços Publicitários & Leilões ({adSpaces.length})
        </button>

        <button
          id="tab-inter-banners"
          onClick={() => setActiveTab('inter-banners')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inter-banners'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Banners Carrossel (3 Imagens) ({interCategoryBanners.length})
        </button>
      </div>

      {/* TAB 1: Ad Spaces & Auctions Table */}
      {activeTab === 'ad-spaces' && (
        <div className="bg-white rounded-b-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Espaço & Localização</th>
                  <th className="py-3.5 px-4">Tipo & Formato</th>
                  <th className="py-3.5 px-4">Modalidade</th>
                  <th className="py-3.5 px-4">Status & Anunciante</th>
                  <th className="py-3.5 px-4">Valores / Lances</th>
                  <th className="py-3.5 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adSpaces.map((space) => {
                  const isAuction = space.commercialType === 'AUCTION';
                  const bidsCount = space.bids?.length || 0;

                  return (
                    <tr key={space.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{space.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {space.locationDescription}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {space.type}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {space.dimensions}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isAuction ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Gavel className="w-3 h-3" />
                            Leilão Aberto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <DollarSign className="w-3 h-3" />
                            Venda Direta
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              space.status === 'SOLD'
                                ? 'bg-blue-500'
                                : space.status === 'IN_AUCTION'
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-700">
                            {space.status === 'SOLD'
                              ? 'Ocupado / Vendido'
                              : space.status === 'IN_AUCTION'
                              ? 'Em Disputa'
                              : 'Disponível'}
                          </span>
                        </div>
                        {space.activeMerchantName && (
                          <div className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {space.activeMerchantName}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAuction ? (
                          <div>
                            <div className="text-xs text-slate-500">
                              Maior lance:
                              <strong className="text-slate-900 ml-1">
                                R$ {(space.currentHighestBid ?? 0).toFixed(2).replace('.', ',')}
                              </strong>
                            </div>
                            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
                              {bidsCount} lances registrados
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              R$ {(space.fixedPricePerMonth ?? 0).toFixed(2).replace('.', ',')}/mês
                            </div>
                            <div className="text-[11px] text-slate-400">
                              (ou R$ {(space.fixedPricePerWeek ?? 0).toFixed(2).replace('.', ',')}/sem)
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAuction ? (
                            <>
                              <button
                                id={`btn-bid-space-${space.id}`}
                                onClick={() => handleOpenBidModal(space)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition-colors"
                                title="Inserir Lance de Lojista"
                              >
                                Dar Lance
                              </button>
                              {space.bids && space.bids.length > 0 && space.status !== 'SOLD' && (
                                <button
                                  id={`btn-winner-${space.id}`}
                                  onClick={() => {
                                    const highestBid = space.bids?.find((b) => b.status === 'HIGHEST');
                                    if (highestBid) acceptAuctionWinner(space.id, highestBid.id);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                                  title="Aprovar Arrematante Vencedor"
                                >
                                  Arrematar
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              id={`btn-sell-direct-${space.id}`}
                              onClick={() => handleOpenDirectSale(space)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors"
                            >
                              Vender Direto
                            </button>
                          )}

                          <button
                            id={`btn-edit-space-${space.id}`}
                            onClick={() => handleOpenSpaceModal(space)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            title="Editar Espaço"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-delete-space-${space.id}`}
                            onClick={() => deleteAdSpace(space.id)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                            title="Excluir Espaço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Inter-Category Banners (Carousels of 3 slides) */}
      {activeTab === 'inter-banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interCategoryBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              {/* Banner Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        banner.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <h3 className="font-bold text-slate-900 text-base">{banner.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Posicionado após a categoria: <strong>{banner.targetCategoryAfter}</strong> (Rotação a cada {banner.autoplayIntervalSeconds}s)
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleInterCategoryBannerStatus(banner.id)}
                    className={`p-1.5 rounded-lg border text-xs font-bold ${
                      banner.status === 'active'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {banner.status === 'active' ? 'Pausar' : 'Ativar'}
                  </button>

                  <button
                    onClick={() => handleOpenBannerModal(banner)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteInterCategoryBanner(banner.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Slides Mini Preview */}
              <div className="grid grid-cols-3 gap-2">
                {banner.slides.map((slide, sIdx) => (
                  <div
                    key={slide.id || sIdx}
                    className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-900 text-white group"
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                      <span className="text-[9px] font-bold text-amber-300 line-clamp-1">
                        Slide {sIdx + 1}: {slide.badge || 'Banner'}
                      </span>
                      <span className="text-[10px] font-semibold text-white line-clamp-1">
                        {slide.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sponsor & Details footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-blue-500" />
                  <span>Anunciante: {banner.sponsorMerchantName || 'Sem patrocinador fixo'}</span>
                </div>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  3 Slides Automáticos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Create / Edit Ad Space */}
      {isSpaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingSpaceId ? 'Editar Espaço Publicitário' : 'Novo Espaço Publicitário'}
            </h3>

            <form onSubmit={handleSaveSpace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Espaço
                </label>
                <input
                  type="text"
                  required
                  value={spaceForm.name}
                  onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                  placeholder="Ex: Super Banner Inter-Categorias #3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Localização / Posicionamento
                </label>
                <input
                  type="text"
                  required
                  value={spaceForm.locationDescription}
                  onChange={(e) => setSpaceForm({ ...spaceForm, locationDescription: e.target.value })}
                  placeholder="Ex: Entre Gastronomia e Moda (Carrossel 3 Imagens)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={spaceForm.type}
                    onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value as AdSpaceType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="INTER_CATEGORY">Inter-Categorias</option>
                    <option value="HERO_TOP">Topo Hero</option>
                    <option value="FOOTER_BANNER">Rodapé</option>
                    <option value="CATEGORY_SPONSOR">Patrocínio de Categoria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade</label>
                  <select
                    value={spaceForm.commercialType}
                    onChange={(e) => setSpaceForm({ ...spaceForm, commercialType: e.target.value as AdCommercialType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="AUCTION">Leilão de Posição</option>
                    <option value="DIRECT_SALE">Venda Direta</option>
                  </select>
                </div>
              </div>

              {spaceForm.commercialType === 'AUCTION' ? (
                <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Lance Mínimo (R$)</label>
                    <input
                      type="number"
                      value={spaceForm.minimumBid}
                      onChange={(e) => setSpaceForm({ ...spaceForm, minimumBid: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Término do Leilão</label>
                    <input
                      type="date"
                      value={spaceForm.auctionEndDate}
                      onChange={(e) => setSpaceForm({ ...spaceForm, auctionEndDate: e.target.value })}
                      className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Preço Semanal (R$)</label>
                    <input
                      type="number"
                      value={spaceForm.fixedPricePerWeek}
                      onChange={(e) => setSpaceForm({ ...spaceForm, fixedPricePerWeek: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">Preço Mensal (R$)</label>
                    <input
                      type="number"
                      value={spaceForm.fixedPricePerMonth}
                      onChange={(e) => setSpaceForm({ ...spaceForm, fixedPricePerMonth: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lojista Patrocinador / Ativo
                </label>
                <select
                  value={spaceForm.activeMerchantId}
                  onChange={(e) => setSpaceForm({ ...spaceForm, activeMerchantId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  <option value="">Nenhum / Disponível para Anúncio</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.tradeName} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSpaceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                >
                  Salvar Espaço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create / Edit Banner Carrossel with 3 Slides */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {editingBannerId ? 'Editar Banner Carrossel Inter-Categoria' : 'Novo Banner Carrossel Inter-Categoria'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure as 3 imagens automáticas com seus títulos, botões e lojista patrocinador.
            </p>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Identificador do Banner
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="Ex: Destaques Gastronomia Macacu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Posicionar Após a Categoria
                  </label>
                  <select
                    value={bannerForm.targetCategoryAfter}
                    onChange={(e) => setBannerForm({ ...bannerForm, targetCategoryAfter: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="gastronomia">Gastronomia & Delivery</option>
                    <option value="moda">Moda & Roupas</option>
                    <option value="beleza">Beleza & Estética</option>
                    <option value="eletronicos">Celulares & Tech</option>
                    <option value="flores">Flores & Presentes</option>
                    <option value="mercado">Supermercado & Pet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tempo de Autoplay (segundos)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={bannerForm.autoplayIntervalSeconds}
                    onChange={(e) => setBannerForm({ ...bannerForm, autoplayIntervalSeconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lojista Patrocinador
                  </label>
                  <select
                    value={bannerForm.sponsorMerchantId}
                    onChange={(e) => setBannerForm({ ...bannerForm, sponsorMerchantId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Sem Lojista Específico</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.tradeName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3 Slides Editor */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Configuração dos 3 Slides do Carrossel
                </h4>

                {bannerForm.slides.map((slide, sIdx) => (
                  <div key={slide.id || sIdx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-blue-600">Slide #{sIdx + 1}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Título do Slide"
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(sIdx, { title: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="URL da Imagem (Unsplash ou Web)"
                        value={slide.imageUrl}
                        onChange={(e) => handleUpdateSlide(sIdx, { imageUrl: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Subtítulo ou Descrição curta"
                        value={slide.subtitle || ''}
                        onChange={(e) => handleUpdateSlide(sIdx, { subtitle: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Texto do Botão (Ex: Pedir Agora)"
                        value={slide.actionText || ''}
                        onChange={(e) => handleUpdateSlide(sIdx, { actionText: e.target.value })}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  Salvar Banner Carrossel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Registrar Lance de Leilão */}
      {bidModalOpen && selectedAuctionSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Gavel className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900">Registrar Lance no Leilão</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Espaço: <strong>{selectedAuctionSpace.name}</strong>
            </p>

            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lojista Ofertante</label>
                <select
                  value={bidMerchantId}
                  onChange={(e) => setBidMerchantId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.tradeName} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor do Lance (R$)</label>
                <input
                  type="number"
                  step="10"
                  min={(selectedAuctionSpace.currentHighestBid || selectedAuctionSpace.minimumBid || 100) + 10}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Lance mínimo aceito: R$ {((selectedAuctionSpace.currentHighestBid || selectedAuctionSpace.minimumBid || 100) + 10).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Lance</label>
                <textarea
                  rows={2}
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  placeholder="Ex: Oferta para veiculação no final de semana..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBidModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20"
                >
                  Confirmar Lance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Venda Direta de Espaço */}
      {directSaleModalOpen && directSaleSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Venda Direta de Espaço</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Espaço: <strong>{directSaleSpace.name}</strong>
            </p>

            <form onSubmit={handleSubmitDirectSale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lojista Comprador</label>
                <select
                  value={directSaleMerchantId}
                  onChange={(e) => setDirectSaleMerchantId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.tradeName} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Período Contratado</label>
                  <select
                    value={directSalePeriod}
                    onChange={(e) => setDirectSalePeriod(e.target.value as 'week' | 'month')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="month">1 Mês Completo</option>
                    <option value="week">1 Semana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Cobrado (R$)</label>
                  <input
                    type="number"
                    value={directSalePrice}
                    onChange={(e) => setDirectSalePrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDirectSaleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  Concluir Venda e Ativar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
