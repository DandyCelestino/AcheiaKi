/**
 * notification_service.ts
 * 
 * Serviço centralizado para disparo e gerenciamento de mensagens transacionais
 * (WhatsApp, SMS, E-mail, Push Notifications) com integração e persistência
 * no banco de dados Supabase (tabela: notification_deliveries) e suporte a logs
 * locais para resiliência total.
 * 
 * Cidade foco: Cachoeiras de Macacu, RJ
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Order,
  User,
  NotificationLog,
  NotificationChannel,
  NotificationStatus,
  NotificationEventType,
  InAppNotification,
  NotificationAudience,
  NotificationCategory,
  NotificationPriority
} from '../types';

// Storage local fallback keys
const LOCAL_NOTIFICATIONS_KEY = 'acheiaqui_notifications_log';
export const LOCAL_INAPP_NOTIFICATIONS_KEY = 'acheiaqui_inapp_notifications';

/**
 * Configuração dos canais de notificação
 * In-App / Internet direta: ATIVO
 * WhatsApp & SMS: EM STANDBY (código e links preservados para ativação futura)
 */
export const NOTIFICATION_CHANNELS_STATUS = {
  inApp: { active: true, label: 'Notificações In-App (Internet do App)', mode: 'LIVE' },
  whatsapp: { active: false, standby: true, label: 'WhatsApp API / Mensagens Telefônicas', mode: 'STANDBY' },
  sms: { active: false, standby: true, label: 'SMS Gateway Telefônico', mode: 'STANDBY' },
  email: { active: true, standby: false, label: 'E-mail Transacional', mode: 'LIVE' }
};

/**
 * Obtém a instância do cliente Supabase configurado
 */
export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

/**
 * Salva localmente a notificação In-App no storage
 */
export function saveInAppNotificationLocally(notification: InAppNotification): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_INAPP_NOTIFICATIONS_KEY);
    const list: InAppNotification[] = raw ? JSON.parse(raw) : [];
    // Adiciona no início se não existir
    const existingIndex = list.findIndex((n) => n.id === notification.id);
    if (existingIndex >= 0) {
      list[existingIndex] = notification;
    } else {
      list.unshift(notification);
    }
    // Manter até 300 notificações
    if (list.length > 300) {
      list.splice(300);
    }
    localStorage.setItem(LOCAL_INAPP_NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('[NotificationService] Erro ao persistir in-app notification:', err);
  }
}

/**
 * Salva localmente a notificação para histórico rápido e resiliência offline
 */
function saveNotificationLocally(log: NotificationLog): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    const logs: NotificationLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(log);
    // Manter no máximo 200 logs locais
    if (logs.length > 200) {
      logs.splice(200);
    }
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('[NotificationService] Erro ao persistir log localmente:', err);
  }
}

export interface SendWhatsAppParams {
  phone?: string;
  to?: string;
  message?: string;
  text?: string;
  recipientName?: string;
  eventType?: string;
  orderCode?: string;
}

export interface LogNotificationParams {
  id?: string;
  event_type?: string;
  eventType?: string;
  recipient_name?: string;
  recipientName?: string;
  recipient_phone?: string;
  recipientPhone?: string;
  recipient_email?: string;
  recipientEmail?: string;
  recipient_user_id?: string;
  recipientUserId?: string;
  recipient_merchant_id?: string;
  recipientMerchantId?: string;
  audience?: NotificationAudience;
  channel?: NotificationChannel | string;
  status?: NotificationStatus | string;
  title?: string;
  message?: string;
  order_id?: string;
  orderId?: string;
  order_code?: string;
  orderCode?: string;
  merchant_id?: string;
  merchantId?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  createdAt?: string;
  delivered_at?: string;
  deliveredAt?: string;
  error_message?: string;
  errorMessage?: string;
  read_by?: string[];
  readBy?: string[];
}

/**
 * Envia uma mensagem de notificação WhatsApp (EM STANDBY).
 * Código e lógica mantidos para ativação futura sem perdas.
 */
export async function sendWhatsAppNotification(
  phoneOrParams: string | SendWhatsAppParams,
  optionalMessage?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  let targetPhone = '';
  let targetMessage = '';
  let recipientName = 'Cliente';
  let eventType = 'TRANSACTIONAL';
  let orderCode: string | undefined;

  if (typeof phoneOrParams === 'string') {
    targetPhone = phoneOrParams;
    targetMessage = optionalMessage || '';
  } else {
    targetPhone = phoneOrParams.phone || phoneOrParams.to || '';
    targetMessage = phoneOrParams.message || phoneOrParams.text || optionalMessage || '';
    recipientName = phoneOrParams.recipientName || 'Cliente';
    eventType = phoneOrParams.eventType || 'TRANSACTIONAL';
    orderCode = phoneOrParams.orderCode;
  }

  const cleanPhone = targetPhone.replace(/\D/g, '');

  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const procEnv = typeof process !== 'undefined' ? process.env : undefined;

  const endpoint = metaEnv?.VITE_WHATSAPP_API_ENDPOINT || procEnv?.VITE_WHATSAPP_API_ENDPOINT;
  const token = metaEnv?.VITE_WHATSAPP_API_TOKEN || procEnv?.VITE_WHATSAPP_API_TOKEN;

  if (!endpoint) {
    return {
      success: true,
      data: {
        standby: true,
        phone: cleanPhone,
        message: targetMessage,
        deepLink: NotificationService.generateWhatsAppDeepLink(cleanPhone, targetMessage)
      }
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Client-Token'] = token;
      headers['x-api-key'] = token;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: cleanPhone,
        to: cleanPhone,
        message: targetMessage,
        text: targetMessage,
        recipientName,
        eventType,
        orderCode
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido na resposta');
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const result = await response.json().catch(() => ({ status: 'ok' }));
    return { success: true, data: result };
  } catch (err: any) {
    console.error('[NotificationService - WhatsApp Standby] Erro:', err);
    return {
      success: false,
      error: err?.message || 'Falha na conexão com a API de WhatsApp'
    };
  }
}

/**
 * Insere um novo registro de auditoria na tabela `notification_deliveries` no Supabase.
 */
export async function logNotification(
  data: LogNotificationParams | NotificationLog
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const d = data as Record<string, any>;
  const now = new Date().toISOString();
  const id = d.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const eventType = (d.event_type || d.eventType || 'TRANSACTIONAL') as NotificationEventType;
  const recipientName = d.recipient_name || d.recipientName || 'Usuário';
  const recipientPhone = d.recipient_phone || d.recipientPhone || '';
  const recipientEmail = d.recipient_email || d.recipientEmail;
  const recipientUserId = d.recipient_user_id || d.recipientUserId;
  const recipientMerchantId = d.recipient_merchant_id || d.recipientMerchantId;
  const audience = (d.audience || 'ALL') as NotificationAudience;
  const channel = (d.channel || 'IN_APP') as NotificationChannel;
  const status = (d.status || 'DELIVERED') as NotificationStatus;
  const title = d.title || 'Notificação Achei Aqui';
  const message = d.message || '';
  const orderId = d.order_id || d.orderId;
  const orderCode = d.order_code || d.orderCode;
  const merchantId = d.merchant_id || d.merchantId;
  const metadata = d.metadata || {};
  const createdAt = d.created_at || d.createdAt || now;
  const deliveredAt = d.delivered_at || d.deliveredAt || (status === 'DELIVERED' ? now : undefined);
  const errorMessage = d.error_message || d.errorMessage;
  const readBy = d.read_by || d.readBy || [];

  const normalizedLog: NotificationLog = {
    id,
    eventType,
    recipientName,
    recipientPhone,
    recipientEmail,
    recipientUserId,
    recipientMerchantId,
    audience,
    channel,
    status,
    title,
    message,
    orderId,
    orderCode,
    merchantId,
    metadata,
    createdAt,
    deliveredAt,
    errorMessage,
    readBy
  };

  // Salvar no storage local para histórico imediato no painel
  saveNotificationLocally(normalizedLog);

  // Inserir no Supabase se disponível
  try {
    const payload = {
      id,
      event_type: eventType,
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      recipient_email: recipientEmail,
      channel,
      status,
      title,
      message,
      order_id: orderId,
      order_code: orderCode,
      merchant_id: merchantId,
      metadata,
      created_at: createdAt,
      delivered_at: deliveredAt,
      error_message: errorMessage
    };

    const { data: insertResult, error } = await supabase
      .from('notification_deliveries')
      .insert([payload])
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: insertResult };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro de conexão com o banco' };
  }
}

/**
 * Registra o log no banco de dados Supabase (tabela: `notification_deliveries`)
 */
async function persistToSupabase(log: NotificationLog): Promise<boolean> {
  const result = await logNotification(log);
  return result.success;
}

/**
 * Serviço de Notificações Transacionais e In-App
 */
export class NotificationService {
  /**
   * Dispara um envio genérico e registra a notificação In-App
   */
  static async sendNotification(params: {
    eventType?: NotificationEventType;
    recipientName: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientUserId?: string;
    recipientMerchantId?: string;
    audience?: NotificationAudience;
    category?: NotificationCategory;
    priority?: NotificationPriority;
    senderName?: string;
    senderRole?: 'MASTER' | 'SISTEMA' | 'LOJISTA' | 'CLIENTE';
    actionUrl?: string;
    actionLabel?: string;
    channel?: NotificationChannel;
    title: string;
    message: string;
    orderId?: string;
    orderCode?: string;
    merchantId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<InAppNotification> {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const activeChannel = params.channel || 'IN_APP';
    const audience = params.audience || (params.recipientUserId ? 'SPECIFIC_USER' : params.recipientMerchantId ? 'SPECIFIC_MERCHANT' : 'ALL');
    const category = params.category || (params.orderCode ? 'PEDIDO' : 'COMUNICADO');
    const priority = params.priority || 'NORMAL';

    // Cria o objeto de notificação In-App
    const inAppItem: InAppNotification = {
      id: notifId,
      title: params.title,
      message: params.message,
      category,
      audience,
      recipientUserId: params.recipientUserId,
      recipientMerchantId: params.recipientMerchantId,
      recipientName: params.recipientName,
      recipientPhone: params.recipientPhone,
      senderName: params.senderName || 'Administração Achei Aqui',
      senderRole: params.senderRole || 'SISTEMA',
      priority,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      readBy: [],
      deliveredAt: now,
      createdAt: now,
      orderCode: params.orderCode,
      orderId: params.orderId,
      metadata: params.metadata
    };

    // Salvar no storage In-App
    saveInAppNotificationLocally(inAppItem);

    // Salva o log de auditoria
    const log: NotificationLog = {
      id: notifId,
      eventType: params.eventType,
      recipientName: params.recipientName,
      recipientPhone: params.recipientPhone || '',
      recipientEmail: params.recipientEmail,
      recipientUserId: params.recipientUserId,
      recipientMerchantId: params.recipientMerchantId,
      audience,
      channel: activeChannel,
      status: 'DELIVERED',
      title: params.title,
      message: params.message,
      orderId: params.orderId,
      orderCode: params.orderCode,
      merchantId: params.merchantId,
      metadata: params.metadata,
      createdAt: now,
      deliveredAt: now,
      readBy: []
    };

    await persistToSupabase(log);

    // Se WhatsApp foi explicitamente solicitado e não em standby absoluto
    if (params.channel === 'WHATSAPP' && params.recipientPhone) {
      sendWhatsAppNotification({
        phone: params.recipientPhone,
        message: params.message,
        recipientName: params.recipientName,
        eventType: params.eventType,
        orderCode: params.orderCode
      }).catch((e) => console.warn('[WhatsApp Standby Handler]', e));
    }

    return inAppItem;
  }

  /**
   * Notifica eventos de Pedidos (Criação, Atualização de Status, Retirada no Balcão, Entrega)
   */
  static async notifyOrderEvent(
    order: Order,
    eventType: NotificationEventType,
    options?: { customNote?: string; channel?: NotificationChannel }
  ): Promise<InAppNotification> {
    let title = '';
    let message = '';
    let category: NotificationCategory = 'PEDIDO';
    let priority: NotificationPriority = 'HIGH';

    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(order.totalAmount);

    switch (eventType) {
      case 'ORDER_PLACED':
        title = `Pedido Confirmado #${order.code}`;
        message =
          `Olá, ${order.customerName}! 🎉\n\n` +
          `Seu pedido #${order.code} na loja ${order.merchantName} foi registrado com sucesso!\n\n` +
          `📋 Resumo do Pedido:\n` +
          order.items.map((it) => `• ${it.quantity}x ${it.productName}`).join('\n') +
          `\n\n💰 Total: ${formattedTotal}\n` +
          `🚚 Modalidade: ${order.modality}\n` +
          (order.pickupCode
            ? `🔑 Código de Retirada: ${order.pickupCode} (apresente no balcão da loja)\n`
            : '') +
          `\nAcompanhe seu pedido pelo marketplace Achei Aqui!`;
        break;

      case 'ORDER_CONFIRMED':
        title = `Pedido Aceito pelo Lojista #${order.code}`;
        message =
          `Ótima notícia, ${order.customerName}! 🛍️\n\n` +
          `A loja ${order.merchantName} confirmou o estoque do seu pedido #${order.code} e iniciará o atendimento em instantes.`;
        break;

      case 'ORDER_PREPARING':
        title = `Pedido em Preparo #${order.code}`;
        message =
          `Seu pedido #${order.code} já está sendo preparado com todo carinho pela equipe de ${order.merchantName}! 👩‍🍳`;
        break;

      case 'ORDER_DISPATCHED':
        title = `Pedido em Rota de Entrega #${order.code}`;
        message =
          `🛵 Saiu para Entrega!\n\n` +
          `Seu pedido #${order.code} da loja ${order.merchantName} está a caminho do seu endereço: ${order.customerAddress || 'Cachoeiras de Macacu'}.\n\n` +
          `Fique atento ao entregador!`;
        break;

      case 'ORDER_READY_PICKUP':
        title = `Pronto para Retirada no Balcão #${order.code}`;
        message =
          `🏪 Seu Pedido Está Pronto!\n\n` +
          `Olá, ${order.customerName}! O pedido #${order.code} está disponível para retirada na loja ${order.merchantName}.\n\n` +
          `🔑 Código de Segurança: ${order.pickupCode || order.code}\n\n` +
          `Apresente este código ao atendente no balcão da loja para retirar seus produtos.`;
        break;

      case 'ORDER_COMPLETED':
        title = `Pedido Concluído #${order.code}`;
        message =
          `✅ Pedido Concluído com Sucesso!\n\n` +
          `Muito obrigado por comprar com a ${order.merchantName} através do Achei Aqui.\n` +
          `Apoiar o comércio local de Cachoeiras de Macacu fortalece nossa cidade!`;
        break;

      case 'ORDER_CANCELLED':
        title = `Pedido Cancelado / Sem Estoque #${order.code}`;
        message =
          `⚠️ Aviso de Cancelamento\n\n` +
          `Informamos que o pedido #${order.code} foi cancelado.\n` +
          (options?.customNote ? `Motivo: ${options.customNote}\n\n` : '\n') +
          `Para dúvidas, entre em contato diretamente com a loja ${order.merchantName}.`;
        priority = 'URGENT';
        break;

      default:
        title = `Atualização do Pedido #${order.code}`;
        message = `Seu pedido #${order.code} foi atualizado para: ${order.status}.`;
        break;
    }

    // 1. Notificar Cliente (In-App particular endereçado exclusivamente ao cliente)
    const clientNotif = await this.sendNotification({
      eventType,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      recipientUserId: order.userId,
      audience: 'SPECIFIC_USER',
      category,
      priority,
      senderName: order.merchantName,
      senderRole: 'LOJISTA',
      actionUrl: 'account',
      actionLabel: 'Ver Meus Pedidos',
      channel: 'IN_APP',
      title,
      message,
      orderId: order.id,
      orderCode: order.code,
      merchantId: order.merchantId,
      metadata: {
        totalAmount: order.totalAmount,
        modality: order.modality,
        status: order.status
      }
    });

    // 2. Se for criação de pedido (ORDER_PLACED), notificar também o Lojista
    if (eventType === 'ORDER_PLACED') {
      await this.sendNotification({
        eventType: 'ORDER_PLACED',
        recipientName: order.merchantName,
        recipientMerchantId: order.merchantId,
        audience: 'SPECIFIC_MERCHANT',
        category: 'PEDIDO',
        priority: 'URGENT',
        senderName: 'Sistema Achei Aqui',
        senderRole: 'SISTEMA',
        actionUrl: 'orders',
        actionLabel: 'Gerenciar Pedido',
        channel: 'IN_APP',
        title: `Novo Pedido Recebido #${order.code}`,
        message:
          `Olá, ${order.merchantName}! 🔔\n\n` +
          `Você recebeu um novo pedido de ${order.customerName} (${order.modality}).\n` +
          `Valor: ${formattedTotal}\n` +
          `Itens: ${order.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}\n\n` +
          `Responda a confirmação de estoque em até 15 minutos pelo seu painel.`,
        orderId: order.id,
        orderCode: order.code,
        merchantId: order.merchantId,
        metadata: { orderId: order.id, code: order.code }
      });
    }

    return clientNotif;
  }

  /**
   * Notifica eventos de Provador VIP / Experimentação em Domicílio
   */
  static async notifyTrialEvent(
    order: Order,
    eventType: 'TRIAL_REQUESTED' | 'TRIAL_CONFIRMED' | 'TRIAL_REMINDER'
  ): Promise<InAppNotification> {
    const trialDate = order.trialDetails?.date || 'Data a combinar';
    const trialTime = order.trialDetails?.time || 'Horário comercial';

    let title = '';
    let message = '';

    if (eventType === 'TRIAL_REQUESTED') {
      title = `Solicitação de Provador VIP #${order.code}`;
      message =
        `👗 Solicitação de Provador VIP Recebida!\n\n` +
        `Olá, ${order.customerName}! Seu pedido de experimentação em domicílio #${order.code} foi enviado para a loja ${order.merchantName}.\n\n` +
        `📅 Data solicitada: ${trialDate} às ${trialTime}\n` +
        `📍 Endereço: ${order.customerAddress || 'Cachoeiras de Macacu'}\n\n` +
        `A loja confirmará a disponibilidade no seu painel de notificações.`;
    } else if (eventType === 'TRIAL_CONFIRMED') {
      title = `Provador VIP Confirmado #${order.code}`;
      message =
        `✨ Provador VIP Confirmado!\n\n` +
        `A loja ${order.merchantName} aprovou a sua mala/peças para experimentação em casa!\n\n` +
        `📅 Agendamento: ${trialDate} às ${trialTime}\n` +
        `Experimente com calma no conforto da sua casa e pague apenas pelo que decidir levar.`;
    } else {
      title = `Lembrete de Coleta do Provador #${order.code}`;
      message =
        `⏰ Lembrete Achei Aqui\n\n` +
        `Lembramos que o recolhimento das peças do Provador VIP da ${order.merchantName} está previsto para breve.`;
    }

    const clientNotif = await this.sendNotification({
      eventType,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      recipientUserId: order.userId,
      audience: 'SPECIFIC_USER',
      category: 'PEDIDO',
      priority: 'HIGH',
      senderName: order.merchantName,
      senderRole: 'LOJISTA',
      actionUrl: 'account',
      actionLabel: 'Ver Provador VIP',
      channel: 'IN_APP',
      title,
      message,
      orderId: order.id,
      orderCode: order.code,
      merchantId: order.merchantId,
      metadata: order.trialDetails
    });

    if (eventType === 'TRIAL_REQUESTED') {
      await this.sendNotification({
        eventType: 'TRIAL_REQUESTED',
        recipientName: order.merchantName,
        recipientMerchantId: order.merchantId,
        audience: 'SPECIFIC_MERCHANT',
        category: 'PEDIDO',
        priority: 'HIGH',
        senderName: 'Sistema Achei Aqui',
        senderRole: 'SISTEMA',
        actionUrl: 'orders',
        actionLabel: 'Ver Solicitação',
        channel: 'IN_APP',
        title: `Nova Solicitação de Provador VIP #${order.code}`,
        message: `Olá, ${order.merchantName}! O cliente ${order.customerName} solicitou um Provador VIP para ${trialDate} às ${trialTime}.\nEndereço: ${order.customerAddress || 'Cachoeiras de Macacu'}.`,
        orderId: order.id,
        orderCode: order.code,
        merchantId: order.merchantId
      });
    }

    return clientNotif;
  }

  /**
   * Notifica eventos de Agendamento de Serviços (Barbearias, Estética, Assistência Técnica)
   */
  static async notifyServiceBookingEvent(
    order: Order,
    eventType: 'SERVICE_BOOKED' | 'SERVICE_CONFIRMED' | 'SERVICE_REMINDER'
  ): Promise<InAppNotification> {
    const serviceName = order.serviceDetails?.serviceTitle || 'Serviço';
    const profName = order.serviceDetails?.professional || 'Profissional da Loja';
    const date = order.serviceDetails?.scheduledDate || 'Data a confirmar';
    const time = order.serviceDetails?.scheduledTime || 'Horário a confirmar';

    let title = '';
    let message = '';

    if (eventType === 'SERVICE_BOOKED') {
      title = `Agendamento Solicitado #${order.code}`;
      message =
        `🗓️ Agendamento de Serviço Registrado!\n\n` +
        `Olá, ${order.customerName}!\n` +
        `Seu agendamento para ${serviceName} no estabelecimento ${order.merchantName} foi registrado.\n\n` +
        `👤 Profissional: ${profName}\n` +
        `📅 Data: ${date}\n` +
        `⏰ Horário: ${time}\n\n` +
        `Aguardamos você em Cachoeiras de Macacu!`;
    } else if (eventType === 'SERVICE_CONFIRMED') {
      title = `Agendamento Confirmado #${order.code}`;
      message =
        `✅ Agendamento Confirmado!\n\n` +
        `Seu horário para ${serviceName} com ${profName} está 100% confirmado para ${date} às ${time}.`;
    } else {
      title = `Lembrete do seu Horário #${order.code}`;
      message =
        `🔔 Lembrete de Horário Hoje!\n\n` +
        `Seu atendimento de ${serviceName} na ${order.merchantName} é hoje às ${time}.\n` +
        `Te esperamos!`;
    }

    const clientNotif = await this.sendNotification({
      eventType,
      recipientName: order.customerName,
      recipientPhone: order.customerPhone,
      recipientUserId: order.userId,
      audience: 'SPECIFIC_USER',
      category: 'PEDIDO',
      priority: 'HIGH',
      senderName: order.merchantName,
      senderRole: 'LOJISTA',
      actionUrl: 'account',
      actionLabel: 'Ver Agendamento',
      channel: 'IN_APP',
      title,
      message,
      orderId: order.id,
      orderCode: order.code,
      merchantId: order.merchantId,
      metadata: order.serviceDetails
    });

    if (eventType === 'SERVICE_BOOKED') {
      await this.sendNotification({
        eventType: 'SERVICE_BOOKED',
        recipientName: order.merchantName,
        recipientMerchantId: order.merchantId,
        audience: 'SPECIFIC_MERCHANT',
        category: 'PEDIDO',
        priority: 'HIGH',
        senderName: 'Sistema Achei Aqui',
        senderRole: 'SISTEMA',
        actionUrl: 'orders',
        actionLabel: 'Ver Agendamento',
        channel: 'IN_APP',
        title: `Novo Agendamento Recebido: ${serviceName}`,
        message: `Olá, ${order.merchantName}! O cliente ${order.customerName} agendou o serviço "${serviceName}" com ${profName} para ${date} às ${time}.`,
        orderId: order.id,
        orderCode: order.code,
        merchantId: order.merchantId
      });
    }

    return clientNotif;
  }

  /**
   * Notifica mensagens do Chat Interno entre Usuário e Lojista (ou vice-versa)
   * Garantindo 100% de privacidade individual: apenas os dois participantes recebem.
   */
  static async notifyChatMessage(params: {
    senderName: string;
    senderRole: 'CLIENTE' | 'VENDEDOR' | 'MASTER';
    recipientUserId?: string;
    recipientMerchantId?: string;
    recipientName: string;
    orderTitle?: string;
    codigoSubpedido?: string;
    subpedidoId: string;
    messageText: string;
    isDirectProductChat?: boolean;
  }): Promise<InAppNotification> {
    const isToMerchant = params.senderRole === 'CLIENTE';
    const title = isToMerchant
      ? `💬 Nova Mensagem de ${params.senderName}`
      : `💬 Resposta de ${params.senderName}`;

    const snippet = params.messageText.length > 90
      ? params.messageText.substring(0, 90) + '...'
      : params.messageText;

    const message = isToMerchant
      ? `Olá, ${params.recipientName}!\n\nVocê recebeu uma nova mensagem de ${params.senderName} sobre "${params.orderTitle || 'atendimento'}":\n"${snippet}"`
      : `Olá, ${params.recipientName}!\n\nA loja ${params.senderName} respondeu sua mensagem sobre "${params.orderTitle || 'atendimento'}":\n"${snippet}"`;

    return this.sendNotification({
      title,
      message,
      category: 'COMUNICADO',
      priority: 'HIGH',
      audience: isToMerchant ? 'SPECIFIC_MERCHANT' : 'SPECIFIC_USER',
      recipientUserId: params.recipientUserId,
      recipientMerchantId: params.recipientMerchantId,
      recipientName: params.recipientName,
      senderName: params.senderName,
      senderRole: params.senderRole === 'CLIENTE' ? 'CLIENTE' : 'LOJISTA',
      actionUrl: 'chat',
      actionLabel: 'Abrir Conversa',
      orderCode: params.codigoSubpedido,
      channel: 'IN_APP',
      metadata: {
        subpedidoId: params.subpedidoId,
        isDirectProductChat: params.isDirectProductChat
      }
    });
  }

  /**
   * Notifica eventos de Segurança & Autenticação (Redefinição de senha, Boas-vindas)
   */
  static async notifySecurityEvent(
    user: Partial<User>,
    eventType: 'SECURITY_ALERT' | 'PASSWORD_RESET' | 'WELCOME',
    payload?: { code?: string; details?: string }
  ): Promise<InAppNotification> {
    let title = '';
    let message = '';
    let category: NotificationCategory = 'SEGURANCA';

    if (eventType === 'PASSWORD_RESET') {
      title = 'Código de Recuperação de Senha';
      message =
        `🔐 Achei Aqui - Código de Segurança\n\n` +
        `Olá, ${user.name || 'Usuário'}!\n` +
        `Seu código de verificação para redefinir sua senha é: ${payload?.code || '123456'}\n\n` +
        `Este código expira em 15 minutos. Se você não solicitou, ignore esta mensagem.`;
    } else if (eventType === 'WELCOME') {
      title = 'Bem-vindo ao Achei Aqui!';
      category = 'SISTEMA';
      message =
        `👋 Olá, ${user.name}! Seja muito bem-vindo(a) ao Achei Aqui — o marketplace oficial do comércio de Cachoeiras de Macacu, RJ.\n\n` +
        `Explore lojas locais, faça pedidos com entrega rápida ou retirada no balcão e apoie nossa cidade!`;
    } else {
      title = 'Alerta de Segurança na Conta';
      message =
        `🛡️ Aviso de Segurança\n\n` +
        `Identificamos uma atividade recente na sua conta: ${payload?.details || 'Login efetuado com sucesso.'}`;
    }

    return this.sendNotification({
      eventType,
      recipientName: user.name || 'Usuário',
      recipientPhone: user.phone || '(21) 99999-0000',
      recipientEmail: user.email,
      recipientUserId: user.id,
      audience: user.id ? 'SPECIFIC_USER' : 'ALL',
      category,
      priority: 'HIGH',
      senderName: 'Administração Achei Aqui',
      senderRole: 'SISTEMA',
      actionUrl: 'account',
      actionLabel: 'Ver Perfil',
      channel: 'IN_APP',
      title,
      message,
      metadata: payload
    });
  }

  /**
   * Retorna o histórico de notificações filtrado
   */
  static getHistory(filter?: {
    orderId?: string;
    merchantId?: string;
    recipientPhone?: string;
    eventType?: NotificationEventType;
  }): NotificationLog[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      let logs: NotificationLog[] = raw ? JSON.parse(raw) : [];

      if (filter) {
        if (filter.orderId) {
          logs = logs.filter((l) => l.orderId === filter.orderId);
        }
        if (filter.merchantId) {
          logs = logs.filter((l) => l.merchantId === filter.merchantId);
        }
        if (filter.recipientPhone) {
          logs = logs.filter((l) => l.recipientPhone.includes(filter.recipientPhone!));
        }
        if (filter.eventType) {
          logs = logs.filter((l) => l.eventType === filter.eventType);
        }
      }

      return logs;
    } catch (err) {
      console.error('[NotificationService] Erro ao obter histórico:', err);
      return [];
    }
  }

  /**
   * Retorna a lista de notificações In-App armazenadas localmente
   */
  static getInAppNotifications(): InAppNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(LOCAL_INAPP_NOTIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('[NotificationService] Erro ao obter in-app notifications:', err);
      return [];
    }
  }

  /**
   * Gera link direto de WhatsApp com mensagem codificada para disparo manual em standby
   */
  static generateWhatsAppDeepLink(phone: string, text: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const standardPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${standardPhone}?text=${encodeURIComponent(text)}`;
  }
}

export default NotificationService;

