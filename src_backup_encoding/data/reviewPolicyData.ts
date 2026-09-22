import { CustomerToMerchantReview, MerchantToCustomerReview } from '../types';

export interface ReviewPolicySection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  rules: {
    heading: string;
    description: string;
    badge?: string;
  }[];
}

export const REVIEW_POLICY_DATA: {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: ReviewPolicySection[];
} = {
  title: 'Política de Avaliações Mútuas e Reputação Local',
  lastUpdated: 'Agosto de 2026',
  intro: 'O Achei Aqui Cachoeiras de Macacu opera sob o princípio da transparência comunitária, confiança mútua e valorização do comércio local. Nossa política de avaliação bidirecional permite que clientes avaliem lojas e prestadores, e que lojistas classifiquem a conduta e pontualidade de clientes, fomentando um ecossistema seguro e justo para toda a cidade.',
  sections: [
    {
      id: 'cliente-para-lojista',
      title: '1. Avaliação do Cliente para Lojas e Prestadores de Serviços',
      icon: 'Store',
      summary: 'Diretrizes para clientes avaliarem produtos, entregas, serviços e atendimento.',
      rules: [
        {
          heading: 'Compra ou Agendamento Verificado',
          description: 'Apenas clientes com pedidos finalizados (com status "Concluído" ou entregue) podem emitir avaliações públicas com estrelas e comentários, garantindo autenticidade real contra avaliações falsas.',
          badge: 'Segurança'
        },
        {
          heading: 'Critérios Detalhados de 1 a 5 Estrelas',
          description: 'A nota global é calculada a partir de 4 pilares: Qualidade do Produto/Serviço, Pontualidade na Entrega/Atendimento, Cordialidade no Atendimento e Custo-Benefício.',
          badge: 'Transparência'
        },
        {
          heading: 'Direito de Resposta Pública do Lojista',
          description: 'Lojas e prestadores têm o direito garantido de responder publicamente a qualquer avaliação com cordialidade, esclarecendo dúvidas ou apresentando soluções.',
          badge: 'Fair Play'
        },
        {
          heading: 'Prazo para Avaliar',
          description: 'O cliente pode enviar ou editar sua avaliação em até 30 dias corridos após a conclusão do pedido ou atendimento.',
          badge: '30 Dias'
        }
      ]
    },
    {
      id: 'lojista-para-cliente',
      title: '2. Avaliação do Lojista para o Comportamento do Cliente',
      icon: 'UserCheck',
      summary: 'Regras para lojistas avaliarem a pontualidade, comunicação e respeito do cliente após a finalização do pedido.',
      rules: [
        {
          heading: 'Finalidade: Proteção do Comércio Local',
          description: 'A avaliação do cliente visa incentivar boas práticas (pontualidade para receber o motoboy, comparecimento em agendamentos, cuidado com peças no Provador VIP e respeito nos combinados de pagamento).',
          badge: 'Comunidade'
        },
        {
          heading: 'Critérios de Avaliação do Cliente',
          description: 'O lojista avalia: Pontualidade (recebimento/retirada), Clareza e Cordialidade na Comunicação, Cumprimento dos combinados de pagamento e Cuidado/Respeito às regras do estabelecimento.',
          badge: 'Critérios Claros'
        },
        {
          heading: 'Selo de "Cliente Confiável / 5 Estrelas"',
          description: 'Clientes com médias altas ganham prioridade no atendimento, aprovação imediata para Provador VIP em domicílio e condições especiais de crédito ou desconto.',
          badge: 'Benefício VIP'
        },
        {
          heading: 'Regra Contra Retaliação e Proteção de Dados',
          description: 'É expressamente proibido avaliar o cliente de forma difamatória ou divulgar dados pessoais sensíveis. Avaliações com indícios de perseguição são imediatamente anuladas pela moderação.',
          badge: 'Privacidade'
        }
      ]
    },
    {
      id: 'proibicoes-e-moderacao',
      title: '3. Diretrizes de Conduta, Proibições e Moderação',
      icon: 'ShieldAlert',
      summary: 'O que não é tolerado na plataforma e como funciona a auditoria.',
      rules: [
        {
          heading: 'Conteúdo Ofensivo e Discurso de Ódio',
          description: 'Palavrões, ofensas pessoais, discriminação de qualquer natureza, acusações sem provas e assédio resultam em remoção imediata e banimento de conta.',
          badge: 'Tolerância Zero'
        },
        {
          heading: 'Concorrência Desleal & Avaliações Artificiais',
          description: 'Lojas que utilizarem contas falsas para se autoavaliarem positivamente ou prejudicarem concorrentes locais sofrerão descredenciamento e processo administrativo.',
          badge: 'Antifraude'
        },
        {
          heading: 'Canal de Contestação e Mediação',
          description: 'Tanto o consumidor quanto o lojista podem acionar a ouvidoria da plataforma ("Achei Aqui Mediação") caso considerem uma avaliação caluniosa ou inverídica.',
          badge: 'Suporte Local'
        }
      ]
    }
  ]
};

export const INITIAL_CUSTOMER_REVIEWS: CustomerToMerchantReview[] = [
  {
    id: 'rev-c-1',
    orderId: 'ord-101',
    orderCode: 'DEL-8921B',
    userId: 'user-cliente-1',
    userName: 'Mariana Silva',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    merchantId: 'm-boutique-elegance',
    merchantName: 'Boutique Elegance & Estilo',
    targetType: 'LOJA',
    rating: 5,
    criteria: {
      quality: 5,
      punctuality: 5,
      service: 5,
      costBenefit: 5
    },
    comment: 'Experiência impecável! O vestido de linho tem um caimento perfeito e o tecido é super fresco para o calor de Cachoeiras. A entrega chegou antes do prazo e com uma embalagem muito cheirosa!',
    tags: ['Entrega Rápida', 'Produto Impecável', 'Atendimento Nota 10', 'Recomendo com Certeza'],
    recommend: true,
    verifiedPurchase: true,
    status: 'active',
    merchantReply: {
      replyText: 'Muito obrigado pelo carinho, Mariana! Ficamos imensamente felizes em saber que você amou o vestido. Conte sempre conosco para as novidades!',
      repliedAt: '2026-08-25 às 15:30',
      merchantAuthorName: 'Fernanda (Proprietária)'
    },
    createdAt: '2026-08-25'
  },
  {
    id: 'rev-c-2',
    orderId: 'ord-102',
    orderCode: 'RET-3419A',
    userId: 'user-cliente-1',
    userName: 'Mariana Silva',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    merchantId: 'm-eletro-silva',
    merchantName: 'Silva Eletricista Residencial & Ar Condicionado',
    targetType: 'PRESTADOR_SERVICO',
    rating: 5,
    criteria: {
      quality: 5,
      punctuality: 5,
      service: 5,
      costBenefit: 5
    },
    comment: 'O Sr. Marcos foi extremamente profissional na instalação do quadro de luz e na higienização do ar condicionado. Trouxe todas as ferramentas, limpou tudo no final e explicou cada detalhe.',
    tags: ['Profissional Experiente', 'Pontualidade Britânica', 'Preço Justo', 'Serviço Limpo'],
    recommend: true,
    verifiedPurchase: true,
    status: 'active',
    merchantReply: {
      replyText: 'Agradeço pela confiança e pela ótima recepção na residência, Mariana! Qualquer necessidade de manutenção estou à disposição.',
      repliedAt: '2026-08-26 às 11:20',
      merchantAuthorName: 'Marcos Silva (Técnico)'
    },
    createdAt: '2026-08-26'
  },
  {
    id: 'rev-c-3',
    orderId: 'ord-103',
    orderCode: 'DEL-9912A',
    userId: 'user-cliente-2',
    userName: 'Roberto Mendes',
    merchantId: 'm-artesanal-burger',
    merchantName: 'Macacu Burger & Pizza Artesanal',
    targetType: 'LOJA',
    rating: 5,
    criteria: {
      quality: 5,
      punctuality: 4,
      service: 5,
      costBenefit: 5
    },
    comment: 'O melhor hambúrguer artesanal da região de Papucaia e Japuíba! Pão brioche macio, blend no ponto certo e a maionese verde da casa é sensacional.',
    tags: ['Sabor Incrível', 'Ingredientes Frescos', 'Porção Generosa'],
    recommend: true,
    verifiedPurchase: true,
    status: 'active',
    createdAt: '2026-08-27'
  }
];

export const INITIAL_MERCHANT_REVIEWS: MerchantToCustomerReview[] = [
  {
    id: 'rev-m-1',
    orderId: 'ord-101',
    orderCode: 'DEL-8921B',
    merchantId: 'm-boutique-elegance',
    merchantName: 'Boutique Elegance & Estilo',
    userId: 'user-cliente-1',
    userName: 'Mariana Silva',
    customerPhone: '(21) 98765-4321',
    rating: 5,
    behaviorCriteria: {
      punctuality: 5,
      communication: 5,
      paymentAndAgreements: 5,
      careAndRespect: 5
    },
    comment: 'Cliente exemplar! Muito educada, respondeu rápido no WhatsApp sobre as medidas para a entrega, recebeu o entregador pontualmente e cuidou perfeitamente das peças no Provador VIP. Recomendo com louvor!',
    behaviorTags: ['Cliente Pontual', 'Excelente Comunicação', 'Cuidado com Peças', 'Pagamento Imediato', 'Cliente 5 Estrelas'],
    recommendForOtherMerchants: true,
    createdAt: '2026-08-25'
  },
  {
    id: 'rev-m-2',
    orderId: 'ord-102',
    orderCode: 'RET-3419A',
    merchantId: 'm-eletro-silva',
    merchantName: 'Silva Eletricista Residencial & Ar Condicionado',
    userId: 'user-cliente-1',
    userName: 'Mariana Silva',
    customerPhone: '(21) 98765-4321',
    rating: 5,
    behaviorCriteria: {
      punctuality: 5,
      communication: 5,
      paymentAndAgreements: 5,
      careAndRespect: 5
    },
    comment: 'Ótima cliente. Ambiente preparado para a execução do serviço elétrico, recepcionou no horário combinado e realizou o pagamento via Pix imediatamente após o teste do circuito.',
    behaviorTags: ['Ambiente Organizado', 'Pontualidade', 'Pagamento Imediato', 'Muito Cordial'],
    recommendForOtherMerchants: true,
    createdAt: '2026-08-26'
  },
  {
    id: 'rev-m-3',
    orderId: 'ord-103',
    orderCode: 'DEL-9912A',
    merchantId: 'm-artesanal-burger',
    merchantName: 'Macacu Burger & Pizza Artesanal',
    userId: 'user-cliente-2',
    userName: 'Roberto Mendes',
    customerPhone: '(21) 99887-1122',
    rating: 5,
    behaviorCriteria: {
      punctuality: 5,
      communication: 5,
      paymentAndAgreements: 5,
      careAndRespect: 5
    },
    comment: 'Atendeu o interfone rapidamente no momento da entrega do delivery, facilitando o trabalho do motoboy. Excelente cliente!',
    behaviorTags: ['Atendimento Rápido ao Entregador', 'Comunicação Clara'],
    recommendForOtherMerchants: true,
    createdAt: '2026-08-27'
  }
];
