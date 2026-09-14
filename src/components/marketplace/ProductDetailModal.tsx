import React, { useState } from 'react';
import {
  X,
  Heart,
  Share2,
  Star,
  MapPin,
  Truck,
  Package,
  Store,
  Sparkles,
  Shirt,
  Calendar,
  Check,
  ChevronRight,
  Info,
  ShieldCheck,
  ShoppingBag,
  MessageSquare
} from 'lucide-react';
import { Product, ServiceItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { ReviewsList } from '../reviews/ReviewsList';
import { ServicePricingTableCard } from '../services/ServicePricingTableCard';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct: (p: Product) => void;
  onOpenCheckout: (product: Product, initialModality?: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO', selectedVariations?: { [key: string]: string }) => void;
  onOpenBooking?: (service: ServiceItem) => void;
  onSelectStore?: (merchantId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSelectProduct,
  onOpenCheckout,
  onOpenBooking,
  onSelectStore
}) => {
  const {
    isFavorite,
    toggleFavorite,
    products,
    addToCart,
    reviews,
    openPolicyModal,
    merchants,
    openSubOrderChat,
    currentUser,
    promptAuthRequirement,
    triggerToast
  } = useApp();

  const currentMerchant = merchants.find((m) => m.id === product?.merchantId);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariations, setSelectedVariations] = useState<{ [key: string]: string }>({});

  if (!product) return null;

  // Initialize selected variations if not selected
  const currentVariations = { ...selectedVariations };
  if (product.variations) {
    product.variations.forEach((v) => {
      if (!currentVariations[v.name] && v.options.length > 0) {
        currentVariations[v.name] = v.options[0];
      }
    });
  }

  const handleSelectVariation = (varName: string, option: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [varName]: option
    }));
  };

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 3);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Floating Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{product.merchantName}</span>
            <span>•</span>
            <span className="flex items-center text-slate-500">
              <MapPin className="w-3 h-3 mr-1 text-slate-400" />
              {product.merchantAddress}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleFavorite(product.id)}
              className={`p-2 rounded-full border transition-colors ${
                isFavorite(product.id)
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-red-500'
              }`}
              title="Favoritar"
            >
              <Heart className={`w-4 h-4 ${isFavorite(product.id) ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link do produto copiado!');
                }
              }}
              className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* LEFT: PHOTO GALLERY */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                    -{discountPercent}% OFF
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Novidade
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-100'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt="Miniatura"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Store Box & Shortcut Action for Service Categories */}
              <div className="space-y-2">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-white border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 shadow-xs shrink-0">
                      <Store className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {product.merchantName}
                      </h5>
                      <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current mr-0.5" />
                          {product.merchantRating}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">Loja Verificada</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {currentMerchant?.allowDirectChat !== false && product.allowDirectChat !== false && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) {
                            promptAuthRequirement('Para conversar pelo chat interno com o lojista e tirar dúvidas sobre este produto, acesse sua conta ou cadastre-se gratuitamente.');
                            return;
                          }
                          openSubOrderChat({
                            subpedidoId: `product-inquiry-${product.id}-${currentUser.id}`,
                            codigoSubpedido: `#PROD-${product.id.substring(0, 5).toUpperCase()}`,
                            merchantId: product.merchantId,
                            merchantName: product.merchantName,
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
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-all flex items-center justify-center space-x-1 shadow-2xs active:scale-95"
                        title="Enviar mensagem interna para o lojista"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chat</span>
                      </button>
                    )}

                    {onSelectStore && (
                      <button
                        onClick={() => {
                          onClose();
                          onSelectStore(product.merchantId);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 shrink-0 shadow-xs"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Ver Loja</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* ⏰ Atalho Agendar Hora para Prestadores de Serviços, Consultórios, Beleza e Estética, Gastronomia */}
                {(() => {
                  const catUpper = (product.category || '').toUpperCase();
                  const isScheduleServiceCategory =
                    catUpper.includes('PRESTADORES') ||
                    catUpper.includes('CONSULTÓRIOS') ||
                    catUpper.includes('CONSULTORIOS') ||
                    catUpper.includes('BELEZA') ||
                    catUpper.includes('ESTÉTICA') ||
                    catUpper.includes('ESTETICA') ||
                    catUpper.includes('GASTRONOMIA') ||
                    product.itemType === 'SERVICO';

                  if (!isScheduleServiceCategory) return null;

                  return (
                    <button
                      id="btn-schedule-shortcut"
                      onClick={() => {
                        onOpenCheckout(product, 'DELIVERY', currentVariations);
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
                    >
                      <Calendar className="w-4 h-4 text-amber-300" />
                      <span>Agendar Hora com {product.merchantName || 'Profissional'}</span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* RIGHT: PRODUCT INFO & PURCHASE OPTIONS */}
            <div className="flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    {product.category}
                  </span>
                  {product.subcategory && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                      {product.subcategory}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {product.name}
                </h2>

                {/* Rating & Reviews */}
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{product.rating}</span>
                  <span className="text-xs text-slate-400">({product.reviewsCount} avaliações)</span>
                  <span className="text-xs text-emerald-600 font-bold ml-auto">
                    ● {product.stock > 0 ? `${product.stock} em estoque` : 'Esgotado'}
                  </span>
                </div>

                {/* Price Display / Rent Display */}
                <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      R$ {(product.price ?? 0).toFixed(2).replace('.', ',')}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        R$ {(product.originalPrice ?? 0).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>

                  {/* Preço de Aluguel para Móveis e Locações */}
                  {product.furnitureActionType && product.furnitureActionType !== 'BUY' && product.rentPrice && (
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-emerald-200">
                      <span>🏷️ Opção de Aluguel:</span>
                      <span className="text-sm font-black text-emerald-950">
                        R$ {product.rentPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="font-normal text-emerald-800">
                        / {product.rentPeriod === 'DIA' ? 'dia' : product.rentPeriod === 'SEMANA' ? 'semana' : product.rentPeriod === 'EVENTO' ? 'evento' : 'mês'}
                      </span>
                    </div>
                  )}

                  {/* Informações adicionais do Veículo */}
                  {(product.vehicleYear || product.vehicleKm) && (
                    <div className="text-xs text-slate-600 pt-1 flex items-center gap-3">
                      {product.vehicleYear && <span>🚗 Ano: <strong>{product.vehicleYear}</strong></span>}
                      {product.vehicleKm && <span>⚡ Quilometragem: <strong>{product.vehicleKm}</strong></span>}
                    </div>
                  )}
                </div>

                {/* 💳 Banner de Taxa de Sinal / Adiantamento com Chave PIX */}
                {product.advanceFeeRequired && (
                  <div className="mt-3 p-3.5 bg-amber-50/90 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-amber-900">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>Sinal / Taxa de Adiantamento Requerida</span>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-600 text-white font-black rounded-lg text-xs">
                        R$ {(product.advanceFeeAmount ?? 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80 leading-snug">
                      Este lojista solicita uma taxa de sinal de R$ {(product.advanceFeeAmount ?? 0).toFixed(2).replace('.', ',')} para garantir a reserva/agendamento do horário.
                    </p>

                    {product.pixKey && (
                      <div className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Chave PIX ({product.pixKeyType || 'PIX'}):
                          </p>
                          <p className="text-xs font-mono font-black text-slate-900 truncate">
                            {product.pixKey}
                          </p>
                          {product.pixBeneficiaryName && (
                            <p className="text-[10px] text-slate-600 truncate">
                              Favorecido: {product.pixBeneficiaryName}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(product.pixKey || '');
                              alert('Chave PIX copiada para a área de transferência!');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg shadow-xs shrink-0 active:scale-95 transition-all"
                        >
                          Copiar PIX
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Variations Selectors */}
                {product.variations && product.variations.length > 0 && (
                  <div className="mt-5 space-y-3.5">
                    {product.variations.map((variation) => (
                      <div key={variation.name}>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          {variation.name}:{' '}
                          <span className="text-blue-600">
                            {currentVariations[variation.name] || variation.options[0]}
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {variation.options.map((opt) => {
                            const isSelected =
                              (currentVariations[variation.name] || variation.options[0]) === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => handleSelectVariation(variation.name, opt)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Descrição do Produto
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Specs */}
                {product.specs && Object.keys(product.specs).length > 0 && (
                  <div className="mt-4 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between py-0.5 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500">{key}:</span>
                        <span className="font-semibold text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabela de Preços e Credenciais do Prestador/Serviço */}
                {(product.itemType === 'SERVICO' || currentMerchant?.pricingTable || currentMerchant?.credentials) && (
                  <div className="mt-4">
                    <ServicePricingTableCard
                      pricingTable={currentMerchant?.pricingTable}
                      credentials={currentMerchant?.credentials}
                      references={currentMerchant?.references}
                      basePrice={product.price}
                      providerName={product.merchantName}
                      categoryName={product.category}
                      isSelectable={false}
                    />
                  </div>
                )}

                {/* Available Modalities Badges */}
                {(() => {
                  const catUpper = (product.category || '').toUpperCase();
                  const isService =
                    product.itemType === 'SERVICO' ||
                    currentMerchant?.isServiceProvider === true ||
                    catUpper.includes('SERVI');

                  if (isService) {
                    const cfg = currentMerchant?.serviceButtonsConfig;
                    const showHome = cfg?.showHomeService !== false;
                    const showStore = cfg?.showStoreService !== false;
                    const showSchedule = cfg?.showSchedule !== false;

                    return (
                      <div className="mt-5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                        <p className="text-[11px] font-bold uppercase text-blue-900 tracking-wider">
                          Modalidades de Atendimento do Prestador:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {showHome && (
                            <div className="flex items-center space-x-2 text-slate-700">
                              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold">Atendimento a domicílio</span>
                            </div>
                          )}
                          {showStore && (
                            <div className="flex items-center space-x-2 text-slate-700">
                              <Store className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-semibold">Atendimento na loja / consultório</span>
                            </div>
                          )}
                          {showSchedule && (
                            <div className="flex items-center space-x-2 text-slate-700 sm:col-span-2">
                              <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                              <span className="font-semibold">Atendimento com Hora Marcada</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-5 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                      <p className="text-[11px] font-bold uppercase text-blue-900 tracking-wider">
                        Opções de Entrega & Retirada:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {product.availableModalities.includes('DELIVERY') && (
                          <div className="flex items-center space-x-2 text-slate-700">
                            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Entrega Expressa por Motoboy</span>
                          </div>
                        )}
                        {product.availableModalities.includes('RETIRADA') && (
                          <div className="flex items-center space-x-2 text-slate-700">
                            <Package className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Retirar na Loja (Código Instantâneo)</span>
                          </div>
                        )}
                        {product.availableModalities.includes('EXPERIMENTAÇÃO') && (
                          <div className="flex items-center space-x-2 text-slate-700 sm:col-span-2">
                            <Shirt className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>Experimentar no Provador (Sem custo)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ACTION BUTTONS (CUSTOMIZADOS POR REGRAS DE CATEGORIA) */}
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                {(() => {
                  const catUpper = (product.category || '').toUpperCase();
                  const isService =
                    product.itemType === 'SERVICO' ||
                    currentMerchant?.isServiceProvider === true ||
                    catUpper.includes('SERVI');

                  // 0. PRESTADORES DE SERVIÇO: Botão Agendar direto + botões customizados pelo prestador
                  if (isService) {
                    const cfg = currentMerchant?.serviceButtonsConfig;
                    const showSchedule = cfg?.showSchedule !== false;
                    const showQuote = cfg?.showQuote !== false;
                    const showChat = cfg?.showChat !== false && currentMerchant?.allowDirectChat !== false;

                    const serviceItem: ServiceItem = {
                      id: product.id,
                      merchantId: product.merchantId,
                      merchantName: product.merchantName,
                      merchantCategory: currentMerchant?.category || product.category || 'Serviços',
                      merchantRating: currentMerchant?.rating || product.rating || 5.0,
                      merchantAddress: currentMerchant?.address || 'Cachoeiras de Macacu, RJ',
                      title: product.name,
                      description: product.description,
                      price: product.price,
                      durationMinutes: 60,
                      category: product.category,
                      subcategory: product.subcategory,
                      itemType: product.itemType || 'SERVICO',
                      image: product.images?.[0] || product.image,
                      professionals: [product.merchantName || 'Profissional'],
                      availableDays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
                      availableHours: ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'],
                      executionLocation: product.executionLocation || 'AMBOS',
                      isQuoteBased: product.isQuoteBased
                    };

                    return (
                      <div className="space-y-2">
                        {showSchedule && (
                          <button
                            id="btn-service-schedule-main"
                            onClick={() => {
                              onClose();
                              if (onOpenBooking) {
                                onOpenBooking(serviceItem);
                              } else {
                                onOpenCheckout(product, 'RETIRADA', currentVariations);
                              }
                            }}
                            className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                          >
                            <Calendar className="w-5 h-5 text-blue-200" />
                            <span>Agendar com o Prestador</span>
                          </button>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {showQuote && (
                            <button
                              id="btn-service-quote"
                              onClick={() => {
                                if (!currentUser) {
                                  promptAuthRequirement('Para solicitar um orçamento personalizado com o prestador, acesse sua conta ou cadastre-se.');
                                  return;
                                }
                                openSubOrderChat({
                                  subpedidoId: `quote-${product.id}-${currentUser.id}`,
                                  codigoSubpedido: `#ORC-${product.id.substring(0, 5).toUpperCase()}`,
                                  merchantId: product.merchantId,
                                  merchantName: product.merchantName,
                                  customerId: currentUser.id,
                                  customerName: currentUser.name || 'Cliente Achei Aqui',
                                  customerPhone: currentUser.phone,
                                  orderTitle: `Orçamento para: ${product.name}`,
                                  orderStatus: 'Solicitação de Orçamento',
                                  orderTotal: product.price,
                                  productId: product.id,
                                  productName: product.name,
                                  productImage: product.images?.[0] || product.image,
                                  productPrice: product.price,
                                  isDirectProductChat: true
                                });
                                onClose();
                              }}
                              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4 text-amber-700" />
                              <span>Solicitar Orçamento</span>
                            </button>
                          )}

                          {showChat && (
                            <button
                              id="btn-service-chat-direct"
                              onClick={() => {
                                if (!currentUser) {
                                  promptAuthRequirement('Para conversar pelo chat interno com o prestador, acesse sua conta ou cadastre-se gratuitamente.');
                                  return;
                                }
                                openSubOrderChat({
                                  subpedidoId: `service-chat-${product.id}-${currentUser.id}`,
                                  codigoSubpedido: `#SRV-${product.id.substring(0, 5).toUpperCase()}`,
                                  merchantId: product.merchantId,
                                  merchantName: product.merchantName,
                                  customerId: currentUser.id,
                                  customerName: currentUser.name || 'Cliente Achei Aqui',
                                  customerPhone: currentUser.phone,
                                  orderTitle: `Dúvidas sobre: ${product.name}`,
                                  orderStatus: 'Consulta de Serviço',
                                  orderTotal: product.price,
                                  productId: product.id,
                                  productName: product.name,
                                  productImage: product.images?.[0] || product.image,
                                  productPrice: product.price,
                                  isDirectProductChat: true
                                });
                                onClose();
                              }}
                              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 text-blue-400" />
                              <span>Chat com o Prestador</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const isPetshop = catUpper.includes('PET') || catUpper.includes('PETSHOP');
                  const isFurniture = catUpper.includes('MÓVEIS') || catUpper.includes('MOVEIS') || catUpper.includes('LOCAÇÕES') || catUpper.includes('LOCACOES');
                  const isVehicle = catUpper.includes('VEÍCULOS') || catUpper.includes('VEICULOS') || catUpper.includes('AUTOMOTIVO');

                  // 1. PETSHOP: Somente botão Comprar Agora
                  if (isPetshop) {
                    return (
                      <button
                        id="btn-buy-petshop"
                        onClick={() => onOpenCheckout(product, 'DELIVERY', currentVariations)}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Comprar Agora</span>
                      </button>
                    );
                  }

                  // 2. MÓVEIS E LOCAÇÕES: Botões de Alugar e/ou Comprar conforme decisão do lojista
                  if (isFurniture) {
                    const actionType = product.furnitureActionType || 'BOTH';
                    const showRent = actionType === 'RENT' || actionType === 'BOTH';
                    const showBuy = actionType === 'BUY' || actionType === 'BOTH';

                    return (
                      <div className="space-y-2">
                        <div className={`grid gap-2 ${showRent && showBuy ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {showBuy && (
                            <button
                              id="btn-furniture-buy"
                              onClick={() => onOpenCheckout(product, 'DELIVERY', currentVariations)}
                              className="py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>Comprar (R$ {(product.price ?? 0).toFixed(2).replace('.', ',')})</span>
                            </button>
                          )}

                          {showRent && (
                            <button
                              id="btn-furniture-rent"
                              onClick={() => onOpenCheckout(product, 'DELIVERY', currentVariations)}
                              className="py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                            >
                              <Calendar className="w-4 h-4" />
                              <span>Alugar {product.rentPrice ? `(R$ ${product.rentPrice.toFixed(2).replace('.', ',')})` : ''}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // 3. VEÍCULOS: Botões de Reservar Agora e Agendar Visita
                  if (isVehicle) {
                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            id="btn-vehicle-reserve"
                            onClick={() => onOpenCheckout(product, 'RETIRADA', currentVariations)}
                            className="py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Reservar Agora</span>
                          </button>

                          <button
                            id="btn-vehicle-schedule"
                            onClick={() => onOpenCheckout(product, 'RETIRADA', currentVariations)}
                            className="py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                          >
                            <Calendar className="w-4 h-4 text-emerald-400" />
                            <span>Agendar Visita</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // DEFAULT: Comprar / Solicitar Pedido padrão
                  return (
                    <>
                      <button
                        id="btn-buy-product"
                        onClick={() => onOpenCheckout(product, 'DELIVERY', currentVariations)}
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center space-x-2"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>Comprar / Solicitar Pedido</span>
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Direct In-Store Pickup */}
                        {product.availableModalities.includes('RETIRADA') && (
                          <button
                            onClick={() => onOpenCheckout(product, 'RETIRADA', currentVariations)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Package className="w-4 h-4 text-emerald-400" />
                            <span>Retirar na Loja</span>
                          </button>
                        )}

                        {/* In-Store Fitting / Trial */}
                        {product.availableModalities.includes('EXPERIMENTAÇÃO') && (
                          <button
                            onClick={() => onOpenCheckout(product, 'EXPERIMENTAÇÃO', currentVariations)}
                            className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-1.5"
                          >
                            <Shirt className="w-4 h-4 text-purple-600" />
                            <span>Agendar Provador</span>
                          </button>
                        )}
                      </div>

                      {/* Botão de Chat Interno Direto com o Estabelecimento */}
                      {currentMerchant?.allowDirectChat !== false && product.allowDirectChat !== false && (
                        <button
                          id="btn-chat-with-seller"
                          type="button"
                          onClick={() => {
                            if (!currentUser) {
                              promptAuthRequirement('Para conversar pelo chat interno com o lojista e tirar dúvidas sobre este produto, acesse sua conta ou cadastre-se gratuitamente.');
                              return;
                            }
                            openSubOrderChat({
                              subpedidoId: `product-inquiry-${product.id}-${currentUser.id}`,
                              codigoSubpedido: `#PROD-${product.id.substring(0, 5).toUpperCase()}`,
                              merchantId: product.merchantId,
                              merchantName: product.merchantName,
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
                          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-2xs"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-700" />
                          <span>Conversar no Chat Interno com o Lojista</span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* RELATED PRODUCTS SECTION */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-200">
              <h4 className="font-bold text-sm text-slate-900 mb-4">
                Outros produtos que você pode gostar em Cachoeiras:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectProduct(rel);
                      setSelectedImageIndex(0);
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-all flex items-center space-x-3"
                  >
                    <img
                      src={rel.images[0]}
                      alt={rel.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{rel.name}</p>
                      <p className="text-[11px] font-bold text-blue-600">
                        R$ {(rel.price ?? 0).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{rel.merchantName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Reviews Section */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50">
            <ReviewsList
              reviews={reviews.filter((r) => r.merchantId === product.merchantId)}
              merchantId={product.merchantId}
              merchantName={product.merchantName}
              isMerchantOwner={false}
              onOpenPolicy={() => openPolicyModal('customer')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
