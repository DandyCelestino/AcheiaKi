import React from 'react';
import {
  Clock,
  Calendar,
  CalendarDays,
  ShieldCheck,
  Award,
  FileCheck2,
  Phone,
  UserCheck,
  HelpCircle,
  Sparkles,
  MapPin
} from 'lucide-react';
import { ServicePricingTable, ProfessionalCredentials, ProfessionalReference } from '../../types';

interface ServicePricingTableCardProps {
  pricingTable?: ServicePricingTable;
  credentials?: ProfessionalCredentials;
  references?: ProfessionalReference[];
  basePrice?: number;
  providerName: string;
  categoryName?: string;
  onSelectPricingPlan?: (plan: 'HORA' | 'DIARIA' | 'MENSAL' | 'SERVICO_FIXO' | 'ORCAMENTO') => void;
  selectedPlan?: string;
  isSelectable?: boolean;
}

export const ServicePricingTableCard: React.FC<ServicePricingTableCardProps> = ({
  pricingTable,
  credentials,
  references,
  basePrice,
  providerName,
  categoryName,
  onSelectPricingPlan,
  selectedPlan = 'SERVICO_FIXO',
  isSelectable = false
}) => {
  return (
    <div className="space-y-4">
      {/* Tabela de Preços Transparente: Hora, Dia e Mês */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs sm:text-sm tracking-wide uppercase">
              Tabela de Preços & Modalidades de Contratação
            </h4>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
            Transparência Total
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Confira as opções de contratação por período para <strong>{providerName}</strong>. 
            Escolha o modelo ideal para a sua necessidade em Cachoeiras de Macacu:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opção 1: Por Hora */}
            <div
              onClick={() => isSelectable && onSelectPricingPlan && onSelectPricingPlan('HORA')}
              className={`p-3.5 rounded-xl border transition-all relative ${
                isSelectable ? 'cursor-pointer' : ''
              } ${
                selectedPlan === 'HORA'
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Valor por Hora</span>
                </span>
                {selectedPlan === 'HORA' && isSelectable && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </div>
              <div className="text-lg font-black text-slate-900">
                {pricingTable?.hourlyRate ? (
                  <>R$ {pricingTable.hourlyRate.toFixed(2).replace('.', ',')}<span className="text-xs font-normal text-slate-500">/h</span></>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Sob consulta</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Ideal para consultas avulsas, pequenos consertos e aulas específicas.
              </p>
            </div>

            {/* Opção 2: Por Dia / Diária */}
            <div
              onClick={() => isSelectable && onSelectPricingPlan && onSelectPricingPlan('DIARIA')}
              className={`p-3.5 rounded-xl border transition-all relative ${
                isSelectable ? 'cursor-pointer' : ''
              } ${
                selectedPlan === 'DIARIA'
                  ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>Valor do Dia (Diária)</span>
                </span>
                {selectedPlan === 'DIARIA' && isSelectable && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                )}
              </div>
              <div className="text-lg font-black text-slate-900">
                {pricingTable?.dailyRate ? (
                  <>R$ {pricingTable.dailyRate.toFixed(2).replace('.', ',')}<span className="text-xs font-normal text-slate-500">/dia</span></>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Sob consulta</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Jornada completa (até 8 horas). Perfeito para reformas e atendimentos imersivos.
              </p>
            </div>

            {/* Opção 3: Por Mês / Mensalidade */}
            <div
              onClick={() => isSelectable && onSelectPricingPlan && onSelectPricingPlan('MENSAL')}
              className={`p-3.5 rounded-xl border transition-all relative ${
                isSelectable ? 'cursor-pointer' : ''
              } ${
                selectedPlan === 'MENSAL'
                  ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                  <CalendarDays className="w-3 h-3 text-purple-600" />
                  <span>Valor do Mês</span>
                </span>
                {selectedPlan === 'MENSAL' && isSelectable && (
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                )}
              </div>
              <div className="text-lg font-black text-slate-900">
                {pricingTable?.monthlyRate ? (
                  <>R$ {pricingTable.monthlyRate.toFixed(2).replace('.', ',')}<span className="text-xs font-normal text-slate-500">/mês</span></>
                ) : (
                  <span className="text-xs font-semibold text-slate-400">Sob consulta</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Mensalidade recorrente para cursos, planos estéticos ou manutenção preventiva.
              </p>
            </div>
          </div>

          {/* Observações de Precificação */}
          {pricingTable?.pricingNotes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950 font-bold">Informações Adicionais de Cobrança:</strong>
                <span>{pricingTable.pricingNotes}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credenciais Profissionais & Registro */}
      {credentials && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                Credenciais & Habilitação Profissional
              </h5>
            </div>
            {credentials.registrationNumber && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold text-[11px] rounded-lg border border-blue-200">
                {credentials.registrationNumber}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {credentials.registrationEntity && (
              <div className="flex items-center space-x-2 text-slate-700">
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Órgão Fiscalizador: <strong>{credentials.registrationEntity}</strong></span>
              </div>
            )}

            {credentials.experienceYears && (
              <div className="flex items-center space-x-2 text-slate-700">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Experiência Comprovada: <strong>{credentials.experienceYears} anos</strong> em Macacu</span>
              </div>
            )}

            {credentials.warrantyInfo && (
              <div className="sm:col-span-2 flex items-start space-x-2 text-slate-700 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Garantia & Emissão Fiscal:</strong>
                  <span>{credentials.warrantyInfo}</span>
                </div>
              </div>
            )}
          </div>

          {/* Especializações e Certificados */}
          {credentials.specializations && credentials.specializations.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                Especialidades & Áreas de Atuação:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {credentials.specializations.map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referências Profissionais para Transparência Total */}
      {references && references.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-slate-900">
                Referências Profissionais Verificadas
              </h5>
              <p className="text-[11px] text-slate-500">
                Clientes e estabelecimentos que atestam a qualidade e pontualidade do prestador.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {references.map((ref, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <strong className="text-slate-900 font-bold">{ref.name}</strong>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-semibold">
                      {ref.relationshipOrRole}
                    </span>
                  </div>
                  {ref.notes && <p className="text-slate-600 text-[11px] mt-0.5 italic">"{ref.notes}"</p>}
                </div>

                {ref.phone && (
                  <span className="text-slate-600 font-mono text-[11px] flex items-center space-x-1 self-start sm:self-auto bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{ref.phone}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
