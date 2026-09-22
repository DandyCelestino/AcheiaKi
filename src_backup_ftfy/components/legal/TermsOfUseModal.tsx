import React from 'react';
import { Scale, BookOpen, CheckCircle2, X, AlertTriangle, ShieldCheck, ShoppingBag, Clock, Sparkles } from 'lucide-react';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfUseModal: React.FC<TermsOfUseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Código de Defesa do Consumidor (CDC) & Decreto nº 7.962/2013
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Termos de Uso, Regras do Marketplace & Condições Gerais
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
            <div className="flex items-center space-x-2 font-black text-xs uppercase tracking-wider text-amber-800">
              <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Contrato de Adesão & Regras de Convivência Comercial</span>
            </div>
            <p className="text-xs text-slate-700">
              Estes Termos de Uso regulam o acesso e a utilização da plataforma digital <strong>Achei Aqui</strong>, desenvolvida e de titularidade de <strong>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</strong>, sediada e operada em Cachoeiras de Macacu - RJ. Ao se cadastrar ou navegar na plataforma, o usuário declara ter lido, compreendido e concordado integralmente com as presentes regras.
            </p>
          </div>

          {/* 1. Modalities */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>1. Modalidades Operacionais Disponíveis</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">🚴 1. Delivery com Rastreio:</strong>
                Entrega direta no endereço do cliente em Cachoeiras de Macacu, Papucaia, Japuíba e distritos, com taxa de entrega informada antes da confirmação do pedido.
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">🏪 2. Retirada no Balcão com Código:</strong>
                O cliente recebe um código alfanumérico e de segurança exclusivo (ex: RET-8X42K9) para validação presencial na loja física parceira.
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">👗 3. Provador VIP / Experimentação em Casa:</strong>
                Reserva de peças no tamanho do cliente com base na ficha de medidas por até 48 horas para experimentação segura, exigindo documento de identidade válido.
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">📅 4. Agendamento de Serviços & Consultas:</strong>
                Marcação direta de horário com profissionais liberais (médicos, dentistas, eletricistas, advogados, técnicos) com resposta oficial em até 2 horas.
              </div>
            </div>
          </div>

          {/* 2. Merchant Tiers and Rules */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>2. Planos de Adesão para Lojistas e Prestadores de Serviços</span>
            </h4>
            <p className="text-slate-600">
              O credenciamento de estabelecimentos é estruturado em modalidades transparentes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1 text-xs">
              <li>
                <strong>Plano Grátis (Start):</strong> Sem custo fixo de mensalidade. Limite de até <strong>5 produtos</strong> cadastrados. Comissão de <strong>12% por venda realizada</strong> (pague somente quando vender). Os dados de contato e endereço do comprador são liberados para a loja após a liquidação da comissão da plataforma e confirmação do Administrador Master.
              </li>
              <li>
                <strong>Plano Bronze (R$ 29,90/mês):</strong> Até <strong>20 produtos</strong>. Comissão reduzida de <strong>8%</strong>. Liberação dos dados do comprador após confirmação de estoque pelo lojista.
              </li>
              <li>
                <strong>Plano Prata (R$ 59,90/mês):</strong> Até <strong>60 produtos</strong>. Comissão de <strong>5%</strong>. Liberação imediata de dados e destaque em buscas da categoria.
              </li>
              <li>
                <strong>Plano Ouro (R$ 99,90/mês):</strong> Até <strong>150 produtos</strong>. Taxa mínima de <strong>3%</strong>. Notificações instantâneas em tempo real, suporte VIP e alta prioridade de exibição.
              </li>
              <li>
                <strong>Plano Premium (R$ 179,90/mês - Tudo Liberado):</strong> Produtos <strong>ILIMITADOS</strong>. Menor taxa operacional (<strong>1%</strong>). Acesso irrestrito a dados de compradores em tempo real, super destaque na vitrine principal e atendimento VIP dedicado.
              </li>
            </ul>
          </div>

          {/* 3. Consumer Rights CDC */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>3. Direitos do Consumidor e Direito de Arrependimento (Art. 49 CDC)</span>
            </h4>
            <p className="text-slate-600">
              Em estrita obediência ao <strong>Artigo 49 da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor)</strong> e ao <strong>Decreto Federal nº 7.962/2013</strong>:
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <p>
                O consumidor tem o direito de desistir da compra efetuada fora do estabelecimento comercial (delivery ou pedidos online) no prazo improrrogável de <strong>7 (sete) dias corridos</strong> a contar do recebimento do produto.
              </p>
              <p className="text-slate-500">
                Os lojistas e prestadores parceiros são os únicos e exclusivos responsáveis pela qualidade, garantia legal (90 dias para bens duráveis, Art. 26 CDC), autenticidade dos produtos e emissão do respectivo documento fiscal (Nota Fiscal Eletrônica ou Cupom Fiscal).
              </p>
            </div>
          </div>

          {/* 4. Mutual Reviews and Ethics */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>4. Política de Reputação & Avaliações Mútuas</span>
            </h4>
            <p className="text-slate-600">
              A plataforma adota sistema bilateral de avaliação. Clientes avaliam a qualidade, atendimento e pontualidade da loja; lojistas avaliam a cordialidade, pontualidade de retirada e cumprimento dos combinados. É vedada a publicação de comentários ofensivos, difamatórios, fraudulentos ou com fins de concorrência desleal, sob pena de exclusão da conta e processo judicial.
            </p>
          </div>

          {/* 5. Jurisdiction and Dispute Resolution */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <strong className="text-slate-900 block">Legislação Aplicável e Foro de Eleição:</strong>
              <span>Aplica-se a legislação da República Federativa do Brasil, elegendo-se o <strong>Foro da Comarca de Cachoeiras de Macacu - RJ</strong> para dirimir quaisquer litígios.</span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 shrink-0">
              Edição: 2026
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Termos e Condições Comerciais em Conformidade com o CDC</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Entendido & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
