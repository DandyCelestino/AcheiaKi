import { SubOrderMessage } from '../types';

export const INITIAL_SUBORDER_MESSAGES: SubOrderMessage[] = [
  {
    id: 'msg-sub-1',
    subpedidoId: 'sub-10001-a',
    pedidoPrincipalId: 'ord-principal-10001',
    codigoSubpedido: '#10001-A',
    senderId: 'user-master-1',
    senderName: 'Sistema Achei Aqui',
    senderRole: 'SISTEMA',
    recipientRole: 'ALL',
    message: 'Canal de conversa interna aberto para o Subpedido #10001-A. Todas as mensagens são registradas com segurança.',
    readBy: ['user-master-1', 'user-cliente-1', 'user-vendedor-1'],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'msg-sub-2',
    subpedidoId: 'sub-10001-a',
    pedidoPrincipalId: 'ord-principal-10001',
    codigoSubpedido: '#10001-A',
    senderId: 'user-cliente-1',
    senderName: 'Carlos Eduardo Souza',
    senderRole: 'CLIENTE',
    recipientRole: 'VENDEDOR',
    message: 'Olá! Gostaria de saber se o item já está separado para entrega ou retirada.',
    readBy: ['user-cliente-1', 'user-vendedor-1'],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'msg-sub-3',
    subpedidoId: 'sub-10001-a',
    pedidoPrincipalId: 'ord-principal-10001',
    codigoSubpedido: '#10001-A',
    senderId: 'user-vendedor-1',
    senderName: 'Padaria e Confeitaria Imperial',
    senderRole: 'VENDEDOR',
    recipientRole: 'CLIENTE',
    message: 'Olá Carlos! Seu pedido já está embalado com todo carinho e pronto.',
    readBy: ['user-vendedor-1', 'user-cliente-1'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];
