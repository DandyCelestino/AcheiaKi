import React, { useState } from 'react';
import {
  BookOpen,
  UserCheck,
  Store,
  Scale,
  ShieldCheck,
  CheckCircle2,
  X,
  Search,
  ShoppingBag,
  Clock,
  QrCode,
  Truck,
  Lock,
  Layers,
  ChevronRight,
  FileText,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Copy,
  Printer,
  ExternalLink,
  Crown,
  Image as ImageIcon,
  Key,
  ShieldAlert,
  CreditCard,
  MessageCircle,
  ThumbsUp,
  MapPin,
  Calendar,
  Globe
} from 'lucide-react';
import { OFFICIAL_PIX_INFO, BANNER_BASE_PRICE, BANNER_EXTRA_UNIT_PRICE, MAX_BANNER_QUANTITY } from '../../data/membershipPlansData';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'CLIENTES' | 'LOGISTAS' | 'LEGAL';
  onOpenPlansModal?: () => void;
  onOpenCopyrightModal?: () => void;
  onOpenPrivacyModal?: () => void;
  onOpenTermsModal?: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'CLIENTES',
  onOpenPlansModal,
  onOpenCopyrightModal,
  onOpenPrivacyModal,
  onOpenTermsModal
}) => {
  const [activeTab, setActiveTab] = useState<'CLIENTES' | 'LOGISTAS' | 'LEGAL'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(OFFICIAL_PIX_INFO.cnpj);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-6 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Normas & Transparência Legal • Manual Oficial
                </span>
                <span className="text-[9px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Edição 2026
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                Manual Passo a Passo para Cadastros, Compras & Vendas
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Imprimir Manual"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 px-4 sm:px-6 pt-3 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('CLIENTES')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer border-t border-x ${
                activeTab === 'CLIENTES'
                  ? 'bg-white text-emerald-900 border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Manual do Cliente (Consumidor)</span>
            </button>

            <button
              onClick={() => setActiveTab('LOGISTAS')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer border-t border-x ${
                activeTab === 'LOGISTAS'
                  ? 'bg-white text-purple-950 border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-purple-600" />
              <span>Manual do Lojista & Prestador</span>
            </button>

            <button
              onClick={() => setActiveTab('LEGAL')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer border-t border-x ${
                activeTab === 'LEGAL'
                  ? 'bg-white text-blue-950 border-slate-200 shadow-xs'
                  : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Normas, LGPD & Transparência</span>
            </button>
          </div>

          <div className="hidden md:flex items-center text-[11px] text-slate-500 font-semibold mb-2">
            <span>Cachoeiras de Macacu - RJ</span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          
          {/* TAB 1: MANUAL DO CLIENTE / CONSUMIDOR */}
          {activeTab === 'CLIENTES' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Highlight summary */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-black uppercase text-emerald-800 tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Guia Completo para Clientes e Usuários</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Como comprar com segurança, agendar serviços e acompanhar pedidos
                  </h3>
                  <p className="text-xs text-slate-600">
                    Conectamos você diretamente aos melhores comércios, produtores locais e profissionais de Cachoeiras de Macacu.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-[11px] font-bold text-emerald-800 shrink-0">
                  100% Gratuito p/ Clientes
                </div>
              </div>

              {/* Step by Step Grid */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Passo a Passo: Do Cadastro ao Recebimento</span>
                </h4>

                {/* Passo 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Cadastro & Acesso Seguro (Minha Conta)
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Clique em <strong>"Entrar"</strong> no topo da página ou na barra inferior do celular. Selecione a aba <strong>"Criar Nova Conta"</strong>, informe seu nome completo, e-mail, WhatsApp (com DDD) e crie uma senha segura. Seus dados estão protegidos sob a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/18)</strong> e nunca são vendidos a terceiros.
                  </p>
                </div>

                {/* Passo 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Busca Inteligente por Bairros & Categorias
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Utilize a barra de pesquisa rápida para encontrar produtos, pratos, serviços ou lojas específicas. Você pode filtrar por bairro de Cachoeiras de Macacu (ex.: <em>Centro, Papucaia, Japuíba, Faraó, Castália, Guapiaçu, Boca do Mato</em>) e conferir a reputação e selos de verificação dos estabelecimentos.
                  </p>
                </div>

                {/* Passo 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Seleção de Produtos & Montagem da Sacola
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Abra o produto desejado, selecione opções de variação (tamanho, cor, voltagem ou sabor, se houver) e clique em <strong>"Adicionar à Sacola"</strong> ou <strong>"Comprar Agora"</strong>. Você pode adicionar produtos de diferentes lojas e cada lojista responderá individualmente pela separação do seu item.
                  </p>
                </div>

                {/* Passo 4 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Confirmação de Estoque em Tempo Real pelo Lojista
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Ao enviar o pedido, o sistema notifica o lojista para confirmação imediata da disponibilidade em estoque. No seu painel <strong>"Minha Conta → Meus Pedidos"</strong> você acompanha o status atualizado:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-8 pt-1 text-[11px]">
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-semibold">
                      ⏳ Em Análise pelo Lojista
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 font-semibold">
                      ✓ Estoque Confirmado e Separado
                    </div>
                    <div className="p-2 bg-red-50 rounded-xl border border-red-200 text-red-900 font-semibold">
                      ✕ Sem Estoque / Produto Esgotado
                    </div>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Modalidades de Entrega, Retirada & Código de Segurança
                    </h5>
                  </div>
                  <div className="space-y-2 pl-8 text-xs text-slate-600">
                    <p>
                      • <strong>Entrega em Domicílio (Delivery):</strong> O lojista ou entregador parceiro transporta seu pedido até o endereço cadastrado.
                    </p>
                    <p>
                      • <strong>Retirada no Balcão (Takeaway):</strong> O sistema gera um <strong>Código de Segurança de 6 dígitos</strong> exclusivo no seu comprovante. Ao chegar no estabelecimento físico, apresente esse código ao atendente para validação e retirada segura do pacote.
                    </p>
                  </div>
                </div>

                {/* Passo 6 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      6
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Agendamento de Serviços & Orçamentos
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Para eletricistas, encanadores, salões de beleza, diaristas e outros profissionais, utilize o botão <strong>"Agendar Horário / Solicitar Orçamento"</strong>. Escolha a data desejada e envie detalhes do serviço diretamente pelo chat integrado ou WhatsApp do prestador.
                  </p>
                </div>

                {/* Passo 7 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      7
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Recibos Digitais & Avaliação Mútua
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Após a conclusão do pedido ou atendimento, você tem acesso ao <strong>Recibo Digital</strong> com todos os detalhes e pode avaliar o atendimento da loja com estrelas e depoimento, ajudando a comunidade e fortalecendo o comércio ético da cidade.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL DO LOJISTA & PRESTADOR */}
          {activeTab === 'LOGISTAS' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Highlight summary */}
              <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-black uppercase text-purple-800 tracking-wider">
                    <Store className="w-4 h-4 text-purple-600" />
                    <span>Guia Operacional & Comercial para Comércios e Prestadores</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Como cadastrar sua loja, gerenciar estoque, pedidos e banners
                  </h3>
                  <p className="text-xs text-slate-600">
                    Aumente suas vendas municipais com ferramentas de ponta, pedidos organizados e vitrine digital de alto impacto.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenPlansModal) onOpenPlansModal();
                  }}
                  className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>Ver Tabela de Planos</span>
                </button>
              </div>

              {/* Step by Step Grid */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Passo a Passo: Do Cadastro da Loja às Vendas Diárias</span>
                </h4>

                {/* Passo 1: Cadastro da Loja */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Cadastro do Estabelecimento ou Prestador
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Clique em <strong>"Quero Vender / Cadastrar Minha Loja"</strong>. Preencha o nome fantasia da sua empresa, categoria de atuação (Alimentação, Moda, Eletrônicos, Serviços, Construção, etc.), CNPJ ou CPF do responsável, endereço físico com bairro de Cachoeiras de Macacu e o WhatsApp oficial para atendimento.
                  </p>
                </div>

                {/* Passo 2: Escolha de Planos */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Modalidades de Planos & Comissões
                    </h5>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-600">
                    <p>
                      • <strong>Plano Grátis (Start):</strong> R$ 0,00 de mensalidade fixa. Cadastre até 5 produtos. A comissão de 12% é recolhida após a venda realizada.
                    </p>
                    <p>
                      • <strong>Planos Pagos (Bronze, Prata, Ouro, Premium):</strong> Produtos ilimitados, taxas de comissão reduzidas (de 9% a 3%), liberação instantânea de dados dos clientes e prioridade nos resultados de busca.
                    </p>
                  </div>
                </div>

                {/* Passo 3: Cadastro de Produtos */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Cadastro de Produtos, Fotos & Variações
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    No Painel do Vendedor, acesse <strong>"Meus Produtos → Novo Produto"</strong>. Insira fotos de alta qualidade, título claro, descrição detalhada, preço original e promocional, quantidade em estoque e variações (ex: tamanhos P, M, G ou cores).
                  </p>
                </div>

                {/* Passo 4: Recepção de Pedidos e Confirmação de Estoque */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Atendimento de Pedidos & Confirmação de Estoque
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Ao receber um novo pedido, verifique fisicamente a mercadoria e clique em <strong>"Confirmar Estoque & Separar"</strong> ou <strong>"Informar Esgotado"</strong>. Isso atualiza o cliente instantaneamente e evita reclamações.
                  </p>
                </div>

                {/* Passo 5: Validação com Código de Retirada */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                      5
                    </span>
                    <h5 className="font-black text-slate-900 text-sm">
                      Validação de Segurança na Retirada no Balcão
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 pl-8">
                    Para pedidos com retirada presencial, solicite ao cliente o <strong>Código de Segurança de 6 dígitos</strong> exibido na tela dele. Digite o código na aba <strong>"Validar Retirada"</strong> do seu painel para dar baixa oficial e registrar a entrega com segurança jurídica.
                  </p>
                </div>

                {/* Passo 6: Repasse de Comissão via PIX Oficial */}
                <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 hover:border-emerald-400 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                        6
                      </span>
                      <h5 className="font-black text-emerald-950 text-sm">
                        Pagamento de Comissão da Plataforma via PIX Oficial
                      </h5>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                      Titular Oficial
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 pl-8 leading-relaxed">
                    Para liberação dos dados de contato do cliente no Plano Grátis ou recolhimento de comissões, o pagamento deve ser realizado exclusivamente para a conta oficial da plataforma:
                  </p>
                  
                  {/* Pix Box */}
                  <div className="ml-8 p-3 bg-white border border-emerald-300 rounded-xl space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Favorecido Oficial:</span>
                        <strong className="text-slate-900 font-black">{OFFICIAL_PIX_INFO.beneficiary}</strong>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          {OFFICIAL_PIX_INFO.cnpj}
                        </span>
                        <button
                          onClick={handleCopyPix}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? 'Copiado!' : 'Copiar Chave'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{OFFICIAL_PIX_INFO.officialNotice}</span>
                    </div>
                  </div>
                </div>

                {/* Passo 7: Contratação de Banners de Destaque */}
                <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 hover:border-purple-300 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                        7
                      </span>
                      <h5 className="font-black text-slate-900 text-sm">
                        Planos de Banners de Destaque (Publicidade Local)
                      </h5>
                    </div>
                    <span className="text-[10px] bg-purple-200 text-purple-900 font-extrabold px-2 py-0.5 rounded-full">
                      Teto: Até {MAX_BANNER_QUANTITY} Banners
                    </span>
                  </div>
                  <div className="pl-8 space-y-2 text-xs text-slate-700">
                    <p>
                      • <strong>Preço Base:</strong> <strong>R$ {BANNER_BASE_PRICE.toFixed(2).replace('.', ',')}</strong> mensais para pacotes de <strong>até 3 banners</strong> rotativos na página inicial e categorias.
                    </p>
                    <p>
                      • <strong>Banners Adicionais:</strong> <strong>+ R$ {BANNER_EXTRA_UNIT_PRICE.toFixed(2).replace('.', ',')}</strong> por banner adicional acima de 3, respeitando o <strong>limite máximo de {MAX_BANNER_QUANTITY} banners</strong> por estabelecimento comercial.
                    </p>
                    <p>
                      • <strong>Liberação:</strong> Imediata após a confirmação do pagamento via PIX para <strong>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NORMAS, LGPD & TRANSPARÊNCIA LEGAL */}
          {activeTab === 'LEGAL' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Highlight summary */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-black uppercase text-blue-800 tracking-wider">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span>Conformidade Regulatória & Transparência Municipal</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Direitos Autorais, Proteção de Dados (LGPD) & Código do Consumidor
                  </h3>
                  <p className="text-xs text-slate-600">
                    Regulamentação jurídica completa para garantir segurança a clientes, lojistas e parceiros.
                  </p>
                </div>
                <div className="px-3 py-1.5 bg-white border border-blue-300 rounded-xl text-[11px] font-bold text-blue-800 shrink-0">
                  Legislação Brasileira Vigente
                </div>
              </div>

              {/* Legal Points Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Direitos Autorais */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>1. Direitos Autorais & Autoria Exclusiva</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    A plataforma Achei Aqui foi concebida, desenhada e desenvolvida integralmente por <strong>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</strong>, detentora universal dos direitos morais e patrimoniais da obra sob a <strong>Lei Federal nº 9.610/1998 (LDA)</strong> e <strong>Lei nº 9.609/1998 (Software)</strong>. É estritamente vedada a cópia, descompilação ou reprodução sem licença formal por escrito.
                  </p>
                </div>

                {/* 2. LGPD */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>2. Proteção de Dados & Privacidade (LGPD)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Em conformidade com a <strong>Lei nº 13.709/2018 (LGPD)</strong>, os dados coletados (nome, telefone, endereço de entrega) são tratados com criptografia e utilizados estritamente para o processamento das transações comerciais. O usuário tem o direito de solicitar a consulta, retificação ou exclusão de sua conta a qualquer momento.
                  </p>
                </div>

                {/* 3. Código do Consumidor */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    <span>3. Direitos do Consumidor (CDC)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Aplicam-se as normas da <strong>Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor)</strong> e <strong>Decreto nº 7.962/2013 (Comércio Eletrônico)</strong>. O consumidor tem direito à informação clara de preços, garantia legal contra vícios de produtos e prazo de reflexão conforme a modalidade de venda.
                  </p>
                </div>

                {/* 4. Marco Civil da Internet */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>4. Marco Civil da Internet</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Regido pela <strong>Lei Federal nº 12.965/2014</strong>, que estabelece princípios, garantias, direitos e deveres para o uso da internet no Brasil, assegurando a inviolabilidade da intimidade e do sigilo das comunicações privadas.
                  </p>
                </div>
              </div>

              {/* Documentos Jurídicos Integrados */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-slate-700" />
                  <span>Documentos Jurídicos Integrados para Consulta:</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenCopyrightModal) onOpenCopyrightModal();
                    }}
                    className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Autoria</span>
                    <strong className="text-xs text-emerald-950 font-bold block truncate">
                      Direitos Autorais
                    </strong>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenPrivacyModal) onOpenPrivacyModal();
                    }}
                    className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Privacidade</span>
                    <strong className="text-xs text-blue-950 font-bold block truncate">
                      Política LGPD
                    </strong>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenTermsModal) onOpenTermsModal();
                    }}
                    className="p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Regras</span>
                    <strong className="text-xs text-amber-950 font-bold block truncate">
                      Termos de Uso
                    </strong>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenPlansModal) onOpenPlansModal();
                    }}
                    className="p-2.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Comissões</span>
                    <strong className="text-xs text-purple-950 font-bold block truncate">
                      Tabela de Planos
                    </strong>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Autor e Titular Oficial: <strong>Bex Serviços e Comércios, CNPJ 30.810.800/0001-39</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Fechar Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
