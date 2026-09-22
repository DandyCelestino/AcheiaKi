import { DeliveryPricingCalculation } from '../types';

/**
 * Coordenadas de referência dos bairros e distritos de Cachoeiras de Macacu - RJ
 */
export const CACHOEIRAS_NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  centro: { lat: -22.4638, lng: -42.6542, label: 'Centro' },
  castalia: { lat: -22.4550, lng: -42.6480, label: 'Castália' },
  'boca do mato': { lat: -22.4325, lng: -42.6078, label: 'Boca do Mato' },
  bocadomato: { lat: -22.4325, lng: -42.6078, label: 'Boca do Mato' },
  farao: { lat: -22.4210, lng: -42.6245, label: 'Faraó' },
  japuiba: { lat: -22.5620, lng: -42.6950, label: 'Japuíba' },
  'japuíba': { lat: -22.5620, lng: -42.6950, label: 'Japuíba' },
  papucaia: { lat: -22.6100, lng: -42.7450, label: 'Papucaia' },
  guapiacu: { lat: -22.4920, lng: -42.7310, label: 'Guapiaçu' },
  'guapiaçu': { lat: -22.4920, lng: -42.7310, label: 'Guapiaçu' },
  marapora: { lat: -22.4810, lng: -42.6710, label: 'Maraporã' },
  'maraporã': { lat: -22.4810, lng: -42.6710, label: 'Maraporã' },
  valerio: { lat: -22.4490, lng: -42.6390, label: 'Valério' },
  'valério': { lat: -22.4490, lng: -42.6390, label: 'Valério' },
  funchal: { lat: -22.4750, lng: -42.6620, label: 'Funchal' },
  ribeira: { lat: -22.5200, lng: -42.6800, label: 'Ribeira' },
  ganguri: { lat: -22.5400, lng: -42.7100, label: 'Ganguri' },
  'sao jose da boa morte': { lat: -22.6300, lng: -42.7700, label: 'São José da Boa Morte' },
  'são josé da boa morte': { lat: -22.6300, lng: -42.7700, label: 'São José da Boa Morte' },
  'campo grande': { lat: -22.4700, lng: -42.6600, label: 'Campo Grande' },
  torrinhas: { lat: -22.4400, lng: -42.6200, label: 'Torrinhas' }
};

/**
 * Normaliza o texto de bairro/endereço para busca
 */
function normalizeLocationString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Encontra as coordenadas mais próximas com base no endereço ou bairro fornecido
 */
export function findCoordinatesForAddress(addressOrNeighborhood: string): { lat: number; lng: number; matchedLabel: string } {
  const normalized = normalizeLocationString(addressOrNeighborhood);

  // Procura correspondência exata ou por inclusão
  for (const [key, val] of Object.entries(CACHOEIRAS_NEIGHBORHOOD_COORDS)) {
    const normKey = normalizeLocationString(key);
    if (normalized.includes(normKey) || normKey.includes(normalized)) {
      return { lat: val.lat, lng: val.lng, matchedLabel: val.label };
    }
  }

  // Padrão: Centro de Cachoeiras de Macacu
  return { lat: -22.4638, lng: -42.6542, matchedLabel: 'Centro' };
}

/**
 * Fórmula de Haversine para cálculo de distância geodésica em KM
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula a distância rodoviária estimada em KM entre dois endereços em Cachoeiras de Macacu
 * Aplica fator de correção viária de 1.25x para curvas e topografia local.
 * Limite mínimo de 1.5 km para deslocamentos urbanos.
 */
export function calculateDeliveryDistance(
  originAddressOrNeighborhood: string,
  destinationAddressOrNeighborhood: string
): { distanceKm: number; originLabel: string; destinationLabel: string; calculationTimestamp: string } {
  const origin = findCoordinatesForAddress(originAddressOrNeighborhood);
  const dest = findCoordinatesForAddress(destinationAddressOrNeighborhood);

  // Se forem no mesmo bairro
  if (origin.matchedLabel === dest.matchedLabel) {
    return {
      distanceKm: 2.0, // Distância média intra-bairro em Cachoeiras
      originLabel: origin.matchedLabel,
      destinationLabel: dest.matchedLabel,
      calculationTimestamp: new Date().toISOString()
    };
  }

  const directKm = haversineDistanceKm(origin.lat, origin.lng, dest.lat, dest.lng);

  // Fator de rota viária real de montanha/vale (1.25x)
  const estimatedRoadKm = Math.max(1.5, Math.round(directKm * 1.25 * 10) / 10);

  return {
    distanceKm: estimatedRoadKm,
    originLabel: origin.matchedLabel,
    destinationLabel: dest.matchedLabel,
    calculationTimestamp: new Date().toISOString()
  };
}

/**
 * Calcula os valores financeiros da corrida de entrega
 * Regra V1:
 * - Entregador: R$ 1,00 por KM (configurável: ratePerKm)
 * - Plataforma: R$ 2,00 por solicitação (configurável: platformFee)
 * - Cliente Paga: Total = Entregador + Plataforma
 */
export function calculateDeliveryPricing(
  distanceKm: number,
  ratePerKm: number = 1.0,
  platformFee: number = 2.0,
  origin: string = 'Centro',
  destination: string = 'Centro'
): DeliveryPricingCalculation {
  // Entregador recebe distância * taxa por KM
  const driverEarnings = Math.max(1.0, Math.round(distanceKm * ratePerKm * 100) / 100);
  const cleanPlatformFee = Math.max(0, Math.round(platformFee * 100) / 100);
  const totalDeliveryFee = Math.round((driverEarnings + cleanPlatformFee) * 100) / 100;

  return {
    distanceKm,
    ratePerKm,
    platformFee: cleanPlatformFee,
    driverEarnings,
    totalDeliveryFee,
    calculationTimestamp: new Date().toISOString(),
    origin,
    destination
  };
}

/**
 * Helper com formato amigável para modais de cotação rápida
 */
export function estimateDeliveryFare(
  distanceKm: number,
  ratePerKm: number = 1.0,
  platformFee: number = 2.0
): {
  distanceKm: number;
  ratePerKm: number;
  platformFee: number;
  driverEarnings: number;
  totalFare: number;
} {
  const pricing = calculateDeliveryPricing(distanceKm, ratePerKm, platformFee);
  return {
    distanceKm: pricing.distanceKm,
    ratePerKm: pricing.ratePerKm,
    platformFee: pricing.platformFee,
    driverEarnings: pricing.driverEarnings,
    totalFare: pricing.totalDeliveryFee
  };
}

/**
 * Lista todos os bairros suportados para seleção fácil
 */
export function getAllCachoeirasNeighborhoods(): string[] {
  return [
    'Centro',
    'Castália',
    'Boca do Mato',
    'Faraó',
    'Japuíba',
    'Papucaia',
    'Guapiaçu',
    'Maraporã',
    'Valério',
    'Funchal',
    'Ribeira',
    'Ganguri',
    'São José da Boa Morte',
    'Campo Grande',
    'Torrinhas'
  ];
}
