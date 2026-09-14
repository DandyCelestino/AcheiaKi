import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Star,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  Home,
  Laptop,
  MessageSquare,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { ServiceItem, Order, ModalityType } from '../../types';
import { useApp } from '../../context/AppContext';
import { ServicePricingTableCard } from '../services/ServicePricingTableCard';

interface ServiceBookingModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onBookingSuccess: (order: Order) => void;
}

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  onClose,
  onBookingSuccess
}) => {
  const { currentUser, createOrder, triggerToast, merchants, promptAuthRequirement } = useApp();

  const currentMerchant = merchants.find((m) => m.id === service?.merchantId);

  useEffect(() => {
    if (service && !currentUser) {
      onClose();
      promptAuthRequirement('AGENDAMENTO', {
        title: service.title,
        merchantName: service.merchantName,
        price: service.price
      });
    }
  }, [service, currentUser]);

  const [selectedProfessional, setSelectedProfessional] = useState(
    service?.professionals[0] || 'Profissional Disponível'
  );
  const [selectedPricingType, setSelectedPricingType] = useState<
    'HORA' | 'DIARIA' | 'MENSAL' | 'SERVICO_FIXO' | 'ORCAMENTO'
  >('SERVICO_FIXO');

  const [selectedLocation, setSelectedLocation] = useState<
    'ESTABELECIMENTO' | 'DOMICILIO' | 'ONLINE'
  >('ESTABELECIMENTO');

  const [selectedDate, setSelectedDate] = useState('2026-08-31');
  const [selectedTime, setSelectedTime] = useState(service?.timeSlots[0] || '10:00');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Order | null>(null);

  if (!service) return null;

  // Calculate price based on selected pricing plan
  const getCalculatedPrice = (): number => {
    if (selectedPricingType === 'HORA' && service.pricingTable?.hourlyRate) {
      return service.pricingTable.hourlyRate;
    }
    if (selectedPricingType === 'DIARIA' && service.pricingTable?.dailyRate) {
      return service.pricingTable.dailyRate;
    }
    if (selectedPricingType === 'MENSAL' && service.pricingTable?.monthlyRate) {
      return service.pricingTable.monthlyRate;
    }
    return service.price || 0;
  };

  const finalPrice = getCalculatedPrice();

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      promptAuthRequirement('AGENDAMENTO', {
        title: service.title,
        merchantName: service.merchantName,
        price: finalPrice
      });
      return;
    }
    if (!customerName || !customerPhone) {
      alert('Por favor preencha nome e telefone.');
      return;
    }

    const newBooking = createOrder({
      userId: currentUser?.id || `guest-${Date.now()}`,
      customerName,
      customerPhone,
      customerAddress:
        selectedLocation === 'DOMICILIO'
          ? currentUser?.address || 'Endereço em Cachoeiras de Macacu (A Combinar)'
          : service.merchantAddress,
      merchantId: service.merchantId,
      merchantName: service.merchantName,
      type: 'SERVICO',
      items: [],
      serviceDetails: {
        serviceId: service.id,
        serviceTitle: service.title,
        professional: selectedProfessional,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        serviceLocation: selectedLocation,
        pricingTypeSelected: selectedPricingType,
        customerNotes: customerNotes.trim() || undefined,
        merchantResponse: {
          status: 'PENDENTE',
          responseMessage: 'Solicitação enviada. Aguardando confirmação e orientações do lojista/profissional.',
          merchantAuthorName: service.merchantName,
          respondedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      },
      modality: 'AGENDAMENTO',
      status: 'Pendente',
      totalAmount: finalPrice
    });

    setConfirmedBooking(newBooking);
    onBookingSuccess(newBooking);
    triggerToast(`Solicitação de agendamento ${newBooking.code} enviada para o prestador!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Agendamento Transparente
              </span>
              <span className="text-xs text-slate-400">• {service.category}</span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white mt-0.5">{service.title}</h3>
            <p className="text-slate-300 text-xs flex items-center space-x-1.5 mt-0.5">
              <span>{service.merchantName}</span>
              <span>•</span>
              <span className="flex items-center text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                {service.merchantRating.toFixed(1)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 space-y-5">
          {confirmedBooking ? (
            <div className="text-center space-y-4 py-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Agendamento Enviado com Sucesso!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Sua solicitação foi encaminhada para <strong>{service.merchantName}</strong>. 
                  Você receberá a confirmação e as orientações oficiais diretamente na aba 
                  <strong>"Meus Agendamentos"</strong> do seu perfil.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 text-xs">
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                  <span>Código da Solicitação:</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {confirmedBooking.code}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Serviço:</span>
                  <span className="font-semibold text-slate-900">{service.title}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Profissional:</span>
                  <span className="font-semibold text-slate-900">{selectedProfessional}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Modalidade de Atendimento:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedLocation === 'ESTABELECIMENTO'
                      ? 'No Consultório / Estabelecimento'
                      : selectedLocation === 'DOMICILIO'
                      ? 'Em Domicílio (Móvel)'
                      : 'Online / Remoto'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Data & Horário:</span>
                  <span className="font-bold text-blue-700">
                    {selectedDate} às {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                  <span>Valor Previsto:</span>
                  <span className="font-black text-slate-900 text-sm">
                    R$ {finalPrice.toFixed(2).replace('.', ',')}
                    <span className="text-[10px] font-normal text-slate-500 ml-1">
                      ({selectedPricingType === 'HORA' ? 'por Hora' : selectedPricingType === 'DIARIA' ? 'por Diária' : selectedPricingType === 'MENSAL' ? 'Mensalidade' : 'Serviço Fixo'})
                    </span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 text-left flex items-start space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-blue-950 font-bold">Confirmação & Resposta do Prestador:</strong>
                  <span>O prestador irá validar a vaga na agenda e poderá incluir recomendações de preparo ou documentos para o seu atendimento.</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md"
              >
                Concluir & Acompanhar no Perfil
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-5">
              {/* Tabela de Preços & Modalidades de Contratação (Hora / Dia / Mês) */}
              <ServicePricingTableCard
                pricingTable={service.pricingTable || currentMerchant?.pricingTable}
                credentials={service.credentials || currentMerchant?.credentials}
                references={currentMerchant?.references}
                basePrice={service.price}
                providerName={service.merchantName}
                categoryName={service.category}
                isSelectable={true}
                selectedPlan={selectedPricingType}
                onSelectPricingPlan={(plan) => setSelectedPricingType(plan)}
              />

              {/* 1. Modalidade de Atendimento */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Onde você prefere o atendimento?</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLocation('ESTABELECIMENTO')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedLocation === 'ESTABELECIMENTO'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4 text-blue-600 mb-1" />
                    <div className="font-bold">No Estabelecimento</div>
                    <div className="text-[10px] text-slate-500 font-normal truncate">
                      {service.merchantAddress}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLocation('DOMICILIO')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedLocation === 'DOMICILIO'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="w-4 h-4 text-emerald-600 mb-1" />
                    <div className="font-bold">Em Domicílio</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Prestador vai até você em Macacu
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedLocation('ONLINE')}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedLocation === 'ONLINE'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-950 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-purple-600 mb-1" />
                    <div className="font-bold">Online / Vídeo</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      Teleconsulta ou aula remota
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Seleção do Profissional */}
              {service.professionals.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Escolha o Profissional / Especialista:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {service.professionals.map((prof) => (
                      <button
                        key={prof}
                        type="button"
                        onClick={() => setSelectedProfessional(prof)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                          selectedProfessional === prof
                            ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>{prof}</span>
                        </div>
                        {selectedProfessional === prof && (
                          <span className="text-[10px] font-bold text-blue-600">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Data & Vagas Livres da Agenda */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>3. Escolha a Data & Horário Vago da Agenda:</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Vagas em Tempo Real
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Data do Atendimento:
                    </label>
                    <input
                      type="date"
                      required
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Horas Vagas Disponíveis:
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    >
                      {service.timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time} (Horário Livre)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {service.availableDays && (
                  <p className="text-[11px] text-slate-500">
                    Dias de atendimento do prestador: <strong>{service.availableDays.join(', ')}</strong>
                  </p>
                )}
              </div>

              {/* 4. Dados do Cliente & Observações */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Mariana Silva"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp para Confirmação *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(21) 98765-4321"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações ou Descrição da Necessidade (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Ex: Descrever sintomas, necessidades específicas, matérias de reforço ou tipo de reparo..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Resumo do Valor e Envio */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                    Valor da Contratação ({selectedPricingType}):
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    R$ {finalPrice.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-slate-300 ml-1.5">
                      {selectedPricingType === 'HORA'
                        ? 'por hora'
                        : selectedPricingType === 'DIARIA'
                        ? 'diária integral'
                        : selectedPricingType === 'MENSAL'
                        ? 'mensalidade'
                        : 'serviço'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Solicitar Agendamento</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
