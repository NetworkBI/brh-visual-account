REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_prestacao_evento() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.valida_sequencia_prestacao() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_usuarios_todos() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_usuarios_padrao() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_adm_or_master(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_usuarios_todos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_usuarios_padrao() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_adm_or_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;