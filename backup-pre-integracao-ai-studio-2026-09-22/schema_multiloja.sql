-- ============================================================================
-- ARQUITETURA MULTILOJA: ESQUEMA DE BANCO DE DADOS RELACIONAL (POSTGRESQL / ANSI SQL)
-- PLATAFORMA: Achei Aqui - Marketplace Local de Cachoeiras de Macacu - RJ
-- TITULAR & AUTOR: Bex Serviços e Comércios, CNPJ 30.810.800/0001-39
-- 
-- HIERARQUIA OPERACIONAL:
-- CARRINHO (Multi-loja) -> PEDIDO PRINCIPAL (#10001) -> SUBPEDIDOS POR LOJISTA (#10001-A, #10001-B...) -> ITENS
--
-- REGRAS FINANCEIRAS & DE TAXAS:
-- 1. Mercadorias: Pagas DIRETAMENTE pelo cliente ao lojista. A plataforma NÃO guarda nem retém esse valor.
-- 2. Taxas da Plataforma: 10% (0.10) calculadas por subpedido sobre o valor das mercadorias.
-- 3. Cobrança de Taxa: Consolidada em uma única guia/chave PIX oficial (CNPJ 30.810.800/0001-39).
-- 4. Status de Aviso: "COMPRA VALIDADA — O PAGAMENTO DAS MERCADORIAS SERÁ REALIZADO DIRETAMENTE A CADA LOJISTA."
--
-- REGRAS DE SEGURANÇA & PROTEÇÃO DE DADOS:
-- - Isolamento total entre lojas (Loja A NUNCA acessa dados de clientes da Loja B).
-- - Antes da validação da taxa: Lojista tem visão restrita (produtos, qtd, preço, região aproximada, status).
-- - Liberação de Dados Privados através da procedure LIBERAR_DADOS_DO_CLIENTE com 4 travas de segurança.
-- - Tabela de AUDITORIA imutável para compliance com LGPD.
-- ============================================================================

-- Extensões recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TIPOS ENUMERADOS (ENUMS DE MÁQUINA DE ESTADO)
-- ============================================================================

CREATE TYPE pedido_principal_status_enum AS ENUM (
    'CRIADO',
    'AGUARDANDO_CONFIRMACOES_LOJAS',
    'AGUARDANDO_PAGAMENTO_TAXAS',
    'COMPRA_VALIDADA',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'CANCELADO'
);

CREATE TYPE subpedido_status_enum AS ENUM (
    'CRIADO',
    'AGUARDANDO_CONFIRMACAO_LOJA',
    'ESTOQUE_CONFIRMADO',
    'SEM_ESTOQUE',
    'CANCELADO_LOJA',
    'AGUARDANDO_PAGAMENTO_TAXA',
    'TAXA_PAGA',
    'COMPRA_VALIDADA',
    'DADOS_LIBERADOS',
    'EM_PREPARO',
    'EM_ROTA',
    'PRONTO_RETIRADA',
    'AGUARDANDO_PAGAMENTO_MERCADORIA',
    'PAGAMENTO_MERCADORIA_CONFIRMADO',
    'RECEBIMENTO_CONFIRMADO_CLIENTE',
    'CONCLUIDO',
    'CANCELADO'
);

CREATE TYPE item_pedido_status_enum AS ENUM (
    'ATIVO',
    'CONFIRMADO',
    'SEM_ESTOQUE',
    'REMOVIDO',
    'CANCELADO'
);

CREATE TYPE taxa_pagamento_status_enum AS ENUM (
    'PENDENTE',
    'PAGO_CONFIRMADO',
    'EXPIRADO',
    'CANCELADO',
    'ESTORNADO'
);

CREATE TYPE entrega_status_enum AS ENUM (
    'AGUARDANDO_VALIDACAO_COMPRA',
    'EM_PREPARO',
    'DESPACHADO_EM_ROTA',
    'DISPONIVEL_RETIRADA',
    'ENTREGUE',
    'RETIRADO',
    'FALHA_ENTREGA'
);

CREATE TYPE modalidade_tipo_enum AS ENUM (
    'DELIVERY',
    'RETIRADA',
    'LOCAL',
    'DOMICILIO'
);

CREATE TYPE metodo_taxa_enum AS ENUM (
    'PIX_ESTATICO',
    'PIX_DINAMICO_API',
    'LINK_PAGAMENTO',
    'WEBHOOK_GATEWAY'
);

CREATE TYPE pagamento_direto_status_enum AS ENUM (
    'PENDENTE_PAGAMENTO_DIRETO',
    'PAGO_DIRETAMENTE_AO_LOJISTA'
);

-- ============================================================================
-- 2. TABELAS DE DOMÍNIO BASE: LOJAS E PRODUTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lojas (
    id VARCHAR(64) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    razao_social VARCHAR(255),
    categoria VARCHAR(100) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    email VARCHAR(255) NOT NULL,
    chave_pix VARCHAR(100),
    tipo_chave_pix VARCHAR(30),
    titular_pix VARCHAR(255),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL DEFAULT 'Cachoeiras de Macacu',
    estado VARCHAR(2) NOT NULL DEFAULT 'RJ',
    endereco_completo TEXT NOT NULL,
    plano_atual VARCHAR(50) NOT NULL DEFAULT 'GRATIS',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lojas_ativo ON lojas(ativo);
CREATE INDEX idx_lojas_categoria ON lojas(categoria);

CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(64) PRIMARY KEY,
    loja_id VARCHAR(64) NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco NUMERIC(12, 2) NOT NULL CHECK (preco >= 0),
    preco_promocional NUMERIC(12, 2) CHECK (preco_promocional >= 0),
    estoque_quantidade INTEGER NOT NULL DEFAULT 0 CHECK (estoque_quantidade >= 0),
    imagem_url TEXT NOT NULL,
    modalidade modalidade_tipo_enum NOT NULL DEFAULT 'DELIVERY',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produtos_loja_id ON produtos(loja_id);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);

-- ============================================================================
-- 3. CARRINHOS MULTILOJA E ITENS DE CARRINHO
-- ============================================================================

CREATE TABLE IF NOT EXISTS carrinhos (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    session_id VARCHAR(128),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carrinhos_user_id ON carrinhos(user_id);
CREATE INDEX idx_carrinhos_session_id ON carrinhos(session_id);

CREATE TABLE IF NOT EXISTS itens_carrinho (
    id VARCHAR(64) PRIMARY KEY,
    carrinho_id VARCHAR(64) NOT NULL REFERENCES carrinhos(id) ON DELETE CASCADE,
    produto_id VARCHAR(64) NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    loja_id VARCHAR(64) NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario_momento NUMERIC(12, 2) NOT NULL CHECK (preco_unitario_momento >= 0),
    modalidade modalidade_tipo_enum NOT NULL DEFAULT 'DELIVERY',
    variacoes_json JSONB DEFAULT '{}'::jsonb,
    adicionado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itens_carrinho_carrinho_id ON itens_carrinho(carrinho_id);
CREATE INDEX idx_itens_carrinho_loja_id ON itens_carrinho(loja_id);

-- ============================================================================
-- 4. PEDIDOS PRINCIPAIS (CONSOLIDADOR MULTILOJA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pedidos_principais (
    id VARCHAR(64) PRIMARY KEY,
    codigo_legivel VARCHAR(32) NOT NULL UNIQUE, -- Ex: '#10001'
    user_id VARCHAR(64) NOT NULL,
    
    -- DADOS PROTEGIDOS DO CLIENTE (CENTRALIZADOS E BLINDADOS)
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(30) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_cpf VARCHAR(20),
    cliente_bairro VARCHAR(100) NOT NULL,
    cliente_cidade VARCHAR(100) NOT NULL DEFAULT 'Cachoeiras de Macacu',
    cliente_endereco_completo TEXT NOT NULL,
    cliente_ponto_referencia TEXT,
    cliente_instrucoes_entrega TEXT,
    cliente_verificado BOOLEAN NOT NULL DEFAULT FALSE,

    -- TOTAIS CONSOLIDADOS (MERCADORIAS VS TAXAS DA PLATAFORMA)
    total_mercadorias NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_mercadorias >= 0),
    total_taxas_plataforma NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_taxas_plataforma >= 0),
    taxa_percentual_plataforma NUMERIC(5, 4) NOT NULL DEFAULT 0.1000, -- 10% (0.10)
    
    status pedido_principal_status_enum NOT NULL DEFAULT 'CRIADO',
    aviso_legal TEXT NOT NULL DEFAULT 'COMPRA VALIDADA — O PAGAMENTO DAS MERCADORIAS SERÁ REALIZADO DIRETAMENTE A CADA LOJISTA.',
    
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMP WITH TIME ZONE,
    cancelado_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pedidos_principais_user_id ON pedidos_principais(user_id);
CREATE INDEX idx_pedidos_principais_status ON pedidos_principais(status);
CREATE INDEX idx_pedidos_principais_criado_em ON pedidos_principais(criado_em);

-- ============================================================================
-- 5. SUBPEDIDOS POR LOJISTA (1 SUBPEDIDO = EXATAMENTE 1 LOJA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subpedidos (
    id VARCHAR(64) PRIMARY KEY,
    pedido_principal_id VARCHAR(64) NOT NULL REFERENCES pedidos_principais(id) ON DELETE CASCADE,
    codigo_subpedido VARCHAR(32) NOT NULL UNIQUE, -- Ex: '#10001-A', '#10001-B'
    loja_id VARCHAR(64) NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    loja_nome_snapshot VARCHAR(255) NOT NULL,
    
    status subpedido_status_enum NOT NULL DEFAULT 'CRIADO',
    modalidade modalidade_tipo_enum NOT NULL DEFAULT 'DELIVERY',
    
    -- FINANCEIRO DO SUBPEDIDO: MERCADORIAS (DIRETO AO LOJISTA) VS TAXA 10% (PLATAFORMA)
    valor_mercadorias NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (valor_mercadorias >= 0),
    taxa_plataforma_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1000, -- 10% fixo
    taxa_plataforma_valor NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (taxa_plataforma_valor >= 0),
    taxa_paga BOOLEAN NOT NULL DEFAULT FALSE,
    taxa_confirmada_at TIMESTAMP WITH TIME ZONE,

    -- SEGURANÇA E LIBERAÇÃO DE DADOS PRIVADOS DO CLIENTE
    dados_cliente_liberados BOOLEAN NOT NULL DEFAULT FALSE,
    dados_cliente_liberados_at TIMESTAMP WITH TIME ZONE,
    
    -- PAGAMENTO DE MERCADORIAS: REALIZADO DIRETAMENTE ENTRE CLIENTE E LOJISTA
    pagamento_mercadoria_status pagamento_direto_status_enum NOT NULL DEFAULT 'PENDENTE_PAGAMENTO_DIRETO',
    pagamento_mercadoria_confirmado_at TIMESTAMP WITH TIME ZONE,
    
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subpedidos_pedido_principal_id ON subpedidos(pedido_principal_id);
CREATE INDEX idx_subpedidos_loja_id ON subpedidos(loja_id);
CREATE INDEX idx_subpedidos_status ON subpedidos(status);
CREATE INDEX idx_subpedidos_taxa_paga ON subpedidos(taxa_paga);

-- ============================================================================
-- 6. ITENS DO SUBPEDIDO (COM TRATAMENTO INDEPENDENTE DE DISPONIBILIDADE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS itens_pedido (
    id VARCHAR(64) PRIMARY KEY,
    subpedido_id VARCHAR(64) NOT NULL REFERENCES subpedidos(id) ON DELETE CASCADE,
    pedido_principal_id VARCHAR(64) NOT NULL REFERENCES pedidos_principais(id) ON DELETE CASCADE,
    loja_id VARCHAR(64) NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    produto_id VARCHAR(64) NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
    nome_produto VARCHAR(255) NOT NULL,
    imagem_produto TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario NUMERIC(12, 2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    variacoes_json JSONB DEFAULT '{}'::jsonb,
    status_item item_pedido_status_enum NOT NULL DEFAULT 'ATIVO',
    motivo_cancelamento_item TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itens_pedido_subpedido_id ON itens_pedido(subpedido_id);
CREATE INDEX idx_itens_pedido_loja_id ON itens_pedido(loja_id);
CREATE INDEX idx_itens_pedido_status_item ON itens_pedido(status_item);

-- ============================================================================
-- 7. PAGAMENTO DE TAXAS DA PLATAFORMA (COBRANÇA CONSOLIDADA 10% VIA PIX/API/WEBHOOK)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pagamentos_taxas (
    id VARCHAR(64) PRIMARY KEY,
    pedido_principal_id VARCHAR(64) NOT NULL REFERENCES pedidos_principais(id) ON DELETE CASCADE,
    pagador_user_id VARCHAR(64) NOT NULL,
    pagador_nome VARCHAR(255) NOT NULL,
    pagador_email VARCHAR(255) NOT NULL,
    pagador_telefone VARCHAR(30) NOT NULL,
    
    valor_total_taxas NUMERIC(12, 2) NOT NULL CHECK (valor_total_taxas >= 0),
    taxa_percentual_geral NUMERIC(5, 4) NOT NULL DEFAULT 0.1000, -- 10%
    metodo metodo_taxa_enum NOT NULL DEFAULT 'PIX_ESTATICO',
    
    chave_pix_oficial VARCHAR(100) NOT NULL DEFAULT '30.810.800/0001-39',
    beneficiario_oficial VARCHAR(255) NOT NULL DEFAULT 'Bex Serviços e Comércios',
    link_pagamento TEXT,
    qr_code_pix_url TEXT,
    copia_e_cola_pix TEXT,
    
    status taxa_pagamento_status_enum NOT NULL DEFAULT 'PENDENTE',
    comprovante_url TEXT,
    confirmado_por_user_id VARCHAR(64),
    confirmado_at TIMESTAMP WITH TIME ZONE,
    
    gateway_transaction_id VARCHAR(128),
    gateway_provider VARCHAR(50),
    webhook_payload JSONB DEFAULT '{}'::jsonb,
    
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_pagamentos_taxas_pedido_principal ON pagamentos_taxas(pedido_principal_id);
CREATE INDEX idx_pagamentos_taxas_status ON pagamentos_taxas(status);
CREATE INDEX idx_pagamentos_taxas_gateway_tx ON pagamentos_taxas(gateway_transaction_id);

-- Tabela associativa entre Pagamento de Taxa e Subpedidos inclusos
CREATE TABLE IF NOT EXISTS pagamentos_taxas_subpedidos (
    pagamento_taxa_id VARCHAR(64) NOT NULL REFERENCES pagamentos_taxas(id) ON DELETE CASCADE,
    subpedido_id VARCHAR(64) NOT NULL REFERENCES subpedidos(id) ON DELETE CASCADE,
    valor_taxa_subpedido NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pagamento_taxa_id, subpedido_id)
);

-- ============================================================================
-- 8. ENTREGAS E RASTREIO POR SUBPEDIDO (ISOLAMENTO DE ENDEREÇO)
-- ============================================================================

CREATE TABLE IF NOT EXISTS entregas (
    id VARCHAR(64) PRIMARY KEY,
    subpedido_id VARCHAR(64) NOT NULL UNIQUE REFERENCES subpedidos(id) ON DELETE CASCADE,
    pedido_principal_id VARCHAR(64) NOT NULL REFERENCES pedidos_principais(id) ON DELETE CASCADE,
    loja_id VARCHAR(64) NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    modalidade modalidade_tipo_enum NOT NULL DEFAULT 'DELIVERY',
    
    -- DADOS ANTES DA VALIDAÇÃO (SEMI-ANÔNIMO)
    regiao_aproximada VARCHAR(255) NOT NULL, -- Ex: 'Centro, Cachoeiras de Macacu'
    
    -- DADOS APÓS VALIDAÇÃO DA TAXA E LIBERAÇÃO CONTROLADA
    endereco_entrega_completo TEXT,
    codigo_rastreio_ou_retirada VARCHAR(64) NOT NULL,
    status_entrega entrega_status_enum NOT NULL DEFAULT 'AGUARDANDO_VALIDACAO_COMPRA',
    
    data_hora_despacho TIMESTAMP WITH TIME ZONE,
    data_hora_entrega_ou_retirada TIMESTAMP WITH TIME ZONE,
    recebedor_nome VARCHAR(255),
    recebedor_documento VARCHAR(50),
    observacoes TEXT,
    
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entregas_subpedido_id ON entregas(subpedido_id);
CREATE INDEX idx_entregas_loja_id ON entregas(loja_id);
CREATE INDEX idx_entregas_status ON entregas(status_entrega);

-- ============================================================================
-- 9. CONFIRMAÇÕES OPERACIONAIS POR SUBPEDIDO
-- ============================================================================

CREATE TABLE IF NOT EXISTS confirmacoes (
    id VARCHAR(64) PRIMARY KEY,
    subpedido_id VARCHAR(64) NOT NULL UNIQUE REFERENCES subpedidos(id) ON DELETE CASCADE,
    pedido_principal_id VARCHAR(64) NOT NULL REFERENCES pedidos_principais(id) ON DELETE CASCADE,
    loja_id VARCHAR(64) NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
    
    confirmacao_estoque_loja BOOLEAN NOT NULL DEFAULT FALSE,
    confirmacao_estoque_loja_at TIMESTAMP WITH TIME ZONE,
    confirmacao_estoque_usuario_id VARCHAR(64),
    
    confirmacao_taxa_plataforma BOOLEAN NOT NULL DEFAULT FALSE,
    confirmacao_taxa_plataforma_at TIMESTAMP WITH TIME ZONE,
    
    confirmacao_pagamento_mercadoria_loja BOOLEAN NOT NULL DEFAULT FALSE,
    confirmacao_pagamento_mercadoria_loja_at TIMESTAMP WITH TIME ZONE,
    
    confirmacao_recebimento_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    confirmacao_recebimento_cliente_at TIMESTAMP WITH TIME ZONE,
    
    observacoes TEXT
);

CREATE INDEX idx_confirmacoes_subpedido_id ON confirmacoes(subpedido_id);
CREATE INDEX idx_confirmacoes_loja_id ON confirmacoes(loja_id);

-- ============================================================================
-- 10. AUDITORIA IMUTÁVEL (SEGURANÇA, LGPD E LOGS DE LIBERAÇÃO DE DADOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS auditoria (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('audit-' || gen_random_uuid()::text),
    subpedido_id VARCHAR(64),
    pedido_principal_id VARCHAR(64),
    loja_id VARCHAR(64),
    user_id VARCHAR(64) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes TEXT NOT NULL,
    dados_liberados_snapshot JSONB,
    ip_address VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_subpedido_id ON auditoria(subpedido_id);
CREATE INDEX idx_auditoria_pedido_principal_id ON auditoria(pedido_principal_id);
CREATE INDEX idx_auditoria_loja_id ON auditoria(loja_id);
CREATE INDEX idx_auditoria_acao ON auditoria(acao);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp DESC);

-- ============================================================================
-- 11. HISTÓRICO DE STATUS (MÁQUINA DE ESTADOS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS historico_status (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('hist-' || gen_random_uuid()::text),
    entidade_tipo VARCHAR(50) NOT NULL, -- 'PEDIDO_PRINCIPAL', 'SUBPEDIDO', 'TAXA', 'ENTREGA'
    entidade_id VARCHAR(64) NOT NULL,
    status_anterior VARCHAR(50) NOT NULL,
    status_novo VARCHAR(50) NOT NULL,
    motivo TEXT,
    alterado_por_user_id VARCHAR(64) NOT NULL,
    alterado_por_role VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_historico_status_entidade ON historico_status(entidade_tipo, entidade_id);
CREATE INDEX idx_historico_status_timestamp ON historico_status(timestamp DESC);

-- ============================================================================
-- 12. VIEWS DE SEGURANÇA (VISÃO RESTRITA DO LOJISTA ANTES DA VALIDAÇÃO)
-- ============================================================================

-- View para consulta segura do lojista: NUNCA expõe endereço completo nem telefone antes da validação
CREATE OR REPLACE VIEW vw_lojista_subpedidos_restritos AS
SELECT 
    s.id AS subpedido_id,
    s.codigo_subpedido,
    s.pedido_principal_id,
    s.loja_id,
    s.loja_nome_snapshot,
    s.status AS status_subpedido,
    s.modalidade,
    s.valor_mercadorias,
    s.taxa_plataforma_valor,
    s.taxa_paga,
    s.dados_cliente_liberados,
    s.pagamento_mercadoria_status,
    p.cliente_verificado,
    p.cliente_cidade,
    e.regiao_aproximada,
    -- Se dados liberados, entrega o endereço real; caso contrário, NULL
    CASE 
        WHEN s.dados_cliente_liberados = TRUE THEN p.cliente_endereco_completo 
        ELSE NULL 
    END AS endereco_completo_condicional,
    CASE 
        WHEN s.dados_cliente_liberados = TRUE THEN p.cliente_telefone 
        ELSE NULL 
    END AS telefone_condicional,
    s.criado_em,
    s.atualizado_em
FROM subpedidos s
JOIN pedidos_principais p ON s.pedido_principal_id = p.id
JOIN entregas e ON e.subpedido_id = s.id;

-- ============================================================================
-- 13. FUNÇÃO DE SEGURANÇA MANDATÓRIA: LIBERAR_DADOS_DO_CLIENTE(subpedido_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_liberar_dados_do_cliente(
    p_subpedido_id VARCHAR(64),
    p_loja_id VARCHAR(64),
    p_user_id VARCHAR(64),
    p_user_role VARCHAR(50),
    p_ip_address VARCHAR(45) DEFAULT '127.0.0.1'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subpedido RECORD;
    v_pedido_principal RECORD;
    v_dados_retorno JSONB;
BEGIN
    -- 1. Obter e travar o subpedido para atualização
    SELECT * INTO v_subpedido FROM subpedidos WHERE id = p_subpedido_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subpedido % não encontrado.', p_subpedido_id;
    END IF;

    -- Obter o pedido principal
    SELECT * INTO v_pedido_principal FROM pedidos_principais WHERE id = v_subpedido.pedido_principal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido principal % não encontrado.', v_subpedido.pedido_principal_id;
    END IF;

    -- TRAVA 1: Pertencimento à Loja (Loja A NUNCA acessa Loja B)
    IF p_user_role <> 'MASTER' AND v_subpedido.loja_id <> p_loja_id THEN
        -- Registrar violação de segurança imediata
        INSERT INTO auditoria (subpedido_id, pedido_principal_id, loja_id, user_id, user_role, acao, detalhes, ip_address)
        VALUES (
            p_subpedido_id,
            v_subpedido.pedido_principal_id,
            p_loja_id,
            p_user_id,
            p_user_role,
            'VIOLACAO_SEGURANCA_CROSS_STORE',
            FORMAT('Tentativa de acesso ilegal: Lojista %s tentou liberar dados do subpedido da loja %s', p_loja_id, v_subpedido.loja_id),
            p_ip_address
        );
        RAISE EXCEPTION '🔒 Violação de Segurança: Sua loja não tem permissão para acessar este subpedido.';
    END IF;

    -- TRAVA 2: Estoque/Serviço Confirmado
    IF NOT EXISTS (SELECT 1 FROM confirmacoes WHERE subpedido_id = p_subpedido_id AND confirmacao_estoque_loja = TRUE) THEN
        RAISE EXCEPTION 'Bloqueio de Segurança: O estoque/serviço deste subpedido ainda não foi confirmado.';
    END IF;

    -- TRAVA 3: Taxa Correspondente (10%) Confirmada e Paga à Plataforma
    IF v_subpedido.taxa_paga = FALSE THEN
        RAISE EXCEPTION 'Bloqueio de Segurança: A taxa da plataforma (10%%) deste subpedido ainda não foi confirmada.';
    END IF;

    -- TRAVA 4: Subpedido deve estar em COMPRA_VALIDADA ou posterior
    IF v_subpedido.status NOT IN (
        'COMPRA_VALIDADA', 'DADOS_LIBERADOS', 'EM_PREPARO', 'EM_ROTA', 
        'PRONTO_RETIRADA', 'AGUARDANDO_PAGAMENTO_MERCADORIA', 
        'PAGAMENTO_MERCADORIA_CONFIRMADO', 'RECEBIMENTO_CONFIRMADO_CLIENTE', 'CONCLUIDO'
    ) THEN
        RAISE EXCEPTION 'Bloqueio de Segurança: O status atual (%) não permite liberação de dados.', v_subpedido.status;
    END IF;

    -- Executar a liberação de dados
    UPDATE subpedidos
    SET 
        dados_cliente_liberados = TRUE,
        dados_cliente_liberados_at = CURRENT_TIMESTAMP,
        status = CASE WHEN status = 'COMPRA_VALIDADA' THEN 'DADOS_LIBERADOS'::subpedido_status_enum ELSE status END,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE id = p_subpedido_id;

    -- Atualizar endereço na tabela de entregas
    UPDATE entregas
    SET 
        endereco_entrega_completo = v_pedido_principal.cliente_endereco_completo,
        atualizado_em = CURRENT_TIMESTAMP
    WHERE subpedido_id = p_subpedido_id;

    -- Montar JSON com dados liberados
    v_dados_retorno := jsonb_build_object(
        'subpedido_id', p_subpedido_id,
        'codigo_subpedido', v_subpedido.codigo_subpedido,
        'cliente_nome', v_pedido_principal.cliente_nome,
        'cliente_telefone', v_pedido_principal.cliente_telefone,
        'cliente_email', v_pedido_principal.cliente_email,
        'cliente_endereco_completo', v_pedido_principal.cliente_endereco_completo,
        'cliente_bairro', v_pedido_principal.cliente_bairro,
        'cliente_cidade', v_pedido_principal.cliente_cidade,
        'cliente_ponto_referencia', v_pedido_principal.cliente_ponto_referencia,
        'cliente_instrucoes_entrega', v_pedido_principal.cliente_instrucoes_entrega,
        'aviso_legal', 'COMPRA VALIDADA — O PAGAMENTO DAS MERCADORIAS SERÁ REALIZADO DIRETAMENTE A CADA LOJISTA.'
    );

    -- Registrar auditoria obrigatória
    INSERT INTO auditoria (
        subpedido_id,
        pedido_principal_id,
        loja_id,
        user_id,
        user_role,
        acao,
        detalhes,
        dados_liberados_snapshot,
        ip_address
    ) VALUES (
        p_subpedido_id,
        v_subpedido.pedido_principal_id,
        v_subpedido.loja_id,
        p_user_id,
        p_user_role,
        'LIBERAR_DADOS_DO_CLIENTE',
        FORMAT('Dados de entrega liberados com sucesso para a loja %s referente ao subpedido %s.', v_subpedido.loja_nome_snapshot, v_subpedido.codigo_subpedido),
        jsonb_build_object(
            'cliente_nome', v_pedido_principal.cliente_nome,
            'bairro', v_pedido_principal.cliente_bairro,
            'cidade', v_pedido_principal.cliente_cidade
        ),
        p_ip_address
    );

    -- Registrar no Histórico de Status se houve transição
    IF v_subpedido.status = 'COMPRA_VALIDADA' THEN
        INSERT INTO historico_status (
            entidade_tipo, entidade_id, status_anterior, status_novo, motivo, alterado_por_user_id, alterado_por_role
        ) VALUES (
            'SUBPEDIDO', p_subpedido_id, 'COMPRA_VALIDADA', 'DADOS_LIBERADOS', 'Dados do comprador liberados após confirmação da taxa.', p_user_id, p_user_role
        );
    END IF;

    RETURN v_dados_retorno;
END;
$$;

-- ============================================================================
-- 14. TRIGGERS AUTOMÁTICOS DE CONSOLIDAÇÃO DO PEDIDO PRINCIPAL
-- ============================================================================

-- Função para reavaliar status do pedido principal quando qualquer subpedido muda de status
CREATE OR REPLACE FUNCTION trg_fn_reavaliar_pedido_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_subpedidos INTEGER;
    v_concluidos INTEGER;
    v_cancelados INTEGER;
    v_validados INTEGER;
    v_estoque_confirmados INTEGER;
    v_novo_status pedido_principal_status_enum;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'CONCLUIDO'),
        COUNT(*) FILTER (WHERE status IN ('CANCELADO', 'SEM_ESTOQUE', 'CANCELADO_LOJA')),
        COUNT(*) FILTER (WHERE status IN ('COMPRA_VALIDADA', 'DADOS_LIBERADOS', 'EM_PREPARO', 'EM_ROTA', 'PRONTO_RETIRADA', 'PAGAMENTO_MERCADORIA_CONFIRMADO', 'RECEBIMENTO_CONFIRMADO_CLIENTE')),
        COUNT(*) FILTER (WHERE status IN ('ESTOQUE_CONFIRMADO', 'COMPRA_VALIDADA', 'DADOS_LIBERADOS', 'EM_PREPARO', 'EM_ROTA', 'PRONTO_RETIRADA', 'PAGAMENTO_MERCADORIA_CONFIRMADO', 'RECEBIMENTO_CONFIRMADO_CLIENTE', 'CONCLUIDO'))
    INTO 
        v_total_subpedidos,
        v_concluidos,
        v_cancelados,
        v_validados,
        v_estoque_confirmados
    FROM subpedidos
    WHERE pedido_principal_id = NEW.pedido_principal_id;

    IF v_total_subpedidos > 0 THEN
        IF v_cancelados = v_total_subpedidos THEN
            v_novo_status := 'CANCELADO';
        ELSIF (v_concluidos + v_cancelados) = v_total_subpedidos AND v_concluidos > 0 THEN
            v_novo_status := 'CONCLUIDO';
        ELSIF v_validados > 0 THEN
            v_novo_status := 'EM_ANDAMENTO';
        ELSIF v_estoque_confirmados = v_total_subpedidos THEN
            v_novo_status := 'AGUARDANDO_PAGAMENTO_TAXAS';
        ELSE
            v_novo_status := 'AGUARDANDO_CONFIRMACOES_LOJAS';
        END IF;

        UPDATE pedidos_principais
        SET 
            status = v_novo_status,
            concluido_em = CASE WHEN v_novo_status = 'CONCLUIDO' THEN CURRENT_TIMESTAMP ELSE concluido_em END,
            cancelado_em = CASE WHEN v_novo_status = 'CANCELADO' THEN CURRENT_TIMESTAMP ELSE cancelado_em END,
            atualizado_em = CURRENT_TIMESTAMP
        WHERE id = NEW.pedido_principal_id AND status <> v_novo_status;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subpedidos_status_sync ON subpedidos;
CREATE TRIGGER trg_subpedidos_status_sync
AFTER INSERT OR UPDATE OF status ON subpedidos
FOR EACH ROW
EXECUTE FUNCTION trg_fn_reavaliar_pedido_principal();
