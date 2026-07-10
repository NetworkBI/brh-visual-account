## Migrar o front-end para o novo projeto Supabase (schema `bd_brhunter`)

Objetivo: apontar este app para o novo projeto Supabase que você criou, onde o schema é `bd_brhunter` em vez de `public`, mantendo todo o comportamento atual (auth, RLS, server functions, RPCs).

### 1) Trocar as credenciais do backend (novo projeto)
Atualizar os secrets do Lovable Cloud para apontar ao novo projeto:
- `SUPABASE_URL` → URL do novo projeto
- `SUPABASE_PUBLISHABLE_KEY` (anon) → do novo projeto
- `SUPABASE_SERVICE_ROLE_KEY` → do novo projeto
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no `.env` → do novo projeto
- `VITE_SUPABASE_PROJECT_ID` → novo ref

> Observação: no Lovable Cloud o padrão é conectar o backend gerenciado. Como você já criou o projeto externo, trataremos como Supabase "BYO" — precisarei que você me passe URL + anon key + service role do novo projeto para eu registrar via `add_secret`/atualizar `.env`.

### 2) Expor o schema `bd_brhunter` na Data API
No novo projeto Supabase (Settings → API → Exposed schemas), adicionar `bd_brhunter` à lista de schemas expostos pelo PostgREST. Sem isso, o client não enxerga as tabelas.

Também rodar no novo projeto:
```sql
GRANT USAGE ON SCHEMA bd_brhunter TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bd_brhunter TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA bd_brhunter TO service_role;
-- ajustar anon conforme suas policies
```

### 3) Configurar o client Supabase para usar o schema `bd_brhunter` por padrão
Nossos clients hoje assumem `public`. Duas opções:

**Opção A (recomendada — menos código alterado):** definir `db.schema` no client:
- `src/integrations/supabase/client.ts` → `createClient(url, key, { db: { schema: 'bd_brhunter' }, auth: {...} })`
- `src/integrations/supabase/client.server.ts` → mesmo, com service role
- `src/integrations/supabase/auth-middleware.ts` → mesmo, ao criar o client por request

Assim, todas as chamadas `supabase.from('condominios')`, `.from('prestacoes')`, etc. continuam iguais, mas resolvem em `bd_brhunter.*`.

**Opção B:** trocar cada chamada para `.schema('bd_brhunter').from(...)` — mais invasivo, não recomendado.

### 4) Regenerar `src/integrations/supabase/types.ts`
Os tipos atuais mapeiam `public.*`. Após apontar para o novo projeto e expor o schema, regenerar os tipos incluindo `bd_brhunter` para manter o autocomplete/tipagem.

### 5) Ajustar RPCs e funções `security definer`
As funções `has_role`, `is_adm_or_master`, `is_master`, `get_usuarios_todos`, `get_usuarios_padrao`, `handle_new_user`, `handle_new_user_role`, `log_prestacao_evento`, `valida_sequencia_prestacao` referenciam tabelas de `public` internamente e usam `SET search_path TO 'public'`. No novo projeto essas funções precisam ser recriadas com:
- `SET search_path TO 'bd_brhunter'`
- referências qualificadas: `bd_brhunter.user_roles`, `bd_brhunter.profiles`, etc.
- triggers em `auth.users` (`on_auth_user_created`) recriados apontando para as novas funções.

Sem isso, login/criação de usuário quebram (o trigger insere em `public.profiles` que não existe).

### 6) Recriar policies RLS no schema `bd_brhunter`
As policies atuais foram criadas em `public.*`. Você precisa recriar todas em `bd_brhunter.*` (mesma lógica, apenas o schema muda). Posso gerar o SQL completo baseado nas policies atuais.

### 7) Migração de dados (se quiser levar o conteúdo)
Se quiser copiar os dados existentes:
- Exportar por CSV (dashboard) tabela a tabela do projeto atual e importar no novo, respeitando ordem de FKs: `profiles` → `user_roles` → `condominios` → `prestacoes` → `prestacao_eventos` → `solicitacoes_senha`.
- Ou eu gero um script `pg_dump --data-only --schema=public` + `sed` para reescrever `public` → `bd_brhunter` no import.

### 8) Auth / Users
Usuários do Supabase Auth (`auth.users`) **não são portáveis** entre projetos junto com senhas via CSV. Opções:
- Reconvidar os usuários (fluxo de "esqueci senha") no novo projeto.
- Ou usar a Admin API para importar usuários preservando IDs (posso escrever a server function).

Os IDs precisam ser preservados, porque `profiles.id`, `user_roles.user_id`, `prestacoes.usuario`, etc. dependem deles.

---

### Perguntas antes de eu detalhar o SQL/código

1. Você quer que eu prepare tudo neste mesmo projeto Lovable apontando ao novo Supabase, ou vai remixar o projeto e aplicar lá?
2. Precisa **migrar os dados existentes** (condomínios, prestações, usuários) ou o novo ambiente começa vazio?
3. Quer manter os **mesmos user IDs** (import via Admin API) ou tudo bem reconvidar usuários?
4. Me confirma que quer a **Opção A** (default schema no client) — é a que mexe em ~3 arquivos e mantém o código de negócio intacto.

Com essas respostas eu fecho o plano final com: SQL completo para o novo projeto (schema, grants, policies, funções, triggers), diffs dos 3 arquivos de client, e (se aplicável) script de migração de dados.