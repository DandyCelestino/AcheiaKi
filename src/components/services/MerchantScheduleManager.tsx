import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Save,
  Sparkles,
  MapPin,
  Laptop,
  Home,
  ShieldCheck,
  Award,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  StoreMerchant,
  MerchantScheduleConfig,
  MerchantAvailableSlot,
  ServicePricingTable,
  ProfessionalCredentials,
  ProfessionalReference
} from '../../types';
import { useApp } from '../../context/AppContext';

interface MerchantScheduleManagerProps {
  merchant: StoreMerchant;
  onSaveSchedule?: (schedule: MerchantScheduleConfig) => void;
  onSavePricing?: (pricing: ServicePricingTable, creds: ProfessionalCredentials, refs: ProfessionalReference[]) => void;
}

const DEFAULT_DAYS = [
  { day: 'Segunda', isOpen: true, startHour: '08:00', endHour: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 'Terça', isOpen: true, startHour: '08:00', endHour: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 'Quarta', isOpen: true, startHour: '08:00', endHour: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 'Quinta', isOpen: true, startHour: '08:00', endHour: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 'Sexta', isOpen: true, startHour: '08:00', endHour: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { day: 'Sábado', isOpen: true, startHour: '08:30', endHour: '13:00', lunchStart: '', lunchEnd: '' },
  { day: 'Domingo', isOpen: false, startHour: '09:00', endHour: '13:00', lunchStart: '', lunchEnd: '' }
];

const DEFAULT_SLOTS: MerchantAvailableSlot[] = [
  { id: 's-1', dayOfWeek: 'Segunda', time: '08:30', isAvailable: true, period: 'MANHA' },
  { id: 's-2', dayOfWeek: 'Segunda', time: '10:00', isAvailable: true, period: 'MANHA' },
  { id: 's-3', dayOfWeek: 'Segunda', time: '11:30', isAvailable: true, period: 'MANHA' },
  { id: 's-4', dayOfWeek: 'Segunda', time: '14:00', isAvailable: true, period: 'TARDE' },
  { id: 's-5', dayOfWeek: 'Segunda', time: '15:30', isAvailable: true, period: 'TARDE' },
  { id: 's-6', dayOfWeek: 'Segunda', time: '17:00', isAvailable: true, period: 'TARDE' },
  
  { id: 's-7', dayOfWeek: 'Terça', time: '09:00', isAvailable: true, period: 'MANHA' },
  { id: 's-8', dayOfWeek: 'Terça', time: '10:30', isAvailable: true, period: 'MANHA' },
  { id: 's-9', dayOfWeek: 'Terça', time: '14:00', isAvailable: true, period: 'TARDE' },
  { id: 's-10', dayOfWeek: 'Terça', time: '16:00', isAvailable: true, period: 'TARDE' },

  { id: 's-11', dayOfWeek: 'Quarta', time: '08:30', isAvailable: true, period: 'MANHA' },
  { id: 's-12', dayOfWeek: 'Quarta', time: '10:30', isAvailable: true, period: 'MANHA' },
  { id: 's-13', dayOfWeek: 'Quarta', time: '14:00', isAvailable: true, period: 'TARDE' },
  { id: 's-14', dayOfWeek: 'Quarta', time: '15:30', isAvailable: true, period: 'TARDE' },

  { id: 's-15', dayOfWeek: 'Quinta', time: '09:00', isAvailable: true, period: 'MANHA' },
  { id: 's-16', dayOfWeek: 'Quinta', time: '11:00', isAvailable: true, period: 'MANHA' },
  { id: 's-17', dayOfWeek: 'Quinta', time: '14:30', isAvailable: true, period: 'TARDE' },
  { id: 's-18', dayOfWeek: 'Quinta', time: '16:30', isAvailable: true, period: 'TARDE' },

  { id: 's-19', dayOfWeek: 'Sexta', time: '08:30', isAvailable: true, period: 'MANHA' },
  { id: 's-20', dayOfWeek: 'Sexta', time: '10:00', isAvailable: true, period: 'MANHA' },
  { id: 's-21', dayOfWeek: 'Sexta', time: '14:00', isAvailable: true, period: 'TARDE' },
  { id: 's-22', dayOfWeek: 'Sexta', time: '16:00', isAvailable: true, period: 'TARDE' },

  { id: 's-23', dayOfWeek: 'Sábado', time: '09:00', isAvailable: true, period: 'MANHA' },
  { id: 's-24', dayOfWeek: 'Sábado', time: '10:30', isAvailable: true, period: 'MANHA' },
  { id: 's-25', dayOfWeek: 'Sábado', time: '12:00', isAvailable: true, period: 'MANHA' }
];

export const MerchantScheduleManager: React.FC<MerchantScheduleManagerProps> = ({
  merchant,
  onSaveSchedule,
  onSavePricing
}) => {
  const { updateStoreProfile, triggerToast } = useApp();

  const [activeTab, setActiveTab] = useState<'schedule' | 'pricing' | 'credentials'>('schedule');

  // Schedule state
  const [workingDays, setWorkingDays] = useState(
    merchant.scheduleConfig?.workingDays || DEFAULT_DAYS
  );
  const [slotDuration, setSlotDuration] = useState(
    merchant.scheduleConfig?.slotDurationMinutes || 45
  );
  const [modalities, setModalities] = useState<('ESTABELECIMENTO' | 'DOMICILIO' | 'ONLINE')[]>(
    merchant.scheduleConfig?.serviceExecutionModalities || ['ESTABELECIMENTO', 'DOMICILIO']
  );
  const [advanceNotice, setAdvanceNotice] = useState(
    merchant.scheduleConfig?.advanceNoticeHours || 2
  );
  const [customSlots, setCustomSlots] = useState<MerchantAvailableSlot[]>(
    merchant.scheduleConfig?.customSlots || DEFAULT_SLOTS
  );
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Segunda');
  const [newSlotTime, setNewSlotTime] = useState('11:00');

  // Pricing Table state (Hora, Dia, Mês)
  const [hourlyRate, setHourlyRate] = useState<string>(
    merchant.pricingTable?.hourlyRate?.toString() || '80.00'
  );
  const [dailyRate, setDailyRate] = useState<string>(
    merchant.pricingTable?.dailyRate?.toString() || '250.00'
  );
  const [monthlyRate, setMonthlyRate] = useState<string>(
    merchant.pricingTable?.monthlyRate?.toString() || '450.00'
  );
  const [pricingNotes, setPricingNotes] = useState(
    merchant.pricingTable?.pricingNotes ||
      'Deslocamento incluso para o Centro, Papucaia e Japuíba. Peças e materiais orçados à parte com total transparência.'
  );

  // Professional Credentials & References state
  const [registrationNumber, setRegistrationNumber] = useState(
    merchant.credentials?.registrationNumber || ''
  );
  const [registrationEntity, setRegistrationEntity] = useState(
    merchant.credentials?.registrationEntity || ''
  );
  const [experienceYears, setExperienceYears] = useState<string>(
    merchant.credentials?.experienceYears?.toString() || '8'
  );
  const [warrantyInfo, setWarrantyInfo] = useState(
    merchant.credentials?.warrantyInfo || '90 dias de garantia legal com emissão de nota fiscal de serviços.'
  );
  const [references, setReferences] = useState<ProfessionalReference[]>(
    merchant.references || [
      { name: 'Dr. Roberto Silveira', phone: '(21) 98877-6655', relationshipOrRole: 'Cliente Residencial' },
      { name: 'Condomínio Solar Macacu', phone: '(21) 99123-4567', relationshipOrRole: 'Manutenção Predial' }
    ]
  );
  const [newRefName, setNewRefName] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');
  const [newRefRole, setNewRefRole] = useState('');

  // Handlers for working days
  const handleToggleDay = (dayName: string) => {
    setWorkingDays((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const handleUpdateDayHours = (dayName: string, field: 'startHour' | 'endHour', value: string) => {
    setWorkingDays((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, [field]: value } : d))
    );
  };

  // Handlers for slots
  const handleToggleSlotAvailability = (slotId: string) => {
    setCustomSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, isAvailable: !s.isAvailable } : s))
    );
  };

  const handleAddSlot = () => {
    if (!newSlotTime) return;
    const hourNum = parseInt(newSlotTime.split(':')[0], 10);
    const period = hourNum < 12 ? 'MANHA' : hourNum < 18 ? 'TARDE' : 'NOITE';

    const newSlot: MerchantAvailableSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: selectedDayFilter,
      time: newSlotTime,
      isAvailable: true,
      period
    };

    setCustomSlots((prev) => [...prev, newSlot]);
    triggerToast(`Horário ${newSlotTime} adicionado para ${selectedDayFilter}!`);
  };

  const handleDeleteSlot = (slotId: string) => {
    setCustomSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  // Handlers for references
  const handleAddReference = () => {
    if (!newRefName || !newRefPhone) {
      alert('Preencha o nome e o telefone da referência.');
      return;
    }
    setReferences((prev) => [
      ...prev,
      {
        name: newRefName,
        phone: newRefPhone,
        relationshipOrRole: newRefRole || 'Cliente de Referência'
      }
    ]);
    setNewRefName('');
    setNewRefPhone('');
    setNewRefRole('');
    triggerToast('Referência adicionada!');
  };

  const handleDeleteReference = (idx: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save All
  const handleSaveAll = () => {
    const scheduleData: MerchantScheduleConfig = {
      workingDays,
      slotDurationMinutes: slotDuration,
      serviceExecutionModalities: modalities,
      advanceNoticeHours: advanceNotice,
      customSlots
    };

    const pricingData: ServicePricingTable = {
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
      pricingNotes
    };

    const credentialsData: ProfessionalCredentials = {
      registrationNumber: registrationNumber || undefined,
      registrationEntity: registrationEntity || undefined,
      experienceYears: experienceYears ? parseInt(experienceYears, 10) : undefined,
      warrantyInfo
    };

    updateStoreProfile(merchant.id, {
      scheduleConfig: scheduleData,
      pricingTable: pricingData,
      credentials: credentialsData,
      references
    });

    if (onSaveSchedule) onSaveSchedule(scheduleData);
    if (onSavePricing) onSavePricing(pricingData, credentialsData, references);

    triggerToast('Agenda, Tabela de Preços e Credenciais salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Gestão de Agenda & Transparência do Prestador</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {merchant.name}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Configure os dias e horários livres para que os clientes agendem diretamente pelo Achei Aqui.
              Defina também sua tabela de preços transparente (hora, dia e mês) e suas credenciais profissionais.
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2 self-start sm:self-auto shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center space-x-2 mt-5 border-t border-slate-800 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda & Horas Vagas</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Tabela de Preços (Hora, Dia e Mês)</span>
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'credentials'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Credenciais & Referências</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SCHEDULE & AVAILABLE SLOTS */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Modalidades de Atendimento */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Modalidades de Atendimento Aceitas</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                  modalities.includes('ESTABELECIMENTO')
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={modalities.includes('ESTABELECIMENTO')}
                  onChange={(e) => {
                    if (e.target.checked) setModalities((prev) => [...prev, 'ESTABELECIMENTO']);
                    else setModalities((prev) => prev.filter((m) => m !== 'ESTABELECIMENTO'));
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-bold">No Estabelecimento / Consultório</div>
                  <div className="text-[10px] text-slate-500 font-normal">Cliente vai até seu endereço</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                  modalities.includes('DOMICILIO')
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={modalities.includes('DOMICILIO')}
                  onChange={(e) => {
                    if (e.target.checked) setModalities((prev) => [...prev, 'DOMICILIO']);
                    else setModalities((prev) => prev.filter((m) => m !== 'DOMICILIO'));
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-bold">Em Domicílio (Móvel)</div>
                  <div className="text-[10px] text-slate-500 font-normal">Atendimento no local do cliente</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                  modalities.includes('ONLINE')
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={modalities.includes('ONLINE')}
                  onChange={(e) => {
                    if (e.target.checked) setModalities((prev) => [...prev, 'ONLINE']);
                    else setModalities((prev) => prev.filter((m) => m !== 'ONLINE'));
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div className="text-xs">
                  <div className="font-bold">Online / Teleconsulta</div>
                  <div className="text-[10px] text-slate-500 font-normal">Videochamada, aulas e orientações</div>
                </div>
              </label>
            </div>
          </div>

          {/* Dias e Horários de Funcionamento da Semana */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Dias de Atendimento na Semana</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Marque os dias em que sua agenda está aberta e os horários de início e término.
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-600">Duração média da vaga:</span>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora (60 min)</option>
                  <option value={90}>1h30 (90 min)</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              {workingDays.map((d) => (
                <div
                  key={d.day}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    d.isOpen ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(d.day)}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                        d.isOpen ? 'bg-blue-600 text-white' : 'bg-slate-300 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <span className={`font-bold w-20 ${d.isOpen ? 'text-slate-900' : 'text-slate-500 line-through'}`}>
                      {d.day}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        d.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {d.isOpen ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>

                  {d.isOpen && (
                    <div className="flex items-center space-x-2 text-slate-700">
                      <span className="text-slate-500">Das:</span>
                      <input
                        type="time"
                        value={d.startHour}
                        onChange={(e) => handleUpdateDayHours(d.day, 'startHour', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                      <span className="text-slate-500">às</span>
                      <input
                        type="time"
                        value={d.endHour}
                        onChange={(e) => handleUpdateDayHours(d.day, 'endHour', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Vagas e Horários Disponíveis para o Cliente Agendar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Grade Interativa de Horas Vagas por Dia</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Clique em um horário para alternar entre <strong>VAGA LIVRE (Verde)</strong> e <strong>BLOQUEADO (Cinza)</strong>.
                </p>
              </div>

              {/* Day filter selector */}
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {workingDays.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDayFilter(d.day)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedDayFilter === d.day
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d.day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Slots for selected day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Vagas de <strong>{selectedDayFilter}</strong>:
                </span>

                {/* Add new time slot */}
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Vaga</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {customSlots
                  .filter((s) => s.dayOfWeek === selectedDayFilter)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-2.5 rounded-xl border text-center relative group transition-all ${
                        slot.isAvailable
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                          : 'bg-slate-100 border-slate-300 text-slate-400 line-through'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSlotAvailability(slot.id)}
                        className="w-full text-xs block"
                      >
                        <span className="block text-sm font-black">{slot.time}</span>
                        <span className="text-[10px] uppercase font-bold tracking-tight block mt-0.5">
                          {slot.isAvailable ? '✓ Vaga Livre' : '✕ Bloqueado'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Remover horário"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>

              {customSlots.filter((s) => s.dayOfWeek === selectedDayFilter).length === 0 && (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Nenhum horário cadastrado para {selectedDayFilter}. Adicione novas vagas no botão acima.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRICING TABLE (HORA, DIA, MÊS) */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Tabela de Preços Transparente (Hora, Dia e Mês)</span>
              </h4>
              <p className="text-xs text-slate-500">
                Informe os valores praticados para que o cliente de Cachoeiras de Macacu tenha transparência total na contratação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Valor da Hora */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <label className="block text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Valor da Hora (R$) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="80,00"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  Cobrança por hora para consultas, aulas avulsas ou serviços rápidos de reparo.
                </p>
              </div>

              {/* Valor do Dia / Diária */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Valor da Diária / Dia (R$) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="5.00"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="250,00"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-emerald-800 leading-relaxed">
                  Diária completa de trabalho (até 8h). Indicado para reformas, diárias técnicas e eventos.
                </p>
              </div>

              {/* Valor do Mês */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                <label className="block text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>Valor do Mês / Mensalidade (R$) *</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="10.00"
                    value={monthlyRate}
                    onChange={(e) => setMonthlyRate(e.target.value)}
                    placeholder="450,00"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-purple-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-[10px] text-purple-800 leading-relaxed">
                  Pacote mensal de aulas/cursos, manutenção preventiva predial recorrente ou estética mensal.
                </p>
              </div>
            </div>

            {/* Observações de Precificação */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Observações de Cobrança & Deslocamento:
              </label>
              <textarea
                rows={3}
                value={pricingNotes}
                onChange={(e) => setPricingNotes(e.target.value)}
                placeholder="Ex: Peças e insumos cobrados à parte. Atendimento gratuito no Centro, Papucaia e Japuíba..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CREDENTIALS & REFERENCES */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Habilitação & Credenciais Profissionais</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Registro Profissional (CRM, CRO, CREA, OAB, CRP, etc.)
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Ex: CRO-RJ 48920 ou CREA-RJ 2021190"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Órgão Fiscalizador / Entidade Emissora
                </label>
                <input
                  type="text"
                  value={registrationEntity}
                  onChange={(e) => setRegistrationEntity(e.target.value)}
                  placeholder="Ex: Conselho Regional de Odontologia do RJ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anos de Experiência Comprovada
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="Ex: 8"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Termo de Garantia do Serviço
                </label>
                <input
                  type="text"
                  value={warrantyInfo}
                  onChange={(e) => setWarrantyInfo(e.target.value)}
                  placeholder="Ex: 90 dias com emissão de nota fiscal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Referências Profissionais */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Referências Profissionais para Transparência</span>
              </h4>
              <p className="text-xs text-slate-500">
                Adicione contatos de clientes anteriores ou empresas que comprovam sua seriedade e qualidade.
              </p>
            </div>

            {/* List of references */}
            <div className="space-y-2">
              {references.map((ref, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{ref.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {ref.relationshipOrRole} • <span className="font-mono text-emerald-700 font-semibold">{ref.phone}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReference(idx)}
                    className="text-rose-600 hover:text-rose-800 p-1 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new reference form */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Adicionar Nova Referência:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Cliente / Empresa"
                  value={newRefName}
                  onChange={(e) => setNewRefName(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="tel"
                  placeholder="Telefone / WhatsApp"
                  value={newRefPhone}
                  onChange={(e) => setNewRefPhone(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Tipo de Serviço Prestado"
                  value={newRefRole}
                  onChange={(e) => setNewRefRole(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleAddReference}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Referência</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
