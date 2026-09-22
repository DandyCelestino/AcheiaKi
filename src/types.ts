export type UserRole = 'CLIENTE' | 'VENDEDOR' | 'MASTER' | 'REPRESENTANTE_COMERCIAL' | 'LOJISTA' | 'PRESTADOR_SERVICO' | 'ENTREGADOR';

export type MembershipTier = 'GRATIS' | 'BRONZE' | 'PRATA' | 'OURO' | 'PREMIUM' | 'MASTER';

export interface PlanBenefitRule {
  tier: MembershipTier;
  name: string;
  title?: string;
  badgeLabel: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxProducts: number;
  commissionRate: number; // in %
  buyerDataReleasePolicy: 'AFTER_COMMISSION_CONFIRMATION' | 'AFTER_STOCK_CONFIRMATION' | 'IMMEDIATE' | 'REAL_TIME_VIP';
  buyerDataRule?: string;
  description: string;
  highlights: string[];
  color: string;
  badgeBg: string;
  badgeTextColor: string;
}

export type ModalityType = 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO' | 'AGENDAMENTO';

export type OrderStatus = 'Aguardando' | 'Confirmado' | 'Em Preparo' | 'Em Rota' | 'Pronto para Retirada' | 'Concluído' | 'Cancelado' | 'Sem Estoque';

export type ItemType = 'PRODUTO_FISICO' | 'SERVICO' | 'INSTALACAO' | 'MANUTENCAO';

export interface ProfessionalReference {
  id?: string;
  name: string;
  phone: string;
  relationshipOrRole: string; // Ex: "Cliente Residencial", "Síndico Condomínio", "Comércio Parceiro"
  notes?: string;
}

export type AuditCategory =
  | 'SECURITY'
  | 'ORDER'
  | 'COMMUNICATION'
  | 'FINANCIAL'
  | 'DATA_PRIVACY'
  | 'USER_MANAGEMENT'
  | 'SYSTEM'
  | 'GENERAL';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';

export interface AuditLogOptions {
  category?: AuditCategory;
  severity?: AuditSeverity;
  entityId?: string;
  entityType?: 'ORDER' | 'SUBORDER' | 'MESSAGE' | 'BUYER_DATA' | 'COMMISSION' | 'MERCHANT' | 'USER' | 'SETTINGS' | 'SYSTEM' | string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  device?: string;
  userRole?: string;
  userName?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  action: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  entityId?: string;
  entityType?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  device: string;
  timestamp: string;
  isoDate?: string;
}

export interface AuditStats {
  total: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  criticalEventsCount: number;
  dataReleaseCount: number;
  messageEventsCount: number;
  statusChangesCount: number;
}

export interface CustomerAddress {
  id: string;
  label: string; // Ex: "Casa", "Trabalho", "Sítio / Papucaia"
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode?: string;
  referencePoint?: string;
  deliveryInstructions?: string;
  isDefault?: boolean;
}

export interface VipMeasurements {
  topSize?: string; // PP, P, M, G, GG, XGG, G1, G2
  bottomSize?: string; // 34 a 56
  shoeSize?: string; // 33 a 46
  height?: string; // Ex: 1.68m
  weight?: string; // Ex: 65kg
  preferredFit?: 'Ajustado' | 'Normal' | 'Solto' | 'Oversized';
  favoriteColors?: string[];
  avoidColors?: string[];
  stylePreferences?: string[]; // Ex: ["Casual", "Social", "Esportivo", "Moda Praia"]
  fitNotes?: string;
}

export interface NotificationChannelMatrix {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
}

export interface NotificationPreferences {
  orderStatus: NotificationChannelMatrix;
  sellerMessages: NotificationChannelMatrix;
  promotions: NotificationChannelMatrix;
}

export interface CustomerPreferences {
  receiveWhatsApp: boolean;
  receiveEmail: boolean;
  receiveSms: boolean;
  receivePromoAlerts: boolean;
  preferredModality?: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO';
  dietaryRestrictions?: string;
  favoriteCategories?: string[];
  notificationChannels?: NotificationPreferences;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  role: UserRole;
  password?: string;
  city: string;
  address?: string;
  neighborhood?: string;
  merchantId?: string; // If role is VENDEDOR, links to their store
  avatar?: string;
  cpf?: string;
  idDocument?: string; // RG / Identidade Oficial
  birthDate?: string;
  gender?: 'Feminino' | 'Masculino' | 'Não-binário' | 'Outro' | 'Prefiro não informar';
  addresses?: CustomerAddress[];
  references?: ProfessionalReference[];
  measurements?: VipMeasurements;
  preferences?: CustomerPreferences;
  notificationPreferences?: NotificationPreferences;
  emergencyContact?: EmergencyContact;
  generalNotes?: string;
  membershipTier?: MembershipTier;
  isEmailVerified?: boolean;
  needsPasswordChange?: boolean;
  twoFactorEnabled?: boolean;
  status?: 'active' | 'suspended' | 'blocked';
  statusReason?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  image?: string;
  description?: string;
}

export interface ProductVariation {
  name: string; // e.g. "Tamanho", "Cor", "Sabor"
  options: string[]; // e.g. ["P", "M", "G"], ["Vermelho", "Preto"]
}

export interface Product {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  merchantRating: number;
  merchantAddress: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  stock: number;
  itemType?: ItemType; // PRODUTO_FISICO | SERVICO | INSTALACAO | MANUTENCAO
  executionLocation?: 'DOMICILIO' | 'ESTABELECIMENTO' | 'AMBOS';
  warrantyDays?: number;
  serviceEstimateTime?: string;
  estimatedDuration?: string;
  isQuoteBased?: boolean;
  availableModalities: ('DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO' | 'AGENDAMENTO')[];
  featured?: boolean;
  isNewArrival?: boolean;
  isDeal?: boolean;
  isPopular?: boolean;
  rating: number;
  reviewsCount: number;
  variations?: ProductVariation[];
  specs?: { [key: string]: string };
  allowDirectChat?: boolean; // Habilitar ou desativar chat interno direto para este produto
  // Novas configurações de Taxa, PIX e Ações por Categoria
  advanceFeeRequired?: boolean;
  advanceFeeAmount?: number; // Valor da taxa de adiantamento em R$
  pixKey?: string; // Chave PIX do lojista
  pixKeyType?: 'CPF' | 'CNPJ' | 'CELULAR' | 'TELEFONE' | 'EMAIL' | 'ALEATORIA';
  pixBeneficiaryName?: string;
  furnitureActionType?: 'COMPRAR_APENAS' | 'ALUGAR_APENAS' | 'COMPRAR_E_ALUGAR' | 'BUY' | 'RENT' | 'BOTH'; // Móveis e locações
  rentPrice?: number;
  rentPeriod?: 'DIARIA' | 'MENSAL' | 'EVENTO' | 'DIA' | 'SEMANA' | 'MES';
  vehicleActionType?: 'RESERVAR_E_VISITAR' | 'RESERVAR_APENAS' | 'VISITAR_APENAS' | 'BOTH' | 'RESERVE' | 'VISIT'; // Veículos
  vehicleYear?: string;
  vehicleKm?: string;
  status: 'active' | 'paused' | 'draft' | 'archived';
  createdAt: string;
}

export interface ProfessionalCredentials {
  registrationNumber?: string; // Ex: "CRM-RJ 98.421", "CRO-RJ 48920", "CREA-RJ 2021190", "CRP 05/12345"
  registrationEntity?: string; // Ex: "Conselho Regional de Odontologia", "CREA", "OAB", "MEI"
  experienceYears?: number; // Ex: 12 anos de atuação em Cachoeiras de Macacu
  specializations?: string[]; // Ex: ["Implantodontia", "Ortodontia", "Elétrica de Alta Tensão"]
  certifications?: string[]; // Ex: ["Certificação Apple", "NR10 Segurança Elétrica", "Pós-Graduação UFF"]
  warrantyInfo?: string; // Ex: "90 dias de garantia legal com emissão de nota fiscal de serviços"
  guaranteeDays?: number;
}

export interface ServicePricingTable {
  hourlyRate?: number; // R$ / hora (avulso, consultas, pequenos reparos)
  dailyRate?: number; // R$ / diária (dia de trabalho de 8h, plantão, evento)
  monthlyRate?: number; // R$ / mensalidade (reforço escolar mensal, planos de estética recorrente, manutenção predial)
  customQuoteDescription?: string; // Informações para orçamentos sob medida
  pricingNotes?: string; // Ex: "Materiais e peças orçados separadamente. Deslocamento incluso para toda Cachoeiras de Macacu."
}

export interface MerchantAvailableSlot {
  id: string;
  dayOfWeek: string; // "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"
  time: string; // "09:00", "10:30", etc.
  isAvailable: boolean; // true = vaga livre, false = ocupado/bloqueado
  period: 'MANHA' | 'TARDE' | 'NOITE';
  professionalName?: string;
}

export interface MerchantScheduleConfig {
  workingDays: {
    day: string;
    isOpen: boolean;
    startHour: string;
    endHour: string;
    lunchStart?: string;
    lunchEnd?: string;
  }[];
  slotDurationMinutes: number; // 30, 45, 60, 90 min
  serviceExecutionModalities: ('ESTABELECIMENTO' | 'DOMICILIO' | 'ONLINE')[];
  advanceNoticeHours: number; // Ex: 2 horas de antecedência
  customSlots?: MerchantAvailableSlot[];
}

export interface MerchantServiceResponse {
  status: 'PENDENTE' | 'CONFIRMADO' | 'REAGENDADO' | 'RECUSADO' | 'CONCLUIDO';
  responseMessage: string; // Resposta oficial escrita pelo lojista/médico/professor
  merchantAuthorName: string; // Nome do profissional que respondeu
  respondedAt: string; // Data/Hora da resposta
  instructionsForCustomer?: string; // Ex: "Chegar 10 minutos antes com documento e exames anteriores"
  confirmedDate?: string;
  confirmedTime?: string;
  confirmedLocation?: string;
  confirmedPrice?: number;
  pricingType?: 'HORA' | 'DIARIA' | 'MENSAL' | 'SERVICO_FIXO' | 'ORCAMENTO';
}

export interface ServiceItem {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantCategory: string;
  merchantRating: number;
  merchantAddress: string;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  subcategory?: string;
  itemType?: ItemType;
  image: string;
  professionals: string[];
  availableDays: string[];
  timeSlots?: string[];
  availableHours?: string[];
  isQuoteBased?: boolean;
  pricingTable?: ServicePricingTable;
  credentials?: ProfessionalCredentials;
  executionLocation?: 'ESTABELECIMENTO' | 'DOMICILIO' | 'ONLINE' | 'AMBOS';
  allowDirectChat?: boolean; // Habilitar ou desativar chat interno direto para este serviço
  status?: 'active' | 'paused' | 'archived';
}

export interface StoreMerchant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  cnpjOrCpf: string;
  idDocument?: string; // RG / Documento de Identidade Obrigatório
  category: string;
  subcategory?: string;
  description: string;
  address: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  references?: ProfessionalReference[]; // Referências Obrigatórias
  credentials?: ProfessionalCredentials; // Registro profissional (CRM, CRO, CREA etc.)
  pricingTable?: ServicePricingTable; // Preço por hora, dia e mês
  scheduleConfig?: MerchantScheduleConfig; // Agenda com dias e horas vagas
  isServiceProvider?: boolean;
  offeredItemTypes?: ItemType[];
  isVerifiedProvider?: boolean;
  logo: string;
  banner?: string;
  gallery?: string[];
  rating: number;
  reviewsCount: number;
  isOpen: boolean;
  openingHours: string;
  deliveryFee: number;
  deliveryTimeEstimate: string;
  supportsPickup: boolean;
  supportsTrial: boolean;
  supportsAppointments: boolean;
  allowDirectChat?: boolean; // Lojistas e Prestadores de Serviços podem ativar ou desativar chat em suas configurações
  serviceButtonsConfig?: {
    showSchedule?: boolean;     // Botão Agendar
    showHomeService?: boolean;  // Atendimento a domicílio
    showStoreService?: boolean; // Atendimento na loja
    showQuote?: boolean;        // Solicitar orçamento / contato
    showChat?: boolean;         // Chat interno
  };
  membershipTier?: MembershipTier;
  maxProductsLimit?: number;
  commissionRate?: number; // In percent (e.g. 12, 8, 5, 3, 1)
  asaasAccountId?: string; // ID da subconta Asaas (ex: "cus_000005829102")
  asaasWalletId?: string; // Wallet ID do lojista no Asaas para Split de pagamentos
  status: 'approved' | 'pending' | 'rejected' | 'suspended' | 'blocked' | 'pending_payment';
  statusReason?: string;
  submittedAt: string;
  updatedAt?: string;
}

export type Merchant = StoreMerchant;

export interface Order {
  id: string;
  code: string; // e.g. "RET-8X42K9" or "DEL-9912A"
  orderNumber?: string; // e.g. "#58291"
  securityCode?: string; // Código único de segurança / negociação (ex: "K7P4X9")
  clientVerified?: boolean; // Se o cliente validou via SMS/WhatsApp
  verificationPhoneCode?: string; // Código enviado no SMS/WhatsApp (ex: "482913")
  verificationChannel?: 'WHATSAPP' | 'SMS';
  customerEmail?: string;
  customerCpf?: string;
  termsAccepted?: boolean;
  stockConfirmationStatus?: 'PENDING_STORE_CONFIRMATION' | 'STOCK_CONFIRMED' | 'OUT_OF_STOCK' | 'EXPIRED' | 'STAND_BY';
  stockConfirmationExpiresAt?: string; // 15 minutos para a loja confirmar
  reservationExpiresAt?: string; // 30 minutos de reserva garantida
  paymentNegotiationNote?: string; // Negociação direta cliente + loja
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  merchantId: string;
  merchantName: string;
  type: 'PRODUTO' | 'SERVICO';
  items: {
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    selectedVariation?: { [key: string]: string };
  }[];
  serviceDetails?: {
    serviceId: string;
    serviceTitle: string;
    professional: string;
    scheduledDate: string;
    scheduledTime: string;
    serviceLocation?: 'ESTABELECIMENTO' | 'DOMICILIO' | 'ONLINE';
    pricingTypeSelected?: 'HORA' | 'DIARIA' | 'MENSAL' | 'SERVICO_FIXO' | 'ORCAMENTO';
    customerNotes?: string;
    merchantResponse?: MerchantServiceResponse;
  };
  modality: ModalityType;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee?: number;
  pickupCode?: string; // e.g. "RET-A8K9X2"
  trialDetails?: {
    date: string;
    time: string;
    notes?: string;
  };
  pickupValidatedAt?: string;
  internalNotes?: string;
  cancellationReason?: string;
  assignedDriver?: string;
  commissionRateApplied?: number; // e.g. 12, 8, 5, 3, 1
  commissionAmount?: number; // Valor da taxa/comissão da plataforma
  commissionPaidToPlatform?: boolean; // Lojista realizou o pagamento
  commissionConfirmedByMaster?: boolean; // Administrador Master confirmou o pagamento
  buyerDataUnlocked?: boolean; // Dados do comprador liberados para o lojista
  paymentMethod?: 'PIX' | 'DINHEIRO' | 'CARTAO' | 'A_COMBINAR';
  paymentStatus?: 'PENDENTE' | 'PAGO' | 'EM_PROCESSAMENTO' | 'FALHOU' | 'EXPIRADO' | 'CANCELADO';
  pixDetails?: PixPaymentDetails;
  asaasPaymentId?: string;
  asaasInvoiceUrl?: string;
  asaasPixQrCode?: string;
  asaasSplitDetails?: {
    walletId: string;
    description?: string;
    amount?: number;
    percentage?: number;
  }[];
  subpedidos?: any[];
  itensPorLojista?: {
    lojistaId: string;
    nomeLojista: string;
    subtotal: number;
    walletId?: string;
    itens: {
      productId: string;
      productName: string;
      productImage: string;
      quantity: number;
      price: number;
      selectedVariation?: { [key: string]: string };
    }[];
  }[];
  deliveryRideId?: string;
  deliveryRideStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'A_COMBINAR';
export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'EM_PROCESSAMENTO' | 'FALHOU' | 'EXPIRADO' | 'CANCELADO';

export interface PixPaymentDetails {
  txid: string;
  copiaECola: string;
  qrCodeUrl?: string;
  expiresAt: string;
  paidAt?: string;
  endToEndId?: string;
  amount: number;
  receiverKey: string;
  receiverName: string;
  receiverCity: string;
  gatewayProvider: string;
  isSandbox?: boolean;
}

export interface PointOfInterest {
  id: string;
  name: string;
  category: 'TURISMO_ECO' | 'HISTORICO' | 'LAZER' | 'UTILIDADE_PUBLICA' | 'GASTRONOMIA' | 'COMERCIO';
  description: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  image?: string;
  tag: string;
  highlights?: string[];
  visitInfo?: string;
}

export interface SystemSettings {
  maintenanceMode: boolean;
  systemBroadcastAlert: string;
  broadcastAlertActive: boolean;
  globalCommissionRate: number;
  allowNewRegistrations: boolean;
  autoApproveMerchants: boolean;
  defaultDeliveryFeeMacacu: number;
  vipTrialMaxDays: number;
  vipTrialSecurityDepositRequired: boolean;
  deliveryRatePerKm?: number; // VALOR_POR_KM (padrão R$ 1,00/km)
  deliveryPlatformFee?: number; // TAXA_PLATAFORMA (padrão R$ 2,00/solicitação)
  deliveryMaxActiveRidesPerDriver?: number;
  enableFloatingNotificationBall?: boolean;
  defaultCommissionRate?: number;
  standardDeliveryFee?: number;
  maxTrialDays?: number;
  supportPhone?: string;
  allowCustomerRegistration?: boolean;
  broadcastAlertEnabled?: boolean;
  broadcastMessage?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  bgColor: string;
  actionText: string;
  categoryFilter?: string;
}

export type NotificationChannel = 'IN_APP' | 'SYSTEM' | 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH';
export type NotificationStatus = 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
export type NotificationAudience = 'ALL' | 'ALL_MERCHANTS' | 'ALL_CUSTOMERS' | 'SPECIFIC_USER' | 'SPECIFIC_MERCHANT';
export type NotificationCategory = 'SISTEMA' | 'PEDIDO' | 'COMUNICADO' | 'COMISSAO' | 'PROMO' | 'SEGURANCA' | 'AVISO' | 'URGENTE';
export type NotificationPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  audience: NotificationAudience;
  recipientUserId?: string; // target specific user ID
  recipientMerchantId?: string; // target specific merchant ID
  recipientName?: string; // display name
  recipientPhone?: string;
  recipientEmail?: string;
  senderName: string; // e.g. "Administração Master Achei Aqui"
  senderRole?: 'MASTER' | 'SISTEMA' | 'LOJISTA' | 'CLIENTE';
  priority: NotificationPriority;
  actionUrl?: string; // e.g. 'account', 'orders', 'plans'
  actionLabel?: string; // e.g. "Ver Pedido", "Ver Planos"
  readBy: string[]; // array of userIds that have read this notification
  deliveredAt?: string;
  createdAt: string;
  orderCode?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationEventType =
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PREPARING'
  | 'ORDER_DISPATCHED'
  | 'ORDER_READY_PICKUP'
  | 'ORDER_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'TRIAL_REQUESTED'
  | 'TRIAL_CONFIRMED'
  | 'TRIAL_REMINDER'
  | 'SERVICE_BOOKED'
  | 'SERVICE_CONFIRMED'
  | 'SERVICE_REMINDER'
  | 'SECURITY_ALERT'
  | 'PASSWORD_RESET'
  | 'PHONE_VERIFICATION_CODE'
  | 'ADMIN_BROADCAST'
  | 'CHAT_MESSAGE'
  | 'WELCOME';

export interface NotificationLog {
  id: string;
  eventType: NotificationEventType;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientUserId?: string;
  recipientMerchantId?: string;
  audience?: NotificationAudience;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  orderId?: string;
  orderCode?: string;
  merchantId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  readBy?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariations: { [key: string]: string };
  selectedModality: 'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÇÃO';
}

export interface CarouselSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  linkUrl?: string;
  actionText?: string;
  badge?: string;
  merchantId?: string;
  merchantName?: string;
  accentColor?: string;
}

export interface InterCategoryBanner {
  id: string;
  title: string;
  targetCategoryAfter: string; // ID of category it is displayed after (e.g. 'gastronomia', 'moda')
  slides: CarouselSlide[]; // Exactly 3 or more slides for autoplay
  autoplayIntervalSeconds: number; // default 4
  sponsorMerchantId?: string;
  sponsorMerchantName?: string;
  adSpaceId?: string;
  status: 'active' | 'paused' | 'draft';
  createdAt: string;
}

export type AdSpaceType = 'HERO_TOP' | 'INTER_CATEGORY' | 'FOOTER_BANNER' | 'CATEGORY_SPONSOR' | 'SEARCH_FEATURED';
export type AdCommercialType = 'DIRECT_SALE' | 'AUCTION';
export type AdSpaceStatus = 'AVAILABLE' | 'IN_AUCTION' | 'SOLD' | 'PAUSED';

export interface AuctionBid {
  id: string;
  merchantId: string;
  merchantName: string;
  bidAmount: number;
  timestamp: string;
  status: 'HIGHEST' | 'OUTBID' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
}

export interface AdSpace {
  id: string;
  name: string;
  locationDescription: string; // Ex: "Banner Full-Width Entre Gastronomia e Moda"
  type: AdSpaceType;
  dimensions: string; // Ex: "1200x350 Full-Width (3 Slides Carrossel)"
  commercialType: AdCommercialType;
  status: AdSpaceStatus;
  fixedPricePerWeek?: number;
  fixedPricePerMonth?: number;
  // Auction fields:
  minimumBid?: number;
  currentHighestBid?: number;
  currentWinnerMerchantId?: string;
  currentWinnerMerchantName?: string;
  auctionEndDate?: string;
  bids?: AuctionBid[];
  // Active sponsor linkage:
  linkedBannerId?: string;
  activeMerchantId?: string;
  activeMerchantName?: string;
  impressionsCount: number;
  clicksCount: number;
  revenueTotal: number;
}

export interface NavMenuItem {
  id: string;
  label: string;
  target: string; // 'home', 'categories', 'gastronomia', 'moda', 'services', 'vender'
  iconName?: string;
  isExternal?: boolean;
  isVisible: boolean;
  badge?: string;
  order: number;
}

export interface FrontendCustomization {
  // Header
  siteTitle: string;
  siteSubtitle: string;
  logoLetter: string;
  logoImageUrl?: string;
  topAnnouncementText: string;
  topAnnouncementActive: boolean;
  topAnnouncementLink?: string;
  headerCtaText: string;
  headerCtaLink: string;
  
  // Navigation & Menus
  navMenuItems: NavMenuItem[];
  
  // Home & Categories Display
  categoryProductsLimit: number; // default 24
  categoryBlockSize: number; // default 4
  enabledCategoryIds: string[];
  categoryOrder: string[];
  enableInterCategoryBanners: boolean;
  
  // Merchant Posting Governance
  merchantPostingPolicy: 'FREE' | 'MODERATED' | 'PAID_SUBSCRIPTION';
  maxProductsPerMerchant: number;
  allowMerchantHighlightAuction: boolean;
  
  // Footer
  footerAboutText: string;
  footerSupportPhone: string;
  footerSupportEmail: string;
  footerSupportWhatsApp: string;
  footerAddress: string;
  footerCopyrightText: string;
  footerSocialInstagram?: string;
  footerSocialFacebook?: string;
  footerSocialWhatsApp?: string;
  footerCol1Title: string;
  footerCol2Title: string;
  footerCol3Title: string;
}

// ==========================================
// AVALIAÇÕES MÚTUAS & POLÍTICA DE REPUTAÇÃO
// ==========================================

export interface CustomerReviewCriteria {
  quality: number; // 1-5 Qualidade do produto ou serviço prestado
  punctuality: number; // 1-5 Pontualidade na entrega / agendamento / prazo
  service: number; // 1-5 Atendimento, educação e esclarecimento de dúvidas
  costBenefit: number; // 1-5 Relação custo-benefício
}

export interface CustomerToMerchantReview {
  id: string;
  orderId: string;
  orderCode: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  merchantId: string;
  merchantName: string;
  targetType: 'LOJA' | 'PRESTADOR_SERVICO';
  rating: number; // Média 1 a 5 estrelas
  criteria: CustomerReviewCriteria;
  comment: string;
  tags?: string[]; // Ex: ["Entrega Rápida", "Produto Impecável", "Atendimento Nota 10", "Preço Justo", "Profissional Experiente"]
  recommend: boolean;
  photos?: string[];
  merchantReply?: {
    replyText: string;
    repliedAt: string;
    merchantAuthorName: string;
  };
  verifiedPurchase: boolean;
  status: 'active' | 'reported' | 'moderated';
  createdAt: string;
}

export interface MerchantReviewBehaviorCriteria {
  punctuality: number; // 1-5 Pontualidade no recebimento/retirada/atendimento
  communication: number; // 1-5 Cordialidade e clareza na comunicação
  paymentAndAgreements: number; // 1-5 Cumprimento dos combinados de pagamento e retirada
  careAndRespect: number; // 1-5 Cuidado com produtos no provador / respeito ao profissional
}

export interface MerchantToCustomerReview {
  id: string;
  orderId: string;
  orderCode: string;
  merchantId: string;
  merchantName: string;
  userId: string;
  userName: string;
  customerPhone?: string;
  rating: number; // 1 a 5 estrelas
  behaviorCriteria: MerchantReviewBehaviorCriteria;
  comment: string;
  behaviorTags: string[]; // Ex: ["Cliente Pontual", "Excelente Comunicação", "Retirou no Prazo", "Pagamento Imediato", "Cuidado no Provador VIP", "Recomendo para outros Lojistas"]
  recommendForOtherMerchants: boolean;
  incidentReported?: boolean; // Caso tenha havido descumprimento grave de política (no-show, avaria)
  incidentDetails?: string;
  createdAt: string;
}

export interface CustomerReputationSummary {
  userId: string;
  userName: string;
  averageScore: number; // 1.0 a 5.0
  totalEvaluations: number;
  punctualityScore: number;
  communicationScore: number;
  paymentScore: number;
  careScore: number;
  recommendationPercentage: number; // % dos lojistas que recomendam
  badges: string[]; // Ex: ["Cliente 5 Estrelas", "Pagador Pontual", "VIP Verificado"]
  reviews: MerchantToCustomerReview[];
}

// ============================================================================
// ARQUITETURA MULTILOJA: BANCO, RELACIONAMENTOS, STATUS E SEGURANÇA
// ============================================================================

export const COMPRA_VALIDADA_AVISO =
  'COMPRA VALIDADA — O PAGAMENTO DAS MERCADORIAS SERÁ REALIZADO DIRETAMENTE A CADA LOJISTA.';

export const PLATFORM_FEE_RATE = 0.10; // 10% da transação para a plataforma Achei Aqui

export type PedidoPrincipalStatus =
  | 'CRIADO'
  | 'AGUARDANDO_CONFIRMACOES_LOJAS'
  | 'AGUARDANDO_PAGAMENTO_TAXAS'
  | 'COMPRA_VALIDADA'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type SubpedidoStatus =
  | 'CRIADO'
  | 'AGUARDANDO_CONFIRMACAO_LOJA'
  | 'ESTOQUE_CONFIRMADO'
  | 'SEM_ESTOQUE'
  | 'CANCELADO_LOJA'
  | 'AGUARDANDO_PAGAMENTO_TAXA'
  | 'TAXA_PAGA'
  | 'COMPRA_VALIDADA'
  | 'DADOS_LIBERADOS'
  | 'EM_PREPARO'
  | 'EM_ROTA'
  | 'PRONTO_RETIRADA'
  | 'AGUARDANDO_PAGAMENTO_MERCADORIA'
  | 'PAGAMENTO_MERCADORIA_CONFIRMADO'
  | 'RECEBIMENTO_CONFIRMADO_CLIENTE'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type ItemPedidoStatus = 'ATIVO' | 'CONFIRMADO' | 'SEM_ESTOQUE' | 'REMOVIDO' | 'CANCELADO';

export type TaxaPagamentoStatus = 'PENDENTE' | 'PAGO_CONFIRMADO' | 'EXPIRADO' | 'CANCELADO' | 'ESTORNADO';

export type EntregaStatus =
  | 'AGUARDANDO_VALIDACAO_COMPRA'
  | 'EM_PREPARO'
  | 'DESPACHADO_EM_ROTA'
  | 'DISPONIVEL_RETIRADA'
  | 'ENTREGUE'
  | 'RETIRADO'
  | 'FALHA_ENTREGA';

// Entidade: CARRINHOS
export interface CarrinhoMultilojaItem {
  id: string;
  produtoId: string;
  lojaId: string;
  lojaNome: string;
  nome: string;
  precoUnitario: number;
  imagem: string;
  quantidade: number;
  variacoes?: Record<string, string>;
  modalidade: ModalityType;
  adicionadoEm: string;
}

export interface CarrinhoMultiloja {
  id: string;
  userId?: string;
  sessionId?: string;
  itens: CarrinhoMultilojaItem[];
  criadoEm: string;
  atualizadoEm: string;
}

// Entidade: ITENS_PEDIDO
export interface ItemPedido {
  id: string;
  subpedidoId: string;
  pedidoPrincipalId: string;
  lojaId: string;
  produtoId: string;
  nomeProduto: string;
  imagemProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  variacoes?: Record<string, string>;
  statusItem: ItemPedidoStatus;
  motivoCancelamentoItem?: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Entidade: PAGAMENTOS_TAXAS (Cobrança única de taxas da plataforma)
export interface PagamentoTaxa {
  id: string;
  pedidoPrincipalId: string;
  subpedidoIds: string[];
  pagadorUserId: string;
  pagadorNome: string;
  pagadorEmail: string;
  pagadorPhone: string;
  valorTotalTaxas: number; // Soma exata das taxas (10%) de todos os subpedidos confirmados
  taxaPercentualGeral: number; // 0.10 (10%)
  metodo: 'PIX_ESTATICO' | 'PIX_DINAMICO_API' | 'LINK_PAGAMENTO' | 'WEBHOOK_GATEWAY';
  chavePixOficial: string; // CNPJ 30.810.800/0001-39
  beneficiario: string; // Bex Serviços e Comércios, CNPJ 30.810.800/0001-39
  linkPagamento?: string;
  qrCodePixUrl?: string;
  copiaEColaPix?: string;
  status: TaxaPagamentoStatus;
  comprovanteUrl?: string;
  confirmadoPorUserId?: string;
  confirmadoAt?: string;
  gatewayTransactionId?: string;
  webhookPayload?: Record<string, unknown>;
  criadoEm: string;
  expiraEm: string;
}

// Entidade: ENTREGAS
export interface RegistroEntrega {
  id: string;
  subpedidoId: string;
  pedidoPrincipalId: string;
  lojaId: string;
  modalidade: ModalityType;
  regiaoAproximada: string; // Bairro/Região visível antes da validação da taxa
  enderecoEntregaCompleto?: string; // Liberado APENAS após COMPRA_VALIDADA e LIBERAR_DADOS_DO_CLIENTE
  codigoRastreioOuRetirada: string;
  statusEntrega: EntregaStatus;
  dataHoraDespacho?: string;
  dataHoraEntregaOuRetirada?: string;
  recebedorNome?: string;
  recebedorDocumento?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

// Entidade: CONFIRMACOES
export interface RegistroConfirmacoes {
  id: string;
  subpedidoId: string;
  pedidoPrincipalId: string;
  lojaId: string;
  confirmacaoEstoqueLoja: boolean;
  confirmacaoEstoqueLojaAt?: string;
  confirmacaoEstoqueUsuarioId?: string;
  confirmacaoTaxaPlataforma: boolean;
  confirmacaoTaxaPlataformaAt?: string;
  confirmacaoPagamentoMercadoriaLoja: boolean; // Lojista confirma que cliente pagou as mercadorias diretamente a ele
  confirmacaoPagamentoMercadoriaLojaAt?: string;
  confirmacaoRecebimentoCliente: boolean; // Cliente confirma que recebeu as mercadorias/serviço
  confirmacaoRecebimentoClienteAt?: string;
  observacoes?: string;
}

// Entidade: HISTORICO_STATUS
export interface RegistroHistoricoStatus {
  id: string;
  entidadeTipo: 'PEDIDO_PRINCIPAL' | 'SUBPEDIDO' | 'TAXA' | 'ENTREGA';
  entidadeId: string;
  statusAnterior: string;
  statusNovo: string;
  motivo?: string;
  alteradoPorUserId: string;
  alteradoPorRole: string;
  timestamp: string;
}

// Entidade: AUDITORIA (Registro imutável de acessos e transições)
export interface RegistroAuditoria {
  id: string;
  subpedidoId?: string;
  pedidoPrincipalId?: string;
  lojaId?: string;
  userId: string;
  userRole: string;
  acao: string;
  detalhes: string;
  dadosLiberadosSnapshot?: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

// Dados Protegidos do Cliente (Visíveis ao Lojista APENAS após validação da taxa)
export interface DadosClienteProtegidos {
  nomeCompleto: string;
  telefoneContato: string;
  email: string;
  enderecoCompleto: string;
  bairro: string;
  cidade: string;
  pontoReferencia?: string;
  instrucoesEntrega?: string;
}

// Visualização Restrita do Lojista (Antes de COMPRA_VALIDADA e LIBERAR_DADOS_DO_CLIENTE)
export interface VisaoRestritaLojistaSubpedido {
  subpedidoId: string;
  codigoSubpedido: string;
  lojaId: string;
  status: SubpedidoStatus;
  clienteVerificado: boolean;
  regiaoAproximada: string;
  cidade: string;
  modalidade: ModalityType;
  itens: {
    produtoId: string;
    nomeProduto: string;
    imagemProduto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    variacoes?: Record<string, string>;
    statusItem: ItemPedidoStatus;
  }[];
  valorMercadorias: number;
  taxaPlataformaValor: number;
  taxaPlataformaRate: number; // 0.10
  criadoEm: string;
}

// Entidade: SUBPEDIDOS (Um subpedido pertence a SOMENTE UMA loja)
export interface Subpedido {
  id: string;
  pedidoPrincipalId: string;
  codigoSubpedido: string; // Ex: "#10001-A", "#10001-B"
  lojaId: string;
  lojaNome: string;
  status: SubpedidoStatus;
  modalidade: ModalityType;
  
  // Financeiro do Subpedido: Mercadorias (direto ao lojista) vs Taxa (10% à plataforma)
  valorMercadorias: number; // R$ pago diretamente pelo cliente ao lojista
  taxaPlataformaRate: number; // 0.10 (10%)
  taxaPlataformaValor: number; // R$ 10% calculado sobre o valorMercadorias
  taxaPaga: boolean;
  taxaConfirmadaAt?: string;

  // Segurança e Liberação de Dados Privados
  dadosClienteLiberados: boolean;
  dadosClienteLiberadosAt?: string;
  
  // Confirmação direta de pagamento de mercadorias entre Cliente e Lojista
  pagamentoMercadoriaDiretoStatus: 'PENDENTE_PAGAMENTO_DIRETO' | 'PAGO_DIRETAMENTE_AO_LOJISTA';
  pagamentoMercadoriaConfirmadoAt?: string;

  // Rastreamento & Auditoria
  confirmacoes: RegistroConfirmacoes;
  entrega: RegistroEntrega;
  itens: ItemPedido[];
  
  criadoEm: string;
  atualizadoEm: string;
}

// Entidade: PEDIDOS_PRINCIPAIS (Um pedido principal pode possuir vários subpedidos)
export interface PedidoPrincipal {
  id: string;
  code: string; // Ex: "#10001"
  userId: string;
  
  // Dados do Cliente (Protegidos centralmente no banco)
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCpf?: string;
  customerNeighborhood: string;
  customerCity: string;
  customerAddressFull: string;
  customerReferencePoint?: string;
  customerDeliveryInstructions?: string;
  clientVerified: boolean;

  // Totais Consolidados (Mercadorias separadas de Taxas da Plataforma)
  totalMercadorias: number; // Soma de todos os subpedidos
  totalTaxasPlataforma: number; // Soma das taxas (10%)
  taxaPlataformaTaxRate: number; // 0.10 (10%)
  
  status: PedidoPrincipalStatus;
  subpedidos: Subpedido[];
  pagamentoTaxa?: PagamentoTaxa;
  
  avisoLegal: string; // COMPRA_VALIDADA_AVISO
  
  criadoEm: string;
  atualizadoEm: string;
  concluidoEm?: string;
  canceladoEm?: string;
}

// Contexto ativo para abertura de modal de chat do subpedido
export interface ActiveChatSubOrder {
  subpedidoId: string;
  pedidoPrincipalId?: string;
  codigoSubpedido?: string;
  merchantId?: string;
  merchantName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  orderTitle?: string;
  orderStatus?: string;
  securityCode?: string;
  orderTotal?: number;
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  isDirectProductChat?: boolean;
}

export interface SubOrderMessage {
  id: string;
  subpedidoId: string; // ID do subpedido vinculado (ex: "sub-10001-a")
  pedidoPrincipalId?: string; // ID do pedido consolidado (ex: "ord-principal-10001")
  codigoSubpedido?: string; // Código amigável (ex: "#10001-A")
  senderId: string; // ID do usuário remetente
  senderName: string; // Nome do remetente
  senderRole: 'CLIENTE' | 'VENDEDOR' | 'MASTER' | 'SISTEMA'; // Papel do remetente
  recipientId?: string; // Destinatário específico (opcional)
  recipientName?: string;
  recipientRole?: 'CLIENTE' | 'VENDEDOR' | 'MASTER' | 'ALL';
  message: string; // Texto da mensagem
  attachmentUrl?: string; // URL de foto/comprovante/anexo
  readBy: string[]; // Lista de IDs de usuários que já visualizaram
  isInternalNote?: boolean; // Nota interna visível apenas para Lojista e Master
  systemEventType?: 'ORDER_CREATED' | 'STOCK_CONFIRMED' | 'STOCK_REJECTED' | 'STATUS_CHANGED' | 'COMMISSION_PAID' | 'COMMISSION_CONFIRMED' | 'PICKUP_VALIDATED' | string;
  statusBadge?: string;
  createdAt: string; // ISO 8601
}

// =========================================================================
// EQUIPE COMERCIAL, VENDEDORES ATRELADOS AO MASTER, BOLETOS & ORGANOGRAMA
// =========================================================================

export type SalesRoleLevel = 'COORDENADOR_REGIONAL' | 'SUPERVISOR_VENDAS' | 'CONSULTOR_SENIOR' | 'CONSULTOR_JUNIOR';

export type SalesAgentStatus = 'active' | 'paused' | 'blocked';

export interface SalesAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  roleLevel: SalesRoleLevel;
  roleTitle: string; // Ex: "Consultor de Vendas Regional"
  supervisorId?: string; // ID do supervisor / coordenador no organograma (ou undefined se reporta ao Master)
  supervisorName?: string;
  assignedRegion: string; // Ex: "Centro & Japuíba", "Papucaia / Agrobrasil", "Guapiaçu"
  commissionRatePercent: number; // Decidido pelo Master (Ex: 15% do valor da assinatura ou venda)
  commissionBonusPerActivation: number; // Bônus fixo por novo cliente/loja ativada (Ex: R$ 30,00)
  pixKey: string;
  pixKeyType: 'CPF' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  status: SalesAgentStatus;
  monthlyTargetCount: number; // Meta mensal de novos cadastros (Ex: 10 lojas)
  monthlyTargetRevenue: number; // Meta mensal de faturamento em R$ (Ex: R$ 3.000,00)
  avatarUrl?: string;
  createdAt: string;
  notes?: string;
}

export interface CommercialArea {
  id: string;
  name: string; // Ex: "Centro & Japuíba"
  code: string; // Ex: "AREA-CENTRO"
  neighborhoods: string[]; // Ex: ["Centro", "Japuíba", "Castália", "Campo do Prado"]
  supervisorId?: string; // ID do Coordenador ou Supervisor responsável
  supervisorName?: string;
  targetMonthlyActivations: number;
  notes?: string;
  color?: string; // Cor de identificação
}

export interface SalesOrganogramNode {
  id: string;
  agentId: string;
  name: string;
  roleTitle: string;
  level: number; // 0 = Master Supremo, 1 = Coordenador Regional, 2 = Supervisor de Vendas, 3 = Consultor Comercial
  parentId?: string;
  assignedRegion: string;
  salesCount: number;
  revenueTotal: number;
  status: SalesAgentStatus;
  avatarUrl?: string;
  commissionRatePercent: number;
  phone: string;
  children?: SalesOrganogramNode[];
}

export type BoletoRequestStatus = 
  | 'PENDENTE_EMISSAO'      // Vendedor enviou, aguardando Master emitir boleto
  | 'BOLETO_ENVIADO'        // Master emitiu e enviou boleto ao cliente
  | 'PAGAMENTO_CONFIRMADO'  // Boleto pago e confirmado pelo Master (Comissão Liberada)
  | 'CANCELADO';            // Cancelado por recusa ou desistência

export interface BoletoBillingRequest {
  id: string;
  code: string; // Ex: "BOL-2026-001"
  agentId: string; // Vendedor que realizou o cadastro/venda
  agentName: string;
  agentPixKey: string;
  
  // Dados do cliente/lojista cadastrado
  clientType: 'LOJISTA' | 'PRESTADOR' | 'USUARIO_VIP';
  clientName: string; // Razão Social ou Nome Completo
  tradeName?: string; // Nome Fantasia
  documentNumber: string; // CNPJ ou CPF
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  neighborhood: string;
  
  // Detalhes do Plano ou Serviço Vendido
  chosenPlan: MembershipTier;
  planTitle: string;
  billingFrequency: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  amount: number; // Valor da cobrança (R$)
  
  // Comissão calculada para o Vendedor
  commissionRatePercent: number; // Ex: 20%
  commissionAmount: number; // Ex: R$ 39,98
  commissionStatus: 'PENDENTE' | 'LIBERADA' | 'PAGA'; // Liberada APÓS confirmação de pagamento do boleto
  commissionPaidAt?: string;
  commissionPaymentReceipt?: string;
  
  // Dados do Boleto Bancário
  dueDate: string; // Data de vencimento
  barcodeDigits?: string; // Linha digitável do boleto
  boletoPdfUrl?: string; // Link para PDF ou visualização do boleto
  pixCopiaECola?: string; // Linha Pix Copia e Cola alternativa
  
  status: BoletoRequestStatus;
  requestedAt: string;
  sentToClientAt?: string;
  paidAt?: string;
  confirmedByMasterAt?: string;
  masterNotes?: string;

  // Rastreamento e Liquidação Automática via Webhooks
  webhookConfirmed?: boolean;
  webhookGateway?: WebhookGateway;
  webhookEventId?: string;
  webhookReceivedAt?: string;
  externalTransactionId?: string;
}

// =========================================================================
// CAMADA DE PROCESSAMENTO DE WEBHOOKS & LIQUIDAÇÃO DE BOLETOS
// =========================================================================

export type WebhookGateway = 'ASAAS' | 'MERCADO_PAGO' | 'BANCO_INTER' | 'IUGU' | 'GERENCIANET_EFI' | 'GENERIC';

export type WebhookStatus = 'SUCCESS' | 'IGNORED' | 'ERROR' | 'UNMATCHED';

export interface BoletoWebhookEvent {
  id: string;
  gateway: WebhookGateway;
  eventType: string; // Ex: "PAYMENT_CONFIRMED", "payment.updated", "BOLETO_PAID", "PIX_RECEIVED"
  boletoCode?: string;
  boletoRequestId?: string;
  agentId?: string;
  agentName?: string;
  clientName?: string;
  amountPaid?: number;
  commissionAmount?: number;
  commissionReleased?: boolean;
  externalTransactionId?: string;
  receivedAt: string;
  processedAt?: string;
  durationMs?: number;
  status: WebhookStatus;
  statusMessage: string;
  payload: Record<string, any>;
  headers?: Record<string, string>;
  ipAddress?: string;
}

export interface WebhookConfig {
  endpointPath: string;
  secretKey: string;
  enabledGateways: WebhookGateway[];
  autoReleaseCommission: boolean; // Se true, transiciona comissão para LIBERADA automaticamente
  autoActivateClient: boolean;    // Se true, marca cliente como ATIVO_PAGO
  autoApproveMerchant: boolean;   // Se true, aprova o lojista/prestador no catálogo
  requireSignatureValidation: boolean;
  notifySalesAgentInApp: boolean;
  simulateDelayMs?: number;
}

export interface AgentRegisteredClient {
  id: string;
  agentId: string;
  agentName: string;
  clientType: 'LOJISTA' | 'PRESTADOR' | 'USUARIO';
  name: string;
  tradeName?: string;
  documentNumber: string; // CPF ou CNPJ
  email: string;
  phone: string;
  neighborhood: string;
  city: string;
  chosenPlan: MembershipTier;
  billingStatus: 'AGUARDANDO_BOLETO' | 'BOLETO_ENVIADO' | 'ATIVO_PAGO' | 'INADIMPLENTE';
  linkedMerchantId?: string;
  boletoRequestId?: string;
  registeredAt: string;
  notes?: string;
}

export interface CommercialGoal {
  id: string;
  title: string; // Ex: "Expansão de Comércios - Centro & Japuíba"
  targetMonth: string; // Ex: "Setembro / 2026"
  description: string;
  targetCount: number; // Meta de novos lojistas/prestadores (Ex: 15 cadastros)
  targetRevenue: number; // Meta de faturamento em R$ (Ex: R$ 3.000,00)
  rewardDescription: string; // Premiação (Ex: "Bônus de R$ 350,00 no Pix + Certificado Destaque Comercial")
  assignedToAgentId?: string; // 'ALL' ou ID de vendedor específico
  assignedToAgentName?: string; // "Toda a Equipe Comercial" ou Nome do Vendedor
  status: 'EM_ANDAMENTO' | 'CONCLUIDA' | 'EXPIRADA';
  startDate: string;
  endDate: string;
  createdByMasterAt: string;
}

// ==========================================
// MÓDULO DE DELIVERY (V1 - CICLO OPERACIONAL)
// ==========================================

export type DeliveryDriverStatus =
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'APROVADO'
  | 'REPROVADO'
  | 'BLOQUEADO'
  | 'SUSPENSO'
  | 'DESATIVADO';

export type DeliveryOperationalStatus = 'ONLINE' | 'OFFLINE';

export type VehicleType = 'MOTO' | 'CARRO' | 'BICICLETA' | 'VAN';
export type DeliveryVehicleType = VehicleType;

export interface DeliveryDriver {
  id: string;
  userId: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  neighborhood?: string;
  photo: string;
  idDocument: string; // RG / Identidade Oficial
  cnhNumber: string;
  cnhCategory: string; // 'A' | 'B' | 'AB' | 'C' | 'D'
  cnhValidity: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleDocument: string; // CRLV
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'CELULAR' | 'EMAIL' | 'ALEATORIA';
  pixBank?: string;
  termsAccepted: boolean;
  platformRulesAccepted: boolean;
  status: DeliveryDriverStatus;
  operationalStatus: DeliveryOperationalStatus;
  statusReason?: string;
  rating?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  activeRideId?: string;
  registeredAt: string;
  approvedAt?: string;
  lastActiveAt?: string;
  notes?: string;
}

export type DeliveryRideStatus =
  // Nova Máquina de Estados da Entrega (AcheiAqui Delivery Core V2)
  | 'AGUARDANDO_ANALISE'
  | 'CORRECAO_SOLICITADA'
  | 'APROVADA'
  | 'REJEITADA'
  | 'DISPONIVEL_ENTREGADORES'
  | 'ENTREGADOR_SELECIONADO'
  | 'ACEITA'
  | 'EM_DESLOCAMENTO_COLETA'
  | 'CHEGOU_COLETA'
  | 'COLETADA'
  | 'EM_DESLOCAMENTO_ENTREGA'
  | 'CHEGOU_DESTINO'
  | 'AGUARDANDO_CODIGO'
  | 'ENTREGUE'
  | 'AGUARDANDO_LIBERACAO_PAGAMENTO'
  | 'PAGAMENTO_AUTORIZADO'
  | 'PAGAMENTO_PROCESSANDO'
  | 'PAGA'
  | 'PAGAMENTO_FALHOU'
  | 'CANCELADA'
  | 'DEVOLVIDA'
  // Legados para retrocompatibilidade
  | 'CRIADA'
  | 'AGUARDANDO_ENTREGADOR'
  | 'EM_COLETA'
  | 'EM_TRANSITO'
  | 'FINALIZADA'
  | 'OCORRENCIA';

export interface DeliveryRideHistoryItem {
  timestamp: string;
  status: DeliveryRideStatus;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  notes?: string;
}

export interface DeliveryRide {
  id: string;
  delivery_id?: string;
  rideCode: string; // ex: "DEL-84920"
  orderId: string;
  order_id?: string;
  orderCode: string;
  merchantId: string;
  merchant_id?: string;
  merchantName: string;
  merchantPhone: string;
  originAddress: string;
  origem?: string;
  originNeighborhood: string;
  customerId: string;
  customer_id?: string;
  customerName: string;
  customerPhone: string;
  destinationAddress: string;
  destino?: string;
  destinationNeighborhood: string;
  distanceKm: number;
  distancia?: number;
  tipo_veiculo?: 'MOTO' | 'CARRO' | 'BICICLETA' | 'VAN';
  vehicleType?: 'MOTO' | 'CARRO' | 'BICICLETA' | 'VAN';
  observacoes?: string;
  ratePerKmApplied: number; // VALOR_POR_KM na época da criação
  platformFeeApplied: number; // TAXA_PLATAFORMA na época da criação
  driverEarnings: number; // distanceKm * ratePerKmApplied
  valor_entregador?: number;
  totalDeliveryFee: number; // driverEarnings + platformFeeApplied
  valor_calculado?: number;
  customerPaid: boolean;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverPlate?: string;
  driverPhoto?: string;
  status: DeliveryRideStatus;
  confirmationCode: string; // Código de 4 dígitos para confirmação na entrega
  calculationTimestamp: string;
  data_solicitacao?: string;
  hora_solicitacao?: string;
  created_at?: string;
  created_by?: string;
  deviceInfo?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  correctionRequestedReason?: string;
  correctionRequestedAt?: string;
  recalculatedAt?: string;
  recalculatedRatePerKm?: number;
  recalculatedPlatformFee?: number;
  approvedBy?: string;
  approvedAt?: string;
  incidentNotes?: string;
  deliveryProofUrl?: string;
  paymentStatus?: 'PENDENTE' | 'LIBERADO' | 'PROCESSANDO' | 'PAGO' | 'FALHA';
  paymentAuthorizedAt?: string;
  paymentAuthorizedBy?: string;
  paymentPaidAt?: string;
  paymentMethod?: string;
  paymentFailureReason?: string;
  returnReason?: string;
  returnedAt?: string;
  createdAt: string;
  acceptedAt?: string;
  collectedAt?: string;
  deliveredAt?: string;
  finalizedAt?: string;
  history: DeliveryRideHistoryItem[];
}

export interface DeliveryPricingCalculation {
  distanceKm: number;
  ratePerKm: number;
  platformFee: number;
  driverEarnings: number;
  totalDeliveryFee: number;
  calculationTimestamp: string;
  origin: string;
  destination: string;
}



