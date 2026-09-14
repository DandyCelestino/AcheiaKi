import React from 'react';
import { ShieldCheck, Scale, FileText, CheckCircle2, Lock, X, Award, AlertTriangle, Globe } from 'lucide-react';

interface CopyrightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserManual?: (tab?: 'CLIENTES' | 'LOGISTAS' | 'LEGAL') => void;
  onOpenTermsModal?: () => void;
  onOpenPrivacyModal?: () => void;
  onOpenPlansModal?: () => void;
}

export const CopyrightModal: React.FC<CopyrightModalProps> = ({
  isOpen,
  onClose,
  onOpenUserManual,
  onOpenTermsModal,
  onOpenPrivacyModal,
  onOpenPlansModal
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Declaração Oficial & Registro de Propriedade Intelectual
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Direitos Autorais & Propriedade Intelectual
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
          {/* Highlight Author Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-emerald-800 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Titularidade & Criação Original Exclusiva</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                Bex Serviços e Comércios
              </h3>
              <p className="text-xs text-slate-700 mt-0.5">
                Inscrição no Cadastro Nacional da Pessoa Jurídica (CNPJ/MF): <strong>30.810.800/0001-39</strong>
              </p>
              <p className="text-[11px] text-emerald-800 mt-1">
                Autora, Criadora, Desenvolvedora e Detentora Universal dos Direitos Patrimoniais e Morais da Obra.
              </p>
            </div>
            <div className="px-3 py-2 bg-white rounded-xl border border-emerald-300 text-center shrink-0 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Jurisdição</span>
              <span className="text-xs font-black text-emerald-800">Brasil & Internacional</span>
            </div>
          </div>

          {/* Legal Basis Section */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>1. Fundamentação Jurídica Nacional e Internacional</span>
            </h4>
            <p className="text-slate-600">
              A presente plataforma digital, sua arquitetura técnica, código-fonte, layout visual, modelo de negócios, sistema de classificação de categorias e módulos integrados são protegidos irrestritamente pelas normas de Direito Autoral e Propriedade Intelectual vigentes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">Legislação Brasileira:</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                  <li><strong>Lei nº 9.610/1998</strong> (Lei de Direitos Autorais - LDA)</li>
                  <li><strong>Lei nº 9.609/1998</strong> (Proteção da Propriedade Intelectual de Software)</li>
                  <li><strong>Constituição Federal</strong> (Art. 5º, XXVII e XXVIII)</li>
                  <li><strong>Código Civil Brasileiro</strong> (Lei nº 10.406/2002)</li>
                  <li><strong>Marco Civil da Internet</strong> (Lei nº 12.965/2014)</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900 block font-bold mb-1">Tratados e Acordos Internacionais:</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                  <li><strong>Convenção de Berna</strong> para a Proteção das Obras Literárias e Artísticas (Decreto nº 75.699/1975)</li>
                  <li><strong>Tratados da OMPI / WIPO</strong> (Copyright Treaty - WCT)</li>
                  <li><strong>Acordo TRIPS / OMC</strong> (Aspectos dos Direitos de Propriedade Intelectual Relacionados ao Comércio)</li>
                  <li><strong>Convenção Universal sobre Direito de Autor</strong> (UNESCO)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scope of Protected Assets */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>2. Escopo dos Elementos Protegidos</span>
            </h4>
            <p className="text-slate-600">
              Estão sob a titularidade e guarda exclusiva de <strong>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1">
              <li><strong>Código-fonte e Arquitetura de Software:</strong> Toda a lógica de front-end, back-end, esquemas de dados, componentes React, serviços de mensageria WhatsApp e regras de controle de acesso (RBAC).</li>
              <li><strong>Módulos Inovadores Exclusivos:</strong> Sistema de Dossiê 360° com auditoria em tempo real, Provador VIP com ficha de medidas, motor de leilão de espaços publicitários e regras de liberação progressiva de dados por planos (Grátis, Bronze, Prata, Ouro, Premium).</li>
              <li><strong>Identidade Visual e Design de Interface (UI/UX):</strong> O design exclusivo inspirado nas florestas e matas de Cachoeiras de Macacu - RJ, iconografia, disposição de blocos e paleta de cores verde serra.</li>
              <li><strong>Taxonomia Municipal & Organização de Conteúdo:</strong> A estruturação dos comércios e prestadores de serviços nos bairros Centro, Papucaia, Japuíba, Faraó, Guapiaçu e adjacências.</li>
            </ul>
          </div>

          {/* Restrictions and Prohibitions */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>3. Vedações Expressas e Sanções Cíveis e Penais</span>
            </h4>
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-950 space-y-2">
              <p className="font-bold text-xs">
                É ESTRITAMENTE PROIBIDO a qualquer pessoa física ou jurídica, sem autorização prévia, expressa e por escrito da titular Bex Serviços e Comércios, CNPJ 30.810.800/0001-39:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-red-900">
                <li>Copiar, reproduzir, descompilar, realizar engenharia reversa ou criar obras derivadas deste software;</li>
                <li>Utilizar técnicas de web scraping, mineração de dados automatizada ou captura indevida de dados cadastrais;</li>
                <li>Comercializar, sublicenciar, ceder, alugar ou explorar economicamente esta aplicação sem licença formal;</li>
                <li>Remover ou alterar avisos de direitos autorais, marcas ou identificadores de autoria.</li>
              </ul>
              <p className="text-[11px] text-red-800 pt-1">
                A violação dos direitos autorais é crime tipificado no <strong>Artigo 184 do Código Penal Brasileiro</strong>, além de ensejar reparações indenizatórias por perdas e danos, lucros cessantes e multas cominatórias conforme os <strong>Artigos 101 a 110 da Lei Federal nº 9.610/98</strong>.
              </p>
            </div>
          </div>

          {/* Contact for licensing */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <strong className="text-slate-900 block">Contato Oficial do Autor para Parcerias e Licenciamento:</strong>
              <span>E-mail: <strong className="text-emerald-700">telecom.david@gmail.com</strong> | Foro da Comarca de Cachoeiras de Macacu - RJ</span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 shrink-0">
              Ano de Registro: 2026
            </div>
          </div>

          {/* Atalhos Rápidos Abaixo dos Direitos Autorais */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Atalhos Rápidos • Normas, Manuais & Transparência
              </span>
              <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                Acesso Imediato
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenUserManual) onOpenUserManual('CLIENTES');
                }}
                className="p-2.5 bg-white/10 hover:bg-emerald-600/80 border border-white/15 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] text-amber-300 font-bold block group-hover:text-white">Passo a Passo</span>
                <strong className="text-white text-xs block truncate">Manual do Cliente</strong>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenUserManual) onOpenUserManual('LOGISTAS');
                }}
                className="p-2.5 bg-white/10 hover:bg-purple-600/80 border border-white/15 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] text-purple-300 font-bold block group-hover:text-white">Vendas & Banners</span>
                <strong className="text-white text-xs block truncate">Manual do Lojista</strong>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPrivacyModal) onOpenPrivacyModal();
                }}
                className="p-2.5 bg-white/10 hover:bg-blue-600/80 border border-white/15 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] text-blue-300 font-bold block group-hover:text-white">Privacidade</span>
                <strong className="text-white text-xs block truncate">Política LGPD</strong>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPlansModal) onOpenPlansModal();
                }}
                className="p-2.5 bg-white/10 hover:bg-amber-600/80 border border-white/15 rounded-xl text-left transition-all cursor-pointer group"
              >
                <span className="text-[10px] text-amber-300 font-bold block group-hover:text-white">Planos & Taxas</span>
                <strong className="text-white text-xs block truncate">Tabela de Planos</strong>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Documento Jurídico Válido e Registrado</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Entendido & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
