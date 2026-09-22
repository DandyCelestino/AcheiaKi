import { PointOfInterest, StoreMerchant } from '../types';

/**
 * Coordenadas centrais e limites de Cachoeiras de Macacu - RJ
 */
export const CACHOEIRAS_DE_MACACU_CENTER: [number, number] = [-22.4633, -42.6533];

export const CACHOEIRAS_BOUNDS: [[number, number], [number, number]] = [
  [-22.6500, -42.8200], // Sudoeste (Papucaia / divisa Itaboraí)
  [-22.3800, -42.5500]  // Nordeste (Serra / Três Picos / divisa Friburgo)
];

/**
 * Pontos de Interesse (POIs) de Cachoeiras de Macacu
 * Abrangendo ecoturismo, patrimônio histórico, cultura e utilidade pública
 */
export const CACHOEIRAS_POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 'poi-tres-picos',
    name: 'Parque Estadual dos Três Picos (Núcleo Jequitibá)',
    category: 'TURISMO_ECO',
    tag: 'Ecoturismo & Natureza',
    description: 'Maior parque estadual do Rio de Janeiro. Acesso ao Jequitibá centenário de mais de mil anos, trilhas ecológicas e cachoeiras preservadas.',
    address: 'Estrada do Jequitibá, Boca do Mato',
    neighborhood: 'Boca do Mato',
    latitude: -22.4325,
    longitude: -22.4325 ? -42.6078 : -42.6078,
    image: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=400&auto=format&fit=crop&q=80',
    highlights: ['Trilha do Jequitibá Milenar', 'Centro de Visitantes', 'Banho de Rio Cristalino'],
    visitInfo: 'Aberto de Terça a Domingo, das 08h às 17h. Entrada gratuita com registro.'
  },
  {
    id: 'poi-sete-quedas',
    name: 'Cachoeira de Sete Quedas & Poço das Moças',
    category: 'TURISMO_ECO',
    tag: 'Balneário Natural',
    description: 'Sequência espetacular de quedas d`água e piscinas naturais de água límpida, ideais para banho e lazer em família.',
    address: 'Estrada de Faraó, s/n',
    neighborhood: 'Faraó',
    latitude: -22.4210,
    longitude: -42.6245,
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400&auto=format&fit=crop&q=80',
    highlights: ['Piscinas Naturais', 'Águas Cristalinas', 'Quiosques com Petiscos'],
    visitInfo: 'Acesso livre. Recomenda-se calçados antiderrapantes.'
  },
  {
    id: 'poi-praca-manuel',
    name: 'Praça Manuel de Portugal (Marco Zero)',
    category: 'HISTORICO',
    tag: 'Centro Cívico & Cultural',
    description: 'Praça principal do Centro histórico, cercada pelo comércio tradicional, chafariz colonial e feiras de artesanato dos produtores locais.',
    address: 'Praça Manuel de Portugal, Centro',
    neighborhood: 'Centro',
    latitude: -22.4638,
    longitude: -42.6542,
    image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=400&auto=format&fit=crop&q=80',
    highlights: ['Chafariz Central', 'Feira de Produtores Locais', 'Ponto Central do Comércio'],
    visitInfo: 'Acesso 24h. Próximo aos principais bancos e restaurantes da cidade.'
  },
  {
    id: 'poi-igreja-matriz',
    name: "Igreja Matriz de Sant'Ana",
    category: 'HISTORICO',
    tag: 'Patrimônio Religioso',
    description: 'Templo histórico fundado no século XVIII, marco da colonização do vale do Macacu e celebração da padroeira municipal.',
    address: 'Rua Dr. Nilo Peçanha, Centro',
    neighborhood: 'Centro',
    latitude: -22.4625,
    longitude: -42.6558,
    image: 'https://images.unsplash.com/photo-1548625361-195973d84347?w=400&auto=format&fit=crop&q=80',
    highlights: ['Arquitetura Colonial', 'Missa Dominical', 'Campanário Histórico'],
    visitInfo: 'Visitação de Terça a Sábado das 09h às 18h.'
  },
  {
    id: 'poi-regua',
    name: 'Reserva Ecológica de Guapiaçu (REGUA)',
    category: 'TURISMO_ECO',
    tag: 'Reserva Ambiental Internacional',
    description: 'Referência mundial em restauração da Mata Atlântica e observação de aves (birdwatching). Abriga espécies raras e trilhas interpretativas.',
    address: 'Estrada do Guapiaçu, km 4.5',
    neighborhood: 'Guapiaçu',
    latitude: -22.4920,
    longitude: -42.7310,
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&auto=format&fit=crop&q=80',
    highlights: ['Torre de Observação de Pássaros', 'Trilhas Guiadas', 'Centro de Pesquisas'],
    visitInfo: 'Visitas mediante agendamento prévio com guias ecológicos credenciados.'
  },
  {
    id: 'poi-terminal-rodoviario',
    name: 'Terminal Rodoviário de Cachoeiras de Macacu',
    category: 'UTILIDADE_PUBLICA',
    tag: 'Transporte & Conexão',
    description: 'Principal hub de transporte rodoviário conectando o município a Niterói, Rio de Janeiro, Nova Friburgo e aos distritos rurais.',
    address: 'Av. Governador Roberto Silveira, s/n',
    neighborhood: 'Centro',
    latitude: -22.4652,
    longitude: -42.6515,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&auto=format&fit=crop&q=80',
    highlights: ['Linhas Intermunicipais', 'Ponto de Táxi', 'Atendimento ao Cidadão'],
    visitInfo: 'Funcionamento 24 horas.'
  },
  {
    id: 'poi-praca-papucaia',
    name: 'Praça Central de Papucaia',
    category: 'LAZER',
    tag: 'Polo Agro & Gastronomia Rural',
    description: 'Coração do segundo distrito, polo da agropecuária, culinária típica da roça, doces artesanais e comércio agro-rural.',
    address: 'Rua Castelo Branco, Papucaia',
    neighborhood: 'Papucaia',
    latitude: -22.5840,
    longitude: -42.7410,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
    highlights: ['Feira de Produtores Rurais', 'Queijos e Doces Típicos', 'Passeios a Cavalo'],
    visitInfo: 'Feira tradicional aos sábados pela manhã.'
  },
  {
    id: 'poi-portico',
    name: 'Pórtico da Cidade - Rodovia RJ-116',
    category: 'HISTORICO',
    tag: 'Recepção Turística',
    description: 'Pórtico de boas-vindas marcando a entrada da cidade para quem vem pela RJ-116 em direção à Serra do Mar.',
    address: 'Rodovia RJ-116, km 28',
    neighborhood: 'Entrada da Cidade',
    latitude: -22.4810,
    longitude: -42.6780,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&auto=format&fit=crop&q=80',
    highlights: ['Monumento de Boas-Vindas', 'Ponto Fotográfico', 'Posto de Informações'],
    visitInfo: 'Parada segura no acostamento turístico.'
  }
];

/**
 * Coordenadas fixas pré-definidas para os lojistas conhecidos de Cachoeiras de Macacu
 */
const KNOWN_MERCHANT_COORDS: Record<string, { lat: number; lng: number }> = {
  'store-1': { lat: -22.4645, lng: -42.6525 }, // Boutique das Flores - Av. Beira Rio, 102
  'store-2': { lat: -22.4628, lng: -42.6552 }, // Pizzaria Imperial - Rua Dr. Nilo Peçanha, 45
  'store-3': { lat: -22.4635, lng: -42.6540 }, // Espaço VIP Hair - Praça Manoel de Jesus, 88
  'store-4': { lat: -22.5852, lng: -42.7415 }, // Donna Elegance - Rua Castelo Branco, 310 (Papucaia)
  'store-5': { lat: -22.4620, lng: -42.6538 }, // Tech Solutions - Rua Gov. Roberto Silveira, 215
  'store-marido-1': { lat: -22.4615, lng: -42.6560 }, // Marido de Aluguel - Rua Dr. Nilo Peçanha, 210
  'store-instalacoes-1': { lat: -22.4608, lng: -42.6520 } // ClimaTop - Av. Gov. Roberto Silveira, 450
};

/**
 * Coordenadas aproximadas por bairro de Cachoeiras de Macacu (usado para novos lojistas cadastrados)
 */
const NEIGHBORHOOD_OFFSETS: Record<string, { lat: number; lng: number }> = {
  centro: { lat: -22.4633, lng: -42.6533 },
  papucaia: { lat: -22.5840, lng: -42.7410 },
  japuiba: { lat: -22.5630, lng: -42.6950 },
  farao: { lat: -22.4210, lng: -42.6245 },
  guapiacu: { lat: -22.4920, lng: -42.7310 },
  'boca do mato': { lat: -22.4350, lng: -42.6050 },
  castalia: { lat: -22.4720, lng: -42.6640 }
};

/**
 * Retorna as coordenadas geográficas reais ou aproximadas para um lojista
 */
export const getMerchantCoordinates = (merchant: StoreMerchant): { lat: number; lng: number } => {
  // Se o lojista já tem coordenadas cadastradas
  if (typeof merchant.latitude === 'number' && typeof merchant.longitude === 'number') {
    return { lat: merchant.latitude, lng: merchant.longitude };
  }

  // Se é um lojista com coordenadas pré-configuradas no catálogo
  if (KNOWN_MERCHANT_COORDS[merchant.id]) {
    return KNOWN_MERCHANT_COORDS[merchant.id];
  }

  // Tenta derivar a partir do bairro
  const cleanNeighborhood = (merchant.neighborhood || '').toLowerCase().trim();
  const base = NEIGHBORHOOD_OFFSETS[cleanNeighborhood] || NEIGHBORHOOD_OFFSETS['centro'];

  // Aplica um pequeno deslocamento determinístico com base no hash do ID para não sobrepor ícones
  const hash = merchant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offsetLat = ((hash % 17) - 8) * 0.0007;
  const offsetLng = (((hash * 7) % 17) - 8) * 0.0007;

  return {
    lat: base.lat + offsetLat,
    lng: base.lng + offsetLng
  };
};



