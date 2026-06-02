-- ============================================================
-- Nova hierarquia de papéis: MASTER > ADM > PADRÃO
-- ============================================================

-- 1) Remover policies e função que dependem do enum atual
DROP POLICY IF EXISTS profiles_select_adm ON public.profiles;
DROP POLICY IF EXISTS roles_select_adm ON public.user_roles;
DROP POLICY IF EXISTS roles_insert_adm ON public.user_roles;
DROP POLICY IF EXISTS roles_update_adm ON public.user_roles;
DROP POLICY IF EXISTS roles_delete_adm ON public.user_roles;
DROP POLICY IF EXISTS prest_update_owner ON public.prestacoes;
DROP POLICY IF EXISTS prest_delete_owner ON public.prestacoes;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 2) Recriar enum com 'master', rebaixando ADMs atuais para PADRÃO
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;
UPDATE public.user_roles SET role = 'padrao' WHERE role = 'adm';

DROP TYPE public.app_role;
CREATE TYPE public.app_role AS ENUM ('padrao', 'adm', 'master');

ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'padrao'::public.app_role;

-- 3) Funções auxiliares (SECURITY DEFINER, evitam recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master')
$$;

CREATE OR REPLACE FUNCTION public.is_adm_or_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('adm','master'))
$$;

-- 4) Recriar policies

-- profiles: ADM/MASTER veem todos
CREATE POLICY profiles_select_adm ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_adm_or_master(auth.uid()));

-- user_roles:
-- SELECT: ADM/MASTER veem todos (próprio já tem policy roles_select_own)
CREATE POLICY roles_select_adm ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.is_adm_or_master(auth.uid()));

-- INSERT: MASTER pode inserir qualquer papel; ADM só pode inserir 'padrao' ou 'adm' (nunca 'master')
CREATE POLICY roles_insert_adm ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_master(auth.uid())
    OR (public.has_role(auth.uid(), 'adm') AND role IN ('padrao','adm'))
  );

-- UPDATE: MASTER tudo; ADM só altera linhas cujo papel atual é padrao/adm para padrao/adm
CREATE POLICY roles_update_adm ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.is_master(auth.uid())
    OR (public.has_role(auth.uid(), 'adm') AND role IN ('padrao','adm'))
  )
  WITH CHECK (
    public.is_master(auth.uid())
    OR (public.has_role(auth.uid(), 'adm') AND role IN ('padrao','adm'))
  );

-- DELETE: MASTER tudo; ADM só remove vínculos padrao/adm
CREATE POLICY roles_delete_adm ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_master(auth.uid())
    OR (public.has_role(auth.uid(), 'adm') AND role IN ('padrao','adm'))
  );

-- prestacoes: dono, responsável OU adm/master podem editar/excluir
CREATE POLICY prest_update_owner ON public.prestacoes
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario OR auth.uid() = usuario_responsavel OR public.is_adm_or_master(auth.uid()));

CREATE POLICY prest_delete_owner ON public.prestacoes
  FOR DELETE TO authenticated
  USING (auth.uid() = usuario OR public.is_adm_or_master(auth.uid()));