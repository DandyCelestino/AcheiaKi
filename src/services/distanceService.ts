import { DeliveryPricingCalculation } from '../types';

/**
 * Coordenadas de referÃªncia dos bairros e distritos de Cachoeiras de Macacu - RJ
 */
export const CACHOEIRAS_NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  centro: { lat: -22.4638, lng: -42.6542, label: 'Centro' },
  castalia: { lat: -22.4550, lng: -42.6480, label: 'CastÃ¡lia' },
  'boca do mato': { lat: -22.4180, lng: -42.5980, label: 'Boca do Mato' },
  bocadomato: { lat: -22.4180, lng: -42.5980, label: 'Boca do Mato' },
  farao: { lat: -22.4080, lng: -42.6150, label: 'FaraÃ³' },
  japuiba: { lat: -22.5620, lng: -42.6950, label: 'JapuÃ­ba' },
  papucaia: { lat: -22.6100, lng: -42.7450, label: 'Papucaia' },
  guapiacu: { lat: -22.5200, lng: -42.7600, label: 'GuapiaÃ§u' },
  marapora: { lat: -22.4810, lng: -42.6710, label: 'MaraporÃ£' },
  valerio: { lat: -22.4490, lng: -42.6390, label: 'ValÃ©rio' },
  funchal: { lat: -22.4750, lng: -42.6620, label: 'Funchal' },
  ribeira: { lat: -22.5200, lng: -42.6800, label: 'Ribeira' },
  ganguri: { lat: -22.5400, lng: -42.7100, label: 'Ganguri' },
  'sao jose da boa morte': { lat: -22.6450, lng: -42.7850, label: 'SÃ£o JosÃ© da Boa Morte' },
  'campo grande': { lat: -22.4700, lng: -42.6600, label: 'Campo Grande' },
  torrinhas: { lat: -22.4350, lng: -42.6180, label: 'Torrinhas' }
};

/**
 * Normaliza o texto de bairro/endereÃ§o para busca
 */
export function normalizeLocationString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Matriz de DistÃ¢ncias ViÃ¡rias Reais (em KM) entre bairros e distritos
 * de Cachoeiras de Macacu - RJ (via RJ-116, RJ-122 e acessos municipais)
 */
const ROAD_DISTANCE_MATRIX: Record<string, number> = {
  // Centro como origem
  'centro__castalia': 3.2,
  'centro__valerio': 3.5,
  'centro__campo grande': 4.2,
  'centro__funchal': 5.5,
  'centro__marapora': 7.0,
  'centro__torrinhas': 7.8,
  'centro__ribeira': 9.5,
  'centro__boca do mato': 12.5,
  'centro__ganguri': 14.5,
  'centro__farao': 15.0,
  'centro__japuiba': 17.5,
  'centro__guapiacu': 21.5,
  'centro__papucaia': 24.5,
  'centro__sao jose da boa morte': 30.5,

  // CastÃ¡lia
  'castalia__valerio': 4.5,
  'castalia__campo grande': 5.0,
  'castalia__funchal': 6.8,
  'castalia__torrinhas': 6.5,
  'castalia__marapora': 8.5,
  'castalia__boca do mato': 10.5,
  'castalia__ribeira': 11.0,
  'castalia__farao': 13.5,
  'castalia__ganguri': 16.0,
  'castalia__japuiba': 19.5,
  'castalia__guapiacu': 23.5,
  'castalia__papucaia': 26.5,
  'castalia__sao jose da boa morte': 32.5,

  // JapuÃ­ba (2Âº Distrito)
  'japuiba__ganguri': 4.2,
  'japuiba__ribeira': 8.5,
  'japuiba__papucaia': 9.8,
  'japuiba__marapora': 11.5,
  'japuiba__funchal': 13.5,
  'japuiba__valerio': 15.5,
  'japuiba__campo grande': 16.0,
  'japuiba__sao jose da boa morte': 17.5,
  'japuiba__guapiacu': 18.0,
  'japuiba__torrinhas': 23.5,
  'japuiba__boca do mato': 28.5,
  'japuiba__farao': 31.0,

  // Papucaia (3Âº Distrito)
  'papucaia__sao jose da boa morte': 8.5,
  'papucaia__ganguri': 12.5,
  'papucaia__guapiacu': 13.8,
  'papucaia__ribeira': 16.5,
  'papucaia__marapora': 19.0,
  'papucaia__funchal': 21.0,
  'papucaia__valerio': 23.0,
  'papucaia__campo grande': 23.5,
  'papucaia__torrinhas': 30.5,
  'papucaia__boca do mato': 35.5,
  'papucaia__farao': 38.0,

  // Boca do Mato & FaraÃ³ (Serra)
  'boca do mato__farao': 7.5,
  'boca do mato__torrinhas': 5.2,
  'boca do mato__valerio': 14.0,
  'boca do mato__campo grande': 15.0,
  'boca do mato__funchal': 16.0,
  'boca do mato__marapora': 17.5,
  'boca do mato__ribeira': 20.0,
  'boca do mato__ganguri': 25.0,
  'boca do mato__guapiacu': 32.5,
  'boca do mato__sao jose da boa morte': 41.0,

  // SÃ£o JosÃ© da Boa Morte
  'sao jose da boa morte__guapiacu': 15.0,
  'sao jose da boa morte__ganguri': 20.0,
  'sao jose da boa morte__ribeira': 24.0,
  'sao jose da boa morte__marapora': 26.5,
  'sao jose da boa morte__funchal': 28.5,
  'sao jose da boa morte__valerio': 31.0,
  'sao jose da boa morte__campo grande': 31.5,
  'sao jose da boa morte__torrinhas': 37.0,
  'sao jose da boa morte__farao': 43.5,

  // GuapiaÃ§u
  'guapiacu__ganguri': 17.5,
  'guapiacu__ribeira': 21.0,
  'guapiacu__marapora': 23.5,
  'guapiacu__funchal': 25.0,
  'guapiacu__valerio': 22.5,
  'guapiacu__campo grande': 23.0,
  'guapiacu__torrinhas': 28.5,
  'guapiacu__farao': 34.0,

  // Bairros intermediÃ¡rios
  'valerio__campo grande': 2.5,
  'valerio__funchal': 3.0,
  'valerio__torrinhas': 5.5,
  'valerio__marapora': 4.5,
  'valerio__ribeira': 7.5,
  'valerio__ganguri': 12.0,
  'valerio__farao': 12.5,

  'campo grande__funchal': 2.8,
  'campo grande__marapora': 4.0,
  'campo grande__torrinhas': 7.0,
  'campo grande__ribeira': 7.0,
  'campo grande__ganguri': 11.5,

  'funchal__marapora': 2.2,
  'funchal__ribeira': 5.0,
  'funchal__ganguri': 9.5,
  'funchal__torrinhas': 8.5,

  'marapora__ribeira': 3.5,
  'marapora__ganguri': 8.0,
  'marapora__torrinhas': 10.0,

  'ribeira__ganguri': 5.0,
  'ribeira__torrinhas': 12.5,

  'torrinhas__farao': 9.5,
  'ganguri__torrinhas': 17.5
};

/**
 * Encontra as coordenadas mais prÃ³ximas com base no endereÃ§o ou bairro fornecido.
 * Ordena chaves por comprimento decrescente para priorizar nomes compostos.
 */
export function findCoordinatesForAddress(addressOrNeighborhood: string): { lat: number; lng: number; matchedLabel: string } {
  const normalized = normalizeLocationString(addressOrNeighborhood);
  if (!normalized) {
    return { lat: -22.4638, lng: -42.6542, matchedLabel: 'Centro' };
  }

  // Ordena por comprimento decrescente para evitar falso positivo em substrings curtas
  const sortedKeys = Object.keys(CACHOEIRAS_NEIGHBORHOOD_COORDS).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const val = CACHOEIRAS_NEIGHBORHOOD_COORDS[key];
    const normKey = normalizeLocationString(key);
    
    // CorrespondÃªncia exata ou verificaÃ§Ã£o de palavra completa
    const regex = new RegExp(`(^|\\s)${normKey}(\\s|$)`, 'i');
    if (regex.test(normalized) || normalized === normKey) {
      return { lat: val.lat, lng: val.lng, matchedLabel: val.label };
    }
  }

  // Segunda passada: busca por inclusÃ£o direta se o nome do bairro estiver no texto
  for (const key of sortedKeys) {
    const val = CACHOEIRAS_NEIGHBORHOOD_COORDS[key];
    const normKey = normalizeLocationString(key);
    if (normalized.includes(normKey)) {
      return { lat: val.lat, lng: val.lng, matchedLabel: val.label };
    }
  }

  // PadrÃ£o: Centro de Cachoeiras de Macacu
  return { lat: -22.4638, lng: -42.6542, matchedLabel: 'Centro' };
}

/**
 * FÃ³rmula de Haversine para cÃ¡lculo de distÃ¢ncia geodÃ©sica em KM
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
 * Calcula a distÃ¢ncia viÃ¡ria real em KM entre dois bairros/endereÃ§os em Cachoeiras de Macacu.
 * 1. Se mesmo bairro: distÃ¢ncia urbana mÃ©dia intra-bairro = 2.0 km.
 * 2. Se pares de bairros mapeados na malha viÃ¡ria oficial: consulta a matriz rodoviÃ¡ria real.
 * 3. Se rota customizada / coordenadas: calcula Haversine com fator de curvatura topogrÃ¡fica (1.35x).
 */
export function calculateDeliveryDistance(
  originAddressOrNeighborhood: string,
  destinationAddressOrNeighborhood: string
): { distanceKm: number; originLabel: string; destinationLabel: string; calculationTimestamp: string } {
  const origin = findCoordinatesForAddress(originAddressOrNeighborhood);
  const dest = findCoordinatesForAddress(destinationAddressOrNeighborhood);

  const normO = normalizeLocationString(origin.matchedLabel);
  const normD = normalizeLocationString(dest.matchedLabel);

  // 1. Mesmo bairro = entrega intra-bairro
  if (normO === normD) {
    return {
      distanceKm: 2.0,
      originLabel: origin.matchedLabel,
      destinationLabel: dest.matchedLabel,
      calculationTimestamp: new Date().toISOString()
    };
  }

  // 2. Consulta Ã  Matriz de DistÃ¢ncias ViÃ¡rias Reais de Cachoeiras de Macacu
  const key1 = `${normO}__${normD}`;
  const key2 = `${normD}__${normO}`;
  const matrixDist = ROAD_DISTANCE_MATRIX[key1] ?? ROAD_DISTANCE_MATRIX[key2];

  if (matrixDist !== undefined) {
    return {
      distanceKm: matrixDist,
      originLabel: origin.matchedLabel,
      destinationLabel: dest.matchedLabel,
      calculationTimestamp: new Date().toISOString()
    };
  }

  // 3. Fallback geodÃ©sico Haversine com fator de via montanhosa (1.35x)
  const directKm = haversineDistanceKm(origin.lat, origin.lng, dest.lat, dest.lng);
  const estimatedRoadKm = Math.max(1.5, Math.round(directKm * 1.35 * 10) / 10);

  return {
    distanceKm: estimatedRoadKm,
    originLabel: origin.matchedLabel,
    destinationLabel: dest.matchedLabel,
    calculationTimestamp: new Date().toISOString()
  };
}

/**
 * Calcula os valores financeiros da corrida de entrega
 * Regra V1 estabelecida:
 * - Entregador: R$ 1,00 por KM (configurÃ¡vel: ratePerKm)
 * - Plataforma: R$ 2,00 por solicitaÃ§Ã£o (configurÃ¡vel: platformFee)
 * - Cliente Paga: Total = Entregador + Plataforma
 */
export function calculateDeliveryPricing(
  distanceKm: number,
  ratePerKm: number = 1.0,
  platformFee: number = 5.0,
  origin: string = 'Centro',
  destination: string = 'Centro',
  minimumFare: number = 5.0,
  platformFeeUpTo10Km: number = platformFee,
  platformFeeUpTo20Km: number = 4.0,
  platformFeeAbove20Km: number = 3.5
): DeliveryPricingCalculation {
  const safeDistanceKm = Math.max(0, Number(distanceKm) || 0);
  const safeRatePerKm = Math.max(0, Number(ratePerKm) || 0);
  const safeMinimumFare = Math.max(0, Number(minimumFare) || 0);

  const distanceBasedEarnings =
    Math.round(safeDistanceKm * safeRatePerKm * 100) / 100;

  const driverEarnings = Math.max(
    safeMinimumFare,
    distanceBasedEarnings
  );

  const selectedPlatformFee =
    safeDistanceKm <= 10
      ? platformFeeUpTo10Km
      : safeDistanceKm <= 20
        ? platformFeeUpTo20Km
        : platformFeeAbove20Km;

  const cleanPlatformFee =
    Math.max(0, Math.round((Number(selectedPlatformFee) || 0) * 100) / 100);

  const totalDeliveryFee =
    Math.round((driverEarnings + cleanPlatformFee) * 100) / 100;

  return {
    distanceKm: safeDistanceKm,
    ratePerKm: safeRatePerKm,
    platformFee: cleanPlatformFee,
    driverEarnings,
    totalDeliveryFee,
    calculationTimestamp: new Date().toISOString(),
    origin,
    destination
  };
}
/**
 * Helper com formato amigÃ¡vel para modais de cotaÃ§Ã£o rÃ¡pida
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
 * Lista todos os bairros suportados para seleÃ§Ã£o fÃ¡cil
 */
export function getAllCachoeirasNeighborhoods(): string[] {
  return [
    'Centro',
    'CastÃ¡lia',
    'Boca do Mato',
    'FaraÃ³',
    'JapuÃ­ba',
    'Papucaia',
    'GuapiaÃ§u',
    'MaraporÃ£',
    'ValÃ©rio',
    'Funchal',
    'Ribeira',
    'Ganguri',
    'SÃ£o JosÃ© da Boa Morte',
    'Campo Grande',
    'Torrinhas'
  ];
}

