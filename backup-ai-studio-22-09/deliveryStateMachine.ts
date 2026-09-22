import { DeliveryRide, DeliveryRideStatus, DeliveryDriver } from '../types';

export interface DeliveryActor {
  id: string;
  name: string;
  role: 'MASTER' | 'ADMIN' | 'LOJISTA' | 'ENTREGADOR' | 'CLIENTE' | 'SISTEMA';
  email?: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Mapeamento das Transições Válidas por Status e por Perfil de Usuário
 */
const VALID_TRANSITIONS: Record<
  DeliveryRideStatus,
  Array<{
    to: DeliveryRideStatus;
    allowedRoles: Array<DeliveryActor['role']>;
    description: string;
  }>
> = {
  AGUARDANDO_ANALISE: [
    { to: 'APROVADA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Aprovação operacional pelo Master' },
    { to: 'DISPONIVEL_ENTREGADORES', allowedRoles: ['MASTER', 'ADMIN'], description: 'Aprovar e abrir chamada aos entregadores' },
    { to: 'ENTREGADOR_SELECIONADO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Aprovar e direcionar a entregador específico' },
    { to: 'CORRECAO_SOLICITADA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Solicitar correção dos dados da entrega ao lojista' },
    { to: 'REJEITADA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Rejeitar solicitação de entrega com justificativa' },
    { to: 'CANCELADA', allowedRoles: ['MASTER', 'ADMIN', 'LOJISTA'], description: 'Cancelamento antes da aprovação' }
  ],
  CORRECAO_SOLICITADA: [
    { to: 'AGUARDANDO_ANALISE', allowedRoles: ['LOJISTA', 'MASTER', 'ADMIN'], description: 'Reenviar para análise após correção do lojista' },
    { to: 'DISPONIVEL_ENTREGADORES', allowedRoles: ['MASTER', 'ADMIN'], description: 'Aprovação direta após ajuste' },
    { to: 'REJEITADA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Rejeição definitiva' },
    { to: 'CANCELADA', allowedRoles: ['LOJISTA', 'MASTER', 'ADMIN'], description: 'Cancelamento pelo lojista' }
  ],
  APROVADA: [
    { to: 'DISPONIVEL_ENTREGADORES', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Disponibilizar no radar de entregadores' },
    { to: 'ENTREGADOR_SELECIONADO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Direcionar despacho para entregador' },
    { to: 'CANCELADA', allowedRoles: ['MASTER', 'ADMIN', 'LOJISTA'], description: 'Cancelamento operacional' }
  ],
  REJEITADA: [],
  DISPONIVEL_ENTREGADORES: [
    { to: 'ACEITA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entregador aceita a corrida no radar' },
    { to: 'ENTREGADOR_SELECIONADO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Atribuir a entregador manualmente' },
    { to: 'CANCELADA', allowedRoles: ['MASTER', 'ADMIN', 'LOJISTA'], description: 'Cancelamento da corrida' }
  ],
  ENTREGADOR_SELECIONADO: [
    { to: 'ACEITA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entregador selecionado confirma aceite' },
    { to: 'DISPONIVEL_ENTREGADORES', allowedRoles: ['MASTER', 'ADMIN'], description: 'Devolver ao radar geral de entregadores' },
    { to: 'CANCELADA', allowedRoles: ['MASTER', 'ADMIN', 'LOJISTA'], description: 'Cancelamento pelo Master ou Lojista' }
  ],
  ACEITA: [
    { to: 'EM_DESLOCAMENTO_COLETA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entregador a caminho da loja/coleta' },
    { to: 'CANCELADA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Cancelamento por motivo excepcional' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Impossibilidade de atendimento' }
  ],
  EM_DESLOCAMENTO_COLETA: [
    { to: 'CHEGOU_COLETA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entregador avisa que chegou na loja' },
    { to: 'COLETADA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN', 'LOJISTA'], description: 'Pacote conferido e coletado' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Ocorrência no ponto de coleta' }
  ],
  CHEGOU_COLETA: [
    { to: 'COLETADA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN', 'LOJISTA'], description: 'Pacote recebido pelo entregador' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Ocorrência ou recusa na coleta' }
  ],
  COLETADA: [
    { to: 'EM_DESLOCAMENTO_ENTREGA', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entregador em trânsito até o endereço do cliente' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Falha durante o transporte ou devolução' }
  ],
  EM_DESLOCAMENTO_ENTREGA: [
    { to: 'CHEGOU_DESTINO', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entregador chegou no endereço do cliente' },
    { to: 'AGUARDANDO_CODIGO', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Solicitando código de segurança ao cliente' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Cliente não localizado / Recusa' }
  ],
  CHEGOU_DESTINO: [
    { to: 'AGUARDANDO_CODIGO', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Aguardando validação do código de 4 dígitos' },
    { to: 'ENTREGUE', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Entrega finalizada com código' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Endereço incorreto / Destinatário ausente' }
  ],
  AGUARDANDO_CODIGO: [
    { to: 'ENTREGUE', allowedRoles: ['ENTREGADOR', 'MASTER', 'ADMIN'], description: 'Código confirmado com sucesso' },
    { to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Código inválido repetidas vezes ou ausência' }
  ],
  ENTREGUE: [
    { to: 'AGUARDANDO_LIBERACAO_PAGAMENTO', allowedRoles: ['SISTEMA', 'MASTER', 'ADMIN', 'ENTREGADOR'], description: 'Aguardando autorização de repasse pelo Master' },
    { to: 'PAGAMENTO_AUTORIZADO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Master autoriza liberação de pagamento imediato' }
  ],
  AGUARDANDO_LIBERACAO_PAGAMENTO: [
    { to: 'PAGAMENTO_AUTORIZADO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Master valida auditoria e autoriza pagamento' },
    { to: 'PAGAMENTO_PROCESSANDO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Processamento direto no gateway' }
  ],
  PAGAMENTO_AUTORIZADO: [
    { to: 'PAGAMENTO_PROCESSANDO', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Enviando ordem de transferência Pix' },
    { to: 'PAGA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Confirmação manual de repasse concluído' }
  ],
  PAGAMENTO_PROCESSANDO: [
    { to: 'PAGA', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Repasse creditado na conta do entregador' },
    { to: 'PAGAMENTO_FALHOU', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Falha na chave Pix ou gateway' }
  ],
  PAGA: [],
  PAGAMENTO_FALHOU: [
    { to: 'PAGAMENTO_PROCESSANDO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Tentar reprocessar pagamento' },
    { to: 'PAGA', allowedRoles: ['MASTER', 'ADMIN'], description: 'Repasse regularizado manualmente' }
  ],
  CANCELADA: [],
  DEVOLVIDA: [
    { to: 'PAGAMENTO_AUTORIZADO', allowedRoles: ['MASTER', 'ADMIN'], description: 'Pagamento proporcional por deslocamento de devolução' }
  ],
  // Estados legados
  CRIADA: [{ to: 'AGUARDANDO_ANALISE', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Migrar para análise operacional' }],
  AGUARDANDO_ENTREGADOR: [{ to: 'DISPONIVEL_ENTREGADORES', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Normalizar status' }],
  EM_COLETA: [{ to: 'EM_DESLOCAMENTO_COLETA', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA', 'ENTREGADOR'], description: 'Normalizar status' }],
  EM_TRANSITO: [{ to: 'EM_DESLOCAMENTO_ENTREGA', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA', 'ENTREGADOR'], description: 'Normalizar status' }],
  FINALIZADA: [{ to: 'PAGA', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Normalizar status' }],
  OCORRENCIA: [{ to: 'DEVOLVIDA', allowedRoles: ['MASTER', 'ADMIN', 'SISTEMA'], description: 'Normalizar status' }]
};

/**
 * Valida se uma transição de status é permitida pelo ator especificado
 */
export function validateDeliveryTransition(
  ride: DeliveryRide,
  toStatus: DeliveryRideStatus,
  actor: DeliveryActor
): TransitionValidationResult {
  // Master e Admin têm autoridade de controle de auditoria com justificativa
  if (actor.role === 'MASTER' || actor.role === 'ADMIN') {
    return { allowed: true };
  }

  const currentStatus = ride.status;
  const transitions = VALID_TRANSITIONS[currentStatus] || [];
  const match = transitions.find((t) => t.to === toStatus);

  if (!match) {
    return {
      allowed: false,
      reason: `Transição inválida de "${currentStatus}" para "${toStatus}". A máquina de estados não permite este salto de etapa.`
    };
  }

  if (!match.allowedRoles.includes(actor.role)) {
    return {
      allowed: false,
      reason: `Perfil ${actor.role} não possui autorização para mudar o status de "${currentStatus}" para "${toStatus}". Requer aprovação do Master/Admin.`
    };
  }

  // Se for o entregador tentando interagir com corrida de outro entregador
  if (actor.role === 'ENTREGADOR' && ride.driverId && ride.driverId !== actor.id && toStatus !== 'ACEITA') {
    return {
      allowed: false,
      reason: 'Esta entrega pertence a outro entregador parceiro.'
    };
  }

  return { allowed: true };
}

/**
 * Retorna as transições disponíveis para a corrida atual de acordo com o perfil
 */
export function getAvailableTransitions(
  ride: DeliveryRide,
  actorRole: DeliveryActor['role']
): Array<{ to: DeliveryRideStatus; description: string }> {
  const transitions = VALID_TRANSITIONS[ride.status] || [];
  if (actorRole === 'MASTER' || actorRole === 'ADMIN') {
    return transitions.map((t) => ({ to: t.to, description: t.description }));
  }
  return transitions
    .filter((t) => t.allowedRoles.includes(actorRole))
    .map((t) => ({ to: t.to, description: t.description }));
}

/**
 * Helper com textos, cores e badges para cada status da máquina
 */
export function getDeliveryStatusConfig(status: DeliveryRideStatus): {
  label: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  description: string;
} {
  switch (status) {
    case 'AGUARDANDO_ANALISE':
      return {
        label: 'Aguardando Análise Master',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        borderClass: 'border-amber-500',
        bgLightClass: 'bg-amber-950/40',
        description: 'Solicitação do lojista pendente de validação operacional pela central.'
      };
    case 'CORRECAO_SOLICITADA':
      return {
        label: 'Correção Solicitada',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        borderClass: 'border-orange-500',
        bgLightClass: 'bg-orange-950/40',
        description: 'Master solicitou que o lojista ajuste dados da entrega.'
      };
    case 'APROVADA':
      return {
        label: 'Aprovada pelo Master',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        borderClass: 'border-blue-500',
        bgLightClass: 'bg-blue-950/40',
        description: 'Entrega aprovada pela central de despacho.'
      };
    case 'REJEITADA':
      return {
        label: 'Rejeitada',
        badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
        borderClass: 'border-red-500',
        bgLightClass: 'bg-red-950/40',
        description: 'Solicitação rejeitada pela central operacional.'
      };
    case 'DISPONIVEL_ENTREGADORES':
    case 'AGUARDANDO_ENTREGADOR':
      return {
        label: 'Disponível no Radar',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        borderClass: 'border-emerald-500',
        bgLightClass: 'bg-emerald-950/40',
        description: 'Aguardando aceite de entregador credenciado em Cachoeiras de Macacu.'
      };
    case 'ENTREGADOR_SELECIONADO':
      return {
        label: 'Entregador Selecionado',
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        borderClass: 'border-indigo-500',
        bgLightClass: 'bg-indigo-950/40',
        description: 'Direcionada exclusivamente para o entregador indicado.'
      };
    case 'ACEITA':
      return {
        label: 'Aceita pelo Entregador',
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        borderClass: 'border-sky-500',
        bgLightClass: 'bg-sky-950/40',
        description: 'Entregador parceiro aceitou a entrega.'
      };
    case 'EM_DESLOCAMENTO_COLETA':
    case 'EM_COLETA':
      return {
        label: 'A Caminho da Coleta',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        borderClass: 'border-purple-500',
        bgLightClass: 'bg-purple-950/40',
        description: 'Entregador em deslocamento até o estabelecimento do lojista.'
      };
    case 'CHEGOU_COLETA':
      return {
        label: 'Chegou na Loja',
        badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
        borderClass: 'border-violet-500',
        bgLightClass: 'bg-violet-950/40',
        description: 'Entregador no ponto de coleta aguardando entrega do pacote.'
      };
    case 'COLETADA':
      return {
        label: 'Pacote Coletado',
        badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        borderClass: 'border-cyan-500',
        bgLightClass: 'bg-cyan-950/40',
        description: 'Mercadoria conferida e sob posse do entregador.'
      };
    case 'EM_DESLOCAMENTO_ENTREGA':
    case 'EM_TRANSITO':
      return {
        label: 'A Caminho do Destino',
        badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        borderClass: 'border-teal-500',
        bgLightClass: 'bg-teal-950/40',
        description: 'Entregador em trânsito para o endereço do cliente.'
      };
    case 'CHEGOU_DESTINO':
      return {
        label: 'No Endereço do Cliente',
        badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
        borderClass: 'border-lime-500',
        bgLightClass: 'bg-lime-950/40',
        description: 'Entregador no local de entrega.'
      };
    case 'AGUARDANDO_CODIGO':
      return {
        label: 'Aguardando Código de Entrega',
        badgeClass: 'bg-amber-400/20 text-amber-200 border-amber-400/40 animate-pulse',
        borderClass: 'border-amber-400',
        bgLightClass: 'bg-amber-950/50',
        description: 'Conferência obrigatória do código numérico de 4 dígitos.'
      };
    case 'ENTREGUE':
      return {
        label: 'Entregue com Sucesso',
        badgeClass: 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50',
        borderClass: 'border-emerald-500',
        bgLightClass: 'bg-emerald-950/50',
        description: 'Mercadoria entregue e código autenticado.'
      };
    case 'AGUARDANDO_LIBERACAO_PAGAMENTO':
      return {
        label: 'Aguardando Liberação Pgto',
        badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        borderClass: 'border-yellow-500',
        bgLightClass: 'bg-yellow-950/40',
        description: 'Entrega finalizada com sucesso. Pendente de autorização do repasse.'
      };
    case 'PAGAMENTO_AUTORIZADO':
      return {
        label: 'Pagamento Autorizado',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        borderClass: 'border-blue-500',
        bgLightClass: 'bg-blue-950/40',
        description: 'Repasse aprovado pelo Master. Pronto para transferência.'
      };
    case 'PAGAMENTO_PROCESSANDO':
      return {
        label: 'Pagamento Processando',
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse',
        borderClass: 'border-indigo-500',
        bgLightClass: 'bg-indigo-950/40',
        description: 'Ordem Pix enviada ao gateway de liquidação bancária.'
      };
    case 'PAGA':
    case 'FINALIZADA':
      return {
        label: 'Entregue & Paga',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        borderClass: 'border-emerald-500',
        bgLightClass: 'bg-emerald-950/40',
        description: 'Ciclo completo: entrega realizada e entregador 100% remunerado.'
      };
    case 'PAGAMENTO_FALHOU':
      return {
        label: 'Falha no Pagamento',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        borderClass: 'border-rose-500',
        bgLightClass: 'bg-rose-950/40',
        description: 'Problema na liquidação Pix. Requer reprocessamento pelo Master.'
      };
    case 'CANCELADA':
      return {
        label: 'Cancelada',
        badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        borderClass: 'border-slate-500',
        bgLightClass: 'bg-slate-900/50',
        description: 'Entrega cancelada pelo lojista ou central.'
      };
    case 'DEVOLVIDA':
    case 'OCORRENCIA':
      return {
        label: 'Devolvida ao Estabelecimento',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        borderClass: 'border-orange-500',
        bgLightClass: 'bg-orange-950/40',
        description: 'Mercadoria retornada à loja por impossibilidade de entrega.'
      };
    default:
      return {
        label: String(status),
        badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        borderClass: 'border-slate-500',
        bgLightClass: 'bg-slate-900/50',
        description: 'Status em andamento.'
      };
  }
}

/**
 * Métricas operacionais em tempo real para o Painel Master / Admin Delivery
 */
export function calculateDeliveryOperationalStats(
  rides: DeliveryRide[],
  drivers: DeliveryDriver[]
) {
  const aguardandoAnalise = rides.filter((r) => r.status === 'AGUARDANDO_ANALISE');
  const aprovadas = rides.filter((r) => r.status === 'APROVADA');
  
  const emAndamentoStatuses: DeliveryRideStatus[] = [
    'DISPONIVEL_ENTREGADORES',
    'ENTREGADOR_SELECIONADO',
    'ACEITA',
    'EM_DESLOCAMENTO_COLETA',
    'CHEGOU_COLETA',
    'COLETADA',
    'EM_DESLOCAMENTO_ENTREGA',
    'CHEGOU_DESTINO',
    'AGUARDANDO_CODIGO',
    // Legados
    'AGUARDANDO_ENTREGADOR',
    'EM_COLETA',
    'EM_TRANSITO'
  ];
  const emAndamento = rides.filter((r) => emAndamentoStatuses.includes(r.status));
  
  const concluidas = rides.filter((r) => ['ENTREGUE', 'PAGA', 'FINALIZADA'].includes(r.status));
  const aguardandoPagamento = rides.filter((r) => ['AGUARDANDO_LIBERACAO_PAGAMENTO', 'PAGAMENTO_AUTORIZADO'].includes(r.status));
  const pagamentosProcessando = rides.filter((r) => r.status === 'PAGAMENTO_PROCESSANDO');
  const pagamentosConcluidos = rides.filter((r) => ['PAGA', 'FINALIZADA'].includes(r.status));
  const pagamentosFalha = rides.filter((r) => r.status === 'PAGAMENTO_FALHOU');
  const cancelamentos = rides.filter((r) => r.status === 'CANCELADA');
  const devolucoes = rides.filter((r) => ['DEVOLVIDA', 'OCORRENCIA'].includes(r.status));

  // Entregadores
  const onlineDrivers = drivers.filter((d) => d.operationalStatus === 'ONLINE' && d.status === 'APROVADO');
  const busyDriverIds = new Set(
    rides
      .filter((r) => r.driverId && emAndamentoStatuses.includes(r.status) && r.status !== 'DISPONIVEL_ENTREGADORES')
      .map((r) => r.driverId)
  );

  const entregadoresOnline = onlineDrivers.length;
  const entregadoresOcupados = onlineDrivers.filter((d) => busyDriverIds.has(d.id)).length;
  const entregadoresDisponiveis = Math.max(0, entregadoresOnline - entregadoresOcupados);

  return {
    aguardandoAnalise: aguardandoAnalise.length,
    aprovadas: aprovadas.length,
    emAndamento: emAndamento.length,
    concluidas: concluidas.length,
    aguardandoPagamento: aguardandoPagamento.length,
    pagamentosProcessando: pagamentosProcessando.length,
    pagamentosConcluidos: pagamentosConcluidos.length,
    pagamentosFalha: pagamentosFalha.length,
    cancelamentos: cancelamentos.length,
    devolucoes: devolucoes.length,
    entregadoresOnline,
    entregadoresOcupados,
    entregadoresDisponiveis,
    totalRides: rides.length,
    totalDrivers: drivers.length
  };
}
