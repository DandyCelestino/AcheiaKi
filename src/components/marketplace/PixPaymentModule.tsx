import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  Clock,
  ExternalLink,
  Sparkles,
  Receipt,
  Building2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Order, PixPaymentDetails } from '../../types';
import {
  getPixGatewayConfig,
  createPixPaymentForOrder,
  verifyPixPaymentStatus,
  PixVerificationResult
} from '../../services/pix_payment_service';
import { criarCobrancaAsaas, CriarCobrancaResponse } from '../../services/asaasService';
import { useApp } from '../../context/AppContext';

interface PixPaymentModuleProps {
  order: Order;
  onPaymentSuccess?: (order: Order, receipt: PixVerificationResult) => void;
  className?: string;
}

export const PixPaymentModule: React.FC<PixPaymentModuleProps> = ({
  order,
  onPaymentSuccess,
  className = ''
}) => {
  const { updateOrderDetailsByMaster, triggerToast, merchants } = useApp();
  const gatewayConfig = getPixGatewayConfig();

  // Asaas Split State
  const [asaasCharge, setAsaasCharge] = useState<CriarCobrancaResponse | null>(null);
  const [isAsaasLoading, setIsAsaasLoading] = useState(false);

  // Pix payment data
  const [pixDetails, setPixDetails] = useState<PixPaymentDetails>(() => {
    return (
      order.pixDetails ||
      createPixPaymentForOrder({
        orderId: order.id,
        orderNumber: order.orderNumber || order.code,
        amount: order.totalAmount,
        merchantName: order.merchantName
      })
    );
  });

  // Copied state
  const [copied, setCopied] = useState(false);

  // Status state
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'VERIFYING' | 'PAID' | 'EXPIRED'>(
    order.paymentStatus === 'PAGO' ? 'PAID' : 'PENDING'
  );
  const [settlementReceipt, setSettlementReceipt] = useState<PixVerificationResult | null>(null);

  // Timer: 15 minutes expiration countdown
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const expires = new Date(pixDetails.expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expires - now) / 1000));
  });

  // Identifica lojista e wallet ID para o split
  const targetStore = merchants.find(
    (m) => m.id === order.merchantId || m.name?.toLowerCase() === order.merchantName?.toLowerCase()
  );

  // Inicializa split com a API Asaas
  useEffect(() => {
    let isMounted = true;
    const initAsaasSplit = async () => {
      setIsAsaasLoading(true);
      try {
        const merchantWalletId = targetStore?.asaasWalletId || `wallet_${order.merchantId || 'lojista_default'}`;

        const multiLojas = (order as any).itensPorLojista?.map((loja: any) => {
          const loj = merchants.find((m) => m.id === loja.lojistaId || m.name === loja.nomeLojista);
          return {
            lojistaId: loja.lojistaId,
            nomeLojista: loja.nomeLojista || 'Lojista Credenciado',
            walletId: loja.walletId || loj?.asaasWalletId || `wallet_${loja.lojistaId}`,
            valorSubtotal: loja.subtotal || 0
          };
        }) || (order as any).subpedidos?.map((sub: any) => {
          const loj = merchants.find((m) => m.id === sub.merchantId || m.name === sub.merchantName);
          return {
            lojistaId: sub.merchantId,
            nomeLojista: sub.merchantName || 'Lojista Credenciado',
            walletId: loj?.asaasWalletId || `wallet_${sub.merchantId}`,
            valorSubtotal: sub.totalAmount || 0
          };
        }) || [];

        const cobranca = await criarCobrancaAsaas({
          walletIdDoLojista: merchantWalletId,
          valorTotal: order.totalAmount,
          nomeCliente: order.customerName || 'Cliente Achei Aqui',
          emailCliente: order.customerEmail || undefined,
          documentoCliente: order.customerCpf || undefined,
          formaPagamento: 'pix',
          itensPorLojista: multiLojas.length > 1 ? multiLojas : undefined,
          descricao: `Pedido ${order.orderNumber || order.code} no Achei Aqui`
        });

        if (isMounted && cobranca) {
          setAsaasCharge(cobranca);
          if (cobranca.pixCopiaECola && cobranca.pixCopiaECola.startsWith('000201')) {
            setPixDetails((prev) => ({
              ...prev,
              copiaECola: cobranca.pixCopiaECola!,
              qrCodeUrl: cobranca.qrCodeBase64
                ? `data:image/png;base64,${cobranca.qrCodeBase64}`
                : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cobranca.pixCopiaECola!)}`
            }));
          }
        }
      } catch (err) {
        console.warn('Erro ao inicializar split no Asaas:', err);
      } finally {
        if (isMounted) setIsAsaasLoading(false);
      }
    };

    initAsaasSplit();

    return () => {
      isMounted = false;
    };
  }, [order.id, targetStore?.asaasWalletId]);

  // Countdown effect
  useEffect(() => {
    if (paymentStatus === 'PAID' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, timeLeft]);

  // Handle successful settlement
  const handlePaymentConfirmed = useCallback(
    (receipt: PixVerificationResult) => {
      setPaymentStatus('PAID');
      setSettlementReceipt(receipt);

      const updatedPix: PixPaymentDetails = {
        ...pixDetails,
        paidAt: receipt.paidAt || new Date().toISOString(),
        endToEndId: receipt.endToEndId
      };
      setPixDetails(updatedPix);

      // Update order in AppContext
      updateOrderDetailsByMaster(order.id, {
        status: 'Em Preparo',
        paymentMethod: 'PIX',
        paymentStatus: 'PAGO',
        pixDetails: updatedPix,
        paymentNegotiationNote: `Liquidado via Pix (${gatewayConfig.gatewayProvider}) - TxID: ${pixDetails.txid}`
      });

      triggerToast('🎉 Pagamento Pix liquidado com sucesso! Pedido enviado para preparo.');

      if (onPaymentSuccess) {
        onPaymentSuccess(
          {
            ...order,
            status: 'Em Preparo',
            paymentMethod: 'PIX',
            paymentStatus: 'PAGO',
            pixDetails: updatedPix
          },
          receipt
        );
      }
    },
    [order, pixDetails, gatewayConfig.gatewayProvider, updateOrderDetailsByMaster, triggerToast, onPaymentSuccess]
  );

  // Manual & Auto verification check
  const handleCheckPayment = useCallback(
    async (silent: boolean = false) => {
      if (paymentStatus === 'PAID') return;

      if (!silent) setIsVerifying(true);

      try {
        const result = await verifyPixPaymentStatus(pixDetails.txid, order.id);
        if (result.isPaid) {
          handlePaymentConfirmed(result);
        } else if (!silent) {
          triggerToast('Aguardando liquidação do Pix... Verifique se o pagamento foi concluído no seu banco.');
        }
      } catch (err: any) {
        if (!silent) {
          triggerToast(`Erro ao verificar: ${err?.message || 'Falha de comunicação'}`);
        }
      } finally {
        if (!silent) setIsVerifying(false);
      }
    },
    [pixDetails.txid, order.id, paymentStatus, handlePaymentConfirmed, triggerToast]
  );

  // Periodic polling every 5s while pending
  useEffect(() => {
    if (paymentStatus !== 'PENDING') return;

    const interval = setInterval(() => {
      handleCheckPayment(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentStatus, handleCheckPayment]);

  // Copy Pix Copia e Cola to clipboard
  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixDetails.copiaECola);
      setCopied(true);
      triggerToast('Código Pix (Copia e Cola) copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Format timer
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* HEADER DE INTEGRAÇÃO & AMBIENTE */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xs border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Módulo de Pagamento Instantâneo
              </span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Pix Banco Central do Brasil</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-sm border border-emerald-500/40">
                  {gatewayConfig.gatewayProvider}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  paymentStatus === 'PAID' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="text-[10px] font-mono text-slate-300 font-bold">
              {gatewayConfig.environmentMode === 'PRODUCTION'
                ? 'PRODUÇÃO'
                : gatewayConfig.environmentMode === 'HOMOLOGATION'
                ? 'HOMOLOGAÇÃO'
                : 'INTEGRAÇÃO ATIVA'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
          <div className="flex items-center space-x-1 truncate">
            <span className="text-slate-400">Chave:</span>
            <span className="font-mono text-emerald-300 font-bold truncate" title={gatewayConfig.pixKey}>
              {gatewayConfig.pixKey}
            </span>
          </div>
          <div className="flex items-center justify-start sm:justify-end space-x-1 text-slate-400">
            <span>Favorecido:</span>
            <span className="text-slate-200 font-medium truncate">{gatewayConfig.receiverName}</span>
          </div>
        </div>
      </div>

      {/* SE O PAGAMENTO JÁ ESTIVER PAGO / LIQUIDADO */}
      {paymentStatus === 'PAID' ? (
        <div className="bg-emerald-50 border-2 border-emerald-500/60 rounded-2xl p-5 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-3 py-1 rounded-full">
              VENDA LIQUIDADA COM SUCESSO ✓
            </span>
            <h4 className="text-lg font-black text-emerald-950 mt-2">
              Pagamento Pix Confirmado!
            </h4>
            <p className="text-xs text-emerald-800 max-w-sm mx-auto mt-0.5">
              O valor foi compensado instantaneamente. A loja <strong>{order.merchantName}</strong> já recebeu o aviso para iniciar o preparo imediatamente.
            </p>
          </div>

          {/* COMPROVANTE DIGITAL */}
          <div className="bg-white rounded-xl border border-emerald-200 p-3.5 text-left text-xs space-y-2 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100 font-bold text-slate-900">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <Receipt className="w-4 h-4" />
                <span>Comprovante de Liquidação Pix</span>
              </span>
              <span className="text-emerald-700 font-black">
                R$ {(pixDetails.amount ?? 0).toFixed(2).replace('.', ',')}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Identificador (TxID):</span>
                <span className="font-mono font-bold text-slate-900">{pixDetails.txid}</span>
              </div>
              {settlementReceipt?.endToEndId && (
                <div className="flex justify-between">
                  <span>End-to-End ID:</span>
                  <span className="font-mono font-bold text-slate-900 text-[10px]">
                    {settlementReceipt.endToEndId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Recebedor:</span>
                <span className="font-medium text-slate-900">{gatewayConfig.receiverName}</span>
              </div>
              <div className="flex justify-between">
                <span>Praça / Cidade:</span>
                <span className="font-medium text-slate-900">{gatewayConfig.receiverCity}</span>
              </div>
              <div className="flex justify-between">
                <span>Data / Hora:</span>
                <span className="font-medium text-slate-900">
                  {new Date(pixDetails.paidAt || Date.now()).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CORPO DO CHECKOUT PIX (QR CODE & COPIA E COLA) */
        <div className="space-y-4">
          {/* CARD DE SPLIT AUTOMÁTICO ASAAS */}
          <div className="bg-linear-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-4 border border-emerald-800/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Divisão de Pagamentos Asaas
                  </span>
                  <span className="text-xs font-bold text-white">
                    Split Automático da Venda Ativo
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-full border border-emerald-500/30">
                10% MEI / 90% Lojistas
              </span>
            </div>

            {/* Grid dos Valores Separados */}
            <div className="grid grid-cols-2 gap-2 bg-black/25 p-2.5 rounded-xl border border-emerald-800/50 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-emerald-300 block font-medium">
                  💼 Plataforma MEI (10%):
                </span>
                <span className="font-mono font-black text-white text-sm">
                  R$ {((order.totalAmount * 0.10) || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[9px] text-emerald-400/80 block font-mono truncate">
                  Carteira Master MEI
                </span>
              </div>

              <div className="space-y-0.5 border-l border-emerald-800/50 pl-2.5">
                <span className="text-[10px] text-emerald-300 block font-medium">
                  🏪 Repasse Lojista (90%):
                </span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  R$ {((order.totalAmount * 0.90) || 0).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[9px] text-emerald-400/80 block font-mono truncate" title={targetStore?.asaasWalletId || `wallet_${order.merchantId}`}>
                  {targetStore?.asaasWalletId || `wallet_${order.merchantId || 'lojista'}`}
                </span>
              </div>
            </div>

            {/* Status e Link Externo Asaas */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-900/60 text-[11px]">
              <span className="text-emerald-200/90 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Separado diretamente pelo sistema do Asaas na liquidação</span>
              </span>
              {asaasCharge?.urlCheckoutAsaas && (
                <a
                  href={asaasCharge.urlCheckoutAsaas}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-300 hover:text-white inline-flex items-center gap-1 underline transition-colors"
                >
                  <span>Fatura Asaas</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* CARTÃO CENTRAL COM QR CODE & VALOR */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center space-y-3 shadow-inner">
            {/* VALOR DESTACADO */}
            <div>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                Valor Total a Pagar:
              </span>
              <div className="text-3xl font-black text-emerald-900 flex items-center justify-center gap-1">
                <span>R$</span>
                <span>{(pixDetails.amount ?? 0).toFixed(2).replace('.', ',')}</span>
              </div>
              {order.deliveryFee && order.deliveryFee > 0 ? (
                <span className="text-[11px] text-slate-500">
                  (Itens: R$ {(order.totalAmount - order.deliveryFee).toFixed(2).replace('.', ',')} + Frete: R$ {order.deliveryFee.toFixed(2).replace('.', ',')})
                </span>
              ) : null}
            </div>

            {/* CONTADOR REGRESSIVO */}
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {timeLeft > 0 ? (
                  <>Válido por: <strong className="font-mono">{formatTimer(timeLeft)}</strong></>
                ) : (
                  <span className="text-red-600 font-black">Tempo expirado</span>
                )}
              </span>
            </div>

            {/* MOLDURA DO QR CODE */}
            <div className="relative p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-md">
              <img
                src={pixDetails.qrCodeUrl}
                alt="QR Code Pix"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-lg"
                loading="eager"
              />
              <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-dashed border-emerald-400/40"></div>
            </div>

            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              Abra o aplicativo do seu banco, escolha <strong>Pagar via Pix</strong> e aponte a câmera para o QR Code acima.
            </p>
          </div>

          {/* PIX COPIA E COLA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="uppercase tracking-wider text-[11px]">Pix Copia e Cola (EMV):</span>
              <span className="text-[11px] text-emerald-700 font-medium">Recomendado para celular</span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={pixDetails.copiaECola}
                onClick={handleCopyPix}
                className="w-full pl-3 pr-24 py-3 bg-slate-100 hover:bg-slate-200/70 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 truncate cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleCopyPix}
                className={`absolute right-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>Código Pix copiado! Abra seu app bancário e escolha "Pix Copia e Cola".</span>
              </p>
            )}
          </div>

          {/* STATUS DE VERIFICAÇÃO AUTOMÁTICA & AÇÕES */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Verificação Automática:</span>
              </span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                {isVerifying ? (
                  <span className="text-amber-600 animate-pulse">Consultando gateway...</span>
                ) : (
                  <span className="text-emerald-700">Monitorando a cada 5s</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleCheckPayment(false)}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>{isVerifying ? 'Consultando Asaas...' : 'Já Paguei (Verificar Pagamento no Asaas)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
