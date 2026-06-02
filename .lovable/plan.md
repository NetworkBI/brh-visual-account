## Nova sistemática de usuários

### Hierarquia

```
MASTER  →  pode tudo: gerencia MASTER/ADM/PADRÃO, promove qualquer um a qualquer papel, edita qualquer prestação
  ↑
 ADM   →  cria/edita/exclui PADRÃO e ADM, promove PADRÃO↔ADM, edita qualquer prestação. NÃO mexe em MASTER.
  ↑
PADRÃO →  igual hoje (operacional, aparece como "Responsável")
```

### Migração de dados (existente)

- Todos os usuários hoje marcados como `adm` serão **rebaixados para `padrao`**.
- Você promove manualmente quem deve ser MASTER ou ADM pela tela `/usuarios` depois da migração.

---

## Mudanças

### 1. Banco (migração)

- Adicionar valor `master` ao enum `app_role` (fica `adm | padrao | master`).
- Converter todos os registros atuais de `user_roles` com `role='adm'` para `role='padrao'`.
- Atualizar função `has_role` — sem mudanças (continua genérica).
- Atualizar/Adicionar funções auxiliares:
  - `is_master(uid)`, `is_adm_or_master(uid)` — SECURITY DEFINER, evita recursão em RLS.
- **RLS / Policies revisadas:**
  - `profiles.profiles_select_adm` → passa a usar `is_adm_or_master`.
  - `user_roles.roles_select_adm / insert / update / delete`:
    - SELECT: ADM ou MASTER.
    - INSERT/UPDATE: ADM pode inserir/alterar papel `padrao`↔`adm`; MASTER pode tudo (inclusive `master`).
    - DELETE: ADM pode excluir vínculo de PADRÃO/ADM; MASTER pode excluir qualquer.
  - `prestacoes.prest_update_owner` → ampliar: dono, responsável, OU `is_adm_or_master`.
  - `prestacoes.prest_delete_owner` → ampliar: dono OU `is_adm_or_master`.
- `get_usuarios_padrao()` permanece (dropdown de Responsável continua só PADRÃO).

### 2. Frontend

- **`src/lib/auth.tsx`**
  - `AppRole = "master" | "adm" | "padrao"`.
  - `useUserRole` retorna o papel mais alto encontrado (prioridade master > adm > padrao).
  - Helpers exportados: `isMaster(role)`, `canManageUsers(role)` (adm+master), `canEditAnyPrestacao(role)` (adm+master), `canPromoteToMaster(role)` (só master).
- **`src/routes/usuarios.tsx`**
  - Coluna "Papel" mostra MASTER / ADM / PADRÃO com badges distintos.
  - Select de alteração de papel:
    - MASTER vê todas as 3 opções para qualquer usuário (exceto si mesmo).
    - ADM vê só `padrao` e `adm`; linhas de usuários MASTER ficam read-only.
    - PADRÃO continua sem poder editar.
  - Botão **"Excluir usuário"** por linha (ADM/MASTER), respeitando regra acima. Confirmação via AlertDialog. Backend executa via server function (ver item 3) usando service role para apagar de `auth.users` (cascade limpa `profiles`/`user_roles`).
  - Botão **"Novo usuário"** já existente (form de criação) continua, mas o seletor de papel inicial passa a oferecer as opções permitidas ao usuário logado.
- **`src/components/app-sidebar.tsx`** / qualquer guard de menu: usar `canManageUsers` em vez de comparar com `"adm"`.
- **Telas de prestações (`prestacoes.index`, `prestacoes.$id.editar`, lista do dashboard/histórico):**
  - Botões "Editar" e "Excluir" passam a aparecer também para ADM/MASTER em qualquer prestação (hoje só aparecem para dono/responsável).

### 3. Server functions (TanStack)

- `src/lib/usuarios.functions.ts` (criar) com middleware `requireSupabaseAuth`:
  - `criarUsuario({ primeiro_nome, segundo_nome, email, data_nascimento, matricula, senha, role })` — valida via Zod, checa papel do chamador, usa `supabaseAdmin.auth.admin.createUser` + insere role.
  - `excluirUsuario({ id })` — valida que chamador é ADM/MASTER e que alvo respeita regra (ADM não pode excluir MASTER), `supabaseAdmin.auth.admin.deleteUser`.
  - `alterarPapel({ user_id, role })` — valida hierarquia (ADM não pode setar `master` nem mexer em MASTER).
- Substitui chamadas diretas a `supabase.from('user_roles')` da tela atual.

### 4. Pequenos ajustes

- Textos da UI: trocar "ADM" por "MASTER"/"ADM" onde fizer sentido (badges, tooltips, mensagens de "Somente ADM pode...").
- `seo`/títulos não mudam.

---

## Detalhes técnicos

- Não usar CHECK constraint para validar hierarquia — toda regra fica nas RLS policies + nas server functions.
- `has_role` continua existindo; novas funções `is_master` / `is_adm_or_master` são wrappers SECURITY DEFINER para legibilidade nas policies e evitar recursão.
- Migração de dados (`UPDATE user_roles SET role='padrao' WHERE role='adm'`) entra na mesma migração que adiciona o enum — Postgres permite `ALTER TYPE ... ADD VALUE` antes do UPDATE no mesmo migration desde que commit-ado em transação separada; faremos em dois statements via `COMMIT` intermediário ou usaremos `ALTER TYPE ... RENAME VALUE` **não** (perderíamos histórico). Caminho seguro: `ALTER TYPE app_role ADD VALUE 'master'` numa migration, e o UPDATE numa segunda migration (ou usar `ALTER TYPE` + `SET LOCAL` adequado). Será resolvido com duas migrations sequenciais se necessário.
- Após a migração, regerar tipos do Supabase é automático.

---

Confirma para eu implementar?
