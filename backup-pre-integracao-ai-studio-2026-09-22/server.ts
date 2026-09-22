import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
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

// CONFIGURAÇÕES INICIAIS (Asaas API & Marketplace Split)
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

// Verifica se a chave do Asaas é real ou se está em modo de homologação/simulação
function isLiveKey(key: string): boolean {
  return Boolean(key && key.trim() !== '' && !key.includes('seu_token_aqui') && key.startsWith('$aapi'));
}


const handleConsultarCnpj = async (req: Request, res: Response) => {
  try {
    const cnpj = String(req.params.cnpj || '').replace(/\D/g, '');

    if (cnpj.length !== 14) {
      return res.status(400).json({
        erro: 'CNPJ inv�lido',
        detalhes: 'Informe um CNPJ com 14 d�gitos.'
      });
    }

    const response = await axios.get(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
      { timeout: 10000 }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    const status = error?.response?.status === 404 ? 404 : 502;

    return res.status(status).json({
      erro: status === 404 ? 'CNPJ n�o encontrado' : 'Erro na consulta do CNPJ',
      detalhes: error?.response?.data?.message || 'N�o foi poss�vel consultar a fonte externa.'
    });
  }
};

app.get('/api/cnpj/:cnpj', handleConsultarCnpj);
// ========================================================================
// ENDPOINT 1: CADASTRAR LOJISTA (Criar Subconta no Asaas)
// Suporta /cadastrar-lojista e /api/cadastrar-lojista
// ========================================================================
const handleCadastrarLojista = async (req: Request, res: Response) => {
  try {
    const { nome, email, documento, telefone, endereco, cep, numero } = req.body;

    if (!nome || !documento) {
      return res.status(400).json({
        erro: 'Dados incompletos',
        detalhes: 'O nome do lojista e documento (CPF/CNPJ) são obrigatórios.'
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

    // Fallback amigável de Homologação / Simulação para desenvolvimento
    const simulatedLojistaId = `sub_${documento.replace(/\D/g, '').slice(-8) || Math.floor(Math.random() * 90000000 + 10000000)}`;
    const simulatedWalletId = `wallet_${nome.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}_${Math.floor(Math.random() * 9000 + 1000)}`;

    return res.status(200).json({
      mensagem: 'Lojista cadastrado com sucesso! (Modo Sandbox / Homologação)',
      lojistaId: simulatedLojistaId,
      walletIdDoLojista: simulatedWalletId,
      aviso: 'Para produção, configure ASAAS_API_KEY no arquivo de ambiente.'
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
// ENDPOINT 2: CRIAR CHECKOUT COM SPLIT AUTOMÁTICO
// Separa comissão de 10% para o MEI e valor líquido para o lojista
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
        erro: 'Valor inválido',
        detalhes: 'O valor total deve ser um número positivo.'
      });
    }

    // Valida se a forma de pagamento é PIX ou CREDIT_CARD
    const tipoPagamento = formaPagamento === 'cartao' ? 'CREDIT_CARD' : 'PIX';

    // Construção da Matriz de Split:
    // 1. Sempre reserva 10% para a carteira MEI da plataforma
    // 2. Se houver múltiplos lojistas no carrinho (itensPorLojista), distribui os 90% restantes proporcionalmente
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
        description: 'Comissão Plataforma Achei Aqui (10%)'
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
      // Split padrão para um único lojista: 10% para o MEI da plataforma
      splitArray = [
        {
          walletId: MINHA_CARTEIRA_MEI,
          percentualValue: DEFAULT_COMMISSION_PERCENT,
          description: 'Comissão Plataforma Achei Aqui (10%)'
        }
      ];

      // Se foi passado o wallet do lojista específico, registra o percentual remanescente
      if (walletIdDoLojista && walletIdDoLojista !== MINHA_CARTEIRA_MEI) {
        splitArray.push({
          walletId: walletIdDoLojista,
          percentualValue: 100.0 - DEFAULT_COMMISSION_PERCENT,
          description: 'Repasse Líquido Lojista (90%)'
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

      // Passo 2: Criar a cobrança na conta com o split da comissão
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
        mensagem: 'Cobrança gerada com sucesso!',
        idTransacao: cobrancaResponse.data.id,
        urlCheckoutAsaas: cobrancaResponse.data.invoiceUrl,
        pixCopiaECola:
          pixQrCodeData?.payload ||
          cobrancaResponse.data.pixQrCode ||
          'Disponível no link de checkout Asaas',
        qrCodeBase64: pixQrCodeData?.encodedImage || null,
        split: splitArray,
        valorTotal: parsedTotal,
        comissaoMei: Math.round(parsedTotal * (DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100,
        repasseLojista: Math.round(parsedTotal * (1 - DEFAULT_COMMISSION_PERCENT / 100) * 100) / 100
      });
    }

    // Modo de Simulação / Homologação (sem chave de produção):
    // Fornece QR Code e split perfeito para o fluxo funcionar na interface
    const idTransacaoSimulado = `pay_asaas_${Math.floor(Math.random() * 90000000 + 10000000)}`;
    const urlCheckoutSimulado = `https://sandbox.asaas.com/i/${idTransacaoSimulado}`;
    const pixCopiaEColaSimulado = `00020126580014BR.GOV.BCB.PIX0136${idTransacaoSimulado}520400005303986540${parsedTotal.toFixed(2)}5802BR5920ACHEI AQUI CACHOEIRAS6014CACHOEIRAS DE M62070503***6304`;

    return res.status(200).json({
      mensagem: 'Cobrança gerada com sucesso! (Modo Sandbox / Homologação)',
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
    console.error('Erro ao gerar cobrança no Asaas:', error.response?.data || error.message);
    return res.status(500).json({
      erro: 'Falha ao gerar cobrança',
      detalhes: error.response ? error.response.data : error.message
    });
  }
};

app.post('/criar-cobranca', handleCriarCobranca);
app.post('/api/criar-cobranca', handleCriarCobranca);

// ========================================================================
// ENDPOINT 3: STATUS DA INTEGRAÇÃO COM O ASAAS
// ========================================================================
const handleStatusAsaas = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    provedor: 'Asaas Pagamentos & Split Automático',
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
// ENDPOINT 4: WEBHOOK DO ASAAS (Confirmação e Expiração Automática de Pedidos)
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
    description: 'Recebe notificações automáticas do Asaas e atualiza o banco de dados de pedidos quando confirmado ou expirado.',
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
// ENDPOINT 5: BANCO DE DADOS DE PEDIDOS & SINCRONIZAÇÃO
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
// ENDPOINT 7: GO-LIVE & INICIALIZAÇÃO DE PRODUÇÃO (Purga e Sanitização)
// ========================================================================
app.post('/api/admin/init-production', (req: Request, res: Response) => {
  try {
    const purgeResult = purgeProductionDatabase();
    return res.status(200).json({
      success: true,
      mensagem: 'Ambiente de produção inicializado com sucesso!',
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
      erro: 'Falha ao executar inicialização de produção',
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
// INICIALIZAÇÃO DO SERVIDOR COM VITE MIDDLEWARE
// ========================================================================
export { app };

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

if (!process.env.NETLIFY) {
  startServer();
}
