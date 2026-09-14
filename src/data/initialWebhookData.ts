import { BoletoWebhookEvent, WebhookConfig, WebhookGateway } from '../types';

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  endpointPath: '/api/webhooks/boleto',
  secretKey: 'whsec_acheiaqui_macacu_2026_prod_key',
  enabledGateways: ['ASAAS', 'MERCADO_PAGO', 'BANCO_INTER', 'IUGU', 'GERENCIANET_EFI', 'GENERIC'],
  autoReleaseCommission: true,
  autoActivateClient: true,
  autoApproveMerchant: true,
  requireSignatureValidation: false,
  notifySalesAgentInApp: true,
  simulateDelayMs: 320
};

export const INITIAL_WEBHOOK_EVENTS: BoletoWebhookEvent[] = [
  {
    id: 'wh-evt-001',
    gateway: 'ASAAS',
    eventType: 'PAYMENT_RECEIVED',
    boletoCode: 'BOL-2026-001',
    boletoRequestId: 'bol-req-101',
    agentId: 'agent-1',
    agentName: 'Carlos Eduardo Nogueira',
    clientName: 'Boutique Macacu Elegance Ltda',
    amountPaid: 59.90,
    commissionAmount: 11.98,
    commissionReleased: true,
    externalTransactionId: 'pay_asaas_8812739120',
    receivedAt: '2026-08-17T16:45:00Z',
    processedAt: '2026-08-17T16:45:01Z',
    durationMs: 142,
    status: 'SUCCESS',
    statusMessage: 'Boleto liquidado via compensação Asaas. Comissão de R$ 11,98 liberada para o consultor Carlos Eduardo Nogueira.',
    payload: {
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_asaas_8812739120',
        customer: 'cus_000109283',
        value: 59.90,
        netValue: 58.91,
        billingType: 'BOLETO',
        status: 'RECEIVED',
        description: 'Assinatura Achei Aqui - Plano Prata (BOL-2026-001)',
        externalReference: 'BOL-2026-001',
        confirmedDate: '2026-08-17',
        paymentDate: '2026-08-17',
        nossoNumero: '04819283'
      }
    },
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Asaas-Webhook/2.0',
      'asaas-access-token': '***masked***'
    },
    ipAddress: '54.232.110.45'
  },
  {
    id: 'wh-evt-002',
    gateway: 'MERCADO_PAGO',
    eventType: 'payment.updated',
    boletoCode: 'BOL-2026-002',
    boletoRequestId: 'bol-req-102',
    agentId: 'agent-2',
    agentName: 'Juliana Martins da Costa',
    clientName: 'Dr. Leonardo Vasques Consultório Odontológico',
    amountPaid: 199.90,
    commissionAmount: 35.98,
    commissionReleased: true,
    externalTransactionId: 'mp_pay_9981274615',
    receivedAt: '2026-08-22T11:00:00Z',
    processedAt: '2026-08-22T11:00:01Z',
    durationMs: 189,
    status: 'SUCCESS',
    statusMessage: 'Boleto liquidado via Mercado Pago. Comissão de R$ 35,98 liberada para a consultora Juliana Martins da Costa.',
    payload: {
      action: 'payment.updated',
      api_version: 'v1',
      data: {
        id: 'mp_pay_9981274615'
      },
      date_created: '2026-08-22T11:00:00.000Z',
      id: 9981274615,
      live_mode: true,
      type: 'payment',
      external_reference: 'BOL-2026-002',
      status: 'approved',
      transaction_amount: 199.90
    },
    headers: {
      'content-type': 'application/json',
      'x-signature': 'ts=1724324400,v1=9a8b7c6d5e4f3a2b1c0',
      'x-request-id': 'req_mp_8829103'
    },
    ipAddress: '18.231.15.82'
  },
  {
    id: 'wh-evt-003',
    gateway: 'BANCO_INTER',
    eventType: 'PING',
    receivedAt: '2026-09-01T08:00:00Z',
    processedAt: '2026-09-01T08:00:00Z',
    durationMs: 45,
    status: 'IGNORED',
    statusMessage: 'Ping de conectividade e validação de webhook do Banco Inter (Healthcheck verificado).',
    payload: {
      evento: 'TESTE_COMUNICACAO',
      mensagem: 'Verificação de conectividade do endpoint webhook Banco Inter API v2',
      timestamp: '2026-09-01T08:00:00-03:00'
    },
    headers: {
      'content-type': 'application/json',
      'x-inter-signature': 'sha256=test_inter_healthcheck'
    },
    ipAddress: '177.18.99.12'
  }
];

export interface WebhookSimulationTemplate {
  name: string;
  gateway: WebhookGateway;
  description: string;
  generatePayload: (boletoCode: string, amount: number, clientName?: string) => Record<string, any>;
  headers: Record<string, string>;
}

export const WEBHOOK_SIMULATION_TEMPLATES: Record<WebhookGateway, WebhookSimulationTemplate> = {
  ASAAS: {
    name: 'Asaas (Boleto Liquidado / PAYMENT_RECEIVED)',
    gateway: 'ASAAS',
    description: 'Notificação instantânea emitida pelo Asaas assim que a compensação bancária é finalizada.',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Asaas-Webhook/2.0',
      'asaas-access-token': 'sec_asaas_live_acheiaqui_889922'
    },
    generatePayload: (boletoCode: string, amount: number, clientName?: string) => ({
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: `pay_asaas_${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        customer: `cus_${Math.floor(100000 + Math.random() * 900000)}`,
        value: Number(amount.toFixed(2)),
        netValue: Number((amount * 0.98).toFixed(2)),
        billingType: 'BOLETO',
        status: 'RECEIVED',
        description: `Mensalidade Achei Aqui Macacu - ${clientName || 'Cliente Comercial'} (${boletoCode})`,
        externalReference: boletoCode,
        confirmedDate: new Date().toISOString().split('T')[0],
        paymentDate: new Date().toISOString().split('T')[0],
        clientPaymentDate: new Date().toISOString().split('T')[0],
        nossoNumero: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
        bankSlipUrl: `https://www.asaas.com/b/pdf/${boletoCode}`
      }
    })
  },
  MERCADO_PAGO: {
    name: 'Mercado Pago (payment.updated - Approved)',
    gateway: 'MERCADO_PAGO',
    description: 'Notificação IPN padrão do Mercado Pago confirmando liquidação de boleto / ticket.',
    headers: {
      'content-type': 'application/json',
      'x-signature': `ts=${Date.now()},v1=sig_${Math.random().toString(36).substring(2, 10)}`,
      'x-request-id': `req_mp_${Date.now()}`
    },
    generatePayload: (boletoCode: string, amount: number) => ({
      action: 'payment.updated',
      api_version: 'v1',
      data: {
        id: String(Math.floor(1000000000 + Math.random() * 9000000000))
      },
      date_created: new Date().toISOString(),
      id: Math.floor(100000000 + Math.random() * 900000000),
      live_mode: true,
      type: 'payment',
      external_reference: boletoCode,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: Number(amount.toFixed(2)),
      payment_method_id: 'bolbradesco'
    })
  },
  BANCO_INTER: {
    name: 'Banco Inter (Liquidação de Cobrança / PAGO)',
    gateway: 'BANCO_INTER',
    description: 'Webhook oficial do Banco Inter API Cobrança v2 para liquidação via compensação bancária.',
    headers: {
      'content-type': 'application/json',
      'x-inter-signature': `sha256=sig_${Math.random().toString(36).substring(2, 12)}`
    },
    generatePayload: (boletoCode: string, amount: number) => ({
      nossoNumero: `00${Math.floor(100000000 + Math.random() * 900000000)}`,
      seuNumero: boletoCode,
      situacao: 'PAGO',
      dataHoraSituacao: new Date().toISOString(),
      dataVencimento: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      valorNominal: Number(amount.toFixed(2)),
      valorTotalRecebido: Number(amount.toFixed(2)),
      codigoSolicitacao: `inter-solic-${Math.floor(100000 + Math.random() * 900000)}`,
      origemRecebimento: 'COMPENSACAO_BANCARIA'
    })
  },
  IUGU: {
    name: 'Iugu (Fatura Paga / invoice.status_changed)',
    gateway: 'IUGU',
    description: 'Webhook de gatilho financeiro da Iugu confirmando quitação de fatura.',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Iugu-Webhook-Dispatcher/1.0'
    },
    generatePayload: (boletoCode: string, amount: number, clientName?: string) => ({
      event: 'invoice.status_changed',
      data: {
        id: `inv_${Math.random().toString(36).substring(2, 12)}`,
        status: 'paid',
        order_id: boletoCode,
        total_cents: Math.round(amount * 100),
        paid_cents: Math.round(amount * 100),
        paid_at: new Date().toISOString(),
        customer_name: clientName || 'Estabelecimento Parceiro',
        secure_url: `https://faturas.iugu.com/${boletoCode}`
      }
    })
  },
  GERENCIANET_EFI: {
    name: 'Efí / Gerencianet (Notificação de Pagamento de Cobrança)',
    gateway: 'GERENCIANET_EFI',
    description: 'Webhook da plataforma Efí Bank (antiga Gerencianet) para emissão e quitação de boletos e carnês.',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Efi-Notification-Service/3.0'
    },
    generatePayload: (boletoCode: string, amount: number) => ({
      notification: 'status_change',
      charge_id: Math.floor(100000 + Math.random() * 900000),
      custom_id: boletoCode,
      status: 'paid',
      value: Math.round(amount * 100),
      payment_method: 'banking_billet',
      paid_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    })
  },
  GENERIC: {
    name: 'Achei Aqui Webhook API (JSON Direto)',
    gateway: 'GENERIC',
    description: 'Formato padrão Achei Aqui para integrações diretas via ERP, Zapier, Make ou bancos parceiros.',
    headers: {
      'content-type': 'application/json',
      'x-acheiaqui-signature': 'whsec_acheiaqui_macacu_2026_prod_key'
    },
    generatePayload: (boletoCode: string, amount: number) => ({
      event: 'BOLETO_PAID',
      boletoCode: boletoCode,
      amount: Number(amount.toFixed(2)),
      transactionId: `TX-AA-${Math.floor(1000000 + Math.random() * 9000000)}`,
      paidAt: new Date().toISOString(),
      paymentMethod: 'BOLETO_BANCARIO',
      source: 'DIRECT_API_WEBHOOK'
    })
  }
};
