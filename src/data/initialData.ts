import {
  User,
  StoreMerchant,
  Product,
  ServiceItem,
  Order,
  Category,
  Banner,
  AuditLog,
  InterCategoryBanner,
  AdSpace,
  FrontendCustomization,
  DeliveryDriver,
  DeliveryRide
} from '../types';
import {
  INITIAL_FRONTEND_CONFIG,
  INITIAL_INTER_CATEGORY_BANNERS,
  INITIAL_AD_SPACES,
  GENERATED_EXTRA_PRODUCTS
} from './initialFrontendData';

export {
  INITIAL_FRONTEND_CONFIG,
  INITIAL_INTER_CATEGORY_BANNERS,
  INITIAL_AD_SPACES
};


export const INITIAL_USERS: User[] = [
  {
    id: 'user-master-david',
    name: 'David Telecom (Master)',
    email: 'telecom.david@gmail.com',
    phone: '(21) 99999-8877',
    role: 'MASTER',
    password: 'telecom2026!',
    city: 'Cachoeiras de Macacu, RJ',
    isEmailVerified: true,
    needsPasswordChange: false,
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01'
  },
  {
    id: 'user-master-1',
    name: 'Admin Supremo Achei Aqui',
    email: 'admin@acheiaqui.com.br',
    phone: '(21) 99999-0000',
    role: 'MASTER',
    password: 'admin123',
    city: 'Cachoeiras de Macacu, RJ',
    isEmailVerified: true,
    twoFactorEnabled: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-12-01'
  },
  {
    id: 'user-entregador-marcos',
    name: 'Marcos Vinicius (Entregador)',
    email: 'entregador@acheiaqui.com.br',
    phone: '(21) 98877-6655',
    role: 'ENTREGADOR',
    password: 'entregador123!',
    city: 'Cachoeiras de Macacu, RJ',
    address: 'Rua Castália, 140',
    neighborhood: 'Castália',
    isEmailVerified: true,
    twoFactorEnabled: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-01'
  }
];

export const INITIAL_SYSTEM_SETTINGS = {
  maintenanceMode: false,
  systemBroadcastAlert: 'Plataforma Achei Aqui 100% operacional em Cachoeiras de Macacu - RJ',
  broadcastAlertActive: false,
  globalCommissionRate: 5,
  allowNewRegistrations: true,
  autoApproveMerchants: false,
  defaultDeliveryFeeMacacu: 8.00,
  vipTrialMaxDays: 2,
  vipTrialSecurityDepositRequired: false,
  enableFloatingNotificationBall: true,
  deliveryRatePerKm: 1.00, // VALOR_POR_KM (R$ 1,00 para o Entregador)
  deliveryPlatformFee: 2.00, // TAXA_PLATAFORMA (R$ 2,00 por solicitação)
  deliveryMaxActiveRidesPerDriver: 1
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-prod-init-001',
    userId: 'user-master-david',
    userEmail: 'telecom.david@gmail.com',
    userName: 'David Telecom',
    userRole: 'MASTER',
    action: 'SYSTEM_PRODUCTION_INIT',
    category: 'SYSTEM',
    severity: 'INFO',
    details: 'Base de dados oficial inicializada em produção limpa sem registros fictícios.',
    ipAddress: '177.18.240.12',
    device: 'Painel Master Supremo',
    timestamp: '2026-09-15 08:00:00',
    isoDate: '2026-09-15T08:00:00.000Z'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'TODAS AS CATEGORIAS', icon: 'Sparkles' },
  { id: 'lojas', name: 'LOJAS', icon: 'Store', badge: 'Destaque 1ª Opção', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&auto=format&fit=crop&q=80', description: 'Comércios locais, boutiques de roupas, calçados, móveis, materiais e papelarias em Cachoeiras.' },
  { id: 'produtos', name: 'PRODUTOS', icon: 'ShoppingBag', badge: 'Ofertas & Lançamentos', image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=200&auto=format&fit=crop&q=80', description: 'Catálogo geral de produtos locais com entrega expressa, retirada sem filas ou provador VIP.' },
  { id: 'servicos', name: 'PRESTADORES DE SERVIÇOS', icon: 'Wrench', badge: 'Verificados', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&auto=format&fit=crop&q=80', description: 'Eletricistas, encanadores, técnicos e profissionais autônomos com CPF e referências checadas.' },
  { id: 'consultorios', name: 'CONSULTÓRIOS', icon: 'Stethoscope', badge: 'Saúde & Bem-Estar', image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&auto=format&fit=crop&q=80', description: 'Consultórios odontológicos, dentistas, clínicas médicas, psicólogos, fisioterapia e exames.' },
  { id: 'gastronomia', name: 'GASTRONOMIA', icon: 'UtensilsCrossed', badge: 'Delivery Rápido', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80', description: 'Pizzas na lenha, hambúrgueres artesanais, lanches, marmitex caseiro e doces.' },
  { id: 'beleza', name: 'BELEZA & ESTÉTICA', icon: 'Scissors', badge: 'Agendamentos', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80', description: 'Salões de beleza, barbearias vintage, manicures, cílios e cuidados com o bem-estar.' },
  { id: 'veiculos', name: 'VEÍCULOS & AUTO', icon: 'Car', badge: 'Socorro 24h', image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80', description: 'Oficinas mecânicas, autopeças, baterias, lava-jato, borracharias e guinchos.' },
  { id: 'pet-agro', name: 'PET SHOP & AGRO', icon: 'PawPrint', badge: 'Mundo Animal', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&auto=format&fit=crop&q=80', description: 'Rações, banho e tosa, medicamentos veterinários e artigos agropecuários.' },
  { id: 'educacao', name: 'EDUCAÇÃO & CURSOS', icon: 'GraduationCap', badge: 'Cursos & Aulas', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&auto=format&fit=crop&q=80', description: 'Reforço escolar, cursos de idiomas, informática, autoescolas e aulas particulares.' },
  { id: 'imoveis', name: 'IMÓVEIS & LOCAÇÕES', icon: 'Home', badge: 'Temporada & Aluguel', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&auto=format&fit=crop&q=80', description: 'Casas, apartamentos para alugar, venda de terrenos, sítios e pousadas.' }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'Compre no Comércio de Cachoeiras',
    subtitle: 'Peça delivery com motoboy local ou retire na loja com código instantâneo sem filas.',
    badge: '100% LOCAL',
    imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSamDps2myzG8QwRu24BwdyMLSzrZINmJoIxjaciwTCWQ&s=10',
    bgColor: 'from-emerald-950 via-emerald-900 to-slate-900',
    actionText: 'Explorar Ofertas',
    categoryFilter: 'all'
  },
  {
    id: 'banner-2',
    title: 'Experimente na Loja antes de Comprar',
    subtitle: 'Reserve suas roupas e calçados favoritos com horário marcado no provador das boutiques.',
    badge: 'NOVIDADE EXCLUSIVA',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    bgColor: 'from-purple-950 via-slate-900 to-indigo-950',
    actionText: 'Ver Moda Local',
    categoryFilter: 'moda'
  },
  {
    id: 'banner-3',
    title: 'Agende Salões, Barbearias e Serviços',
    subtitle: 'Escolha o profissional, o horário ideal e receba confirmação automática em segundos.',
    badge: 'SEM ESPERA',
    imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
    bgColor: 'from-blue-950 via-slate-900 to-cyan-950',
    actionText: 'Agendar Horário',
    categoryFilter: 'beleza'
  }
];

export const INITIAL_MERCHANTS: StoreMerchant[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SERVICES: ServiceItem[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_DELIVERY_DRIVERS: DeliveryDriver[] = [
  {
    id: 'driver-marcos-moto',
    userId: 'user-entregador-marcos',
    name: 'Marcos Vinicius',
    cpf: '123.456.789-00',
    phone: '(21) 98877-6655',
    email: 'entregador@acheiaqui.com.br',
    address: 'Rua Castália, 140',
    city: 'Cachoeiras de Macacu, RJ',
    neighborhood: 'Castália',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    idDocument: 'RG 24.891.203-9 DIC-RJ',
    cnhNumber: '05928192841',
    cnhCategory: 'A',
    cnhValidity: '2028-08-15',
    vehicleType: 'MOTO',
    vehiclePlate: 'KXY-4920',
    vehicleModel: 'Honda CG 160 Fan',
    vehicleColor: 'Vermelha',
    vehicleDocument: 'CRLV-e 2026 emitido Detran-RJ',
    pixKey: '12345678900',
    pixKeyType: 'CPF',
    pixBank: 'Nubank (260)',
    termsAccepted: true,
    platformRulesAccepted: true,
    status: 'APROVADO',
    operationalStatus: 'ONLINE',
    rating: 4.9,
    totalDeliveries: 38,
    totalEarnings: 420.00,
    registeredAt: '2026-03-01 09:30:00',
    approvedAt: '2026-03-01 14:00:00',
    lastActiveAt: '2026-09-17 12:45:00',
    notes: 'Entregador de confiança verificado com documentação e antecedentes conferidos.'
  },
  {
    id: 'driver-lucas-carro',
    userId: 'user-driver-lucas',
    name: 'Lucas Pereira Silva',
    cpf: '987.654.321-11',
    phone: '(21) 97766-5544',
    email: 'lucas.entregador@gmail.com',
    address: 'Av. Governador Roberto Silveira, 800',
    city: 'Cachoeiras de Macacu, RJ',
    neighborhood: 'Centro',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    idDocument: 'RG 19.382.491-0 Detran-RJ',
    cnhNumber: '04829103948',
    cnhCategory: 'B',
    cnhValidity: '2027-11-20',
    vehicleType: 'CARRO',
    vehiclePlate: 'LRZ-8192',
    vehicleModel: 'Fiat Uno Mille Fire',
    vehicleColor: 'Prata',
    vehicleDocument: 'CRLV-e 2026 regularizado',
    pixKey: '21977665544',
    pixKeyType: 'CELULAR',
    pixBank: 'Banco Inter (077)',
    termsAccepted: true,
    platformRulesAccepted: true,
    status: 'EM_ANALISE',
    operationalStatus: 'OFFLINE',
    rating: 5.0,
    totalDeliveries: 0,
    totalEarnings: 0,
    registeredAt: '2026-09-16 16:20:00',
    notes: 'Documentos enviados. Aguardando conferência de CNH B e CRLV pela equipe Master.'
  }
];

export const INITIAL_DELIVERY_RIDES: DeliveryRide[] = [
  {
    id: 'ride-analysis-001',
    rideCode: 'DEL-51824',
    orderId: 'ord-analysis-001',
    orderCode: 'PED-8831',
    merchantId: 'merchant-demo-padaria',
    merchantName: 'Padaria & Confeitaria Pão de Ouro',
    merchantPhone: '(21) 99887-1122',
    originAddress: 'Av. Governador Roberto Silveira, 250 - Centro',
    originNeighborhood: 'Centro',
    origem: 'Av. Governador Roberto Silveira, 250 - Centro',
    customerId: 'cust-demo-juliana',
    customerName: 'Juliana Mendes Silveira',
    customerPhone: '(21) 98744-1290',
    destinationAddress: 'Rua Plínio Casado, 180 - Castália',
    destinationNeighborhood: 'Castália',
    destino: 'Rua Plínio Casado, 180 - Castália',
    distanceKm: 3.8,
    distancia: 3.8,
    tipo_veiculo: 'MOTO',
    vehicleType: 'MOTO',
    ratePerKmApplied: 1.00,
    platformFeeApplied: 2.00,
    driverEarnings: 3.80,
    valor_entregador: 3.80,
    totalDeliveryFee: 5.80,
    valor_calculado: 5.80,
    customerPaid: true,
    status: 'AGUARDANDO_ANALISE',
    confirmationCode: '3829',
    calculationTimestamp: '2026-09-21T15:20:00.000Z',
    data_solicitacao: '2026-09-21',
    hora_solicitacao: '15:20',
    createdAt: '2026-09-21 15:20:00',
    observacoes: 'Entregar no condomínio Village das Flores, Bloco B, Apto 204. Manter a caixa na horizontal (bolo confeitado e torta salgada).',
    history: [
      {
        timestamp: '2026-09-21 15:20:00',
        status: 'AGUARDANDO_ANALISE',
        description: 'Solicitação de entrega criada pelo lojista para o pedido PED-8831. Distância: 3.8 km. Aguardando análise operacional do Master.',
        actorName: 'Padaria & Confeitaria Pão de Ouro',
        actorRole: 'LOJISTA'
      }
    ]
  },
  {
    id: 'ride-analysis-002',
    rideCode: 'DEL-62941',
    orderId: 'ord-analysis-002',
    orderCode: 'PED-9104',
    merchantId: 'merchant-demo-farmacia',
    merchantName: 'Drogaria Macacu Saúde',
    merchantPhone: '(21) 99887-3344',
    originAddress: 'Praça Manuel de Portugal, 45 - Centro',
    originNeighborhood: 'Centro',
    origem: 'Praça Manuel de Portugal, 45 - Centro',
    customerId: 'cust-demo-ricardo',
    customerName: 'Ricardo Alencar Pinheiro',
    customerPhone: '(21) 98112-9900',
    destinationAddress: 'Estrada Cachoeiras-Friburgo, Km 4 - Papucaia',
    destinationNeighborhood: 'Papucaia',
    destino: 'Estrada Cachoeiras-Friburgo, Km 4 - Papucaia',
    distanceKm: 12.4,
    distancia: 12.4,
    tipo_veiculo: 'CARRO',
    vehicleType: 'CARRO',
    ratePerKmApplied: 1.00,
    platformFeeApplied: 2.00,
    driverEarnings: 12.40,
    valor_entregador: 12.40,
    totalDeliveryFee: 14.40,
    valor_calculado: 14.40,
    customerPaid: true,
    status: 'AGUARDANDO_ANALISE',
    confirmationCode: '8415',
    calculationTimestamp: '2026-09-21T16:05:00.000Z',
    data_solicitacao: '2026-09-21',
    hora_solicitacao: '16:05',
    createdAt: '2026-09-21 16:05:00',
    observacoes: 'Medicamentos de uso contínuo e frascos de xarope. Cuidado com impacto. Ligar 5 minutos antes ao aproximar da entrada principal do sítio.',
    history: [
      {
        timestamp: '2026-09-21 16:05:00',
        status: 'AGUARDANDO_ANALISE',
        description: 'Solicitação de entrega criada pela Drogaria Macacu Saúde para o pedido PED-9104. Distância calculada: 12.4 km. Tipo: Carro.',
        actorName: 'Drogaria Macacu Saúde',
        actorRole: 'LOJISTA'
      }
    ]
  },
  {
    id: 'ride-analysis-003',
    rideCode: 'DEL-77018',
    orderId: 'ord-analysis-003',
    orderCode: 'PED-9482',
    merchantId: 'merchant-demo-boutique',
    merchantName: 'Boutique & Moda Carioca',
    merchantPhone: '(21) 98855-4433',
    originAddress: 'Rua Dr. Ademar de Barros, 112 - Centro',
    originNeighborhood: 'Centro',
    origem: 'Rua Dr. Ademar de Barros, 112 - Centro',
    customerId: 'cust-demo-camila',
    customerName: 'Camila Vasconcelos',
    customerPhone: '(21) 99341-7788',
    destinationAddress: 'Rua da Matriz, 78 - Japuíba',
    destinationNeighborhood: 'Japuíba',
    destino: 'Rua da Matriz, 78 - Japuíba',
    distanceKm: 6.5,
    distancia: 6.5,
    tipo_veiculo: 'MOTO',
    vehicleType: 'MOTO',
    ratePerKmApplied: 1.00,
    platformFeeApplied: 2.00,
    driverEarnings: 6.50,
    valor_entregador: 6.50,
    totalDeliveryFee: 8.50,
    valor_calculado: 8.50,
    customerPaid: true,
    status: 'AGUARDANDO_ANALISE',
    confirmationCode: '1924',
    calculationTimestamp: '2026-09-21T16:40:00.000Z',
    data_solicitacao: '2026-09-21',
    hora_solicitacao: '16:40',
    createdAt: '2026-09-21 16:40:00',
    observacoes: 'Pacote de provador VIP com 3 peças de vestuário em cabide e capa protetora. Entregar diretamente à cliente.',
    history: [
      {
        timestamp: '2026-09-21 16:40:00',
        status: 'AGUARDANDO_ANALISE',
        description: 'Solicitação de entrega criada pela Boutique Carioca para o pedido PED-9482. Distância: 6.5 km.',
        actorName: 'Boutique Carioca',
        actorRole: 'LOJISTA'
      }
    ]
  },
  {
    id: 'ride-demo-001',
    rideCode: 'DEL-48192',
    orderId: 'ord-demo-001',
    orderCode: 'DEL-8X42K9',
    merchantId: 'merchant-demo-padaria',
    merchantName: 'Padaria & Confeitaria Pão de Ouro',
    merchantPhone: '(21) 99887-1122',
    originAddress: 'Av. Governador Roberto Silveira, 250 - Centro',
    originNeighborhood: 'Centro',
    customerId: 'cust-demo-marina',
    customerName: 'Marina Ferreira',
    customerPhone: '(21) 98765-4321',
    destinationAddress: 'Rua Castália, 450 - Castália',
    destinationNeighborhood: 'Castália',
    distanceKm: 4.2,
    ratePerKmApplied: 1.00,
    platformFeeApplied: 2.00,
    driverEarnings: 4.20,
    totalDeliveryFee: 6.20,
    customerPaid: true,
    status: 'AGUARDANDO_ENTREGADOR',
    confirmationCode: '7412',
    calculationTimestamp: '2026-09-17T12:30:00.000Z',
    createdAt: '2026-09-17 12:30:00',
    history: [
      {
        timestamp: '2026-09-17 12:30:00',
        status: 'CRIADA',
        description: 'Venda finalizada pela Padaria Pão de Ouro. Solicitação de delivery gerada.',
        actorName: 'Padaria Pão de Ouro',
        actorRole: 'LOJISTA'
      },
      {
        timestamp: '2026-09-17 12:30:05',
        status: 'AGUARDANDO_ENTREGADOR',
        description: 'Corrida disponível no radar para entregadores online em Cachoeiras de Macacu.',
        actorName: 'Sistema Achei Aqui',
        actorRole: 'SISTEMA'
      }
    ]
  },
  {
    id: 'ride-demo-002',
    rideCode: 'DEL-39104',
    orderId: 'ord-demo-002',
    orderCode: 'DEL-2A88K1',
    merchantId: 'merchant-demo-farmacia',
    merchantName: 'Drogaria Macacu Saúde',
    merchantPhone: '(21) 99887-3344',
    originAddress: 'Praça Manuel de Portugal, 45 - Centro',
    originNeighborhood: 'Centro',
    customerId: 'cust-demo-carlos',
    customerName: 'Carlos Eduardo Souza',
    customerPhone: '(21) 97654-3210',
    destinationAddress: 'Estrada do Faraó, 120 - Faraó',
    destinationNeighborhood: 'Faraó',
    distanceKm: 8.5,
    ratePerKmApplied: 1.00,
    platformFeeApplied: 2.00,
    driverEarnings: 8.50,
    totalDeliveryFee: 10.50,
    customerPaid: true,
    driverId: 'driver-marcos-moto',
    driverName: 'Marcos Vinicius',
    driverPhone: '(21) 98877-6655',
    driverVehicle: 'Honda CG 160 Fan (Vermelha)',
    driverPlate: 'KXY-4920',
    driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'FINALIZADA',
    confirmationCode: '5289',
    calculationTimestamp: '2026-09-17T10:00:00.000Z',
    createdAt: '2026-09-17 10:00:00',
    acceptedAt: '2026-09-17 10:02:15',
    collectedAt: '2026-09-17 10:14:30',
    deliveredAt: '2026-09-17 10:32:45',
    finalizedAt: '2026-09-17 10:33:00',
    history: [
      {
        timestamp: '2026-09-17 10:00:00',
        status: 'CRIADA',
        description: 'Venda de medicamentos finalizada. Solicitação de delivery criada.',
        actorName: 'Drogaria Macacu Saúde',
        actorRole: 'LOJISTA'
      },
      {
        timestamp: '2026-09-17 10:02:15',
        status: 'ACEITA',
        description: 'Corrida aceita pelo entregador Marcos Vinicius (MOTO KXY-4920).',
        actorName: 'Marcos Vinicius',
        actorRole: 'ENTREGADOR'
      },
      {
        timestamp: '2026-09-17 10:14:30',
        status: 'COLETADA',
        description: 'Pacote coletado no balcão da Drogaria Macacu Saúde.',
        actorName: 'Marcos Vinicius',
        actorRole: 'ENTREGADOR'
      },
      {
        timestamp: '2026-09-17 10:32:45',
        status: 'ENTREGUE',
        description: 'Pacote entregue ao cliente. Código de confirmação 5289 validado com sucesso.',
        actorName: 'Marcos Vinicius',
        actorRole: 'ENTREGADOR'
      },
      {
        timestamp: '2026-09-17 10:33:00',
        status: 'FINALIZADA',
        description: 'Corrida finalizada. Ganhos de R$ 8,50 creditados ao entregador. Taxa de R$ 2,00 registrada para a plataforma.',
        actorName: 'Sistema Achei Aqui',
        actorRole: 'SISTEMA'
      }
    ]
  }
];

