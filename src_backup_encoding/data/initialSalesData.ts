export type {
  SalesAgent,
  AgentRegisteredClient,
  BoletoBillingRequest,
  CommercialGoal,
  SalesOrganogramNode,
  CommercialArea
};

import {
  SalesAgent,
  AgentRegisteredClient,
  BoletoBillingRequest,
  CommercialGoal,
  SalesOrganogramNode,
  CommercialArea
} from '../types';

export const INITIAL_SALES_AGENTS: SalesAgent[] = [
  {
    id: 'agent-1',
    name: 'Carlos Eduardo Nogueira',
    email: 'carlos.vendas@acheiaqui.com.br',
    phone: '(21) 98844-2101',
    cpf: '321.654.987-11',
    roleLevel: 'COORDENADOR_REGIONAL',
    roleTitle: 'Coordenador Comercial Regional',
    assignedRegion: 'Centro & Japuíba',
    commissionRatePercent: 5, // 5% do plano/mensalidade contratado
    commissionBonusPerActivation: 0,
    pixKey: 'carlos.vendas@acheiaqui.com.br',
    pixKeyType: 'EMAIL',
    status: 'active',
    monthlyTargetCount: 15,
    monthlyTargetRevenue: 2500,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10',
    notes: 'Responsável pela expansão de comércios no centro de Cachoeiras de Macacu.'
  },
  {
    id: 'agent-2',
    name: 'Juliana Martins da Costa',
    email: 'juliana.vendas@acheiaqui.com.br',
    phone: '(21) 99122-3344',
    cpf: '456.789.123-22',
    roleLevel: 'SUPERVISOR_VENDAS',
    roleTitle: 'Supervisora de Expansão e Prestadores',
    supervisorId: 'agent-1',
    supervisorName: 'Carlos Eduardo Nogueira',
    assignedRegion: 'Papucaia & Agrobrasil',
    commissionRatePercent: 5, // 5% oficial
    commissionBonusPerActivation: 0,
    pixKey: '21991223344',
    pixKeyType: 'TELEFONE',
    status: 'active',
    monthlyTargetCount: 12,
    monthlyTargetRevenue: 2000,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-20',
    notes: 'Focada em prestadores de serviços e profissionais liberais.'
  },
  {
    id: 'agent-3',
    name: 'Rodrigo Vasconcelos',
    email: 'rodrigo.comercial@acheiaqui.com.br',
    phone: '(21) 98711-5566',
    cpf: '789.123.456-33',
    roleLevel: 'CONSULTOR_SENIOR',
    roleTitle: 'Consultor Comercial Externo',
    supervisorId: 'agent-1',
    supervisorName: 'Carlos Eduardo Nogueira',
    assignedRegion: 'Guapiaçu & Castália',
    commissionRatePercent: 5, // 5% oficial
    commissionBonusPerActivation: 0,
    pixKey: '789.123.456-33',
    pixKeyType: 'CPF',
    status: 'active',
    monthlyTargetCount: 10,
    monthlyTargetRevenue: 1500,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-02-05',
    notes: 'Atuação forte em restaurantes, pousadas e oficinas.'
  },
  {
    id: 'agent-4',
    name: 'Camila Ribeiro Alcantara',
    email: 'camila.expansao@acheiaqui.com.br',
    phone: '(21) 99655-7788',
    cpf: '654.321.987-44',
    roleLevel: 'CONSULTOR_JUNIOR',
    roleTitle: 'Consultora de Vendas e Novos Usuários',
    supervisorId: 'agent-2',
    supervisorName: 'Juliana Martins da Costa',
    assignedRegion: 'Valério & Funchal',
    commissionRatePercent: 5, // 5% oficial
    commissionBonusPerActivation: 0,
    pixKey: 'camila.pix@email.com',
    pixKeyType: 'EMAIL',
    status: 'active',
    monthlyTargetCount: 8,
    monthlyTargetRevenue: 1200,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-03-01',
    notes: 'Captação de novos comércios de bairro e cadastros VIP.'
  }
];

export const INITIAL_REGISTERED_CLIENTS: AgentRegisteredClient[] = [];

export const INITIAL_BOLETO_REQUESTS: BoletoBillingRequest[] = [];

export const INITIAL_COMMERCIAL_GOALS: CommercialGoal[] = [
  {
    id: 'goal-1',
    title: 'Meta de Expansão - Primavera Macacu',
    targetMonth: 'Setembro / 2026',
    description: 'Acelerar a adesão de novos lojistas físicos e prestadores de serviços em todos os bairros de Cachoeiras.',
    targetCount: 30,
    targetRevenue: 5000,
    rewardDescription: 'Premiação de R$ 600,00 no Pix para quem atingir 100% + Certificado Campeão de Vendas Achei Aqui',
    assignedToAgentId: 'ALL',
    assignedToAgentName: 'Toda a Equipe Comercial',
    status: 'EM_ANDAMENTO',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    createdByMasterAt: '2026-08-31'
  },
  {
    id: 'goal-2',
    title: 'Meta Setor de Saúde & Especialistas',
    targetMonth: 'Setembro / 2026',
    description: 'Credenciamento de médicos, dentistas, clínicas e fisioterapeutas com o botão Agendar.',
    targetCount: 8,
    targetRevenue: 1500,
    rewardDescription: 'Bônus de R$ 250,00 no Pix por atingimento antecipado',
    assignedToAgentId: 'agent-2',
    assignedToAgentName: 'Juliana Martins da Costa',
    status: 'EM_ANDAMENTO',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    createdByMasterAt: '2026-09-01'
  }
];

export const INITIAL_ORGANOGRAM: SalesOrganogramNode = {
  id: 'org-master',
  agentId: 'user-master-david',
  name: 'David Telecom (Administrador Master)',
  roleTitle: 'Direção Geral & Administrador Master Supremo',
  level: 0,
  assignedRegion: 'Toda a Região de Cachoeiras de Macacu & Expansão Externa',
  salesCount: 45,
  revenueTotal: 9850,
  status: 'active',
  phone: '(21) 99999-8877',
  commissionRatePercent: 100,
  avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  children: [
    {
      id: 'org-coord-1',
      agentId: 'agent-1',
      name: 'Carlos Eduardo Nogueira',
      roleTitle: 'Coordenador Comercial Regional',
      level: 1,
      parentId: 'org-master',
      assignedRegion: 'Centro & Japuíba',
      salesCount: 18,
      revenueTotal: 3450,
      status: 'active',
      phone: '(21) 98844-2101',
      commissionRatePercent: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      children: [
        {
          id: 'org-consultant-1',
          agentId: 'agent-3',
          name: 'Rodrigo Vasconcelos',
          roleTitle: 'Consultor Comercial Externo',
          level: 2,
          parentId: 'org-coord-1',
          assignedRegion: 'Guapiaçu & Castália',
          salesCount: 7,
          revenueTotal: 1250,
          status: 'active',
          phone: '(21) 98711-5566',
          commissionRatePercent: 5,
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'org-supervisor-1',
      agentId: 'agent-2',
      name: 'Juliana Martins da Costa',
      roleTitle: 'Supervisora de Expansão e Prestadores',
      level: 1,
      parentId: 'org-master',
      assignedRegion: 'Papucaia & Agrobrasil',
      salesCount: 14,
      revenueTotal: 2980,
      status: 'active',
      phone: '(21) 99122-3344',
      commissionRatePercent: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      children: [
        {
          id: 'org-consultant-2',
          agentId: 'agent-4',
          name: 'Camila Ribeiro Alcantara',
          roleTitle: 'Consultora de Vendas e Novos Usuários',
          level: 2,
          parentId: 'org-supervisor-1',
          assignedRegion: 'Valério & Funchal',
          salesCount: 6,
          revenueTotal: 920,
          status: 'active',
          phone: '(21) 99655-7788',
          commissionRatePercent: 5,
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        }
      ]
    }
  ]
};

export const INITIAL_COMMERCIAL_AREAS: CommercialArea[] = [
  {
    id: 'area-centro',
    name: 'Centro & Japuíba',
    code: 'AREA-01-CENTRO',
    neighborhoods: ['Centro', 'Japuíba', 'Castália', 'Campo do Prado', 'Morro do Querosene'],
    supervisorId: 'agent-1',
    supervisorName: 'Carlos Eduardo Nogueira',
    targetMonthlyActivations: 25,
    notes: 'Zona comercial de alta densidade lojista e prestadores centrais.',
    color: '#3B82F6' // Blue
  },
  {
    id: 'area-papucaia',
    name: 'Papucaia & Agrobrasil',
    code: 'AREA-02-PAPUCAIA',
    neighborhoods: ['Papucaia', 'Agrobrasil', 'Parque Veneza', 'Boa Vista'],
    supervisorId: 'agent-2',
    supervisorName: 'Juliana Martins da Costa',
    targetMonthlyActivations: 20,
    notes: 'Forte pólo de agronegócio, serviços mecânicos, consultórios e comércio local.',
    color: '#10B981' // Emerald
  },
  {
    id: 'area-guapiacu',
    name: 'Guapiaçu & Ribeira',
    code: 'AREA-03-GUAPIACU',
    neighborhoods: ['Guapiaçu', 'Ribeira', 'Boca do Mato', 'Estação Guapiaçu'],
    supervisorId: 'agent-1',
    supervisorName: 'Carlos Eduardo Nogueira',
    targetMonthlyActivations: 15,
    notes: 'Ecoturismo, pousadas, gastronomia artesanal e prestadores rurais.',
    color: '#F59E0B' // Amber
  },
  {
    id: 'area-funchal',
    name: 'Valério & Funchal',
    code: 'AREA-04-FUNCHAL',
    neighborhoods: ['Funchal', 'Valério', 'Maraporã', 'Subaio'],
    supervisorId: 'agent-2',
    supervisorName: 'Juliana Martins da Costa',
    targetMonthlyActivations: 12,
    notes: 'Expansão de bairros residenciais, minimercados e consumidores VIP.',
    color: '#8B5CF6' // Purple
  },
  {
    id: 'area-marapora',
    name: 'Maraporã & Sambaetiba',
    code: 'AREA-05-SAMBAETIBA',
    neighborhoods: ['Maraporã', 'Sambaetiba', 'Divisa Itaboraí'],
    supervisorId: 'agent-1',
    supervisorName: 'Carlos Eduardo Nogueira',
    targetMonthlyActivations: 10,
    notes: 'Corredor de transporte, oficinas, depósitos e materiais de construção.',
    color: '#EC4899' // Pink
  }
];

