export interface Subcategory {
  id: string;
  name: string; // Caixa baixa Ex: "lojas de roupas & moda feminina", "consultórios odontológicos & dentistas"
  categoryId: string; // Categoria pai em CAIXA ALTA (ex: "lojas", "produtos", "servicos")
  label?: string; // Sinônimo para compatibilidade
  query?: string;
  icon?: string;
  description?: string;
}

export interface CategoryShortcut extends Subcategory {
  label: string;
}

export interface CategoryTaxonomy {
  id: string;
  name: string; // CAIXA ALTA Ex: "LOJAS", "PRODUTOS", "PRESTADORES DE SERVIÇOS"
  nameCapitalized: string; // Ex: "Lojas", "Produtos", "Prestadores de Serviços"
  icon: string;
  badge?: string;
  isFirstHighlight?: boolean;
  description: string;
  keywords: string[];
  subcategories: Subcategory[];
  shortcuts: CategoryShortcut[]; // Alias para compatibilidade
}

export const CATEGORIES_TAXONOMY: CategoryTaxonomy[] = [
  // 1ª OPÇÃO EM DESTAQUE: LOJAS
  {
    id: 'lojas',
    name: 'LOJAS',
    nameCapitalized: 'Lojas',
    icon: 'Store',
    badge: 'Destaque 1ª Opção',
    isFirstHighlight: true,
    description: 'Comércios locais, boutiques de roupas, magazines, materiais de construção, papelarias e óticas em Cachoeiras.',
    keywords: ['loja', 'boutique', 'comércio', 'magazine', 'calçados', 'roupas', 'flores', 'ótica', 'construção', 'papelaria', 'mercado', 'farmácia'],
    subcategories: [
      { id: 'sub-lojas-moda', categoryId: 'lojas', name: 'lojas de roupas & moda feminina', label: 'lojas de roupas & moda feminina', query: 'vestido' },
      { id: 'sub-lojas-calcados', categoryId: 'lojas', name: 'lojas de calçados, tênis & bolsas', label: 'lojas de calçados, tênis & bolsas', query: 'calçado' },
      { id: 'sub-lojas-moveis', categoryId: 'lojas', name: 'lojas de móveis & decoração', label: 'lojas de móveis & decoração', query: 'móveis' },
      { id: 'sub-lojas-tech', categoryId: 'lojas', name: 'lojas de celulares & informática', label: 'lojas de celulares & informática', query: 'celular' },
      { id: 'sub-lojas-presentes', categoryId: 'lojas', name: 'lojas de presentes, flores & cestas', label: 'lojas de presentes, flores & cestas', query: 'flores' },
      { id: 'sub-lojas-construcao', categoryId: 'lojas', name: 'lojas de materiais de construção & tintas', label: 'lojas de materiais de construção & tintas', query: 'construção' },
      { id: 'sub-lojas-agro-pet', categoryId: 'lojas', name: 'lojas agropecuárias & artigos pet', label: 'lojas agropecuárias & artigos pet', query: 'ração' },
      { id: 'sub-lojas-supermercado', categoryId: 'lojas', name: 'supermercados & hortifrúti', label: 'supermercados & hortifrúti', query: 'mercado' },
      { id: 'sub-lojas-farmacias', categoryId: 'lojas', name: 'farmácias & drogarias', label: 'farmácias & drogarias', query: 'farmácia' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 2ª OPÇÃO EM DESTAQUE: PRODUTOS
  {
    id: 'produtos',
    name: 'PRODUTOS',
    nameCapitalized: 'Produtos',
    icon: 'ShoppingBag',
    badge: 'Ofertas & Lançamentos',
    isFirstHighlight: true,
    description: 'Catálogo completo de produtos com pronta entrega via motoboy, retirada sem filas ou provador VIP.',
    keywords: ['produto', 'vestido', 'camisa', 'smartphone', 'pizza', 'orquídea', 'cesta', 'calçado', 'acessório', 'fone', 'oferta', 'lançamento'],
    subcategories: [
      { id: 'sub-prod-moda-fem', categoryId: 'produtos', name: 'vestidos & moda feminina em linho', label: 'vestidos & moda feminina em linho', query: 'vestido' },
      { id: 'sub-prod-moda-masc', categoryId: 'produtos', name: 'camisas & bermudas masculinas', label: 'camisas & bermudas masculinas', query: 'camisa' },
      { id: 'sub-prod-calcados', categoryId: 'produtos', name: 'sandálias, sapatilhas & calçados', label: 'sandálias, sapatilhas & calçados', query: 'sandália' },
      { id: 'sub-prod-tech', categoryId: 'produtos', name: 'smartphones, fones & carregadores', label: 'smartphones, fones & carregadores', query: 'fone' },
      { id: 'sub-prod-flores', categoryId: 'produtos', name: 'buquês de flores & cestas de café', label: 'buquês de flores & cestas de café', query: 'buquê' },
      { id: 'sub-prod-casa', categoryId: 'produtos', name: 'artigos para o lar & utilidades', label: 'artigos para o lar & utilidades', query: 'casa' },
      { id: 'sub-prod-alimentos', categoryId: 'produtos', name: 'produtos alimentícios & mercearia', label: 'produtos alimentícios & mercearia', query: 'alimento' },
      { id: 'sub-prod-pet', categoryId: 'produtos', name: 'rações & petiscos para cães e gatos', label: 'rações & petiscos para cães e gatos', query: 'ração' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 3ª OPÇÃO: PRESTADORES DE SERVIÇOS
  {
    id: 'servicos',
    name: 'PRESTADORES DE SERVIÇOS',
    nameCapitalized: 'Prestadores de Serviços',
    icon: 'Wrench',
    badge: 'Profissionais Verificados',
    description: 'Eletricistas, encanadores, pintores, pedreiros, diaristas, técnicos e maridos de aluguel em Cachoeiras de Macacu.',
    keywords: ['serviço', 'eletricista', 'encanador', 'pintor', 'pedreiro', 'diarista', 'técnico', 'faz-tudo', 'marido de aluguel', 'ar condicionado', 'montador', 'conserto'],
    subcategories: [
      { id: 'sub-serv-instalacao-manutencao', categoryId: 'servicos', name: 'instalação, manutenção de equipamentos diversos', label: 'instalação, manutenção de equipamentos diversos', query: 'instalação' },
      { id: 'sub-serv-eletricistas', categoryId: 'servicos', name: 'eletricistas residenciais & prediais', label: 'eletricistas residenciais & prediais', query: 'eletricista' },
      { id: 'sub-serv-encanadores', categoryId: 'servicos', name: 'encanadores & desentupimento de esgoto', label: 'encanadores & desentupimento de esgoto', query: 'encanador' },
      { id: 'sub-serv-pintores', categoryId: 'servicos', name: 'pintores residenciais & textura', label: 'pintores residenciais & textura', query: 'pintor' },
      { id: 'sub-serv-pedreiros', categoryId: 'servicos', name: 'pedreiros & pequenas reformas', label: 'pedreiros & pequenas reformas', query: 'obra' },
      { id: 'sub-serv-diaristas', categoryId: 'servicos', name: 'diaristas, passadeiras & faxinas', label: 'diaristas, passadeiras & faxinas', query: 'faxina' },
      { id: 'sub-serv-marido-aluguel', categoryId: 'servicos', name: 'marido de aluguel & pequenos reparos', label: 'marido de aluguel & pequenos reparos', query: 'marido de aluguel' },
      { id: 'sub-serv-ar-condicionado', categoryId: 'servicos', name: 'instalação & limpeza de ar condicionado', label: 'instalação & limpeza de ar condicionado', query: 'ar condicionado' },
      { id: 'sub-serv-montadores', categoryId: 'servicos', name: 'montagem & desmontagem de móveis', label: 'montagem & desmontagem de móveis', query: 'móveis' },
      { id: 'sub-serv-jardinagem', categoryId: 'servicos', name: 'jardinagem, roçagem & poda', label: 'jardinagem, roçagem & poda', query: 'jardim' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 4ª OPÇÃO: CONSULTÓRIOS & CLÍNICAS
  {
    id: 'consultorios',
    name: 'CONSULTÓRIOS',
    nameCapitalized: 'Consultórios & Clínicas',
    icon: 'Stethoscope',
    badge: 'Saúde & Bem-Estar',
    description: 'Consultórios odontológicos, clínicas médicas, psicólogos, fisioterapeutas, nutricionistas e exames.',
    keywords: ['consultório', 'clínica', 'dentista', 'odontologia', 'médico', 'psicólogo', 'fisioterapia', 'pilates', 'nutricionista', 'exame', 'saúde', 'terapia'],
    subcategories: [
      { id: 'sub-cons-dentistas', categoryId: 'consultorios', name: 'consultórios odontológicos & dentistas', label: 'consultórios odontológicos & dentistas', query: 'dentista' },
      { id: 'sub-cons-medicos', categoryId: 'consultorios', name: 'clínicas médicas & consultas especializadas', label: 'clínicas médicas & consultas especializadas', query: 'médico' },
      { id: 'sub-cons-psicologia', categoryId: 'consultorios', name: 'psicologia & terapia infantil/adulto', label: 'psicologia & terapia infantil/adulto', query: 'psicologia' },
      { id: 'sub-cons-fisioterapia', categoryId: 'consultorios', name: 'fisioterapia, pilates & reabilitação', label: 'fisioterapia, pilates & reabilitação', query: 'fisioterapia' },
      { id: 'sub-cons-nutricao', categoryId: 'consultorios', name: 'nutricionistas & planos alimentares', label: 'nutricionistas & planos alimentares', query: 'nutrição' },
      { id: 'sub-cons-exames', categoryId: 'consultorios', name: 'laboratórios de exames de sangue & imagem', label: 'laboratórios de exames de sangue & imagem', query: 'exame' },
      { id: 'sub-cons-veterinarios', categoryId: 'consultorios', name: 'consultórios & clínicas veterinárias', label: 'consultórios & clínicas veterinárias', query: 'veterinário' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 5ª OPÇÃO: GASTRONOMIA & DELIVERY
  {
    id: 'gastronomia',
    name: 'GASTRONOMIA',
    nameCapitalized: 'Gastronomia & Delivery',
    icon: 'UtensilsCrossed',
    badge: 'Delivery Rápido',
    description: 'Pizzas no forno a lenha, hambúrgueres artesanais, marmitex caseiro, lanches, açaí e doces.',
    keywords: ['gastronomia', 'delivery', 'comida', 'pizza', 'hambúrguer', 'marmita', 'lanche', 'pastel', 'salgado', 'doce', 'bolo', 'açaí', 'bebida', 'refeição'],
    subcategories: [
      { id: 'sub-gast-pizzas', categoryId: 'gastronomia', name: 'pizzarias no forno a lenha', label: 'pizzarias no forno a lenha', query: 'pizza' },
      { id: 'sub-gast-burgers', categoryId: 'gastronomia', name: 'hambúrgueres artesanais & smash', label: 'hambúrgueres artesanais & smash', query: 'hambúrguer' },
      { id: 'sub-gast-marmitas', categoryId: 'gastronomia', name: 'marmitas caseiras & pratos executivos', label: 'marmitas caseiras & pratos executivos', query: 'marmita' },
      { id: 'sub-gast-lanches', categoryId: 'gastronomia', name: 'lanches, pastéis & coxinhas', label: 'lanches, pastéis & coxinhas', query: 'lanche' },
      { id: 'sub-gast-doces', categoryId: 'gastronomia', name: 'docerias, bolos confeitados & tortas', label: 'docerias, bolos confeitados & tortas', query: 'doce' },
      { id: 'sub-gast-acai', categoryId: 'gastronomia', name: 'açaí no copo, tigelas & sorvetes', label: 'açaí no copo, tigelas & sorvetes', query: 'açaí' },
      { id: 'sub-gast-bebidas', categoryId: 'gastronomia', name: 'distribuidoras de bebidas & gelo', label: 'distribuidoras de bebidas & gelo', query: 'bebida' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 6ª OPÇÃO: BELEZA & ESTÉTICA
  {
    id: 'beleza',
    name: 'BELEZA & ESTÉTICA',
    nameCapitalized: 'Beleza & Estética',
    icon: 'Scissors',
    badge: 'Agendamentos',
    description: 'Salões de cabeleireiro, barbearias vintage, manicures, extensão de cílios e estética.',
    keywords: ['beleza', 'cabelo', 'barbearia', 'barba', 'manicure', 'unha', 'estética', 'sobrancelha', 'cílios', 'massagem', 'depilação', 'escova'],
    subcategories: [
      { id: 'sub-bel-cabelo', categoryId: 'beleza', name: 'salões de cabeleireiro & mechas', label: 'salões de cabeleireiro & mechas', query: 'cabelo' },
      { id: 'sub-bel-barbearia', categoryId: 'beleza', name: 'barbearias vintage & barba na toalha', label: 'barbearias vintage & barba na toalha', query: 'barba' },
      { id: 'sub-bel-manicure', categoryId: 'beleza', name: 'manicures, pedicures & fibra de vidro', label: 'manicures, pedicures & fibra de vidro', query: 'unha' },
      { id: 'sub-bel-sobrancelhas', categoryId: 'beleza', name: 'design de sobrancelhas & lash lifting', label: 'design de sobrancelhas & lash lifting', query: 'sobrancelha' },
      { id: 'sub-bel-facial', categoryId: 'beleza', name: 'limpeza de pele & estética facial', label: 'limpeza de pele & estética facial', query: 'facial' },
      { id: 'sub-bel-massagem', categoryId: 'beleza', name: 'massoterapia & drenagem linfática', label: 'massoterapia & drenagem linfática', query: 'massagem' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 7ª OPÇÃO: VEÍCULOS & AUTO
  {
    id: 'veiculos',
    name: 'VEÍCULOS & AUTO',
    nameCapitalized: 'Veículos & Auto',
    icon: 'Car',
    badge: 'Socorro & Oficinas',
    description: 'Oficinas mecânicas, autopeças, baterias, lava-jato, borracharias e guinchos 24 horas.',
    keywords: ['veículo', 'carro', 'moto', 'mecânica', 'oficina', 'auto peças', 'bateria', 'lava jato', 'borracharia', 'guincho', 'alinhamento', 'pneu'],
    subcategories: [
      { id: 'sub-auto-mecanica', categoryId: 'veiculos', name: 'oficinas mecânicas & injeção eletrônica', label: 'oficinas mecânicas & injeção eletrônica', query: 'mecânica' },
      { id: 'sub-auto-pecas', categoryId: 'veiculos', name: 'autopeças, baterias & filtros', label: 'autopeças, baterias & filtros', query: 'autopeças' },
      { id: 'sub-auto-lavajato', categoryId: 'veiculos', name: 'lava-jato & polimento automotivo', label: 'lava-jato & polimento automotivo', query: 'lava jato' },
      { id: 'sub-auto-borracharia', categoryId: 'veiculos', name: 'borracharias, pneus & alinhamento', label: 'borracharias, pneus & alinhamento', query: 'pneu' },
      { id: 'sub-auto-eletrica', categoryId: 'veiculos', name: 'eletricistas automotivos & som', label: 'eletricistas automotivos & som', query: 'elétrica auto' },
      { id: 'sub-auto-guincho', categoryId: 'veiculos', name: 'guincho & socorro 24 horas', label: 'guincho & socorro 24 horas', query: 'guincho' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 8ª OPÇÃO: PET SHOP & AGRO
  {
    id: 'pet-agro',
    name: 'PET SHOP & AGRO',
    nameCapitalized: 'Pet Shop & Agro',
    icon: 'PawPrint',
    badge: 'Mundo Animal',
    description: 'Rações, banho e tosa com busca, medicamentos veterinários e artigos agropecuários.',
    keywords: ['pet', 'agro', 'cão', 'gato', 'ração', 'banho e tosa', 'agropecuária', 'veterinário', 'plantas', 'mudas', 'ferramentas'],
    subcategories: [
      { id: 'sub-pet-racoes', categoryId: 'pet-agro', name: 'rações para cães, gatos & aves', label: 'rações para cães, gatos & aves', query: 'ração' },
      { id: 'sub-pet-banho-tosa', categoryId: 'pet-agro', name: 'banho & tosa com agendamento online', label: 'banho & tosa com agendamento online', query: 'banho' },
      { id: 'sub-pet-acessorios', categoryId: 'pet-agro', name: 'coleiras, caminhas & brinquedos pet', label: 'coleiras, caminhas & brinquedos pet', query: 'pet' },
      { id: 'sub-pet-agropecuaria', categoryId: 'pet-agro', name: 'produtos agropecuários & ferramentas', label: 'produtos agropecuários & ferramentas', query: 'agropecuária' },
      { id: 'sub-pet-mudas', categoryId: 'pet-agro', name: 'mudas de plantas frutíferas & adubos', label: 'mudas de plantas frutíferas & adubos', query: 'mudas' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 9ª OPÇÃO: EDUCAÇÃO & CURSOS
  {
    id: 'educacao',
    name: 'EDUCAÇÃO & CURSOS',
    nameCapitalized: 'Educação & Cursos',
    icon: 'GraduationCap',
    badge: 'Aprenda Mais',
    description: 'Reforço escolar, cursos de idiomas, treinamentos profissionais, autoescolas e aulas particulares.',
    keywords: ['educação', 'curso', 'aula', 'idiomas', 'inglês', 'reforço', 'autoescola', 'treinamento', 'música', 'concurso'],
    subcategories: [
      { id: 'sub-edu-reforco', categoryId: 'educacao', name: 'reforço escolar & alfabetização', label: 'reforço escolar & alfabetização', query: 'reforço' },
      { id: 'sub-edu-idiomas', categoryId: 'educacao', name: 'cursos de inglês & espanhol', label: 'cursos de inglês & espanhol', query: 'inglês' },
      { id: 'sub-edu-profissional', categoryId: 'educacao', name: 'cursos profissionalizantes & informática', label: 'cursos profissionalizantes & informática', query: 'informática' },
      { id: 'sub-edu-autoescola', categoryId: 'educacao', name: 'autoescolas & primeira habilitação cnh', label: 'autoescolas & primeira habilitação cnh', query: 'autoescola' },
      { id: 'sub-edu-musica', categoryId: 'educacao', name: 'aulas de violão, teclado & canto', label: 'aulas de violão, teclado & canto', query: 'música' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  },

  // 10ª OPÇÃO: IMÓVEIS & LOCAÇÕES
  {
    id: 'imoveis',
    name: 'IMÓVEIS & LOCAÇÕES',
    nameCapitalized: 'Imóveis & Locações',
    icon: 'Home',
    badge: 'Moradia & Turismo',
    description: 'Aluguel de casas, venda de imóveis, terrenos, sítios para finais de semana e pousadas em Macacu.',
    keywords: ['imóvel', 'casa', 'apartamento', 'aluguel', 'venda', 'terreno', 'sítio', 'chácara', 'pousada', 'temporada'],
    subcategories: [
      { id: 'sub-imo-aluguel', categoryId: 'imoveis', name: 'aluguel de casas & apartamentos no centro', label: 'aluguel de casas & apartamentos no centro', query: 'aluguel' },
      { id: 'sub-imo-venda', categoryId: 'imoveis', name: 'venda de casas, terrenos & lotes', label: 'venda de casas, terrenos & lotes', query: 'venda' },
      { id: 'sub-imo-sitios', categoryId: 'imoveis', name: 'sítios & chácaras para eventos e lazer', label: 'sítios & chácaras para eventos e lazer', query: 'sítio' },
      { id: 'sub-imo-pousadas', categoryId: 'imoveis', name: 'pousadas ecológicas & cachoeiras', label: 'pousadas ecológicas & cachoeiras', query: 'pousada' }
    ],
    get shortcuts() {
      return this.subcategories;
    }
  }
];

// Helper to get subcategories for a given category ID or name
export function getSubcategoriesByCategory(categoryIdOrName?: string): Subcategory[] {
  if (!categoryIdOrName || categoryIdOrName === 'all') {
    return CATEGORIES_TAXONOMY.flatMap((c) => c.subcategories);
  }
  const norm = categoryIdOrName.toLowerCase();
  const cat = CATEGORIES_TAXONOMY.find(
    (c) =>
      c.id.toLowerCase() === norm ||
      c.name.toLowerCase() === norm ||
      c.nameCapitalized.toLowerCase() === norm
  );
  return cat ? cat.subcategories : [];
}

// Helper to get CategoryTaxonomy by ID
export function getCategoryTaxonomy(categoryId?: string): CategoryTaxonomy | undefined {
  if (!categoryId) return undefined;
  const norm = categoryId.toLowerCase();
  return CATEGORIES_TAXONOMY.find((c) => c.id.toLowerCase() === norm || c.name.toLowerCase() === norm);
}

// Helper to map and classify products/services/merchants to a category
export function matchItemToCategory(
  item: { name?: string; title?: string; category?: string; subcategory?: string; merchantCategory?: string; description?: string },
  categoryId: string
): boolean {
  if (!categoryId || categoryId === 'all') return true;

  const targetCategory = CATEGORIES_TAXONOMY.find((c) => c.id === categoryId);
  if (!targetCategory) return false;

  const catIdLower = categoryId.toLowerCase();
  const itemCatLower = (item.category || '').toLowerCase();
  const itemSubcatLower = (item.subcategory || '').toLowerCase();
  const merchantCatLower = (item.merchantCategory || '').toLowerCase();
  const itemNameLower = (item.name || item.title || '').toLowerCase();
  const itemDescLower = (item.description || '').toLowerCase();

  // 1. Direct match with category id or name
  if (
    itemCatLower === catIdLower ||
    itemCatLower.includes(catIdLower) ||
    catIdLower.includes(itemCatLower) ||
    merchantCatLower.includes(catIdLower)
  ) {
    return true;
  }

  // 2. Check if item's subcategory belongs to this category
  if (itemSubcatLower) {
    const isUnderCategory = targetCategory.subcategories.some(
      (sub) => sub.name.toLowerCase() === itemSubcatLower || itemSubcatLower.includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(itemSubcatLower)
    );
    if (isUnderCategory) return true;
  }

  // 3. Special rules for LOJAS and PRODUTOS (1st options in highlight)
  if (categoryId === 'lojas') {
    if (
      merchantCatLower.includes('loja') ||
      merchantCatLower.includes('boutique') ||
      merchantCatLower.includes('flores') ||
      merchantCatLower.includes('moda') ||
      merchantCatLower.includes('tech') ||
      merchantCatLower.includes('presentes') ||
      merchantCatLower.includes('mercado') ||
      itemCatLower === 'moda' ||
      itemCatLower === 'flores' ||
      itemCatLower === 'eletronicos' ||
      itemCatLower === 'mercado'
    ) {
      return true;
    }
  }

  if (categoryId === 'produtos') {
    if (
      itemCatLower === 'moda' ||
      itemCatLower === 'flores' ||
      itemCatLower === 'eletronicos' ||
      itemCatLower === 'gastronomia' ||
      itemCatLower === 'mercado' ||
      itemCatLower === 'produtos' ||
      itemCatLower === 'lojas'
    ) {
      return true;
    }
  }

  if (categoryId === 'servicos') {
    if (
      itemCatLower === 'servicos' ||
      itemCatLower === 'instalacoes' ||
      itemCatLower === 'reparos' ||
      itemCatLower === 'consertos' ||
      itemCatLower === 'marido-de-aluguel' ||
      itemCatLower.includes('servi') ||
      merchantCatLower.includes('servi') ||
      merchantCatLower.includes('aluguel') ||
      merchantCatLower.includes('assistência') ||
      merchantCatLower.includes('instalaç')
    ) {
      return true;
    }
  }

  if (categoryId === 'consultorios') {
    if (
      itemCatLower.includes('saude') ||
      itemCatLower.includes('consultorio') ||
      itemCatLower.includes('clinica') ||
      itemCatLower.includes('odonto') ||
      merchantCatLower.includes('consultório') ||
      merchantCatLower.includes('clínica') ||
      itemNameLower.includes('dentista') ||
      itemNameLower.includes('consulta') ||
      itemNameLower.includes('exame') ||
      itemNameLower.includes('fisioterapia') ||
      itemNameLower.includes('psicolog') ||
      itemNameLower.includes('nutri')
    ) {
      return true;
    }
  }

  if (categoryId === 'gastronomia') {
    if (
      itemCatLower === 'gastronomia' ||
      merchantCatLower.includes('gastronomia') ||
      merchantCatLower.includes('pizzaria') ||
      itemNameLower.includes('pizza') ||
      itemNameLower.includes('hambúrguer') ||
      itemNameLower.includes('marmita') ||
      itemNameLower.includes('lanche') ||
      itemNameLower.includes('açaí') ||
      itemNameLower.includes('doce')
    ) {
      return true;
    }
  }

  // 4. Keyword matching across target category keywords and subcategories
  const allTerms = [
    ...targetCategory.keywords,
    ...targetCategory.subcategories.map((s) => s.query || s.name)
  ];
  for (const term of allTerms) {
    if (!term) continue;
    const t = term.toLowerCase();
    if (
      itemNameLower.includes(t) ||
      itemDescLower.includes(t) ||
      merchantCatLower.includes(t) ||
      itemCatLower.includes(t)
    ) {
      return true;
    }
  }

  return false;
}

// Helper to check match with specific subcategory
export function matchItemToSubcategory(
  item: { name?: string; title?: string; category?: string; subcategory?: string; description?: string },
  subcategoryIdOrName: string
): boolean {
  if (!subcategoryIdOrName) return true;
  const subNorm = subcategoryIdOrName.toLowerCase();
  const itemSubNorm = (item.subcategory || '').toLowerCase();
  const itemName = (item.name || item.title || '').toLowerCase();
  const itemDesc = (item.description || '').toLowerCase();

  if (itemSubNorm && (itemSubNorm === subNorm || itemSubNorm.includes(subNorm) || subNorm.includes(itemSubNorm))) {
    return true;
  }

  // Find subcategory definition
  const allSubs = CATEGORIES_TAXONOMY.flatMap((c) => c.subcategories);
  const targetSub = allSubs.find((s) => s.id === subcategoryIdOrName || s.name.toLowerCase() === subNorm);
  if (targetSub) {
    const q = (targetSub.query || targetSub.name).toLowerCase();
    const words = q.split(' ').filter((w) => w.length > 2 && !['de', 'em', 'para', 'com', 'que', 'dos', 'das'].includes(w));
    return words.some((w) => itemName.includes(w) || itemDesc.includes(w));
  }

  return itemName.includes(subNorm) || itemDesc.includes(subNorm);
}
