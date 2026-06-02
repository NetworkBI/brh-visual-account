CREATE OR REPLACE FUNCTION public.get_usuarios_padrao()
RETURNS TABLE(id uuid, primeiro_nome text, segundo_nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.primeiro_nome, p.segundo_nome
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.id
  WHERE r.role = 'padrao'
  ORDER BY p.primeiro_nome, p.segundo_nome
$$;

GRANT EXECUTE ON FUNCTION public.get_usuarios_padrao() TO authenticated;