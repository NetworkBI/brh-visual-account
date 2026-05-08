
-- Enum tipos
CREATE TYPE public.processo_tipo AS ENUM ('Doc/Recebimento', 'Lançamento', 'Montagem', 'Data Fechamento');
CREATE TYPE public.evento_tipo AS ENUM ('criação', 'edição');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primeiro_nome TEXT NOT NULL,
  segundo_nome TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  email TEXT NOT NULL,
  matricula TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Condomínios
CREATE TABLE public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cond_select_auth" ON public.condominios FOR SELECT TO authenticated USING (true);
CREATE POLICY "cond_insert_auth" ON public.condominios FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "cond_update_owner" ON public.condominios FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "cond_delete_owner" ON public.condominios FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Prestações
CREATE TABLE public.prestacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes TEXT NOT NULL,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE RESTRICT,
  processo public.processo_tipo NOT NULL,
  data_evento DATE NOT NULL,
  usuario_responsavel UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prestacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prest_select_auth" ON public.prestacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "prest_insert_auth" ON public.prestacoes FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario);
CREATE POLICY "prest_update_owner" ON public.prestacoes FOR UPDATE TO authenticated USING (auth.uid() = usuario OR auth.uid() = usuario_responsavel);
CREATE POLICY "prest_delete_owner" ON public.prestacoes FOR DELETE TO authenticated USING (auth.uid() = usuario);

-- Eventos (auditoria)
CREATE TABLE public.prestacao_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL REFERENCES public.prestacoes(id) ON DELETE CASCADE,
  ocorrido public.evento_tipo NOT NULL,
  usuario UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  data_ocorrido TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prestacao_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evt_select_auth" ON public.prestacao_eventos FOR SELECT TO authenticated USING (true);

-- Trigger auditoria
CREATE OR REPLACE FUNCTION public.log_prestacao_evento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.prestacao_eventos(prestacao_id, ocorrido, usuario)
    VALUES (NEW.id, 'criação', NEW.usuario);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.prestacao_eventos(prestacao_id, ocorrido, usuario)
    VALUES (NEW.id, 'edição', COALESCE(auth.uid(), NEW.usuario));
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER prestacoes_audit
AFTER INSERT ON public.prestacoes
FOR EACH ROW EXECUTE FUNCTION public.log_prestacao_evento();
CREATE TRIGGER prestacoes_audit_upd
BEFORE UPDATE ON public.prestacoes
FOR EACH ROW EXECUTE FUNCTION public.log_prestacao_evento();

-- Trigger de auto-criação de profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, primeiro_nome, segundo_nome, data_nascimento, email, matricula)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'primeiro_nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'segundo_nome', ''),
    COALESCE((NEW.raw_user_meta_data->>'data_nascimento')::date, '1970-01-01'::date),
    NEW.email,
    NEW.raw_user_meta_data->>'matricula'
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
