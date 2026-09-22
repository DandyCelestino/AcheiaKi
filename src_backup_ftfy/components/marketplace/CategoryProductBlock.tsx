import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Truck,
  Store,
  Eye,
  Heart,
  Star,
  Check,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Product, ServiceItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface CategoryProductBlockProps {
  categoryKey: string;
  categoryTitle: string;
  categoryIcon?: string;
  categoryDescription?: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToCategory: (categoryKey: string) => void;
  onSelectStore?: (merchantId: string) => void;
  onOpenBooking?: (service: ServiceItem) => void;
}

export const CategoryProductBlock: React.FC<CategoryProductBlockProps> = ({
  categoryKey,
  categoryTitle,
  categoryIcon,
  categoryDescription,
  products,
  onSelectProduct,
  onNavigateToCategory,
  onSelectStore,
  onOpenBooking
}) => {
  const {
    addToCart,
    favorites,
    toggleFavorite,
    frontendConfig,
    currentUser,
    promptAuthRequirement,
    openSubOrderChat,
    merchants,
    triggerToast
  } = useApp();
  const [currentPage, setCurrentPage] = useState(0);
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Constants from Master settings: blockSize = 4, maxSamples = 24
  const blockSize = frontendConfig?.categoryBlockSize || 4;
  const maxSamples = frontendConfig?.categoryProductsLimit || 24;

  // Limit pool of products to max 24 samples
  const sampledProducts = products.slice(0, maxSamples);
  const totalSamples = sampledProducts.length;
  const totalPages = Math.ceil(totalSamples / blockSize);

  if (totalSamples === 0) {
    return null;
  }

  // Current block of 4 products
  const startIndex = currentPage * blockSize;
  const currentBlockProducts = sampledProducts.slice(startIndex, startIndex + blockSize);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

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

  return (
    <section
      id={`cat-block-${categoryKey}`}
      className="my-6 md:my-10 px-3 sm:px-4 lg:px-6 max-w-7xl mx-auto"
    >
      {/* Category Section Header com Verde Serra da Mata */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 sm:mb-6 border-b border-emerald-900/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-black text-emerald-950 tracking-wide uppercase">
              {categoryTitle}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              {totalSamples} {totalSamples === 1 ? 'item' : 'itens'}
            </span>
          </div>
          {categoryDescription && (
            <p className="text-xs sm:text-sm text-emerald-900/70 mt-0.5">
              {categoryDescription}
            </p>
          )}
        </div>

        {/* 4-by-4 Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            Página {currentPage + 1} de {totalPages || 1}
          </div>

          <div className="flex items-center gap-1">
            <button
              id={`cat-${categoryKey}-prev`}
              onClick={handlePrevPage}
              disabled={totalPages <= 1}
              aria-label="Página anterior de produtos"
              className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id={`cat-${categoryKey}-next`}
              onClick={handleNextPage}
              disabled={totalPages <= 1}
              aria-label="Próxima página de produtos"
              className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id={`cat-${categoryKey}-view-all`}
            onClick={() => onNavigateToCategory(categoryKey)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline ml-1 whitespace-nowrap"
          >
            Ver todos →
          </button>
        </div>
      </div>

      {/* 4 Products Responsive Grid (2 columns on mobile, 4 columns on desktop/tablet) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {currentBlockProducts.map((product) => {
          const isFav = favorites.includes(product.id);
          const hasDiscount = product.originalPrice && product.originalPrice > product.price;
          const discountPercent = hasDiscount
            ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
            : 0;
          const isAdded = addedAnimationId === product.id;

          return (
            <div
              key={product.id}
              id={`prod-card-${product.id}`}
              onClick={() => onSelectProduct(product)}
              className="group bg-white rounded-xl sm:rounded-2xl border border-emerald-100/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer relative"
            >
              {/* Product Image Container */}
              <div className="relative aspect-square w-full bg-emerald-50/50 overflow-hidden">
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop&q=80'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Modality Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  {discountPercent > 0 && (
                    <span className="bg-red-500 text-white text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                      -{discountPercent}%
                    </span>
                  )}
                  {product.availableModalities?.includes('EXPERIMENTAÇÃO') && (
                    <span className="bg-emerald-800/95 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                      Provador VIP
                    </span>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  id={`fav-btn-${product.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  className={`absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    isFav
                      ? 'bg-red-50 text-red-500'
                      : 'bg-white/80 text-slate-400 hover:text-red-500 hover:bg-white'
                  }`}
                  aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar produto'}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  {/* Merchant Name */}
                  <div
                    onClick={(e) => {
                      if (onSelectStore && product.merchantId) {
                        e.stopPropagation();
                        onSelectStore(product.merchantId);
                      }
                    }}
                    className={`flex items-center gap-1 text-[11px] mb-1 line-clamp-1 ${
                      onSelectStore
                        ? 'text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer font-medium'
                        : 'text-emerald-800/80'
                    }`}
                  >
                    <Store className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{product.merchantName || 'Lojista Local'}</span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug mb-1.5 group-hover:text-emerald-800 transition-colors">
                    {product.name}
                  </h3>
                </div>

                {/* Price and Cart Button */}
                <div className="pt-2 border-t border-emerald-50 mt-2">
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

                  {/* Quick Action Button for Mobile & Desktop */}
                  {(() => {
                    const merchant = merchants.find((m) => m.id === product.merchantId);
                    const catUpper = (product.category || '').toUpperCase();
                    const isService =
                      product.itemType === 'SERVICO' ||
                      merchant?.isServiceProvider === true ||
                      catUpper.includes('SERVI');

                    const showScheduleBtn = isService
                      ? merchant?.serviceButtonsConfig?.showSchedule !== false
                      : true;

                    const isChatAllowed =
                      merchant?.allowDirectChat !== false &&
                      product.allowDirectChat !== false &&
                      (merchant?.serviceButtonsConfig?.showChat !== false);

                    return (
                      <div className="flex items-center gap-1.5">
                        {isService ? (
                          showScheduleBtn && (
                            <button
                              id={`btn-schedule-quick-${product.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const serviceItem: ServiceItem = {
                                  id: product.id,
                                  merchantId: product.merchantId,
                                  merchantName: product.merchantName,
                                  merchantCategory: merchant?.category || product.category || 'Serviços',
                                  merchantRating: merchant?.rating || product.rating || 5.0,
                                  merchantAddress: merchant?.address || 'Cachoeiras de Macacu, RJ',
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
                                if (onOpenBooking) {
                                  onOpenBooking(serviceItem);
                                } else {
                                  onSelectProduct(product);
                                }
                              }}
                              className="flex-1 py-1.5 sm:py-2 px-2 rounded-lg text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                              title="Agendar horário com o prestador de serviços"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Agendar</span>
                            </button>
                          )
                        ) : (
                          <button
                            id={`btn-cart-quick-${product.id}`}
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
                        )}

                        <button
                          id={`btn-view-${product.id}`}
                          onClick={() => onSelectProduct(product)}
                          className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-800 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isChatAllowed && (
                          <button
                            id={`btn-chat-${product.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!currentUser) {
                                promptAuthRequirement('Para conversar pelo chat interno com o lojista/prestador e tirar dúvidas, acesse sua conta ou cadastre-se gratuitamente.');
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
                            className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-800 transition-colors"
                            title="Conversar com o prestador/lojista no chat interno"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
