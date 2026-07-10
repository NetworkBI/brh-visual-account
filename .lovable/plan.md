
Segue a DDL (schema) das tabelas do `public` deste projeto, pronta para rodar no SQL Editor do seu Supabase novo. Não inclui dados — só estrutura, enums, funções, triggers, view, GRANTs e RLS.

## 1. Enums

```sql
CREATE TYPE public.app_role AS ENUM ('padrao','adm','master');
CREATE TYPE public.evento_tipo AS ENUM ('criação','edição');
CREATE TYPE public.processo_tipo AS ENUM (
  'Documentação Recebida','Lançamento Contábeis','Montagem Balancete','Data da Entrega'
);
CREATE TYPE public.solicitacao_senha_origem AS ENUM ('usuario','pre_autorizada');
CREATE TYPE public.solicitacao_senha_status AS ENUM ('pendente','aprovada','recusada','concluida');
```

## 2. Tabelas

```sql
-- condominios
CREATE TABLE public.condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- profiles (id = auth.users.id)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primeiro_nome text NOT NULL,
  segundo_nome text NOT NULL,
  data_nascimento date NOT NULL,
  email text NOT NULL,
  matricula text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'padrao',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- prestacoes
CREATE TABLE public.prestacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes text NOT NULL,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE RESTRICT,
  processo public.processo_tipo NOT NULL,
  data_evento date NOT NULL,
  usuario_responsavel uuid NOT NULL,
  usuario uuid NOT NULL,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- prestacao_eventos
CREATE TABLE public.prestacao_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id uuid NOT NULL REFERENCES public.prestacoes(id) ON DELETE CASCADE,
  ocorrido public.evento_tipo NOT NULL,
  usuario uuid NOT NULL,
  data_ocorrido timestamptz NOT NULL DEFAULT now()
);

-- solicitacoes_senha
CREATE TABLE public.solicitacoes_senha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  status public.solicitacao_senha_status NOT NULL DEFAULT 'pendente',
  origem public.solicitacao_senha_origem NOT NULL DEFAULT 'usuario',
  criado_em timestamptz NOT NULL DEFAULT now(),
  decidido_em timestamptz,
  decidido_por uuid
);
```

## 3. View

```sql
CREATE VIEW public.public_profiles AS
  SELECT id, primeiro_nome, segundo_nome, email FROM public.profiles;
```

## 4. Funções (SECURITY DEFINER)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role='master')
$$;

CREATE OR REPLACE FUNCTION public.is_adm_or_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role IN ('adm','master'))
$$;

CREATE OR REPLACE FUNCTION public.get_usuarios_todos()
RETURNS TABLE(id uuid, primeiro_nome text, segundo_nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT p.id, p.primeiro_nome, p.segundo_nome FROM public.profiles p
  ORDER BY p.primeiro_nome, p.segundo_nome
$$;

CREATE OR REPLACE FUNCTION public.get_usuarios_padrao()
RETURNS TABLE(id uuid, primeiro_nome text, segundo_nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT p.id, p.primeiro_nome, p.segundo_nome
  FROM public.profiles p JOIN public.user_roles r ON r.user_id=p.id
  WHERE r.role='padrao' ORDER BY p.primeiro_nome, p.segundo_nome
$$;

-- Trigger: criar profile ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  INSERT INTO public.profiles (id, primeiro_nome, segundo_nome, data_nascimento, email, matricula)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'primeiro_nome',''),
    COALESCE(NEW.raw_user_meta_data->>'segundo_nome',''),
    COALESCE((NEW.raw_user_meta_data->>'data_nascimento')::date,'1970-01-01'::date),
    NEW.email,
    NEW.raw_user_meta_data->>'matricula');
  RETURN NEW;
END;$$;

-- Trigger: role padrão ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'padrao') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;$$;

-- Trigger: log de eventos em prestacoes
CREATE OR REPLACE FUNCTION public.log_prestacao_evento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.prestacao_eventos(prestacao_id,ocorrido,usuario) VALUES (NEW.id,'criação',NEW.usuario);
  ELSIF TG_OP='UPDATE' THEN
    INSERT INTO public.prestacao_eventos(prestacao_id,ocorrido,usuario) VALUES (NEW.id,'edição',COALESCE(auth.uid(),NEW.usuario));
    NEW.updated_at=now();
  END IF;
  RETURN NEW;
END;$$;

-- Trigger: valida sequência das etapas
CREATE OR REPLACE FUNCTION public.valida_sequencia_prestacao()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
DECLARE ordem_atual int; etapa_anterior public.processo_tipo;
BEGIN
  IF NEW.ativo=false THEN RETURN NEW; END IF;
  ordem_atual := CASE NEW.processo
    WHEN 'Documentação Recebida' THEN 1 WHEN 'Lançamento Contábeis' THEN 2
    WHEN 'Montagem Balancete' THEN 3 WHEN 'Data da Entrega' THEN 4 END;
  IF ordem_atual>1 THEN
    etapa_anterior := CASE ordem_atual
      WHEN 2 THEN 'Documentação Recebida'::public.processo_tipo
      WHEN 3 THEN 'Lançamento Contábeis'::public.processo_tipo
      WHEN 4 THEN 'Montagem Balancete'::public.processo_tipo END;
    IF NOT EXISTS (SELECT 1 FROM public.prestacoes
      WHERE condominio_id=NEW.condominio_id AND mes=NEW.mes
        AND processo=etapa_anterior AND ativo=true AND id<>NEW.id) THEN
      RAISE EXCEPTION 'A etapa "%" exige que a etapa anterior "%" já tenha sido registrada para este condomínio neste mês.',
        NEW.processo, etapa_anterior;
    END IF;
  END IF;
  RETURN NEW;
END;$$;
```

## 5. Triggers

```sql
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TRIGGER prestacoes_log_evento AFTER INSERT OR UPDATE ON public.prestacoes
  FOR EACH ROW EXECUTE FUNCTION public.log_prestacao_evento();

CREATE TRIGGER prestacoes_valida_sequencia BEFORE INSERT OR UPDATE ON public.prestacoes
  FOR EACH ROW EXECUTE FUNCTION public.valida_sequencia_prestacao();
```

## 6. GRANTs + RLS

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condominios,
  public.profiles, public.user_roles, public.prestacoes,
  public.prestacao_eventos, public.solicitacoes_senha TO authenticated;
GRANT ALL ON public.condominios, public.profiles, public.user_roles,
  public.prestacoes, public.prestacao_eventos, public.solicitacoes_senha TO service_role;
GRANT SELECT ON public.public_profiles TO authenticated;

ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestacao_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_senha ENABLE ROW LEVEL SECURITY;
```

## Observações

- Este DDL cobre **estrutura**. As **políticas RLS específicas** (quem pode ler/escrever cada tabela) não estão listadas aqui porque são várias — posso extrair as definições exatas via `pg_policies` e te enviar em bloco separado se quiser.
- **Dados** (INSERTs) não estão inclusos. Posso gerar CSVs por tabela pra você importar depois.
- Os triggers em `auth.users` só funcionam se você executar como owner do schema `auth` (no SQL Editor do Supabase isso funciona normalmente).

Quer que eu já prepare em seguida (a) o bloco de RLS policies e (b) os CSVs com os dados atuais?
