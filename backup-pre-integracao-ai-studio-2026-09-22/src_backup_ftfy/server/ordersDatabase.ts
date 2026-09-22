import fs from 'fs';
import path from 'path';
import { INITIAL_ORDERS } from '../data/initialData';
import { Order } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders_db.json');
const WEBHOOK_LOGS_FILE = path.join(DATA_DIR, 'asaas_webhook_logs.json');

// Ensure directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Lê os pedidos persistidos no arquivo de banco de dados JSON.
 * Se o arquivo ainda não existir, inicializa limpo para produção oficial.
 */
export function getStoredOrders(): Order[] {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) {
    try {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    } catch (e) {
      console.error('[Database] Erro ao criar arquivo inicial de pedidos:', e);
      return [];
    }
  }

  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[Database] Erro ao ler orders_db.json:', e);
    return [];
  }
}

/**
 * Zera e limpa completamente os pedidos armazenados (Go-Live / Modo Oficial).
 */
export function clearStoredOrders(): number {
  ensureDataDir();
  let count = 0;
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      count = Array.isArray(parsed) ? parsed.length : 0;
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return count;
  } catch (e) {
    console.error('[Database] Erro ao zerar orders_db.json:', e);
    return count;
  }
}

/**
 * Salva a lista completa de pedidos no arquivo de banco de dados.
 */
export function saveStoredOrders(orders: Order[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Database] Erro ao persistir orders_db.json:', e);
  }
}

/**
 * Adiciona ou atualiza um pedido individualmente no banco de dados.
 */
export function upsertStoredOrder(order: Order): Order {
  const currentOrders = getStoredOrders();
  const index = currentOrders.findIndex((o) => o.id === order.id || (o.code && o.code === order.code));
  if (index >= 0) {
    currentOrders[index] = { ...currentOrders[index], ...order, updatedAt: new Date().toISOString() };
  } else {
    currentOrders.unshift({ ...order, updatedAt: new Date().toISOString() });
  }
  saveStoredOrders(currentOrders);
  return index >= 0 ? currentOrders[index] : currentOrders[0];
}

export interface AsaasWebhookLogItem {
  id: string;
  timestamp: string;
  event: string;
  paymentId?: string;
  externalReference?: string;
  orderMatchedId?: string;
  orderCode?: string;
  previousStatus?: string;
  newStatus?: string;
  previousPaymentStatus?: string;
  newPaymentStatus?: string;
  rawPayload: any;
  success: boolean;
  message: string;
}

/**
 * Lê os logs históricos de webhooks recebidos do Asaas.
 */
export function getWebhookLogs(): AsaasWebhookLogItem[] {
  ensureDataDir();
  if (!fs.existsSync(WEBHOOK_LOGS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(WEBHOOK_LOGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Registra um evento de webhook recebido do Asaas.
 */
export function logWebhookEvent(logItem: AsaasWebhookLogItem): void {
  ensureDataDir();
  try {
    const logs = getWebhookLogs();
    logs.unshift(logItem);
    // Manter no máximo 100 eventos recentes
    const trimmed = logs.slice(0, 100);
    fs.writeFileSync(WEBHOOK_LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Database] Erro ao gravar log de webhook Asaas:', e);
  }
}

/**
 * Zera e limpa completamente os logs de webhook do Asaas (Go-Live / Purga de Testes).
 */
export function clearWebhookLogs(): number {
  ensureDataDir();
  let count = 0;
  try {
    if (fs.existsSync(WEBHOOK_LOGS_FILE)) {
      const raw = fs.readFileSync(WEBHOOK_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      count = Array.isArray(parsed) ? parsed.length : 0;
    }
    fs.writeFileSync(WEBHOOK_LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return count;
  } catch (e) {
    console.error('[Database] Erro ao zerar asaas_webhook_logs.json:', e);
    return count;
  }
}

/**
 * Executa a purga total de testes e inicialização de produção no armazenamento de dados.
 */
export function purgeProductionDatabase(): {
  clearedOrders: number;
  clearedLogs: number;
  timestamp: string;
  status: string;
} {
  const clearedOrders = clearStoredOrders();
  const clearedLogs = clearWebhookLogs();
  const timestamp = new Date().toISOString();

  return {
    clearedOrders,
    clearedLogs,
    timestamp,
    status: 'PRODUCTION_INITIALIZED'
  };
}

export interface ProcessWebhookResult {
  success: boolean;
  message: string;
  event: string;
  matchedOrder: Order | null;
  previousStatus?: string;
  newStatus?: string;
  previousPaymentStatus?: string;
  newPaymentStatus?: string;
  paymentId?: string;
  externalReference?: string;
}

/**
 * Processa um payload de webhook oficial do Asaas e atualiza o pedido no banco de dados.
 * Suporta eventos de confirmação (PAYMENT_CONFIRMED, PAYMENT_RECEIVED)
 * e eventos de expiração / cancelamento (PAYMENT_OVERDUE, PAYMENT_EXPIRED, PAYMENT_DELETED, PAYMENT_REFUNDED).
 */
export function processAsaasWebhookPayload(payload: any): ProcessWebhookResult {
  const event = (payload?.event || payload?.action || 'UNKNOWN_EVENT').toString().toUpperCase();
  const payment = payload?.payment || payload?.data || payload;
  const paymentId = payment?.id || payload?.id || null;
  const externalReference = payment?.externalReference || payload?.externalReference || null;
  const description = (payment?.description || payload?.description || '').toString();

  const orders = getStoredOrders();

  // 1. Tentar encontrar o pedido correspondente por paymentId, externalReference, code ou orderNumber
  let matchedOrderIndex = orders.findIndex((o) => {
    if (paymentId && o.asaasPaymentId && o.asaasPaymentId === paymentId) return true;
    if (externalReference && (o.id === externalReference || o.code === externalReference || o.orderNumber === externalReference)) return true;
    if (o.code && description.includes(o.code)) return true;
    if (o.orderNumber && description.includes(o.orderNumber)) return true;
    return false;
  });

  // Se não encontrar por chave exata mas temos pedidos pendentes de PIX, associar ao mais recente aguardando
  if (matchedOrderIndex === -1 && paymentId && orders.length > 0) {
    const recentPendingPix = orders.findIndex((o) => o.paymentMethod === 'PIX' && o.paymentStatus === 'PENDENTE');
    if (recentPendingPix >= 0) {
      matchedOrderIndex = recentPendingPix;
    }
  }

  const nowIso = new Date().toISOString();

  if (matchedOrderIndex === -1) {
    const log: AsaasWebhookLogItem = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: nowIso,
      event,
      paymentId: paymentId || undefined,
      externalReference: externalReference || undefined,
      rawPayload: payload,
      success: false,
      message: `Nenhum pedido compatível encontrado no banco de dados para a referência: ${externalReference || paymentId || 'sem_id'}.`
    };
    logWebhookEvent(log);

    return {
      success: false,
      message: log.message,
      event,
      matchedOrder: null,
      paymentId: paymentId || undefined,
      externalReference: externalReference || undefined
    };
  }

  const targetOrder = orders[matchedOrderIndex];
  const previousStatus = targetOrder.status;
  const previousPaymentStatus = targetOrder.paymentStatus || 'PENDENTE';

  let newStatus = previousStatus;
  let newPaymentStatus = previousPaymentStatus;
  let statusUpdated = false;
  let logMessage = '';

  // Classificação dos Eventos do Asaas
  const isConfirmed = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_SPLIT_DONE';
  const isExpired = event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_EXPIRED' || event === 'PAYMENT_DELETED';
  const isRefunded = event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_CHARGEBACK_REQUESTED';

  if (isConfirmed) {
    newStatus = 'Confirmado';
    newPaymentStatus = 'PAGO';
    targetOrder.status = 'Confirmado';
    targetOrder.paymentStatus = 'PAGO';
    targetOrder.stockConfirmationStatus = 'STOCK_CONFIRMED';
    targetOrder.commissionPaidToPlatform = true;
    targetOrder.commissionConfirmedByMaster = true;
    targetOrder.buyerDataUnlocked = true;
    if (paymentId && !targetOrder.asaasPaymentId) {
      targetOrder.asaasPaymentId = paymentId;
    }
    if (!targetOrder.pickupCode && targetOrder.modality === 'RETIRADA') {
      targetOrder.pickupCode = `RET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    targetOrder.internalNotes = `[Asaas Webhook] Pagamento confirmado com sucesso via ${event} em ${nowIso}.`;
    targetOrder.updatedAt = nowIso;
    statusUpdated = true;
    logMessage = `Pedido ${targetOrder.code || targetOrder.id} atualizado para CONFIRMADO / PAGO via Asaas Webhook (${event}).`;
  } else if (isExpired) {
    newStatus = 'Cancelado';
    newPaymentStatus = 'EXPIRADO';
    targetOrder.status = 'Cancelado';
    targetOrder.paymentStatus = 'EXPIRADO';
    targetOrder.stockConfirmationStatus = 'EXPIRED';
    targetOrder.cancellationReason = 'Cobrança expirada no gateway Asaas por ausência de pagamento dentro do prazo de validade do Pix.';
    targetOrder.internalNotes = `[Asaas Webhook] Pagamento expirado/cancelado via evento ${event} em ${nowIso}.`;
    targetOrder.updatedAt = nowIso;
    statusUpdated = true;
    logMessage = `Pedido ${targetOrder.code || targetOrder.id} atualizado para CANCELADO / EXPIRADO via Asaas Webhook (${event}).`;
  } else if (isRefunded) {
    newStatus = 'Cancelado';
    newPaymentStatus = 'CANCELADO';
    targetOrder.status = 'Cancelado';
    targetOrder.paymentStatus = 'CANCELADO';
    targetOrder.cancellationReason = 'Pagamento estornado/devolvido no gateway Asaas.';
    targetOrder.internalNotes = `[Asaas Webhook] Pagamento estornado via evento ${event} em ${nowIso}.`;
    targetOrder.updatedAt = nowIso;
    statusUpdated = true;
    logMessage = `Pedido ${targetOrder.code || targetOrder.id} estornado e cancelado via Asaas Webhook (${event}).`;
  } else {
    logMessage = `Evento informativo do Asaas (${event}) registrado para o pedido ${targetOrder.code || targetOrder.id}. Nenhuma alteração de status necessária.`;
  }

  // Persistir alterações se houve modificação
  if (statusUpdated) {
    orders[matchedOrderIndex] = { ...targetOrder };
    saveStoredOrders(orders);
  }

  // Gravar no log de auditoria de webhooks
  const log: AsaasWebhookLogItem = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: nowIso,
    event,
    paymentId: paymentId || undefined,
    externalReference: externalReference || undefined,
    orderMatchedId: targetOrder.id,
    orderCode: targetOrder.code || targetOrder.orderNumber,
    previousStatus,
    newStatus,
    previousPaymentStatus,
    newPaymentStatus,
    rawPayload: payload,
    success: true,
    message: logMessage
  };
  logWebhookEvent(log);

  return {
    success: true,
    message: logMessage,
    event,
    matchedOrder: targetOrder,
    previousStatus,
    newStatus,
    previousPaymentStatus,
    newPaymentStatus,
    paymentId: paymentId || undefined,
    externalReference: externalReference || undefined
  };
}
