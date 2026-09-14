import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  Send,
  AlertTriangle,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Order, MerchantServiceResponse } from '../../types';
import { useApp } from '../../context/AppContext';

interface AppointmentResponseModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export const AppointmentResponseModal: React.FC<AppointmentResponseModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  const { updateOrderDetailsByMaster, triggerToast, currentUser } = useApp();

  const [responseStatus, setResponseStatus] = useState<
    'CONFIRMADO' | 'REAGENDADO' | 'RECUSADO' | 'CONCLUIDO'
  >('CONFIRMADO');

  const [authorName, setAuthorName] = useState(currentUser?.name || order?.merchantName || '');
  const [responseMessage, setResponseMessage] = useState(
    order?.serviceDetails?.merchantResponse?.responseMessage ||
      `Olá ${order?.customerName}! Seu horário foi confirmado com sucesso. Estaremos prontos para atendê-lo(a).`
  );
  const [instructions, setInstructions] = useState(
    order?.serviceDetails?.merchantResponse?.instructionsForCustomer ||
      'Por favor, chegue com 10 minutos de antecedência. Em caso de dúvidas, nos chame no WhatsApp.'
  );
  const [proposedDate, setProposedDate] = useState(
    order?.serviceDetails?.scheduledDate || '2026-08-30'
  );
  const [proposedTime, setProposedTime] = useState(
    order?.serviceDetails?.scheduledTime || '14:00'
  );
  const [confirmedPrice, setConfirmedPrice] = useState<string>(
    order?.totalAmount?.toString() || '0'
  );

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseMessage.trim()) {
      alert('Por favor, escreva uma mensagem de resposta para o cliente.');
      return;
    }

    const merchantResponse: MerchantServiceResponse = {
      status: responseStatus,
      responseMessage: responseMessage.trim(),
      merchantAuthorName: authorName.trim() || order.merchantName,
      respondedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      instructionsForCustomer: instructions.trim() || undefined,
      confirmedDate: responseStatus === 'REAGENDADO' ? proposedDate : order.serviceDetails?.scheduledDate,
      confirmedTime: responseStatus === 'REAGENDADO' ? proposedTime : order.serviceDetails?.scheduledTime,
      confirmedPrice: confirmedPrice ? parseFloat(confirmedPrice) : order.totalAmount,
      pricingType: order.serviceDetails?.pricingTypeSelected || 'SERVICO_FIXO'
    };

    let nextOrderStatus = order.status;
    if (responseStatus === 'CONFIRMADO') nextOrderStatus = 'Confirmado';
    if (responseStatus === 'CONCLUIDO') nextOrderStatus = 'Concluído';
    if (responseStatus === 'RECUSADO') nextOrderStatus = 'Cancelado';

    const updatedServiceDetails = {
      ...order.serviceDetails!,
      merchantResponse
    };

    updateOrderDetailsByMaster(order.id, {
      status: nextOrderStatus,
      serviceDetails: updatedServiceDetails,
      totalAmount: confirmedPrice ? parseFloat(confirmedPrice) : order.totalAmount
    });

    const updatedOrder = {
      ...order,
      status: nextOrderStatus,
      serviceDetails: updatedServiceDetails,
      totalAmount: confirmedPrice ? parseFloat(confirmedPrice) : order.totalAmount
    };

    onSuccess(updatedOrder);
    triggerToast(`Resposta enviada ao perfil do cliente ${order.customerName}!`);
  };

  const handleWhatsAppSend = () => {
    const text = encodeURIComponent(
      `*Achei Aqui - Confirmação de Agendamento (${order.code})*\n` +
      `Olá *${order.customerName}*!\n\n` +
      `*Estabelecimento:* ${order.merchantName}\n` +
      `*Serviço:* ${order.serviceDetails?.serviceTitle}\n` +
      `*Status:* ${responseStatus}\n` +
      `*Data/Hora:* ${responseStatus === 'REAGENDADO' ? proposedDate : order.serviceDetails?.scheduledDate} às ${responseStatus === 'REAGENDADO' ? proposedTime : order.serviceDetails?.scheduledTime}\n` +
      `*Valor:* R$ ${(parseFloat(confirmedPrice) || order.totalAmount).toFixed(2).replace('.', ',')}\n\n` +
      `*Mensagem do Prestador:* ${responseMessage}\n` +
      (instructions ? `*Orientações:* ${instructions}\n` : '') +
      `\nAcompanhe seu agendamento no seu perfil no Achei Aqui!`
    );

    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Responder & Confirmar Agendamento
              </h3>
              <p className="text-slate-400 text-xs">
                Pedido {order.code} • {order.customerName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-slate-800">
          {/* Service Summary Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-blue-950">
              <span>{order.serviceDetails?.serviceTitle || 'Serviço Solicitado'}</span>
              <span className="font-mono text-blue-700">{order.code}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-700">
              <span>Profissional: <strong>{order.serviceDetails?.professional}</strong></span>
              <span>Data Solicitada: <strong>{order.serviceDetails?.scheduledDate} às {order.serviceDetails?.scheduledTime}</strong></span>
              <span>Modalidade: <strong>{order.serviceDetails?.serviceLocation || 'No Estabelecimento'}</strong></span>
            </div>
            {order.serviceDetails?.customerNotes && (
              <div className="pt-1.5 border-t border-blue-100 text-blue-900 italic">
                <strong>Observações do Cliente:</strong> "{order.serviceDetails.customerNotes}"
              </div>
            )}
          </div>

          {/* Action Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Ação sobre o Agendamento:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setResponseStatus('CONFIRMADO')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  responseStatus === 'CONFIRMADO'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmar</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseStatus('REAGENDADO')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  responseStatus === 'REAGENDADO'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Propor Reagendamento</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseStatus('CONCLUIDO')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  responseStatus === 'CONCLUIDO'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Concluir Serviço</span>
              </button>

              <button
                type="button"
                onClick={() => setResponseStatus('RECUSADO')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 ${
                  responseStatus === 'RECUSADO'
                    ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Recusar</span>
              </button>
            </div>
          </div>

          {/* Conditional: Propose new date & time */}
          {responseStatus === 'REAGENDADO' && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-950 block">
                Novo Horário Sugerido para o Cliente:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    Nova Data:
                  </label>
                  <input
                    type="date"
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                    Novo Horário:
                  </label>
                  <input
                    type="time"
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price Confirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome do Responsável pela Resposta:
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Dr. Maurício / Prof. Carlos"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Final do Serviço (R$):
              </label>
              <input
                type="number"
                step="0.50"
                value={confirmedPrice}
                onChange={(e) => setConfirmedPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Response Message to Customer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mensagem Oficial para o Perfil do Cliente *
            </label>
            <textarea
              rows={3}
              required
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Escreva a confirmação ou proposta de reagendamento..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Instructions for Customer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Orientações de Preparo / Documentos / Chegada (Opcional):
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Chegar com 10 min de antecedência, trazer radiografias anteriores ou documento com foto..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Salvar Resposta & Notificar Perfil do Cliente</span>
            </button>

            {order.customerPhone && (
              <button
                type="button"
                onClick={handleWhatsAppSend}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-all flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Enviar Confirmação também pelo WhatsApp</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
