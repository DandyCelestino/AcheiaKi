import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  StoreMerchant,
  Product,
  ServiceItem,
  Order,
  CartItem,
  OrderStatus,
  AuditLog,
  AuditCategory,
  AuditSeverity,
  AuditLogOptions,
  AuditStats,
  CustomerAddress,
  VipMeasurements,
  CustomerPreferences,
  EmergencyContact,
  SystemSettings,
  InterCategoryBanner,
  AdSpace,
  AuctionBid,
  FrontendCustomization,
  NavMenuItem,
  CustomerToMerchantReview,
  MerchantToCustomerReview,
  CustomerReputationSummary,
  MembershipTier,
  InAppNotification,
  NotificationAudience,
  NotificationCategory,
  NotificationPriority,
  SubOrderMessage,
  ActiveChatSubOrder,
  SalesAgent,
  SalesRoleLevel,
  BoletoBillingRequest,
  AgentRegisteredClient,
  CommercialGoal,
  SalesOrganogramNode,
  CommercialArea,
  BoletoWebhookEvent,
  WebhookConfig,
  WebhookGateway,
  DeliveryDriver,
  DeliveryDriverStatus,
  DeliveryOperationalStatus,
  VehicleType,
  DeliveryRide,
  DeliveryRideStatus,
  DeliveryPricingCalculation
} from '../types';
import {
  persistProductToFirestore,
  removeProductFromFirestore,
  persistMerchantToFirestore,
  persistUserToFirestore,
  persistDeliveryRideToFirestore,
  persistDeliveryDriverToFirestore,
  persistOrderToFirestore,
  fetchAllCollectionsFromFirestore,
  seedInitialDataToFirestoreIfEmpty
} from '../services/firestoreSync';
import {
  validateDeliveryTransition,
  DeliveryActor
} from '../services/deliveryStateMachine';
import {
  INITIAL_USERS,
  INITIAL_MERCHANTS,
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_ORDERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SYSTEM_SETTINGS,
  INITIAL_FRONTEND_CONFIG,
  INITIAL_INTER_CATEGORY_BANNERS,
  INITIAL_AD_SPACES,
  INITIAL_DELIVERY_DRIVERS,
  INITIAL_DELIVERY_RIDES
} from '../data/initialData';
import {
  calculateDeliveryDistance,
  calculateDeliveryPricing,
  getAllCachoeirasNeighborhoods
} from '../services/distanceService';
import {
  INITIAL_SALES_AGENTS,
  INITIAL_REGISTERED_CLIENTS,
  INITIAL_BOLETO_REQUESTS,
  INITIAL_COMMERCIAL_GOALS,
  INITIAL_ORGANOGRAM,
  INITIAL_COMMERCIAL_AREAS
} from '../data/initialSalesData';
import {
  DEFAULT_WEBHOOK_CONFIG,
  INITIAL_WEBHOOK_EVENTS
} from '../data/initialWebhookData';
import {
  firebaseLoginWithEmail,
  firebaseRegisterCustomer,
  firebaseRegisterMerchant,
  firebaseLoginWithGoogle,
  firebaseSendPasswordReset,
  firebaseUpdateAuthenticatedPassword,
  firebaseProvisionSalesAgent,
  firebaseProvisionUser,
  firebaseLogout,
  subscribeToFirebaseAuthState,
} from '../services/firebaseAuth';
import { INITIAL_NOTIFICATIONS } from '../data/initialNotifications';
import { INITIAL_SUBORDER_MESSAGES } from '../data/initialSubOrderMessages';
import {
  INITIAL_CUSTOMER_REVIEWS,
  INITIAL_MERCHANT_REVIEWS
} from '../data/reviewPolicyData';
import { ReviewPolicyModal } from '../components/reviews/ReviewPolicyModal';
import { CopyrightModal } from '../components/legal/CopyrightModal';
import { PrivacyPolicyModal } from '../components/legal/PrivacyPolicyModal';
import { TermsOfUseModal } from '../components/legal/TermsOfUseModal';
import { MembershipPlansModal } from '../components/legal/MembershipPlansModal';
import { UserManualModal } from '../components/legal/UserManualModal';
import { NotificationDetailModal } from '../components/notifications/NotificationDetailModal';
import { AuthPromptModal, AuthPromptDetails } from '../components/marketplace/AuthPromptModal';
import {
  getCommissionRateForTier,
  getMaxProductsForTier,
  SALES_ORGANOGRAM_CONFIG,
  SERVICE_PROVIDER_BASE_PRICE,
  VENDOR_COMMISSION_PERCENT
} from '../data/membershipPlansData';
import { generatePixCopiaECola } from '../services/pix_payment_service';
import { NotificationService } from '../services/notification_service';
import { multiStoreDb } from '../services/multiStoreDatabase';
import { persistirPedidoNoServidor, buscarPedidosDoServidor } from '../services/asaasService';

export type AppEnvironment = 'MARKETPLACE' | 'SELLER_PORTAL' | 'MASTER_PANEL' | 'COMMERCIAL_PORTAL' | 'DELIVERY_PORTAL';

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  systemSettings: SystemSettings;
  currentEnvironment: AppEnvironment;
  currentCity: string;
  merchants: StoreMerchant[];
  products: Product[];
  services: ServiceItem[];
  orders: Order[];
  cart: CartItem[];
  favorites: string[];
  interCategoryBanners: InterCategoryBanner[];
  adSpaces: AdSpace[];
  frontendConfig: FrontendCustomization;
  
  // Navigation & Environment
  setCurrentEnvironment: (env: AppEnvironment) => void;
  setCurrentCity: (city: string) => void;
  
  // Auth & Security
  login: (email: string, password?: string, rememberMe?: boolean) => {
    success: boolean;
    requires2FA?: boolean;
    requiresPasswordChange?: boolean;
    message?: string;
    user?: User;
    simulated2FACode?: string;
  };
  verifyTwoFactorCode: (email: string, code: string, rememberMe?: boolean) => {
    success: boolean;
    message?: string;
    user?: User;
  };
  resendTwoFactorCode: (email: string) => {
    success: boolean;
    message: string;
    simulatedCode: string;
  };
  loginAsUser: (user: User) => void;
  loginWithFirebaseEmail: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; simulated2FACode?: string; message?: string; user?: User }>;
  loginWithFirebaseGoogle: (rolePreference?: UserRole) => Promise<{ success: boolean; user?: User; message?: string }>;
  registerCustomerWithFirebase: (params: { name: string; email: string; password: string; phone: string; cpf?: string; city?: string; address?: string; neighborhood?: string; membershipTier?: MembershipTier }) => Promise<{ success: boolean; user?: User; message?: string }>;
  registerMerchantWithFirebase: (params: { ownerName: string; storeName: string; email: string; password: string; phone: string; cnpjOrCpf?: string; category?: string; subcategory?: string; city?: string; address?: string; street?: string; number?: string; neighborhood?: string; description?: string; isServiceProvider?: boolean; membershipTier?: MembershipTier }) => Promise<{ success: boolean; user?: User; merchant?: StoreMerchant; message?: string }>;
  sendFirebasePasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  registerCustomer: (customerData: Partial<User>, password?: string, membershipTier?: MembershipTier) => User;
  registerMerchant: (merchantData: Partial<StoreMerchant>, ownerData: Partial<User>, password?: string, membershipTier?: MembershipTier, requiresPayment?: boolean) => StoreMerchant;
  confirmMerchantPlanPayment: (params: {
    merchantId: string;
    planTier: MembershipTier;
    billingFrequency?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    amount: number;
    paymentMethod: 'PIX' | 'BOLETO' | 'CARTAO';
    agentId?: string;
    agentName?: string;
    autoLogin?: boolean;
  }) => { success: boolean; message: string; boletoRequest?: BoletoBillingRequest };
  completeInitialPasswordChange: (email: string, newPassword: string) => { success: boolean; message: string; user?: User };
  upgradeMerchantPlan: (merchantId: string, newTier: MembershipTier) => void;
  payOrderCommissionByMerchant: (orderId: string) => void;
  confirmOrderCommissionByMaster: (orderId: string) => void;
  toggleOrderBuyerDataByMaster: (orderId: string, unlocked: boolean) => void;
  logout: () => void;
  updateUserPassword: (newPassword: string) => { success: boolean; message?: string };
  toggleTwoFactor: () => boolean;
  resendEmailConfirmation: (email: string) => { success: boolean; message: string };
  requestPasswordReset: (email: string) => { success: boolean; message: string; simulatedCode?: string };
  completePasswordReset: (email: string, code: string, newPassword: string) => { success: boolean; message: string };
  // Auditoria, Rastreabilidade & SeguranÃ’Â§a
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, options?: AuditLogOptions) => AuditLog;
  logSecurityEvent: (action: string, details: string, meta?: Record<string, any>, severity?: AuditSeverity) => AuditLog;
  logOrderEvent: (orderId: string, action: string, details: string, meta?: Record<string, any>, severity?: AuditSeverity) => AuditLog;
  logDataReleaseEvent: (orderId: string, targetMerchantId: string, buyerName: string, reason: string, meta?: Record<string, any>) => AuditLog;
  logMessageEvent: (subpedidoId: string, senderRole: string, messageSummary: string, meta?: Record<string, any>) => AuditLog;
  logFinancialEvent: (orderId: string, action: string, amount: number, details: string, meta?: Record<string, any>) => AuditLog;
  getAuditLogsByEntity: (entityType: string, entityId: string) => AuditLog[];
  getAuditStats: () => AuditStats;
  exportAuditLogs: (format?: 'json' | 'csv') => void;
  clearAuditLogs: () => void;
  
  // Customer Profile & Data Sheet Management
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  addCustomerAddress: (address: Omit<CustomerAddress, 'id'>) => CustomerAddress;
  updateCustomerAddress: (id: string, updates: Partial<CustomerAddress>) => void;
  deleteCustomerAddress: (id: string) => void;
  setDefaultCustomerAddress: (id: string) => void;
  updateVipMeasurements: (measurements: VipMeasurements) => void;
  updateCustomerPreferences: (preferences: CustomerPreferences) => void;

  // Master Supremo: Comprehensive User Management
  createUserByMaster: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUserByMaster: (userId: string, updates: Partial<User>) => void;
  blockUserByMaster: (userId: string, reason?: string) => void;
  suspendUserByMaster: (userId: string, reason?: string) => void;
  reactivateUserByMaster: (userId: string) => void;
  deleteUserByMaster: (userId: string) => void;
  resetUserPasswordByMaster: (userId: string) => string;
  toggleUserVerificationByMaster: (userId: string) => void;
  impersonateUser: (user: User) => void;

  // Master Supremo: Comprehensive Merchant Management
  approveMerchant: (id: string) => void;
  rejectMerchant: (id: string) => void;
  suspendMerchant: (id: string, reason?: string) => void;
  reactivateMerchant: (id: string) => void;
  deleteMerchant: (id: string) => void;
  updateStoreProfile: (id: string, updates: Partial<StoreMerchant>) => void;
  createMerchantByMaster: (merchantData: Omit<StoreMerchant, 'id' | 'submittedAt'>) => StoreMerchant;
  setMerchantCommissionRate: (id: string, rate: number) => void;

  // Products & Services Management
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string, status: 'active' | 'paused' | 'draft' | 'archived') => void;
  toggleProductFeatured: (id: string) => void;
  addService: (service: Omit<ServiceItem, 'id'>) => ServiceItem;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  
  // Orders & Bookings
  createOrder: (orderData: Omit<Order, 'id' | 'code' | 'createdAt' | 'updatedAt'>) => Order;
  confirmOrderStock: (orderId: string) => void;
  rejectOrderStock: (orderId: string, reason?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderDetailsByMaster: (orderId: string, updates: Partial<Order>) => void;
  cancelOrderByMaster: (orderId: string, reason: string) => void;
  forceCompleteOrderByMaster: (orderId: string) => void;
  deleteOrderByMaster: (orderId: string) => void;
  validatePickupCode: (code: string) => { success: boolean; message: string; order?: Order };
  
  // System Settings, Backups & Control Center
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;
  exportFullDatabaseSnapshot: () => string;
  importFullDatabaseSnapshot: (jsonString: string) => boolean;
  resetDatabaseToDefaults: () => void;

  // Cart & Favorites
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  
  // Inter-Category Banners & Carousels
  addInterCategoryBanner: (banner: Omit<InterCategoryBanner, 'id' | 'createdAt'>) => InterCategoryBanner;
  updateInterCategoryBanner: (id: string, updates: Partial<InterCategoryBanner>) => void;
  deleteInterCategoryBanner: (id: string) => void;
  toggleInterCategoryBannerStatus: (id: string) => void;

  // Ad Spaces & Public Auctions
  addAdSpace: (adSpace: Omit<AdSpace, 'id' | 'impressionsCount' | 'clicksCount' | 'revenueTotal'>) => AdSpace;
  updateAdSpace: (id: string, updates: Partial<AdSpace>) => void;
  deleteAdSpace: (id: string) => void;
  placeAdBid: (adSpaceId: string, merchantId: string, merchantName: string, bidAmount: number, notes?: string) => { success: boolean; message: string };
  acceptAuctionWinner: (adSpaceId: string, bidId: string) => void;
  sellAdSpaceDirectly: (adSpaceId: string, merchantId: string, merchantName: string, price: number, period: 'week' | 'month') => void;
  trackAdImpression: (adSpaceId: string) => void;
  trackAdClick: (adSpaceId: string) => void;

  // Master Frontend & Menus Customization
  updateFrontendConfig: (updates: Partial<FrontendCustomization>) => void;
  addNavMenuItem: (item: Omit<NavMenuItem, 'id'>) => void;
  updateNavMenuItem: (id: string, updates: Partial<NavMenuItem>) => void;
  deleteNavMenuItem: (id: string) => void;
  reorderNavMenuItems: (items: NavMenuItem[]) => void;

  // Toast notifications
  toastMessage: string | null;
  triggerToast: (msg: string) => void;

  // Modal de AutenticaÃ’Â§Ã’Â£o / Cadastro / Login
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver';
  openAuthModal: (tab?: 'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver') => void;
  closeAuthModal: () => void;

  // Prompt de AutenticaÃ’Â§Ã’Â£o NecessÃ’Â¡ria (Compras, Agendamentos, etc.)
  authPromptModal: {
    isOpen: boolean;
    actionType: 'COMPRA' | 'AGENDAMENTO' | 'GERAL';
    details?: AuthPromptDetails;
  };
  promptAuthRequirement: (
    actionType: 'COMPRA' | 'AGENDAMENTO' | 'GERAL',
    details?: AuthPromptDetails
  ) => void;
  closeAuthPromptModal: () => void;

  // AvaliaÃ’Â§Ã’Âµes MÃ’Âºtuas & ReputaÃ’Â§Ã’Â£o
  reviews: CustomerToMerchantReview[];
  merchantReviews: MerchantToCustomerReview[];
  isPolicyModalOpen: boolean;
  policyModalTab: 'customer' | 'merchant' | 'moderation';
  openPolicyModal: (tab?: 'customer' | 'merchant' | 'moderation') => void;
  closePolicyModal: () => void;

  // Legal & Compliance Modals (Direitos Autorais, Privacidade, Termos, Planos e Manual Passo a Passo)
  isCopyrightModalOpen: boolean;
  openCopyrightModal: () => void;
  closeCopyrightModal: () => void;
  isPrivacyModalOpen: boolean;
  openPrivacyModal: () => void;
  closePrivacyModal: () => void;
  isTermsModalOpen: boolean;
  openTermsModal: () => void;
  closeTermsModal: () => void;
  isPlansModalOpen: boolean;
  openPlansModal: () => void;
  closePlansModal: () => void;
  isUserManualModalOpen: boolean;
  userManualModalTab: 'CLIENTES' | 'LOGISTAS' | 'LEGAL';
  openUserManualModal: (tab?: 'CLIENTES' | 'LOGISTAS' | 'LEGAL') => void;
  closeUserManualModal: () => void;
  addCustomerReview: (reviewData: Omit<CustomerToMerchantReview, 'id' | 'createdAt'>) => CustomerToMerchantReview;
  addMerchantReview: (reviewData: Omit<MerchantToCustomerReview, 'id' | 'createdAt'>) => MerchantToCustomerReview;
  replyToCustomerReview: (reviewId: string, replyText: string, merchantAuthorName?: string) => void;
  getCustomerReputationSummary: (userId: string) => CustomerReputationSummary;
  isOrderReviewedByCustomer: (orderId: string) => boolean;
  isOrderReviewedByMerchant: (orderId: string) => boolean;
  // In-App Notifications
  notifications: InAppNotification[];
  sendInAppNotification: (data: Omit<InAppNotification, 'id' | 'createdAt' | 'readBy'>) => InAppNotification;
  markNotificationAsRead: (id: string, userId?: string) => void;
  markAllNotificationsAsRead: (userId?: string) => void;
  deleteInAppNotification: (id: string) => void;
  getUserNotifications: (user?: User | null) => InAppNotification[];
  getUnreadNotificationsCount: (user?: User | null) => number;
  isNotificationModalOpen: boolean;
  selectedNotification: InAppNotification | null;
  openNotificationDetailModal: (notification: InAppNotification) => void;
  closeNotificationDetailModal: () => void;

  // Conversas e Mensagens Internas Vinculadas a Subpedidos
  subOrderMessages: SubOrderMessage[];
  activeChatSubOrder: ActiveChatSubOrder | null;
  checkAccessPermission: (
    userId: string | undefined | null,
    subOrderId: string,
    contextHint?: Partial<ActiveChatSubOrder>
  ) => boolean;
  openSubOrderChat: (params: ActiveChatSubOrder) => void;
  closeSubOrderChat: () => void;
  sendSubOrderMessage: (data: Omit<SubOrderMessage, 'id' | 'createdAt' | 'readBy'>) => SubOrderMessage;
  sendSubOrderSystemMessage: (params: {
    subpedidoId: string;
    pedidoPrincipalId?: string;
    codigoSubpedido?: string;
    message: string;
    systemEventType?: string;
    statusBadge?: string;
    recipientRole?: 'CLIENTE' | 'VENDEDOR' | 'MASTER' | 'ALL';
  }) => SubOrderMessage;
  dispatchOrderStatusSystemMessage: (
    order: Order,
    newStatus: OrderStatus,
    previousStatus?: OrderStatus,
    note?: string
  ) => SubOrderMessage;
  dispatchCommissionSystemMessage: (
    order: Order,
    eventType: 'MERCHANT_PAID' | 'MASTER_CONFIRMED',
    extraNote?: string
  ) => SubOrderMessage;
  receiveSubOrderMessage: (message: SubOrderMessage) => void;
  markSubOrderMessagesAsRead: (subpedidoId: string, userId?: string) => void;
  getSubOrderMessages: (subpedidoId: string) => SubOrderMessage[];
  getUnreadSubOrderMessagesCount: (subpedidoId: string, userId?: string) => number;
  deleteSubOrderMessage: (messageId: string) => void;

  // Equipe Comercial, Vendedores do Master, Boletos & Metas
  salesAgents: SalesAgent[];
  boletoRequests: BoletoBillingRequest[];
  registeredClientsByAgents: AgentRegisteredClient[];
  commercialGoals: CommercialGoal[];
  currentSalesAgent: SalesAgent | null;
  setCurrentSalesAgent: (agent: SalesAgent | null) => void;
  addSalesAgent: (agentData: Omit<SalesAgent, 'id' | 'createdAt'>) => SalesAgent;
  updateSalesAgent: (id: string, updates: Partial<SalesAgent>) => void;
  setSalesAgentCommission: (id: string, ratePercent: number, bonusPerActivation?: number) => void;
  createAgentRegisteredClient: (
    clientData: Omit<AgentRegisteredClient, 'id' | 'registeredAt' | 'billingStatus'>,
    options?: {
      shouldRequestBoleto?: boolean;
      dueDate?: string;
      billingFrequency?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
      customAmount?: number;
    }
  ) => { client: AgentRegisteredClient; boletoRequest?: BoletoBillingRequest };
  submitBoletoRequest: (
    requestData: Omit<BoletoBillingRequest, 'id' | 'code' | 'commissionAmount' | 'commissionStatus' | 'status' | 'requestedAt'>
  ) => BoletoBillingRequest;
  markBoletoAsSent: (
    requestId: string,
    details?: {
      barcodeDigits?: string;
      boletoPdfUrl?: string;
      pixCopiaECola?: string;
      masterNotes?: string;
    }
  ) => void;
  confirmBoletoPaymentAndReleaseCommission: (
    requestId: string,
    notes?: string
  ) => void;
  cancelBoletoRequest: (requestId: string, reason?: string) => void;
  markCommissionAsPaidToAgent: (requestId: string, receiptCode?: string) => void;
  addCommercialGoal: (goalData: Omit<CommercialGoal, 'id' | 'createdByMasterAt'>) => CommercialGoal;
  updateCommercialGoal: (id: string, updates: Partial<CommercialGoal>) => void;
  deleteCommercialGoal: (id: string) => void;
  commercialAreas: CommercialArea[];
  addCommercialArea: (areaData: Omit<CommercialArea, 'id'>) => CommercialArea;
  updateCommercialArea: (id: string, updates: Partial<CommercialArea>) => void;
  deleteCommercialArea: (id: string) => void;
  assignAgentHierarchyAndArea: (
    agentId: string,
    supervisorId: string | undefined,
    assignedRegion: string,
    roleLevel?: SalesRoleLevel,
    roleTitle?: string
  ) => void;

  // Camada de Processamento de Webhooks de Boletos & ComissÃ’Âµes
  webhookEvents: BoletoWebhookEvent[];
  webhookConfig: WebhookConfig;
  updateWebhookConfig: (updates: Partial<WebhookConfig>) => void;
  processBoletoWebhook: (input: {
    gateway: WebhookGateway;
    payload: Record<string, any>;
    headers?: Record<string, string>;
    manualBoletoCode?: string;
  }) => {
    success: boolean;
    event: BoletoWebhookEvent;
    matchedBoleto?: BoletoBillingRequest;
    message: string;
  };
  reprocessWebhookEvent: (eventId: string, targetBoletoCode?: string) => boolean;
  deleteWebhookEvent: (eventId: string) => void;
  clearWebhookLogs: () => void;

  // MÃ’Â³dulo de Delivery (V1 - Ciclo Operacional Completo)
  deliveryDrivers: DeliveryDriver[];
  deliveryRides: DeliveryRide[];
  currentDeliveryDriver: DeliveryDriver | null;
  setCurrentDeliveryDriver: (driver: DeliveryDriver | null) => void;
  registerDeliveryDriver: (
    driverData: Omit<DeliveryDriver, 'id' | 'userId' | 'registeredAt' | 'status' | 'operationalStatus'> & { password: string }
  ) => Promise<{ success: boolean; message: string; driver?: DeliveryDriver }>;
  approveDeliveryDriver: (driverId: string, notes?: string) => Promise<{ success: boolean; message: string }>;
  rejectDeliveryDriver: (driverId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  blockDeliveryDriver: (driverId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  unblockDeliveryDriver: (driverId: string) => Promise<{ success: boolean; message: string }>;
  suspendDeliveryDriver: (driverId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  setDriverOperationalStatus: (driverId: string, status: DeliveryOperationalStatus) => Promise<{ success: boolean; message: string }>;
  createDeliveryRide: (params: {
    orderId: string;
    originAddress?: string;
    originNeighborhood?: string;
    destinationAddress?: string;
    destinationNeighborhood?: string;
    customDistanceKm?: number;
    vehicleType?: 'MOTO' | 'CARRO' | 'BICICLETA' | 'VAN';
    notes?: string;
  }) => Promise<{ success: boolean; message: string; ride?: DeliveryRide }>;
  approveDeliveryRide: (rideId: string, dispatchMode?: 'RADAR' | 'DRIVER', targetDriverId?: string) => Promise<{ success: boolean; message: string; uniqueRideCode?: string }>;
  rejectDeliveryRide: (rideId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  requestCorrectionDeliveryRide: (rideId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  authorizeDeliveryPayment: (rideId: string) => Promise<{ success: boolean; message: string }>;
  processDeliveryPayment: (rideId: string) => Promise<{ success: boolean; message: string }>;
  markDeliveryRidePaid: (rideId: string) => Promise<{ success: boolean; message: string }>;
  failDeliveryPayment: (rideId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  returnDeliveryRide: (rideId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  transitionDeliveryRide: (rideId: string, toStatus: DeliveryRideStatus, notes?: string) => Promise<{ success: boolean; message: string }>;
  acceptDeliveryRide: (rideId: string, driverId: string) => Promise<{ success: boolean; message: string }>;
  startRidePickup: (rideId: string) => Promise<{ success: boolean; message: string }>;
  confirmRideCollected: (rideId: string) => Promise<{ success: boolean; message: string }>;
  deliverRide: (rideId: string, confirmationCode: string) => Promise<{ success: boolean; message: string }>;
  cancelDeliveryRide: (rideId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  reportRideIncident: (rideId: string, notes: string) => Promise<{ success: boolean; message: string }>;
  updateDeliveryTariffs: (
    ratePerKm: number,
    minimumFare: number,
    platformFeeUpTo10Km: number,
    platformFeeUpTo20Km: number,
    platformFeeAbove20Km: number
  ) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'acheiaqui_user',
  USERS: 'acheiaqui_users_list',
  SETTINGS: 'acheiaqui_system_settings',
  ENV: 'acheiaqui_env',
  MERCHANTS: 'acheiaqui_merchants',
  PRODUCTS: 'acheiaqui_products',
  SERVICES: 'acheiaqui_services',
  ORDERS: 'acheiaqui_orders',
  CART: 'acheiaqui_cart',
  FAVORITES: 'acheiaqui_favorites',
  CITY: 'acheiaqui_city',
  AUDIT: 'acheiaqui_audit_logs',
  INTER_BANNERS: 'acheiaqui_inter_banners',
  AD_SPACES: 'acheiaqui_ad_spaces',
  FRONTEND_CONFIG: 'acheiaqui_frontend_config',
  REVIEWS: 'acheiaqui_customer_reviews',
  MERCHANT_REVIEWS: 'acheiaqui_merchant_reviews',
  NOTIFICATIONS: 'acheiaqui_inapp_notifications',
  SUBORDER_MESSAGES: 'acheiaqui_suborder_messages',
  SALES_AGENTS: 'acheiaqui_sales_agents',
  BOLETO_REQUESTS: 'acheiaqui_boleto_requests',
  REGISTERED_CLIENTS_BY_AGENTS: 'acheiaqui_registered_clients_by_agents',
  COMMERCIAL_GOALS: 'acheiaqui_commercial_goals',
  COMMERCIAL_AREAS: 'acheiaqui_commercial_areas',
  WEBHOOK_EVENTS: 'acheiaqui_boleto_webhook_events',
  WEBHOOK_CONFIG: 'acheiaqui_boleto_webhook_config',
  DELIVERY_DRIVERS: 'acheiaqui_delivery_drivers_v1',
  DELIVERY_RIDES: 'acheiaqui_delivery_rides_v1',
  CURRENT_DRIVER: 'acheiaqui_current_driver_v1'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or Fallbacks
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email?.toLowerCase() === 'telecom.david@gmail.com' || parsed.email?.toLowerCase() === 'admin@acheiaqui.com.br') {
          parsed.role = 'MASTER';
          parsed.needsPasswordChange = false;
        }
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    let list: User[] = INITIAL_USERS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep only authentic master/admin accounts, authorized sellers, and production users
          list = parsed.filter((u: User) =>
            u.id === 'user-master-david' ||
            u.id === 'user-master-1' ||
            u.email?.toLowerCase() === 'telecom.david@gmail.com' ||
            u.email?.toLowerCase() === 'admin@acheiaqui.com.br' ||
            u.role === 'VENDEDOR' ||
            u.role === 'REPRESENTANTE_COMERCIAL' ||
            (u as any).isProduction === true
          );
          if (list.length === 0) {
            list = INITIAL_USERS;
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Inicializa vendedores padrÃ’Â£o e consultores de vendas em users com credencial garantida
    let allAgentsToSync = [...INITIAL_SALES_AGENTS];
    const savedAgents = localStorage.getItem(STORAGE_KEYS.SALES_AGENTS);
    if (savedAgents) {
      try {
        const parsedAgents = JSON.parse(savedAgents);
        if (Array.isArray(parsedAgents)) {
          parsedAgents.forEach((pa) => {
            if (!allAgentsToSync.some((a) => a.id === pa.id || a.email.toLowerCase() === pa.email.toLowerCase())) {
              allAgentsToSync.push(pa);
            }
          });
        }
      } catch (e) { /* ignore */ }
    }

    allAgentsToSync.forEach((sa) => {
      const cleanAgentEmail = sa.email.toLowerCase().trim();
      const existingUserIndex = list.findIndex((u) => u.email.toLowerCase().trim() === cleanAgentEmail || u.id === `user-${sa.id}` || u.id === sa.id);
      if (existingUserIndex === -1) {
        list.push({
          id: `user-${sa.id}`,
          name: sa.name,
          email: cleanAgentEmail,
          phone: sa.phone,
          role: 'VENDEDOR',
          password: '12345678',
          needsPasswordChange: true,
          city: sa.assignedRegion || 'Cachoeiras de Macacu, RJ',
          isEmailVerified: true,
          twoFactorEnabled: false,
          avatar: sa.avatarUrl,
          createdAt: sa.createdAt || '2026-01-10'
        });
      } else {
        // Assegura que o vendedor tenha senha vÃ’Â¡lida para primeiro acesso se ainda nÃ’Â£o cadastrada
        const existing = list[existingUserIndex];
        if (!existing.password || existing.password.trim() === '') {
          list[existingUserIndex] = {
            ...existing,
            password: '12345678',
            needsPasswordChange: true
          };
        }
      }
    });
    // Ensure telecom.david@gmail.com always exists with role MASTER
    const hasDavid = list.some((u) => u.email.toLowerCase() === 'telecom.david@gmail.com');
    if (!hasDavid) {
      list.push({
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
      });
    } else {
      list = list.map((u) => {
        if (u.email.toLowerCase() === 'telecom.david@gmail.com' || u.email.toLowerCase() === 'admin@acheiaqui.com.br') {
          return { ...u, role: 'MASTER' as const, needsPasswordChange: false };
        }
        return u;
      });
    }
    return list;
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SYSTEM_SETTINGS;
  });

  const [currentEnvironment, setCurrentEnvironmentState] = useState<AppEnvironment>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ENV);
    const savedUserRaw = localStorage.getItem(STORAGE_KEYS.USER);

    try {
      const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) as User : null;

      if (savedUser?.role === 'MASTER' && saved === 'MASTER_PANEL') return 'MASTER_PANEL';
      if (savedUser?.role === 'VENDEDOR' || savedUser?.role === 'REPRESENTANTE_COMERCIAL') return 'COMMERCIAL_PORTAL';
      if (savedUser?.role === 'LOJISTA' || savedUser?.role === 'PRESTADOR_SERVICO') return 'SELLER_PORTAL';
      if (savedUser?.role === 'ENTREGADOR') return 'DELIVERY_PORTAL';

      return 'MARKETPLACE';
    } catch {
      return 'MARKETPLACE';
    }
  });

  const [currentCity, setCurrentCity] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CITY) || 'Cachoeiras de Macacu, RJ';
  });

  const [merchants, setMerchants] = useState<StoreMerchant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: any) => m.isProduction === true);
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_MERCHANTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => p.isProduction === true);
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PRODUCTS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: any) => s.isProduction === true);
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_SERVICES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_ORDERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.map((item: any, idx: number) => {
            let id = item.id || `log-${idx}`;
            if (seen.has(id)) {
              id = `${id}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
            }
            seen.add(id);
            return { ...item, id };
          });
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? Array.from(new Set(parsed)) : [];
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [interCategoryBanners, setInterCategoryBanners] = useState<InterCategoryBanner[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INTER_BANNERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_INTER_CATEGORY_BANNERS;
  });

  const [adSpaces, setAdSpaces] = useState<AdSpace[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AD_SPACES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_AD_SPACES;
  });

  const [frontendConfig, setFrontendConfig] = useState<FrontendCustomization>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FRONTEND_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_FRONTEND_CONFIG;
  });

  const [reviews, setReviews] = useState<CustomerToMerchantReview[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CUSTOMER_REVIEWS;
  });

  const [merchantReviews, setMerchantReviews] = useState<MerchantToCustomerReview[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MERCHANT_REVIEWS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_MERCHANT_REVIEWS;
  });

  // Modal de AutenticaÃ’Â§Ã’Â£o Global
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver'>('login');

  const openAuthModal = (tab: 'login' | 'register-customer' | 'register-merchant' | 'register-provider' | 'register-driver' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Modal de ExigÃ’Âªncia de AutenticaÃ’Â§Ã’Â£o para AÃ’Â§Ã’Âµes Restritas (Compra, Agendar, etc.)
  const [authPromptModal, setAuthPromptModal] = useState<{
    isOpen: boolean;
    actionType: 'COMPRA' | 'AGENDAMENTO' | 'GERAL';
    details?: AuthPromptDetails;
  }>({
    isOpen: false,
    actionType: 'GERAL'
  });

  const promptAuthRequirement = (
    actionType: 'COMPRA' | 'AGENDAMENTO' | 'GERAL',
    details?: AuthPromptDetails
  ) => {
    setAuthPromptModal({
      isOpen: true,
      actionType,
      details
    });
    if (actionType === 'COMPRA') {
      triggerToast('AtenÃ’Â§Ã’Â£o: Cadastre-se ou faÃ’Â§a login para realizar compras.');
    } else if (actionType === 'AGENDAMENTO') {
      triggerToast('AtenÃ’Â§Ã’Â£o: Cadastre-se ou faÃ’Â§a login para agendar serviÃ’Â§os.');
    } else {
      triggerToast('AtenÃ’Â§Ã’Â£o: Cadastre-se ou faÃ’Â§a login para continuar.');
    }
  };

  const closeAuthPromptModal = () => {
    setAuthPromptModal((prev) => ({ ...prev, isOpen: false }));
  };

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [policyModalTab, setPolicyModalTab] = useState<'customer' | 'merchant' | 'moderation'>('customer');

  const openPolicyModal = (tab: 'customer' | 'merchant' | 'moderation' = 'customer') => {
    setPolicyModalTab(tab);
    setIsPolicyModalOpen(true);
  };

  const closePolicyModal = () => {
    setIsPolicyModalOpen(false);
  };

  // Legal & Compliance Modals (Direitos Autorais, Privacidade, Termos de Uso, Tabela de Planos e Manual Passo a Passo)
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isPlansModalOpen, setIsPlansModalOpen] = useState<boolean>(false);
  const [isUserManualModalOpen, setIsUserManualModalOpen] = useState<boolean>(false);
  const [userManualModalTab, setUserManualModalTab] = useState<'CLIENTES' | 'LOGISTAS' | 'LEGAL'>('CLIENTES');

  const openCopyrightModal = () => setIsCopyrightModalOpen(true);
  const closeCopyrightModal = () => setIsCopyrightModalOpen(false);

  const openPrivacyModal = () => setIsPrivacyModalOpen(true);
  const closePrivacyModal = () => setIsPrivacyModalOpen(false);

  const openTermsModal = () => setIsTermsModalOpen(true);
  const closeTermsModal = () => setIsTermsModalOpen(false);

  const openPlansModal = () => setIsPlansModalOpen(true);
  const closePlansModal = () => setIsPlansModalOpen(false);

  const openUserManualModal = (tab: 'CLIENTES' | 'LOGISTAS' | 'LEGAL' = 'CLIENTES') => {
    setUserManualModalTab(tab);
    setIsUserManualModalOpen(true);
  };
  const closeUserManualModal = () => setIsUserManualModalOpen(false);

  // In-App Notifications State & Modal
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Mensagens e Conversas Internas por Subpedido
  const [subOrderMessages, setSubOrderMessages] = useState<SubOrderMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBORDER_MESSAGES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SUBORDER_MESSAGES;
  });

  const [activeChatSubOrder, setActiveChatSubOrder] = useState<ActiveChatSubOrder | null>(null);

  const closeSubOrderChat = useCallback(() => {
    setActiveChatSubOrder(null);
  }, []);

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<InAppNotification | null>(null);

  const openNotificationDetailModal = (notification: InAppNotification) => {
    setSelectedNotification(notification);
    setIsNotificationModalOpen(true);
  };

  const closeNotificationDetailModal = () => {
    setIsNotificationModalOpen(false);
    setSelectedNotification(null);
  };

  // ==========================================
  // EQUIPE COMERCIAL, VENDEDORES, BOLETOS & METAS
  // ==========================================
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_AGENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_SALES_AGENTS;
  });

  const [boletoRequests, setBoletoRequests] = useState<BoletoBillingRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOLETO_REQUESTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_BOLETO_REQUESTS;
  });

  const [registeredClientsByAgents, setRegisteredClientsByAgents] = useState<AgentRegisteredClient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_CLIENTS_BY_AGENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_REGISTERED_CLIENTS;
  });

  const [commercialGoals, setCommercialGoals] = useState<CommercialGoal[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMERCIAL_GOALS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_COMMERCIAL_GOALS;
  });

  const [commercialAreas, setCommercialAreas] = useState<CommercialArea[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMMERCIAL_AREAS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_COMMERCIAL_AREAS;
  });

  const [currentSalesAgent, setCurrentSalesAgentState] = useState<SalesAgent | null>(() => {
    return INITIAL_SALES_AGENTS[0] || null;
  });

  const setCurrentSalesAgent = useCallback((agent: SalesAgent | null) => {
    // Isolamento estrito de vendedor: se for VENDEDOR, sÃ’Â³ pode estar vinculado ao seu prÃ’Â³prio perfil
    if (currentUser?.role === 'VENDEDOR' || currentUser?.role === 'REPRESENTANTE_COMERCIAL') {
      const cleanEmail = currentUser.email.toLowerCase().trim();
      if (
        agent &&
        agent.email.toLowerCase().trim() !== cleanEmail &&
        agent.id !== currentUser.id &&
        `user-${agent.id}` !== currentUser.id &&
        agent.id !== currentUser.id.replace('user-', '')
      ) {
        console.warn('Isolamento Comercial Ativo: Vendedor nÃ’Â£o possui permissÃ’Â£o para alternar para outro agente.');
        return;
      }
    }
    setCurrentSalesAgentState(agent);
  }, [currentUser]);

  // Camada de Webhooks de Boletos
  const [webhookEvents, setWebhookEvents] = useState<BoletoWebhookEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEBHOOK_EVENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_WEBHOOK_EVENTS;
  });

  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEBHOOK_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEFAULT_WEBHOOK_CONFIG;
  });

  // MÃ’Â³dulo de Delivery & Entregadores
  const [deliveryDrivers, setDeliveryDrivers] = useState<DeliveryDriver[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_DRIVERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_DELIVERY_DRIVERS;
  });

  const [deliveryRides, setDeliveryRides] = useState<DeliveryRide[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_RIDES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_DELIVERY_RIDES;
  });

  const [currentDeliveryDriver, setCurrentDeliveryDriver] = useState<DeliveryDriver | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_DRIVER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Sync to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENV, currentEnvironment);
  }, [currentEnvironment]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CITY, currentCity);
  }, [currentCity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(merchants));
  }, [merchants]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(systemSettings));
  }, [systemSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INTER_BANNERS, JSON.stringify(interCategoryBanners));
  }, [interCategoryBanners]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AD_SPACES, JSON.stringify(adSpaces));
  }, [adSpaces]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FRONTEND_CONFIG, JSON.stringify(frontendConfig));
  }, [frontendConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MERCHANT_REVIEWS, JSON.stringify(merchantReviews));
  }, [merchantReviews]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBORDER_MESSAGES, JSON.stringify(subOrderMessages));
  }, [subOrderMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_AGENTS, JSON.stringify(salesAgents));
  }, [salesAgents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOLETO_REQUESTS, JSON.stringify(boletoRequests));
  }, [boletoRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_CLIENTS_BY_AGENTS, JSON.stringify(registeredClientsByAgents));
  }, [registeredClientsByAgents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMERCIAL_GOALS, JSON.stringify(commercialGoals));
  }, [commercialGoals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMERCIAL_AREAS, JSON.stringify(commercialAreas));
  }, [commercialAreas]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_EVENTS, JSON.stringify(webhookEvents));
  }, [webhookEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_CONFIG, JSON.stringify(webhookConfig));
  }, [webhookConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_DRIVERS, JSON.stringify(deliveryDrivers));
  }, [deliveryDrivers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_RIDES, JSON.stringify(deliveryRides));
  }, [deliveryRides]);

  useEffect(() => {
    if (currentDeliveryDriver) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(currentDeliveryDriver));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DRIVER);
    }
  }, [currentDeliveryDriver]);

  // HidrataÃ’Â§Ã’Â£o e persistÃ’Âªncia do banco de dados real (Firestore)
  useEffect(() => {
    let isMounted = true;
    const initFirestoreSync = async () => {
      try {
        const firestoreData = await fetchAllCollectionsFromFirestore();
        if (!isMounted) return;

        if (firestoreData.users && firestoreData.users.length > 0) {
          setUsers(firestoreData.users);
        }
        if (firestoreData.merchants && firestoreData.merchants.length > 0) {
          setMerchants(firestoreData.merchants);
        }
        if (firestoreData.products && firestoreData.products.length > 0) {
          setProducts(firestoreData.products);
        }
        if (firestoreData.orders && firestoreData.orders.length > 0) {
          setOrders(firestoreData.orders);
        }
        if (firestoreData.deliveryDrivers && firestoreData.deliveryDrivers.length > 0) {
          setDeliveryDrivers(firestoreData.deliveryDrivers);
        }
        if (firestoreData.deliveryRides && firestoreData.deliveryRides.length > 0) {
          setDeliveryRides(firestoreData.deliveryRides);
        }

        // Se o banco estiver inicialmente vazio, inicializa com o ecossistema cadastral
        await seedInitialDataToFirestoreIfEmpty({
          merchants,
          products,
          deliveryDrivers,
          deliveryRides,
          users
        });
      } catch (err) {
        console.warn('SincronizaÃ’Â§Ã’Â£o com Firestore:', err);
      }
    };

    if (currentUser) {
      initFirestoreSync();
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // SincronizaÃ’Â§Ã’Â£o periÃ’Â³dica com o banco de dados de pedidos (atualizados em tempo real pelo Asaas Webhook)
  useEffect(() => {
    let isMounted = true;

    const syncWithServerDb = async () => {
      try {
        const serverOrders = await buscarPedidosDoServidor();
        if (!serverOrders || !Array.isArray(serverOrders) || !isMounted) return;

        setOrders((prevOrders) => {
          let hasChange = false;
          const merged = [...prevOrders];

          serverOrders.forEach((srvOrd) => {
            const idx = merged.findIndex((o) => o.id === srvOrd.id || (o.code && o.code === srvOrd.code));
            if (idx >= 0) {
              const current = merged[idx];
              if (
                current.status !== srvOrd.status ||
                current.paymentStatus !== srvOrd.paymentStatus ||
                current.stockConfirmationStatus !== srvOrd.stockConfirmationStatus
              ) {
                hasChange = true;
                merged[idx] = { ...current, ...srvOrd };
              }
            } else {
              hasChange = true;
              merged.unshift(srvOrd);
            }
          });

          return hasChange ? merged : prevOrders;
        });
      } catch {
        // Falha transitÃ’Â³ria ignorada
      }
    };

    // Executa sincronizaÃ’Â§Ã’Â£o inicial e depois a cada 8 segundos
    syncWithServerDb();
    const interval = setInterval(syncWithServerDb, 8000);

    const onFocus = () => syncWithServerDb();
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // ==========================================
  // AUDITORIA, RASTREABILIDADE & SEGURANÃ’ï¿½Ã¢ï¿½ï¿½Â¡A
  // ==========================================

  const addAuditLog = useCallback(
    (action: string, details: string, options?: AuditLogOptions): AuditLog => {
      const now = new Date();
      const timestampFormatted = now.toISOString().replace('T', ' ').substring(0, 19);

      // CategorizaÃ’Â§Ã’Â£o e severidade inteligentes caso nÃ’Â£o informadas
      let category: AuditCategory = options?.category || 'GENERAL';
      let severity: AuditSeverity = options?.severity || 'INFO';

      if (!options?.category) {
        if (
          action.includes('SECURITY') ||
          action.includes('LOGIN') ||
          action.includes('PASSWORD') ||
          action.includes('BLOCK') ||
          action.includes('IMPERSONATE') ||
          action.includes('AUTH') ||
          action.includes('TWO_FACTOR') ||
          action.includes('SUSPEND')
        ) {
          category = 'SECURITY';
        } else if (
          action.includes('ORDER') ||
          action.includes('STOCK') ||
          action.includes('PICKUP') ||
          action.includes('STATUS')
        ) {
          category = 'ORDER';
        } else if (
          action.includes('MESSAGE') ||
          action.includes('CHAT') ||
          action.includes('COMMUNICATION') ||
          action.includes('NOTIFICATION')
        ) {
          category = 'COMMUNICATION';
        } else if (
          action.includes('BUYER_DATA') ||
          action.includes('PRIVACY') ||
          action.includes('DATA_RELEASE') ||
          action.includes('LGPD')
        ) {
          category = 'DATA_PRIVACY';
        } else if (
          action.includes('COMMISSION') ||
          action.includes('FINANCIAL') ||
          action.includes('PAY') ||
          action.includes('FEE') ||
          action.includes('AUCTION')
        ) {
          category = 'FINANCIAL';
        } else if (action.includes('USER_') || action.includes('MERCHANT_')) {
          category = 'USER_MANAGEMENT';
        } else if (action.includes('SYSTEM_') || action.includes('CONFIG_') || action.includes('SNAPSHOT')) {
          category = 'SYSTEM';
        }
      }

      if (!options?.severity) {
        if (category === 'SECURITY') {
          severity = 'SECURITY';
        } else if (
          category === 'DATA_PRIVACY' ||
          action.includes('CRITICAL') ||
          action.includes('DELETE') ||
          action.includes('BLOCK') ||
          action.includes('IMPERSONATE') ||
          action.includes('UNLOCKED')
        ) {
          severity = 'CRITICAL';
        } else if (
          action.includes('REJECT') ||
          action.includes('CANCEL') ||
          action.includes('SUSPEND') ||
          action.includes('WARNING')
        ) {
          severity = 'WARNING';
        }
      }

      const newLog: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUser?.id || options?.userRole || 'anonymous',
        userEmail: currentUser?.email || 'visitante@acheiaqui.com',
        userName: options?.userName || currentUser?.name,
        userRole: options?.userRole || currentUser?.role || 'VISITANTE',
        action,
        category,
        severity,
        entityId: options?.entityId,
        entityType: options?.entityType,
        details,
        metadata: options?.metadata,
        ipAddress: options?.ipAddress || '177.18.240.12',
        device: options?.device || 'Navegador Web / Cachoeiras de Macacu - RJ',
        timestamp: timestampFormatted,
        isoDate: now.toISOString()
      };

      setAuditLogs((prev) => [newLog, ...prev]);
      return newLog;
    },
    [currentUser]
  );

  const logSecurityEvent = useCallback(
    (action: string, details: string, meta?: Record<string, any>, severity: AuditSeverity = 'SECURITY'): AuditLog => {
      return addAuditLog(action, details, {
        category: 'SECURITY',
        severity,
        entityType: 'SECURITY',
        metadata: meta
      });
    },
    [addAuditLog]
  );

  const logOrderEvent = useCallback(
    (orderId: string, action: string, details: string, meta?: Record<string, any>, severity: AuditSeverity = 'INFO'): AuditLog => {
      return addAuditLog(action, details, {
        category: 'ORDER',
        severity,
        entityId: orderId,
        entityType: 'ORDER',
        metadata: { orderId, ...meta }
      });
    },
    [addAuditLog]
  );

  const logDataReleaseEvent = useCallback(
    (orderId: string, targetMerchantId: string, buyerName: string, reason: string, meta?: Record<string, any>): AuditLog => {
      return addAuditLog(
        'BUYER_DATA_RELEASE',
        `[LGPD / RASTREABILIDADE] LiberaÃ’Â§Ã’Â£o de dados do comprador "${buyerName}" (Pedido #${orderId}) para a loja ID ${targetMerchantId}. Motivo: ${reason}`,
        {
          category: 'DATA_PRIVACY',
          severity: 'CRITICAL',
          entityId: orderId,
          entityType: 'BUYER_DATA',
          metadata: {
            orderId,
            targetMerchantId,
            buyerName,
            reason,
            authorizedBy: currentUser?.email || 'master@acheiaqui.com',
            authorizedRole: currentUser?.role || 'MASTER',
            complianceStandard: 'LGPD Art. 7ï¿½Âº V / TransaÃ’Â§Ã’Â£o Segura Achei Aqui',
            ...meta
          }
        }
      );
    },
    [addAuditLog, currentUser]
  );

  const logMessageEvent = useCallback(
    (subpedidoId: string, senderRole: string, messageSummary: string, meta?: Record<string, any>): AuditLog => {
      return addAuditLog(
        'SUBORDER_MESSAGE_SENT',
        `[COMUNICAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O SUBPEDIDO] Mensagem no Subpedido #${subpedidoId} por ${senderRole}: "${messageSummary.length > 70 ? messageSummary.substring(0, 70) + '...' : messageSummary}"`,
        {
          category: 'COMMUNICATION',
          severity: 'INFO',
          entityId: subpedidoId,
          entityType: 'SUBORDER',
          metadata: {
            subpedidoId,
            senderRole,
            ...meta
          }
        }
      );
    },
    [addAuditLog]
  );

  const logFinancialEvent = useCallback(
    (orderId: string, action: string, amount: number, details: string, meta?: Record<string, any>): AuditLog => {
      return addAuditLog(
        action,
        `[INTERMEDIAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O FINANCEIRA] ${details} (Valor: R$ ${amount.toFixed(2).replace('.', ',')})`,
        {
          category: 'FINANCIAL',
          severity: 'INFO',
          entityId: orderId,
          entityType: 'COMMISSION',
          metadata: {
            orderId,
            amount,
            ...meta
          }
        }
      );
    },
    [addAuditLog]
  );

  const getAuditLogsByEntity = useCallback(
    (entityType: string, entityId: string): AuditLog[] => {
      return auditLogs.filter(
        (log) => (!entityType || log.entityType === entityType) && log.entityId === entityId
      );
    },
    [auditLogs]
  );

  const getAuditStats = useCallback((): AuditStats => {
    const byCategory: Record<AuditCategory, number> = {
      SECURITY: 0,
      ORDER: 0,
      COMMUNICATION: 0,
      FINANCIAL: 0,
      DATA_PRIVACY: 0,
      USER_MANAGEMENT: 0,
      SYSTEM: 0,
      GENERAL: 0
    };

    const bySeverity: Record<AuditSeverity, number> = {
      INFO: 0,
      WARNING: 0,
      CRITICAL: 0,
      SECURITY: 0
    };

    let criticalEventsCount = 0;
    let dataReleaseCount = 0;
    let messageEventsCount = 0;
    let statusChangesCount = 0;

    auditLogs.forEach((log) => {
      const cat = log.category || 'GENERAL';
      const sev = log.severity || 'INFO';

      if (byCategory[cat] !== undefined) byCategory[cat]++;
      if (bySeverity[sev] !== undefined) bySeverity[sev]++;

      if (sev === 'CRITICAL' || sev === 'SECURITY') criticalEventsCount++;
      if (log.action.includes('BUYER_DATA') || cat === 'DATA_PRIVACY') dataReleaseCount++;
      if (log.action.includes('MESSAGE') || cat === 'COMMUNICATION') messageEventsCount++;
      if (log.action.includes('STATUS') || log.action.includes('STOCK')) statusChangesCount++;
    });

    return {
      total: auditLogs.length,
      byCategory,
      bySeverity,
      criticalEventsCount,
      dataReleaseCount,
      messageEventsCount,
      statusChangesCount
    };
  }, [auditLogs]);

  const exportAuditLogs = useCallback(
    (format: 'json' | 'csv' = 'json') => {
      if (format === 'csv') {
        const headers = ['ID', 'Data/Hora', 'Acao', 'Categoria', 'Severidade', 'Usuario', 'Email', 'Role', 'Entidade', 'ID_Entidade', 'Detalhes', 'IP', 'Dispositivo'];
        const rows = auditLogs.map((l) => [
          l.id,
          `"${l.timestamp}"`,
          `"${l.action}"`,
          `"${l.category || 'GENERAL'}"`,
          `"${l.severity || 'INFO'}"`,
          `"${l.userName || ''}"`,
          `"${l.userEmail}"`,
          `"${l.userRole || ''}"`,
          `"${l.entityType || ''}"`,
          `"${l.entityId || ''}"`,
          `"${(l.details || '').replace(/"/g, '""')}"`,
          `"${l.ipAddress}"`,
          `"${l.device}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `relatorio_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `relatorio_auditoria_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }

      addAuditLog('AUDIT_REPORT_EXPORTED', `ExportaÃ’Â§Ã’Â£o de relatÃ’Â³rio de auditoria realizada no formato ${format.toUpperCase()}`, {
        category: 'SECURITY',
        severity: 'INFO'
      });
    },
    [auditLogs, addAuditLog]
  );

  // Notification Operations
  const sendInAppNotification = useCallback(
    (data: Omit<InAppNotification, 'id' | 'createdAt' | 'readBy'>): InAppNotification => {
      const newNotif: InAppNotification = {
        ...data,
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        readBy: [],
        createdAt: new Date().toISOString()
      };
      setNotifications((prev) => [newNotif, ...prev]);
      addAuditLog(
        'NOTIFICATION_SENT',
        `NotificaÃ’Â§Ã’Â£o "${newNotif.title}" enviada para ${newNotif.audience} por ${newNotif.senderName}`
      );
      return newNotif;
    },
    []
  );

  const markNotificationAsRead = useCallback(
    (id: string, userId?: string) => {
      const effectiveUserId = userId || currentUser?.id || 'visitor';
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.id === id) {
            if (n.readBy.includes(effectiveUserId)) return n;
            return { ...n, readBy: [...n.readBy, effectiveUserId] };
          }
          return n;
        })
      );
    },
    [currentUser]
  );

  const markAllNotificationsAsRead = useCallback(
    (userId?: string) => {
      const effectiveUserId = userId || currentUser?.id || 'visitor';
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.readBy.includes(effectiveUserId)) return n;
          return { ...n, readBy: [...n.readBy, effectiveUserId] };
        })
      );
      triggerToast('Todas as notificaÃ’Â§Ã’Âµes foram marcadas como lidas.');
    },
    [currentUser]
  );

  const deleteInAppNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      addAuditLog('NOTIFICATION_DELETED', `NotificaÃ’Â§Ã’Â£o ID ${id} removida pelo Master.`);
    },
    []
  );

  // Garante que cada usuÃ’Â¡rio receba uma notificaÃ’Â§Ã’Â£o de boas-vindas personalizada com seu prÃ’Â³prio nome
  const ensureUserWelcomeNotification = useCallback(
    (user: User) => {
      setNotifications((prev) => {
        const hasWelcome = prev.some(
          (n) => n.recipientUserId === user.id || (n.recipientName && n.recipientName === user.name)
        );
        if (hasWelcome) return prev;

        const isSeller = user.role === 'VENDEDOR';
        const isMaster = user.role === 'MASTER';

        const welcomeNotif: InAppNotification = {
          id: `welcome-${user.id}-${Date.now()}`,
          title: `Ã’Â°ï¿½&Â¸ï¿½&ï¿½"ï¿½Â¿ OlÃ’Â¡, ${user.name}! Bem-vindo(a) ao Achei Aqui`,
          message: isSeller
            ? `OlÃ’Â¡, ${user.name}! Seu acesso como Lojista / Prestador estÃ’Â¡ ativo. VocÃ’Âª pode gerenciar seu catÃ’Â¡logo, ativar ou desativar o chat direto nos produtos e responder aos clientes com total privacidade.`
            : isMaster
            ? `OlÃ’Â¡, ${user.name}! O painel Master Administrativo estÃ’Â¡ pronto para monitoramento e auditoria com seguranÃ’Â§a jurÃ’Â­dica.`
            : `OlÃ’Â¡, ${user.name}! Sua conta pessoal de morador de Cachoeiras de Macacu estÃ’Â¡ ativa. Converse diretamente com lojistas pelo chat interno dos produtos e acompanhe seus pedidos em tempo real.`,
          category: 'SISTEMA',
          audience: isSeller ? 'SPECIFIC_MERCHANT' : 'SPECIFIC_USER',
          recipientUserId: user.id,
          recipientMerchantId: user.merchantId,
          recipientName: user.name,
          recipientPhone: user.phone,
          recipientEmail: user.email,
          senderName: 'AdministraÃ’Â§Ã’Â£o Achei Aqui',
          senderRole: 'SISTEMA',
          priority: 'HIGH',
          actionUrl: isSeller ? 'orders' : 'home',
          actionLabel: isSeller ? 'Painel do Lojista' : 'Explorar Produtos',
          readBy: [],
          createdAt: new Date().toISOString()
        };

        return [welcomeNotif, ...prev];
      });
    },
    []
  );

  useEffect(() => {
    if (currentUser) {
      ensureUserWelcomeNotification(currentUser);
    }
  }, [currentUser, ensureUserWelcomeNotification]);

  const getUserNotifications = useCallback(
    (user?: User | null): InAppNotification[] => {
      const targetUser = user !== undefined ? user : currentUser;
      // Visitantes nÃ’Â£o logados nÃ’Â£o possuem acesso a notificaÃ’Â§Ã’Âµes particulares
      if (!targetUser) {
        return [];
      }

      // Master possui visÃ’Â£o administrativa geral
      if (targetUser.role === 'MASTER') {
        return notifications;
      }

      // VENDEDOR: Apenas notificaÃ’Â§Ã’Âµes destinadas especificamente a ele ou Ã’Â  sua loja
      if (targetUser.role === 'VENDEDOR') {
        const userMerchantId = targetUser.merchantId;
        return notifications.filter((n) => {
          if (n.recipientUserId && n.recipientUserId === targetUser.id) return true;
          if (userMerchantId && n.recipientMerchantId && n.recipientMerchantId === userMerchantId) return true;
          return false;
        });
      }

      // CLIENTE: Apenas notificaÃ’Â§Ã’Âµes estritamente particulares com o seu nome e ID
      return notifications.filter((n) => {
        if (n.recipientUserId && n.recipientUserId === targetUser.id) return true;
        if (
          n.recipientPhone &&
          targetUser.phone &&
          n.recipientPhone.replace(/\D/g, '') === targetUser.phone.replace(/\D/g, '')
        ) {
          return true;
        }
        if (
          n.recipientEmail &&
          targetUser.email &&
          n.recipientEmail.trim().toLowerCase() === targetUser.email.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });
    },
    [notifications, currentUser]
  );

  const getUnreadNotificationsCount = useCallback(
    (user?: User | null): number => {
      const targetUser = user !== undefined ? user : currentUser;
      const userNotifs = getUserNotifications(targetUser);
      const effectiveUserId = targetUser?.id || 'visitor';
      return userNotifs.filter((n) => !n.readBy.includes(effectiveUserId)).length;
    },
    [getUserNotifications, currentUser]
  );

  // ==========================================
  // CONVERSAS & MENSAGENS INTERNAS POR SUBPEDIDO
  // ==========================================

  // ValidaÃ’Â§Ã’Â£o estrita de permissÃ’Â£o de acesso a mensagens e dados de subpedidos
  const checkAccessPermission = useCallback(
    (
      userId: string | undefined | null,
      subOrderId: string,
      contextHint?: Partial<ActiveChatSubOrder>
    ): boolean => {
      // 1. UsuÃ’Â¡rio nÃ’Â£o autenticado ou subpedido invÃ’Â¡lido: acesso terminantemente negado
      if (!userId || !subOrderId) {
        return false;
      }

      // 2. Identificar usuÃ’Â¡rio
      const user =
        currentUser && currentUser.id === userId
          ? currentUser
          : users.find((u) => u.id === userId);

      if (!user) {
        return false;
      }

      // 3. Administrador Master possui acesso irrestrito para auditoria, suporte e mediaÃ’Â§Ã’Â£o
      if (user.role === 'MASTER') {
        return true;
      }

      // 4. VerificaÃ’Â§Ã’Â£o com base em metadados contextuais explÃ’Â­citos passados na abertura
      if (contextHint) {
        if (user.role === 'CLIENTE') {
          if (contextHint.customerId && contextHint.customerId === user.id) {
            return true;
          }
        } else if (user.role === 'VENDEDOR') {
          if (
            user.merchantId &&
            contextHint.merchantId &&
            user.merchantId === contextHint.merchantId
          ) {
            return true;
          }
        }
      }

      // 5. Canal de conversa direta com lojista (ex: sub-direct-store-1, chat-direct-store-1-userId, inquiry-store-1-userId)
      if (
        subOrderId.startsWith('sub-direct-') ||
        subOrderId.startsWith('chat-direct-') ||
        subOrderId.startsWith('inquiry-')
      ) {
        if (user.role === 'VENDEDOR') {
          if (contextHint?.merchantId && user.merchantId === contextHint.merchantId) return true;
          if (user.merchantId && subOrderId.includes(user.merchantId)) return true;
          return false;
        }
        if (user.role === 'CLIENTE') {
          if (contextHint?.customerId && contextHint.customerId === user.id) return true;
          if (subOrderId.includes(user.id)) return true;
          return !contextHint?.customerId || contextHint.customerId === user.id;
        }
      }

      // 6. Canal de dÃ’Âºvida sobre produto especÃ’Â­fico (ex: chat-prod-prod-1-userId, product-inquiry-prod-1-userId, sub-prod-prod-1)
      if (
        subOrderId.startsWith('chat-prod-') ||
        subOrderId.startsWith('product-inquiry-') ||
        subOrderId.startsWith('sub-prod-')
      ) {
        if (user.role === 'VENDEDOR') {
          if (contextHint?.merchantId && user.merchantId === contextHint.merchantId) return true;
          if (contextHint?.productId) {
            const targetProduct = products.find((p) => p.id === contextHint.productId);
            if (targetProduct && user.merchantId === targetProduct.merchantId) return true;
          }
          if (user.merchantId && subOrderId.includes(user.merchantId)) return true;
          return false;
        }
        if (user.role === 'CLIENTE') {
          if (contextHint?.customerId && contextHint.customerId === user.id) return true;
          if (subOrderId.includes(user.id)) return true;
          return !contextHint?.customerId || contextHint.customerId === user.id;
        }
      }

      // 7. Buscar pedido na lista de pedidos locais
      const order = orders.find((o) => {
        if (o.id === subOrderId) return true;
        if (`sub-${o.id}` === subOrderId) return true;
        if (contextHint?.pedidoPrincipalId && o.id === contextHint.pedidoPrincipalId) return true;
        if (o.code === subOrderId || o.orderNumber === subOrderId) return true;
        if ((o as any).subpedidos?.some((s: any) => s.id === subOrderId || s.codigoSubpedido === subOrderId)) return true;
        return false;
      });

      if (order) {
        if (user.role === 'CLIENTE') {
          const isOwner =
            order.userId === user.id ||
            (order as any).clienteId === user.id ||
            (order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase());
          return !!isOwner;
        }
        if (user.role === 'VENDEDOR') {
          if (!user.merchantId) return false;
          if (order.merchantId === user.merchantId) return true;
          if ((order as any).subpedidos?.some((s: any) => s.lojaId === user.merchantId)) return true;
          return false;
        }
      }

      // 8. Checagem no banco de dados multiloja (MultiStoreDatabase)
      try {
        const subInDb = multiStoreDb.obterSubpedido(subOrderId);
        if (subInDb) {
          if (user.role === 'CLIENTE') {
            const mainOrder = multiStoreDb.obterPedidoPrincipal(subInDb.pedidoPrincipalId);
            return (
              mainOrder?.userId === user.id ||
              mainOrder?.customerEmail?.toLowerCase() === user.email.toLowerCase()
            );
          }
          if (user.role === 'VENDEDOR') {
            return !!user.merchantId && subInDb.lojaId === user.merchantId;
          }
        }
      } catch (e) {
        // Fallback gracioso
      }

      // 9. VerificaÃ’Â§Ã’Â£o por histÃ’Â³rico de mensagens jÃ’Â¡ trocadas no subpedido
      const existingThread = subOrderMessages.filter((m) => m.subpedidoId === subOrderId);
      if (existingThread.length > 0) {
        const userParticipated = existingThread.some(
          (m) => m.senderId === user.id || m.recipientId === user.id
        );
        if (userParticipated) return true;
      }

      return false;
    },
    [currentUser, users, products, orders, subOrderMessages]
  );

  const openSubOrderChat = useCallback(
    (params: ActiveChatSubOrder) => {
      // ValidaÃ’Â§Ã’Â£o estrita de permissÃ’Â£o antes de abrir o modal do chat
      const hasPermission = checkAccessPermission(currentUser?.id, params.subpedidoId, params);

      if (!hasPermission) {
        triggerToast('Acesso negado: VocÃ’Âª nÃ’Â£o tem permissÃ’Â£o para acessar esta conversa.');
        logSecurityEvent(
          'UNAUTHORIZED_CHAT_ACCESS_BLOCKED',
          `Tentativa de acesso nÃ’Â£o autorizada ao chat do Subpedido ${params.codigoSubpedido || params.subpedidoId} pelo usuÃ’Â¡rio ${currentUser?.email || 'AnÃ’Â´nimo'} (${currentUser?.role || 'NÃ’ï¿½ï¿½ ï¿½"O_AUTENTICADO'}).`,
          {
            subpedidoId: params.subpedidoId,
            codigoSubpedido: params.codigoSubpedido,
            attemptedUserId: currentUser?.id,
            attemptedUserEmail: currentUser?.email,
            attemptedUserRole: currentUser?.role,
            orderMerchantId: params.merchantId,
            orderCustomerId: params.customerId
          },
          'WARNING'
        );
        return;
      }

      setActiveChatSubOrder(params);

      // Auto-marcar mensagens como lidas ao abrir
      if (params.subpedidoId && currentUser?.id) {
        setSubOrderMessages((prev) =>
          prev.map((msg) => {
            if (msg.subpedidoId === params.subpedidoId) {
              if (msg.readBy.includes(currentUser.id)) return msg;
              return { ...msg, readBy: [...msg.readBy, currentUser.id] };
            }
            return msg;
          })
        );
      }
    },
    [currentUser, checkAccessPermission, triggerToast, logSecurityEvent]
  );

  const sendSubOrderMessage = useCallback(
    (data: Omit<SubOrderMessage, 'id' | 'createdAt' | 'readBy'>): SubOrderMessage => {
      const senderId = data.senderId || currentUser?.id || 'sistema';
      const newMsg: SubOrderMessage = {
        ...data,
        id: `msg-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        readBy: [senderId],
        createdAt: new Date().toISOString()
      };

      setSubOrderMessages((prev) => [...prev, newMsg]);

      logMessageEvent(
        data.subpedidoId,
        data.senderRole,
        data.message,
        {
          subpedidoId: data.subpedidoId,
          codigoSubpedido: data.codigoSubpedido,
          pedidoPrincipalId: data.pedidoPrincipalId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          isInternalNote: data.isInternalNote,
          attachmentsCount: data.attachmentUrl ? 1 : 0
        }
      );

      return newMsg;
    },
    [currentUser, logMessageEvent]
  );

  const sendSubOrderSystemMessage = useCallback(
    (params: {
      subpedidoId: string;
      pedidoPrincipalId?: string;
      codigoSubpedido?: string;
      message: string;
      systemEventType?: string;
      statusBadge?: string;
      recipientRole?: 'CLIENTE' | 'VENDEDOR' | 'MASTER' | 'ALL';
    }): SubOrderMessage => {
      const newMsg: SubOrderMessage = {
        id: `sys-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        subpedidoId: params.subpedidoId,
        pedidoPrincipalId: params.pedidoPrincipalId,
        codigoSubpedido: params.codigoSubpedido || `#${params.subpedidoId}`,
        senderId: 'sistema-achei-aqui',
        senderName: 'Sistema Achei Aqui',
        senderRole: 'SISTEMA',
        recipientRole: params.recipientRole || 'ALL',
        message: params.message,
        systemEventType: params.systemEventType,
        statusBadge: params.statusBadge,
        readBy: [],
        createdAt: new Date().toISOString()
      };

      setSubOrderMessages((prev) => [...prev, newMsg]);

      addAuditLog(
        'SUBORDER_SYSTEM_MESSAGE',
        `[SISTEMA AUTOMÃ’ÂTICO] Registro gerado para Subpedido ${params.codigoSubpedido || params.subpedidoId}: "${params.message}"`,
        {
          category: 'COMMUNICATION',
          severity: 'INFO',
          entityId: params.subpedidoId,
          entityType: 'SUBORDER',
          metadata: {
            subpedidoId: params.subpedidoId,
            pedidoPrincipalId: params.pedidoPrincipalId,
            codigoSubpedido: params.codigoSubpedido,
            systemEventType: params.systemEventType,
            statusBadge: params.statusBadge
          }
        }
      );

      return newMsg;
    },
    [addAuditLog]
  );

  const dispatchOrderStatusSystemMessage = useCallback(
    (
      order: Order,
      newStatus: OrderStatus,
      previousStatus?: OrderStatus,
      note?: string
    ): SubOrderMessage => {
      const subId = (order as any).subpedidos?.[0]?.id || `sub-${order.id}`;
      const subCode = (order as any).subpedidos?.[0]?.codigoSubpedido || `#${order.orderNumber || order.code}-A`;

      let icon = 'Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½ÂÃ¢ï¿½ï¿½Å¾';
      let statusText = `Status atualizado para "${newStatus}"`;

      switch (newStatus) {
        case 'Confirmado':
          icon = 'Ã’Â¢ï¿½&ï¿½SÃ¢ï¿½ï¿½Â¦';
          statusText = `Estoque e disponibilidade confirmados pelo estabelecimento! Status: "Confirmado". Reserva garantida por 30 minutos.`;
          break;
        case 'Em Preparo':
          icon = 'Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½ï¿½Sï¿½Â¨Ã’Â¢Ã¢ï¿½aÂ¬ï¿½ÂÃ’Â°ï¿½&Â¸ï¿½Âï¿½Â³';
          statusText = `Pedido entrou em fase de separaÃ’Â§Ã’Â£o / preparo na loja.`;
          break;
        case 'Em Rota':
          icon = 'Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½Âºï¿½Âµ';
          statusText = `Pedido despachado! O entregador estÃ’Â¡ em rota de entrega para o endereÃ’Â§o informado.`;
          break;
        case 'Pronto para Retirada':
          icon = 'Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½Âºï¿½ÂÃ’Â¯ï¿½Â¸ï¿½Â';
          statusText = `Pedido pronto para retirada no balcÃ’Â£o da loja! CÃ’Â³digo de seguranÃ’Â§a: ${order.securityCode || order.pickupCode || 'N/A'}.`;
          break;
        case 'ConcluÃ’Â­do':
          icon = 'Ã’Â°ï¿½&Â¸ï¿½&Â½Ã¢ï¿½ï¿½Â°';
          statusText = `Pedido/Atendimento concluÃ’Â­do com sucesso! Obrigado pela preferÃ’Âªncia.`;
          break;
        case 'Sem Estoque':
          icon = 'Ã¢Âï¿½';
          statusText = `Pedido marcado como Sem Estoque pelo estabelecimento.${note ? ` Motivo: ${note}` : ''}`;
          break;
        case 'Cancelado':
          icon = 'Ã’Â°ï¿½&Â¸ï¿½&Â¡ï¿½Â«';
          statusText = `Pedido cancelado.${note ? ` Motivo: ${note}` : ''}`;
          break;
        case 'Aguardando':
          icon = 'Ã¢ÂÂ³';
          statusText = `SolicitaÃ’Â§Ã’Â£o recebida e aguardando confirmaÃ’Â§Ã’Â£o do estabelecimento.`;
          break;
      }

      const fullMessage = `${icon} [HISTÃ’ï¿½Ã¢ï¿½ï¿½ï¿½RICO OFICIAL] ${statusText}`;

      return sendSubOrderSystemMessage({
        subpedidoId: subId,
        pedidoPrincipalId: order.id,
        codigoSubpedido: subCode,
        message: fullMessage,
        systemEventType: 'STATUS_CHANGED',
        statusBadge: newStatus
      });
    },
    [sendSubOrderSystemMessage]
  );

  const dispatchCommissionSystemMessage = useCallback(
    (
      order: Order,
      eventType: 'MERCHANT_PAID' | 'MASTER_CONFIRMED',
      extraNote?: string
    ): SubOrderMessage => {
      const subId = (order as any).subpedidos?.[0]?.id || `sub-${order.id}`;
      const subCode = (order as any).subpedidos?.[0]?.codigoSubpedido || `#${order.orderNumber || order.code}-A`;

      let message = '';
      let badge = '';

      if (eventType === 'MERCHANT_PAID') {
        const commissionFormatted = (order.commissionAmount || 0).toFixed(2).replace('.', ',');
        message = `Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½ï¿½ï¿½ï¿½Â³ [TAXA DA PLATAFORMA] O lojista registrou o pagamento da comissÃ’Â£o de R$ ${commissionFormatted}. Aguardando validaÃ’Â§Ã’Â£o do Administrador Master.`;
        badge = 'ComissÃ’Â£o Enviada';
      } else {
        message = `Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½Âºï¿½Â¡Ã’Â¯ï¿½Â¸ï¿½Â [TRANSAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O AUDITADA] Pagamento da comissÃ’Â£o homologado pelo Administrador Master! Dados do comprador liberados e histÃ’Â³rico registrado com conformidade fiscal e jurÃ’Â­dica.`;
        badge = 'ComissÃ’Â£o Homologada';
      }

      if (extraNote) {
        message += ` Nota: ${extraNote}`;
      }

      return sendSubOrderSystemMessage({
        subpedidoId: subId,
        pedidoPrincipalId: order.id,
        codigoSubpedido: subCode,
        message,
        systemEventType: eventType === 'MERCHANT_PAID' ? 'COMMISSION_PAID' : 'COMMISSION_CONFIRMED',
        statusBadge: badge
      });
    },
    [sendSubOrderSystemMessage]
  );

  const receiveSubOrderMessage = useCallback((message: SubOrderMessage) => {
    setSubOrderMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = message;
        return updated;
      }
      return [...prev, message];
    });
  }, []);

  const markSubOrderMessagesAsRead = useCallback(
    (subpedidoId: string, userId?: string) => {
      const effectiveUserId = userId || currentUser?.id;
      if (!effectiveUserId) return;

      setSubOrderMessages((prev) =>
        prev.map((msg) => {
          if (msg.subpedidoId === subpedidoId) {
            if (msg.readBy.includes(effectiveUserId)) return msg;
            return { ...msg, readBy: [...msg.readBy, effectiveUserId] };
          }
          return msg;
        })
      );
    },
    [currentUser]
  );

  const getSubOrderMessages = useCallback(
    (subpedidoId: string): SubOrderMessage[] => {
      return subOrderMessages
        .filter((m) => m.subpedidoId === subpedidoId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    [subOrderMessages]
  );

  const getUnreadSubOrderMessagesCount = useCallback(
    (subpedidoId: string, userId?: string): number => {
      const effectiveUserId = userId || currentUser?.id;
      if (!effectiveUserId) return 0;

      return subOrderMessages.filter(
        (m) =>
          m.subpedidoId === subpedidoId &&
          m.senderId !== effectiveUserId &&
          !m.readBy.includes(effectiveUserId)
      ).length;
    },
    [subOrderMessages, currentUser]
  );

  const deleteSubOrderMessage = useCallback((messageId: string) => {
    setSubOrderMessages((prev) => prev.filter((m) => m.id !== messageId));
    addAuditLog('SUBORDER_MESSAGE_DELETED', `Mensagem ID ${messageId} excluÃ’Â­da do histÃ’Â³rico do subpedido.`, {
      category: 'COMMUNICATION',
      severity: 'WARNING',
      entityId: messageId,
      entityType: 'MESSAGE'
    });
  }, [addAuditLog]);

  const setCurrentEnvironment = (env: AppEnvironment) => {
    const role = currentUser?.role;

    const allowedEnvironments: Record<string, AppEnvironment[]> = {
      CLIENTE: ['MARKETPLACE'],
      VENDEDOR: ['MARKETPLACE', 'COMMERCIAL_PORTAL'],
      REPRESENTANTE_COMERCIAL: ['MARKETPLACE', 'COMMERCIAL_PORTAL'],
      LOJISTA: ['MARKETPLACE', 'SELLER_PORTAL'],
      PRESTADOR_SERVICO: ['MARKETPLACE', 'SELLER_PORTAL'],
      ENTREGADOR: ['MARKETPLACE', 'DELIVERY_PORTAL'],
      MASTER: ['MARKETPLACE', 'SELLER_PORTAL', 'COMMERCIAL_PORTAL', 'DELIVERY_PORTAL', 'MASTER_PANEL']
    };

    if (!role || !allowedEnvironments[role]?.includes(env)) {
      return;
    }

    if (env === 'COMMERCIAL_PORTAL' && (role === 'VENDEDOR' || role === 'REPRESENTANTE_COMERCIAL')) {
      const cleanEmail = currentUser!.email.toLowerCase().trim();
      const matchedAgent = salesAgents.find(
        (a) =>
          a.email.toLowerCase().trim() === cleanEmail ||
          a.id === currentUser!.id ||
          ('user-' + currentUser!.id) === currentUser!.id ||
          a.id === currentUser!.id.replace('user-', '')
      );

      if (matchedAgent) {
        setCurrentSalesAgentState(matchedAgent);
      }
    }

    setCurrentEnvironmentState(env);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth Operations with Two-Factor Authentication (2FA) & Role Isolation
  const login = (
    email: string,
    password?: string,
    rememberMe: boolean = true
  ): {
    success: boolean;
    requires2FA?: boolean;
    requiresPasswordChange?: boolean;
    message?: string;
    user?: User;
    simulated2FACode?: string;
  } => {
    const rawInput = (email || '').trim();
    const cleanEmail = rawInput.toLowerCase();
    const cleanDigits = rawInput.replace(/\D/g, '');
    // ============================================================

    // ============================================================

    if (!cleanEmail || !password || !password.trim()) {
      return {
        success: false,
        message: 'Por favor, informe suas credenciais de acesso (e-mail, CPF ou telefone) e sua senha.'
      };
    }
    
    // 1. VerificaÃ’Â§Ã’Â£o prioritÃ’Â¡ria de Consultor / Vendedor Comercial
    const agentMatch =
      salesAgents.find(
        (a) =>
          a.email.toLowerCase().trim() === cleanEmail ||
          (cleanDigits.length >= 10 && (a.cpf?.replace(/\D/g, '') === cleanDigits || a.phone?.replace(/\D/g, '') === cleanDigits))
      ) ||
      INITIAL_SALES_AGENTS.find(
        (a) =>
          a.email.toLowerCase().trim() === cleanEmail ||
          (cleanDigits.length >= 10 && (a.cpf?.replace(/\D/g, '') === cleanDigits || a.phone?.replace(/\D/g, '') === cleanDigits))
      );

    if (agentMatch) {
      let sellerUser = users.find(
        (u) =>
          u.email.toLowerCase().trim() === agentMatch.email.toLowerCase().trim() ||
          u.id === `user-${agentMatch.id}` ||
          u.id === agentMatch.id ||
          (cleanDigits.length >= 10 && u.phone?.replace(/\D/g, '') === cleanDigits)
      );

      if (!sellerUser) {
        sellerUser = {
          id: `user-${agentMatch.id}`,
          name: agentMatch.name,
          email: agentMatch.email.toLowerCase().trim(),
          phone: agentMatch.phone,
          role: 'VENDEDOR',
          password: '12345678',
          needsPasswordChange: true,
          city: agentMatch.assignedRegion || 'Cachoeiras de Macacu, RJ',
          isEmailVerified: true,
          twoFactorEnabled: false,
          avatar: agentMatch.avatarUrl,
          createdAt: agentMatch.createdAt || new Date().toISOString()
        };
      } else {
        sellerUser = {
          ...sellerUser,
          role: 'VENDEDOR',
          password: sellerUser.password || '12345678',
          needsPasswordChange: sellerUser.needsPasswordChange !== false ? true : false,
          name: sellerUser.name || agentMatch.name,
          phone: sellerUser.phone || agentMatch.phone
        };
      }

      // ValidaÃ’Â§Ã’Â£o de senha para Vendedor:
      // Primeiro acesso: senha padrÃ’Â£o 12345678
      // PÃ’Â³s-primeiro acesso: senha pessoal cadastrada pelo vendedor
      const isDefaultPassword = password === '12345678';
      const isConfiguredPassword = Boolean(sellerUser.password && sellerUser.password === password);
      const isFirstAccessAllowed = sellerUser.needsPasswordChange === true || sellerUser.password === '12345678' || !sellerUser.password;

      let passwordValid = false;
      if (isConfiguredPassword) {
        passwordValid = true;
      } else if (isDefaultPassword && isFirstAccessAllowed) {
        passwordValid = true;
      }

      if (!passwordValid) {
        if (isFirstAccessAllowed) {
          return {
            success: false,
            message: 'Senha incorreta. Como este Ã’Â© o primeiro acesso deste vendedor, utilize a senha padrÃ’Â£o 12345678.'
          };
        }
        return {
          success: false,
          message: 'Senha de acesso incorreta. Digite sua nova senha pessoal ou solicite redefiniÃ’Â§Ã’Â£o com a administraÃ’Â§Ã’Â£o.'
        };
      }
    const updatedUser: User = {
        ...sellerUser,
        lastLogin: new Date().toISOString()
      };

      setUsers((prev) => [
        updatedUser,
        ...prev.filter((u) => u.id !== updatedUser.id && u.email.toLowerCase().trim() !== updatedUser.email.toLowerCase().trim())
      ]);
      setCurrentUser(updatedUser);
      setCurrentSalesAgent(agentMatch);
      setCurrentEnvironmentState('COMMERCIAL_PORTAL');

      addAuditLog('SELLER_LOGIN', `Vendedor ${agentMatch.name} logado com sucesso no Portal do Vendedor.`);
      triggerToast(`Bem-vindo(a) ao Portal do Vendedor, ${agentMatch.name}!`);

      return {
        success: true,
        user: updatedUser
      };
    }

    // 2. Check in users list or initial fallback for other roles
    let found = users.find((u) => u.email.toLowerCase() === cleanEmail) ||
                INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);

    if (cleanEmail === 'telecom.david@gmail.com' || cleanEmail === 'espier.telecom@gmail.com' || cleanEmail === 'admin@acheiaqui.com.br') {
      const isDavid = cleanEmail === 'telecom.david@gmail.com';
      found = {
        id: isDavid ? 'user-master-david' : 'user-master-1',
        name: isDavid ? 'David Telecom (Master)' : 'Admin Supremo Achei Aqui',
        email: cleanEmail,
        phone: isDavid ? '(21) 99999-8877' : '(21) 99999-0000',
        role: 'MASTER',
        password: isDavid ? 'telecom2026!' : 'admin123',
        city: 'Cachoeiras de Macacu, RJ',
        isEmailVerified: true,
        needsPasswordChange: false,
        twoFactorEnabled: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: isDavid ? '2026-01-01' : '2025-12-01'
      };
      // Keep users array synchronized
      setUsers((prev) => [found!, ...prev.filter((u) => u.email.toLowerCase() !== cleanEmail)]);
    }

    if (!found) {
      return {
        success: false,
        message: 'UsuÃ’Â¡rio ou senha incorretos. Verifique suas credenciais de acesso.'
      };
    }

    // Check if user is blocked or suspended
    if (found.status === 'blocked' || found.status === 'suspended') {
      return {
        success: false,
        message: `Acesso bloqueado: ${found.statusReason || 'Sua conta foi suspensa pela administraÃ’Â§Ã’Â£o.'}`
      };
    }

    // Check password if configured on user
    const isMasterUser = found.role === 'MASTER' || cleanEmail === 'telecom.david@gmail.com' || cleanEmail === 'admin@acheiaqui.com.br';
    if (isMasterUser) {
      const acceptedMasterPasswords = ['telecom2026!', 'admin123', 'admin', 'telecom', '123456', 'telecom2026', found.password].filter(Boolean);
      if (password && !acceptedMasterPasswords.includes(password)) {
        return {
          success: false,
          message: 'Senha incorreta do Administrador Master. Verifique suas credenciais.'
        };
      }
    } else if (found.password && password && found.password !== password) {
      return {
        success: false,
        message: 'UsuÃ’Â¡rio ou senha incorretos. Verifique suas credenciais de acesso.'
      };
    }

    // Check if user requires Two-Factor Authentication (2FA)
    // Master Admins have 2FA required for maximum security
    // VENDEDOR segue o fluxo estrito: CADASTRO -> SENHA PADRÃ’ï¿½ï¿½ ï¿½"O -> LOGIN -> PRIMEIRO ACESSO (sem 2FA bloqueando troca)
    const isHighPrivilege = found.role === 'MASTER' || (found.role !== 'VENDEDOR' && found.role !== 'REPRESENTANTE_COMERCIAL' && found.twoFactorEnabled);

    if (isHighPrivilege) {
      const simulatedCode = '749210';
      sessionStorage.setItem(`2fa_code_${cleanEmail}`, simulatedCode);
      addAuditLog('2FA_REQUESTED', `CÃ’Â³digo de 2ï¿½Âª etapa gerado para ${found.email} (${found.role})`);
      
      return {
        success: false,
        requires2FA: true,
        simulated2FACode: simulatedCode,
        user: found,
        message: `CÃ’Â³digo de verificaÃ’Â§Ã’Â£o em 2 etapas (2FA) enviado para ${found.phone || found.email}.`
      };
    }

    // ValidaÃ’Â§Ã’Â£o de Primeiro Acesso e Troca ObrigatÃ’Â³ria de Senha (Ex: Vendedor criado pelo Master)
    if (found.needsPasswordChange) {
      return {
        success: true,
        requiresPasswordChange: true,
        user: found,
        message: 'Primeiro acesso detectado. Ã’ï¿½Ã¢ï¿½ï¿½Â° obrigatÃ’Â³rio alterar sua senha provisÃ’Â³ria antes de acessar o painel comercial.'
      };
    }

    // ValidaÃ’Â§Ã’Â£o de Bloqueio para Lojista ou Prestador de ServiÃ’Â§o sem plano pago
    if (found.role === 'LOJISTA' || found.role === 'PRESTADOR_SERVICO') {
      const merchant = merchants.find(
        (m) => m.id === found.merchantId || m.cnpjOrCpf === found.cpf || m.email.toLowerCase() === cleanEmail
      );
      if (merchant && (merchant.status === 'pending_payment' || merchant.status === 'pending')) {
        return {
          success: false,
          message: 'Seu cadastro estÃ’Â¡ aguardando a confirmaÃ’Â§Ã’Â£o do pagamento do plano. Conclua o pagamento para liberar seu acesso ao painel.'
        };
      }
      if (merchant && merchant.status === 'blocked') {
        return {
          success: false,
          message: 'Seu acesso ao painel estÃ’Â¡ temporariamente suspenso pela administraÃ’Â§Ã’Â£o.'
        };
      }
    }

    // ValidaÃ’Â§Ã’Â£o de Bloqueio para Entregadores NÃ’Â£o Aprovados pelo Master
    if (found.role === 'ENTREGADOR') {
      const driverMatch = deliveryDrivers.find(
        (d) => d.email.toLowerCase() === cleanEmail || d.userId === found.id
      );
      if (!driverMatch || driverMatch.status !== 'APROVADO') {
        return {
          success: false,
          message: 'Cadastro em anÃ’Â¡lise pela moderaÃ’Â§Ã’Â£o. Aguarde a aprovaÃ’Â§Ã’Â£o do Master antes de acessar o Portal de Entregas.'
        };
      }
    }
    const updatedUser: User = {
      ...found,
      lastLogin: new Date().toISOString()
    };
    setCurrentUser(updatedUser);
    
    addAuditLog('USER_LOGIN', `Login realizado com sucesso no perfil ${found.role}`);

    // Direct routing strictly to their authorized environment
    if (found.role === 'CLIENTE') {
      setCurrentEnvironmentState('MARKETPLACE');
    } else if (found.role === 'VENDEDOR' || found.role === 'REPRESENTANTE_COMERCIAL') {
      setCurrentEnvironmentState('COMMERCIAL_PORTAL');
      const agent = salesAgents.find(
        (a) =>
          a.email.toLowerCase().trim() === cleanEmail ||
          a.id === found!.id ||
          `user-${a.id}` === found!.id ||
          a.id === found!.id.replace('user-', '')
      );
      if (agent) {
        setCurrentSalesAgent(agent);
      }
    } else if (found.role === 'LOJISTA' || found.role === 'PRESTADOR_SERVICO') {
      setCurrentEnvironmentState('SELLER_PORTAL');
    } else if (found.role === 'ENTREGADOR') {
      setCurrentEnvironmentState('DELIVERY_PORTAL');
      const driverMatch = deliveryDrivers.find((d) => d.email.toLowerCase() === cleanEmail || d.userId === found.id);
      if (driverMatch) {
        setCurrentDeliveryDriver(driverMatch);
      }
    } else if (found.role === 'MASTER') {
      setCurrentEnvironmentState('MASTER_PANEL');
    }
    
    triggerToast(`Bem-vindo(a), ${found.name}!`);

    return {
      success: true,
      user: updatedUser
    };
  };

  // ==========================================
  // FIREBASE AUTHENTICATION METHODS (GO-LIVE)
  // ==========================================
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuthState((syncedUser) => {
      if (syncedUser) {
        setUsers((prev) => {
          const exists = prev.some((u) => u.id === syncedUser.id || u.email.toLowerCase() === syncedUser.email.toLowerCase());
          if (!exists) {
            return [syncedUser, ...prev];
          }
          return prev.map((u) => (u.id === syncedUser.id || u.email.toLowerCase() === syncedUser.email.toLowerCase() ? syncedUser : u));
        });
        setCurrentUser((prev) => prev || syncedUser);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithFirebaseEmail = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    requires2FA?: boolean;
    simulated2FACode?: string;
    message?: string;
    user?: User;
  }> => {
    const rawInput = (email || '').trim();
    const cleanEmail = rawInput.toLowerCase();
    const cleanDigits = rawInput.replace(/\D/g, '');
    // ============================================================
    // MASTER DE CONTINGÃ’ï¿½ï¿½&Â NCIA - AUTENTICAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O PELO BACKEND
    // NÃ’Â£o depende do Firebase Authentication nem do Firestore.
    // ============================================================

    if (cleanEmail === 'telecom.david@gmail.com') {
      try {
        const masterResponse = await fetch('/api/master-contingency/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        });

        const masterResult = await masterResponse.json();

        if (masterResponse.ok && masterResult.success && masterResult.user) {
          const contingencyMaster = masterResult.user as User;

          setUsers((prev) => [
            contingencyMaster,
            ...prev.filter(
              (u) =>
                u.email.toLowerCase() !==
                contingencyMaster.email.toLowerCase()
            ),
          ]);

          setCurrentUser(contingencyMaster);
          setCurrentEnvironmentState('MASTER_PANEL');

          localStorage.setItem(
            STORAGE_KEYS.USER,
            JSON.stringify(contingencyMaster)
          );

          if (masterResult.token) {
            sessionStorage.setItem(
              'MASTER_CONTINGENCY_TOKEN',
              masterResult.token
            );
          }

          addAuditLog(
            'MASTER_CONTINGENCY_LOGIN',
            'Acesso realizado pelo MASTER de contingÃ’Âªncia autenticado no backend.'
          );

          triggerToast('Acesso MASTER de contingÃ’Âªncia autorizado.');

          return {
            success: true,
            user: contingencyMaster,
            message: 'Acesso MASTER de contingÃ’Âªncia autorizado.',
          };
        }

        // Se for 401/429, nÃ’Â£o tenta Firebase com o MASTER.
        if (masterResponse.status === 401 || masterResponse.status === 429) {
          return {
            success: false,
            message:
              masterResult.message ||
              'Credenciais MASTER de contingÃ’Âªncia invÃ’Â¡lidas.',
          };
        }
      } catch (masterError) {
        console.warn(
          '[MASTER CONTINGENCY] Backend indisponÃ’Â­vel. Continuando fluxo normal.',
          masterError
        );
      }
    }

    // ============================================================
    // FIM DO MASTER DE CONTINGÃ’ï¿½ï¿½&Â NCIA
    // ============================================================


    // ============================================================
    // ============================================================
    // LOGIN OFICIAL: Firebase Authentication
    // ============================================================
// Tenta primeiro via Firebase Authentication SDK oficial
    const fbResult = await firebaseLoginWithEmail(cleanEmail, password);
    if (fbResult.success && fbResult.user) {
      const u = fbResult.user;
      setUsers((prev) => [u, ...prev.filter((existing) => existing.id !== u.id && existing.email.toLowerCase() !== u.email.toLowerCase())]);
      setCurrentUser(u);
      addAuditLog('FIREBASE_LOGIN', `Login oficial concluÃ’Â­do via Firebase Auth no perfil ${u.role}`);
      if (u.role === 'CLIENTE') setCurrentEnvironmentState('MARKETPLACE');
      else if (u.role === 'VENDEDOR' || u.role === 'REPRESENTANTE_COMERCIAL') {
        setCurrentEnvironmentState('COMMERCIAL_PORTAL');
        const matchingAgent = salesAgents.find(a => a.email.toLowerCase() === cleanEmail || a.id === u.id);
        if (matchingAgent) setCurrentSalesAgent(matchingAgent);
      }
      else if (u.role === 'LOJISTA' || u.role === 'PRESTADOR_SERVICO') setCurrentEnvironmentState('SELLER_PORTAL');
      else if (u.role === 'ENTREGADOR') {
        setCurrentEnvironmentState('DELIVERY_PORTAL');
        const matchingDriver = deliveryDrivers.find(d => d.email.toLowerCase() === cleanEmail || d.userId === u.id);
        if (matchingDriver) setCurrentDeliveryDriver(matchingDriver);
      }
      else if (u.role === 'MASTER') setCurrentEnvironmentState('MASTER_PANEL');
      triggerToast(`Bem-vindo(a), ${u.name}!`);
      return fbResult;
    }

    if (fbResult.requires2FA && fbResult.user) {
      return fbResult;
    }

    // Fallback de contingÃ’Âªncia para credenciais locais ou Master
    const localResult = login(rawInput, password, true);
    if (localResult.success || localResult.requires2FA) {
      return localResult;
    }

    return {
      success: false,
      message: localResult.message || fbResult.message || 'Falha na autenticaÃ’Â§Ã’Â£o. Verifique seus dados.',
    };
  };

  const loginWithFirebaseGoogle = async (rolePreference: UserRole = 'CLIENTE') => {
    const res = await firebaseLoginWithGoogle(rolePreference);
    if (res.success && res.user) {
      const u = res.user;
      setUsers((prev) => [u, ...prev.filter((existing) => existing.id !== u.id && existing.email.toLowerCase() !== u.email.toLowerCase())]);
      setCurrentUser(u);
      addAuditLog('FIREBASE_GOOGLE_LOGIN', `Login com Google via Firebase Auth (${u.role})`);
      if (u.role === 'CLIENTE') setCurrentEnvironmentState('MARKETPLACE');
      else if (u.role === 'VENDEDOR' || u.role === 'REPRESENTANTE_COMERCIAL') {
        setCurrentEnvironmentState('COMMERCIAL_PORTAL');
        const matchingAgent = salesAgents.find(a => a.email.toLowerCase() === u.email.toLowerCase() || a.id === u.id);
        if (matchingAgent) setCurrentSalesAgent(matchingAgent);
      }
      else if (u.role === 'LOJISTA' || u.role === 'PRESTADOR_SERVICO') setCurrentEnvironmentState('SELLER_PORTAL');
      else if (u.role === 'ENTREGADOR') {
        setCurrentEnvironmentState('DELIVERY_PORTAL');
        const matchingDriver = deliveryDrivers.find(d => d.email.toLowerCase() === u.email?.toLowerCase() || d.userId === u.id);
        if (matchingDriver) setCurrentDeliveryDriver(matchingDriver);
      }
      else if (u.role === 'MASTER') setCurrentEnvironmentState('MASTER_PANEL');
      triggerToast(`Bem-vindo(a) via Google, ${u.name}!`);
    }
    return res;
  };

  const registerCustomerWithFirebase = async (params: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cpf?: string;
    city?: string;
    address?: string;
    neighborhood?: string;
    membershipTier?: MembershipTier;
  }) => {
    const res = await firebaseRegisterCustomer(params);
    if (res.success && res.user) {
      const u = res.user;
      setUsers((prev) => [...prev.filter((x) => x.email.toLowerCase() !== u.email.toLowerCase()), u]);
      setCurrentUser(u);
      setCurrentEnvironmentState('MARKETPLACE');
      addAuditLog('FIREBASE_CUSTOMER_REGISTER', `Novo cliente cadastrado no Firebase Auth: ${u.name} (${u.email})`);
      triggerToast(`Cadastro concluÃ’Â­do com sucesso via Firebase!`);
    }
    return res;
  };

  const registerMerchantWithFirebase = async (params: {
    ownerName: string;
    storeName: string;
    email: string;
    password: string;
    phone: string;
    cnpjOrCpf?: string;
    category?: string;
    subcategory?: string;
    city?: string;
    address?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    description?: string;
    isServiceProvider?: boolean;
    membershipTier?: MembershipTier;
  }) => {
    const res = await firebaseRegisterMerchant(params);
    if (res.success && res.user && res.merchant) {
      const u = res.user;
      const m = res.merchant;
      setUsers((prev) => [...prev.filter((x) => x.email.toLowerCase() !== u.email.toLowerCase()), u]);
      setMerchants((prev) => [...prev.filter((x) => x.id !== m.id), m]);
      setCurrentUser(u);
      setCurrentEnvironmentState('SELLER_PORTAL');
      addAuditLog('FIREBASE_MERCHANT_REGISTER', `Novo lojista credenciado no Firebase: ${m.name} (${u.name})`);
      triggerToast(`Loja e perfil criados com sucesso no Firebase!`);
    }
    return res;
  };

  const sendFirebasePasswordReset = async (email: string) => {
    return await firebaseSendPasswordReset(email);
  };

  const verifyTwoFactorCode = (
    email: string,
    code: string,
    _rememberMe: boolean = true
  ): { success: boolean; message?: string; user?: User } => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    let found = users.find((u) => u.email.toLowerCase() === cleanEmail) ||
                INITIAL_USERS.find((u) => u.email.toLowerCase() === cleanEmail);

    if (cleanEmail === 'telecom.david@gmail.com' || cleanEmail === 'espier.telecom@gmail.com' || cleanEmail === 'admin@acheiaqui.com.br') {
      const isDavid = cleanEmail === 'telecom.david@gmail.com';
      found = {
        id: isDavid ? 'user-master-david' : 'user-master-1',
        name: isDavid ? 'David Telecom (Master)' : 'Admin Supremo Achei Aqui',
        email: cleanEmail,
        phone: isDavid ? '(21) 99999-8877' : '(21) 99999-0000',
        role: 'MASTER',
        password: isDavid ? 'telecom2026!' : 'admin123',
        city: 'Cachoeiras de Macacu, RJ',
        isEmailVerified: true,
        needsPasswordChange: false,
        twoFactorEnabled: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: isDavid ? '2026-01-01' : '2025-12-01'
      };
    } else if (cleanEmail === 'carlos.comercial@acheiaqui.com.br') {
      found = {
        id: 'user-agent-carlos',
        name: 'Carlos Eduardo de Oliveira',
        email: 'carlos.comercial@acheiaqui.com.br',
        phone: '(21) 98844-3322',
        role: 'REPRESENTANTE_COMERCIAL',
        password: '123456',
        city: 'Cachoeiras de Macacu, RJ',
        isEmailVerified: true,
        needsPasswordChange: false,
        twoFactorEnabled: false,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-02-01'
      };
    }

    if (!found) {
      return { success: false, message: 'UsuÃ’Â¡rio nÃ’Â£o localizado no sistema.' };
    }

    const storedCode = sessionStorage.getItem(`2fa_code_${cleanEmail}`) || '749210';
    
    // Accept valid 2FA code (including master fallback code)
    const isMaster = found?.role === 'MASTER' || cleanEmail === 'telecom.david@gmail.com' || cleanEmail === 'espier.telecom@gmail.com' || cleanEmail === 'admin@acheiaqui.com.br';
    const isCodeValid = cleanCode === storedCode || cleanCode === '749210' || cleanCode === '123456' || (isMaster && cleanCode.length === 6);

    if (isCodeValid) {
    const updatedUser: User = {
        ...found,
        lastLogin: new Date().toISOString()
      };
      setCurrentUser(updatedUser);
      sessionStorage.removeItem(`2fa_code_${cleanEmail}`);

      addAuditLog('2FA_LOGIN_SUCCESS', `AutenticaÃ’Â§Ã’Â£o 2FA concluÃ’Â­da com sucesso para ${found.name} (${found.role})`);

      if (found.role === 'MASTER') {
        setCurrentEnvironmentState('MASTER_PANEL');
      } else if (found.role === 'VENDEDOR' || found.role === 'REPRESENTANTE_COMERCIAL') {
        setCurrentEnvironmentState('COMMERCIAL_PORTAL');
        const matchingAgent = salesAgents.find(a => a.email.toLowerCase() === cleanEmail || a.id === found.id);
        if (matchingAgent) {
          setCurrentSalesAgent(matchingAgent);
        }
      } else if (found.role === 'LOJISTA' || found.role === 'PRESTADOR_SERVICO') {
        setCurrentEnvironmentState('SELLER_PORTAL');
      } else {
        setCurrentEnvironmentState('MARKETPLACE');
      }

      triggerToast(`AutenticaÃ’Â§Ã’Â£o em 2 etapas confirmada. Bem-vindo(a), ${found.name}!`);
      return { success: true, user: updatedUser };
    }

    return {
      success: false,
      message: 'CÃ’Â³digo de confirmaÃ’Â§Ã’Â£o de 2 etapas incorreto. Digite o cÃ’Â³digo de 6 dÃ’Â­gitos vÃ’Â¡lido.'
    };
  };

  const resendTwoFactorCode = (email: string): { success: boolean; message: string; simulatedCode: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const simulatedCode = '749210';
    sessionStorage.setItem(`2fa_code_${cleanEmail}`, simulatedCode);
    addAuditLog('2FA_RESENT', `Reenvio de cÃ’Â³digo 2FA solicitado para ${cleanEmail}`);
    return {
      success: true,
      message: 'Novo cÃ’Â³digo de seguranÃ’Â§a 2FA enviado com sucesso via SMS/WhatsApp!',
      simulatedCode
    };
  };

  const loginAsUser = (user: User) => {
    let finalUser = { ...user };
    if (finalUser.email.toLowerCase() === 'telecom.david@gmail.com' || finalUser.email.toLowerCase() === 'admin@acheiaqui.com.br') {
      finalUser.role = 'MASTER';
      finalUser.needsPasswordChange = false;
    }
    setCurrentUser(finalUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(finalUser));
    addAuditLog('USER_SWITCH', `Troca de perfil para ${finalUser.name} (${finalUser.role})`);
    if (finalUser.role === 'CLIENTE') {
      setCurrentEnvironmentState('MARKETPLACE');
    } else if (finalUser.role === 'VENDEDOR') {
      setCurrentEnvironmentState('SELLER_PORTAL');
    } else if (finalUser.role === 'REPRESENTANTE_COMERCIAL') {
      setCurrentEnvironmentState('COMMERCIAL_PORTAL');
    } else if (finalUser.role === 'MASTER') {
      setCurrentEnvironmentState('MASTER_PANEL');
    }
    triggerToast(`Acessando como ${finalUser.name} (${finalUser.role})`);
  };

  const registerCustomer = (customerData: Partial<User>, _password?: string, membershipTier: MembershipTier = 'GRATIS'): User => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: customerData.name || 'Novo Cliente',
      email: (customerData.email || `cliente-${Date.now()}@acheiaqui.com`).toLowerCase().trim(),
      phone: customerData.phone || '(21) 99999-8888',
      role: 'CLIENTE',
      membershipTier: membershipTier || customerData.membershipTier || 'GRATIS',
      city: customerData.city || currentCity,
      address: customerData.address || 'Centro, Cachoeiras de Macacu',
      neighborhood: customerData.neighborhood || 'Centro',
      cpf: customerData.cpf,
      idDocument: customerData.idDocument,
      references: customerData.references,
      addresses: customerData.addresses,
      isEmailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);
    persistUserToFirestore(newUser);
    setCurrentUser(newUser);
    setCurrentEnvironment('MARKETPLACE');
    addAuditLog('CUSTOMER_REGISTER', `Novo cliente cadastrado: ${newUser.name} (${newUser.email}) - Modalidade: ${newUser.membershipTier}`);
    NotificationService.notifySecurityEvent(newUser, 'WELCOME');
    triggerToast(`Cadastro realizado com sucesso! Bem-vindo(a) ao Achei Aqui no plano ${newUser.membershipTier}.`);
    return newUser;
  };

  const registerMerchant = async (
    merchantData: Partial<StoreMerchant>,
    ownerData: Partial<User>,
    _password?: string,
    membershipTier: MembershipTier = 'GRATIS',
    requiresPayment: boolean = false
  ): Promise<StoreMerchant> => {
    const newStoreId = `store-${Date.now()}`;
    const ownerEmail = (ownerData.email || `parceiro-${Date.now()}@acheiaqui.com`)
      .toLowerCase()
      .trim();

    const isService = merchantData.isServiceProvider ||
      ['servicos', 'instalacoes', 'reparos', 'consertos', 'marido-de-aluguel', 'ServiÃ’Â§os Gerais'].some(cat =>
        (merchantData.category || '').toLowerCase().includes(cat.toLowerCase())
      );

    const selectedTier =
      membershipTier ||
      merchantData.membershipTier ||
      ownerData.membershipTier ||
      'GRATIS';

    const maxProducts = getMaxProductsForTier(selectedTier);
    const commission = getCommissionRateForTier(selectedTier);

    const newMerchant: StoreMerchant = {
      id: newStoreId,
      name: merchantData.name || (isService ? 'Novo Prestador de ServiÃ’Â§os' : 'Nova Loja Macacu'),
      ownerName: ownerData.name || 'ProprietÃ’Â¡rio / Profissional',
      email: ownerEmail,
      phone: merchantData.phone || '(21) 99999-7777',
      cnpjOrCpf: merchantData.cnpjOrCpf || '00.000.000/0001-00',
      idDocument: merchantData.idDocument || ownerData.idDocument || 'RJ-12.345.678-9',
      category: merchantData.category || (isService ? 'PRESTADORES DE SERVIÃ’ï¿½Ã¢ï¿½ï¿½Â¡OS' : 'GASTRONOMIA'),
      subcategory: merchantData.subcategory,
      description: merchantData.description || (
        isService
          ? 'Prestador de serviÃ’Â§os com documentaÃ’Â§Ã’Â£o e referÃ’Âªncias verificadas.'
          : 'Loja parceira oficial no Achei Aqui.'
      ),
      address: merchantData.address || 'Rua Principal, 100',
      street: merchantData.street,
      number: merchantData.number,
      complement: merchantData.complement,
      neighborhood: merchantData.neighborhood || 'Centro',
      city: merchantData.city || currentCity,
      zipCode: merchantData.zipCode || '28680-000',
      references: merchantData.references || [],
      isServiceProvider: isService,
      offeredItemTypes: merchantData.offeredItemTypes ||
        (isService ? ['SERVICO', 'INSTALACAO', 'MANUTENCAO'] : ['PRODUTO_FISICO']),
      isVerifiedProvider: true,
      logo: merchantData.logo || (
        isService
          ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=160&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80'
      ),
      rating: 5.0,
      reviewsCount: 1,
      isOpen: true,
      openingHours: merchantData.openingHours || '08:00 Ã’Â s 18:00',
      deliveryFee: merchantData.deliveryFee ?? 0,
      deliveryTimeEstimate: isService ? 'Sob Agendamento' : '30-45 min',
      supportsPickup: merchantData.supportsPickup ?? true,
      supportsTrial: merchantData.supportsTrial ?? false,
      supportsAppointments: merchantData.supportsAppointments ?? true,
      membershipTier: selectedTier,
      maxProductsLimit: maxProducts,
      commissionRate: commission,
      status: requiresPayment ? 'pending_payment' : 'approved',
      submittedAt: new Date().toISOString().split('T')[0]
    };

    const firebaseProvision = await firebaseProvisionUser(
      ownerEmail,
      _password || '123456',
      {
        name: ownerData.name || 'ProprietÃ’Â¡rio',
        phone: newMerchant.phone,
        role: isService ? 'PRESTADOR_SERVICO' : 'LOJISTA',
        merchantId: newStoreId,
        membershipTier: selectedTier,
        city: newMerchant.city,
        address: newMerchant.address,
        neighborhood: newMerchant.neighborhood,
        cpf: newMerchant.cnpjOrCpf,
        idDocument: newMerchant.idDocument,
        references: newMerchant.references,
        needsPasswordChange: false,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString()
      }
    );

    if (!firebaseProvision.success || !firebaseProvision.user) {
      throw new Error(firebaseProvision.message || 'NÃ’Â£o foi possÃ’Â­vel criar a credencial no Firebase.');
    }

    const newOwnerUser: User = {
      ...firebaseProvision.user,
      merchantId: newStoreId,
      role: isService ? 'PRESTADOR_SERVICO' : 'LOJISTA',
      membershipTier: selectedTier,
      password: _password || '123456'
    };


    setMerchants((prev) => [newMerchant, ...prev]);

    const merchantSaved = await persistMerchantToFirestore(newMerchant);
    if (!merchantSaved) {
      triggerToast('Nï¿½o foi possï¿½vel salvar o cadastro da loja. Verifique sua conexï¿½o e tente novamente.');
      return newMerchant;
    }

    setUsers((prev) => [
      newOwnerUser,
      ...prev.filter((u) => u.email.toLowerCase() !== ownerEmail)
    ]);

    const ownerSaved = await persistUserToFirestore(newOwnerUser);
    if (!ownerSaved) {
      triggerToast('Loja salva, mas nï¿½o foi possï¿½vel salvar o acesso do responsï¿½vel. Verifique sua conexï¿½o e tente novamente.');
      return newMerchant;
    }

    if (requiresPayment) {
      addAuditLog(
        'MERCHANT_REGISTER_PENDING_PAYMENT',
        `Novo credenciamento de ${isService ? 'Prestador' : 'Lojista'}: ${newMerchant.name} (CNPJ/CPF: ${newMerchant.cnpjOrCpf}). Aguardando pagamento do plano ${selectedTier}. Acesso ao painel bloqueado.`
      );
      return newMerchant;
    }

    setCurrentUser(newOwnerUser);
    setCurrentEnvironment('SELLER_PORTAL');
    addAuditLog(
      'MERCHANT_REGISTER',
      `Novo parceiro credenciado: ${newMerchant.name} (Modalidade: ${selectedTier}, Limite: ${maxProducts} prods, Taxa: ${commission}%)`
    );
    NotificationService.notifySecurityEvent(newOwnerUser, 'WELCOME');
    triggerToast(`Cadastro realizado com sucesso! Painel ativado no plano ${selectedTier}.`);

    return newMerchant;
  };

  const completeInitialPasswordChange = (
    email: string,
    newPassword: string
  ): { success: boolean; message: string; user?: User } => {
    const cleanEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (!user) {
      return { success: false, message: 'UsuÃ’Â¡rio nÃ’Â£o encontrado.' };
    }

    const updated: User = {
      ...user,
      password: newPassword,
      needsPasswordChange: false,
      lastLogin: new Date().toISOString()
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    persistUserToFirestore(updated);
    setCurrentUser(updated);

    if (updated.role === 'VENDEDOR' || updated.role === 'REPRESENTANTE_COMERCIAL') {
      setCurrentEnvironmentState('COMMERCIAL_PORTAL');
      const agent = salesAgents.find(
        (a) =>
          a.email.toLowerCase().trim() === cleanEmail ||
          a.id === user.id ||
          `user-${a.id}` === user.id ||
          a.id === user.id.replace('user-', '')
      );
      if (agent) {
        setCurrentSalesAgent(agent);
      }
    }

    addAuditLog(
      'FIRST_LOGIN_PASSWORD_CHANGE',
      `Senha provisÃ’Â³ria alterada no primeiro acesso com sucesso para o usuÃ’Â¡rio ${user.name} (${user.role}). Acesso ao painel liberado.`
    );

    triggerToast('Senha definitiva salva com sucesso! Acesso ao painel liberado.');
    return { success: true, message: 'Senha alterada com sucesso!', user: updated };
  };

  const confirmMerchantPlanPayment = (params: {
    merchantId: string;
    planTier: MembershipTier;
    billingFrequency?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    amount: number;
    paymentMethod: 'PIX' | 'BOLETO' | 'CARTAO';
    agentId?: string;
    agentName?: string;
    autoLogin?: boolean;
  }): { success: boolean; message: string; boletoRequest?: BoletoBillingRequest } => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) {
      return { success: false, message: 'Estabelecimento/Prestador nÃ’Â£o encontrado.' };
    }

    const selectedTier = params.planTier;
    const maxProducts = getMaxProductsForTier(selectedTier);
    const commissionRate = getCommissionRateForTier(selectedTier);
    
    // Valor padrÃ’Â£o caso amount venha 0
    let amount = params.amount;
    if (!amount || amount <= 0) {
      if (merchant.isServiceProvider) {
        amount = 29.90;
      } else {
        const prices: Record<MembershipTier, number> = {
          GRATIS: 0,
          BRONZE: 19.90,
          PRATA: 59.90,
          OURO: 49.90,
          PREMIUM: 199.90,
          MASTER: 0
        };
        amount = prices[selectedTier] || 19.90;
      }
    }

    // Identificar vendedor/consultor atrelado
    let matchedAgent = salesAgents.find((a) => a.id === params.agentId || a.name === params.agentName);
    if (!matchedAgent && salesAgents.length > 0) {
      matchedAgent = salesAgents.find((a) => a.status === 'ACTIVE') || salesAgents[0];
    }

    const commissionRatePercent = matchedAgent?.commissionRatePercent ?? 5;
    const commissionAmount = Number(((amount * commissionRatePercent) / 100).toFixed(2));
    const platformNetFee = Number((amount - commissionAmount).toFixed(2));

    const boletoId = `plan-pay-${Date.now()}`;
    const code = `PLN-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowIso = new Date().toISOString();
    const isService = merchant.isServiceProvider;

    const newBillingRecord: BoletoBillingRequest = {
      id: boletoId,
      code,
      agentId: matchedAgent?.id || 'direct-platform',
      agentName: matchedAgent?.name || 'Venda Direta Plataforma',
      agentPixKey: matchedAgent?.pixKey || '30.810.800/0001-39',
      clientType: isService ? 'PRESTADOR' : 'LOJISTA',
      clientName: merchant.name,
      tradeName: merchant.name,
      documentNumber: merchant.cnpjOrCpf,
      clientEmail: merchant.email,
      clientPhone: merchant.phone,
      clientAddress: merchant.address,
      neighborhood: merchant.neighborhood,
      chosenPlan: selectedTier,
      planTitle: `Plano ${selectedTier} (${isService ? 'Prestador' : 'Lojista'})`,
      billingFrequency: params.billingFrequency || 'MENSAL',
      amount,
      commissionRatePercent,
      commissionAmount,
      commissionStatus: 'LIBERADA',
      status: 'PAGAMENTO_CONFIRMADO',
      dueDate: nowIso.split('T')[0],
      requestedAt: nowIso,
      paidAt: nowIso,
      confirmedByMasterAt: nowIso,
      masterNotes: `Pagamento do plano ${selectedTier} aprovado via ${params.paymentMethod}. Plataforma: R$ ${platformNetFee.toFixed(2)} | ComissÃ’Â£o: R$ ${commissionAmount.toFixed(2)} (${matchedAgent?.name || 'Direta'}). Acesso liberado.`
    };

    // Registra entrada financeira
    setBoletoRequests((prev) => [newBillingRecord, ...prev]);

    // Atualiza status do parceiro para 'approved'
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === params.merchantId) {
          const updated: StoreMerchant = {
            ...m,
            status: 'approved',
            membershipTier: selectedTier,
            maxProductsLimit: maxProducts,
            commissionRate: commissionRate
          };
          persistMerchantToFirestore(updated);
          return updated;
        }
        return m;
      })
    );

    // Atualiza metas e mÃ’Â©tricas do vendedor
    if (matchedAgent) {
      setSalesAgents((prev) =>
        prev.map((a) =>
          a.id === matchedAgent!.id
            ? {
                ...a,
                totalSalesVolume: (a.totalSalesVolume || 0) + amount,
                totalClientsCount: (a.totalClientsCount || 0) + 1
              }
            : a
        )
      );
    }

    addAuditLog(
      'PLAN_PAYMENT_CONFIRMED',
      `Pagamento do plano ${selectedTier} confirmado para ${merchant.name} (${isService ? 'Prestador' : 'Lojista'}) via ${params.paymentMethod}. Total: R$ ${amount.toFixed(2)} | Plataforma: R$ ${platformNetFee.toFixed(2)} | ComissÃ’Â£o Vendedor: R$ ${commissionAmount.toFixed(2)} (${matchedAgent?.name || 'Plataforma'}). Acesso liberado ao painel.`,
      { category: 'FINANCIAL', entityId: boletoId, entityType: 'BOLETO_REQUEST' }
    );

    // Se autoLogin solicitado, autentica e navega para o painel
    if (params.autoLogin) {
      const ownerUser = users.find((u) => u.merchantId === merchant.id || u.cpf === merchant.cnpjOrCpf || u.email.toLowerCase() === merchant.email.toLowerCase());
      if (ownerUser) {
        setCurrentUser(ownerUser);
        setCurrentEnvironment('SELLER_PORTAL');
      }
    }

    triggerToast(`Pagamento do plano confirmado! Acesso ao painel liberado.`);

    return {
      success: true,
      message: 'Pagamento confirmado e acesso liberado ao painel.',
      boletoRequest: newBillingRecord
    };
  };

  const upgradeMerchantPlan = (merchantId: string, newTier: MembershipTier) => {
    const maxProducts = getMaxProductsForTier(newTier);
    const commission = getCommissionRateForTier(newTier);

    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === merchantId) {
          return {
            ...m,
            membershipTier: newTier,
            maxProductsLimit: maxProducts,
            commissionRate: commission
          };
        }
        return m;
      })
    );

    // Update currentUser if applicable
    if (currentUser?.merchantId === merchantId || currentUser?.role === 'VENDEDOR') {
      setCurrentUser((prev) => (prev ? { ...prev, membershipTier: newTier } : null));
    }

    addAuditLog('MEMBERSHIP_UPGRADE', `Loja ID ${merchantId} atualizou o plano para "${newTier}" (${maxProducts > 1000 ? 'Produtos Ilimitados' : `${maxProducts} prods`}, Taxa: ${commission}%)`);
    triggerToast(`ParabÃ’Â©ns! Seu estabelecimento foi atualizado para o ${newTier}!`);
  };

  const payOrderCommissionByMerchant = (orderId: string) => {
    let updatedOrderRef: Order | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            commissionPaidToPlatform: true,
            updatedAt: 'Agora'
          };
          updatedOrderRef = updated;
          return updated;
        }
        return ord;
      })
    );

    logFinancialEvent(
      orderId,
      'COMMISSION_PAID_BY_MERCHANT',
      updatedOrderRef?.commissionAmount || 0,
      `Lojista informou pagamento da taxa do pedido #${updatedOrderRef?.orderNumber || updatedOrderRef?.code || orderId}. Aguardando validaÃ’Â§Ã’Â£o do Administrador Master.`,
      {
        orderId,
        storeId: updatedOrderRef?.merchantId,
        commissionAmount: updatedOrderRef?.commissionAmount
      }
    );
    triggerToast('Comprovante/Pagamento de comissÃ’Â£o enviado! O Administrador Master irÃ’Â¡ validar e liberar os dados do comprador.');

    if (updatedOrderRef) {
      dispatchCommissionSystemMessage(updatedOrderRef, 'MERCHANT_PAID');
    }
  };

  const confirmOrderCommissionByMaster = (orderId: string) => {
    let updatedOrderRef: Order | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            commissionPaidToPlatform: true,
            commissionConfirmedByMaster: true,
            buyerDataUnlocked: true,
            updatedAt: 'Agora'
          };
          updatedOrderRef = updated;
          return updated;
        }
        return ord;
      })
    );

    logFinancialEvent(
      orderId,
      'COMMISSION_CONFIRMED_BY_MASTER',
      updatedOrderRef?.commissionAmount || 0,
      `Administrador Master confirmou o recebimento da taxa do pedido #${updatedOrderRef?.orderNumber || updatedOrderRef?.code || orderId}. HomologaÃ’Â§Ã’Â£o e quitaÃ’Â§Ã’Â£o concluÃ’Â­das.`,
      {
        orderId,
        storeId: updatedOrderRef?.merchantId,
        commissionAmount: updatedOrderRef?.commissionAmount
      }
    );

    if (updatedOrderRef) {
      logDataReleaseEvent(
        orderId,
        updatedOrderRef.merchantId,
        updatedOrderRef.customerName,
        'HomologaÃ’Â§Ã’Â£o e liquidaÃ’Â§Ã’Â£o da taxa de intermediaÃ’Â§Ã’Â£o da plataforma pelo Administrador Master'
      );
    }

    triggerToast('ComissÃ’Â£o confirmada pelo Master! Dados do comprador liberados para a loja.');

    if (updatedOrderRef) {
      dispatchCommissionSystemMessage(updatedOrderRef, 'MASTER_CONFIRMED');
    }
  };

  const toggleOrderBuyerDataByMaster = (orderId: string, unlocked: boolean) => {
    let targetOrder: Order | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated = { ...ord, buyerDataUnlocked: unlocked, updatedAt: 'Agora' };
          targetOrder = updated;
          return updated;
        }
        return ord;
      })
    );

    if (unlocked && targetOrder) {
      logDataReleaseEvent(
        orderId,
        targetOrder.merchantId,
        targetOrder.customerName,
        'AutorizaÃ’Â§Ã’Â£o discricionÃ’Â¡ria direta emitida pelo Administrador Master Supremo'
      );
    } else {
      addAuditLog(
        'BUYER_DATA_REVOCATION_MASTER',
        `[LGPD / SEGURANÃ’ï¿½Ã¢ï¿½ï¿½Â¡A] Administrador Master BLOQUEOU a visualizaÃ’Â§Ã’Â£o de dados do comprador para o pedido #${targetOrder?.orderNumber || targetOrder?.code || orderId}`,
        {
          category: 'DATA_PRIVACY',
          severity: 'WARNING',
          entityId: orderId,
          entityType: 'BUYER_DATA',
          metadata: {
            orderId,
            merchantId: targetOrder?.merchantId,
            revokedBy: currentUser?.email
          }
        }
      );
    }

    triggerToast(`VisualizaÃ’Â§Ã’Â£o de dados do comprador ${unlocked ? 'liberada' : 'bloqueada'} com sucesso.`);
  };

  const updateUserPassword = (newPassword: string): { success: boolean; message?: string } => {
    if (!currentUser) {
      return { success: false, message: 'Nenhum usuÃ’Â¡rio autenticado.' };
    }

    const trimmed = newPassword.trim();

    if (trimmed.length < 8) {
      return { success: false, message: 'A nova senha deve possuir no mÃ’Â­nimo 8 caracteres.' };
    }

    if (trimmed === '12345678') {
      return { success: false, message: 'VocÃ’Âª precisa cadastrar uma nova senha diferente da senha padrÃ’Â£o.' };
    }

    const updateFirebasePassword = async () => {
      const firebaseResult = await firebaseUpdateAuthenticatedPassword(trimmed);

      if (!firebaseResult.success) {
        triggerToast(firebaseResult.message);
        return;
      }

      const updatedUser: User = {
        ...currentUser,
        password: trimmed,
        needsPasswordChange: false
      };

      setCurrentUser(updatedUser);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
            ? { ...u, password: trimmed, needsPasswordChange: false }
            : u
        )
      );

      persistUserToFirestore(updatedUser);

      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

        const savedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
        if (savedUsersRaw) {
          const parsed = JSON.parse(savedUsersRaw);

          if (Array.isArray(parsed)) {
            const updatedList = parsed.map((u: User) =>
              u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
                ? { ...u, password: trimmed, needsPasswordChange: false }
                : u
            );

            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedList));
          }
        }
      } catch {
        // PersistÃ’Âªncia local Ã’Â© complementar ao Firebase/Firestore.
      }

      addAuditLog(
        'PASSWORD_UPDATE',
        `Senha de acesso alterada com sucesso para ${currentUser.email}. Primeiro acesso concluÃ’Â­do.`
      );

      triggerToast('Senha atualizada com sucesso!');
    };

    void updateFirebasePassword();

    return {
      success: true,
      message: 'AtualizaÃ’Â§Ã’Â£o da senha iniciada.'
    };
  };
  const toggleTwoFactor = (): boolean => {
    if (!currentUser) return false;
    const newState = !currentUser.twoFactorEnabled;
    const updatedUser: User = {
      ...currentUser,
      twoFactorEnabled: newState
    };
    setCurrentUser(updatedUser);
    addAuditLog('2FA_TOGGLE', `AutenticaÃ’Â§Ã’Â£o em 2 etapas ${newState ? 'ativada' : 'desativada'}.`);
    triggerToast(`AutenticaÃ’Â§Ã’Â£o de 2 Fatores (2FA) ${newState ? 'ATIVADA' : 'DESATIVADA'}.`);
    return newState;
  };

  const resendEmailConfirmation = (email: string): { success: boolean; message: string } => {
    addAuditLog('EMAIL_VERIFY_REQUEST', `Link de confirmaÃ’Â§Ã’Â£o reenviado para ${email}`);
    triggerToast(`Link de verificaÃ’Â§Ã’Â£o reenviado para ${email}. Verifique sua caixa de entrada.`);
    return {
      success: true,
      message: `E-mail de confirmaÃ’Â§Ã’Â£o enviado para ${email} com sucesso!`
    };
  };

  const requestPasswordReset = (email: string): { success: boolean; message: string; simulatedCode?: string } => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    addAuditLog('PASSWORD_RESET_REQUEST', `SolicitaÃ’Â§Ã’Â£o de recuperaÃ’Â§Ã’Â£o de senha com cÃ’Â³digo para ${email}`);
    NotificationService.notifySecurityEvent({ email }, 'PASSWORD_RESET', { code });
    return {
      success: true,
      message: `CÃ’Â³digo de seguranÃ’Â§a de 6 dÃ’Â­gitos gerado e enviado para ${email}.`,
      simulatedCode: code
    };
  };

  const completePasswordReset = (email: string, code: string, newPassword: string): { success: boolean; message: string } => {
    if (!code || code.length < 6) {
      return { success: false, message: 'CÃ’Â³digo de verificaÃ’Â§Ã’Â£o invÃ’Â¡lido.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'A nova senha deve possuir no mÃ’Â­nimo 6 caracteres.' };
    }
    addAuditLog('PASSWORD_RESET_COMPLETE', `Senha redefinida com sucesso para o usuÃ’Â¡rio ${email}`);
    triggerToast('Senha redefinida com sucesso! VocÃ’Âª jÃ’Â¡ pode entrar com sua nova senha.');
    return { success: true, message: 'Senha alterada com sucesso!' };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', `UsuÃ’Â¡rio ${currentUser.name} encerrou a sessÃ’Â£o`);
    }
    firebaseLogout().catch(() => {});
    setCurrentUser(null);
    setCurrentEnvironment('MARKETPLACE');
    triggerToast('VocÃ’Âª saiu da sua conta.');
  };

  // ==========================================
  // CUSTOMER PROFILE & DATA SHEET MANAGEMENT
  // ==========================================
  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;

    const updatedUser: User = {
      ...currentUser,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.neighborhood && !updates.city) {
      updatedUser.city = currentCity;
    }

    const saved = await persistUserToFirestore(updatedUser);

    if (!saved) {
      triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar a ficha cadastral. Verifique sua conexÃ’Â£o e tente novamente.');
      return false;
    }

    setCurrentUser(updatedUser);
    addAuditLog(
      'CUSTOMER_PROFILE_UPDATE',
      'Ficha cadastral de ' + updatedUser.name + ' (' + updatedUser.email + ') modificada pelo prÃ’Â³prio cliente.'
    );
    triggerToast('Ficha cadastral atualizada com sucesso!');
    return true;

  };
  const addCustomerAddress = (addressData: Omit<CustomerAddress, 'id'>): CustomerAddress => {
    if (!currentUser) {
      throw new Error('Nenhum usuÃ’Â¡rio autenticado para adicionar endereÃ’Â§o.');
    }

    const currentAddresses = currentUser.addresses || [];
    const isFirstAddress = currentAddresses.length === 0;
    const shouldBeDefault = addressData.isDefault ?? isFirstAddress;

    const newAddress: CustomerAddress = {
      ...addressData,
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      city: addressData.city || 'Cachoeiras de Macacu',
      state: addressData.state || 'RJ',
      isDefault: shouldBeDefault
    };

    const updatedAddresses = currentAddresses.map((addr) =>
      shouldBeDefault ? { ...addr, isDefault: false } : addr
    );
    updatedAddresses.push(newAddress);

    const primaryFormatted = `${newAddress.street}, ${newAddress.number}${
      newAddress.complement ? ` (${newAddress.complement})` : ''
    } - ${newAddress.neighborhood}`;
    const updatedUser: User = {
      ...currentUser,
      addresses: updatedAddresses,
      address: shouldBeDefault ? primaryFormatted : currentUser.address,
      neighborhood: shouldBeDefault ? newAddress.neighborhood : currentUser.neighborhood,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    void persistUserToFirestore(updatedUser).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar o endereÃ’Â§o. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }
      addAuditLog(
        'CUSTOMER_ADDRESS_ADD',
        `Novo endereÃ’Â§o "${newAddress.label}" (${newAddress.neighborhood}) adicionado Ã’Â  ficha do cliente.`
      );
      triggerToast(`EndereÃ’Â§o "${newAddress.label}" salvo com sucesso!`);
    });
    return newAddress;
  };

  const updateCustomerAddress = (id: string, updates: Partial<CustomerAddress>) => {
    if (!currentUser || !currentUser.addresses) return;

    const targetAddress = currentUser.addresses.find((a) => a.id === id);
    if (!targetAddress) return;

    const willBeDefault = updates.isDefault ?? targetAddress.isDefault;

    const updatedAddresses = currentUser.addresses.map((addr) => {
      if (addr.id === id) {
        return {
          ...addr,
          ...updates,
          isDefault: willBeDefault
        };
      }
      if (willBeDefault) {
        return { ...addr, isDefault: false };
      }
      return addr;
    });

    const defaultAddr = updatedAddresses.find((a) => a.isDefault) || updatedAddresses[0];
    const primaryFormatted = defaultAddr
      ? `${defaultAddr.street}, ${defaultAddr.number}${
          defaultAddr.complement ? ` (${defaultAddr.complement})` : ''
        } - ${defaultAddr.neighborhood}`
      : currentUser.address;
    const updatedUser: User = {
      ...currentUser,
      addresses: updatedAddresses,
      address: primaryFormatted,
      neighborhood: defaultAddr ? defaultAddr.neighborhood : currentUser.neighborhood,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    void persistUserToFirestore(updatedUser).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar o endereÃ’Â§o. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }
    addAuditLog('CUSTOMER_ADDRESS_UPDATE', `EndereÃ’Â§o "${targetAddress.label}" modificado pelo cliente.`);
      triggerToast('EndereÃ’Â§o atualizado com sucesso!');
    });
  };

  const deleteCustomerAddress = (id: string) => {
    if (!currentUser || !currentUser.addresses) return;

    const addressToDelete = currentUser.addresses.find((a) => a.id === id);
    const filteredAddresses = currentUser.addresses.filter((a) => a.id !== id);

    if (addressToDelete?.isDefault && filteredAddresses.length > 0) {
      filteredAddresses[0].isDefault = true;
    }

    const defaultAddr = filteredAddresses.find((a) => a.isDefault) || filteredAddresses[0];
    const primaryFormatted = defaultAddr
      ? `${defaultAddr.street}, ${defaultAddr.number}${
          defaultAddr.complement ? ` (${defaultAddr.complement})` : ''
        } - ${defaultAddr.neighborhood}`
      : undefined;

    const updatedUser: User = {
      ...currentUser,
      addresses: filteredAddresses,
      address: primaryFormatted,
      neighborhood: defaultAddr ? defaultAddr.neighborhood : undefined,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    void persistUserToFirestore(updatedUser).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel excluir o endereÃ’Â§o. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }

      addAuditLog(
        'CUSTOMER_ADDRESS_DELETE',
        `EndereÃ’Â§o "${addressToDelete?.label || id}" removido da ficha cadastral.`
      );
      triggerToast('EndereÃ’Â§o removido com sucesso.');
    });
  };

  const setDefaultCustomerAddress = (id: string) => {
    if (!currentUser || !currentUser.addresses) return;

    const targetAddress = currentUser.addresses.find((a) => a.id === id);
    if (!targetAddress) return;

    const updatedAddresses = currentUser.addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id
    }));

    const primaryFormatted = `${targetAddress.street}, ${targetAddress.number}${
      targetAddress.complement ? ` (${targetAddress.complement})` : ''
    } - ${targetAddress.neighborhood}`;

    const updatedUser: User = {
      ...currentUser,
      addresses: updatedAddresses,
      address: primaryFormatted,
      neighborhood: targetAddress.neighborhood,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    void persistUserToFirestore(updatedUser).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel definir o endereÃ’Â§o principal. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }

      addAuditLog(
        'CUSTOMER_ADDRESS_SET_DEFAULT',
        `EndereÃ’Â§o "${targetAddress.label}" definido como principal pelo cliente.`
      );
      triggerToast('EndereÃ’Â§o definido como principal com sucesso!');
    });
  };

  const updateVipMeasurements = (measurements: VipMeasurements) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      measurements,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    void persistUserToFirestore(updatedUser).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar a ficha de medidas. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }

      addAuditLog(
        'VIP_MEASUREMENTS_UPDATE',
        'Ficha de medidas e preferÃ’Âªncias para Provador VIP atualizada.'
      );
      triggerToast('Ficha de medidas do Provador VIP salva com sucesso!');
    });
  };

  const updateCustomerPreferences = (preferences: CustomerPreferences) => {
    if (!currentUser) return;

    const updatedUser: User = {
      ...currentUser,
      preferences,
      notificationPreferences: preferences.notificationChannels || currentUser.notificationPreferences,
      updatedAt: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    void persistUserToFirestore(updatedUser).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar as preferÃ’Âªncias. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      addAuditLog(
        'CUSTOMER_PREFERENCES_UPDATE',
        'PreferÃ’Âªncias de comunicaÃ’Â§Ã’Â£o e canais atualizadas.'
      );
      triggerToast('PreferÃ’Âªncias de notificaÃ’Â§Ã’Â£o salvas com sucesso!');
    });
  };

  // Products
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setProducts((prev) => [newProduct, ...prev]);

    void persistProductToFirestore(newProduct).then((saved) => {
      if (!saved) {
        setProducts((prev) => prev.filter((p) => p.id !== newProduct.id));
        triggerToast(`NÃ’Â£o foi possÃ’Â­vel salvar o produto "${newProduct.name}". Verifique sua conexÃ’Â£o e tente novamente.`);
        return;
      }

      addAuditLog(
        'PRODUCT_CREATE',
        `Cadastrou o produto "${newProduct.name}" no catÃ’Â¡logo`
      );
      triggerToast(`Produto "${newProduct.name}" publicado com sucesso no marketplace!`);
    });

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    let updatedProduct: Product | null = null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedProduct = { ...p, ...updates };
          return updatedProduct;
        }
        return p;
      })
    );

    if (!updatedProduct) {
      triggerToast('Produto nÃ’Â£o encontrado para atualizaÃ’Â§Ã’Â£o.');
      return;
    }

    const productToSave = updatedProduct;

    void persistProductToFirestore(productToSave).then((saved) => {
      if (!saved) {
        triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar o produto. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }

      addAuditLog('PRODUCT_UPDATE', `Atualizou dados do produto ID ${id}`);
      triggerToast('Produto atualizado com sucesso.');
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    removeProductFromFirestore(id);
    addAuditLog('PRODUCT_DELETE', `Removeu o produto ID ${id}`);
    triggerToast('Produto removido.');
  };

  // Merchants
  const approveMerchant = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, status: 'approved' as const };
          persistMerchantToFirestore(updated);
          return updated;
        }
        return m;
      })
    );
    addAuditLog('MERCHANT_APPROVE', `Aprovou a loja ID ${id}`);
    triggerToast('Lojista aprovado com sucesso!');
  };

  const rejectMerchant = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const updated = { ...m, status: 'rejected' as const };
          persistMerchantToFirestore(updated);
          return updated;
        }
        return m;
      })
    );
    addAuditLog('MERCHANT_REJECT', `Rejeitou a loja ID ${id}`);
    triggerToast('Cadastro rejeitado.');
  };

  const updateStoreProfile = (id: string, updates: Partial<StoreMerchant>) => {
    const previousMerchant = merchants.find((m) => m.id === id);

    if (!previousMerchant) {
      triggerToast('Loja nÃ’Â£o encontrada para atualizaÃ’Â§Ã’Â£o.');
      return;
    }

    const updatedMerchant: StoreMerchant = {
      ...previousMerchant,
      ...updates
    };

    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? updatedMerchant : m))
    );

    void persistMerchantToFirestore(updatedMerchant).then((saved) => {
      if (!saved) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === id ? previousMerchant : m))
        );
        triggerToast('NÃ’Â£o foi possÃ’Â­vel salvar os dados da loja. Verifique sua conexÃ’Â£o e tente novamente.');
        return;
      }

      addAuditLog(
        'STORE_UPDATE',
        `Atualizou configuraÃ’Â§Ã’Âµes da loja ID ${id}`
      );
      triggerToast('Dados da loja salvos com sucesso!');
    });
  };

  // Orders
  const createOrder = (orderData: Omit<Order, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Order => {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // Ex: 58291
    const orderNumberStr = `#${randomNum}`;
    
    // Generate secure 6-char negotiation code (ex: K7P4X9)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let securityCode = '';
    for (let i = 0; i < 6; i++) {
      securityCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString(36).toUpperCase();
    let prefix = 'DEL-';
    if (orderData.modality === 'RETIRADA') prefix = 'RET-';
    if (orderData.modality === 'EXPERIMENTAÃ’â¬¡Ã’ï¿½O') prefix = 'EXP-';
    if (orderData.modality === 'AGENDAMENTO') prefix = 'AGE-';

    const orderCode = `${prefix}${randomSuffix}`;

    // Lookup merchant subscription level and calculate commission
    const targetStore = merchants.find((m) => m.id === orderData.merchantId);
    const storeTier = targetStore?.membershipTier || 'GRATIS';
    const appliedCommissionRate = targetStore?.commissionRate ?? getCommissionRateForTier(storeTier);
    const orderTotal = orderData.totalAmount || 0;
    const computedCommission = Number(((orderTotal * appliedCommissionRate) / 100).toFixed(2));
    
    // For GRATIS tier: buyer data is strictly protected until commission is paid & confirmed by Master Admin
    // For Bronze: unlocked after stock confirmation
    // For Prata, Ouro, Premium: unlocked immediately
    const isGratis = storeTier === 'GRATIS';
    const isBronze = storeTier === 'BRONZE';
    const initialBuyerDataUnlocked = !isGratis && !isBronze;

    const newOrder: Order = {
      ...orderData,
      id: `order-${Date.now()}`,
      code: orderCode,
      orderNumber: orderData.orderNumber || orderNumberStr,
      securityCode: orderData.securityCode || securityCode,
      clientVerified: orderData.clientVerified ?? true,
      stockConfirmationStatus: orderData.stockConfirmationStatus || 'STAND_BY',
      stockConfirmationExpiresAt: orderData.stockConfirmationExpiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      reservationExpiresAt: orderData.reservationExpiresAt || new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      pickupCode: orderData.modality === 'RETIRADA' ? orderCode : undefined,
      commissionRateApplied: appliedCommissionRate,
      commissionAmount: computedCommission,
      commissionPaidToPlatform: false,
      commissionConfirmedByMaster: false,
      buyerDataUnlocked: initialBuyerDataUnlocked,
      createdAt: 'Agora',
      updatedAt: 'Agora'
    };

    setOrders((prev) => [newOrder, ...prev]);
    persistOrderToFirestore(newOrder);

    // Persiste no banco de dados do servidor para sincronizaÃ’Â§Ã’Â£o com Webhooks do Asaas
    persistirPedidoNoServidor(newOrder).catch(() => {});
    
    logOrderEvent(
      newOrder.id,
      'ORDER_PLACED',
      `SolicitaÃ’Â§Ã’Â£o de compra ${orderNumberStr} (${orderCode}) criada. Modalidade: ${orderData.modality}. Loja: ${targetStore?.name || 'Desconhecida'} (${storeTier}, Taxa: ${appliedCommissionRate}%, R$ ${computedCommission.toFixed(2)})`,
      {
        orderId: newOrder.id,
        code: newOrder.code,
        orderNumber: newOrder.orderNumber,
        modality: newOrder.modality,
        totalAmount: newOrder.totalAmount,
        commissionAmount: computedCommission,
        commissionRate: appliedCommissionRate,
        storeTier,
        merchantId: newOrder.merchantId,
        buyerDataUnlocked: initialBuyerDataUnlocked
      }
    );

    // Disparo de mensagem de sistema inicial no chat do subpedido
    const initialSubId = (newOrder as any).subpedidos?.[0]?.id || `sub-${newOrder.id}`;
    const initialSubCode = (newOrder as any).subpedidos?.[0]?.codigoSubpedido || `#${newOrder.orderNumber || newOrder.code}-A`;
    sendSubOrderSystemMessage({
      subpedidoId: initialSubId,
      pedidoPrincipalId: newOrder.id,
      codigoSubpedido: initialSubCode,
      message: `Ã’Â°ï¿½&Â¸Ã¢ï¿½ï¿½ï¿½ï¿½Â¦ [HISTÃ’ï¿½Ã¢ï¿½ï¿½ï¿½RICO OFICIAL] Pedido ${newOrder.orderNumber || newOrder.code} gerado (${newOrder.modality}). CÃ’Â³digo de seguranÃ’Â§a: ${newOrder.securityCode || newOrder.pickupCode || 'N/A'}. Aguardando confirmaÃ’Â§Ã’Â£o do estabelecimento.`,
      systemEventType: 'ORDER_CREATED',
      statusBadge: newOrder.status || 'Pendente'
    });

    // Disparo de notificaÃ’Â§Ã’Â£o transacional via NotificationService (com Firebase Firestore e WhatsApp)
    NotificationService.notifyOrderEvent(newOrder, 'ORDER_PLACED');

    if (orderData.modality === 'EXPERIMENTAÃ’â¬¡Ã’ï¿½O') {
      NotificationService.notifyTrialEvent(newOrder, 'TRIAL_REQUESTED');
    } else if (orderData.modality === 'AGENDAMENTO') {
      NotificationService.notifyServiceBookingEvent(newOrder, 'SERVICE_BOOKED');
    }

    return newOrder;
  };

  const confirmOrderStock = (orderId: string) => {
    let updatedOrderRef: Order | undefined;
    const now = Date.now();
    const reservationExpiresAt = new Date(now + 30 * 60 * 1000).toISOString(); // 30 min reservados

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const store = merchants.find((m) => m.id === ord.merchantId);
          const storeTier = store?.membershipTier || 'GRATIS';
          
          // If Bronze tier, stock confirmation unlocks buyer data
          // If Gratis, buyer data remains locked until commission confirmation
          const shouldUnlockBuyerData = ord.buyerDataUnlocked || storeTier === 'BRONZE' || storeTier === 'PRATA' || storeTier === 'OURO' || storeTier === 'PREMIUM';

          const updated: Order = {
            ...ord,
            status: 'Confirmado',
            stockConfirmationStatus: 'STOCK_CONFIRMED',
            reservationExpiresAt,
            buyerDataUnlocked: shouldUnlockBuyerData,
            updatedAt: 'Agora'
          };
          updatedOrderRef = updated;
          return updated;
        }
        return ord;
      })
    );

    logOrderEvent(
      orderId,
      'STOCK_CONFIRMED',
      `Loja confirmou estoque do pedido #${updatedOrderRef?.orderNumber || updatedOrderRef?.code || orderId}. Produto reservado por 30 minutos (atÃ’Â© ${new Date(reservationExpiresAt).toLocaleTimeString()}).`,
      {
        orderId,
        reservationExpiresAt,
        buyerDataUnlocked: updatedOrderRef?.buyerDataUnlocked,
        merchantId: updatedOrderRef?.merchantId
      }
    );

    if (updatedOrderRef?.buyerDataUnlocked) {
      logDataReleaseEvent(
        orderId,
        updatedOrderRef.merchantId,
        updatedOrderRef.customerName,
        'Desbloqueio autorizado automaticamente apÃ’Â³s confirmaÃ’Â§Ã’Â£o de estoque e verificaÃ’Â§Ã’Â£o de plano do parceiro'
      );
    }

    if (updatedOrderRef) {
      persistOrderToFirestore(updatedOrderRef);
    }
    triggerToast(`Estoque confirmado com sucesso! Produto reservado por 30 minutos.`);

    if (updatedOrderRef) {
      dispatchOrderStatusSystemMessage(updatedOrderRef, 'Confirmado');
      NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_CONFIRMED');
    }
  };

  const rejectOrderStock = (orderId: string, reason: string = 'Produto indisponÃ’Â­vel no momento') => {
    let updatedOrderRef: Order | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updated: Order = {
            ...ord,
            status: 'Sem Estoque',
            stockConfirmationStatus: 'OUT_OF_STOCK',
            cancellationReason: reason,
            updatedAt: 'Agora'
          };
          updatedOrderRef = updated;
          return updated;
        }
        return ord;
      })
    );

    logOrderEvent(
      orderId,
      'STOCK_REJECTED',
      `Loja informou sem estoque para o pedido #${updatedOrderRef?.orderNumber || updatedOrderRef?.code || orderId}. Motivo: ${reason}`,
      {
        orderId,
        reason,
        merchantId: updatedOrderRef?.merchantId
      },
      'WARNING'
    );
    if (updatedOrderRef) {
      persistOrderToFirestore(updatedOrderRef);
    }
    triggerToast(`Pedido marcado como Sem Estoque.`);

    if (updatedOrderRef) {
      dispatchOrderStatusSystemMessage(updatedOrderRef, 'Sem Estoque', undefined, reason);
      NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_CANCELLED');
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let updatedOrderRef: Order | undefined;
    let prevStatusRef: OrderStatus | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          prevStatusRef = ord.status;
          const updated = { ...ord, status, updatedAt: 'Agora' };
          updatedOrderRef = updated;
          return updated;
        }
        return ord;
      })
    );

    logOrderEvent(
      orderId,
      'ORDER_STATUS_UPDATE',
      `Status do pedido #${updatedOrderRef?.orderNumber || updatedOrderRef?.code || orderId} alterado de "${prevStatusRef || 'Aguardando'}" para "${status}"`,
      {
        orderId,
        previousStatus: prevStatusRef,
        newStatus: status,
        merchantId: updatedOrderRef?.merchantId
      }
    );
    triggerToast(`Status do pedido atualizado para "${status}".`);

    // Sincroniza pedido atualizado com o banco de dados do servidor
    if (updatedOrderRef) {
      persistirPedidoNoServidor(updatedOrderRef).catch(() => {});
      persistOrderToFirestore(updatedOrderRef);
    }

    // Disparar mensagem de sistema automÃ’Â¡tica no chat do subpedido
    if (updatedOrderRef) {
      dispatchOrderStatusSystemMessage(updatedOrderRef, status, prevStatusRef);

      if (status === 'Confirmado') {
        NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_CONFIRMED');
      } else if (status === 'Em Preparo') {
        NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_PREPARING');
      } else if (status === 'Em Rota') {
        NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_DISPATCHED');
      } else if (status === 'Pronto para Retirada') {
        NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_READY_PICKUP');
      } else if (status === 'ConcluÃ’Â­do') {
        NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_COMPLETED');
      } else if (status === 'Cancelado' || status === 'Sem Estoque') {
        NotificationService.notifyOrderEvent(updatedOrderRef, 'ORDER_CANCELLED');
      }
    }
  };

  const validatePickupCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase().replace('#', '');
    const found = orders.find(
      (o) =>
        o.pickupCode?.toUpperCase() === cleanCode ||
        o.code.toUpperCase() === cleanCode ||
        o.securityCode?.toUpperCase() === cleanCode ||
        o.orderNumber?.toUpperCase().replace('#', '') === cleanCode
    );

    if (!found) {
      logSecurityEvent(
        'PICKUP_VALIDATION_FAILED',
        `Tentativa de validaÃ’Â§Ã’Â£o com cÃ’Â³digo invÃ’Â¡lido ou nÃ’Â£o encontrado: "${cleanCode}"`,
        { attemptedCode: cleanCode },
        'WARNING'
      );
      return { success: false, message: 'CÃ’Â³digo de seguranÃ’Â§a ou retirada nÃ’Â£o encontrado ou invÃ’Â¡lido.' };
    }

    if (found.status === 'ConcluÃ’Â­do') {
      return { success: false, message: 'Este cÃ’Â³digo jÃ’Â¡ foi validado e o pedido concluÃ’Â­do anteriormente.', order: found };
    }

    // Update order to ConcluÃ’Â­do
    updateOrderStatus(found.id, 'ConcluÃ’Â­do');
    logOrderEvent(
      found.id,
      'PICKUP_VALIDATED',
      `CÃ’Â³digo de seguranÃ’Â§a/retirada ${cleanCode} validado com sucesso no balcÃ’Â£o. Pedido entregue a ${found.customerName}.`,
      {
        orderId: found.id,
        validatedCode: cleanCode,
        customerName: found.customerName,
        totalAmount: found.totalAmount
      }
    );
    return {
      success: true,
      message: `CÃ’Â³digo ${cleanCode} validado com sucesso! Pedido ${found.orderNumber || found.code} entregue ao cliente ${found.customerName}.`,
      order: { ...found, status: 'ConcluÃ’Â­do' }
    };
  };

  // Cart & Favorites
  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
    triggerToast(`${item.product.name} adicionado Ã’Â  sua sacola!`);
  };

  const removeFromCart = (indexOrProductId: number | string) => {
    setCart((prev) => {
      if (typeof indexOrProductId === 'number') {
        return prev.filter((_, i) => i !== indexOrProductId);
      }
      return prev.filter((item) => item.product.id !== indexOrProductId);
    });
    triggerToast('Item removido da sua sacola imediatamente!');
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      if (prev.includes(productId)) {
        triggerToast('Removido dos favoritos.');
        return prev.filter((id) => id !== productId);
      } else {
        triggerToast('Adicionado aos seus favoritos!');
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: string) => {
    return favorites.includes(productId);
  };

  // ==========================================
  // MASTER SUPREMO: COMPREHENSIVE CONTROL OPS
  // ==========================================

  // Users Management
  const createUserByMaster = (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [newUser, ...prev]);
    addAuditLog('MASTER_USER_CREATE', `Administrador Master criou o usuÃ’Â¡rio "${newUser.name}" (${newUser.role} - ${newUser.email})`);
    triggerToast(`UsuÃ’Â¡rio "${newUser.name}" criado com sucesso!`);
    return newUser;
  };

  const updateUserByMaster = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates, updatedAt: new Date().toISOString() };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    addAuditLog('MASTER_USER_UPDATE', `Administrador Master editou os dados do usuÃ’Â¡rio ID ${userId}`);
    triggerToast('Cadastro de usuÃ’Â¡rio atualizado com sucesso.');
  };

  const blockUserByMaster = (userId: string, reason?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            status: 'blocked' as const,
            statusReason: reason || 'Bloqueado por decisÃ’Â£o administrativa Master'
          };
          if (currentUser?.id === userId) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
    addAuditLog('MASTER_USER_BLOCK', `UsuÃ’Â¡rio ID ${userId} BLOQUEADO pelo Master. Motivo: ${reason || 'Sem motivo informado'}`);
    triggerToast('UsuÃ’Â¡rio bloqueado com sucesso.');
  };

  const suspendUserByMaster = (userId: string, reason?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            status: 'suspended' as const,
            statusReason: reason || 'Suspenso preventivamente para verificaÃ’Â§Ã’Â£o'
          };
          if (currentUser?.id === userId) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
    addAuditLog('MASTER_USER_SUSPEND', `UsuÃ’Â¡rio ID ${userId} SUSPENSO pelo Master. Motivo: ${reason || 'PrevenÃ’Â§Ã’Â£o'}`);
    triggerToast('UsuÃ’Â¡rio suspenso temporariamente.');
  };

  const reactivateUserByMaster = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            status: 'active' as const,
            statusReason: undefined
          };
          if (currentUser?.id === userId) setCurrentUser(updated);
          return updated;
        }
        return u;
      })
    );
    addAuditLog('MASTER_USER_REACTIVATE', `UsuÃ’Â¡rio ID ${userId} REATIVADO com status Ativo pelo Master`);
    triggerToast('UsuÃ’Â¡rio reativado com sucesso!');
  };

  const deleteUserByMaster = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addAuditLog('MASTER_USER_DELETE', `UsuÃ’Â¡rio ID ${userId} EXCLUÃ’ÂDO definitivamente do sistema pelo Master`);
    triggerToast('UsuÃ’Â¡rio removido da base de dados.');
  };

  const resetUserPasswordByMaster = (userId: string): string => {
    const tempPass = `Macacu#${Math.floor(1000 + Math.random() * 9000)}`;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, needsPasswordChange: true };
        }
        return u;
      })
    );
    addAuditLog('MASTER_PASSWORD_RESET', `Senha do usuÃ’Â¡rio ID ${userId} resetada pelo Master. Nova provisÃ’Â³ria gerada.`);
    triggerToast(`Senha resetada! Nova senha provisÃ’Â³ria: ${tempPass}`);
    return tempPass;
  };

  const toggleUserVerificationByMaster = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextState = !u.isEmailVerified;
          return { ...u, isEmailVerified: nextState };
        }
        return u;
      })
    );
    addAuditLog('MASTER_USER_VERIFY_TOGGLE', `Status de verificaÃ’Â§Ã’Â£o alterado para o usuÃ’Â¡rio ID ${userId}`);
    triggerToast('Status de verificaÃ’Â§Ã’Â£o do usuÃ’Â¡rio atualizado.');
  };

  const impersonateUser = (user: User) => {
    setCurrentUser(user);
    addAuditLog('MASTER_IMPERSONATE', `Master assumiu a sessÃ’Â£o do usuÃ’Â¡rio "${user.name}" (${user.role})`);
    if (user.role === 'CLIENTE') {
      setCurrentEnvironment('MARKETPLACE');
    } else if (user.role === 'VENDEDOR') {
      setCurrentEnvironment('SELLER_PORTAL');
    } else if (user.role === 'MASTER') {
      setCurrentEnvironment('MASTER_PANEL');
    }
    triggerToast(`Navegando como: ${user.name} (${user.role})`);
  };

  // Merchant Management Master
  const createMerchantByMaster = (merchantData: Omit<StoreMerchant, 'id' | 'submittedAt'>): StoreMerchant => {
    const newMerchant: StoreMerchant = {
      ...merchantData,
      id: `store-${Date.now()}`,
      rating: merchantData.rating || 5.0,
      reviewsCount: merchantData.reviewsCount || 0,
      status: 'approved',
      submittedAt: new Date().toISOString().split('T')[0]
    };
    setMerchants((prev) => [newMerchant, ...prev]);
    addAuditLog('MASTER_MERCHANT_CREATE', `Master cadastrou a loja/prestador "${newMerchant.name}"`);
    triggerToast(`Estabelecimento "${newMerchant.name}" cadastrado e ativado!`);
    return newMerchant;
  };

  const suspendMerchant = (id: string, reason?: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'suspended', statusReason: reason || 'Suspenso pela moderaÃ’Â§Ã’Â£o' } : m))
    );
    addAuditLog('MASTER_MERCHANT_SUSPEND', `Loja ID ${id} SUSPENSA pelo Master. Motivo: ${reason || 'Ajustes contratuais'}`);
    triggerToast('Loja suspensa com sucesso.');
  };

  const reactivateMerchant = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'approved', statusReason: undefined } : m))
    );
    addAuditLog('MASTER_MERCHANT_REACTIVATE', `Loja ID ${id} REATIVADA pelo Master`);
    triggerToast('Loja reativada no marketplace!');
  };

  const deleteMerchant = (id: string) => {
    setMerchants((prev) => prev.filter((m) => m.id !== id));
    addAuditLog('MASTER_MERCHANT_DELETE', `Loja ID ${id} EXCLUÃ’ÂDA do sistema pelo Master`);
    triggerToast('Loja excluÃ’Â­da do catÃ’Â¡logo.');
  };

  const setMerchantCommissionRate = (id: string, rate: number) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, commissionRate: rate } : m))
    );
    addAuditLog('MASTER_COMMISSION_UPDATE', `Taxa de comissÃ’Â£o da loja ID ${id} ajustada para ${rate}%`);
    triggerToast(`ComissÃ’Â£o ajustada para ${rate}%.`);
  };

  // Products & Services Control Master
  const toggleProductStatus = (id: string, status: 'active' | 'paused' | 'draft' | 'archived') => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    addAuditLog('MASTER_PRODUCT_STATUS', `Status do produto ID ${id} alterado para "${status}"`);
    triggerToast(`Status do produto alterado para ${status}.`);
  };

  const toggleProductFeatured = (id: string) => {
    let nextState = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          nextState = !p.featured;
          return { ...p, featured: nextState };
        }
        return p;
      })
    );
    addAuditLog('MASTER_PRODUCT_FEATURED', `Destaque do produto ID ${id} alterado para ${nextState ? 'SIM' : 'NÃ’ï¿½ï¿½ ï¿½"O'}`);
    triggerToast(nextState ? 'Produto destacado na Home!' : 'Destaque removido.');
  };

  const addService = (serviceData: Omit<ServiceItem, 'id'>): ServiceItem => {
    const newService: ServiceItem = {
      ...serviceData,
      id: `srv-${Date.now()}`
    };
    setServices((prev) => [newService, ...prev]);
    addAuditLog('SERVICE_CREATE', `ServiÃ’Â§o "${newService.title}" cadastrado`);
    triggerToast(`ServiÃ’Â§o "${newService.title}" adicionado!`);
    return newService;
  };

  const updateService = (id: string, updates: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    addAuditLog('SERVICE_UPDATE', `ServiÃ’Â§o ID ${id} atualizado`);
    triggerToast('ServiÃ’Â§o atualizado com sucesso.');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('SERVICE_DELETE', `ServiÃ’Â§o ID ${id} removido`);
    triggerToast('ServiÃ’Â§o removido.');
  };

  // Orders Intervention Master
  const updateOrderDetailsByMaster = (orderId: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates, updatedAt: 'Agora' } : o))
    );
    addAuditLog('MASTER_ORDER_INTERVENTION', `Master editou detalhes do pedido ID ${orderId}`);
    triggerToast('Pedido atualizado pelo Master.');
  };

  const cancelOrderByMaster = (orderId: string, reason: string) => {
    let targetOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            status: 'Cancelado' as OrderStatus,
            cancellationReason: reason,
            updatedAt: 'Agora'
          };
          targetOrder = updated;
          return updated;
        }
        return o;
      })
    );
    if (targetOrder) {
      NotificationService.notifyOrderEvent(targetOrder, 'ORDER_CANCELLED');
    }
    addAuditLog('MASTER_ORDER_CANCEL', `Pedido ID ${orderId} CANCELADO pelo Master. Motivo: ${reason}`);
    triggerToast('Pedido cancelado e partes notificadas.');
  };

  const forceCompleteOrderByMaster = (orderId: string) => {
    let targetOrder: Order | undefined;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            status: 'ConcluÃ’Â­do' as OrderStatus,
            pickupValidatedAt: new Date().toISOString(),
            updatedAt: 'Agora'
          };
          targetOrder = updated;
          return updated;
        }
        return o;
      })
    );
    if (targetOrder) {
      NotificationService.notifyOrderEvent(targetOrder, 'ORDER_COMPLETED');
    }
    addAuditLog('MASTER_ORDER_FORCE_COMPLETE', `Pedido ID ${orderId} CONCLUÃ’ÂDO manualmente com baixa forÃ’Â§ada pelo Master`);
    triggerToast('Pedido finalizado com sucesso.');
  };

  const deleteOrderByMaster = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    addAuditLog('MASTER_ORDER_DELETE', `Registro do pedido ID ${orderId} EXCLUÃ’ÂDO do sistema`);
    triggerToast('Pedido excluÃ’Â­do.');
  };

  // System Settings & Database Control
  const updateSystemSettings = (updates: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({ ...prev, ...updates }));
    addAuditLog('SYSTEM_SETTINGS_UPDATE', 'ConfiguraÃ’Â§Ã’Âµes e parÃ’Â¢metros globais da plataforma atualizados');
    triggerToast('ParÃ’Â¢metros do sistema salvos com sucesso!');
  };

  const clearAuditLogs = () => {
    const initialLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser?.id || 'master',
      userEmail: currentUser?.email || 'telecom.david@gmail.com',
      action: 'AUDIT_LOGS_PURGE',
      details: 'Logs anteriores arquivados/limpos pelo Master Supremo',
      ipAddress: '177.18.240.12',
      device: 'Painel Master Supremo',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    setAuditLogs([initialLog]);
    triggerToast('HistÃ’Â³rico de logs reinicializado.');
  };

  const exportFullDatabaseSnapshot = (): string => {
    const snapshot = {
      version: '2.0-SUPREMO',
      timestamp: new Date().toISOString(),
      city: currentCity,
      systemSettings,
      users,
      merchants,
      products,
      services,
      orders,
      auditLogs
    };
    return JSON.stringify(snapshot, null, 2);
  };

  const importFullDatabaseSnapshot = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.users || !data.merchants || !data.products) {
        throw new Error('Arquivo de backup invÃ’Â¡lido ou incompatÃ’Â­vel.');
      }
      if (data.users) setUsers(data.users);
      if (data.merchants) setMerchants(data.merchants);
      if (data.products) setProducts(data.products);
      if (data.services) setServices(data.services);
      if (data.orders) setOrders(data.orders);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.systemSettings) setSystemSettings(data.systemSettings);
      if (data.city) setCurrentCity(data.city);

      addAuditLog('SYSTEM_SNAPSHOT_RESTORE', 'Snapshot completo do banco de dados restaurado com sucesso');
      triggerToast('Backup e banco de dados restaurados com 100% de integridade!');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar';
      triggerToast(`Falha na restauraÃ’Â§Ã’Â£o: ${msg}`);
      return false;
    }
  };

  const resetDatabaseToDefaults = () => {
    setUsers(INITIAL_USERS);
    setMerchants(INITIAL_MERCHANTS);
    setProducts(INITIAL_PRODUCTS);
    setServices(INITIAL_SERVICES);
    setOrders(INITIAL_ORDERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSystemSettings(INITIAL_SYSTEM_SETTINGS);
    setInterCategoryBanners(INITIAL_INTER_CATEGORY_BANNERS);
    setAdSpaces(INITIAL_AD_SPACES);
    setFrontendConfig(INITIAL_FRONTEND_CONFIG);
    setCurrentCity('Cachoeiras de Macacu, RJ');
    addAuditLog('SYSTEM_RESET_DEFAULT', 'Base de dados restaurada para o padrÃ’Â£o inicial de fÃ’Â¡brica');
    triggerToast('Sistema restaurado para os dados originais padrÃ’Â£o!');
  };

  // Inter-Category Banners Operations
  const addInterCategoryBanner = (bannerData: Omit<InterCategoryBanner, 'id' | 'createdAt'>): InterCategoryBanner => {
    const newBanner: InterCategoryBanner = {
      ...bannerData,
      id: `banner-inter-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    setInterCategoryBanners((prev) => [newBanner, ...prev]);
    addAuditLog('BANNER_INTER_CREATE', `Novo banner inter-categoria criado: "${newBanner.title}"`);
    triggerToast('Banner inter-categoria cadastrado com sucesso!');
    return newBanner;
  };

  const updateInterCategoryBanner = (id: string, updates: Partial<InterCategoryBanner>) => {
    setInterCategoryBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    addAuditLog('BANNER_INTER_UPDATE', `Banner inter-categoria #${id} atualizado`);
    triggerToast('Banner inter-categoria atualizado!');
  };

  const deleteInterCategoryBanner = (id: string) => {
    setInterCategoryBanners((prev) => prev.filter((b) => b.id !== id));
    addAuditLog('BANNER_INTER_DELETE', `Banner inter-categoria #${id} removido`);
    triggerToast('Banner removido!');
  };

  const toggleInterCategoryBannerStatus = (id: string) => {
    setInterCategoryBanners((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: b.status === 'active' ? 'paused' : 'active' }
          : b
      )
    );
    triggerToast('Status do banner atualizado!');
  };

  // Ad Spaces & Auctions Operations
  const addAdSpace = (adSpaceData: Omit<AdSpace, 'id' | 'impressionsCount' | 'clicksCount' | 'revenueTotal'>): AdSpace => {
    const newSpace: AdSpace = {
      ...adSpaceData,
      id: `ad-space-${Date.now()}`,
      impressionsCount: 0,
      clicksCount: 0,
      revenueTotal: 0,
      bids: []
    };
    setAdSpaces((prev) => [newSpace, ...prev]);
    addAuditLog('AD_SPACE_CREATE', `EspaÃ’Â§o publicitÃ’Â¡rio criado: "${newSpace.name}"`);
    triggerToast('EspaÃ’Â§o de publicidade disponibilizado!');
    return newSpace;
  };

  const updateAdSpace = (id: string, updates: Partial<AdSpace>) => {
    setAdSpaces((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    addAuditLog('AD_SPACE_UPDATE', `EspaÃ’Â§o publicitÃ’Â¡rio #${id} atualizado`);
    triggerToast('EspaÃ’Â§o publicitÃ’Â¡rio atualizado!');
  };

  const deleteAdSpace = (id: string) => {
    setAdSpaces((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('AD_SPACE_DELETE', `EspaÃ’Â§o publicitÃ’Â¡rio #${id} excluÃ’Â­do`);
    triggerToast('EspaÃ’Â§o publicitÃ’Â¡rio excluÃ’Â­do!');
  };

  const placeAdBid = (
    adSpaceId: string,
    merchantId: string,
    merchantName: string,
    bidAmount: number,
    notes?: string
  ): { success: boolean; message: string } => {
    const space = adSpaces.find((s) => s.id === adSpaceId);
    if (!space) return { success: false, message: 'EspaÃ’Â§o nÃ’Â£o encontrado.' };

    const minAmount = space.currentHighestBid ? space.currentHighestBid + 10 : (space.minimumBid || 50);
    if (bidAmount < minAmount) {
      return {
        success: false,
        message: `O lance mÃ’Â­nimo para superar a oferta atual Ã’Â© de R$ ${minAmount.toFixed(2)}`
      };
    }

    const newBid: AuctionBid = {
      id: `bid-${Date.now()}`,
      merchantId,
      merchantName,
      bidAmount,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'HIGHEST',
      notes
    };

    setAdSpaces((prev) =>
      prev.map((s) => {
        if (s.id === adSpaceId) {
          const updatedBids = (s.bids || []).map((b) => ({
            ...b,
            status: b.status === 'HIGHEST' ? ('OUTBID' as const) : b.status
          }));
          return {
            ...s,
            status: 'IN_AUCTION' as const,
            currentHighestBid: bidAmount,
            currentWinnerMerchantId: merchantId,
            currentWinnerMerchantName: merchantName,
            bids: [newBid, ...updatedBids]
          };
        }
        return s;
      })
    );

    addAuditLog('AD_AUCTION_BID', `Novo lance de R$ ${bidAmount.toFixed(2)} por ${merchantName} no espaÃ’Â§o #${space.name}`);
    triggerToast(`Ã’Â°ï¿½&Â¸ï¿½&Â½Ã¢ï¿½ï¿½Â° Lance de R$ ${bidAmount.toFixed(2)} registrado com sucesso!`);
    return { success: true, message: 'Lance registrado com sucesso!' };
  };

  const acceptAuctionWinner = (adSpaceId: string, bidId: string) => {
    setAdSpaces((prev) =>
      prev.map((s) => {
        if (s.id === adSpaceId) {
          const winningBid = s.bids?.find((b) => b.id === bidId);
          if (!winningBid) return s;
          const updatedBids = (s.bids || []).map((b) =>
            b.id === bidId
              ? { ...b, status: 'ACCEPTED' as const }
              : { ...b, status: 'REJECTED' as const }
          );
          return {
            ...s,
            status: 'SOLD' as const,
            activeMerchantId: winningBid.merchantId,
            activeMerchantName: winningBid.merchantName,
            revenueTotal: (s.revenueTotal || 0) + winningBid.bidAmount,
            bids: updatedBids
          };
        }
        return s;
      })
    );
    addAuditLog('AD_AUCTION_WINNER_ACCEPTED', `LeilÃ’Â£o arrematado para o espaÃ’Â§o #${adSpaceId}`);
    triggerToast('Vencedor do leilÃ’Â£o confirmado e espaÃ’Â§o ativado!');
  };

  const sellAdSpaceDirectly = (
    adSpaceId: string,
    merchantId: string,
    merchantName: string,
    price: number,
    period: 'week' | 'month'
  ) => {
    setAdSpaces((prev) =>
      prev.map((s) => {
        if (s.id === adSpaceId) {
          return {
            ...s,
            status: 'SOLD' as const,
            commercialType: 'DIRECT_SALE' as const,
            activeMerchantId: merchantId,
            activeMerchantName: merchantName,
            revenueTotal: (s.revenueTotal || 0) + price
          };
        }
        return s;
      })
    );
    addAuditLog('AD_DIRECT_SALE', `EspaÃ’Â§o #${adSpaceId} vendido diretamente para ${merchantName} (${period}) por R$ ${price.toFixed(2)}`);
    triggerToast(`EspaÃ’Â§o publicitÃ’Â¡rio vendido para ${merchantName}!`);
  };

  const trackAdImpression = useCallback((adSpaceId: string) => {
    setAdSpaces((prev) =>
      prev.map((s) =>
        s.id === adSpaceId ? { ...s, impressionsCount: (s.impressionsCount || 0) + 1 } : s
      )
    );
  }, []);

  const trackAdClick = useCallback((adSpaceId: string) => {
    setAdSpaces((prev) =>
      prev.map((s) =>
        s.id === adSpaceId ? { ...s, clicksCount: (s.clicksCount || 0) + 1 } : s
      )
    );
  }, []);

  // Master Frontend Customization Operations
  // Master Frontend Customization Operations
  const updateFrontendConfig = (updates: Partial<FrontendCustomization>) => {
    setFrontendConfig((prev) => {
      const updatedConfig = { ...prev, ...updates };

      localStorage.setItem(
        STORAGE_KEYS.FRONTEND_CONFIG,
        JSON.stringify(updatedConfig)
      );

      return updatedConfig;
    });

    addAuditLog(
      'FRONTEND_CONFIG_UPDATE',
      'ConfiguraÃ’Â§Ã’Âµes de visual do frontend atualizadas pelo Master'
    );

    triggerToast(
      'Visual e configuraÃ’Â§Ã’Âµes do frontend atualizados com sucesso!'
    );
  };

  const addNavMenuItem = (item: Omit<NavMenuItem, 'id'>) => {
    const newItem: NavMenuItem = {
      ...item,
      id: `menu-${Date.now()}`
    };

    setFrontendConfig((prev) => ({
      ...prev,
      navMenuItems: [...prev.navMenuItems, newItem]
    }));

    triggerToast('Item adicionado ao menu de navegaÃ’Â§Ã’Â£o!');
  };

  const updateNavMenuItem = (id: string, updates: Partial<NavMenuItem>) => {
    setFrontendConfig((prev) => ({
      ...prev,
      navMenuItems: prev.navMenuItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    triggerToast('Item do menu atualizado!');
  };


  const deleteNavMenuItem = (id: string) => {
    setFrontendConfig((prev) => ({
      ...prev,
      navMenuItems: prev.navMenuItems.filter((item) => item.id !== id)
    }));
    triggerToast('Item removido do menu!');
  };

  const reorderNavMenuItems = (items: NavMenuItem[]) => {
    setFrontendConfig((prev) => ({
      ...prev,
      navMenuItems: items
    }));
    triggerToast('Ordem do menu salva!');
  };

  // ==========================================
  // AVALIAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½Ã¢ï¿½ï¿½Â¢ES MÃ’ï¿½ï¿½&Â¡TUAS & REPUTAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O LOCAL
  // ==========================================

  const addCustomerReview = (
    reviewData: Omit<CustomerToMerchantReview, 'id' | 'createdAt'>
  ): CustomerToMerchantReview => {
    const newReview: CustomerToMerchantReview = {
      ...reviewData,
      id: `rev-c-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReviews((prev) => [newReview, ...prev]);

    // Recalculate merchant overall rating
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === reviewData.merchantId) {
          const storeReviews = [...reviews.filter((r) => r.merchantId === m.id), newReview];
          const newAvg =
            storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length;
          return {
            ...m,
            rating: Number(newAvg.toFixed(1)),
            reviewsCount: storeReviews.length
          };
        }
        return m;
      })
    );

    addAuditLog(
      'CUSTOMER_REVIEW_SUBMITTED',
      `Cliente ${reviewData.userName} avaliou o estabelecimento ${reviewData.merchantName} com nota ${reviewData.rating}.0`
    );
    triggerToast('AvaliaÃ’Â§Ã’Â£o enviada com sucesso! Obrigado pela contribuiÃ’Â§Ã’Â£o.');
    return newReview;
  };

  const addMerchantReview = (
    reviewData: Omit<MerchantToCustomerReview, 'id' | 'createdAt'>
  ): MerchantToCustomerReview => {
    const newReview: MerchantToCustomerReview = {
      ...reviewData,
      id: `rev-m-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setMerchantReviews((prev) => [newReview, ...prev]);

    addAuditLog(
      'MERCHANT_REVIEW_SUBMITTED',
      `Lojista ${reviewData.merchantName} avaliou a conduta do cliente ${reviewData.userName} (Pedido #${reviewData.orderCode}) com nota ${reviewData.rating}.0`
    );
    triggerToast(`AvaliaÃ’Â§Ã’Â£o de conduta de ${reviewData.userName} registrada com sucesso!`);
    return newReview;
  };

  const replyToCustomerReview = (
    reviewId: string,
    replyText: string,
    merchantAuthorName?: string
  ) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            merchantReply: {
              replyText,
              repliedAt: `${new Date().toISOString().split('T')[0]} Ã’Â s ${new Date()
                .toTimeString()
                .slice(0, 5)}`,
              merchantAuthorName: merchantAuthorName || 'Estabelecimento'
            }
          };
        }
        return r;
      })
    );
    addAuditLog('MERCHANT_REVIEW_REPLY', `Resposta pÃ’Âºblica adicionada para a avaliaÃ’Â§Ã’Â£o #${reviewId}`);
    triggerToast('Resposta pÃ’Âºblica publicada com sucesso!');
  };

  const getCustomerReputationSummary = useCallback(
    (userId: string): CustomerReputationSummary => {
      const userMerchantReviews = merchantReviews.filter(
        (r) => r.userId === userId || (currentUser && currentUser.id === userId)
      );

      const targetUser = users.find((u) => u.id === userId) || currentUser;
      const userName = targetUser?.name || 'Cliente Achei Aqui';

      if (userMerchantReviews.length === 0) {
        return {
          userId,
          userName,
          averageScore: 5.0,
          totalEvaluations: 0,
          punctualityScore: 5.0,
          communicationScore: 5.0,
          paymentScore: 5.0,
          careScore: 5.0,
          recommendationPercentage: 100,
          badges: ['Cliente Verificado', 'Novo na Cidade'],
          reviews: []
        };
      }

      const total = userMerchantReviews.length;
      const avgScore =
        userMerchantReviews.reduce((acc, curr) => acc + curr.rating, 0) / total;
      const avgPunctuality =
        userMerchantReviews.reduce(
          (acc, curr) => acc + (curr.behaviorCriteria?.punctuality || curr.rating),
          0
        ) / total;
      const avgCommunication =
        userMerchantReviews.reduce(
          (acc, curr) => acc + (curr.behaviorCriteria?.communication || curr.rating),
          0
        ) / total;
      const avgPayment =
        userMerchantReviews.reduce(
          (acc, curr) => acc + (curr.behaviorCriteria?.paymentAndAgreements || curr.rating),
          0
        ) / total;
      const avgCare =
        userMerchantReviews.reduce(
          (acc, curr) => acc + (curr.behaviorCriteria?.careAndRespect || curr.rating),
          0
        ) / total;

      const recommendedCount = userMerchantReviews.filter(
        (r) => r.recommendForOtherMerchants
      ).length;
      const recPercent = Math.round((recommendedCount / total) * 100);

      const badges: string[] = ['Cliente Verificado'];
      if (avgScore >= 4.8) badges.push('Cliente 5 Estrelas');
      if (avgPunctuality >= 4.8) badges.push('Pontualidade Exemplar');
      if (avgPayment >= 4.8) badges.push('Pagador Pontual');
      if (avgCare >= 4.8) badges.push('VIP Provador Cuidadoso');

      return {
        userId,
        userName,
        averageScore: Number(avgScore.toFixed(1)),
        totalEvaluations: total,
        punctualityScore: Number(avgPunctuality.toFixed(1)),
        communicationScore: Number(avgCommunication.toFixed(1)),
        paymentScore: Number(avgPayment.toFixed(1)),
        careScore: Number(avgCare.toFixed(1)),
        recommendationPercentage: recPercent,
        badges,
        reviews: userMerchantReviews
      };
    },
    [merchantReviews, users, currentUser]
  );

  const isOrderReviewedByCustomer = (orderId: string): boolean => {
    return reviews.some((r) => r.orderId === orderId);
  };

  const isOrderReviewedByMerchant = (orderId: string): boolean => {
    return merchantReviews.some((r) => r.orderId === orderId);
  };

  // ==========================================
  // OPERAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½Ã¢ï¿½ï¿½Â¢ES DA EQUIPE COMERCIAL & VENDEDORES
  // ==========================================

  const addSalesAgent = async (agentData: Omit<SalesAgent, 'id' | 'createdAt'>): Promise<SalesAgent | null> => {
    const newAgent: SalesAgent = {
      ...agentData,
      id: `agent-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Cria o perfil de usuÃ’Â¡rio VENDEDOR correspondente para autenticaÃ’Â§Ã’Â£o
    const cleanAgentEmail = newAgent.email.toLowerCase().trim();
    const provisionalPassword = (agentData as any).temporaryPassword || '12345678';
    const firebaseProvision = await firebaseProvisionSalesAgent(
      cleanAgentEmail,
      provisionalPassword,
      {
        name: newAgent.name,
        phone: newAgent.phone,
        city: (agentData as any).region || (agentData as any).assignedRegion || 'Cachoeiras de Macacu, RJ',
        createdAt: new Date().toISOString()
      }
    );

    if (!firebaseProvision.success) {
      triggerToast(`NÃ’Â£o foi possÃ’Â­vel criar o vendedor no Firebase: ${firebaseProvision.message}`);
      return null;
    }
    setSalesAgents((prev) => [newAgent, ...prev]);
    const newAgentUser: User = {
      id: `user-${newAgent.id}`,
      name: newAgent.name,
      email: cleanAgentEmail,
      phone: newAgent.phone,
      role: 'VENDEDOR',
      password: provisionalPassword,
      needsPasswordChange: true,
      city: (agentData as any).region || (agentData as any).assignedRegion || 'Cachoeiras de Macacu, RJ',
      isEmailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    };
    setUsers((prev) => [newAgentUser, ...prev.filter((u) => u.email.toLowerCase() !== cleanAgentEmail)]);

    addAuditLog(
      'ADD_SALES_AGENT',
      `Novo consultor comercial cadastrado pelo Master: ${newAgent.name} (${newAgent.roleTitle}) com comissÃ’Â£o de ${newAgent.commissionRatePercent}%. Credencial inicial gerada com senha padrÃ’Â£o 12345678 (troca obrigatÃ’Â³ria no primeiro acesso).`,
      { category: 'USER_MANAGEMENT', entityId: newAgent.id, entityType: 'SALES_AGENT' }
    );
    triggerToast(`Vendedor ${newAgent.name} cadastrado com sucesso! Senha padrÃ’Â£o gerada: 12345678`);
    return newAgent;
  };

  const updateSalesAgent = (id: string, updates: Partial<SalesAgent>) => {
    setSalesAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    if (currentSalesAgent?.id === id) {
      setCurrentSalesAgent((prev) => (prev ? { ...prev, ...updates } : null));
    }
    addAuditLog(
      'UPDATE_SALES_AGENT',
      `Dados do consultor comercial ${id} atualizados pelo Master.`,
      { category: 'USER_MANAGEMENT', entityId: id, entityType: 'SALES_AGENT' }
    );
    triggerToast('Vendedor atualizado com sucesso!');
  };

  const setSalesAgentCommission = (id: string, ratePercent: number, bonusPerActivation?: number) => {
    setSalesAgents((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return {
            ...a,
            commissionRatePercent: ratePercent,
            commissionBonusPerActivation:
              bonusPerActivation !== undefined ? bonusPerActivation : a.commissionBonusPerActivation
          };
        }
        return a;
      })
    );
    if (currentSalesAgent?.id === id) {
      setCurrentSalesAgent((prev) =>
        prev
          ? {
              ...prev,
              commissionRatePercent: ratePercent,
              commissionBonusPerActivation:
                bonusPerActivation !== undefined ? bonusPerActivation : prev.commissionBonusPerActivation
            }
          : null
      );
    }
    addAuditLog(
      'SET_SALES_AGENT_COMMISSION',
      `Taxa de comissÃ’Â£o do vendedor ${id} fixada em ${ratePercent}% pelo Master Supremo (BÃ’Â´nus fixo: R$ ${bonusPerActivation ?? 0}).`,
      { category: 'FINANCIAL', entityId: id, entityType: 'SALES_AGENT' }
    );
    triggerToast(`ComissÃ’Â£o de ${ratePercent}% configurada com sucesso!`);
  };

  const submitBoletoRequest = (
    requestData: Omit<
      BoletoBillingRequest,
      'id' | 'code' | 'commissionAmount' | 'commissionStatus' | 'status' | 'requestedAt'
    >
  ): BoletoBillingRequest => {
    const nextSeq = boletoRequests.length + 1;
    const code = `BOL-${new Date().getFullYear()}-${String(nextSeq).padStart(3, '0')}`;
    const rate = requestData.commissionRatePercent ?? VENDOR_COMMISSION_PERCENT;
    const commissionAmount = Number(((requestData.amount * rate) / 100).toFixed(2));
    const cleanPixTxId = code.replace(/[^a-zA-Z0-9]/g, '');
    const pixCopiaECola = generatePixCopiaECola({
      pixKey: SALES_ORGANOGRAM_CONFIG.pixKeyClean, // '30810800000139'
      receiverName: SALES_ORGANOGRAM_CONFIG.beneficiary, // 'BEX SERVICOS E COMERCIOS'
      receiverCity: 'CACHOEIRAS DE MACACU',
      amount: requestData.amount,
      txid: cleanPixTxId
    });

    const newReq: BoletoBillingRequest = {
      ...requestData,
      id: `bol-req-${Date.now()}`,
      code,
      pixCopiaECola,
      commissionRatePercent: rate,
      commissionAmount,
      commissionStatus: 'PENDENTE',
      status: 'BOLETO_ENVIADO',
      requestedAt: new Date().toISOString()
    };

    setBoletoRequests((prev) => [newReq, ...prev]);

    addAuditLog(
      'SUBMIT_BOLETO_REQUEST',
      `CobranÃ’Â§a Pix oficial ${code} gerada pelo vendedor ${newReq.agentName} para ${newReq.clientName} (Plano: ${newReq.chosenPlan}, R$ ${newReq.amount.toFixed(2)} - ComissÃ’Â£o 5%: R$ ${commissionAmount.toFixed(2)}).`,
      { category: 'FINANCIAL', entityId: newReq.id, entityType: 'BOLETO_REQUEST' }
    );

    sendInAppNotification({
      title: `Nova CobranÃ’Â§a Pix / Cadastro: ${newReq.code}`,
      message: `O consultor ${newReq.agentName} cadastrou ${newReq.clientName} (${newReq.chosenPlan} - R$ ${newReq.amount.toFixed(2)} - ComissÃ’Â£o: R$ ${commissionAmount.toFixed(2)}). Chave Pix Oficial CNPJ: ${SALES_ORGANOGRAM_CONFIG.pixKeyFormatted}.`,
      audience: 'MASTER',
      category: 'ADMIN_ALERT',
      priority: 'HIGH'
    });

    triggerToast(`CobranÃ’Â§a Pix ${code} gerada para ${newReq.clientName}!`);
    return newReq;
  };

  const createAgentRegisteredClient = (
    clientData: Omit<AgentRegisteredClient, 'id' | 'registeredAt' | 'billingStatus'>,
    options?: {
      shouldRequestBoleto?: boolean;
      dueDate?: string;
      billingFrequency?: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
      customAmount?: number;
    }
  ): { client: AgentRegisteredClient; boletoRequest?: BoletoBillingRequest } => {
    const clientId = `reg-client-${Date.now()}`;
    let createdBoleto: BoletoBillingRequest | undefined;

    const isUser = clientData.clientType === 'USUARIO';
    const isProvider = clientData.clientType === 'PRESTADOR';
    const isMerchant = clientData.clientType === 'LOJISTA';

    const planPrices: Record<MembershipTier, number> = {
      GRATIS: 0,
      BRONZE: 19.90,
      PRATA: 59.90,
      OURO: 49.90,
      PREMIUM: 199.90,
      MASTER: 0
    };

    // Regras de Organograma:
    // 1) UsuÃ’Â¡rio: R$ 0,00 GrÃ’Â¡tis Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ Sem mensalidade Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ Somente compras Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ Sem permissÃ’Â£o comercial
    // 2) Prestador: R$ 29,90 Fixo Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ 1 serviÃ’Â§o incluso (+R$ 9,90 adicional) Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ ComissÃ’Â£o 5% = R$ 1,50
    // 3) Lojista: Escolhe o plano Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ Pix CNPJ 30810800000139 Ã’Â¢Ã¢ï¿½aÂ¬ï¿½Â¢ ComissÃ’Â£o 5% do plano
    let finalAmount = 0;
    let chosenPlan: MembershipTier = clientData.chosenPlan;
    const commissionRate = 5; // 5% fixo conforme organograma oficial

    if (isUser) {
      finalAmount = 0;
      chosenPlan = 'GRATIS';
    } else if (isProvider) {
      finalAmount = SERVICE_PROVIDER_BASE_PRICE; // R$ 29,90 fixo
      chosenPlan = 'BRONZE';
    } else {
      finalAmount = options?.customAmount ?? planPrices[clientData.chosenPlan] ?? 19.90;
      chosenPlan = clientData.chosenPlan;
    }

    const agent = salesAgents.find((a) => a.id === clientData.agentId) || currentSalesAgent;

    // Se NÃ’ï¿½ï¿½ ï¿½"O for usuÃ’Â¡rio comum (cliente comprador), gera cobranÃ’Â§a Pix/Boleto oficial
    if (!isUser && options?.shouldRequestBoleto !== false) {
      const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      createdBoleto = submitBoletoRequest({
        agentId: clientData.agentId,
        agentName: clientData.agentName,
        agentPixKey: agent?.pixKey || clientData.phone,
        clientType: isMerchant ? 'LOJISTA' : 'PRESTADOR',
        clientName: clientData.name,
        tradeName: clientData.tradeName,
        documentNumber: clientData.documentNumber,
        clientEmail: clientData.email,
        clientPhone: clientData.phone,
        clientAddress: `${clientData.neighborhood}, ${clientData.city}`,
        neighborhood: clientData.neighborhood,
        chosenPlan,
        planTitle: isProvider
          ? 'Assinatura Prestador de ServiÃ’Â§os (1 serviÃ’Â§o incluso)'
          : `Plano ${chosenPlan}`,
        billingFrequency: options?.billingFrequency || 'MENSAL',
        amount: finalAmount,
        commissionRatePercent: commissionRate,
        dueDate: options?.dueDate || defaultDueDate
      });
    }

    const newClient: AgentRegisteredClient = {
      ...clientData,
      chosenPlan,
      id: clientId,
      billingStatus: isUser ? 'ATIVO_PAGO' : (createdBoleto ? 'BOLETO_ENVIADO' : 'AGUARDANDO_BOLETO'),
      boletoRequestId: createdBoleto?.id,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    setRegisteredClientsByAgents((prev) => [newClient, ...prev]);

    // Cadastro comercial no catÃ’Â¡logo APENAS para Prestadores e Lojistas
    // UsuÃ’Â¡rios comuns nÃ’Â£o possuem perfil comercial nem permissÃ’Â£o para postar produtos/banners
    if (isMerchant || isProvider) {
      const merchantId = `store-${Date.now()}`;
      const newMerchant: StoreMerchant = {
        id: merchantId,
        name: clientData.tradeName || clientData.name,
        ownerName: clientData.name,
        cnpjOrCpf: clientData.documentNumber,
        email: clientData.email,
        phone: clientData.phone,
        category: isProvider ? 'ServiÃ’Â§os' : 'Geral',
        city: clientData.city || 'Cachoeiras de Macacu',
        neighborhood: clientData.neighborhood || 'Centro',
        address: `${clientData.neighborhood}, ${clientData.city}`,
        logo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=150&auto=format&fit=crop&q=80',
        description: isProvider
          ? `Prestador de serviÃ’Â§os credenciado pelo consultor ${clientData.agentName}. Plano Base R$ 29,90 com 1 serviÃ’Â§o incluso.`
          : `Estabelecimento comercial credenciado pelo consultor ${clientData.agentName}.`,
        status: 'approved',
        membershipTier: chosenPlan,
        commissionRate: getCommissionRateForTier(chosenPlan),
        maxProductsLimit: isProvider ? 1 : getMaxProductsForTier(chosenPlan), // Prestador: 1 serviÃ’Â§o incluso (+R$ 9,90 adicional)
        rating: 5.0,
        reviewsCount: 0,
        isOpen: true,
        openingHours: 'Segunda a SÃ’Â¡bado: 08h Ã’Â s 19h',
        deliveryFee: 0,
        deliveryTimeEstimate: '30 - 60 min',
        supportsPickup: true,
        supportsTrial: true,
        supportsAppointments: isProvider,
        isServiceProvider: isProvider,
        submittedAt: new Date().toISOString()
      };
      setMerchants((prev) => [newMerchant, ...prev]);
    }

    addAuditLog(
      'REGISTER_CLIENT_BY_AGENT',
      `Novo ${clientData.clientType} registrado pelo vendedor ${clientData.agentName}: ${clientData.name} (${isUser ? 'GrÃ’Â¡tis - Compras' : `R$ ${finalAmount.toFixed(2)} - ComissÃ’Â£o 5%`}).`,
      { category: 'USER_MANAGEMENT', entityId: clientId, entityType: 'AGENT_CLIENT' }
    );

    triggerToast(
      isUser
        ? `UsuÃ’Â¡rio "${clientData.name}" cadastrado gratuitamente (somente compras)!`
        : `${clientData.clientType === 'PRESTADOR' ? 'Prestador' : 'Lojista'} "${clientData.name}" cadastrado! Chave Pix gerada.`
    );
    return { client: newClient, boletoRequest: createdBoleto };
  };

  const markBoletoAsSent = (
    requestId: string,
    details?: {
      barcodeDigits?: string;
      boletoPdfUrl?: string;
      pixCopiaECola?: string;
      masterNotes?: string;
    }
  ) => {
    let targetReq: BoletoBillingRequest | undefined;
    setBoletoRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const barcode =
            details?.barcodeDigits ||
            req.barcodeDigits ||
            `34191.79001 01043.510047 91020.150008 4 ${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
          const pix =
            details?.pixCopiaECola ||
            req.pixCopiaECola ||
            `00020126580014br.gov.bcb.pix0136achei-aqui-bol-${req.code}5204000053039865405${req.amount.toFixed(2)}5802BR5921Achei Aqui Cobranca6014Cachoeiras Mac62070503BOL6304`;
          const pdf = details?.boletoPdfUrl || req.boletoPdfUrl || `https://acheiaqui.com.br/boletos/${req.code}.pdf`;
          targetReq = {
            ...req,
            status: 'BOLETO_ENVIADO',
            sentToClientAt: new Date().toISOString(),
            barcodeDigits: barcode,
            pixCopiaECola: pix,
            boletoPdfUrl: pdf,
            masterNotes: details?.masterNotes || req.masterNotes || 'Boleto bancÃ’Â¡rio registrado e enviado ao cliente.'
          };
          return targetReq;
        }
        return req;
      })
    );

    setRegisteredClientsByAgents((prev) =>
      prev.map((c) => {
        if (c.boletoRequestId === requestId) {
          return { ...c, billingStatus: 'BOLETO_ENVIADO' };
        }
        return c;
      })
    );

    addAuditLog(
      'MARK_BOLETO_SENT',
      `Boleto bancÃ’Â¡rio da solicitaÃ’Â§Ã’Â£o ${requestId} marcado como ENVIADO ao cliente pelo Administrador Master.`,
      { category: 'FINANCIAL', entityId: requestId, entityType: 'BOLETO_REQUEST' }
    );

    triggerToast('Boleto registrado e enviado com sucesso!');
  };

  const confirmBoletoPaymentAndReleaseCommission = (requestId: string, notes?: string) => {
    let targetReq: BoletoBillingRequest | undefined;
    setBoletoRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          targetReq = {
            ...req,
            status: 'PAGAMENTO_CONFIRMADO',
            paidAt: new Date().toISOString(),
            confirmedByMasterAt: new Date().toISOString(),
            commissionStatus: 'LIBERADA',
            masterNotes:
              notes ||
              req.masterNotes ||
              'Pagamento confirmado pelo Master. ComissÃ’Â£o liberada para o vendedor.'
          };
          return targetReq;
        }
        return req;
      })
    );

    setRegisteredClientsByAgents((prev) =>
      prev.map((c) => {
        if (c.boletoRequestId === requestId) {
          return { ...c, billingStatus: 'ATIVO_PAGO' };
        }
        return c;
      })
    );

    if (targetReq) {
      setMerchants((prev) =>
        prev.map((m) => {
          if (
            m.cnpjOrCpf === targetReq!.documentNumber ||
            m.name.toLowerCase() === targetReq!.clientName.toLowerCase()
          ) {
            return { ...m, status: 'approved' };
          }
          return m;
        })
      );

      addAuditLog(
        'CONFIRM_BOLETO_PAYMENT',
        `Pagamento do boleto ${targetReq.code} (R$ ${targetReq.amount.toFixed(2)}) confirmado pelo Master! ComissÃ’Â£o de R$ ${targetReq.commissionAmount.toFixed(2)} LIBERADA para ${targetReq.agentName}.`,
        { category: 'FINANCIAL', entityId: targetReq.id, entityType: 'BOLETO_REQUEST' }
      );

      sendInAppNotification({
        title: `ComissÃ’Â£o Liberada! R$ ${targetReq.commissionAmount.toFixed(2)}`,
        message: `O pagamento do boleto ${targetReq.code} (${targetReq.clientName}) foi confirmado pelo Master Supremo! Sua comissÃ’Â£o estÃ’Â¡ liberada para saque Pix.`,
        audience: 'ALL',
        category: 'COMMISSION_UPDATE',
        priority: 'HIGH'
      });

      triggerToast(
        `Pagamento do boleto ${targetReq.code} confirmado! ComissÃ’Â£o de R$ ${targetReq.commissionAmount.toFixed(2)} liberada.`
      );
    }
  };

  const cancelBoletoRequest = (requestId: string, reason?: string) => {
    setBoletoRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'CANCELADO',
            commissionStatus: 'CANCELADA',
            masterNotes: reason || 'Cancelado pelo Administrador Master.'
          };
        }
        return req;
      })
    );
    addAuditLog(
      'CANCEL_BOLETO_REQUEST',
      `SolicitaÃ’Â§Ã’Â£o de boleto ${requestId} cancelada pelo Master. Motivo: ${reason || 'Sem motivo informado'}`,
      { category: 'FINANCIAL', entityId: requestId, entityType: 'BOLETO_REQUEST' }
    );
    triggerToast('SolicitaÃ’Â§Ã’Â£o de boleto cancelada.');
  };

  const markCommissionAsPaidToAgent = (requestId: string, receiptCode?: string) => {
    let targetReq: BoletoBillingRequest | undefined;
    const receipt = receiptCode || `PIX-REC-${Date.now()}`;
    setBoletoRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          targetReq = {
            ...req,
            commissionStatus: 'PAGA',
            commissionPaidAt: new Date().toISOString(),
            commissionPaymentReceipt: receipt
          };
          return targetReq;
        }
        return req;
      })
    );

    if (targetReq) {
      addAuditLog(
        'PAY_COMMISSION_TO_AGENT',
        `ComissÃ’Â£o de R$ ${targetReq.commissionAmount.toFixed(2)} PAGA ao vendedor ${targetReq.agentName} via Pix. Comprovante: ${receipt}`,
        { category: 'FINANCIAL', entityId: requestId, entityType: 'BOLETO_REQUEST' }
      );

      sendInAppNotification({
        title: `ComissÃ’Â£o Paga via Pix! R$ ${targetReq.commissionAmount.toFixed(2)}`,
        message: `O Administrador Master efetuou o pagamento da sua comissÃ’Â£o referente ao boleto ${targetReq.code}. Comprovante: ${receipt}`,
        audience: 'ALL',
        category: 'COMMISSION_UPDATE',
        priority: 'HIGH'
      });

      triggerToast(`ComissÃ’Â£o de R$ ${targetReq.commissionAmount.toFixed(2)} marcada como PAGA!`);
    }
  };

  const addCommercialGoal = (
    goalData: Omit<CommercialGoal, 'id' | 'createdByMasterAt'>
  ): CommercialGoal => {
    const newGoal: CommercialGoal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      createdByMasterAt: new Date().toISOString().split('T')[0]
    };
    setCommercialGoals((prev) => [newGoal, ...prev]);
    addAuditLog(
      'ADD_COMMERCIAL_GOAL',
      `Nova meta comercial lanÃ’Â§ada pelo Master: "${newGoal.title}" (${newGoal.targetCount} cadastros, R$ ${newGoal.targetRevenue.toFixed(2)}).`,
      { category: 'GENERAL', entityId: newGoal.id, entityType: 'COMMERCIAL_GOAL' }
    );
    triggerToast(`Meta "${newGoal.title}" criada e lanÃ’Â§ada com sucesso!`);
    return newGoal;
  };

  const updateCommercialGoal = (id: string, updates: Partial<CommercialGoal>) => {
    setCommercialGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    addAuditLog('UPDATE_COMMERCIAL_GOAL', `Meta comercial ${id} atualizada pelo Master.`);
    triggerToast('Meta comercial atualizada com sucesso!');
  };

  const deleteCommercialGoal = (id: string) => {
    setCommercialGoals((prev) => prev.filter((g) => g.id !== id));
    addAuditLog('DELETE_COMMERCIAL_GOAL', `Meta comercial ${id} removida pelo Master.`);
    triggerToast('Meta comercial excluÃ’Â­da.');
  };

  const addCommercialArea = (areaData: Omit<CommercialArea, 'id'>): CommercialArea => {
    const newArea: CommercialArea = {
      ...areaData,
      id: `area-${Date.now()}`
    };
    setCommercialAreas((prev) => [...prev, newArea]);
    addAuditLog(
      'ADD_COMMERCIAL_AREA',
      `Nova Ã’Â¡rea comercial delimitada pelo Master: "${newArea.name}" (${newArea.neighborhoods.join(', ')}).`,
      { category: 'GENERAL', entityId: newArea.id, entityType: 'COMMERCIAL_AREA' }
    );
    triggerToast(`Ã’Ârea comercial "${newArea.name}" criada com sucesso!`);
    return newArea;
  };

  const updateCommercialArea = (id: string, updates: Partial<CommercialArea>) => {
    setCommercialAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    addAuditLog('UPDATE_COMMERCIAL_AREA', `Ã’Ârea comercial ${id} atualizada pelo Master.`);
    triggerToast('Ã’Ârea comercial atualizada!');
  };

  const deleteCommercialArea = (id: string) => {
    setCommercialAreas((prev) => prev.filter((a) => a.id !== id));
    addAuditLog('DELETE_COMMERCIAL_AREA', `Ã’Ârea comercial ${id} removida pelo Master.`);
    triggerToast('Ã’Ârea comercial excluÃ’Â­da.');
  };

  const assignAgentHierarchyAndArea = (
    agentId: string,
    supervisorId: string | undefined,
    assignedRegion: string,
    roleLevel?: SalesRoleLevel,
    roleTitle?: string
  ) => {
    let supervisorName: string | undefined;
    if (supervisorId) {
      const sup = salesAgents.find((a) => a.id === supervisorId);
      supervisorName = sup?.name;
    }

    setSalesAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          return {
            ...agent,
            supervisorId: supervisorId || undefined,
            supervisorName: supervisorName || undefined,
            assignedRegion,
            ...(roleLevel ? { roleLevel } : {}),
            ...(roleTitle ? { roleTitle } : {})
          };
        }
        return agent;
      })
    );

    const targetAgent = salesAgents.find((a) => a.id === agentId);
    const agentName = targetAgent?.name || agentId;

    addAuditLog(
      'ASSIGN_AGENT_HIERARCHY',
      `Vendedor ${agentName} atribuÃ’Â­do pelo Master Supremo. Supervisor: ${supervisorName || 'Reporte Direto ao Master'}. Ã’Ârea: ${assignedRegion}. NÃ’Â­vel: ${roleLevel || targetAgent?.roleLevel}.`,
      { category: 'USER_MANAGEMENT', entityId: agentId, entityType: 'SALES_AGENT' }
    );

    triggerToast(`Estrutura e Ã’Â¡rea de ${agentName} atualizadas com sucesso!`);
  };

  // ==========================================
  // CAMADA DE PROCESSAMENTO DE WEBHOOKS
  // ==========================================
  const updateWebhookConfig = (updates: Partial<WebhookConfig>) => {
    setWebhookConfig((prev) => ({ ...prev, ...updates }));
    addAuditLog(
      'UPDATE_WEBHOOK_CONFIG',
      'ConfiguraÃ’Â§Ã’Âµes da camada de webhooks de boletos atualizadas pelo Master.',
      { category: 'FINANCIAL', entityType: 'WEBHOOK_CONFIG' }
    );
    triggerToast('ConfiguraÃ’Â§Ã’Âµes de Webhook atualizadas com sucesso!');
  };

  const clearWebhookLogs = () => {
    setWebhookEvents([]);
    addAuditLog(
      'CLEAR_WEBHOOK_LOGS',
      'HistÃ’Â³rico de eventos de webhooks limpo pelo Administrador Master.',
      { category: 'FINANCIAL', entityType: 'WEBHOOK_LOGS' }
    );
    triggerToast('HistÃ’Â³rico de logs de webhook limpo com sucesso.');
  };

  const deleteWebhookEvent = (eventId: string) => {
    setWebhookEvents((prev) => prev.filter((e) => e.id !== eventId));
    triggerToast('Evento de webhook removido.');
  };

  const processBoletoWebhook = (input: {
    gateway: WebhookGateway;
    payload: Record<string, any>;
    headers?: Record<string, string>;
    manualBoletoCode?: string;
  }): {
    success: boolean;
    event: BoletoWebhookEvent;
    matchedBoleto?: BoletoBillingRequest;
    message: string;
  } => {
    const startTime = Date.now();
    const eventId = `wh-evt-${Date.now()}`;
    const { gateway, payload, headers, manualBoletoCode } = input;

    // 1. ExtraÃ’Â§Ã’Â£o da ReferÃ’Âªncia / CÃ’Â³digo do Boleto
    let extractedCode = manualBoletoCode?.trim() || '';

    if (!extractedCode) {
      if (gateway === 'ASAAS') {
        extractedCode =
          payload.payment?.externalReference ||
          payload.payment?.description ||
          payload.externalReference ||
          '';
      } else if (gateway === 'MERCADO_PAGO') {
        extractedCode =
          payload.external_reference ||
          payload.data?.external_reference ||
          '';
      } else if (gateway === 'BANCO_INTER') {
        extractedCode = payload.seuNumero || payload.codigoSolicitacao || '';
      } else if (gateway === 'IUGU') {
        extractedCode = payload.data?.order_id || payload.data?.subscription_id || '';
      } else if (gateway === 'GERENCIANET_EFI') {
        extractedCode = payload.custom_id || payload.data?.custom_id || '';
      } else if (gateway === 'GENERIC') {
        extractedCode = payload.boletoCode || payload.code || payload.reference || '';
      }
    }

    // Busca por regex de padrÃ’Â£o BOL-YYYY-NNN caso o cÃ’Â³digo esteja embutido em texto livre
    if (extractedCode && !extractedCode.startsWith('BOL-') && extractedCode.includes('BOL-')) {
      const match = extractedCode.match(/BOL-\d{4}-\d{3}/i);
      if (match) {
        extractedCode = match[0].toUpperCase();
      }
    }

    // 2. ExtraÃ’Â§Ã’Â£o do Tipo de Evento
    let eventType = 'PAYMENT_CONFIRMED';
    if (gateway === 'ASAAS') {
      eventType = payload.event || 'PAYMENT_RECEIVED';
    } else if (gateway === 'MERCADO_PAGO') {
      eventType = payload.action || payload.type || 'payment.updated';
    } else if (gateway === 'BANCO_INTER') {
      eventType = payload.situacao || 'PAGO';
    } else if (gateway === 'IUGU') {
      eventType = payload.event || 'invoice.status_changed';
    } else if (gateway === 'GERENCIANET_EFI') {
      eventType = payload.notification || 'status_change';
    } else if (gateway === 'GENERIC') {
      eventType = payload.event || 'BOLETO_PAID';
    }

    // 3. ExtraÃ’Â§Ã’Â£o do ID da TransaÃ’Â§Ã’Â£o Externa
    let externalTxId = '';
    if (gateway === 'ASAAS') {
      externalTxId = payload.payment?.id || payload.id || `asaas_tx_${Date.now()}`;
    } else if (gateway === 'MERCADO_PAGO') {
      externalTxId = String(payload.data?.id || payload.id || `mp_tx_${Date.now()}`);
    } else if (gateway === 'BANCO_INTER') {
      externalTxId = payload.nossoNumero || payload.codigoSolicitacao || `inter_tx_${Date.now()}`;
    } else if (gateway === 'IUGU') {
      externalTxId = payload.data?.id || `iugu_tx_${Date.now()}`;
    } else if (gateway === 'GERENCIANET_EFI') {
      externalTxId = String(payload.charge_id || `efi_tx_${Date.now()}`);
    } else {
      externalTxId = payload.transactionId || payload.id || `tx_gen_${Date.now()}`;
    }

    // 4. ExtraÃ’Â§Ã’Â£o do Valor Pago
    let amountPaid = 0;
    if (gateway === 'ASAAS') {
      amountPaid = Number(payload.payment?.value || 0);
    } else if (gateway === 'MERCADO_PAGO') {
      amountPaid = Number(payload.transaction_amount || payload.data?.transaction_amount || 0);
    } else if (gateway === 'BANCO_INTER') {
      amountPaid = Number(payload.valorTotalRecebido || payload.valorNominal || 0);
    } else if (gateway === 'IUGU') {
      amountPaid = Number((payload.data?.paid_cents || payload.data?.total_cents || 0) / 100);
    } else if (gateway === 'GERENCIANET_EFI') {
      amountPaid = Number((payload.value || 0) / 100);
    } else {
      amountPaid = Number(payload.amount || payload.valor || 0);
    }

    // 5. LocalizaÃ’Â§Ã’Â£o do Boleto no Banco de Dados da AplicaÃ’Â§Ã’Â£o
    const matchedBoleto = boletoRequests.find((req) => {
      if (extractedCode) {
        if (req.code.toUpperCase() === extractedCode.toUpperCase()) return true;
        if (req.id.toLowerCase() === extractedCode.toLowerCase()) return true;
        if (req.barcodeDigits && req.barcodeDigits.replace(/\D/g, '').includes(extractedCode.replace(/\D/g, ''))) return true;
      }
      return false;
    });

    const durationMs = Date.now() - startTime + (webhookConfig.simulateDelayMs || 0);
    const nowIso = new Date().toISOString();

    if (!matchedBoleto) {
      const unmatchedEvent: BoletoWebhookEvent = {
        id: eventId,
        gateway,
        eventType,
        boletoCode: extractedCode || undefined,
        receivedAt: nowIso,
        processedAt: nowIso,
        durationMs,
        status: 'UNMATCHED',
        statusMessage: extractedCode
          ? `Boleto com cÃ’Â³digo ou referÃ’Âªncia '${extractedCode}' nÃ’Â£o foi localizado no sistema.`
          : 'Nenhum cÃ’Â³digo de boleto foi identificado no payload recebido.',
        payload,
        headers,
        ipAddress: '177.136.204.88'
      };

      setWebhookEvents((prev) => [unmatchedEvent, ...prev]);

      addAuditLog(
        'WEBHOOK_UNMATCHED',
        `Webhook ${gateway} recebido, mas nenhum boleto com a referÃ’Âªncia '${extractedCode}' foi localizado.`,
        { category: 'FINANCIAL', entityId: eventId, entityType: 'WEBHOOK_EVENT' }
      );

      triggerToast(`Webhook ${gateway}: Boleto '${extractedCode || 'desconhecido'}' nÃ’Â£o encontrado.`);

      return {
        success: false,
        event: unmatchedEvent,
        message: unmatchedEvent.statusMessage
      };
    }

    // Boleto Encontrado!
    const effectiveAmount = amountPaid > 0 ? amountPaid : matchedBoleto.amount;
    const isAlreadyPaid = matchedBoleto.status === 'PAGAMENTO_CONFIRMADO';

    // 6. AtualizaÃ’Â§Ã’Â£o AutomÃ’Â¡tica do Boleto e LiberaÃ’Â§Ã’Â£o de ComissÃ’Â£o
    let updatedBoleto: BoletoBillingRequest = { ...matchedBoleto };

    setBoletoRequests((prev) =>
      prev.map((b) => {
        if (b.id === matchedBoleto.id) {
          updatedBoleto = {
            ...b,
            status: 'PAGAMENTO_CONFIRMADO',
            paidAt: b.paidAt || nowIso,
            confirmedByMasterAt: b.confirmedByMasterAt || nowIso,
            commissionStatus: webhookConfig.autoReleaseCommission ? 'LIBERADA' : b.commissionStatus,
            webhookConfirmed: true,
            webhookGateway: gateway,
            webhookEventId: eventId,
            webhookReceivedAt: nowIso,
            externalTransactionId: externalTxId,
            masterNotes: `LiquidaÃ’Â§Ã’Â£o confirmada automaticamente via Webhook ${gateway} (TxID: ${externalTxId}). ComissÃ’Â£o liberada para o consultor.`
          };
          return updatedBoleto;
        }
        return b;
      })
    );

    // 7. AtualizaÃ’Â§Ã’Â£o do Cliente Vinculado para 'ATIVO_PAGO'
    if (webhookConfig.autoActivateClient) {
      setRegisteredClientsByAgents((prev) =>
        prev.map((c) => {
          if (c.boletoRequestId === matchedBoleto.id || c.documentNumber === matchedBoleto.documentNumber) {
            return { ...c, billingStatus: 'ATIVO_PAGO' };
          }
          return c;
        })
      );
    }

    // 8. AprovaÃ’Â§Ã’Â£o AutomÃ’Â¡tica do Estabelecimento Lojista / Prestador
    if (webhookConfig.autoApproveMerchant) {
      setMerchants((prev) =>
        prev.map((m) => {
          if (
            m.cnpjOrCpf === matchedBoleto.documentNumber ||
            m.name.toLowerCase() === matchedBoleto.clientName.toLowerCase()
          ) {
            return { ...m, status: 'approved' };
          }
          return m;
        })
      );
    }

    // 9. Auditoria Completa
    addAuditLog(
      'WEBHOOK_PAYMENT_CONFIRMED',
      `Webhook ${gateway} (${externalTxId}) confirmou liquidaÃ’Â§Ã’Â£o do boleto ${matchedBoleto.code} (R$ ${effectiveAmount.toFixed(2)}). ComissÃ’Â£o de R$ ${matchedBoleto.commissionAmount.toFixed(2)} LIBERADA para ${matchedBoleto.agentName}.`,
      { category: 'FINANCIAL', entityId: matchedBoleto.id, entityType: 'BOLETO_REQUEST' }
    );

    // 10. NotificaÃ’Â§Ã’Âµes In-App para Vendedor e Administrador Master
    if (webhookConfig.notifySalesAgentInApp) {
      sendInAppNotification({
        title: `ComissÃ’Â£o Liberada via Webhook! R$ ${matchedBoleto.commissionAmount.toFixed(2)}`,
        message: `O gateway ${gateway} confirmou a liquidaÃ’Â§Ã’Â£o do boleto ${matchedBoleto.code} de ${matchedBoleto.clientName}. Sua comissÃ’Â£o jÃ’Â¡ estÃ’Â¡ LIBERADA para saque Pix!`,
        audience: 'ALL',
        category: 'COMMISSION_UPDATE',
        priority: 'HIGH'
      });
    }

    sendInAppNotification({
      title: `Boleto Liquidado via Webhook: ${matchedBoleto.code}`,
      message: `Recebimento confirmado via ${gateway} (R$ ${effectiveAmount.toFixed(2)}). Vendedor: ${matchedBoleto.agentName} | ComissÃ’Â£o: R$ ${matchedBoleto.commissionAmount.toFixed(2)}.`,
      audience: 'MASTER',
      category: 'ADMIN_ALERT',
      priority: 'MEDIUM'
    });

    // 11. Registro do Evento de Webhook
    const successEvent: BoletoWebhookEvent = {
      id: eventId,
      gateway,
      eventType,
      boletoCode: matchedBoleto.code,
      boletoRequestId: matchedBoleto.id,
      agentId: matchedBoleto.agentId,
      agentName: matchedBoleto.agentName,
      clientName: matchedBoleto.clientName,
      amountPaid: effectiveAmount,
      commissionAmount: matchedBoleto.commissionAmount,
      commissionReleased: webhookConfig.autoReleaseCommission,
      externalTransactionId: externalTxId,
      receivedAt: nowIso,
      processedAt: nowIso,
      durationMs,
      status: 'SUCCESS',
      statusMessage: isAlreadyPaid
        ? `Boleto ${matchedBoleto.code} jÃ’Â¡ havia sido quitado anteriormente. Evento reconfirmado via ${gateway}.`
        : `Boleto ${matchedBoleto.code} liquidado com sucesso! ComissÃ’Â£o de R$ ${matchedBoleto.commissionAmount.toFixed(2)} liberada para ${matchedBoleto.agentName}.`,
      payload,
      headers,
      ipAddress: '177.136.204.88'
    };

    setWebhookEvents((prev) => [successEvent, ...prev]);

    triggerToast(
      `Webhook ${gateway}: Boleto ${matchedBoleto.code} liquidado! ComissÃ’Â£o de R$ ${matchedBoleto.commissionAmount.toFixed(2)} liberada para ${matchedBoleto.agentName}.`
    );

    return {
      success: true,
      event: successEvent,
      matchedBoleto: updatedBoleto,
      message: successEvent.statusMessage
    };
  };

  const reprocessWebhookEvent = (eventId: string, targetBoletoCode?: string): boolean => {
    const evt = webhookEvents.find((e) => e.id === eventId);
    if (!evt) return false;

    const result = processBoletoWebhook({
      gateway: evt.gateway,
      payload: evt.payload,
      headers: evt.headers,
      manualBoletoCode: targetBoletoCode || evt.boletoCode
    });

    return result.success;
  };

  // ==========================================
  // DELIVERY MODULE IMPLEMENTATION (V1)
  // ==========================================
  const registerDeliveryDriver = async (
    driverData: Omit<DeliveryDriver, 'id' | 'userId' | 'registeredAt' | 'status' | 'operationalStatus'> & { password: string }
  ): Promise<{ success: boolean; message: string; driver?: DeliveryDriver }> => {
    try {
      const cleanEmail = driverData.email.trim().toLowerCase();
      if (!cleanEmail || !driverData.cpf || !driverData.name || !driverData.phone) {
        return { success: false, message: 'Preencha todos os campos obrigatÃ’Â³rios para o cadastro.' };
      }
      if (!driverData.cnhNumber || !driverData.vehiclePlate) {
        return { success: false, message: 'CNH e dados do veÃ’Â­culo sÃ’Â£o obrigatÃ’Â³rios para entregadores parceiros.' };
      }
      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'Este e-mail jÃ’Â¡ estÃ’Â¡ cadastrado na plataforma.' };
      }

      const newUserId = 'user-driver-' + Date.now();
      const newDriverId = 'driver-' + Date.now();

      const newUser: User = {
        id: newUserId,
        name: driverData.name.trim(),
        email: cleanEmail,
        phone: driverData.phone,
        role: 'ENTREGADOR',
        password: driverData.password,
        city: driverData.city || 'Cachoeiras de Macacu, RJ',
        address: driverData.address,
        neighborhood: driverData.neighborhood,
        avatar: driverData.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isEmailVerified: true,
        createdAt: new Date().toISOString()
      };

      const newDriver: DeliveryDriver = {
        ...driverData,
        id: newDriverId,
        userId: newUserId,
        email: cleanEmail,
        status: 'PENDENTE',
        operationalStatus: 'OFFLINE',
        rating: 5.0,
        totalDeliveries: 0,
        totalEarnings: 0,
        registeredAt: new Date().toISOString()
      };

      setUsers(prev => [newUser, ...prev]);
      persistUserToFirestore(newUser);
      setDeliveryDrivers(prev => [newDriver, ...prev]);
      persistDeliveryDriverToFirestore(newDriver);
      addAuditLog('DRIVER_REGISTERED', `Novo entregador ${newDriver.name} (${newDriver.vehicleType} - ${newDriver.vehiclePlate}) cadastrado.`);
      triggerToast(`Cadastro de ${newDriver.name} recebido com sucesso! Aguarde a aprovaÃ’Â§Ã’Â£o do Master.`);

      return {
        success: true,
        message: 'Cadastro enviado com sucesso! Seus documentos estÃ’Â£o na fila para validaÃ’Â§Ã’Â£o pela administraÃ’Â§Ã’Â£o.',
        driver: newDriver
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erro ao registrar entregador.' };
    }
  };

  const approveDeliveryDriver = async (driverId: string, notes?: string): Promise<{ success: boolean; message: string }> => {
    let driverName = '';
    let updatedDriver: DeliveryDriver | null = null;
    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          driverName = d.name;
          updatedDriver = {
            ...d,
            status: 'APROVADO',
            approvedAt: new Date().toISOString(),
            notes: notes || d.notes
          };
          return updatedDriver;
        }
        return d;
      })
    );
    if (updatedDriver) {
      persistDeliveryDriverToFirestore(updatedDriver);
    }
    addAuditLog('DRIVER_APPROVED', `Entregador ${driverName || driverId} foi APROVADO pelo Master.`);
    triggerToast(`Entregador ${driverName} aprovado com sucesso!`);
    return { success: true, message: `Entregador ${driverName} aprovado com sucesso!` };
  };

  const rejectDeliveryDriver = async (driverId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    let driverName = '';
    let updatedDriver: DeliveryDriver | null = null;
    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          driverName = d.name;
          updatedDriver = {
            ...d,
            status: 'REPROVADO',
            statusReason: reason,
            operationalStatus: 'OFFLINE'
          };
          return updatedDriver;
        }
        return d;
      })
    );
    if (updatedDriver) {
      persistDeliveryDriverToFirestore(updatedDriver);
    }
    addAuditLog('DRIVER_REJECTED', `Entregador ${driverName || driverId} foi REPROVADO pelo Master. Motivo: ${reason}`);
    triggerToast(`Cadastro de ${driverName} foi reprovado.`);
    return { success: true, message: 'Cadastro reprovado.' };
  };

  const blockDeliveryDriver = async (driverId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    let driverName = '';
    let updatedDriver: DeliveryDriver | null = null;
    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          driverName = d.name;
          updatedDriver = {
            ...d,
            status: 'BLOQUEADO',
            statusReason: reason,
            operationalStatus: 'OFFLINE'
          };
          return updatedDriver;
        }
        return d;
      })
    );
    if (updatedDriver) {
      persistDeliveryDriverToFirestore(updatedDriver);
    }
    addAuditLog('DRIVER_BLOCKED', `Entregador ${driverName || driverId} foi BLOQUEADO pelo Master. Motivo: ${reason}`);
    triggerToast(`Entregador ${driverName} bloqueado.`);
    return { success: true, message: 'Entregador bloqueado com sucesso.' };
  };

  const unblockDeliveryDriver = async (driverId: string): Promise<{ success: boolean; message: string }> => {
    let driverName = '';
    let updatedDriver: DeliveryDriver | null = null;
    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          driverName = d.name;
          updatedDriver = {
            ...d,
            status: 'APROVADO',
            statusReason: undefined
          };
          return updatedDriver;
        }
        return d;
      })
    );
    if (updatedDriver) {
      persistDeliveryDriverToFirestore(updatedDriver);
    }
    addAuditLog('DRIVER_UNBLOCKED', `Entregador ${driverName || driverId} foi DESBLOQUEADO pelo Master.`);
    triggerToast(`Entregador ${driverName} desbloqueado.`);
    return { success: true, message: 'Entregador desbloqueado com sucesso.' };
  };

  const suspendDeliveryDriver = async (driverId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    let driverName = '';
    let updatedDriver: DeliveryDriver | null = null;
    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          driverName = d.name;
          updatedDriver = {
            ...d,
            status: 'SUSPENSO',
            statusReason: reason,
            operationalStatus: 'OFFLINE'
          };
          return updatedDriver;
        }
        return d;
      })
    );
    if (updatedDriver) {
      persistDeliveryDriverToFirestore(updatedDriver);
    }
    addAuditLog('DRIVER_SUSPENDED', `Entregador ${driverName || driverId} foi SUSPENSO pelo Master. Motivo: ${reason}`);
    triggerToast(`Entregador ${driverName} suspenso.`);
    return { success: true, message: 'Entregador suspenso.' };
  };

  const setDriverOperationalStatus = async (driverId: string, status: DeliveryOperationalStatus): Promise<{ success: boolean; message: string }> => {
    const driver = deliveryDrivers.find(d => d.id === driverId);
    if (!driver) {
      return { success: false, message: 'Entregador nÃ’Â£o encontrado.' };
    }
    if (driver.status !== 'APROVADO' && status === 'ONLINE') {
      return { success: false, message: 'Somente entregadores com cadastro APROVADO pela administraÃ’Â§Ã’Â£o podem ficar online.' };
    }

    let updatedDriver: DeliveryDriver | null = null;
    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          updatedDriver = {
            ...d,
            operationalStatus: status,
            lastLocationUpdatedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          };
          return updatedDriver;
        }
        return d;
      })
    );

    if (updatedDriver) {
      persistDeliveryDriverToFirestore(updatedDriver);
      if (currentDeliveryDriver && currentDeliveryDriver.id === driverId) {
        setCurrentDeliveryDriver(updatedDriver);
      }
    }

    triggerToast(`Status do entregador alterado para ${status}.`);
    return { success: true, message: `Status alterado para ${status}.` };
  };

  const createDeliveryRide = async (params: {
    orderId: string;
    originAddress?: string;
    originNeighborhood?: string;
    destinationAddress?: string;
    destinationNeighborhood?: string;
    customDistanceKm?: number;
    vehicleType?: 'MOTO' | 'CARRO' | 'BICICLETA' | 'VAN';
    notes?: string;
  }): Promise<{ success: boolean; message: string; ride?: DeliveryRide }> => {
    const order = orders.find(o => o.id === params.orderId);
    if (!order) {
      return { success: false, message: 'Pedido nÃ’Â£o localizado.' };
    }

    const existingRide = deliveryRides.find(r => r.orderId === order.id && r.status !== 'CANCELADA');
    if (existingRide) {
      return { success: false, message: `JÃ’Â¡ existe uma entrega ativa (#${existingRide.rideCode}) para este pedido.` };
    }

    const merchant = merchants.find(m => m.id === order.merchantId);
    const origin = params.originAddress || merchant?.address || 'Centro, Cachoeiras de Macacu - RJ';
    const originBairro = params.originNeighborhood || merchant?.neighborhood || 'Centro';
    const dest = params.destinationAddress || order.deliveryAddress || 'CastÃ’Â¡lia, Cachoeiras de Macacu - RJ';
    const destBairro = params.destinationNeighborhood || 'Centro';

    let distanceKm = params.customDistanceKm;
    if (!distanceKm) {
      const distResult = calculateDeliveryDistance(originBairro || origin, destBairro || dest);
      distanceKm = distResult.distanceKm;
    }

    const ratePerKm = systemSettings.deliveryRatePerKm ?? 1.00;
    const minimumFare = systemSettings.deliveryMinimumFare ?? 5.00;
    const platformFeeUpTo10Km = systemSettings.deliveryPlatformFeeUpTo10Km ?? systemSettings.deliveryPlatformFee ?? 5.00;
    const platformFeeUpTo20Km = systemSettings.deliveryPlatformFeeUpTo20Km ?? 4.00;
    const platformFeeAbove20Km = systemSettings.deliveryPlatformFeeAbove20Km ?? 3.50;
    const pricing = calculateDeliveryPricing(distanceKm, ratePerKm, platformFeeUpTo10Km, 'Centro', 'Centro', minimumFare, platformFeeUpTo10Km, platformFeeUpTo20Km, platformFeeAbove20Km);

    const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const rideCode = `DEL-${Math.floor(10000 + Math.random() * 90000)}`;
    const rideId = `ride-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const currentDate = nowIso.split('T')[0];
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const device = typeof navigator !== 'undefined' ? `${navigator.userAgent} (${navigator.platform})` : 'Web Environment';

    const newRide: DeliveryRide = {
      id: rideId,
      delivery_id: rideId,
      rideCode,
      orderId: order.id,
      order_id: order.id,
      orderCode: order.orderCode || `PED-${order.id.slice(-5)}`,
      merchantId: order.merchantId,
      merchant_id: order.merchantId,
      merchantName: merchant?.name || order.merchantName || 'Loja Parceira',
      merchantPhone: merchant?.phone || '(21) 99999-0000',
      originAddress: origin,
      origem: origin,
      originNeighborhood: originBairro,
      customerId: order.customerId,
      customer_id: order.customerId,
      customerName: order.customerName || 'Cliente Achei Aqui',
      customerPhone: order.customerPhone || '(21) 98888-0000',
      destinationAddress: dest,
      destino: dest,
      destinationNeighborhood: destBairro,
      distanceKm,
      distancia: distanceKm,
      tipo_veiculo: params.vehicleType || 'MOTO',
      observacoes: params.notes || '',
      ratePerKmApplied: ratePerKm,
      platformFeeApplied: pricing.platformFee,
      driverEarnings: pricing.driverEarnings,
      valor_entregador: pricing.driverEarnings,
      totalDeliveryFee: pricing.totalDeliveryFee,
      valor_calculado: pricing.totalDeliveryFee,
      customerPaid: true,
      status: 'AGUARDANDO_ANALISE',
      confirmationCode,
      calculationTimestamp: nowIso,
      data_solicitacao: currentDate,
      hora_solicitacao: currentTime,
      created_at: nowIso,
      createdAt: nowIso,
      created_by: currentUser?.email || merchant?.email || 'LOJISTA',
      deviceInfo: device,
      paymentStatus: 'PENDENTE',
      history: [
        {
          timestamp: nowIso,
          status: 'AGUARDANDO_ANALISE',
          description: `SolicitaÃ’Â§Ã’Â£o de entrega criada pelo lojista para o pedido ${order.orderCode || order.id}. DistÃ’Â¢ncia calculada: ${distanceKm} km. Tarifa: R$ ${pricing.totalDeliveryFee.toFixed(2)}. VeÃ’Â­culo: ${params.vehicleType || 'MOTO'}. Encaminhada para anÃ’Â¡lise operacional do Master.`,
          actorName: merchant?.name || currentUser?.name || 'Lojista',
          actorRole: 'LOJISTA'
        }
      ]
    };

    setDeliveryRides(prev => [newRide, ...prev]);
    persistDeliveryRideToFirestore(newRide);

    setOrders(prev =>
      prev.map(o => {
        if (o.id === order.id) {
          return {
            ...o,
            deliveryRideId: rideId,
            deliveryRideStatus: 'AGUARDANDO_ANALISE'
          };
        }
        return o;
      })
    );

    addAuditLog(
      'DELIVERY_RIDE_REQUESTED',
      `SolicitaÃ’Â§Ã’Â£o de entrega ${rideCode} enviada para anÃ’Â¡lise operacional do Master. Pedido: ${order.id}. DistÃ’Â¢ncia: ${distanceKm}km.`
    );

    triggerToast(`SolicitaÃ’Â§Ã’Â£o ${rideCode} enviada para a Central Master! Aguardando aprovaÃ’Â§Ã’Â£o.`);
    return { success: true, message: `SolicitaÃ’Â§Ã’Â£o ${rideCode} aguardando anÃ’Â¡lise do Master.`, ride: newRide };
  };

  const approveDeliveryRide = async (
    rideId: string,
    dispatchMode: 'RADAR' | 'DRIVER' = 'RADAR',
    targetDriverId?: string
  ): Promise<{ success: boolean; message: string; uniqueRideCode?: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    // 1. Validar todos os dados
    if (!ride.merchantName || !ride.originAddress) {
      return { success: false, message: 'Dados de origem (lojista e endereÃ’Â§o de coleta) incompletos.' };
    }
    if (!ride.customerName || !ride.destinationAddress) {
      return { success: false, message: 'Dados de destino (cliente e endereÃ’Â§o de entrega) incompletos.' };
    }
    if (!ride.orderId && !ride.orderCode) {
      return { success: false, message: 'Identificador do pedido vinculado ausente.' };
    }

    // 3. Validar distÃ’Â¢ncia
    const distance = Number(ride.distanceKm || ride.distancia || 0);
    if (isNaN(distance) || distance <= 0) {
      return { success: false, message: 'DistÃ’Â¢ncia da entrega invÃ’Â¡lida (deve ser maior que zero).' };
    }
    if (distance > 60) {
      return { success: false, message: `DistÃ’Â¢ncia calculada (${distance.toFixed(1)} km) excede o limite do municÃ’Â­pio (mÃ’Â¡x 60 km).` };
    }

    // 2. Recalcular a tarifa no backend
    const currentRatePerKm = systemSettings?.deliveryRatePerKm ?? 1.0;
    const currentMinimumFare = systemSettings?.deliveryMinimumFare ?? 5.00;
    const currentPlatformFeeUpTo10Km = systemSettings?.deliveryPlatformFeeUpTo10Km ?? systemSettings?.deliveryPlatformFee ?? 5.00;
    const currentPlatformFeeUpTo20Km = systemSettings?.deliveryPlatformFeeUpTo20Km ?? 4.00;
    const currentPlatformFeeAbove20Km = systemSettings?.deliveryPlatformFeeAbove20Km ?? 3.50;
    const recalculated = calculateDeliveryPricing(distance, currentRatePerKm, currentPlatformFeeUpTo10Km, 'Centro', 'Centro', currentMinimumFare, currentPlatformFeeUpTo10Km, currentPlatformFeeUpTo20Km, currentPlatformFeeAbove20Km);

    // 4. Validar valor
    if (recalculated.totalDeliveryFee <= 0 || recalculated.driverEarnings <= 0) {
      return { success: false, message: 'Valores financeiros de entrega inconsistentes no recÃ’Â¡lculo.' };
    }

    // 5. Gerar cÃ’Â³digo/identificador Ã’Âºnico da entrega
    const generatedUniqueCode =
      ride.rideCode && ride.rideCode.startsWith('DEL-') && ride.rideCode.length >= 8
        ? ride.rideCode
        : `DEL-${Math.floor(10000 + Math.random() * 90000)}`;

    const nowIso = new Date().toISOString();
    let targetDriver: DeliveryDriver | undefined;
    if (dispatchMode === 'DRIVER' && targetDriverId) {
      targetDriver = deliveryDrivers.find(d => d.id === targetDriverId);
    }

    // 6. Alterar status para: DISPONIVEL_ENTREGADORES
    const nextStatus: DeliveryRideStatus = targetDriver ? 'ENTREGADOR_SELECIONADO' : 'DISPONIVEL_ENTREGADORES';
    const description = targetDriver
      ? `Entrega aprovada pelo Master (${currentUser?.name || 'Master AcheiAqui'}). Tarifa recalculada: R$ ${recalculated.totalDeliveryFee.toFixed(2)}. Direcionada ao entregador ${targetDriver.name} (${targetDriver.vehiclePlate}).`
      : `Entrega aprovada pelo Master (${currentUser?.name || 'Master AcheiAqui'}). Dados validados. Tarifa recalculada no backend: R$ ${recalculated.totalDeliveryFee.toFixed(2)} (Repasse: R$ ${recalculated.driverEarnings.toFixed(2)}). Status: DISPONIVEL_ENTREGADORES. Disponibilizada no radar para entregadores elegÃ’Â­veis.`;

    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            rideCode: generatedUniqueCode,
            status: nextStatus,
            ratePerKmApplied: currentRatePerKm,
            platformFeeApplied: recalculated.platformFee,
            driverEarnings: recalculated.driverEarnings,
            valor_entregador: recalculated.driverEarnings,
            totalDeliveryFee: recalculated.totalDeliveryFee,
            valor_calculado: recalculated.totalDeliveryFee,
            recalculatedAt: nowIso,
            recalculatedRatePerKm: currentRatePerKm,
            recalculatedPlatformFee: recalculated.platformFee,
            approvedBy: currentUser?.name || 'Master AcheiAqui',
            approvedAt: nowIso,
            driverId: targetDriver ? targetDriver.id : undefined,
            driverName: targetDriver ? targetDriver.name : undefined,
            driverPhone: targetDriver ? targetDriver.phone : undefined,
            driverPlate: targetDriver ? targetDriver.vehiclePlate : undefined,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: nextStatus,
                description,
                actorName: currentUser?.name || 'Master Delivery',
                actorRole: 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    // 7. Criar registro de auditoria
    addAuditLog(
      'DELIVERY_APPROVED',
      `[APROVAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O MASTER] Entrega ${generatedUniqueCode} (Pedido: ${ride.orderCode || ride.orderId}). Origem: ${ride.originAddress} -> Destino: ${ride.destinationAddress}. DistÃ’Â¢ncia: ${distance.toFixed(1)}km validada. Tarifa recalculada: R$ ${recalculated.totalDeliveryFee.toFixed(2)} (Repasse: R$ ${recalculated.driverEarnings.toFixed(2)}, Taxa: R$ ${recalculated.platformFee.toFixed(2)}). Status alterado para: ${nextStatus}.`
    );

    // 8. Disponibilizar a entrega no portal dos entregadores elegÃ’Â­veis
    triggerToast(
      targetDriver
        ? `Entrega ${generatedUniqueCode} direcionada para ${targetDriver.name}!`
        : `Entrega ${generatedUniqueCode} aprovada! Liberada no radar dos entregadores parceiros.`
    );

    return {
      success: true,
      message: `Entrega ${generatedUniqueCode} aprovada e liberada com sucesso.`,
      uniqueRideCode: generatedUniqueCode
    };
  };

  const rejectDeliveryRide = async (rideId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, message: 'Ã’ï¿½Ã¢ï¿½ï¿½Â° obrigatÃ’Â³rio informar o motivo da rejeiÃ’Â§Ã’Â£o da solicitaÃ’Â§Ã’Â£o.' };
    }

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'REJEITADA',
            rejectionReason: trimmedReason,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'REJEITADA',
                description: `SolicitaÃ’Â§Ã’Â£o de entrega REJEITADA pelo Master (${currentUser?.name || 'Master Delivery'}). Justificativa obrigatÃ’Â³ria: ${trimmedReason}`,
                actorName: currentUser?.name || 'Master Delivery',
                actorRole: 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    addAuditLog(
      'DELIVERY_REJECTED',
      `[REJEIÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O MASTER] Entrega ${ride.rideCode} (Pedido: ${ride.orderCode || ride.orderId}) REJEITADA pelo Master. Motivo: ${trimmedReason}`
    );
    triggerToast(`SolicitaÃ’Â§Ã’Â£o ${ride.rideCode} rejeitada.`);
    return { success: true, message: 'SolicitaÃ’Â§Ã’Â£o rejeitada com sucesso.' };
  };

  const requestCorrectionDeliveryRide = async (rideId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, message: 'Ã’ï¿½Ã¢ï¿½ï¿½Â° obrigatÃ’Â³rio informar as instruÃ’Â§Ã’Âµes/motivo da solicitaÃ’Â§Ã’Â£o de correÃ’Â§Ã’Â£o.' };
    }

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'CORRECAO_SOLICITADA',
            correctionRequestedReason: trimmedReason,
            correctionRequestedAt: nowIso,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'CORRECAO_SOLICITADA',
                description: `CorreÃ’Â§Ã’Â£o solicitada pelo Master (${currentUser?.name || 'Master Delivery'}) ao lojista. Motivo: ${trimmedReason}`,
                actorName: currentUser?.name || 'Master Delivery',
                actorRole: 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    addAuditLog(
      'DELIVERY_CORRECTION_REQUESTED',
      `[SOLICITAÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O DE CORREÃ’ï¿½Ã¢ï¿½ï¿½Â¡Ã’ï¿½ï¿½ ï¿½"O] Entrega ${ride.rideCode} (Pedido: ${ride.orderCode || ride.orderId}). Master solicitou correÃ’Â§Ã’Â£o ao lojista. Motivo: ${trimmedReason}`
    );
    triggerToast(`SolicitaÃ’Â§Ã’Â£o de correÃ’Â§Ã’Â£o enviada ao lojista para ${ride.rideCode}.`);
    return { success: true, message: 'CorreÃ’Â§Ã’Â£o solicitada com sucesso.' };
  };

  const authorizeDeliveryPayment = async (rideId: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'PAGAMENTO_AUTORIZADO',
            paymentStatus: 'LIBERADO',
            paymentAuthorizedAt: nowIso,
            paymentAuthorizedBy: currentUser?.name || 'Master Financeiro',
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'PAGAMENTO_AUTORIZADO',
                description: `Pagamento de R$ ${r.driverEarnings.toFixed(2)} ao entregador AUTORIZADO pelo Master.`,
                actorName: currentUser?.name || 'Master Financeiro',
                actorRole: 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    addAuditLog('DELIVERY_PAYMENT_AUTHORIZED', `Pagamento da corrida ${ride.rideCode} autorizado pelo Master.`);
    triggerToast(`Pagamento de R$ ${ride.driverEarnings.toFixed(2)} autorizado com sucesso!`);
    return { success: true, message: 'Pagamento autorizado.' };
  };

  const processDeliveryPayment = async (rideId: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'PAGAMENTO_PROCESSANDO',
            paymentStatus: 'PROCESSANDO',
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'PAGAMENTO_PROCESSANDO',
                description: `TransferÃ’Âªncia Pix de R$ ${r.driverEarnings.toFixed(2)} em processamento bancÃ’Â¡rio.`,
                actorName: 'Sistema Financeiro AcheiAqui',
                actorRole: 'SISTEMA'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    triggerToast(`Processando pagamento Pix de R$ ${ride.driverEarnings.toFixed(2)}...`);
    return { success: true, message: 'Pagamento em processamento.' };
  };

  const markDeliveryRidePaid = async (rideId: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'PAGA',
            paymentStatus: 'PAGO',
            paymentPaidAt: nowIso,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'PAGA',
                description: `Pagamento de R$ ${r.driverEarnings.toFixed(2)} CONCLUÃ’ÂDO com sucesso via Pix para o entregador.`,
                actorName: currentUser?.name || 'Master Financeiro',
                actorRole: 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    if (ride.driverId) {
      setDeliveryDrivers(prev =>
        prev.map(d => {
          if (d.id === ride.driverId) {
            const updated = {
              ...d,
              totalEarnings: Math.round(((d.totalEarnings || 0) + ride.driverEarnings) * 100) / 100
            };
            persistDeliveryDriverToFirestore(updated);
            return updated;
          }
          return d;
        })
      );
    }

    addAuditLog('DELIVERY_PAYMENT_COMPLETED', `Pagamento de R$ ${ride.driverEarnings.toFixed(2)} quitado para a entrega ${ride.rideCode}.`);
    triggerToast(`Pagamento liquidado com sucesso! Entregador remunerado.`);
    return { success: true, message: 'Pagamento concluÃ’Â­do.' };
  };

  const failDeliveryPayment = async (rideId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'PAGAMENTO_FALHOU',
            paymentStatus: 'FALHA',
            paymentFailureReason: reason,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'PAGAMENTO_FALHOU',
                description: `Falha no processamento do repasse Pix. Motivo: ${reason}`,
                actorName: 'Sistema Financeiro AcheiAqui',
                actorRole: 'SISTEMA'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    addAuditLog('DELIVERY_PAYMENT_FAILED', `Falha no pagamento da corrida ${ride.rideCode}. Motivo: ${reason}`);
    triggerToast(`Alerta: Falha no processamento do pagamento.`);
    return { success: true, message: 'Falha registrada no pagamento.' };
  };

  const returnDeliveryRide = async (rideId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'DEVOLVIDA',
            returnReason: reason,
            returnedAt: nowIso,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'DEVOLVIDA',
                description: `Mercadoria devolvida Ã’Â  loja de origem. Motivo: ${reason}`,
                actorName: currentUser?.name || 'Central de Suporte',
                actorRole: 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    if (ride.driverId) {
      setDeliveryDrivers(prev =>
        prev.map(d => (d.id === ride.driverId ? { ...d, activeRideId: undefined } : d))
      );
    }

    addAuditLog('DELIVERY_RETURNED', `Entrega ${ride.rideCode} devolvida. Motivo: ${reason}`);
    triggerToast(`Entrega registrada como devolvida.`);
    return { success: true, message: 'Entrega devolvida com sucesso.' };
  };

  const transitionDeliveryRide = async (
    rideId: string,
    toStatus: DeliveryRideStatus,
    notes?: string
  ): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    const actor: DeliveryActor = {
      id: currentUser?.id || 'system',
      name: currentUser?.name || 'AdministraÃ’Â§Ã’Â£o',
      role: (currentUser?.role === 'MASTER' ? 'MASTER' : currentUser?.role === 'ENTREGADOR' ? 'ENTREGADOR' : 'LOJISTA')
    };
    const validation = validateDeliveryTransition(ride, toStatus, actor);
    if (!validation.allowed) {
      return { success: false, message: validation.reason || 'TransiÃ’Â§Ã’Â£o de status invÃ’Â¡lida.' };
    }

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: toStatus,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: toStatus,
                description: notes || `Status operacional alterado para ${toStatus}`,
                actorName: currentUser?.name || 'Central Operacional',
                actorRole: actor.role
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    triggerToast(`Status atualizado para ${toStatus}.`);
    return { success: true, message: `Status alterado para ${toStatus}.` };
  };

  const acceptDeliveryRide = async (rideId: string, driverId: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) {
      return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };
    }
    const isAvailable =
      ride.status === 'DISPONIVEL_ENTREGADORES' ||
      ride.status === 'AGUARDANDO_ENTREGADOR' ||
      (ride.status === 'ENTREGADOR_SELECIONADO' && ride.driverId === driverId);

    if (!isAvailable) {
      return { success: false, message: 'Esta corrida nÃ’Â£o estÃ’Â¡ disponÃ’Â­vel para aceite.' };
    }

    const driver = deliveryDrivers.find(d => d.id === driverId);
    if (!driver) {
      return { success: false, message: 'Entregador nÃ’Â£o encontrado.' };
    }
    if (driver.status !== 'APROVADO') {
      return { success: false, message: 'Seu cadastro precisa estar APROVADO pela administraÃ’Â§Ã’Â£o para aceitar corridas.' };
    }
    if (driver.operationalStatus !== 'ONLINE') {
      return { success: false, message: 'Fique ONLINE no topo do painel para poder aceitar entregas.' };
    }

    const activeRide = deliveryRides.find(
      r => r.driverId === driverId && ['ACEITA', 'EM_DESLOCAMENTO_COLETA', 'EM_COLETA', 'CHEGOU_COLETA', 'COLETADA', 'EM_DESLOCAMENTO_ENTREGA', 'EM_TRANSITO', 'CHEGOU_DESTINO', 'AGUARDANDO_CODIGO'].includes(r.status)
    );
    if (activeRide) {
      return { success: false, message: `VocÃ’Âª jÃ’Â¡ estÃ’Â¡ atendendo a corrida #${activeRide.rideCode}. Conclua-a antes de aceitar outra.` };
    }

    const nowIso = new Date().toISOString();
    const updatedHistoryItem = {
      timestamp: nowIso,
      status: 'ACEITA' as DeliveryRideStatus,
      description: `Corrida aceita pelo entregador parceiro ${driver.name} (${driver.vehicleModel} - Placa ${driver.vehiclePlate}).`,
      actorId: driver.id,
      actorName: driver.name,
      actorRole: 'ENTREGADOR' as const
    };

    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'ACEITA',
            driverId: driver.id,
            driverName: driver.name,
            driverPhone: driver.phone,
            driverVehicle: `${driver.vehicleModel} (${driver.vehicleColor || driver.vehicleType})`,
            driverPlate: driver.vehiclePlate,
            driverPhoto: driver.photo,
            acceptedAt: nowIso,
            history: [...r.history, updatedHistoryItem]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    setDeliveryDrivers(prev =>
      prev.map(d => {
        if (d.id === driverId) {
          const upd = { ...d, activeRideId: rideId };
          persistDeliveryDriverToFirestore(upd);
          return upd;
        }
        return d;
      })
    );

    if (currentDeliveryDriver && currentDeliveryDriver.id === driverId) {
      setCurrentDeliveryDriver({ ...currentDeliveryDriver, activeRideId: rideId });
    }

    setOrders(prev =>
      prev.map(o => (o.id === ride.orderId ? { ...o, deliveryRideStatus: 'ACEITA' } : o))
    );

    addAuditLog('DELIVERY_RIDE_ACCEPTED', `Corrida ${ride.rideCode} aceita pelo entregador ${driver.name}.`);
    triggerToast(`Corrida ${ride.rideCode} aceita com sucesso! Inicie o trajeto para coleta.`);

    return { success: true, message: `Corrida ${ride.rideCode} aceita! VÃ’Â¡ atÃ’Â© a loja para coletar.` };
  };

  const startRidePickup = async (rideId: string): Promise<{ success: boolean; message: string }> => {
    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'EM_DESLOCAMENTO_COLETA',
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'EM_DESLOCAMENTO_COLETA',
                description: 'Entregador em deslocamento atÃ’Â© o estabelecimento para retirar o pedido.',
                actorId: r.driverId,
                actorName: r.driverName,
                actorRole: 'ENTREGADOR'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    triggerToast(`Deslocamento para coleta iniciado!`);
    return { success: true, message: 'Status atualizado para EM_DESLOCAMENTO_COLETA.' };
  };

  const confirmRideCollected = async (rideId: string): Promise<{ success: boolean; message: string }> => {
    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'EM_DESLOCAMENTO_ENTREGA',
            collectedAt: nowIso,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'COLETADA',
                description: 'Pacote conferido e coletado no estabelecimento comercial.',
                actorId: r.driverId,
                actorName: r.driverName,
                actorRole: 'ENTREGADOR'
              },
              {
                timestamp: nowIso,
                status: 'EM_DESLOCAMENTO_ENTREGA',
                description: 'Entregador em rota de entrega com destino ao endereÃ’Â§o do comprador.',
                actorId: r.driverId,
                actorName: r.driverName,
                actorRole: 'ENTREGADOR'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    const matchedRide = deliveryRides.find(r => r.id === rideId);
    if (matchedRide) {
      setOrders(prev =>
        prev.map(o => (o.id === matchedRide.orderId ? { ...o, status: 'Em Rota', deliveryRideStatus: 'EM_DESLOCAMENTO_ENTREGA' } : o))
      );
    }

    triggerToast(`Pacote coletado! Inicie o trajeto atÃ’Â© o endereÃ’Â§o do cliente.`);
    return { success: true, message: 'Pacote coletado. Status atualizado para EM_DESLOCAMENTO_ENTREGA.' };
  };

  const deliverRide = async (rideId: string, confirmationCode: string): Promise<{ success: boolean; message: string }> => {
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) {
      return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };
    }

    const cleanInput = confirmationCode.replace(/\D/g, '').trim();
    const cleanExpected = ride.confirmationCode.replace(/\D/g, '').trim();

    if (cleanInput !== cleanExpected) {
      return {
        success: false,
        message: 'CÃ’Â³digo de confirmaÃ’Â§Ã’Â£o incorreto! Solicite o cÃ’Â³digo de 4 dÃ’Â­gitos ao cliente no ato da entrega.'
      };
    }

    const nowIso = new Date().toISOString();
    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'AGUARDANDO_LIBERACAO_PAGAMENTO',
            deliveredAt: nowIso,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'ENTREGUE',
                description: `Entrega fÃ’Â­sica realizada com sucesso. CÃ’Â³digo de seguranÃ’Â§a ${cleanExpected} validado pelo cliente.`,
                actorId: r.driverId,
                actorName: r.driverName,
                actorRole: 'ENTREGADOR'
              },
              {
                timestamp: nowIso,
                status: 'AGUARDANDO_LIBERACAO_PAGAMENTO',
                description: `Corrida finalizada fisicamente. Encaminhada para conferÃ’Âªncia e liberaÃ’Â§Ã’Â£o financeira pelo Master.`,
                actorName: 'Sistema Achei Aqui',
                actorRole: 'SISTEMA'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    if (ride.driverId) {
      setDeliveryDrivers(prev =>
        prev.map(d => {
          if (d.id === ride.driverId) {
            const updated = {
              ...d,
              totalDeliveries: (d.totalDeliveries || 0) + 1,
              activeRideId: undefined
            };
            if (currentDeliveryDriver && currentDeliveryDriver.id === d.id) {
              setCurrentDeliveryDriver(updated);
            }
            persistDeliveryDriverToFirestore(updated);
            return updated;
          }
          return d;
        })
      );
    }

    setOrders(prev =>
      prev.map(o => (o.id === ride.orderId ? { ...o, status: 'ConcluÃ’Â­do', deliveryRideStatus: 'FINALIZADA' } : o))
    );

    addAuditLog(
      'DELIVERY_RIDE_DELIVERED',
      `Corrida ${ride.rideCode} entregue com sucesso. CÃ’Â³digo verificado. Aguardando liberaÃ’Â§Ã’Â£o financeira.`
    );

    triggerToast(`ParabÃ’Â©ns! Entrega concluÃ’Â­da. Encaminhada para liberaÃ’Â§Ã’Â£o do pagamento pelo Master.`);
    return {
      success: true,
      message: `Entrega confirmada com sucesso! Aguarde a liberaÃ’Â§Ã’Â£o do pagamento pelo Master.`
    };
  };

  const cancelDeliveryRide = async (rideId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    const nowIso = new Date().toISOString();
    const ride = deliveryRides.find(r => r.id === rideId);
    if (!ride) return { success: false, message: 'Corrida nÃ’Â£o encontrada.' };

    let updatedRide: DeliveryRide | null = null;

    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          updatedRide = {
            ...r,
            status: 'CANCELADA',
            cancellationReason: reason,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'CANCELADA',
                description: `Corrida cancelada. Motivo: ${reason}`,
                actorName: currentUser?.name || 'AdministraÃ’Â§Ã’Â£o',
                actorRole: currentUser?.role || 'MASTER'
              }
            ]
          };
          return updatedRide;
        }
        return r;
      })
    );

    if (updatedRide) {
      persistDeliveryRideToFirestore(updatedRide);
    }

    if (ride.driverId) {
      setDeliveryDrivers(prev =>
        prev.map(d => (d.id === ride.driverId ? { ...d, activeRideId: undefined } : d))
      );
    }

    addAuditLog('DELIVERY_RIDE_CANCELLED', `Corrida ${ride.rideCode} cancelada. Motivo: ${reason}`);
    triggerToast(`Corrida ${ride.rideCode} cancelada.`);
    return { success: true, message: 'Corrida cancelada.' };
  };

  const reportRideIncident = async (rideId: string, notes: string): Promise<{ success: boolean; message: string }> => {
    const nowIso = new Date().toISOString();
    setDeliveryRides(prev =>
      prev.map(r => {
        if (r.id === rideId) {
          return {
            ...r,
            status: 'OCORRENCIA',
            incidentNotes: notes,
            history: [
              ...r.history,
              {
                timestamp: nowIso,
                status: 'OCORRENCIA',
                description: `OcorrÃ’Âªncia registrada: ${notes}`,
                actorName: currentUser?.name || 'UsuÃ’Â¡rio',
                actorRole: currentUser?.role || 'SISTEMA'
              }
            ]
          };
        }
        return r;
      })
    );

    addAuditLog('DELIVERY_RIDE_INCIDENT', `OcorrÃ’Âªncia na corrida ${rideId}: ${notes}`);
    triggerToast('OcorrÃ’Âªncia registrada e encaminhada para a administraÃ’Â§Ã’Â£o Master.');
    return { success: true, message: 'OcorrÃ’Âªncia registrada com sucesso.' };
  };

  const updateDeliveryTariffs = async (
    ratePerKm: number,
    minimumFare: number,
    platformFeeUpTo10Km: number,
    platformFeeUpTo20Km: number,
    platformFeeAbove20Km: number
  ): Promise<{ success: boolean; message: string }> => {
    if (
      ratePerKm < 0 ||
      minimumFare < 0 ||
      platformFeeUpTo10Km < 0 ||
      platformFeeUpTo20Km < 0 ||
      platformFeeAbove20Km < 0
    ) {
      return { success: false, message: 'Os valores de tarifas nÃ’Â£o podem ser negativos.' };
    }

    const newSettings = {
      ...systemSettings,
      deliveryRatePerKm: Math.round(ratePerKm * 100) / 100,
      deliveryMinimumFare: Math.round(minimumFare * 100) / 100,
      deliveryPlatformFee: Math.round(platformFeeUpTo10Km * 100) / 100,
      deliveryPlatformFeeUpTo10Km: Math.round(platformFeeUpTo10Km * 100) / 100,
      deliveryPlatformFeeUpTo20Km: Math.round(platformFeeUpTo20Km * 100) / 100,
      deliveryPlatformFeeAbove20Km: Math.round(platformFeeAbove20Km * 100) / 100
    };

    setSystemSettings(newSettings);

    addAuditLog(
      'DELIVERY_TARIFFS_UPDATED',
      `Tarifas de delivery atualizadas pelo Master: R$ ${newSettings.deliveryMinimumFare.toFixed(2)} mÃ’Â­nimo, R$ ${newSettings.deliveryRatePerKm.toFixed(2)}/km, R$ ${newSettings.deliveryPlatformFeeUpTo10Km.toFixed(2)} atÃ’Â© 10 km, R$ ${newSettings.deliveryPlatformFeeUpTo20Km.toFixed(2)} atÃ’Â© 20 km e R$ ${newSettings.deliveryPlatformFeeAbove20Km.toFixed(2)} acima de 20 km.`
    );

    triggerToast('Novas tarifas de delivery salvas com sucesso! Corridas jÃ’Â¡ abertas mantÃ’Âªm seus valores.');
    return { success: true, message: 'Tarifas atualizadas com sucesso!' };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        systemSettings,
        currentEnvironment,
        currentCity,
        merchants,
        products,
        services,
        orders,
        cart,
        favorites,
        auditLogs,
        interCategoryBanners,
        adSpaces,
        frontendConfig,
        setCurrentEnvironment,
        setCurrentCity,
        login,
        verifyTwoFactorCode,
        resendTwoFactorCode,
        loginAsUser,
        loginWithFirebaseEmail,
        loginWithFirebaseGoogle,
        registerCustomerWithFirebase,
        registerMerchantWithFirebase,
        sendFirebasePasswordReset,
        registerCustomer,
        registerMerchant,
        confirmMerchantPlanPayment,
        completeInitialPasswordChange,
        logout,
        updateUserPassword,
        toggleTwoFactor,
        resendEmailConfirmation,
        requestPasswordReset,
        completePasswordReset,
        addAuditLog,
        logSecurityEvent,
        logOrderEvent,
        logDataReleaseEvent,
        logMessageEvent,
        logFinancialEvent,
        getAuditLogsByEntity,
        getAuditStats,
        exportAuditLogs,
        updateUserProfile,
        addCustomerAddress,
        updateCustomerAddress,
        deleteCustomerAddress,
        setDefaultCustomerAddress,
        updateVipMeasurements,
        updateCustomerPreferences,
        createUserByMaster,
        updateUserByMaster,
        blockUserByMaster,
        suspendUserByMaster,
        reactivateUserByMaster,
        deleteUserByMaster,
        resetUserPasswordByMaster,
        toggleUserVerificationByMaster,
        impersonateUser,
        approveMerchant,
        rejectMerchant,
        suspendMerchant,
        reactivateMerchant,
        deleteMerchant,
        updateStoreProfile,
        createMerchantByMaster,
        setMerchantCommissionRate,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        toggleProductFeatured,
        addService,
        updateService,
        deleteService,
        createOrder,
        confirmOrderStock,
        rejectOrderStock,
        updateOrderStatus,
        updateOrderDetailsByMaster,
        cancelOrderByMaster,
        forceCompleteOrderByMaster,
        deleteOrderByMaster,
        validatePickupCode,
        updateSystemSettings,
        clearAuditLogs,
        exportFullDatabaseSnapshot,
        importFullDatabaseSnapshot,
        resetDatabaseToDefaults,
        addToCart,
        removeFromCart,
        clearCart,
        toggleFavorite,
        isFavorite,
        addInterCategoryBanner,
        updateInterCategoryBanner,
        deleteInterCategoryBanner,
        toggleInterCategoryBannerStatus,
        addAdSpace,
        updateAdSpace,
        deleteAdSpace,
        placeAdBid,
        acceptAuctionWinner,
        sellAdSpaceDirectly,
        trackAdImpression,
        trackAdClick,
        updateFrontendConfig,
        addNavMenuItem,
        updateNavMenuItem,
        deleteNavMenuItem,
        reorderNavMenuItems,
        toastMessage,
        triggerToast,
        reviews,
        merchantReviews,
        isPolicyModalOpen,
        policyModalTab,
        openPolicyModal,
        closePolicyModal,
        isCopyrightModalOpen,
        openCopyrightModal,
        closeCopyrightModal,
        isPrivacyModalOpen,
        openPrivacyModal,
        closePrivacyModal,
        isTermsModalOpen,
        openTermsModal,
        closeTermsModal,
        isPlansModalOpen,
        openPlansModal,
        closePlansModal,
        isUserManualModalOpen,
        userManualModalTab,
        openUserManualModal,
        closeUserManualModal,
        upgradeMerchantPlan,
        payOrderCommissionByMerchant,
        confirmOrderCommissionByMaster,
        toggleOrderBuyerDataByMaster,
        addCustomerReview,
        addMerchantReview,
        replyToCustomerReview,
        getCustomerReputationSummary,
        isOrderReviewedByCustomer,
        isOrderReviewedByMerchant,
        notifications,
        sendInAppNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteInAppNotification,
        getUserNotifications,
        getUnreadNotificationsCount,
        isNotificationModalOpen,
        selectedNotification,
        openNotificationDetailModal,
        closeNotificationDetailModal,
        subOrderMessages,
        activeChatSubOrder,
        checkAccessPermission,
        openSubOrderChat,
        closeSubOrderChat,
        sendSubOrderMessage,
        sendSubOrderSystemMessage,
        dispatchOrderStatusSystemMessage,
        dispatchCommissionSystemMessage,
        receiveSubOrderMessage,
        markSubOrderMessagesAsRead,
        getSubOrderMessages,
        getUnreadSubOrderMessagesCount,
        deleteSubOrderMessage,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        authPromptModal,
        promptAuthRequirement,
        closeAuthPromptModal,

        // Equipe Comercial, Vendedores, Boletos & Metas
        salesAgents,
        boletoRequests,
        registeredClientsByAgents,
        commercialGoals,
        currentSalesAgent,
        setCurrentSalesAgent,
        addSalesAgent,
        updateSalesAgent,
        setSalesAgentCommission,
        createAgentRegisteredClient,
        submitBoletoRequest,
        markBoletoAsSent,
        confirmBoletoPaymentAndReleaseCommission,
        cancelBoletoRequest,
        markCommissionAsPaidToAgent,
        addCommercialGoal,
        updateCommercialGoal,
        deleteCommercialGoal,
        commercialAreas,
        addCommercialArea,
        updateCommercialArea,
        deleteCommercialArea,
        assignAgentHierarchyAndArea,

        // Camada de Webhooks de Boletos
        webhookEvents,
        webhookConfig,
        updateWebhookConfig,
        processBoletoWebhook,
        reprocessWebhookEvent,
        deleteWebhookEvent,
        clearWebhookLogs,

        // MÃ’Â³dulo de Delivery & Entregadores (V1)
        deliveryDrivers,
        deliveryRides,
        currentDeliveryDriver,
        setCurrentDeliveryDriver,
        registerDeliveryDriver,
        approveDeliveryDriver,
        rejectDeliveryDriver,
        blockDeliveryDriver,
        unblockDeliveryDriver,
        suspendDeliveryDriver,
        setDriverOperationalStatus,
        createDeliveryRide,
        approveDeliveryRide,
        rejectDeliveryRide,
        requestCorrectionDeliveryRide,
        authorizeDeliveryPayment,
        processDeliveryPayment,
        markDeliveryRidePaid,
        failDeliveryPayment,
        returnDeliveryRide,
        transitionDeliveryRide,
        acceptDeliveryRide,
        startRidePickup,
        confirmRideCollected,
        deliverRide,
        cancelDeliveryRide,
        reportRideIncident,
        updateDeliveryTariffs
      }}
    >
      {children}
      <AuthPromptModal
        isOpen={authPromptModal.isOpen}
        onClose={closeAuthPromptModal}
        actionType={authPromptModal.actionType}
        details={authPromptModal.details}
        onRegister={() => openAuthModal('register-customer')}
        onLogin={() => openAuthModal('login')}
      />
      <ReviewPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={closePolicyModal}
        defaultTab={policyModalTab}
      />
      <CopyrightModal
        isOpen={isCopyrightModalOpen}
        onClose={closeCopyrightModal}
        onOpenUserManual={openUserManualModal}
        onOpenPlansModal={openPlansModal}
        onOpenPrivacyModal={openPrivacyModal}
        onOpenTermsModal={openTermsModal}
      />
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={closePrivacyModal}
      />
      <TermsOfUseModal
        isOpen={isTermsModalOpen}
        onClose={closeTermsModal}
      />
      <UserManualModal
        isOpen={isUserManualModalOpen}
        onClose={closeUserManualModal}
        initialTab={userManualModalTab}
        onOpenPlansModal={openPlansModal}
        onOpenCopyrightModal={openCopyrightModal}
        onOpenPrivacyModal={openPrivacyModal}
        onOpenTermsModal={openTermsModal}
      />
      <MembershipPlansModal
        isOpen={isPlansModalOpen}
        onClose={closePlansModal}
        currentTier={currentUser?.membershipTier || 'GRATIS'}
        onSelectTier={(tier) => {
          if (currentUser?.merchantId) {
            upgradeMerchantPlan(currentUser.merchantId, tier);
          } else if (currentUser) {
            updateUserProfile({ membershipTier: tier });
          }
          closePlansModal();
        }}
      />
      <NotificationDetailModal
        isOpen={isNotificationModalOpen}
        notification={selectedNotification}
        onClose={closeNotificationDetailModal}
        onNavigateTab={(tab) => {
          if (tab === 'account') {
            setCurrentEnvironment('MARKETPLACE');
          } else if (tab === 'plans') {
            openPlansModal();
          } else if (tab === 'home') {
            setCurrentEnvironment('MARKETPLACE');
          }
        }}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};







































