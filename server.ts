import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  getStoredOrders,
  getWebhookLogs,
  processAsaasWebhookPayload,
  upsertStoredOrder,
  purgeProductionDatabase
} from './src/server/ordersDatabase';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// CONFIGURAÃ‡Ã•ES INICIAIS (Asaas API & Marketplace Split)
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aapi_seu_token_aqui';
const MINHA_CARTEIRA_MEI = process.env.ASAAS_WALLET_ID_MASTER || 'wallet_master_acheiaqui_mei';
const ASAAS_URL_BASE = (process.env.ASAAS_URL || 'https://sandbox.asaas.com/api/v3').trim().replace(/\/+$/, '');
const DEFAULT_COMMISSION_PERCENT = parseFloat(process.env.ASAAS_COMMISSION_PERCENT || '10.0');

// Helper para normalizar URL de endpoints da API Asaas (v3)
function getAsaasUrl(endpointPath: string): string {
  let base = ASAAS_URL_BASE;
  if (!base.includes('/v3')) {
    base = base.includes('api.') ? `${base}/v3` : `${base}/api/v3`;
  }
  const clean = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  return `${base}${clean}`;
}

// Verifica se a chave do Asaas Ã© real ou se estÃ¡ em modo de homologaÃ§Ã£o/simulaÃ§Ã£o
function isLiveKey(key: string): boolean {
  return Boolean(key && key.trim() !== '' && !key.includes('seu_token_aqui') && key.startsWith('$aapi'));
}

// ========================================================================

// ========================================================================
// MASTER DE CONTINGÊNCIA
// Autenticação exclusivamente no backend.
// Não utiliza Firebase Authentication.
// ========================================================================

const MASTER_CONTINGENCY_EMAIL =
  (process.env.MASTER_CONTINGENCY_EMAIL || 'telecom.david@gmail.com')
    .trim()
    .toLowerCase();

const MASTER_CONTINGENCY_PASSWORD_HASH =
  (process.env.MASTER_CONTINGENCY_PASSWORD_HASH || '')
    .trim()
    .toLowerCase();

const MASTER_CONTINGENCY_TOKEN_SECRET =
  (process.env.MASTER_CONTINGENCY_TOKEN_SECRET || '').trim();

const masterContingencyAttempts = new Map<
  string,
  { count: number; blockedUntil: number }
>();

function encodeMasterToken(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createMasterContingencyToken(email: string): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: 'master-contingency-backend',
    email,
    role: 'MASTER',
    iat: now,
    exp: now + 1800
  };

  const encoded = encodeMasterToken(
    JSON.stringify(payload)
  );

  const signature = createHmac(
    'sha256',
    MASTER_CONTINGENCY_TOKEN_SECRET
  )
    .update(encoded)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${encoded}.${signature}`;
}

app.post('/api/master-contingency/login', (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || '');

    if (
      !MASTER_CONTINGENCY_PASSWORD_HASH ||
      !MASTER_CONTINGENCY_TOKEN_SECRET
    ) {
      console.error(
        '[MASTER CONTINGENCY] Configuração ausente no .env'
      );

      return res.status(503).json({
        success: false,
        message: 'Contingência MASTER não configurada no servidor.'
      });
    }

    const clientIp = String(
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown'
    )
      .split(',')[0]
      .trim();

    const attemptKey = `${clientIp}:${email}`;
    const now = Date.now();

    const previous =
      masterContingencyAttempts.get(attemptKey);

    if (
      previous &&
      previous.blockedUntil > now
    ) {
      const seconds = Math.ceil(
        (previous.blockedUntil - now) / 1000
      );

      return res.status(429).json({
        success: false,
        message:
          `Acesso temporariamente bloqueado. ` +
          `Tente novamente em ${seconds} segundos.`
      });
    }

    const receivedHash = createHash('sha256')
      .update(password, 'utf8')
      .digest('hex')
      .toLowerCase();

    const expectedBuffer = Buffer.from(
      MASTER_CONTINGENCY_PASSWORD_HASH,
      'hex'
    );

    const receivedBuffer = Buffer.from(
      receivedHash,
      'hex'
    );

    const passwordValid =
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (
      email !== MASTER_CONTINGENCY_EMAIL ||
      !passwordValid
    ) {
      const current =
        masterContingencyAttempts.get(attemptKey) || {
          count: 0,
          blockedUntil: 0
        };

      current.count++;

      if (current.count >= 5) {
        current.count = 0;
        current.blockedUntil =
          now + 15 * 60 * 1000;
      }

      masterContingencyAttempts.set(
        attemptKey,
        current
      );

      return res.status(401).json({
        success: false,
        message:
          'Credenciais MASTER de contingência inválidas.'
      });
    }

    masterContingencyAttempts.delete(attemptKey);

    const user = {
      id: 'master-contingency-backend',
      name: 'David Telecom (Master)',
      email: MASTER_CONTINGENCY_EMAIL,
      phone: '(21) 99999-8877',
      role: 'MASTER',
      password: '',
      city: 'Cachoeiras de Macacu, RJ',
      isEmailVerified: true,
      needsPasswordChange: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString()
    };

    const token = createMasterContingencyToken(
      MASTER_CONTINGENCY_EMAIL
    );

    console.log(
      `[MASTER CONTINGENCY] Acesso autorizado: ${MASTER_CONTINGENCY_EMAIL} | IP: ${clientIp}`
    );

    return res.status(200).json({
      success: true,
      user,
      token,
      expiresIn: 1800,
      message:
        'Acesso MASTER de contingência autorizado pelo backend.'
    });

  } catch (error: any) {
    console.error(
      '[MASTER CONTINGENCY] Erro:',
      error?.message || error
    );

    return res.status(500).json({
      success: false,
      message:
        'Falha interna na autenticação MASTER de contingência.'
    });
  }
});

// ENDPOINT 1: CADASTRAR LOJISTA (Criar Subconta no Asaas)
// Suporta /cadastrar-lojista e /api/cadastrar-lojista
// ========================================================================
const handleCadastrarLojista = async (req: Request, res: Response) => {
  try {
    const { nome, email, documento, telefone, endereco, cep, numero } = req.body;

    if (!nome || !documento) {
      return res.status(400).json({
        erro: 'Dados incompletos',
        detalhes: 'O nome do lojista e documento (CPF/CNPJ) sÃ£o obrigatÃ³rios.'
      });
    }

    // Se temos uma chave real configurada, chama o Asaas
    if (isLiveKey(ASAAS_API_KEY)) {
      const response = await axios.post(
        getAsaasUrl('/accounts'),
        {
          name: nome,
          email: email || `${nome.toLowerCase().replace(/\s+/g, '')}@acheiaquicachoeiras.com.br`,
          cpfCnpj: documento.replace(/\D/g, ''),
          phone: telefone ? telefone.replace(/\D/g, '') : undefined,
          address: endereco || undefined,
          addressNumber: numero || undefined,
          postalCode: cep ? cep.replace(/\D/g, '') : undefined
        },
        {
          headers: { access_token: ASAAS_API_KEY }
        }
      );

      const subconta = response.data;

      return res.status(200).json({
        mensagem: 'Lojista cadastrado com sucesso no Asaas!',
        lojistaId: subconta.id,
        walletIdDoLojista: subconta.walletId || subconta.id,
        status: subconta.status || 'ACTIVE'
      });
    }

    // Fallback amigÃ¡vel de HomologaÃ§Ã£o / SimulaÃ§Ã£o para desenvolvimento
    const simulatedLojistaId = `sub_${documento.replace(/\D/g, '').slice(-8) || Math.floor(Math.random() * 90000000 + 10000000)}`;
    const simulatedWalletId = `wallet_${nome.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}_${Math.floor(Math.random() * 9000 + 1000)}`;

    return res.status(200).json({
      mensagem: 'Lojista cadastrado com sucesso! (Modo Sandbox / HomologaÃ§Ã£o)',
      lojistaId: simulatedLojistaId,
      walletIdDoLojista: simulatedWalletId,
      aviso: 'Para produÃ§Ã£o, configure ASAAS_API_KEY no arquivo de ambiente.'
    });
  } catch (error: any) {
    console.error('Erro ao cadastrar lojista no Asaas:', error.response?.data || error.message);
    return res.status(500).json({
      erro: 'Falha ao cadastrar lojista',
      detalhes: error.response ? error.response.data : error.message
    });
  }
};

app.post('/cadastrar-lojista', handleCadastrarLojista);
app.post('/api/cadastrar-lojista', handleCadastrarLojista);

// ========================================================================
// ENDPOINT 2: CRIAR CHECKOUT COM SPLIT AUTOMÃTICO
// Separa comissÃ£o de 10% para o MEI e valor lÃ­quido para o lojista
// Suporta /criar-cobranca e /api/criar-cobranca
// ========================================================================
const handleCriarCobranca = async (req: Request, res: Response) => {
  try {
    const {
      walletIdDoLojista,
      valorTotal,
      nomeCliente,
      emailCliente,
      documentoCliente,
      formaPagamento,
      itensPorLojista,
      descricao
    } = req.body;

    const parsedTotal = parseFloat(valorTotal);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({
        erro: 'Valor invÃ¡lido',
        detalhes: 'O valor total deve ser um nÃºmero positivo.'
      });
    }

    // Valida se a forma de pagamento Ã© PIX ou CREDIT_CARD
    const tipoPagamento = formaPagamento === 'cartao' ? 'CREDIT_CARD' : 'PIX';

    // ConstruÃ§Ã£o da Matriz de Split:
    // 1. Sempre reserva 10% para a carteira MEI da plataforma
    // 2. Se houver mÃºltiplos lojistas no carrinho (itensPorLojista), distribui os 90% restantes proporcionalmente
    let splitArray: Array<{
      walletId: string;
      percentualValue?: number;
      fixedValue?: number;
      description?: string;
    }> = [];

    if (Array.isArray(itensPorLojista) && itensPorLojista.length > 0) {
      // Split Multi-lojista detalhado por carrinho
      // Carteira MEI Master: 10% do total
      splitArray.push({
        walletId: MINHA_CARTEIRA_MEI,
        percentualValue: DEFAULT_COMMISSION_PERCENT,
        description: 'ComissÃ£o Plataforma Achei Aqui (10%)'
      });

      // Lojistas individuais do carrinho (subtraindo 10% de cada)
      itensPorLojista.forEach((loja: any) => {
        const subtotal = parseFloat(loja.valorSubtotal || loja.valor || 0);
        if (subtotal > 0 && loja.walletId) {
          const valorLiquidoLojista = Math.round(subtotal * (1 - DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100;
          splitArray.push({
            walletId: loja.walletId,
            fixedValue: valorLiquidoLojista,
            description: `Repasse Venda - ${loja.nomeLojista || 'Lojista'}`
          });
        }
      });
    } else {
      // Split padrÃ£o para um Ãºnico lojista: 10% para o MEI da plataforma
      splitArray = [
        {
          walletId: MINHA_CARTEIRA_MEI,
          percentualValue: DEFAULT_COMMISSION_PERCENT,
          description: 'ComissÃ£o Plataforma Achei Aqui (10%)'
        }
      ];

      // Se foi passado o wallet do lojista especÃ­fico, registra o percentual remanescente
      if (walletIdDoLojista && walletIdDoLojista !== MINHA_CARTEIRA_MEI) {
        splitArray.push({
          walletId: walletIdDoLojista,
          percentualValue: 100.0 - DEFAULT_COMMISSION_PERCENT,
          description: 'Repasse LÃ­quido Lojista (90%)'
        });
      }
    }

    // Se temos credencial ativa do Asaas:
    if (isLiveKey(ASAAS_API_KEY)) {
      // Passo 1: Criar ou localizar o cliente dentro do Asaas
      const clienteResponse = await axios.post(
        getAsaasUrl('/customers'),
        {
          name: nomeCliente || 'Cliente Achei Aqui',
          email: emailCliente || 'cliente@acheiaquicachoeiras.com.br',
          cpfCnpj: documentoCliente ? documentoCliente.replace(/\D/g, '') : undefined
        },
        {
          headers: { access_token: ASAAS_API_KEY }
        }
      );

      const idClienteAsaas = clienteResponse.data.id;

      // Passo 2: Criar a cobranÃ§a na conta com o split da comissÃ£o
      const cobrancaResponse = await axios.post(
        getAsaasUrl('/payments'),
        {
          customer: idClienteAsaas,
          billingType: tipoPagamento,
          value: parsedTotal,
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Vence em 24h
          description: descricao || 'Pedido no Achei Aqui Cachoeiras de Macacu',
          split: splitArray
        },
        {
          headers: { access_token: ASAAS_API_KEY }
        }
      );

      let pixQrCodeData: any = null;
      if (tipoPagamento === 'PIX' && cobrancaResponse.data.id) {
        try {
          const qrResponse = await axios.get(
            getAsaasUrl(`/payments/${cobrancaResponse.data.id}/pixQrCode`),
            {
              headers: { access_token: ASAAS_API_KEY }
            }
          );
          pixQrCodeData = qrResponse.data;
        } catch (qrErr) {
          console.warn('QR Code Pix pendente na fila do Asaas:', qrErr);
        }
      }

      return res.status(200).json({
        mensagem: 'CobranÃ§a gerada com sucesso!',
        idTransacao: cobrancaResponse.data.id,
        urlCheckoutAsaas: cobrancaResponse.data.invoiceUrl,
        pixCopiaECola:
          pixQrCodeData?.payload ||
          cobrancaResponse.data.pixQrCode ||
          'DisponÃ­vel no link de checkout Asaas',
        qrCodeBase64: pixQrCodeData?.encodedImage || null,
        split: splitArray,
        valorTotal: parsedTotal,
        comissaoMei: Math.round(parsedTotal * (DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100,
        repasseLojista: Math.round(parsedTotal * (1 - DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100
      });
    }

    // Modo de SimulaÃ§Ã£o / HomologaÃ§Ã£o (sem chave de produÃ§Ã£o):
    // Fornece QR Code e split perfeito para o fluxo funcionar na interface
    const idTransacaoSimulado = `pay_asaas_${Math.floor(Math.random() * 90000000 + 10000000)}`;
    const urlCheckoutSimulado = `https://sandbox.asaas.com/i/${idTransacaoSimulado}`;
    const pixCopiaEColaSimulado = `00020126580014BR.GOV.BCB.PIX0136${idTransacaoSimulado}520400005303986540${parsedTotal.toFixed(2)}5802BR5920ACHEI AQUI CACHOEIRAS6014CACHOEIRAS DE M62070503***6304`;

    return res.status(200).json({
      mensagem: 'CobranÃ§a gerada com sucesso! (Modo Sandbox / HomologaÃ§Ã£o)',
      idTransacao: idTransacaoSimulado,
      urlCheckoutAsaas: urlCheckoutSimulado,
      pixCopiaECola: pixCopiaEColaSimulado,
      split: splitArray,
      valorTotal: parsedTotal,
      comissaoMei: Math.round(parsedTotal * (DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100,
      repasseLojista: Math.round(parsedTotal * (1 - DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100,
      isSimulated: true
    });
  } catch (error: any) {
    console.error('Erro ao gerar cobranÃ§a no Asaas:', error.response?.data || error.message);
    return res.status(500).json({
      erro: 'Falha ao gerar cobranÃ§a',
      detalhes: error.response ? error.response.data : error.message
    });
  }
};

app.post('/criar-cobranca', handleCriarCobranca);
app.post('/api/criar-cobranca', handleCriarCobranca);

// ========================================================================
// ENDPOINT 3: STATUS DA INTEGRAÃ‡ÃƒO COM O ASAAS
// ========================================================================
const handleStatusAsaas = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    provedor: 'Asaas Pagamentos & Split AutomÃ¡tico',
    isLiveConfigured: isLiveKey(ASAAS_API_KEY),
    asaasUrl: ASAAS_URL_BASE,
    carteiraMeiMaster: MINHA_CARTEIRA_MEI,
    percentualComissao: DEFAULT_COMMISSION_PERCENT,
    splitAtivo: true,
    tempoVencimentoHoras: 24
  });
};

app.get('/status-asaas', handleStatusAsaas);
app.get('/api/asaas/status', handleStatusAsaas);

// ========================================================================
// ENDPOINT 4: WEBHOOK DO ASAAS (ConfirmaÃ§Ã£o e ExpiraÃ§Ã£o AutomÃ¡tica de Pedidos)
// Suporta /api/asaas/webhook e /api/webhooks/asaas
// Atualiza automaticamente o status dos pedidos no banco de dados
// ========================================================================
const handleAsaasWebhook = (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const result = processAsaasWebhookPayload(payload);

    console.log(`[Asaas Webhook] Evento: ${result.event} | Sucesso: ${result.success} | Msg: ${result.message}`);

    return res.status(result.success ? 200 : 202).json({
      status: result.success ? 'OK' : 'RECEIVED_WITH_NOTICE',
      message: result.message,
      event: result.event,
      orderUpdated: result.matchedOrder
        ? {
            id: result.matchedOrder.id,
            code: result.matchedOrder.code || result.matchedOrder.orderNumber,
            status: result.matchedOrder.status,
            paymentStatus: result.matchedOrder.paymentStatus,
            totalAmount: result.matchedOrder.totalAmount,
            customerName: result.matchedOrder.customerName
          }
        : null,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      previousPaymentStatus: result.previousPaymentStatus,
      newPaymentStatus: result.newPaymentStatus,
      processedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro no processamento do webhook Asaas:', error);
    return res.status(500).json({ erro: 'Falha interna ao processar webhook', detalhes: error.message });
  }
};

const handleGetAsaasWebhook = (req: Request, res: Response) => {
  const recentLogs = getWebhookLogs().slice(0, 10);
  return res.status(200).json({
    status: 'ACTIVE',
    service: 'Achei Aqui - Endpoint de Webhooks do Asaas',
    endpoint: '/api/webhooks/asaas',
    description: 'Recebe notificaÃ§Ãµes automÃ¡ticas do Asaas e atualiza o banco de dados de pedidos quando confirmado ou expirado.',
    supportedEvents: [
      'PAYMENT_CONFIRMED (atualiza status para Confirmado e paymentStatus para PAGO)',
      'PAYMENT_RECEIVED (atualiza status para Confirmado e paymentStatus para PAGO)',
      'PAYMENT_OVERDUE (atualiza status para Cancelado e paymentStatus para EXPIRADO)',
      'PAYMENT_EXPIRED (atualiza status para Cancelado e paymentStatus para EXPIRADO)',
      'PAYMENT_REFUNDED (atualiza status para Cancelado e paymentStatus para CANCELADO)'
    ],
    totalRecentWebhookLogs: recentLogs.length,
    recentLogs,
    timestamp: new Date().toISOString()
  });
};

app.post('/api/asaas/webhook', handleAsaasWebhook);
app.post('/api/webhooks/asaas', handleAsaasWebhook);
app.get('/api/asaas/webhook', handleGetAsaasWebhook);
app.get('/api/webhooks/asaas', handleGetAsaasWebhook);

// ========================================================================
// ENDPOINT 5: BANCO DE DADOS DE PEDIDOS & SINCRONIZAÃ‡ÃƒO
// ========================================================================
app.get('/api/orders', (req: Request, res: Response) => {
  const orders = getStoredOrders();
  return res.status(200).json({ orders, count: orders.length, timestamp: new Date().toISOString() });
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const saved = upsertStoredOrder(req.body);
    return res.status(200).json({ success: true, order: saved });
  } catch (e: any) {
    return res.status(400).json({ error: 'Falha ao salvar pedido no banco de dados', detalhes: e.message });
  }
});

// ========================================================================
// ENDPOINT 6: SIMULADOR DE WEBHOOKS DO ASAAS
// ========================================================================
app.post('/api/webhooks/asaas/simulate', (req: Request, res: Response) => {
  try {
    const { event, paymentId, externalReference, orderId, orderCode, value } = req.body;
    const resolvedEvent = event || 'PAYMENT_CONFIRMED';
    const resolvedPaymentId = paymentId || `pay_sim_${Date.now()}`;
    const resolvedRef = externalReference || orderId || orderCode;

    const simulatedPayload = {
      event: resolvedEvent,
      payment: {
        id: resolvedPaymentId,
        externalReference: resolvedRef,
        status: resolvedEvent === 'PAYMENT_OVERDUE' ? 'OVERDUE' : 'CONFIRMED',
        billingType: 'PIX',
        value: value || 84.5
      }
    };

    const result = processAsaasWebhookPayload(simulatedPayload);
    return res.status(200).json({ success: true, simulation: true, result });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || 'Erro ao simular webhook Asaas' });
  }
});

app.get('/api/webhooks/asaas/logs', (req: Request, res: Response) => {
  return res.status(200).json({ logs: getWebhookLogs() });
});

// ========================================================================
// ENDPOINT 7: GO-LIVE & INICIALIZAÃ‡ÃƒO DE PRODUÃ‡ÃƒO (Purga e SanitizaÃ§Ã£o)
// ========================================================================
app.post('/api/admin/init-production', (req: Request, res: Response) => {
  try {
    const purgeResult = purgeProductionDatabase();
    return res.status(200).json({
      success: true,
      mensagem: 'Ambiente de produÃ§Ã£o inicializado com sucesso!',
      resultado: purgeResult,
      configuracoes: {
        asaasUrl: ASAAS_URL_BASE,
        carteiraMeiMaster: MINHA_CARTEIRA_MEI,
        comissaoPlataforma: `${DEFAULT_COMMISSION_PERCENT}%`,
        modo: 'OFICIAL_PRODUCAO'
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      erro: 'Falha ao executar inicializaÃ§Ã£o de produÃ§Ã£o',
      detalhes: error.message
    });
  }
});

app.get('/api/admin/system-status', (req: Request, res: Response) => {
  const orders = getStoredOrders();
  const webhookLogs = getWebhookLogs();

  return res.status(200).json({
    status: 'ONLINE',
    ambiente: process.env.NODE_ENV || 'production',
    bancoDePedidos: {
      totalPedidosAtivos: orders.length,
      status: orders.length === 0 ? 'LIMPO_PRONTO_PRODUCAO' : 'COM_REGISTROS'
    },
    webhooks: {
      totalLogs: webhookLogs.length,
      status: webhookLogs.length === 0 ? 'ZERADO_PRONTO_PRODUCAO' : 'COM_LOGS'
    },
    asaas: {
      url: ASAAS_URL_BASE,
      isLive: isLiveKey(ASAAS_API_KEY),
      carteiraMaster: MINHA_CARTEIRA_MEI,
      comissaoPadrao: `${DEFAULT_COMMISSION_PERCENT}%`
    },
    pixOficial: {
      cnpj: '30.810.800/0001-39',
      chave: process.env.VITE_PIX_KEY || 'financeiro@acheiaquicachoeiras.com.br',
      cidade: 'CACHOEIRAS DE MACACU'
    },
    timestamp: new Date().toISOString()
  });
});

// ========================================================================
// INICIALIZAÃ‡ÃƒO DO SERVIDOR COM VITE MIDDLEWARE
// ========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Plataforma Multilogista rodando na porta ${PORT}! Asaas Split ativo.`);
  });
}

startServer();
