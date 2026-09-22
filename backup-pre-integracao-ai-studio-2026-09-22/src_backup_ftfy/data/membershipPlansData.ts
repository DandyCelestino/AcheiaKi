import { MembershipTier, PlanBenefitRule } from '../types';

export const OFFICIAL_PIX_INFO = {
  cnpj: '30.810.800/0001-39',
  cnpjClean: '30810800000139',
  beneficiary: 'Bex Serviços e Comércios',
  bank: 'Instituição Bancária Integrada PIX',
  city: 'Cachoeiras de Macacu - RJ',
  officialNotice: 'Pagamento oficial exclusivo para chave CNPJ 30.810.800/0001-39 (Bex Serviços e Comércios).'
};

// =========================================================================
// REGRAS OFICIAIS DO ORGANOGRAMA COMERCIAL (BEX SERVIÇOS E COMÉRCIOS)
// =========================================================================
export const SALES_ORGANOGRAM_CONFIG = {
  vendorCommissionPercent: 5, // 5% do valor total do plano vendido
  officialCnpj: '30.810.800/0001-39',
  pixKeyClean: '30810800000139',
  pixKeyFormatted: '30.810.800/0001-39',
  beneficiary: 'Bex Serviços e Comércios',
  // Regras de Usuário / Cliente Comprador
  userClient: {
    registrationFee: 0.00,
    monthlyFee: 0.00,
    canPostProducts: false,
    canInsertBanners: false,
    canCommercialInteract: false,
    onlyPurchases: true,
    title: 'Usuário / Cliente Comprador',
    description: 'Cadastro 100% gratuito (R$ 0,00). O cliente não paga mensalidades. Uso exclusivo para compras, busca de itens e agendamentos. Sem permissão para postar produtos ou banners.'
  },
  // Regras de Prestador de Serviços
  serviceProvider: {
    monthlyFee: 29.90, // Fixo R$ 29,90
    includedServicesCount: 1, // 1 único serviço incluso
    extraServiceMonthlyFee: 9.90, // A partir do 2º, R$ 9,90 além por cada serviço adicional
    vendorCommissionRate: 5, // 5%
    vendorCommissionAmount: 1.50, // 5% de R$ 29,90 = R$ 1,50
    title: 'Prestador de Serviços',
    description: 'Mensalidade fixa de R$ 29,90 com 1 serviço incluso no catálogo. Cada serviço adicional terá cobrança de R$ 9,90/mês. Vendedor recebe 5% de comissão (R$ 1,50).'
  },
  // Regras de Lojista
  merchant: {
    title: 'Lojista Comercial',
    description: 'Lojista escolhe o plano comercial (Bronze, Prata, Ouro ou Premium). Pagamento via PIX CNPJ 30810800000139. Vendedor recebe comissão de 5% sobre o valor total do plano vendido.',
    vendorCommissionPercent: 5
  }
};

export const SERVICE_PROVIDER_BASE_PRICE = 29.90;
export const SERVICE_PROVIDER_EXTRA_SERVICE_PRICE = 9.90;
export const SERVICE_PROVIDER_INCLUDED_SERVICES = 1;
export const VENDOR_COMMISSION_PERCENT = 5;

export interface BannerPackageRule {
  quantity: number; // 1 to 6
  title: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export const BANNER_BASE_PRICE = 199.00; // Base: até 3 banners por R$ 199,00
export const BANNER_EXTRA_UNIT_PRICE = 49.00; // Acima de 3: R$ 49,00 por banner adicional
export const MAX_BANNER_QUANTITY = 6; // Não ultrapassando a quantidade de 6 banners

export function calculateBannerPackagePrice(quantity: number): number {
  const qty = Math.max(1, Math.min(MAX_BANNER_QUANTITY, quantity));
  if (qty <= 3) {
    return BANNER_BASE_PRICE;
  }
  const extraBanners = qty - 3;
  return BANNER_BASE_PRICE + extraBanners * BANNER_EXTRA_UNIT_PRICE;
}

export const BANNER_PACKAGES: BannerPackageRule[] = [
  {
    quantity: 1,
    title: 'Banner Destaque Individual',
    monthlyPrice: 199.00,
    description: '1 Banner rotativo com link direto para sua loja ou produto em categoria específica.',
    features: [
      '1 Banner rotativo de alta resolução',
      'Exibição na categoria da loja',
      'Link direto para WhatsApp e Loja',
      'Relatório de cliques mensais'
    ]
  },
  {
    quantity: 2,
    title: 'Duo Banners de Destaque',
    monthlyPrice: 199.00,
    description: '2 Banners para divulgar produtos diferentes ou promoções sazonais.',
    features: [
      '2 Banners com artes e links independentes',
      'Exibição no Carrossel da Categoria e Vitrines',
      'Link direto para produtos específicos',
      'Troca mensal de arte gratuita'
    ]
  },
  {
    quantity: 3,
    title: 'Trio Banners - Pacote Start Base',
    monthlyPrice: 199.00,
    recommended: true,
    description: 'Pacote padrão com o melhor custo-benefício (R$ 199,00 para até 3 banners).',
    features: [
      'Até 3 Banners de alto impacto',
      'Exibição no Carrossel Principal da Home e Categorias',
      'Máxima rotação e visibilidade',
      'Selo "Loja em Destaque"'
    ]
  },
  {
    quantity: 4,
    title: 'Pacote 4 Banners (+1 Adicional)',
    monthlyPrice: 248.00, // 199 + 49
    description: '3 Banners Base + 1 Banner adicional para expansão comercial.',
    features: [
      '4 Banners simultâneos na plataforma',
      'Destaque no topo da Home e em até 2 Categorias',
      'Prioridade na fila de exibição',
      'Suporte VIP para otimização de imagens'
    ]
  },
  {
    quantity: 5,
    title: 'Pacote 5 Banners (+2 Adicionais)',
    monthlyPrice: 297.00, // 199 + (2 * 49)
    description: '3 Banners Base + 2 Banners adicionais para forte presença de marca.',
    features: [
      '5 Banners em rotação contínua',
      'Presença massiva na Home, Categorias e Páginas de busca',
      'Badge de Parceiro Ouro nos banners',
      'Estatísticas avançadas de conversão'
    ]
  },
  {
    quantity: 6,
    title: 'Pacote Supremo VIP (6 Banners - Limite Máximo)',
    monthlyPrice: 346.00, // 199 + (3 * 49)
    recommended: true,
    description: 'Teto máximo de 6 banners permitidos por lojista na plataforma.',
    features: [
      '6 Banners simultâneos (Teto Máximo Permitido)',
      'Destaque permanente em todos os canais de tráfego',
      'Posicionamento prioritário número 1 no carrossel',
      'Consultoria de tráfego e divulgação nas redes da plataforma'
    ]
  }
];

export const MEMBERSHIP_PLANS: Record<MembershipTier, PlanBenefitRule> = {
  GRATIS: {
    tier: 'GRATIS',
    name: 'Plano Grátis (Start)',
    title: 'Plano Grátis (Start)',
    badgeLabel: '🌱 Grátis (Start)',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxProducts: 1, // 1 produto inicial (após 3 meses: 5 produtos)
    commissionRate: 12, // Sem comissão nos 3 primeiros meses, após 12%
    buyerDataReleasePolicy: 'AFTER_COMMISSION_CONFIRMATION',
    buyerDataRule: 'Liberação após confirmação de taxa',
    description: 'Comece com 1 produto sem mensalidade e sem comissão nos primeiros 3 meses. Após 3 meses: comissão de 12% e limite de até 5 produtos.',
    highlights: [
      '1 produto cadastrado (após 3 meses: até 5 produtos)',
      'Sem comissão de vendas nos primeiros 3 meses (0%)',
      'Após 3 meses: comissão de 12% por venda realizada',
      'R$ 0,00 de mensalidade fixa',
      'Proteção e custódia de dados do comprador pela plataforma',
      'Vitrine básica no catálogo e busca local'
    ],
    color: 'emerald',
    badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    badgeTextColor: 'text-emerald-700'
  },
  BRONZE: {
    tier: 'BRONZE',
    name: 'Plano Bronze',
    title: 'Plano Bronze',
    badgeLabel: '🥉 Bronze',
    monthlyPrice: 19.90,
    yearlyPrice: 199.00,
    maxProducts: 10,
    commissionRate: 10, // Sem comissão por 3 meses, após 10%
    buyerDataReleasePolicy: 'AFTER_STOCK_CONFIRMATION',
    buyerDataRule: 'Liberação rápida pós confirmação de estoque',
    description: 'R$ 19,90/mês. 10 produtos, sem comissão por 3 meses (após 10% de comissão). Inclui vantagens de marketing digital agressivo.',
    highlights: [
      'Até 10 produtos ou serviços cadastrados',
      'R$ 19,90/mês • Sem comissão por 3 meses (após 10%)',
      'Marketing digital agressivo para lojistas',
      'Aberto a clientes de todo o município e fora do município',
      'Destaques em postagens para os ranqueados (mais consultados)',
      'Selo Bronze Verificado no catálogo oficial'
    ],
    color: 'amber',
    badgeBg: 'bg-amber-100 border-amber-300 text-amber-900',
    badgeTextColor: 'text-amber-700'
  },
  PRATA: {
    tier: 'PRATA',
    name: 'Plano Prata',
    title: 'Plano Prata',
    badgeLabel: '🥈 Prata',
    monthlyPrice: 59.90,
    yearlyPrice: 590.00,
    maxProducts: 20,
    commissionRate: 8, // Sem comissão por 3 meses, após 8%
    buyerDataReleasePolicy: 'IMMEDIATE',
    buyerDataRule: 'Liberação imediata',
    description: 'R$ 59,90/mês. 20 produtos, sem comissão por 3 meses (após 8% de comissão). Marketing agressivo e presença regional.',
    highlights: [
      'Até 20 produtos ou serviços cadastrados',
      'R$ 59,90/mês • Sem comissão por 3 meses (após 8%)',
      'Marketing digital agressivo multiplataforma',
      'Aberto a clientes de todo o município e fora do município',
      'Destaques em postagens para os ranqueados (mais consultados)',
      'Liberação imediata dos dados do comprador'
    ],
    color: 'slate',
    badgeBg: 'bg-slate-200 border-slate-400 text-slate-900',
    badgeTextColor: 'text-slate-700'
  },
  OURO: {
    tier: 'OURO',
    name: 'Plano Ouro',
    title: 'Plano Ouro',
    badgeLabel: '🥇 Ouro',
    monthlyPrice: 49.90,
    yearlyPrice: 490.00,
    maxProducts: 50,
    commissionRate: 6, // Sem comissão por 3 meses, após 6%
    buyerDataReleasePolicy: 'REAL_TIME_VIP',
    buyerDataRule: 'Liberação em tempo real VIP',
    description: 'R$ 49,90/mês. 50 produtos, sem comissão por 3 meses (após 6% de comissão). Alta visibilidade e alcance estendido.',
    highlights: [
      'Até 50 produtos ou serviços cadastrados',
      'R$ 49,90/mês • Sem comissão por 3 meses (após 6%)',
      'Marketing digital agressivo com prioridade nas vitrines',
      'Aberto a clientes de todo o município e fora do município',
      'Destaques prioritários em postagens para os ranqueados (mais consultados)',
      'Liberação em tempo real VIP com WhatsApp direto'
    ],
    color: 'yellow',
    badgeBg: 'bg-yellow-100 border-yellow-400 text-yellow-950',
    badgeTextColor: 'text-yellow-700'
  },
  PREMIUM: {
    tier: 'PREMIUM',
    name: 'Plano Premium',
    title: 'Plano Premium',
    badgeLabel: '💎 Premium VIP',
    monthlyPrice: 199.90,
    yearlyPrice: 1990.00,
    maxProducts: 100,
    commissionRate: 5, // Sem comissão por 3 meses, após 5%
    buyerDataReleasePolicy: 'REAL_TIME_VIP',
    buyerDataRule: 'Liberação instantânea VIP',
    description: 'R$ 199,90/mês. 100 produtos, sem comissão por 3 meses (após 5% de comissão). Máxima visibilidade e vantagens completas.',
    highlights: [
      'Até 100 produtos ou serviços cadastrados',
      'R$ 199,90/mês • Sem comissão por 3 meses (após 5%)',
      'Marketing digital agressivo de alta escala e conversão',
      'Aberto a clientes de todo o município e fora do município',
      'Super destaques em postagens para os ranqueados (mais consultados)',
      'Super destaque nas vitrines principais e suporte prioritário'
    ],
    color: 'purple',
    badgeBg: 'bg-purple-100 border-purple-300 text-purple-900',
    badgeTextColor: 'text-purple-700'
  },
  MASTER: {
    tier: 'MASTER',
    name: 'Plano Master',
    title: 'Plano Master',
    badgeLabel: '👑 Master Total',
    monthlyPrice: 599.90,
    yearlyPrice: 5990.00,
    maxProducts: 99999, // Ilimitado
    commissionRate: 0, // 0% SEM COMISSÃO PERMANENTE
    buyerDataReleasePolicy: 'REAL_TIME_VIP',
    buyerDataRule: 'Liberação instantânea VIP + Todos os Serviços',
    description: 'R$ 599,90/mês SEM COMISSÃO (0% permanente). Produtos ilimitados e plano de marketing embutido com todos os serviços de marketing digital para lojistas.',
    highlights: [
      'SEM COMISSÃO DE VENDAS (0% Taxa Zero permanente)',
      'Produtos e serviços 100% ILIMITADOS',
      'Aberto a clientes de todo o município e fora do município',
      'Destaque máximo e topo fixo em postagens e ranqueados',
      'Gestão de Tráfego Pago no Meta Ads (Campanhas patrocinadas Instagram e Facebook)',
      'Gestão de Anúncios no Google Ads e Google Meu Negócio / Maps',
      'Produção de fotos, vídeos e criativos promocionais profissionais da loja',
      'Otimização completa de SEO local e palavras-chave de busca',
      'Disparo de comunicados e notificações Push direcionadas aos clientes',
      'Banners rotativos de topo inclusos na plataforma',
      'Consultoria estratégica de copywriting e pós-venda automatizado',
      'Relatórios semanais detalhados de performance, cliques e ROI comercial'
    ],
    color: 'indigo',
    badgeBg: 'bg-indigo-100 border-indigo-400 text-indigo-950',
    badgeTextColor: 'text-indigo-800'
  }
};

export const MEMBERSHIP_PLANS_LIST: PlanBenefitRule[] = Object.values(MEMBERSHIP_PLANS);

export function getPlanByTier(tier?: MembershipTier): PlanBenefitRule {
  if (!tier || !MEMBERSHIP_PLANS[tier]) {
    return MEMBERSHIP_PLANS.GRATIS;
  }
  return MEMBERSHIP_PLANS[tier];
}

export function getMaxProductsForTier(tier?: MembershipTier): number {
  return getPlanByTier(tier).maxProducts;
}

export function getCommissionRateForTier(tier?: MembershipTier): number {
  return getPlanByTier(tier).commissionRate;
}

export function getPlanBadgeStyle(tier?: MembershipTier): {
  badgeBg: string;
  badgeText: string;
  label: string;
  isUnlimited: boolean;
} {
  const plan = getPlanByTier(tier);
  return {
    badgeBg: plan.badgeBg,
    badgeText: plan.badgeTextColor,
    label: plan.badgeLabel,
    isUnlimited: plan.maxProducts > 1000
  };
}
