## Problema

A coluna "Usuário de Criação" no dashboard mostra `—` quando o lançamento foi criado por um ADM, porque o lookup usa `useProfiles()`, que só devolve usuários com papel `padrao`.

## Solução

Criar uma segunda função no banco que devolve **todos** os usuários (padrão e ADM), apenas com `id`, `primeiro_nome` e `segundo_nome` — sem PII — e usar essa lista só para resolver nomes em colunas/relatórios. O dropdown de "Responsável" continua usando `get_usuarios_padrao`, para não permitir atribuir um ADM como responsável.

## Passos

1. **Migração no banco**
   - Criar `public.get_usuarios_todos()` retornando `(id uuid, primeiro_nome text, segundo_nome text)`.
   - `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public`.
   - `SELECT id, primeiro_nome, segundo_nome FROM public.profiles ORDER BY primeiro_nome, segundo_nome`.
   - `GRANT EXECUTE` para `authenticated`.

2. **`src/lib/queries.ts`**
   - Adicionar `useAllProfiles()` chamando `supabase.rpc("get_usuarios_todos")`.
   - Manter `useProfiles()` como está (apenas `padrao`).

3. **`src/routes/dashboard.tsx`**
   - Importar e usar `useAllProfiles()` para alimentar a função `nomeUsuario` (usada na coluna "Usuário de Criação").
   - Manter `useProfiles()` para o `<Select>` da coluna "Responsável".

4. **`src/routes/historico.tsx`** (mesma situação: coluna "Usuário")
   - Trocar o lookup de nome para `useAllProfiles()`, para que eventos criados/editados por ADMs também apareçam com nome.

## Por que não simplesmente trocar `get_usuarios_padrao`

Porque essa função alimenta o dropdown "Usuário Responsável", que por regra só lista usuários padrão. Separar as duas funções mantém essa regra intacta e ainda corrige o lookup de exibição.

## Segurança

A nova RPC expõe apenas nome (sem e-mail, matrícula ou data de nascimento), igual ao padrão já adotado, e fica restrita a usuários autenticados.
