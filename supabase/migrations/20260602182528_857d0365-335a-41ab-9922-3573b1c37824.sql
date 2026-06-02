CREATE OR REPLACE FUNCTION public.get_usuarios_todos()
RETURNS TABLE(id uuid, primeiro_nome text, segundo_nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.primeiro_nome, p.segundo_nome
  FROM public.profiles p
  ORDER BY p.primeiro_nome, p.segundo_nome
$$;

GRANT EXECUTE ON FUNCTION public.get_usuarios_todos() TO authenticated;