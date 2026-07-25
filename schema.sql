-- Esquema do Banco de Dados para PostgreSQL Local
-- Schema: ouro | Prefixo: saas_

-- Definir search_path para garantir que o Postgres saiba onde criar os objetos
SET search_path TO public, ouro;

-- Criar o schema ouro se não existir
CREATE SCHEMA IF NOT EXISTS ouro;

-- Habilitar extensões para geração de UUID no schema public
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Limpar tabelas antigas caso existam para evitar conflitos de re-execução
DROP TABLE IF EXISTS ouro.saas_solicitacoes_senha CASCADE;
DROP TABLE IF EXISTS ouro.saas_prestacao_eventos CASCADE;
DROP TABLE IF EXISTS ouro.saas_prestacoes CASCADE;
DROP TABLE IF EXISTS ouro.saas_condominios CASCADE;
DROP TABLE IF EXISTS ouro.saas_user_roles CASCADE;
DROP TABLE IF EXISTS ouro.saas_profiles CASCADE;

-- Limpar enums antigos caso existam
DROP TYPE IF EXISTS ouro.processo_tipo CASCADE;
DROP TYPE IF EXISTS ouro.evento_tipo CASCADE;
DROP TYPE IF EXISTS ouro.app_role CASCADE;

-- 1. Enums
CREATE TYPE ouro.processo_tipo AS ENUM ('Doc/Recebimento', 'Lançamento', 'Montagem', 'Data Fechamento');
CREATE TYPE ouro.evento_tipo AS ENUM ('criação', 'edição');
CREATE TYPE ouro.app_role AS ENUM ('master', 'adm', 'padrao');

-- 2. Tabela de Perfis/Usuários
CREATE TABLE ouro.saas_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primeiro_nome TEXT NOT NULL,
  segundo_nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  matricula TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de Funções/Cargos de Usuários
CREATE TABLE ouro.saas_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ouro.saas_profiles(id) ON DELETE CASCADE,
  role ouro.app_role NOT NULL DEFAULT 'padrao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Tabela de Condomínios
CREATE TABLE ouro.saas_condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES ouro.saas_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de Prestações de Contas
CREATE TABLE ouro.saas_prestacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes TEXT NOT NULL,
  condominio_id UUID NOT NULL REFERENCES ouro.saas_condominios(id) ON DELETE RESTRICT,
  processo ouro.processo_tipo NOT NULL,
  data_evento DATE NOT NULL,
  usuario_responsavel UUID NOT NULL REFERENCES ouro.saas_profiles(id) ON DELETE RESTRICT,
  usuario UUID NOT NULL REFERENCES ouro.saas_profiles(id) ON DELETE RESTRICT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de Eventos (Auditoria de Prestações)
CREATE TABLE ouro.saas_prestacao_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL REFERENCES ouro.saas_prestacoes(id) ON DELETE CASCADE,
  ocorrido ouro.evento_tipo NOT NULL,
  usuario UUID REFERENCES ouro.saas_profiles(id) ON DELETE SET NULL,
  data_ocorrido TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Tabela de Solicitações de Senha
CREATE TABLE ouro.saas_solicitacoes_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES ouro.saas_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  origem TEXT NOT NULL, -- 'usuario', 'pre_autorizada'
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'aprovada', 'recusada', 'concluida'
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  decidido_em TIMESTAMPTZ,
  decidido_por UUID REFERENCES ouro.saas_profiles(id) ON DELETE SET NULL
);

-- 8. Inserir usuário Administrador Padrão (Senha inicial: BRHunter2026!)
-- ATENÇÃO: Altere a senha logo no primeiro acesso!
INSERT INTO ouro.saas_profiles (id, primeiro_nome, segundo_nome, data_nascimento, email, matricula, password_hash)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Admin',
  'Master',
  '2000-01-01',
  'admin@brhunter.com.br',
  'BRH001',
  '$2b$10$CFwCOF6Zoy3KROScFvKbc.buVorgjviPVjPFgZTjggk5gwMjucUbW' -- Senha: BRHunter2026
) ON CONFLICT DO NOTHING;

INSERT INTO ouro.saas_user_roles (user_id, role)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'master')
ON CONFLICT DO NOTHING;
