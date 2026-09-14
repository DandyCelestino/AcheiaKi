import { InAppNotification } from '../types';

export const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-user-mariana-001',
    title: '🌿 Olá, Mariana! Bem-vinda ao Achei Aqui',
    message: 'Olá, Mariana Silva! Sua conta pessoal está ativa com segurança. Você pode conversar diretamente com lojistas pelo chat interno dos produtos, fazer pedidos e acompanhar suas entregas em Cachoeiras de Macacu com total privacidade.',
    category: 'SISTEMA',
    audience: 'SPECIFIC_USER',
    recipientUserId: 'user-cliente-1',
    recipientName: 'Mariana Silva',
    recipientPhone: '(21) 98765-4321',
    senderName: 'Administração Achei Aqui',
    senderRole: 'SISTEMA',
    priority: 'NORMAL',
    actionUrl: 'home',
    actionLabel: 'Explorar Produtos Locais',
    readBy: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'notif-merch-carlos-001',
    title: '🏪 Olá, Carlos! Gestão da Boutique das Flores',
    message: 'Olá, Carlos Botelho! Suas notificações e conversas de pedidos da Boutique das Flores são estritamente particulares entre você e o cliente comprador. Ative ou desative o chat interno direto a qualquer momento no seu painel.',
    category: 'AVISO',
    audience: 'SPECIFIC_MERCHANT',
    recipientUserId: 'user-vendedor-1',
    recipientMerchantId: 'store-1',
    recipientName: 'Carlos Botelho',
    recipientPhone: '(21) 99888-1122',
    senderName: 'Administração Master Achei Aqui',
    senderRole: 'MASTER',
    priority: 'HIGH',
    actionUrl: 'orders',
    actionLabel: 'Abrir Pedidos',
    readBy: [],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'notif-master-admin-001',
    title: '🛡️ Olá, Administrador! Monitoramento Ativo',
    message: 'Olá, Administrador Master! O sistema de proteção de privacidade está garantindo que clientes e lojistas visualizem unicamente mensagens e notificações de seus próprios contatos diretos e pedidos.',
    category: 'SEGURANCA',
    audience: 'SPECIFIC_USER',
    recipientUserId: 'usr-master-1',
    recipientName: 'Administrador Master Supremo',
    senderName: 'Sistema de Segurança Achei Aqui',
    senderRole: 'SISTEMA',
    priority: 'HIGH',
    actionUrl: 'account',
    actionLabel: 'Painel Master',
    readBy: [],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

