
CREATE TYPE public.solicitacao_senha_status AS ENUM ('pendente', 'aprovada', 'recusada', 'concluida');
CREATE TYPE public.solicitacao_senha_origem AS ENUM ('usuario', 'pre_autorizada');

CREATE TABLE public.solicitacoes_senha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  status public.solicitacao_senha_status NOT NULL DEFAULT 'pendente',
  origem public.solicitacao_senha_origem NOT NULL DEFAULT 'usuario',
  criado_em timestamptz NOT NULL DEFAULT now(),
  decidido_em timestamptz,
  decidido_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_solicitacoes_senha_user ON public.solicitacoes_senha(user_id);
CREATE INDEX idx_solicitacoes_senha_status ON public.solicitacoes_senha(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_senha TO authenticated;
GRANT ALL ON public.solicitacoes_senha TO service_role;

ALTER TABLE public.solicitacoes_senha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas próprias solicitações"
  ON public.solicitacoes_senha FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_adm_or_master(auth.uid()));

CREATE POLICY "ADM/MASTER gerencia solicitações"
  ON public.solicitacoes_senha FOR ALL TO authenticated
  USING (public.is_adm_or_master(auth.uid()))
  WITH CHECK (public.is_adm_or_master(auth.uid()));
