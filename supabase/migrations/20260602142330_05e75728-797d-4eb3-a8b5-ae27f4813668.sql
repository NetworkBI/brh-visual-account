
-- Renomear valores do enum processo_tipo
ALTER TYPE processo_tipo RENAME VALUE 'Doc/Recebimento' TO 'Documentação Recebida';
ALTER TYPE processo_tipo RENAME VALUE 'Lançamento' TO 'Lançamento Contábeis';
ALTER TYPE processo_tipo RENAME VALUE 'Montagem' TO 'Montagem Balancete';
ALTER TYPE processo_tipo RENAME VALUE 'Data Fechamento' TO 'Data da Entrega';

-- Garantir unicidade: uma etapa por (condomínio, mês) considerando apenas ativos
CREATE UNIQUE INDEX IF NOT EXISTS prestacoes_unica_etapa_por_ciclo
  ON public.prestacoes (condominio_id, mes, processo)
  WHERE ativo = true;

-- Trigger de validação: exige etapa anterior existente (e ativa) no mesmo ciclo
CREATE OR REPLACE FUNCTION public.valida_sequencia_prestacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  ordem_atual int;
  etapa_anterior processo_tipo;
BEGIN
  IF NEW.ativo = false THEN
    RETURN NEW;
  END IF;

  ordem_atual := CASE NEW.processo
    WHEN 'Documentação Recebida' THEN 1
    WHEN 'Lançamento Contábeis'  THEN 2
    WHEN 'Montagem Balancete'    THEN 3
    WHEN 'Data da Entrega'       THEN 4
  END;

  IF ordem_atual > 1 THEN
    etapa_anterior := CASE ordem_atual
      WHEN 2 THEN 'Documentação Recebida'::processo_tipo
      WHEN 3 THEN 'Lançamento Contábeis'::processo_tipo
      WHEN 4 THEN 'Montagem Balancete'::processo_tipo
    END;

    IF NOT EXISTS (
      SELECT 1 FROM public.prestacoes
      WHERE condominio_id = NEW.condominio_id
        AND mes = NEW.mes
        AND processo = etapa_anterior
        AND ativo = true
        AND id <> NEW.id
    ) THEN
      RAISE EXCEPTION 'A etapa "%" exige que a etapa anterior "%" já tenha sido registrada para este condomínio neste mês.',
        NEW.processo, etapa_anterior;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_sequencia_prestacao ON public.prestacoes;
CREATE TRIGGER trg_valida_sequencia_prestacao
  BEFORE INSERT OR UPDATE ON public.prestacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.valida_sequencia_prestacao();
