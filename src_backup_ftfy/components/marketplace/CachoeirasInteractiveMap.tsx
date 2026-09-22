import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Store,
  Navigation,
  Compass,
  Mountain,
  Waves,
  Landmark,
  Utensils,
  Wrench,
  ShieldCheck,
  Star,
  Maximize2,
  Minimize2,
  Search,
  ExternalLink,
  X,
  Layers,
  Sparkles,
  TreePine,
  Clock,
  Phone
} from 'lucide-react';
import { StoreMerchant, PointOfInterest } from '../../types';
import {
  CACHOEIRAS_DE_MACACU_CENTER,
  CACHOEIRAS_POINTS_OF_INTEREST,
  getMerchantCoordinates
} from '../../data/cachoeirasMapData';

interface CachoeirasInteractiveMapProps {
  merchants: StoreMerchant[];
  onSelectStore?: (merchantId: string) => void;
  className?: string;
  defaultExpanded?: boolean;
}

type FilterCategory = 'ALL' | 'MERCHANTS' | 'GASTRONOMIA' | 'SERVICOS' | 'POIS_ECO';

export const CachoeirasInteractiveMap: React.FC<CachoeirasInteractiveMapProps> = ({
  merchants,
  onSelectStore,
  className = '',
  defaultExpanded = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [mapSearch, setMapSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'MERCHANT' | 'POI';
    data: StoreMerchant | PointOfInterest;
  } | null>(null);

  // Filtro de Lojistas aprovados
  const approvedMerchants = useMemo(() => {
    return merchants.filter((m) => m.status === 'approved');
  }, [merchants]);

  // Itens filtrados para exibição no mapa
  const filteredData = useMemo(() => {
    const q = mapSearch.trim().toLowerCase();

    // 1. Filtrar Lojistas
    const matchedMerchants = approvedMerchants.filter((m) => {
      // Categoria do filtro rápido
      if (activeFilter === 'POIS_ECO') return false;
      if (activeFilter === 'GASTRONOMIA') {
        const cat = (m.category || '').toLowerCase();
        if (!cat.includes('gastro') && !cat.includes('pizza') && !cat.includes('lanche') && !cat.includes('restaurante')) {
          return false;
        }
      }
      if (activeFilter === 'SERVICOS') {
        const cat = (m.category || '').toLowerCase();
        if (!m.isServiceProvider && !cat.includes('servi') && !cat.includes('reparo') && !cat.includes('beleza') && !cat.includes('instala')) {
          return false;
        }
      }
      if (activeFilter === 'MERCHANTS') {
        // Exibe comércio tradicional / lojas
        if (m.isServiceProvider) return false;
      }

      // Busca por texto
      if (q) {
        const full = `${m.name} ${m.category} ${m.address} ${m.neighborhood}`.toLowerCase();
        return full.includes(q);
      }
      return true;
    });

    // 2. Filtrar POIs
    const matchedPois = CACHOEIRAS_POINTS_OF_INTEREST.filter((poi) => {
      if (activeFilter === 'MERCHANTS' || activeFilter === 'GASTRONOMIA' || activeFilter === 'SERVICOS') {
        return false;
      }
      if (q) {
        const full = `${poi.name} ${poi.tag} ${poi.description} ${poi.address} ${poi.neighborhood}`.toLowerCase();
        return full.includes(q);
      }
      return true;
    });

    return {
      merchants: matchedMerchants,
      pois: matchedPois
    };
  }, [approvedMerchants, activeFilter, mapSearch]);

  // Inicializar o mapa do Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // já inicializado

    const map = L.map(mapContainerRef.current, {
      center: CACHOEIRAS_DE_MACACU_CENTER,
      zoom: 13,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false // custom controls posicionados adequadamente
    });

    // Layer de OpenStreetMap com visual amigável e rápido
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Adiciona controle de zoom no canto superior direito
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Cria o grupo de camadas para marcadores dinâmicos
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Timeout para ajuste de layout correto
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Forçar recálculo de tamanho do mapa quando alternar expansão
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [isExpanded]);

  // Função para criar o ícone HTML estilizado via Leaflet DivIcon
  const createMarkerIcon = useCallback((type: 'STORE' | 'FOOD' | 'SERVICE' | 'POI_ECO' | 'POI_HIST') => {
    let bgClass = 'bg-emerald-600 border-emerald-400';
    let iconSvg = '';

    if (type === 'STORE') {
      bgClass = 'bg-emerald-600 border-emerald-200 text-white';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
          <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
        </svg>
      `;
    } else if (type === 'FOOD') {
      bgClass = 'bg-amber-600 border-amber-200 text-white';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
          <path d="M15 2v18"/>
          <path d="M7 2h2v7.5a2.5 2.5 0 0 1-5 0V2h2"/>
          <path d="M7 11.5V22"/>
        </svg>
      `;
    } else if (type === 'SERVICE') {
      bgClass = 'bg-blue-600 border-blue-200 text-white';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      `;
    } else if (type === 'POI_ECO') {
      bgClass = 'bg-teal-700 border-emerald-300 text-emerald-100';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m8 14 4-7 4 7"/>
          <path d="M12 7v13"/>
          <path d="m5 18 7-4 7 4"/>
        </svg>
      `;
    } else {
      bgClass = 'bg-purple-700 border-purple-200 text-purple-100';
      iconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/>
          <path d="M6 21V11"/>
          <path d="M10 21V11"/>
          <path d="M14 21V11"/>
          <path d="M18 21V11"/>
          <path d="M12 3 2 8v3h20V8L12 3z"/>
        </svg>
      `;
    }

    const html = `
      <div class="relative group cursor-pointer">
        <div class="w-8 h-8 rounded-full ${bgClass} border-2 shadow-lg flex items-center justify-center transform transition-transform hover:scale-115">
          ${iconSvg}
        </div>
        <div class="w-2.5 h-2.5 bg-slate-900 rounded-full mx-auto -mt-1 opacity-70 blur-[1px]"></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html,
      iconSize: [32, 36],
      iconAnchor: [16, 34],
      popupAnchor: [0, -32]
    });
  }, []);

  // Atualizar marcadores no mapa sempre que os dados ou filtros mudarem
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = L.latLngBounds([]);

    // 1. Inserir Lojistas Aprovados
    filteredData.merchants.forEach((m) => {
      const coords = getMerchantCoordinates(m);
      bounds.extend([coords.lat, coords.lng]);

      const catLower = (m.category || '').toLowerCase();
      let iconType: 'STORE' | 'FOOD' | 'SERVICE' = 'STORE';
      if (catLower.includes('pizza') || catLower.includes('gastro') || catLower.includes('lanche')) {
        iconType = 'FOOD';
      } else if (m.isServiceProvider || catLower.includes('servi') || catLower.includes('reparo') || catLower.includes('beleza')) {
        iconType = 'SERVICE';
      }

      const icon = createMarkerIcon(iconType);
      const marker = L.marker([coords.lat, coords.lng], { icon });

      // Popup de conteúdo amigável
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; max-width: 260px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <img src="${m.logo}" alt="${m.name}" style="width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid #d1fae5;" />
            <div style="flex: 1; min-width: 0;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #064e3b; line-height: 1.2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                ${m.name}
              </h4>
              <span style="font-size: 10px; color: #047857; font-weight: 600;">${m.category}</span>
            </div>
          </div>
          <p style="margin: 4px 0 6px 0; font-size: 11px; color: #475569; line-height: 1.3;">
            📍 ${m.address}, ${m.neighborhood}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
            <span style="color: #d97706;">★ ${m.rating.toFixed(1)} (${m.reviewsCount})</span>
            <span style="color: #059669;">⏱ ${m.deliveryTimeEstimate}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 8px; font-size: 10px; font-weight: 700; color: #0f172a; background: #f1f5f9; border-radius: 6px; text-decoration: none; border: 1px solid #cbd5e1;">
              Rotas GPS ↗
            </a>
            <button id="btn-merchant-${m.id}" style="padding: 5px 8px; font-size: 10px; font-weight: 800; color: white; background: #059669; border: none; border-radius: 6px; cursor: pointer;">
              Ver Loja
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Ao clicar, selecionar e disparar evento
      marker.on('click', () => {
        setSelectedItem({ type: 'MERCHANT', data: m });
        setTimeout(() => {
          const btn = document.getElementById(`btn-merchant-${m.id}`);
          if (btn && onSelectStore) {
            btn.onclick = () => onSelectStore(m.id);
          }
        }, 100);
      });

      group.addLayer(marker);
    });

    // 2. Inserir Pontos de Interesse (POIs)
    filteredData.pois.forEach((poi) => {
      bounds.extend([poi.latitude, poi.longitude]);

      const iconType = poi.category === 'TURISMO_ECO' ? 'POI_ECO' : 'POI_HIST';
      const icon = createMarkerIcon(iconType);
      const marker = L.marker([poi.latitude, poi.longitude], { icon });

      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;

      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; max-width: 260px; padding: 2px;">
          ${poi.image ? `<img src="${poi.image}" alt="${poi.name}" style="width: 100%; height: 90px; border-radius: 8px; object-fit: cover; margin-bottom: 6px;" />` : ''}
          <div style="margin-bottom: 4px;">
            <span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; margin-bottom: 3px;">
              ${poi.tag}
            </span>
            <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #064e3b; line-height: 1.2;">
              ${poi.name}
            </h4>
          </div>
          <p style="margin: 4px 0 6px 0; font-size: 11px; color: #475569; line-height: 1.3;">
            ${poi.description}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b;">
            📍 ${poi.address}
          </p>
          <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; padding: 6px 8px; font-size: 11px; font-weight: 700; color: white; background: #065f46; border-radius: 6px; text-decoration: none; text-align: center; box-sizing: border-box;">
            Como Chegar (Google Maps) ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedItem({ type: 'POI', data: poi });
      });

      group.addLayer(marker);
    });
  }, [filteredData, createMarkerIcon, onSelectStore]);

  // Controles de navegação rápida
  const handleResetToCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(CACHOEIRAS_DE_MACACU_CENTER, 14, { animate: true });
    }
  };

  const handleFitAllPoints = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([]);
    filteredData.merchants.forEach((m) => {
      const c = getMerchantCoordinates(m);
      bounds.extend([c.lat, c.lng]);
    });
    filteredData.pois.forEach((p) => {
      bounds.extend([p.latitude, p.longitude]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true });
    } else {
      map.setView(CACHOEIRAS_DE_MACACU_CENTER, 13);
    }
  };

  const totalPointsCount = filteredData.merchants.length + filteredData.pois.length;

  return (
    <div className={`bg-white rounded-3xl border border-emerald-200/80 shadow-sm overflow-hidden transition-all duration-300 ${className}`}>
      {/* MAP HEADER */}
      <div className="p-4 sm:p-5 border-b border-emerald-100 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <span>Geolocalização & Mapa Interativo</span>
                  <span className="bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded-sm text-[9px]">
                    Leaflet.js + OpenStreetMap
                  </span>
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-2">
                  <span>Comércio & Pontos de Cachoeiras de Macacu</span>
                </h3>
              </div>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed max-w-xl">
              Localize estabelecimentos credenciados, pontos de retirada e os principais atrativos ecológicos e históricos do nosso município.
            </p>
          </div>

          {/* AÇÕES NO TOPO */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleResetToCenter}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-white/15 cursor-pointer"
              title="Centralizar no Centro Histórico"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-300" />
              <span>Centro</span>
            </button>

            <button
              onClick={handleFitAllPoints}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-white/15 cursor-pointer"
              title="Ajustar zoom para todos os pontos cadastrados"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ver Todos ({totalPointsCount})</span>
            </button>

            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Reduzir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expandir Mapa</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS & BUSCA DENTRO DO MAPA */}
        <div className="mt-4 pt-3 border-t border-emerald-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* CATEGORY CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              Todos ({approvedMerchants.length + CACHOEIRAS_POINTS_OF_INTEREST.length})
            </button>

            <button
              onClick={() => setActiveFilter('MERCHANTS')}
              className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'MERCHANTS'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>Lojas & Comércio</span>
            </button>

            <button
              onClick={() => setActiveFilter('GASTRONOMIA')}
              className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'GASTRONOMIA'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Gastronomia</span>
            </button>

            <button
              onClick={() => setActiveFilter('SERVICOS')}
              className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'SERVICOS'
                  ? 'bg-blue-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Serviços</span>
            </button>

            <button
              onClick={() => setActiveFilter('POIS_ECO')}
              className={`px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer flex items-center space-x-1 ${
                activeFilter === 'POIS_ECO'
                  ? 'bg-teal-300 text-slate-950 font-black shadow-xs'
                  : 'bg-white/10 text-emerald-100 hover:bg-white/20'
              }`}
            >
              <TreePine className="w-3 h-3" />
              <span>Ecoturismo & Lazer</span>
            </button>
          </div>

          {/* BUSCA TEXTUAL */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar ponto, loja ou bairro..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-900/90 border border-emerald-700/60 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
            {mapSearch && (
              <button
                onClick={() => setMapSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAP CONTAINER & SIDE DRAWER */}
      <div className="relative w-full">
        {/* LEAFLET CANVAS */}
        <div
          ref={mapContainerRef}
          className={`w-full transition-all duration-300 ${
            isExpanded ? 'h-[540px] sm:h-[620px]' : 'h-[360px] sm:h-[420px]'
          }`}
          style={{ zIndex: 1 }}
        />

        {/* LEGENDA FLUTUANTE INFERIOR */}
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-slate-200 shadow-md text-[11px] space-y-1.5 pointer-events-auto hidden sm:block">
          <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
            Legenda do Mapa:
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              <span className="text-slate-700">Comércio</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
              <span className="text-slate-700">Gastronomia</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-slate-700">Serviços</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-teal-700 inline-block"></span>
              <span className="text-slate-700">Ecoturismo</span>
            </div>
          </div>
        </div>

        {/* DETALHE DO ITEM SELECIONADO (CARD FLUTUANTE OU DRAWER) */}
        {selectedItem && (
          <div className="absolute top-3 right-3 z-[400] max-w-xs sm:max-w-sm w-full bg-white rounded-2xl shadow-xl border border-emerald-200 p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {selectedItem.type === 'MERCHANT' ? 'Lojista Verificado' : 'Ponto Turístico'}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedItem.type === 'MERCHANT' ? (
              (() => {
                const m = selectedItem.data as StoreMerchant;
                const coords = getMerchantCoordinates(m);
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.logo}
                        alt={m.name}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {m.name}
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-semibold">{m.category}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="flex items-center text-amber-600 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                            {m.rating.toFixed(1)}
                          </span>
                          <span>•</span>
                          <span>{m.deliveryTimeEstimate}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>

                    <div className="text-[11px] text-slate-500 space-y-0.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{m.address}, {m.neighborhood}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{m.openingHours}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1 border border-slate-200"
                      >
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        <span>Rotas GPS</span>
                      </a>

                      {onSelectStore && (
                        <button
                          type="button"
                          onClick={() => onSelectStore(m.id)}
                          className="py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Store className="w-3 h-3" />
                          <span>Ver Loja</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              (() => {
                const poi = selectedItem.data as PointOfInterest;
                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`;

                return (
                  <div className="space-y-3">
                    {poi.image && (
                      <div className="relative h-28 w-full rounded-xl overflow-hidden">
                        <img
                          src={poi.image}
                          alt={poi.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent"></div>
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white uppercase tracking-wider bg-emerald-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {poi.tag}
                        </span>
                      </div>
                    )}

                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950 leading-tight">
                        {poi.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {poi.description}
                      </p>
                    </div>

                    {poi.highlights && poi.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {poi.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200/60"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{poi.address}</span>
                      </div>
                      {poi.visitInfo && (
                        <p className="text-[10px] text-slate-500 italic pl-4">
                          {poi.visitInfo}
                        </p>
                      )}
                    </div>

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Traçar Rota no Google Maps</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* RODAPÉ DO MAPA - ATALHOS PARA BAIRROS E DISTRITOS */}
      <div className="p-3 bg-slate-50 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-bold text-emerald-950">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Polos de Cachoeiras de Macacu:</span>
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {[
            { name: 'Centro Histórico', coords: [-22.4633, -42.6533], zoom: 15 },
            { name: 'Papucaia (Polo Agro)', coords: [-22.5840, -42.7410], zoom: 15 },
            { name: 'Boca do Mato / Três Picos', coords: [-22.4350, -42.6050], zoom: 14 },
            { name: 'Faraó / Sete Quedas', coords: [-22.4210, -42.6245], zoom: 14 },
            { name: 'Guapiaçu / REGUA', coords: [-22.4920, -42.7310], zoom: 14 }
          ].map((polo, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView(polo.coords as [number, number], polo.zoom, {
                    animate: true
                  });
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
            >
              {polo.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
