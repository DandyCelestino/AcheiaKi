/**
 * ============================================================================
 * ARQUITETURA MULTILOJA: BANCO DE DADOS, RELACIONAMENTOS, STATUS E SEGURANÇA
 * 
 * MODELO:
 * CARRINHO → PEDIDO PRINCIPAL (#10001) → SUBPEDIDOS (#10001-A, #10001-B...) → ITENS
 * 
 * POLÍTICA DE PAGAMENTO:
 * - Mercadorias: R$ Pago DIRETAMENTE ao Lojista
 * - Taxas da Plataforma: 10% recolhido à plataforma (Bex Serviços e Comércios, CNPJ: 30.810.800/0001-39)
 * - Aviso Oficial: "COMPRA VALIDADA — O PAGAMENTO DAS MERCADORIAS SERÁ REALIZADO DIRETAMENTE A CADA LOJISTA."
 * 
 * SEGURANÇA & ISOLAMENTO:
 * - Loja A NUNCA acessa dados de clientes da Loja B
 * - Antes da confirmação da taxa: Visão Restrita (produtos, qtd, preço, região aprox, status)
 * - Função mandatória: LIBERAR_DADOS_DO_CLIENTE(subpedido_id) com auditoria imutável
 * ============================================================================
 */

import {
  PedidoPrincipal,
  Subpedido,
  ItemPedido,
  CarrinhoMultiloja,
  CarrinhoMultilojaItem,
  PagamentoTaxa,
  RegistroEntrega,
  RegistroConfirmacoes,
  RegistroAuditoria,
  RegistroHistoricoStatus,
  DadosClienteProtegidos,
  VisaoRestritaLojistaSubpedido,
  PedidoPrincipalStatus,
  SubpedidoStatus,
  ItemPedidoStatus,
  ModalityType,
  User,
  COMPRA_VALIDADA_AVISO,
  PLATFORM_FEE_RATE
} from '../types';
import { OFFICIAL_PIX_INFO } from '../data/membershipPlansData';

export interface MultiStoreDatabaseState {
  carrinhos: Record<string, CarrinhoMultiloja>;
  pedidosPrincipais: Record<string, PedidoPrincipal>;
  subpedidos: Record<string, Subpedido>;
  itensPedido: Record<string, ItemPedido>;
  pagamentosTaxas: Record<string, PagamentoTaxa>;
  entregas: Record<string, RegistroEntrega>;
  confirmacoes: Record<string, RegistroConfirmacoes>;
  auditoria: RegistroAuditoria[];
  historicoStatus: RegistroHistoricoStatus[];
}

export class MultiStoreDatabase {
  private static instance: MultiStoreDatabase;
  private state: MultiStoreDatabaseState;
  private storageKey = 'ACHEI_AQUI_MULTISTORE_DATABASE_V1';

  private constructor() {
    this.state = this.loadFromStorage() || {
      carrinhos: {},
      pedidosPrincipais: {},
      subpedidos: {},
      itensPedido: {},
      pagamentosTaxas: {},
      entregas: {},
      confirmacoes: {},
      auditoria: [],
      historicoStatus: []
    };
  }

  public static getInstance(): MultiStoreDatabase {
    if (!MultiStoreDatabase.instance) {
      MultiStoreDatabase.instance = new MultiStoreDatabase();
    }
    return MultiStoreDatabase.instance;
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      }
    } catch (err) {
      console.error('[MultiStoreDatabase] Erro ao persistir estado:', err);
    }
  }

  private loadFromStorage(): MultiStoreDatabaseState | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.storageKey);
        if (data) return JSON.parse(data);
      }
    } catch (err) {
      console.warn('[MultiStoreDatabase] Falha ao ler do storage:', err);
    }
    return null;
  }

  // ==========================================================================
  // AUDITORIA & HISTÓRICO DE STATUS
  // ==========================================================================

  public registrarAuditoria(params: {
    subpedidoId?: string;
    pedidoPrincipalId?: string;
    lojaId?: string;
    userId: string;
    userRole: string;
    acao: string;
    detalhes: string;
    dadosLiberadosSnapshot?: Record<string, unknown>;
    ipAddress?: string;
  }): RegistroAuditoria {
    const log: RegistroAuditoria = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subpedidoId: params.subpedidoId,
      pedidoPrincipalId: params.pedidoPrincipalId,
      lojaId: params.lojaId,
      userId: params.userId,
      userRole: params.userRole,
      acao: params.acao,
      detalhes: params.detalhes,
      dadosLiberadosSnapshot: params.dadosLiberadosSnapshot,
      ipAddress: params.ipAddress || '127.0.0.1 (Ambiente Seguro)',
      timestamp: new Date().toISOString()
    };
    this.state.auditoria.unshift(log);
    this.saveToStorage();
    return log;
  }

  public registrarTransicaoStatus(params: {
    entidadeTipo: 'PEDIDO_PRINCIPAL' | 'SUBPEDIDO' | 'TAXA' | 'ENTREGA';
    entidadeId: string;
    statusAnterior: string;
    statusNovo: string;
    motivo?: string;
    alteradoPorUserId: string;
    alteradoPorRole: string;
  }): RegistroHistoricoStatus {
    const history: RegistroHistoricoStatus = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entidadeTipo: params.entidadeTipo,
      entidadeId: params.entidadeId,
      statusAnterior: params.statusAnterior,
      statusNovo: params.statusNovo,
      motivo: params.motivo,
      alteradoPorUserId: params.alteradoPorUserId,
      alteradoPorRole: params.alteradoPorRole,
      timestamp: new Date().toISOString()
    };
    this.state.historicoStatus.unshift(history);
    this.saveToStorage();
    return history;
  }

  // ==========================================================================
  // 1. GESTÃO DO CARRINHO MULTILOJA (AGRUPAMENTO AUTOMÁTICO POR LOJISTA)
  // ==========================================================================

  public obterOuCriarCarrinho(identificador: { userId?: string; sessionId?: string }): CarrinhoMultiloja {
    const cartId = identificador.userId ? `cart-user-${identificador.userId}` : `cart-session-${identificador.sessionId || 'anonymous'}`;
    if (!this.state.carrinhos[cartId]) {
      this.state.carrinhos[cartId] = {
        id: cartId,
        userId: identificador.userId,
        sessionId: identificador.sessionId,
        itens: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      this.saveToStorage();
    }
    return this.state.carrinhos[cartId];
  }

  public adicionarItemCarrinho(
    carrinhoId: string,
    item: Omit<CarrinhoMultilojaItem, 'id' | 'adicionadoEm'>
  ): CarrinhoMultiloja {
    const carrinho = this.state.carrinhos[carrinhoId] || {
      id: carrinhoId,
      itens: [],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    const existingIndex = carrinho.itens.findIndex(
      (i) =>
        i.produtoId === item.produtoId &&
        i.modalidade === item.modalidade &&
        JSON.stringify(i.variacoes || {}) === JSON.stringify(item.variacoes || {})
    );

    if (existingIndex >= 0) {
      carrinho.itens[existingIndex].quantidade += item.quantidade;
    } else {
      carrinho.itens.push({
        ...item,
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        adicionadoEm: new Date().toISOString()
      });
    }

    carrinho.atualizadoEm = new Date().toISOString();
    this.state.carrinhos[carrinhoId] = carrinho;
    this.saveToStorage();
    return carrinho;
  }

  public agruparCarrinhoPorLojista(carrinhoId: string): {
    lojas: {
      lojaId: string;
      lojaNome: string;
      itens: CarrinhoMultilojaItem[];
      subtotalMercadorias: number;
      taxaPlataformaEstimada: number; // 10%
    }[];
    totalMercadoriasGeral: number;
    totalTaxasPlataformaGeral: number; // 10%
  } {
    const carrinho = this.state.carrinhos[carrinhoId];
    if (!carrinho || carrinho.itens.length === 0) {
      return { lojas: [], totalMercadoriasGeral: 0, totalTaxasPlataformaGeral: 0 };
    }

    const map = new Map<string, { lojaNome: string; itens: CarrinhoMultilojaItem[] }>();

    for (const item of carrinho.itens) {
      if (!map.has(item.lojaId)) {
        map.set(item.lojaId, { lojaNome: item.lojaNome, itens: [] });
      }
      map.get(item.lojaId)!.itens.push(item);
    }

    let totalMercadoriasGeral = 0;
    let totalTaxasPlataformaGeral = 0;

    const lojas = Array.from(map.entries()).map(([lojaId, data]) => {
      const subtotalMercadorias = data.itens.reduce((acc, curr) => acc + curr.precoUnitario * curr.quantidade, 0);
      const taxaPlataformaEstimada = Number((subtotalMercadorias * PLATFORM_FEE_RATE).toFixed(2));
      totalMercadoriasGeral += subtotalMercadorias;
      totalTaxasPlataformaGeral += taxaPlataformaEstimada;

      return {
        lojaId,
        lojaNome: data.lojaNome,
        itens: data.itens,
        subtotalMercadorias,
        taxaPlataformaEstimada
      };
    });

    return {
      lojas,
      totalMercadoriasGeral: Number(totalMercadoriasGeral.toFixed(2)),
      totalTaxasPlataformaGeral: Number(totalTaxasPlataformaGeral.toFixed(2))
    };
  }

  // ==========================================================================
  // 2. CRIAÇÃO DE PEDIDO PRINCIPAL E SUBPEDIDOS AUTOMÁTICOS POR LOJISTA
  // ==========================================================================

  public criarPedidoPrincipalComSubpedidos(params: {
    carrinhoId: string;
    cliente: {
      userId: string;
      name: string;
      phone: string;
      email: string;
      cpf?: string;
      neighborhood: string;
      city: string;
      addressFull: string;
      referencePoint?: string;
      deliveryInstructions?: string;
      clientVerified?: boolean;
    };
    userContext?: { userId: string; userRole: string };
  }): PedidoPrincipal {
    const agrupamento = this.agruparCarrinhoPorLojista(params.carrinhoId);
    if (agrupamento.lojas.length === 0) {
      throw new Error('Não é possível criar pedido a partir de um carrinho vazio.');
    }

    const orderNumber = 10000 + Object.keys(this.state.pedidosPrincipais).length + 1;
    const pedidoPrincipalId = `order-main-${orderNumber}-${Date.now()}`;
    const mainCode = `#${orderNumber}`;
    const nowIso = new Date().toISOString();

    const subpedidos: Subpedido[] = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    agrupamento.lojas.forEach((lojaData, idx) => {
      const letter = alphabet[idx] || `${idx + 1}`;
      const subpedidoCodigo = `${mainCode}-${letter}`;
      const subpedidoId = `suborder-${orderNumber}-${letter}-${Date.now()}`;

      // Criar itens do subpedido
      const itensDoSubpedido: ItemPedido[] = lojaData.itens.map((cItem, itemIdx) => {
        const itemPedidoId = `item-${subpedidoId}-${itemIdx + 1}`;
        const itemPedido: ItemPedido = {
          id: itemPedidoId,
          subpedidoId,
          pedidoPrincipalId,
          lojaId: lojaData.lojaId,
          produtoId: cItem.produtoId,
          nomeProduto: cItem.nome,
          imagemProduto: cItem.imagem,
          quantidade: cItem.quantidade,
          precoUnitario: cItem.precoUnitario,
          subtotal: Number((cItem.precoUnitario * cItem.quantidade).toFixed(2)),
          variacoes: cItem.variacoes,
          statusItem: 'ATIVO',
          criadoEm: nowIso,
          atualizadoEm: nowIso
        };
        this.state.itensPedido[itemPedidoId] = itemPedido;
        return itemPedido;
      });

      // Registro de Confirmações do Subpedido
      const confirmacoesId = `conf-${subpedidoId}`;
      const confirmacao: RegistroConfirmacoes = {
        id: confirmacoesId,
        subpedidoId,
        pedidoPrincipalId,
        lojaId: lojaData.lojaId,
        confirmacaoEstoqueLoja: false,
        confirmacaoTaxaPlataforma: false,
        confirmacaoPagamentoMercadoriaLoja: false,
        confirmacaoRecebimentoCliente: false
      };
      this.state.confirmacoes[confirmacoesId] = confirmacao;

      // Registro de Entrega do Subpedido (Sem dados privados ainda)
      const entregaId = `deliv-${subpedidoId}`;
      const modalidadePredominante = lojaData.itens[0]?.modalidade || 'DELIVERY';
      const entrega: RegistroEntrega = {
        id: entregaId,
        subpedidoId,
        pedidoPrincipalId,
        lojaId: lojaData.lojaId,
        modalidade: modalidadePredominante,
        regiaoAproximada: `${params.cliente.neighborhood}, ${params.cliente.city}`,
        codigoRastreioOuRetirada: `RET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        statusEntrega: 'AGUARDANDO_VALIDACAO_COMPRA',
        criadoEm: nowIso,
        atualizadoEm: nowIso
      };
      this.state.entregas[entregaId] = entrega;

      const subpedido: Subpedido = {
        id: subpedidoId,
        pedidoPrincipalId,
        codigoSubpedido: subpedidoCodigo,
        lojaId: lojaData.lojaId,
        lojaNome: lojaData.lojaNome,
        status: 'AGUARDANDO_CONFIRMACAO_LOJA',
        modalidade: modalidadePredominante,
        valorMercadorias: lojaData.subtotalMercadorias,
        taxaPlataformaRate: PLATFORM_FEE_RATE,
        taxaPlataformaValor: lojaData.taxaPlataformaEstimada,
        taxaPaga: false,
        dadosClienteLiberados: false,
        pagamentoMercadoriaDiretoStatus: 'PENDENTE_PAGAMENTO_DIRETO',
        confirmacoes: confirmacao,
        entrega,
        itens: itensDoSubpedido,
        criadoEm: nowIso,
        atualizadoEm: nowIso
      };

      this.state.subpedidos[subpedidoId] = subpedido;
      subpedidos.push(subpedido);

      this.registrarTransicaoStatus({
        entidadeTipo: 'SUBPEDIDO',
        entidadeId: subpedidoId,
        statusAnterior: 'NOVO',
        statusNovo: 'AGUARDANDO_CONFIRMACAO_LOJA',
        motivo: `Subpedido criado e direcionado à ${lojaData.lojaNome}`,
        alteradoPorUserId: params.userContext?.userId || params.cliente.userId,
        alteradoPorRole: params.userContext?.userRole || 'CLIENTE'
      });
    });

    // Criar Pagamento de Taxas Consolidado da Plataforma (10%)
    const pagamentoTaxaId = `fee-${orderNumber}-${Date.now()}`;
    const linkPagamentoPix = `https://acheiaqui.app.br/pagamento-taxa/${pagamentoTaxaId}`;
    const copiaEColaPix = `00020126580014br.gov.bcb.pix0136${OFFICIAL_PIX_INFO.cnpjClean}520400005303986540${agrupamento.totalTaxasPlataformaGeral.toFixed(2)}5802BR5924BEX SERVICOS E COMERCIOS6019CACHOEIRAS DE MACACU62070503***6304`;

    const pagamentoTaxa: PagamentoTaxa = {
      id: pagamentoTaxaId,
      pedidoPrincipalId,
      subpedidoIds: subpedidos.map((s) => s.id),
      pagadorUserId: params.cliente.userId,
      pagadorNome: params.cliente.name,
      pagadorEmail: params.cliente.email,
      pagadorPhone: params.cliente.phone,
      valorTotalTaxas: agrupamento.totalTaxasPlataformaGeral,
      taxaPercentualGeral: PLATFORM_FEE_RATE,
      metodo: 'PIX_ESTATICO',
      chavePixOficial: OFFICIAL_PIX_INFO.cnpj, // 30.810.800/0001-39
      beneficiario: OFFICIAL_PIX_INFO.beneficiary,
      linkPagamento: linkPagamentoPix,
      copiaEColaPix,
      status: 'PENDENTE',
      criadoEm: nowIso,
      expiraEm: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    };
    this.state.pagamentosTaxas[pagamentoTaxaId] = pagamentoTaxa;

    const pedidoPrincipal: PedidoPrincipal = {
      id: pedidoPrincipalId,
      code: mainCode,
      userId: params.cliente.userId,
      customerName: params.cliente.name,
      customerPhone: params.cliente.phone,
      customerEmail: params.cliente.email,
      customerCpf: params.cliente.cpf,
      customerNeighborhood: params.cliente.neighborhood,
      customerCity: params.cliente.city,
      customerAddressFull: params.cliente.addressFull,
      customerReferencePoint: params.cliente.referencePoint,
      customerDeliveryInstructions: params.cliente.deliveryInstructions,
      clientVerified: Boolean(params.cliente.clientVerified),
      totalMercadorias: agrupamento.totalMercadoriasGeral,
      totalTaxasPlataforma: agrupamento.totalTaxasPlataformaGeral,
      taxaPlataformaTaxRate: PLATFORM_FEE_RATE,
      status: 'AGUARDANDO_CONFIRMACOES_LOJAS',
      subpedidos,
      pagamentoTaxa,
      avisoLegal: COMPRA_VALIDADA_AVISO,
      criadoEm: nowIso,
      atualizadoEm: nowIso
    };

    this.state.pedidosPrincipais[pedidoPrincipalId] = pedidoPrincipal;

    // Limpar o carrinho após pedido criado com sucesso
    if (this.state.carrinhos[params.carrinhoId]) {
      this.state.carrinhos[params.carrinhoId].itens = [];
      this.state.carrinhos[params.carrinhoId].atualizadoEm = nowIso;
    }

    this.registrarAuditoria({
      pedidoPrincipalId,
      userId: params.cliente.userId,
      userRole: 'CLIENTE',
      acao: 'PEDIDO_PRINCIPAL_CRIADO',
      detalhes: `Pedido Principal ${mainCode} criado com ${subpedidos.length} subpedidos. Total Mercadorias: R$ ${agrupamento.totalMercadoriasGeral.toFixed(2)}, Taxa Plataforma (10%): R$ ${agrupamento.totalTaxasPlataformaGeral.toFixed(2)}.`
    });

    this.registrarTransicaoStatus({
      entidadeTipo: 'PEDIDO_PRINCIPAL',
      entidadeId: pedidoPrincipalId,
      statusAnterior: 'NOVO',
      statusNovo: 'AGUARDANDO_CONFIRMACOES_LOJAS',
      motivo: 'Aguardando confirmação de estoque e disponibilidade pelos lojistas',
      alteradoPorUserId: params.cliente.userId,
      alteradoPorRole: 'CLIENTE'
    });

    this.saveToStorage();
    return pedidoPrincipal;
  }

  // ==========================================================================
  // 3. CONFIRMAÇÃO DE ESTOQUE E GESTÃO INDEPENDENTE POR SUBPEDIDO
  // ==========================================================================

  public confirmarEstoqueSubpedido(
    subpedidoId: string,
    lojaId: string,
    usuarioId: string,
    usuarioRole: string
  ): Subpedido {
    const subpedido = this.state.subpedidos[subpedidoId];
    if (!subpedido) throw new Error(`Subpedido ${subpedidoId} não encontrado.`);

    // Garantia de segurança: Loja só mexe no seu próprio subpedido
    if (usuarioRole !== 'MASTER' && subpedido.lojaId !== lojaId) {
      this.registrarAuditoria({
        subpedidoId,
        lojaId,
        userId: usuarioId,
        userRole: usuarioRole,
        acao: 'TENTATIVA_ACESSO_NEGADO_ESTOQUE',
        detalhes: `Loja ${lojaId} tentou confirmar estoque do subpedido pertencente à Loja ${subpedido.lojaId}.`
      });
      throw new Error('Acesso negado: Este subpedido não pertence à sua loja.');
    }

    const agora = new Date().toISOString();
    subpedido.confirmacoes.confirmacaoEstoqueLoja = true;
    subpedido.confirmacoes.confirmacaoEstoqueLojaAt = agora;
    subpedido.confirmacoes.confirmacaoEstoqueUsuarioId = usuarioId;
    
    // Todos os itens ativos passam para confirmados
    subpedido.itens.forEach((it) => {
      if (it.statusItem === 'ATIVO') it.statusItem = 'CONFIRMADO';
    });

    const statusAnterior = subpedido.status;
    subpedido.status = 'ESTOQUE_CONFIRMADO';
    subpedido.atualizadoEm = agora;

    this.registrarTransicaoStatus({
      entidadeTipo: 'SUBPEDIDO',
      entidadeId: subpedidoId,
      statusAnterior,
      statusNovo: 'ESTOQUE_CONFIRMADO',
      motivo: 'Estoque, preço e disponibilidade confirmados pelo lojista.',
      alteradoPorUserId: usuarioId,
      alteradoPorRole: usuarioRole
    });

    this.reavaliarStatusPedidoPrincipal(subpedido.pedidoPrincipalId);
    this.saveToStorage();
    return subpedido;
  }

  public marcarItemSemEstoque(
    subpedidoId: string,
    itemId: string,
    lojaId: string,
    usuarioId: string,
    usuarioRole: string,
    motivo: string
  ): Subpedido {
    const subpedido = this.state.subpedidos[subpedidoId];
    if (!subpedido) throw new Error(`Subpedido ${subpedidoId} não encontrado.`);

    if (usuarioRole !== 'MASTER' && subpedido.lojaId !== lojaId) {
      throw new Error('Acesso negado: Este subpedido não pertence à sua loja.');
    }

    const item = subpedido.itens.find((i) => i.id === itemId);
    if (!item) throw new Error(`Item ${itemId} não encontrado no subpedido.`);

    item.statusItem = 'SEM_ESTOQUE';
    item.motivoCancelamentoItem = motivo;
    item.atualizadoEm = new Date().toISOString();

    // Recalcula valor das mercadorias do subpedido e taxa da plataforma (10%)
    const novosItensAtivos = subpedido.itens.filter((i) => i.statusItem === 'ATIVO' || i.statusItem === 'CONFIRMADO');
    const novoTotalMercadorias = novosItensAtivos.reduce((acc, curr) => acc + curr.subtotal, 0);
    subpedido.valorMercadorias = Number(novoTotalMercadorias.toFixed(2));
    subpedido.taxaPlataformaValor = Number((novoTotalMercadorias * PLATFORM_FEE_RATE).toFixed(2));

    if (novosItensAtivos.length === 0) {
      subpedido.status = 'SEM_ESTOQUE';
      this.registrarTransicaoStatus({
        entidadeTipo: 'SUBPEDIDO',
        entidadeId: subpedidoId,
        statusAnterior: 'AGUARDANDO_CONFIRMACAO_LOJA',
        statusNovo: 'SEM_ESTOQUE',
        motivo: `Todos os itens foram marcados como sem estoque: ${motivo}`,
        alteradoPorUserId: usuarioId,
        alteradoPorRole: usuarioRole
      });
    }

    this.recalcularTotaisPedidoPrincipal(subpedido.pedidoPrincipalId);
    this.reavaliarStatusPedidoPrincipal(subpedido.pedidoPrincipalId);
    this.saveToStorage();
    return subpedido;
  }

  // ==========================================================================
  // 4. CONFIRMAÇÃO DE PAGAMENTO DAS TAXAS DA PLATAFORMA (10%)
  // ==========================================================================

  public confirmarPagamentoTaxaPlataforma(
    pagamentoTaxaId: string,
    confirmadoPorUser: { userId: string; userRole: string; comprovanteUrl?: string }
  ): PagamentoTaxa {
    const pagamento = this.state.pagamentosTaxas[pagamentoTaxaId];
    if (!pagamento) throw new Error(`Pagamento de taxa ${pagamentoTaxaId} não encontrado.`);

    const agora = new Date().toISOString();
    pagamento.status = 'PAGO_CONFIRMADO';
    pagamento.confirmadoPorUserId = confirmadoPorUser.userId;
    pagamento.confirmadoAt = agora;
    if (confirmadoPorUser.comprovanteUrl) {
      pagamento.comprovanteUrl = confirmadoPorUser.comprovanteUrl;
    }

    // Atualiza cada subpedido aprovado para COMPRA_VALIDADA
    pagamento.subpedidoIds.forEach((subId) => {
      const sub = this.state.subpedidos[subId];
      if (sub && sub.status !== 'CANCELADO' && sub.status !== 'SEM_ESTOQUE' && sub.status !== 'CANCELADO_LOJA') {
        sub.taxaPaga = true;
        sub.taxaConfirmadaAt = agora;
        sub.confirmacoes.confirmacaoTaxaPlataforma = true;
        sub.confirmacoes.confirmacaoTaxaPlataformaAt = agora;
        
        const statusAnterior = sub.status;
        sub.status = 'COMPRA_VALIDADA';
        sub.atualizadoEm = agora;

        this.registrarTransicaoStatus({
          entidadeTipo: 'SUBPEDIDO',
          entidadeId: subId,
          statusAnterior,
          statusNovo: 'COMPRA_VALIDADA',
          motivo: `Taxa da plataforma (10% = R$ ${sub.taxaPlataformaValor.toFixed(2)}) confirmada. Status: ${COMPRA_VALIDADA_AVISO}`,
          alteradoPorUserId: confirmadoPorUser.userId,
          alteradoPorRole: confirmadoPorUser.userRole
        });
      }
    });

    this.registrarAuditoria({
      pedidoPrincipalId: pagamento.pedidoPrincipalId,
      userId: confirmadoPorUser.userId,
      userRole: confirmadoPorUser.userRole,
      acao: 'TAXAS_PLATAFORMA_CONFIRMADAS',
      detalhes: `Pagamento de taxas no valor de R$ ${pagamento.valorTotalTaxas.toFixed(2)} confirmado via ${pagamento.metodo} para o titular ${OFFICIAL_PIX_INFO.beneficiary} (CNPJ ${OFFICIAL_PIX_INFO.cnpj}).`
    });

    this.reavaliarStatusPedidoPrincipal(pagamento.pedidoPrincipalId);
    this.saveToStorage();
    return pagamento;
  }

  // ==========================================================================
  // 5. REGRA DE SEGURANÇA MÁXIMA: LIBERAR_DADOS_DO_CLIENTE(subpedido_id)
  // ==========================================================================

  /**
   * LIBERAR_DADOS_DO_CLIENTE(subpedido_id)
   * 
   * Somente funciona quando:
   * 1. Subpedido pertence à loja solicitante (ou role MASTER)
   * 2. Estoque/serviço foi confirmado pelo lojista
   * 3. Taxa correspondente (10%) foi confirmada e paga à plataforma
   * 4. Subpedido está com status COMPRA_VALIDADA (ou posterior no ciclo)
   * 
   * A Loja A NUNCA pode acessar dados de clientes do pedido da Loja B!
   * Registra toda liberação na AUDITORIA imutável.
   */
  public LIBERAR_DADOS_DO_CLIENTE(
    subpedido_id: string,
    solicitante: { lojaId?: string; userId: string; userRole: string; ipAddress?: string }
  ): DadosClienteProtegidos {
    const subpedido = this.state.subpedidos[subpedido_id];
    if (!subpedido) {
      throw new Error(`Subpedido ${subpedido_id} inexistente.`);
    }

    const pedidoPrincipal = this.state.pedidosPrincipais[subpedido.pedidoPrincipalId];
    if (!pedidoPrincipal) {
      throw new Error(`Pedido principal do subpedido ${subpedido_id} não encontrado.`);
    }

    // Regra 1: Pertencimento à loja (Loja A não acessa Loja B)
    if (solicitante.userRole !== 'MASTER' && solicitante.lojaId !== subpedido.lojaId) {
      this.registrarAuditoria({
        subpedidoId: subpedido_id,
        pedidoPrincipalId: subpedido.pedidoPrincipalId,
        lojaId: solicitante.lojaId,
        userId: solicitante.userId,
        userRole: solicitante.userRole,
        acao: 'VIOLACAO_SEGURANCA_ACESSO_CROSS_STORE_NEGADO',
        detalhes: `Tentativa de acesso não autorizado: Lojista ${solicitante.lojaId} tentou liberar dados do subpedido ${subpedido.codigoSubpedido} da Loja ${subpedido.lojaId}.`,
        ipAddress: solicitante.ipAddress
      });
      throw new Error('🔒 Violação de Segurança: Sua loja não possui permissão para acessar este subpedido.');
    }

    // Regra 2: Estoque/Serviço confirmado
    if (!subpedido.confirmacoes.confirmacaoEstoqueLoja) {
      throw new Error('Bloqueio de Segurança: O estoque/serviço deste subpedido ainda não foi confirmado.');
    }

    // Regra 3: Taxa correspondente confirmada
    if (!subpedido.taxaPaga || !subpedido.confirmacoes.confirmacaoTaxaPlataforma) {
      throw new Error('Bloqueio de Segurança: A taxa da plataforma deste subpedido ainda não foi confirmada.');
    }

    // Regra 4: Subpedido deve estar em COMPRA_VALIDADA ou posterior
    const statusValidosParaLiberacao: SubpedidoStatus[] = [
      'COMPRA_VALIDADA',
      'DADOS_LIBERADOS',
      'EM_PREPARO',
      'EM_ROTA',
      'PRONTO_RETIRADA',
      'AGUARDANDO_PAGAMENTO_MERCADORIA',
      'PAGAMENTO_MERCADORIA_CONFIRMADO',
      'RECEBIMENTO_CONFIRMADO_CLIENTE',
      'CONCLUIDO'
    ];

    if (!statusValidosParaLiberacao.includes(subpedido.status)) {
      throw new Error(`Bloqueio de Segurança: O status atual (${subpedido.status}) não permite liberação de dados.`);
    }

    // Executa a liberação de dados
    const agora = new Date().toISOString();
    subpedido.dadosClienteLiberados = true;
    subpedido.dadosClienteLiberadosAt = agora;
    subpedido.entrega.enderecoEntregaCompleto = pedidoPrincipal.customerAddressFull;

    if (subpedido.status === 'COMPRA_VALIDADA') {
      subpedido.status = 'DADOS_LIBERADOS';
      this.registrarTransicaoStatus({
        entidadeTipo: 'SUBPEDIDO',
        entidadeId: subpedido_id,
        statusAnterior: 'COMPRA_VALIDADA',
        statusNovo: 'DADOS_LIBERADOS',
        motivo: 'Dados de entrega e contato liberados com sucesso para a loja.',
        alteradoPorUserId: solicitante.userId,
        alteradoPorRole: solicitante.userRole
      });
    }

    const dadosLiberados: DadosClienteProtegidos = {
      nomeCompleto: pedidoPrincipal.customerName,
      telefoneContato: pedidoPrincipal.customerPhone,
      email: pedidoPrincipal.customerEmail,
      enderecoCompleto: pedidoPrincipal.customerAddressFull,
      bairro: pedidoPrincipal.customerNeighborhood,
      cidade: pedidoPrincipal.customerCity,
      pontoReferencia: pedidoPrincipal.customerReferencePoint,
      instrucoesEntrega: pedidoPrincipal.customerDeliveryInstructions
    };

    // Registrar na Auditoria com snapshot mascarado
    this.registrarAuditoria({
      subpedidoId: subpedido_id,
      pedidoPrincipalId: subpedido.pedidoPrincipalId,
      lojaId: subpedido.lojaId,
      userId: solicitante.userId,
      userRole: solicitante.userRole,
      acao: 'LIBERAR_DADOS_DO_CLIENTE',
      detalhes: `Dados de entrega e contato do cliente liberados para a loja ${subpedido.lojaNome} (${subpedido.lojaId}) para o subpedido ${subpedido.codigoSubpedido}.`,
      dadosLiberadosSnapshot: {
        clienteNome: dadosLiberados.nomeCompleto,
        bairro: dadosLiberados.bairro,
        cidade: dadosLiberados.cidade,
        telefoneMascarado: dadosLiberados.telefoneContato.replace(/(\d{2})(\d{5})(\d{4})/, '($1) *****-$3')
      },
      ipAddress: solicitante.ipAddress
    });

    this.saveToStorage();
    return dadosLiberados;
  }

  // ==========================================================================
  // 6. VISÃO RESTRITA DO LOJISTA (ANTES DA VALIDAÇÃO DA TAXA)
  // ==========================================================================

  public obterVisaoRestritaLojista(
    subpedidoId: string,
    lojaId: string,
    usuarioRole: string
  ): VisaoRestritaLojistaSubpedido {
    const sub = this.state.subpedidos[subpedidoId];
    if (!sub) throw new Error(`Subpedido ${subpedidoId} não encontrado.`);

    if (usuarioRole !== 'MASTER' && sub.lojaId !== lojaId) {
      throw new Error('Acesso negado: Este subpedido pertence a outro lojista.');
    }

    const pedidoPrincipal = this.state.pedidosPrincipais[sub.pedidoPrincipalId];

    return {
      subpedidoId: sub.id,
      codigoSubpedido: sub.codigoSubpedido,
      lojaId: sub.lojaId,
      status: sub.status,
      clienteVerificado: pedidoPrincipal ? pedidoPrincipal.clientVerified : true,
      regiaoAproximada: sub.entrega.regiaoAproximada,
      cidade: pedidoPrincipal ? pedidoPrincipal.customerCity : 'Cachoeiras de Macacu',
      modalidade: sub.modalidade,
      itens: sub.itens.map((it) => ({
        produtoId: it.produtoId,
        nomeProduto: it.nomeProduto,
        imagemProduto: it.imagemProduto,
        quantidade: it.quantidade,
        precoUnitario: it.precoUnitario,
        subtotal: it.subtotal,
        variacoes: it.variacoes,
        statusItem: it.statusItem
      })),
      valorMercadorias: sub.valorMercadorias,
      taxaPlataformaValor: sub.taxaPlataformaValor,
      taxaPlataformaRate: sub.taxaPlataformaRate,
      criadoEm: sub.criadoEm
    };
  }

  // ==========================================================================
  // 7. CICLO OPERACIONAL, ENTREGA E PAGAMENTO DIRETO AO LOJISTA
  // ==========================================================================

  public avancarPreparacaoOuDespacho(
    subpedidoId: string,
    novoStatus: 'EM_PREPARO' | 'EM_ROTA' | 'PRONTO_RETIRADA',
    lojaId: string,
    usuarioId: string,
    usuarioRole: string
  ): Subpedido {
    const sub = this.state.subpedidos[subpedidoId];
    if (!sub) throw new Error('Subpedido não encontrado.');
    if (usuarioRole !== 'MASTER' && sub.lojaId !== lojaId) {
      throw new Error('Acesso negado.');
    }

    const statusAnterior = sub.status;
    sub.status = novoStatus;
    if (novoStatus === 'EM_ROTA') {
      sub.entrega.statusEntrega = 'DESPACHADO_EM_ROTA';
      sub.entrega.dataHoraDespacho = new Date().toISOString();
    } else if (novoStatus === 'PRONTO_RETIRADA') {
      sub.entrega.statusEntrega = 'DISPONIVEL_RETIRADA';
    } else if (novoStatus === 'EM_PREPARO') {
      sub.entrega.statusEntrega = 'EM_PREPARO';
    }

    sub.atualizadoEm = new Date().toISOString();

    this.registrarTransicaoStatus({
      entidadeTipo: 'SUBPEDIDO',
      entidadeId: subpedidoId,
      statusAnterior,
      statusNovo: novoStatus,
      alteradoPorUserId: usuarioId,
      alteradoPorRole: usuarioRole
    });

    this.reavaliarStatusPedidoPrincipal(sub.pedidoPrincipalId);
    this.saveToStorage();
    return sub;
  }

  public confirmarPagamentoMercadoriaDireto(
    subpedidoId: string,
    lojaId: string,
    usuarioId: string,
    usuarioRole: string
  ): Subpedido {
    const sub = this.state.subpedidos[subpedidoId];
    if (!sub) throw new Error('Subpedido não encontrado.');
    if (usuarioRole !== 'MASTER' && sub.lojaId !== lojaId) {
      throw new Error('Acesso negado: Somente a loja titular pode confirmar o recebimento do valor da mercadoria.');
    }

    const agora = new Date().toISOString();
    sub.pagamentoMercadoriaDiretoStatus = 'PAGO_DIRETAMENTE_AO_LOJISTA';
    sub.pagamentoMercadoriaConfirmadoAt = agora;
    sub.confirmacoes.confirmacaoPagamentoMercadoriaLoja = true;
    sub.confirmacoes.confirmacaoPagamentoMercadoriaLojaAt = agora;
    
    const statusAnterior = sub.status;
    sub.status = 'PAGAMENTO_MERCADORIA_CONFIRMADO';
    sub.atualizadoEm = agora;

    this.registrarAuditoria({
      subpedidoId,
      lojaId,
      userId: usuarioId,
      userRole: usuarioRole,
      acao: 'PAGAMENTO_MERCADORIA_CONFIRMADO_LOJA',
      detalhes: `Lojista ${sub.lojaNome} confirmou o recebimento direto de R$ ${sub.valorMercadorias.toFixed(2)} pago pelo cliente.`
    });

    this.registrarTransicaoStatus({
      entidadeTipo: 'SUBPEDIDO',
      entidadeId: subpedidoId,
      statusAnterior,
      statusNovo: 'PAGAMENTO_MERCADORIA_CONFIRMADO',
      motivo: 'Pagamento das mercadorias recebido diretamente pelo lojista.',
      alteradoPorUserId: usuarioId,
      alteradoPorRole: usuarioRole
    });

    this.verificarConclusaoSubpedido(sub);
    this.reavaliarStatusPedidoPrincipal(sub.pedidoPrincipalId);
    this.saveToStorage();
    return sub;
  }

  public confirmarRecebimentoClienteSubpedido(
    subpedidoId: string,
    clienteUserId: string,
    nomeRecebedor?: string,
    documentoRecebedor?: string
  ): Subpedido {
    const sub = this.state.subpedidos[subpedidoId];
    if (!sub) throw new Error('Subpedido não encontrado.');

    const pedidoPrincipal = this.state.pedidosPrincipais[sub.pedidoPrincipalId];
    if (!pedidoPrincipal || pedidoPrincipal.userId !== clienteUserId) {
      throw new Error('Acesso negado: Somente o cliente autor da compra pode confirmar o recebimento.');
    }

    const agora = new Date().toISOString();
    sub.confirmacoes.confirmacaoRecebimentoCliente = true;
    sub.confirmacoes.confirmacaoRecebimentoClienteAt = agora;
    sub.entrega.statusEntrega = sub.modalidade === 'RETIRADA' ? 'RETIRADO' : 'ENTREGUE';
    sub.entrega.dataHoraEntregaOuRetirada = agora;
    if (nomeRecebedor) sub.entrega.recebedorNome = nomeRecebedor;
    if (documentoRecebedor) sub.entrega.recebedorDocumento = documentoRecebedor;

    const statusAnterior = sub.status;
    sub.status = 'RECEBIMENTO_CONFIRMADO_CLIENTE';
    sub.atualizadoEm = agora;

    this.registrarAuditoria({
      subpedidoId,
      pedidoPrincipalId: sub.pedidoPrincipalId,
      userId: clienteUserId,
      userRole: 'CLIENTE',
      acao: 'RECEBIMENTO_CONFIRMADO_CLIENTE',
      detalhes: `Cliente confirmou o recebimento das mercadorias do subpedido ${sub.codigoSubpedido} (${sub.lojaNome}).`
    });

    this.registrarTransicaoStatus({
      entidadeTipo: 'SUBPEDIDO',
      entidadeId: subpedidoId,
      statusAnterior,
      statusNovo: 'RECEBIMENTO_CONFIRMADO_CLIENTE',
      motivo: 'Cliente confirmou entrega ou retirada com sucesso.',
      alteradoPorUserId: clienteUserId,
      alteradoPorRole: 'CLIENTE'
    });

    this.verificarConclusaoSubpedido(sub);
    this.reavaliarStatusPedidoPrincipal(sub.pedidoPrincipalId);
    this.saveToStorage();
    return sub;
  }

  private verificarConclusaoSubpedido(sub: Subpedido): void {
    // Se cliente confirmou recebimento E lojista confirmou pagamento das mercadorias -> CONCLUIDO
    if (
      sub.confirmacoes.confirmacaoRecebimentoCliente &&
      sub.confirmacoes.confirmacaoPagamentoMercadoriaLoja
    ) {
      const statusAnterior = sub.status;
      sub.status = 'CONCLUIDO';
      sub.atualizadoEm = new Date().toISOString();

      this.registrarTransicaoStatus({
        entidadeTipo: 'SUBPEDIDO',
        entidadeId: sub.id,
        statusAnterior,
        statusNovo: 'CONCLUIDO',
        motivo: 'Subpedido finalizado com sucesso: Mercadorias entregues e pagamento direto concluído.',
        alteradoPorUserId: 'SYSTEM',
        alteradoPorRole: 'SISTEMA'
      });
    }
  }

  // ==========================================================================
  // 8. MÁQUINA DE STATUS DO PEDIDO PRINCIPAL (CONSOLIDAÇÃO)
  // ==========================================================================

  private recalcularTotaisPedidoPrincipal(pedidoPrincipalId: string): void {
    const pedido = this.state.pedidosPrincipais[pedidoPrincipalId];
    if (!pedido) return;

    let totalMercadorias = 0;
    let totalTaxas = 0;

    pedido.subpedidos.forEach((sub) => {
      if (sub.status !== 'CANCELADO' && sub.status !== 'SEM_ESTOQUE' && sub.status !== 'CANCELADO_LOJA') {
        totalMercadorias += sub.valorMercadorias;
        totalTaxas += sub.taxaPlataformaValor;
      }
    });

    pedido.totalMercadorias = Number(totalMercadorias.toFixed(2));
    pedido.totalTaxasPlataforma = Number(totalTaxas.toFixed(2));

    if (pedido.pagamentoTaxa) {
      pedido.pagamentoTaxa.valorTotalTaxas = pedido.totalTaxasPlataforma;
    }
  }

  private reavaliarStatusPedidoPrincipal(pedidoPrincipalId: string): void {
    const pedido = this.state.pedidosPrincipais[pedidoPrincipalId];
    if (!pedido) return;

    const subpedidos = pedido.subpedidos;
    const agora = new Date().toISOString();
    const statusAnterior = pedido.status;

    // Regra 15: Pedido principal só fica CONCLUÍDO quando TODOS os subpedidos terminarem ou forem cancelados
    const todosFinalizadosOuCancelados = subpedidos.every(
      (s) => s.status === 'CONCLUIDO' || s.status === 'CANCELADO' || s.status === 'SEM_ESTOQUE' || s.status === 'CANCELADO_LOJA'
    );

    const aoMenosUmConcluido = subpedidos.some((s) => s.status === 'CONCLUIDO');
    const todosCancelados = subpedidos.every(
      (s) => s.status === 'CANCELADO' || s.status === 'SEM_ESTOQUE' || s.status === 'CANCELADO_LOJA'
    );

    if (todosCancelados) {
      pedido.status = 'CANCELADO';
      pedido.canceladoEm = agora;
    } else if (todosFinalizadosOuCancelados && aoMenosUmConcluido) {
      pedido.status = 'CONCLUIDO';
      pedido.concluidoEm = agora;
    } else {
      const aoMenosUmValidado = subpedidos.some(
        (s) =>
          s.status === 'COMPRA_VALIDADA' ||
          s.status === 'DADOS_LIBERADOS' ||
          s.status === 'EM_PREPARO' ||
          s.status === 'EM_ROTA' ||
          s.status === 'PRONTO_RETIRADA' ||
          s.status === 'PAGAMENTO_MERCADORIA_CONFIRMADO' ||
          s.status === 'RECEBIMENTO_CONFIRMADO_CLIENTE'
      );

      const todosEstoqueConfirmados = subpedidos.every(
        (s) =>
          s.confirmacoes.confirmacaoEstoqueLoja ||
          s.status === 'CANCELADO' ||
          s.status === 'SEM_ESTOQUE' ||
          s.status === 'CANCELADO_LOJA'
      );

      if (aoMenosUmValidado) {
        pedido.status = 'EM_ANDAMENTO';
      } else if (todosEstoqueConfirmados) {
        pedido.status = 'AGUARDANDO_PAGAMENTO_TAXAS';
      } else {
        pedido.status = 'AGUARDANDO_CONFIRMACOES_LOJAS';
      }
    }

    pedido.atualizadoEm = agora;

    if (pedido.status !== statusAnterior) {
      this.registrarTransicaoStatus({
        entidadeTipo: 'PEDIDO_PRINCIPAL',
        entidadeId: pedidoPrincipalId,
        statusAnterior,
        statusNovo: pedido.status,
        motivo: `Transição automática consolidada com base no status dos ${subpedidos.length} subpedidos.`,
        alteradoPorUserId: 'SYSTEM',
        alteradoPorRole: 'SISTEMA'
      });
    }
  }

  // ==========================================================================
  // 9. QUERIES E CONSULTAS
  // ==========================================================================

  public obterPedidoPrincipal(pedidoPrincipalId: string): PedidoPrincipal | null {
    return this.state.pedidosPrincipais[pedidoPrincipalId] || null;
  }

  public obterSubpedido(subpedidoId: string): Subpedido | null {
    return this.state.subpedidos[subpedidoId] || null;
  }

  public listarSubpedidosPorLoja(lojaId: string): Subpedido[] {
    return Object.values(this.state.subpedidos).filter((s) => s.lojaId === lojaId);
  }

  public listarPedidosPorCliente(clienteUserId: string): PedidoPrincipal[] {
    return Object.values(this.state.pedidosPrincipais).filter((p) => p.userId === clienteUserId);
  }

  public listarTodosPedidosPrincipais(): PedidoPrincipal[] {
    return Object.values(this.state.pedidosPrincipais);
  }

  public listarAuditoria(): RegistroAuditoria[] {
    return this.state.auditoria;
  }
}

// Instância singleton exportada
export const multiStoreDb = MultiStoreDatabase.getInstance();
