import {
  InterCategoryBanner,
  AdSpace,
  FrontendCustomization,
  Product
} from '../types';

export const INITIAL_FRONTEND_CONFIG: FrontendCustomization = {
  siteTitle: 'Achei Aqui',
  siteSubtitle: 'Marketplace Local de Cachoeiras de Macacu',
  logoLetter: 'A',
  topAnnouncementText: '🎉 Compre do comércio de Cachoeiras! Entrega expressa com motoboy ou retirada sem filas com código.',
  topAnnouncementActive: true,
  topAnnouncementLink: '',
  headerCtaText: 'Quero Vender na Loja',
  headerCtaLink: 'register-merchant',
  
  navMenuItems: [
    { id: 'menu-1', label: 'Início', target: 'home', isVisible: true, order: 1 },
    { id: 'menu-lojas', label: 'LOJAS', target: 'lojas', isVisible: true, badge: 'Destaque #1', order: 2 },
    { id: 'menu-prod', label: 'PRODUTOS', target: 'produtos', isVisible: true, badge: 'Ofertas', order: 3 },
    { id: 'menu-serv', label: 'PRESTADORES DE SERVIÇOS', target: 'servicos', isVisible: true, badge: 'Verificados', order: 4 },
    { id: 'menu-cons', label: 'CONSULTÓRIOS', target: 'consultorios', isVisible: true, badge: 'Saúde', order: 5 },
    { id: 'menu-gast', label: 'GASTRONOMIA', target: 'gastronomia', isVisible: true, badge: 'Delivery', order: 6 },
    { id: 'menu-bel', label: 'BELEZA & ESTÉTICA', target: 'beleza', isVisible: true, badge: 'Agendamentos', order: 7 },
    { id: 'menu-auto', label: 'VEÍCULOS & AUTO', target: 'veiculos', isVisible: true, order: 8 },
    { id: 'menu-pet', label: 'PET SHOP & AGRO', target: 'pet-agro', isVisible: true, order: 9 },
    { id: 'menu-edu', label: 'EDUCAÇÃO & CURSOS', target: 'educacao', isVisible: true, order: 10 },
    { id: 'menu-imo', label: 'IMÓVEIS & LOCAÇÕES', target: 'imoveis', isVisible: true, order: 11 },
    { id: 'menu-ad', label: 'Espaços Publicitários', target: 'ad-spaces', isVisible: true, badge: 'Anuncie Aqui', order: 12 }
  ],
  
  categoryProductsLimit: 24,
  categoryBlockSize: 4,
  enabledCategoryIds: ['lojas', 'produtos', 'servicos', 'consultorios', 'gastronomia', 'beleza', 'veiculos', 'pet-agro', 'educacao', 'imoveis'],
  categoryOrder: ['lojas', 'produtos', 'servicos', 'consultorios', 'gastronomia', 'beleza', 'veiculos', 'pet-agro', 'educacao', 'imoveis'],
  enableInterCategoryBanners: true,
  
  merchantPostingPolicy: 'FREE',
  maxProductsPerMerchant: 60,
  allowMerchantHighlightAuction: true,
  
  footerAboutText: 'Achei Aqui é o shopping digital de Cachoeiras de Macacu - RJ. Conectamos os melhores comércios, lojas de roupas, pizzarias, salões e prestadores locais diretamente aos moradores da nossa cidade com total segurança.',
  footerSupportPhone: '(21) 2649-1020',
  footerSupportEmail: 'suporte@acheiaquimacacu.com.br',
  footerSupportWhatsApp: '(21) 99999-8877',
  footerAddress: 'Av. Governador Roberto Silveira, 100 - Centro, Cachoeiras de Macacu - RJ',
  footerCopyrightText: '© 2026 Achei Aqui Marketplace Local. Todos os direitos reservados. Desenvolvido para o comércio de Cachoeiras de Macacu.',
  footerSocialInstagram: 'https://instagram.com/acheiaquimacacu',
  footerSocialFacebook: 'https://facebook.com/acheiaquimacacu',
  footerSocialWhatsApp: 'https://wa.me/5521999998877',
  footerCol1Title: 'Comprar no Comércio',
  footerCol2Title: 'Área do Comerciante',
  footerCol3Title: 'Atendimento & Suporte'
};

export const INITIAL_INTER_CATEGORY_BANNERS: InterCategoryBanner[] = [
  {
    id: 'banner-inter-1',
    title: 'Destaque Especial Gastronomia & Delivery de Cachoeiras',
    targetCategoryAfter: 'gastronomia',
    autoplayIntervalSeconds: 4,
    status: 'active',
    sponsorMerchantId: 'store-2',
    sponsorMerchantName: 'Pizzaria & Forno à Lenha Imperial',
    adSpaceId: 'ad-space-1',
    createdAt: '2026-02-20',
    slides: [
      {
        id: 'slide-1-1',
        title: 'Pizzas Artesanais Assadas no Forno a Lenha',
        subtitle: 'Massa com fermentação natural de 48h, ingredientes nobres e entrega rápida em toda Cachoeiras.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Pedir com Desconto',
        badge: 'PATROCINADO • PIZZARIA IMPERIAL',
        linkUrl: 'gastronomia',
        merchantId: 'store-2',
        merchantName: 'Pizzaria Imperial',
        accentColor: 'from-amber-950 via-slate-900 to-red-950'
      },
      {
        id: 'slide-1-2',
        title: 'Festival de Hambúrgueres & Combos da Noite',
        subtitle: 'Bacon artesanal defumado, queijo cheddar cremoso e batatas crocantes temperadas com alecrim.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Ver Cardápio Completo',
        badge: 'ENTREGA EXPRESSA',
        linkUrl: 'gastronomia',
        merchantId: 'store-2',
        merchantName: 'Pizzaria Imperial',
        accentColor: 'from-orange-950 via-slate-900 to-amber-950'
      },
      {
        id: 'slide-1-3',
        title: 'Sobremesas Gourmet & Petit Gateau Quente',
        subtitle: 'Adoce seu dia com os doces mais elogiados da região feitos pelos confeiteiros locais.',
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Explorar Sobremesas',
        badge: 'OFERTA DO DIA',
        linkUrl: 'gastronomia',
        merchantId: 'store-2',
        merchantName: 'Pizzaria Imperial',
        accentColor: 'from-red-950 via-slate-900 to-rose-950'
      }
    ]
  },
  {
    id: 'banner-inter-2',
    title: 'Espaço Moda & Boutiques de Papucaia e Centro',
    targetCategoryAfter: 'moda',
    autoplayIntervalSeconds: 4,
    status: 'active',
    sponsorMerchantId: 'store-4',
    sponsorMerchantName: 'Donna Elegance Boutique',
    adSpaceId: 'ad-space-2',
    createdAt: '2026-02-22',
    slides: [
      {
        id: 'slide-2-1',
        title: 'Coleção Elegance 2026: Vestidos em Linho Puro',
        subtitle: 'Cortes exclusivos com caimento fluido para eventos sociais e lazer sofisticado.',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Ver Coleção Feminina',
        badge: 'PATROCINADO • DONNA ELEGANCE',
        linkUrl: 'moda',
        merchantId: 'store-4',
        merchantName: 'Donna Elegance Boutique',
        accentColor: 'from-purple-950 via-slate-900 to-pink-950'
      },
      {
        id: 'slide-2-2',
        title: 'Experimente na Loja com Provador VIP Reservado',
        subtitle: 'Escolha suas peças online e garanta sua cabine exclusiva sem filas e sem compromisso de compra.',
        imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Agendar Provador',
        badge: 'EXPERIÊNCIA EXCLUSIVA',
        linkUrl: 'moda',
        merchantId: 'store-4',
        merchantName: 'Donna Elegance Boutique',
        accentColor: 'from-indigo-950 via-slate-900 to-purple-950'
      },
      {
        id: 'slide-2-3',
        title: 'Calçados & Acessórios em Couro Legítimo Nobuck',
        subtitle: 'Sandálias confortáveis, bolsas elegantes e cintos de alta durabilidade com garantia da loja.',
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Ver Calçados',
        badge: 'FRETE GRÁTIS PAPUCAIA',
        linkUrl: 'moda',
        merchantId: 'store-4',
        merchantName: 'Donna Elegance Boutique',
        accentColor: 'from-rose-950 via-slate-900 to-slate-950'
      }
    ]
  },
  {
    id: 'banner-inter-3',
    title: 'Tecnologia, Celulares & Acessórios Homologados',
    targetCategoryAfter: 'eletronicos',
    autoplayIntervalSeconds: 4,
    status: 'active',
    sponsorMerchantId: 'store-5',
    sponsorMerchantName: 'Tech Solutions Macacu',
    adSpaceId: 'ad-space-3',
    createdAt: '2026-02-23',
    slides: [
      {
        id: 'slide-3-1',
        title: 'Assistência Técnica de iPhone e Android no Centro',
        subtitle: 'Troca de tela e baterias com peças originais e garantia expressa de 6 meses.',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Solicitar Orçamento',
        badge: 'PATROCINADO • TECH SOLUTIONS',
        linkUrl: 'eletronicos',
        merchantId: 'store-5',
        merchantName: 'Tech Solutions & Assistência',
        accentColor: 'from-blue-950 via-slate-900 to-cyan-950'
      },
      {
        id: 'slide-3-2',
        title: 'Fones Bluetooth com Cancelamento Ativo de Ruído',
        subtitle: 'Bateria para mais de 30 horas, som Hi-Res e graves profundos para seu dia a dia.',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Conferir Modelos',
        badge: 'PRONTA ENTREGA EM MACACU',
        linkUrl: 'eletronicos',
        merchantId: 'store-5',
        merchantName: 'Tech Solutions & Assistência',
        accentColor: 'from-slate-950 via-blue-950 to-slate-900'
      },
      {
        id: 'slide-3-3',
        title: 'Carregadores Turbo USB-C & Cabos Blindados',
        subtitle: 'Carregamento seguro para seu smartphone com homologação Anatel e proteção contra picos de energia.',
        imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Comprar Acessórios',
        badge: 'RETIRADA EM 15 MIN',
        linkUrl: 'eletronicos',
        merchantId: 'store-5',
        merchantName: 'Tech Solutions & Assistência',
        accentColor: 'from-cyan-950 via-slate-900 to-blue-950'
      }
    ]
  },
  {
    id: 'banner-inter-4',
    title: 'Flores, Buquês e Presentes Especiais',
    targetCategoryAfter: 'flores',
    autoplayIntervalSeconds: 4,
    status: 'active',
    sponsorMerchantId: 'store-1',
    sponsorMerchantName: 'Boutique das Flores Macacu',
    adSpaceId: 'ad-space-4',
    createdAt: '2026-02-24',
    slides: [
      {
        id: 'slide-4-1',
        title: 'Buquês de Rosas Selecionadas & Orquídeas Nobres',
        subtitle: 'Flores frescas colhidas na região serrana com arranjos artesanais feitos com carinho.',
        imageUrl: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Encomendar Buquê',
        badge: 'PATROCINADO • BOUTIQUE DAS FLORES',
        linkUrl: 'flores',
        merchantId: 'store-1',
        merchantName: 'Boutique das Flores Macacu',
        accentColor: 'from-emerald-950 via-slate-900 to-teal-950'
      },
      {
        id: 'slide-4-2',
        title: 'Cestas de Café da Manhã com Pães Artesanais',
        subtitle: 'Entregamos cedinho na porta da pessoa amada com cartão personalizado feito à mão.',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Montar Cesta Personalizada',
        badge: 'ENTREGA AGENDADA',
        linkUrl: 'flores',
        merchantId: 'store-1',
        merchantName: 'Boutique das Flores Macacu',
        accentColor: 'from-amber-950 via-slate-900 to-emerald-950'
      },
      {
        id: 'slide-4-3',
        title: 'Plantas Ornamentais & Cachepôs de Cerâmica',
        subtitle: 'Traga a natureza para o seu lar com folhagens purificadoras de ar e fácil cultivo.',
        imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200&auto=format&fit=crop&q=80',
        actionText: 'Ver Plantas',
        badge: 'DECORAÇÃO & BEM-ESTAR',
        linkUrl: 'flores',
        merchantId: 'store-1',
        merchantName: 'Boutique das Flores Macacu',
        accentColor: 'from-teal-950 via-slate-900 to-green-950'
      }
    ]
  }
];

export const INITIAL_AD_SPACES: AdSpace[] = [
  {
    id: 'ad-space-1',
    name: 'Super Banner Inter-Categorias #1 (Entre Gastronomia e Moda)',
    locationDescription: 'Largura total entre as vitrines de Gastronomia e Moda (Carrossel com 3 imagens automáticas)',
    type: 'INTER_CATEGORY',
    dimensions: '1200x380 Full-Width Carrossel',
    commercialType: 'AUCTION',
    status: 'IN_AUCTION',
    minimumBid: 350.00,
    currentHighestBid: 480.00,
    currentWinnerMerchantId: 'store-2',
    currentWinnerMerchantName: 'Pizzaria & Forno à Lenha Imperial',
    auctionEndDate: '2026-09-05',
    linkedBannerId: 'banner-inter-1',
    activeMerchantId: 'store-2',
    activeMerchantName: 'Pizzaria & Forno à Lenha Imperial',
    impressionsCount: 14200,
    clicksCount: 1180,
    revenueTotal: 1440.00,
    bids: [
      {
        id: 'bid-1',
        merchantId: 'store-2',
        merchantName: 'Pizzaria Imperial',
        bidAmount: 480.00,
        timestamp: '2026-02-26 14:30',
        status: 'HIGHEST',
        notes: 'Lance para veiculação de destaque no fim de semana e feriado.'
      },
      {
        id: 'bid-2',
        merchantId: 'store-5',
        merchantName: 'Tech Solutions',
        bidAmount: 420.00,
        timestamp: '2026-02-25 18:10',
        status: 'OUTBID'
      },
      {
        id: 'bid-3',
        merchantId: 'store-4',
        merchantName: 'Donna Elegance',
        bidAmount: 370.00,
        timestamp: '2026-02-24 10:00',
        status: 'OUTBID'
      }
    ]
  },
  {
    id: 'ad-space-2',
    name: 'Banner Full-Width Inter-Categorias #2 (Entre Moda e Tech)',
    locationDescription: 'Largura total entre as vitrines de Moda e Celulares & Tech',
    type: 'INTER_CATEGORY',
    dimensions: '1200x380 Full-Width Carrossel',
    commercialType: 'DIRECT_SALE',
    status: 'SOLD',
    fixedPricePerWeek: 150.00,
    fixedPricePerMonth: 500.00,
    linkedBannerId: 'banner-inter-2',
    activeMerchantId: 'store-4',
    activeMerchantName: 'Donna Elegance Boutique',
    impressionsCount: 11950,
    clicksCount: 940,
    revenueTotal: 1500.00
  },
  {
    id: 'ad-space-3',
    name: 'Banner Hero de Topo Principal #1',
    locationDescription: 'Primeira posição de visualização da Home do Marketplace (topo nobre)',
    type: 'HERO_TOP',
    dimensions: '1200x300 Hero Slider',
    commercialType: 'AUCTION',
    status: 'IN_AUCTION',
    minimumBid: 500.00,
    currentHighestBid: 620.00,
    currentWinnerMerchantId: 'store-4',
    currentWinnerMerchantName: 'Donna Elegance Boutique',
    auctionEndDate: '2026-09-01',
    impressionsCount: 28400,
    clicksCount: 2650,
    revenueTotal: 2480.00,
    bids: [
      {
        id: 'bid-4',
        merchantId: 'store-4',
        merchantName: 'Donna Elegance',
        bidAmount: 620.00,
        timestamp: '2026-02-27 08:20',
        status: 'HIGHEST'
      },
      {
        id: 'bid-5',
        merchantId: 'store-1',
        merchantName: 'Boutique das Flores',
        bidAmount: 550.00,
        timestamp: '2026-02-26 19:40',
        status: 'OUTBID'
      }
    ]
  },
  {
    id: 'ad-space-4',
    name: 'Banner Faixa Nobre Pré-Rodapé',
    locationDescription: 'Banner horizontal antes da seção de rodapé da plataforma',
    type: 'FOOTER_BANNER',
    dimensions: '1200x220 Banner Horizontal',
    commercialType: 'DIRECT_SALE',
    status: 'AVAILABLE',
    fixedPricePerWeek: 80.00,
    fixedPricePerMonth: 280.00,
    impressionsCount: 8200,
    clicksCount: 410,
    revenueTotal: 560.00
  },
  {
    id: 'ad-space-5',
    name: 'Patrocínio de Categoria Ouro: Gastronomia',
    locationDescription: 'Badge de destaque e fixação no topo da categoria Gastronomia',
    type: 'CATEGORY_SPONSOR',
    dimensions: 'Card Destaque Fixado',
    commercialType: 'AUCTION',
    status: 'AVAILABLE',
    minimumBid: 200.00,
    auctionEndDate: '2026-09-10',
    impressionsCount: 6500,
    clicksCount: 520,
    revenueTotal: 600.00,
    bids: []
  }
];

// Empty in production clean state
export const GENERATED_EXTRA_PRODUCTS: Product[] = [];
