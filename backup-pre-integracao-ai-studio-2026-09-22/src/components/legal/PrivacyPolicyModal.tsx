import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, X, Eye, Database, UserCheck, AlertCircle } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                LGPD (Lei nº 13.709/2018) & Padrões Globais (GDPR)
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Política de Privacidade & Proteção de Dados
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
          {/* Intro Box */}
          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 space-y-1.5">
            <div className="flex items-center space-x-2 font-black text-xs uppercase tracking-wider text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Compromisso com a Privacidade e Segurança da Informação</span>
            </div>
            <p className="text-xs text-slate-700">
              O <strong>Achei Aqui</strong>, operado sob a titularidade e responsabilidade técnica de <strong>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</strong>, adota rigorosas medidas de segurança técnica, criptográfica e administrativa para garantir a confidencialidade, integridade e privacidade de todos os dados pessoais coletados de clientes, lojistas e prestadores de serviços.
            </p>
          </div>

          {/* 1. Principles and Legal Basis */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>1. Princípios e Fundamentos Legais (Art. 6º e 7º da LGPD)</span>
            </h4>
            <p className="text-slate-600">
              O tratamento de dados pessoais nesta plataforma é regido estritamente pelos seguintes princípios da Lei Geral de Proteção de Dados:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900">Finalidade & Adequação:</strong> Coleta exclusiva para viabilizar pedidos, entregas, provador VIP, agendamentos e emissão de notas.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900">Necessidade (Minimização):</strong> Coleta restrita ao mínimo indispensável para a execução do contrato de compra e venda.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900">Segurança & Prevenção:</strong> Autenticação multifator (2FA), criptografia em trânsito e armazenamento seguro em nuvem.
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="text-slate-900">Transparência & Livre Acesso:</strong> O titular pode consultar e atualizar seus dados cadastrais e preferências a qualquer momento.
              </div>
            </div>
          </div>

          {/* 2. Collected Data */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>2. Dados Coletados e Finalidades Específicas</span>
            </h4>
            <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1">
              <li>
                <strong>Clientes / Compradores:</strong> Nome completo, CPF, telefone/WhatsApp, e-mail, endereços de entrega e preferências de provador VIP (medidas fornecidas voluntariamente para reserva de peças).
              </li>
              <li>
                <strong>Lojistas e Prestadores de Serviços:</strong> Razão Social / Nome Fantasia, CNPJ/CPF, documento de identidade (RG), dados de contato, endereço físico, registros profissionais (CRM, CREA, CRO, OAB etc.) e referências para credenciamento.
              </li>
              <li>
                <strong>Logs de Navegação & Auditoria:</strong> Endereço IP, data/hora dos acessos e confirmações transacionais, mantidos em cumprimento ao <strong>Artigo 15 do Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
              </li>
            </ul>
          </div>

          {/* 3. Account Isolation & Buyer Data Protection */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>3. Sigilo Absoluto e Regras de Liberação de Dados por Modalidade</span>
            </h4>
            <p className="text-slate-600">
              Garantimos o <strong>isolamento completo de dados entre estabelecimentos comerciais</strong>. Lojistas e prestadores só têm acesso aos pedidos direcionados à sua própria loja.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1">
              <strong className="block font-bold">Regra Específica do Plano Grátis:</strong>
              <p>
                Em conformidade com as regras operacionais da plataforma, para estabelecimentos vinculados à modalidade Grátis, os dados completos de identificação do comprador (endereço exato e telefone completo) permanecem sob custódia e proteção da plataforma, sendo liberados para visualização do vendedor mediante o adimplemento da comissão devida e respectiva confirmação do Administrador Master.
              </p>
            </div>
          </div>

          {/* 4. Rights of Data Subjects */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 text-sm sm:text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>4. Direitos dos Titulares de Dados (Art. 18 da LGPD)</span>
            </h4>
            <p className="text-slate-600">
              A qualquer momento e mediante requisição gratuita, o usuário pode exercer seus direitos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
              <li>Confirmação da existência de tratamento e acesso aos dados pessoais;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados através do painel "Minha Conta";</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
              <li>Revogação do consentimento para envio de comunicações promocionais e alertas.</li>
            </ul>
          </div>

          {/* 5. DPO Contact */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <strong className="text-slate-900 block">Encarregado de Proteção de Dados (DPO):</strong>
              <span>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39 | E-mail: <strong className="text-blue-700">telecom.david@gmail.com</strong></span>
            </div>
            <div className="text-[11px] font-bold text-slate-500 shrink-0">
              Vigência: 2026
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Política em conformidade integral com a LGPD e Marco Civil</span>
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
