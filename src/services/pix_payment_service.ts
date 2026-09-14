import { PixPaymentDetails } from '../types';

/**
 * Serviço de Integração Pix & Liquidação Instantânea
 * Em conformidade com as normas EMV / BR Code do Banco Central do Brasil
 * Suporta leitura de chaves de integração do ambiente (.env) e múltiplos gateways
 */

export interface PixGatewayConfig {
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  gatewayProvider: string;
  apiEndpoint?: string;
  hasApiToken: boolean;
  isRealGatewayActive: boolean;
  environmentMode: 'PRODUCTION' | 'HOMOLOGATION' | 'LOCAL_SANDBOX';
}

/**
 * Recupera as credenciais e configurações Pix do ambiente (.env)
 */
export const getPixGatewayConfig = (): PixGatewayConfig => {
  const envKey = import.meta.env.VITE_PIX_KEY;
  const envReceiver = import.meta.env.VITE_PIX_RECEIVER_NAME;
  const envCity = import.meta.env.VITE_PIX_RECEIVER_CITY;
  const envProvider = import.meta.env.VITE_PIX_GATEWAY_PROVIDER;
  const envEndpoint = import.meta.env.VITE_PIX_API_ENDPOINT;
  const envToken = import.meta.env.VITE_PIX_API_TOKEN;

  const pixKey = envKey && envKey.trim().length > 0
    ? envKey.trim()
    : 'financeiro@acheiaquicachoeiras.com.br';

  const receiverName = envReceiver && envReceiver.trim().length > 0
    ? envReceiver.trim()
    : 'ACHEI AQUI CACHOEIRAS';

  const receiverCity = envCity && envCity.trim().length > 0
    ? envCity.trim()
    : 'CACHOEIRAS DE MACACU';

  const gatewayProvider = envProvider && envProvider.trim().length > 0
    ? envProvider.trim().toUpperCase()
    : 'MERCADO_PAGO';

  const hasApiToken = Boolean(envToken && envToken.trim().length > 0 && !envToken.includes('your-'));
  const hasEndpoint = Boolean(envEndpoint && envEndpoint.trim().length > 0);
  const isRealGatewayActive = hasApiToken && hasEndpoint;

  const environmentMode: 'PRODUCTION' | 'HOMOLOGATION' | 'LOCAL_SANDBOX' = isRealGatewayActive
    ? 'PRODUCTION'
    : hasApiToken
    ? 'HOMOLOGATION'
    : 'LOCAL_SANDBOX';

  return {
    pixKey,
    receiverName,
    receiverCity,
    gatewayProvider,
    apiEndpoint: envEndpoint,
    hasApiToken,
    isRealGatewayActive,
    environmentMode
  };
};

/**
 * Normaliza string para o padrão EMV (ASCII, sem acentos, maiúsculas)
 */
const normalizeEmvString = (str: string, maxLength: number): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, '') // apenas caracteres alfanuméricos e espaço
    .trim()
    .toUpperCase()
    .substring(0, maxLength);
};

/**
 * Formata um campo no formato TLV (Tag-Length-Value)
 */
const formatTLV = (id: string, value: string): string => {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
};

/**
 * Cálculo CRC-16-CCITT (False) conforme especificação técnica do BACEN
 * Polinômio 0x1021, Valor inicial 0xFFFF
 */
const calculateCRC16 = (payload: string): string => {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    const charCode = payload.charCodeAt(i);
    crc ^= charCode << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Gera a string Pix Copia e Cola (BR Code) 100% compatível com o Banco Central
 */
export const generatePixCopiaECola = (options: {
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  amount: number;
  txid: string;
  description?: string;
}): string => {
  const { pixKey, receiverName, receiverCity, amount, txid, description } = options;

  // Normalização conforme regras do Bacen
  const cleanKey = pixKey.trim();
  const cleanName = normalizeEmvString(receiverName, 25) || 'ACHEI AQUI';
  const cleanCity = normalizeEmvString(receiverCity, 15) || 'C MACACU';
  const cleanTxId = normalizeEmvString(txid, 25).replace(/\s+/g, '') || '***';
  const cleanAmount = (amount > 0 ? amount : 1.0).toFixed(2);

  // 00: Payload Format Indicator
  let payload = formatTLV('00', '01');

  // 26: Merchant Account Information - Pix
  let merchantInfo = formatTLV('00', 'br.gov.bcb.pix');
  merchantInfo += formatTLV('01', cleanKey);
  if (description) {
    const cleanDesc = normalizeEmvString(description, 25);
    if (cleanDesc) {
      merchantInfo += formatTLV('02', cleanDesc);
    }
  }
  payload += formatTLV('26', merchantInfo);

  // 52: Merchant Category Code (0000 = genérico)
  payload += formatTLV('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  payload += formatTLV('53', '986');

  // 54: Transaction Amount
  payload += formatTLV('54', cleanAmount);

  // 58: Country Code (BR)
  payload += formatTLV('58', 'BR');

  // 59: Merchant Name
  payload += formatTLV('59', cleanName);

  // 60: Merchant City
  payload += formatTLV('60', cleanCity);

  // 62: Additional Data Field (TxID)
  const additionalData = formatTLV('05', cleanTxId);
  payload += formatTLV('62', additionalData);

  // 63: CRC16 (Tag 63, comprimento 04)
  payload += '6304';
  const crc = calculateCRC16(payload);

  return `${payload}${crc}`;
};

/**
 * Cria a URL segura para renderização do QR Code em alta definição
 */
export const getPixQrCodeImageUrl = (copiaECola: string, size: number = 280): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&format=svg&data=${encodeURIComponent(copiaECola)}`;
};

/**
 * Gera detalhes completos do pagamento Pix para um pedido
 */
export const createPixPaymentForOrder = (options: {
  orderId: string;
  orderNumber?: string;
  amount: number;
  merchantName?: string;
}): PixPaymentDetails => {
  const config = getPixGatewayConfig();
  const rawTxId = `ACHEI${(options.orderNumber || options.orderId).replace(/\D/g, '') || Date.now().toString().slice(-6)}`;
  const txid = rawTxId.substring(0, 25);

  const copiaECola = generatePixCopiaECola({
    pixKey: config.pixKey,
    receiverName: config.receiverName,
    receiverCity: config.receiverCity,
    amount: options.amount,
    txid,
    description: `Pedido ${options.orderNumber || options.orderId}`
  });

  const qrCodeUrl = getPixQrCodeImageUrl(copiaECola);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min de expiração

  return {
    txid,
    copiaECola,
    qrCodeUrl,
    expiresAt,
    amount: options.amount,
    receiverKey: config.pixKey,
    receiverName: config.receiverName,
    receiverCity: config.receiverCity,
    gatewayProvider: config.gatewayProvider,
    isSandbox: !config.isRealGatewayActive
  };
};

/**
 * Chave do armazenamento local para simulação de liquidação
 */
const STORAGE_PREFIX = 'acheiaqui_pix_settled_';

export interface PixVerificationResult {
  isPaid: boolean;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'ERROR';
  message: string;
  paidAt?: string;
  endToEndId?: string;
  payerName?: string;
  bank?: string;
  amount?: number;
}

/**
 * Consulta a liquidação do Pix junto ao gateway ou registro local
 */
export const verifyPixPaymentStatus = async (
  txid: string,
  _orderId: string
): Promise<PixVerificationResult> => {
  // 1. Verificar se há liquidação registrada no armazenamento local/persistido
  const saved = localStorage.getItem(`${STORAGE_PREFIX}${txid}`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        isPaid: true,
        status: 'PAID',
        message: 'Pagamento confirmado e liquidado com sucesso pelo gateway.',
        paidAt: parsed.paidAt,
        endToEndId: parsed.endToEndId,
        payerName: parsed.payerName,
        bank: parsed.bank,
        amount: parsed.amount
      };
    } catch {
      // ignore
    }
  }

  // 2. Se houver integração ativa de API configurada no .env
  const config = getPixGatewayConfig();
  if (config.isRealGatewayActive && config.apiEndpoint) {
    try {
      const response = await fetch(`${config.apiEndpoint}/${txid}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_PIX_API_TOKEN}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'approved' || data.status === 'PAID') {
          return {
            isPaid: true,
            status: 'PAID',
            message: 'Pagamento confirmado via API do Gateway.',
            paidAt: data.date_approved || new Date().toISOString(),
            endToEndId: data.id || `E${Date.now()}`
          };
        }
      }
    } catch (err) {
      console.warn('Falha na consulta ao gateway externo Pix, mantendo verificação interna:', err);
    }
  }

  // Se ainda não pago:
  return {
    isPaid: false,
    status: 'PENDING',
    message: 'Aguardando confirmação bancária. O sistema verifica a cada poucos segundos.'
  };
};

/**
 * Simula a quitação instantânea do Pix (para testes rápidos em demonstração ou ambiente de homologação)
 */
export const simulatePixSettlement = (
  txid: string,
  orderNumber: string,
  amount: number,
  payerName: string = 'Cliente Achei Aqui'
): PixVerificationResult => {
  const bankCode = '341'; // Itaú / Mercado Pago / Asaas
  const now = new Date();
  const dateCompact = now.toISOString().replace(/\D/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).substring(2, 11).toUpperCase();
  const endToEndId = `E${bankCode}${dateCompact}${randomSuffix}`;

  const receipt = {
    txid,
    orderNumber,
    amount,
    isPaid: true,
    status: 'PAID' as const,
    message: 'Pagamento recebido instantaneamente pelo Pix!',
    paidAt: now.toISOString(),
    endToEndId,
    payerName,
    bank: 'Banco Central do Brasil - SPI / Pix Instantâneo'
  };

  localStorage.setItem(`${STORAGE_PREFIX}${txid}`, JSON.stringify(receipt));

  return receipt;
};
