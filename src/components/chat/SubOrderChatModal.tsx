import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  ShieldCheck,
  Store,
  User as UserIcon,
  Clock,
  CheckCheck,
  Lock,
  Paperclip,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Package,
  Info,
  CheckCircle2,
  ShieldAlert,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubOrderMessage } from '../../types';

export const SubOrderChatModal: React.FC = () => {
  const {
    activeChatSubOrder,
    closeSubOrderChat,
    checkAccessPermission,
    subOrderMessages,
    sendSubOrderMessage,
    markSubOrderMessagesAsRead,
    currentUser,
    sendInAppNotification,
    triggerToast,
    merchants
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subpedidoId = activeChatSubOrder?.subpedidoId;
  const codigoSubpedido = activeChatSubOrder?.codigoSubpedido || `#${subpedidoId || 'SUB'}`;
  const merchantName = activeChatSubOrder?.merchantName || 'Lojista / Prestador';
  const customerName = activeChatSubOrder?.customerName || currentUser?.name || 'Cliente';
  const orderStatus = activeChatSubOrder?.orderStatus || 'Em Andamento';
  const securityCode = activeChatSubOrder?.securityCode;
  const orderTitle = activeChatSubOrder?.orderTitle;

  // Filtrar mensagens deste subpedido
  const currentMessages = subOrderMessages.filter((m) => m.subpedidoId === subpedidoId);

  // Marcar como lida ao abrir ou ao receber novas mensagens
  useEffect(() => {
    if (subpedidoId && currentUser?.id) {
      markSubOrderMessagesAsRead(subpedidoId, currentUser.id);
    }
  }, [subpedidoId, currentMessages.length, currentUser?.id, markSubOrderMessagesAsRead]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    if (activeChatSubOrder) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatSubOrder, currentMessages.length]);

  if (!activeChatSubOrder) return null;

  const isAccessAllowed = checkAccessPermission(currentUser?.id, activeChatSubOrder.subpedidoId, activeChatSubOrder);
  if (!isAccessAllowed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-rose-100 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Acesso Restrito ao Canal</h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Você não possui permissão para visualizar mensagens ou dados vinculados a este subpedido. Somente o comprador titular, a loja responsável e a auditoria Master possuem autorização para acessar esta conversa.
          </p>
          <button
            onClick={closeSubOrderChat}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    );
  }

  const isUserSeller = currentUser?.role === 'VENDEDOR';
  const isUserMaster = currentUser?.role === 'MASTER';
  const isUserClient = currentUser?.role === 'CLIENTE' || !currentUser?.role;

  // Determinar papel do remetente atual
  const currentSenderRole: 'CLIENTE' | 'VENDEDOR' | 'MASTER' = isUserMaster
    ? 'MASTER'
    : isUserSeller
    ? 'VENDEDOR'
    : 'CLIENTE';

  const currentSenderName =
    currentUser?.name ||
    (isUserSeller ? merchantName : isUserMaster ? 'Administração Achei Aqui' : 'Cliente');

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl.trim()) return;
    if (!subpedidoId) return;

    const messageText = inputText.trim();

    sendSubOrderMessage({
      subpedidoId,
      pedidoPrincipalId: activeChatSubOrder.pedidoPrincipalId,
      codigoSubpedido,
      senderId: currentUser?.id || `user-anon-${Date.now()}`,
      senderName: currentSenderName,
      senderRole: currentSenderRole,
      recipientId: isUserClient ? activeChatSubOrder.merchantId : activeChatSubOrder.customerId,
      recipientName: isUserClient ? merchantName : customerName,
      recipientRole: isUserClient ? 'VENDEDOR' : isUserSeller ? 'CLIENTE' : 'ALL',
      message: messageText,
      attachmentUrl: attachmentUrl.trim() || undefined,
      isInternalNote: (isUserSeller || isUserMaster) && isInternalNote
    });

    // Enviar notificação in-app particular para a contraparte direta
    const msgSnippet = messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText;
    if (isUserClient && activeChatSubOrder.merchantId) {
      sendInAppNotification({
        title: `💬 Nova Mensagem de ${currentSenderName}`,
        message: `Olá, ${merchantName}!\n\nVocê recebeu uma nova mensagem de ${currentSenderName} referente a "${orderTitle || 'atendimento'}":\n"${msgSnippet}"`,
        category: 'COMUNICADO',
        priority: 'HIGH',
        audience: 'SPECIFIC_MERCHANT',
        recipientMerchantId: activeChatSubOrder.merchantId,
        recipientName: merchantName,
        senderName: currentSenderName,
        senderRole: 'CLIENTE',
        actionUrl: 'chat',
        actionLabel: 'Abrir Conversa',
        orderCode: codigoSubpedido,
        metadata: {
          subpedidoId,
          codigoSubpedido,
          senderName: currentSenderName,
          chatContext: activeChatSubOrder
        }
      });
    } else if (isUserSeller && activeChatSubOrder.customerId) {
      sendInAppNotification({
        title: `💬 Resposta de ${merchantName}`,
        message: `Olá, ${customerName}!\n\nA loja ${merchantName} respondeu sua mensagem referente a "${orderTitle || 'atendimento'}":\n"${msgSnippet}"`,
        category: 'COMUNICADO',
        priority: 'HIGH',
        audience: 'SPECIFIC_USER',
        recipientUserId: activeChatSubOrder.customerId,
        recipientName: customerName,
        senderName: merchantName,
        senderRole: 'LOJISTA',
        actionUrl: 'chat',
        actionLabel: 'Ver Resposta',
        orderCode: codigoSubpedido,
        metadata: {
          subpedidoId,
          codigoSubpedido,
          senderName: currentSenderName,
          chatContext: activeChatSubOrder
        }
      });
    }

    setInputText('');
    setAttachmentUrl('');
    setShowAttachmentInput(false);
    setIsInternalNote(false);
    triggerToast('💬 Mensagem interna enviada com sucesso!');
  };

  const handleQuickChip = (text: string) => {
    setInputText(text);
  };

  const quickChips = isUserSeller
    ? [
        '✅ Pedido separado e pronto para retirada!',
        '🛵 Seu pedido saiu para entrega com o motoboy!',
        '💳 Aguardamos a confirmação do pagamento via PIX.',
        '📦 Estamos preparando o seu pacote com carinho.',
        '⏰ Horário confirmado para o seu atendimento!'
      ]
    : [
        '🛵 Olá! Gostaria de saber a previsão de entrega/retirada.',
        '📍 Já estou a caminho do balcão para retirar.',
        '💳 Pagamento realizado via PIX!',
        '❓ Olá, gostaria de confirmar mais detalhes deste pedido.'
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[750px]">
        {/* HEADER */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-emerald-400">
                  {codigoSubpedido}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {orderStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold truncate">
                {merchantName} <span className="text-slate-500 font-normal">↔</span> {customerName}
              </p>
              {orderTitle && (
                <p className="text-[11px] text-slate-400 truncate">
                  Item: {orderTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {securityCode && (
              <div className="hidden sm:flex flex-col items-end px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-[9px] text-slate-400 font-bold uppercase">Cód. Segurança</span>
                <span className="font-mono text-xs font-black text-amber-300">{securityCode}</span>
              </div>
            )}
            <button
              onClick={closeSubOrderChat}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Fechar Conversa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* OFFICIAL SAFE CHANNEL BANNER */}
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-[11px] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">
              <strong>Canal Oficial de Mensagem Interna:</strong> Conversas e comprovantes são vinculados a este subpedido com segurança jurídica.
            </span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-950 font-bold px-1.5 py-0.5 rounded shrink-0">
            LGPD 100%
          </span>
        </div>

        {/* PRODUCT CONTEXT CARD (SE ABERTO A PARTIR DE UM PRODUTO OU SERVIÇO) */}
        {(activeChatSubOrder.productName || activeChatSubOrder.productId) && (
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {activeChatSubOrder.productImage ? (
                <img
                  src={activeChatSubOrder.productImage}
                  alt={activeChatSubOrder.productName || 'Produto'}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Conversa Direta sobre Produto
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {activeChatSubOrder.productName}
                </p>
              </div>
            </div>
            {activeChatSubOrder.productPrice !== undefined && (
              <span className="text-xs font-black text-emerald-700 font-mono shrink-0 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                R$ {activeChatSubOrder.productPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        )}

        {/* MESSAGES SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {currentMessages.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  Início da Conversa do Subpedido {codigoSubpedido}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Envie uma mensagem abaixo para tirar dúvidas sobre entrega, retirada, pagamento ou orientações do produto.
                </p>
              </div>
            </div>
          ) : (
            currentMessages.map((msg) => {
              // Hide internal notes from customer
              if (msg.isInternalNote && isUserClient) return null;

              const isMe = msg.senderId === currentUser?.id || (isUserClient && msg.senderRole === 'CLIENTE') || (isUserSeller && msg.senderRole === 'VENDEDOR');
              const isSystem = msg.senderRole === 'SISTEMA';
              const isMaster = msg.senderRole === 'MASTER';
              const isSeller = msg.senderRole === 'VENDEDOR';
              const isClient = msg.senderRole === 'CLIENTE';

              if (isSystem) {
                const isCommissionEvent = msg.systemEventType === 'COMMISSION_PAID' || msg.systemEventType === 'COMMISSION_CONFIRMED';
                const isStatusEvent = msg.systemEventType === 'STATUS_CHANGED' || msg.systemEventType === 'ORDER_CREATED';

                return (
                  <div key={msg.id} className="flex flex-col items-center my-3 px-2">
                    <div
                      className={`w-full max-w-lg rounded-xl p-3 border shadow-2xs transition-all ${
                        isCommissionEvent
                          ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                          : isStatusEvent
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-black/5">
                        <div className="flex items-center space-x-1.5">
                          {isCommissionEvent ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          )}
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            {msg.senderName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {msg.statusBadge && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white border border-slate-200 text-slate-700 shadow-2xs">
                              {msg.statusBadge}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-500">
                      {msg.senderName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isSeller
                          ? 'bg-blue-100 text-blue-800'
                          : isMaster
                          ? 'bg-purple-100 text-purple-800'
                          : isClient
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {msg.senderRole}
                    </span>
                    {msg.isInternalNote && (
                      <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded flex items-center space-x-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Nota Interna</span>
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-2xs ${
                      msg.isInternalNote
                        ? 'bg-amber-50 border border-amber-300 text-amber-950'
                        : isMe
                        ? 'bg-emerald-700 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>

                    {msg.attachmentUrl && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] underline flex items-center space-x-1 font-bold"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Visualizar Anexo / Comprovante</span>
                        </a>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-end space-x-1 mt-1 text-[10px] ${
                        isMe ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMe && (
                        <CheckCheck
                          className={`w-3 h-3 ml-0.5 ${
                            msg.readBy.length > 1 ? 'text-cyan-300' : 'text-emerald-300/70'
                          }`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK RESPONSE CHIPS */}
        <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">
            Respostas Rápidas:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickChip(chip)}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-full text-slate-700 font-medium whitespace-nowrap transition-colors shrink-0 shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ATTACHMENT INPUT EXPANDER */}
        {showAttachmentInput && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center space-x-2 text-xs">
            <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="url"
              placeholder="Cole a URL de imagem ou comprovante (ex: https://...)"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-hidden focus:border-emerald-600"
            />
            <button
              type="button"
              onClick={() => setShowAttachmentInput(false)}
              className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* FOOTER INPUT CONTROLS */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2 shrink-0"
        >
          {/* Internal note toggle for seller & master */}
          {(isUserSeller || isUserMaster) && (
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-[11px] flex items-center space-x-1 text-amber-900">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Nota Interna (Visível apenas para Lojista e Master)</span>
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowAttachmentInput(!showAttachmentInput)}
              className={`p-2.5 rounded-xl border transition-colors ${
                attachmentUrl
                  ? 'bg-blue-50 border-blue-300 text-blue-600'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
              }`}
              title="Anexar comprovante ou link"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={
                isInternalNote
                  ? 'Escreva uma nota interna confidencial sobre este subpedido...'
                  : `Digite sua mensagem para ${isUserClient ? merchantName : customerName}...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-hidden transition-all ${
                isInternalNote
                  ? 'bg-amber-50/60 border-amber-300 focus:border-amber-600 text-amber-950'
                  : 'bg-slate-50 border-slate-300 focus:border-emerald-600 text-slate-900 focus:bg-white'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !attachmentUrl.trim()}
              className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition-all ${
                inputText.trim() || attachmentUrl.trim()
                  ? isInternalNote
                    ? 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                    : 'bg-emerald-700 hover:bg-emerald-800 active:scale-95'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
