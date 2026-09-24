import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  getStoredOrders,
  getWebhookLogs,
  processAsaasWebhookPayload,
  upsertStoredOrder
} from './src/server/ordersDatabase';

// Webhook listener middleware for Brazilian Boleto, Pix and Asaas Gateway
const webhookMiddlewarePlugin = (): Plugin => ({
  name: 'asaas-and-boleto-webhook-receiver',
  configureServer(server) {
    // ----------------------------------------------------------------------
    // NOVO ENDPOINT: WEBHOOK OFICIAL DO ASAAS (/api/webhooks/asaas e /api/asaas/webhook)
    // Atualiza automaticamente o status dos pedidos no banco de dados
    // quando o pagamento for confirmado (PAYMENT_CONFIRMED/RECEIVED)
    // ou quando for expirado/cancelado (PAYMENT_OVERDUE/EXPIRED)
    // ----------------------------------------------------------------------
    const handleAsaasWebhook = (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const result = processAsaasWebhookPayload(parsed);

            res.writeHead(result.success ? 200 : 202, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
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
              })
            );
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ERROR', message: 'Payload JSON inválido para o webhook do Asaas.' }));
          }
        });
      } else {
        // Resposta informativa para GET (Healthcheck e auditoria)
        const recentLogs = getWebhookLogs().slice(0, 10);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ACTIVE',
            service: 'Achei Aqui - Endpoint de Webhooks do Asaas',
            endpoint: '/api/webhooks/asaas',
            description:
              'Recebe notificações automáticas do Asaas e atualiza o banco de dados de pedidos quando confirmado ou expirado.',
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
          })
        );
      }
    };

    server.middlewares.use('/api/webhooks/asaas', handleAsaasWebhook);
    server.middlewares.use('/api/asaas/webhook', handleAsaasWebhook);

    // ----------------------------------------------------------------------
    // ENDPOINT DE SINCRONIZAÇÃO DE PEDIDOS COM O BANCO DE DADOS (/api/orders)
    // ----------------------------------------------------------------------
    server.middlewares.use('/api/orders', (req: any, res: any) => {
      if (req.method === 'GET') {
        const orders = getStoredOrders();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ orders, count: orders.length, timestamp: new Date().toISOString() }));
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const saved = upsertStoredOrder(parsed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, order: saved }));
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Falha ao salvar pedido no banco de dados' }));
          }
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Método não permitido' }));
      }
    });

    // ----------------------------------------------------------------------
    // ENDPOINT DE SIMULAÇÃO DE EVENTOS DO ASAAS PARA TESTES (/api/webhooks/asaas/simulate)
    // ----------------------------------------------------------------------
    server.middlewares.use('/api/webhooks/asaas/simulate', (req: any, res: any) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const event = parsed.event || 'PAYMENT_CONFIRMED';
            const paymentId = parsed.paymentId || parsed.id || 'pay_simulated_asaas_123';
            const externalReference = parsed.externalReference || parsed.orderId || parsed.orderCode;

            const simulatedPayload = {
              event,
              payment: {
                id: paymentId,
                externalReference,
                status: event === 'PAYMENT_OVERDUE' ? 'OVERDUE' : 'CONFIRMED',
                billingType: 'PIX',
                value: parsed.value || 84.5
              }
            };

            const result = processAsaasWebhookPayload(simulatedPayload);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, simulation: true, result }));
          } catch (e: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message || 'Erro ao simular webhook Asaas' }));
          }
        });
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            message: 'Envie um POST para simular eventos: PAYMENT_CONFIRMED ou PAYMENT_OVERDUE',
            example: { event: 'PAYMENT_CONFIRMED', externalReference: 'order-1' }
          })
        );
      }
    });

    // Middleware existente de webhooks de boletos bancários
    server.middlewares.use('/api/webhooks/boleto', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                status: 'OK',
                message: 'Webhook de liquidação de boleto recebido com sucesso pela plataforma Achei Aqui.',
                receivedAt: new Date().toISOString(),
                payloadSummary: {
                  event: parsed.event || parsed.action || parsed.situacao || 'PAYMENT_RECEIVED',
                  reference: parsed.payment?.externalReference || parsed.external_reference || parsed.seuNumero || parsed.boletoCode || null
                }
              })
            );
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ERROR', message: 'Invalid JSON payload' }));
          }
        });
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ACTIVE',
            service: 'Achei Aqui Macacu - Boleto & Pix Webhook Gateway Listener',
            documentation: 'Envie requisições POST com payloads do Asaas, Mercado Pago, Banco Inter, Iugu ou Efí.',
            timestamp: new Date().toISOString()
          })
        );
      }
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      webhookMiddlewarePlugin(),
      VitePWA({
        registerType: 'autoUpdate',
    devOptions: {
        enabled: false
      },
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024
        },
        manifest: {
          name: 'AcheiAqui',
          short_name: 'AcheiAqui',
          description: 'Marketplace local AcheiAqui',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#111827',
          background_color: '#ffffff',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});






