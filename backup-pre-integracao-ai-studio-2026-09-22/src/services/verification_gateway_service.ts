/**
 * verification_gateway_service.ts
 * 
 * Serviço de Integração de Gateway para Verificação de Número via SMS / WhatsApp.
 * Utiliza as credenciais definidas em .env.example (VITE_WHATSAPP_API_ENDPOINT,
 * VITE_WHATSAPP_API_TOKEN, VITE_SMS_API_ENDPOINT, VITE_SMS_API_TOKEN) para
 * validar a veracidade e autenticidade do cliente no fluxo de checkout.
 * 
 * Cidade foco: Cachoeiras de Macacu, RJ
 */

import { NotificationChannel, NotificationLog } from '../types';
import { logNotification, sendWhatsAppNotification } from './notification_service';

export interface VerificationGatewayConfig {
  whatsappEndpoint?: string;
  whatsappToken?: string;
  smsEndpoint?: string;
  smsToken?: string;
  defaultChannel: NotificationChannel;
  provider: string;
}

export interface SendVerificationResult {
  success: boolean;
  code: string;
  channelUsed: NotificationChannel;
  gatewayConfigured: boolean;
  providerName: string;
  simulated: boolean;
  messageId?: string;
  deepLink?: string;
  error?: string;
  deliveredTo: string;
  timestamp: string;
}

/**
 * Obtém as credenciais de Gateway configuradas no ambiente (.env.example / import.meta.env)
 */
export function getGatewayConfig(): VerificationGatewayConfig {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
  const procEnv = typeof process !== 'undefined' ? process.env : {};

  const whatsappEndpoint = metaEnv.VITE_WHATSAPP_API_ENDPOINT || procEnv.VITE_WHATSAPP_API_ENDPOINT || '';
  const whatsappToken = metaEnv.VITE_WHATSAPP_API_TOKEN || procEnv.VITE_WHATSAPP_API_TOKEN || '';
  const smsEndpoint = metaEnv.VITE_SMS_API_ENDPOINT || procEnv.VITE_SMS_API_ENDPOINT || '';
  const smsToken = metaEnv.VITE_SMS_API_TOKEN || procEnv.VITE_SMS_API_TOKEN || '';
  
  const rawDefaultChannel = (metaEnv.VITE_PHONE_VERIFY_DEFAULT_CHANNEL || procEnv.VITE_PHONE_VERIFY_DEFAULT_CHANNEL || 'WHATSAPP').toUpperCase();
  const defaultChannel: NotificationChannel = rawDefaultChannel === 'SMS' ? 'SMS' : 'WHATSAPP';
  const provider = metaEnv.VITE_PHONE_VERIFY_GATEWAY_PROVIDER || procEnv.VITE_PHONE_VERIFY_GATEWAY_PROVIDER || 'z-api';

  return {
    whatsappEndpoint,
    whatsappToken,
    smsEndpoint,
    smsToken,
    defaultChannel,
    provider
  };
}

/**
 * Retorna o status de conexão dos gateways para exibição informativa na UI
 */
export function getVerificationGatewayStatus() {
  const config = getGatewayConfig();
  const hasWhatsApp = Boolean(config.whatsappEndpoint && !config.whatsappEndpoint.includes('YOUR_INSTANCE'));
  const hasSMS = Boolean(config.smsEndpoint && !config.smsEndpoint.includes('your-sms-api'));

  return {
    hasWhatsApp,
    hasSMS,
    isRealGatewayActive: hasWhatsApp || hasSMS,
    activeProvider: hasWhatsApp ? 'Z-API / WhatsApp Gateway' : hasSMS ? 'Zenvia / SMS Gateway' : 'Modo Demonstração / Sandbox',
    whatsappEndpointMasked: config.whatsappEndpoint ? config.whatsappEndpoint.replace(/token\/[^/]+/, 'token/***') : undefined,
    defaultChannel: config.defaultChannel
  };
}

/**
 * Formata e normaliza o telefone para o padrão brasileiro (55 + DDD + 9 dígitos)
 */
export function normalizePhoneNumber(phone: string): { clean: string; formatted55: string; ddd: string; display: string } {
  const clean = phone.replace(/\D/g, '');
  let formatted55 = clean;

  if (clean.length === 10 || clean.length === 11) {
    formatted55 = `55${clean}`;
  } else if (clean.length === 12 || clean.length === 13) {
    formatted55 = clean.startsWith('55') ? clean : `55${clean}`;
  } else if (!clean) {
    formatted55 = '5521999990000';
  }

  // DDD extraído
  const dddMatch = clean.match(/^(?:55)?(\d{2})/);
  const ddd = dddMatch ? dddMatch[1] : '21';

  // Display amigável: (21) 98765-4321
  let display = phone;
  const digitsOnly = clean.startsWith('55') && clean.length >= 12 ? clean.substring(2) : clean;
  if (digitsOnly.length === 11) {
    display = `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 7)}-${digitsOnly.substring(7)}`;
  } else if (digitsOnly.length === 10) {
    display = `(${digitsOnly.substring(0, 2)}) ${digitsOnly.substring(2, 6)}-${digitsOnly.substring(6)}`;
  }

  return { clean, formatted55, ddd, display };
}

/**
 * Gera um código numérico de 6 dígitos para verificação
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Dispara o envio do código de verificação via Gateway de SMS ou WhatsApp
 */
export async function sendVerificationCodeViaGateway(params: {
  phone: string;
  code: string;
  customerName?: string;
  channel?: NotificationChannel;
  productName?: string;
  orderNumber?: string;
}): Promise<SendVerificationResult> {
  const config = getGatewayConfig();
  const targetChannel: NotificationChannel = params.channel || config.defaultChannel || 'WHATSAPP';
  const name = params.customerName?.trim() || 'Cliente';
  const { formatted55, display } = normalizePhoneNumber(params.phone);
  const now = new Date().toISOString();

  // Template da mensagem de segurança
  const messageText = 
    `🔒 *Achei Aqui Macacu - Código de Verificação*\n\n` +
    `Olá, *${name}*!\n` +
    `Seu código de segurança para validar sua solicitação de compra no comércio de Cachoeiras de Macacu é:\n\n` +
    `👉 *${params.code}*\n\n` +
    `⏱️ *Válido por 10 minutos.* Não compartilhe este código com ninguém.\n\n` +
    `_Apoiando o comércio local de Cachoeiras de Macacu, RJ._`;

  const smsText = `Achei Aqui Macacu: Seu codigo de verificacao e ${params.code}. Valido por 10 min.`;

  // 1. Envio via Gateway WHATSAPP
  if (targetChannel === 'WHATSAPP') {
    const isConfigured = Boolean(config.whatsappEndpoint && !config.whatsappEndpoint.includes('YOUR_INSTANCE'));

    if (isConfigured && config.whatsappEndpoint) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (config.whatsappToken) {
          headers['Authorization'] = `Bearer ${config.whatsappToken}`;
          headers['Client-Token'] = config.whatsappToken;
          headers['x-api-key'] = config.whatsappToken;
        }

        const payload = {
          phone: formatted55,
          to: formatted55,
          number: formatted55,
          message: messageText,
          text: messageText,
          code: params.code,
          recipientName: name,
          eventType: 'PHONE_VERIFICATION_CODE'
        };

        const response = await fetch(config.whatsappEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${errBody || 'Falha no Gateway WhatsApp'}`);
        }

        const data = await response.json().catch(() => ({ status: 'success' }));

        // Log de Auditoria
        await logNotification({
          event_type: 'PHONE_VERIFICATION_CODE',
          recipient_name: name,
          recipient_phone: display,
          channel: 'WHATSAPP',
          status: 'DELIVERED',
          title: 'Código de Verificação WhatsApp',
          message: `Código ${params.code} enviado via Gateway WhatsApp (${config.provider})`,
          metadata: { code: params.code, gatewayResponse: data }
        });

        return {
          success: true,
          code: params.code,
          channelUsed: 'WHATSAPP',
          gatewayConfigured: true,
          providerName: config.provider || 'Z-API / WhatsApp Gateway',
          simulated: false,
          deliveredTo: display,
          timestamp: now
        };
      } catch (err: any) {
        console.warn('[VerificationGateway] Falha ao enviar via Gateway WhatsApp, ativando fallback simulado:', err);

        await logNotification({
          event_type: 'PHONE_VERIFICATION_CODE',
          recipient_name: name,
          recipient_phone: display,
          channel: 'WHATSAPP',
          status: 'FAILED',
          title: 'Falha no Gateway WhatsApp',
          message: `Erro ao contatar gateway: ${err.message}`,
          error_message: err.message
        });

        const deepLink = `https://wa.me/${formatted55}?text=${encodeURIComponent(messageText)}`;

        return {
          success: true, // fallback gracefully for user testing
          code: params.code,
          channelUsed: 'WHATSAPP',
          gatewayConfigured: false,
          providerName: 'Sandbox / Fallback Seguro',
          simulated: true,
          deepLink,
          deliveredTo: display,
          timestamp: now,
          error: err.message
        };
      }
    } else {
      // Gateway em Sandbox / Demonstração
      const deepLink = `https://wa.me/${formatted55}?text=${encodeURIComponent(messageText)}`;

      await logNotification({
        event_type: 'PHONE_VERIFICATION_CODE',
        recipient_name: name,
        recipient_phone: display,
        channel: 'WHATSAPP',
        status: 'DELIVERED',
        title: 'Código de Verificação (Modo Sandbox)',
        message: `Código ${params.code} gerado no sandbox para ${display}`,
        metadata: { code: params.code, simulated: true }
      });

      return {
        success: true,
        code: params.code,
        channelUsed: 'WHATSAPP',
        gatewayConfigured: false,
        providerName: 'Sandbox Achei Aqui (Demonstração)',
        simulated: true,
        deepLink,
        deliveredTo: display,
        timestamp: now
      };
    }
  }

  // 2. Envio via Gateway SMS
  if (targetChannel === 'SMS') {
    const isSmsConfigured = Boolean(config.smsEndpoint && !config.smsEndpoint.includes('your-sms-api'));

    if (isSmsConfigured && config.smsEndpoint) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };

        if (config.smsToken) {
          headers['Authorization'] = `Bearer ${config.smsToken}`;
          headers['X-API-TOKEN'] = config.smsToken;
        }

        // Suporte a formato Zenvia / Twilio / REST genérico
        const payload = {
          from: 'AcheiAqui',
          to: formatted55,
          phone: formatted55,
          message: smsText,
          text: smsText,
          contents: [{ type: 'text', text: smsText }],
          code: params.code
        };

        const response = await fetch(config.smsEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => '');
          throw new Error(`HTTP ${response.status}: ${errBody || 'Falha no Gateway SMS'}`);
        }

        const data = await response.json().catch(() => ({ status: 'success' }));

        await logNotification({
          event_type: 'PHONE_VERIFICATION_CODE',
          recipient_name: name,
          recipient_phone: display,
          channel: 'SMS',
          status: 'DELIVERED',
          title: 'Código de Verificação SMS',
          message: `Código ${params.code} enviado via Gateway SMS`,
          metadata: { code: params.code, gatewayResponse: data }
        });

        return {
          success: true,
          code: params.code,
          channelUsed: 'SMS',
          gatewayConfigured: true,
          providerName: 'Gateway SMS Integrado',
          simulated: false,
          deliveredTo: display,
          timestamp: now
        };
      } catch (err: any) {
        console.warn('[VerificationGateway] Falha no Gateway SMS, ativando fallback sandbox:', err);

        await logNotification({
          event_type: 'PHONE_VERIFICATION_CODE',
          recipient_name: name,
          recipient_phone: display,
          channel: 'SMS',
          status: 'FAILED',
          title: 'Falha no Gateway SMS',
          message: `Erro ao enviar SMS: ${err.message}`,
          error_message: err.message
        });

        return {
          success: true,
          code: params.code,
          channelUsed: 'SMS',
          gatewayConfigured: false,
          providerName: 'Sandbox SMS (Demonstração)',
          simulated: true,
          deliveredTo: display,
          timestamp: now,
          error: err.message
        };
      }
    } else {
      // Sandbox SMS
      await logNotification({
        event_type: 'PHONE_VERIFICATION_CODE',
        recipient_name: name,
        recipient_phone: display,
        channel: 'SMS',
        status: 'DELIVERED',
        title: 'Código de Verificação SMS (Modo Sandbox)',
        message: `Código ${params.code} enviado via SMS simulado para ${display}`,
        metadata: { code: params.code, simulated: true }
      });

      return {
        success: true,
        code: params.code,
        channelUsed: 'SMS',
        gatewayConfigured: false,
        providerName: 'Sandbox SMS (Demonstração)',
        simulated: true,
        deliveredTo: display,
        timestamp: now
      };
    }
  }

  // Fallback genérico
  return {
    success: true,
    code: params.code,
    channelUsed: 'WHATSAPP',
    gatewayConfigured: false,
    providerName: 'Achei Aqui Security Engine',
    simulated: true,
    deliveredTo: display,
    timestamp: now
  };
}
