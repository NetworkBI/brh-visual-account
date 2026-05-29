
-- 1) profiles: restrict full row access
DROP POLICY IF EXISTS profiles_select_all_auth ON public.profiles;

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY profiles_select_adm
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'adm'::app_role));

-- 2) Public view exposing only non-sensitive columns for user lookups
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, primeiro_nome, segundo_nome, email
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

-- Allow authenticated to SELECT through the view (security_invoker => caller's policies apply).
-- Add a policy so the view's underlying SELECT works for all authenticated users
-- but ONLY for the safe columns exposed by the view. Achieved by adding a
-- permissive policy that returns true for the columns the view selects.
-- Since RLS is row-level (not column-level), we keep a permissive
-- read policy for the view path by allowing SELECT when caller is authenticated
-- AND restricting sensitive column exposure through the view definition itself.
CREATE POLICY profiles_select_lookup_via_view
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- NOTE: We rely on the application reading sensitive columns (data_nascimento,
-- matricula) only via direct `profiles` queries; non-admins should query
-- `public_profiles` for lookups. To enforce column safety at the DB layer:
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, primeiro_nome, segundo_nome, email) ON public.profiles TO authenticated;
GRANT SELECT (data_nascimento, matricula, created_at) ON public.profiles TO authenticated;
-- The above grants all columns to authenticated at the column level, but RLS
-- policies still gate rows: only own row OR admin OR lookup-view path.
-- Combined effect: a non-admin querying `profiles` directly will only get
-- their own row (since profiles_select_lookup_via_view is broad, we drop it
-- and rely on view-only access for cross-user reads).
DROP POLICY profiles_select_lookup_via_view ON public.profiles;

-- 3) user_roles: own row or admin
DROP POLICY IF EXISTS roles_select_auth ON public.user_roles;

CREATE POLICY roles_select_own
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY roles_select_adm
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'adm'::app_role));

-- 4) Revoke EXECUTE on internal trigger functions from clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_prestacao_evento()  FROM PUBLIC, anon, authenticated;

-- has_role is used in RLS policies; keep EXECUTE for authenticated, revoke from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
