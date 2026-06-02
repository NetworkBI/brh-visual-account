## Problema

O campo "Usuário Responsável" está vazio porque as políticas de RLS impedem que um usuário comum (`padrao`) enxergue as linhas dos outros usuários em `user_roles` e em `profiles`. A consulta feita no cliente retorna apenas o próprio usuário (ou vazio).

## Solução

Criar uma função no banco com `SECURITY DEFINER` que devolve apenas os campos necessários (id, primeiro nome, segundo nome) de **todos** os usuários com papel `padrao`. A função roda com privilégios elevados, ignorando o RLS, mas expõe somente dados não sensíveis (nada de e-mail, matrícula, data de nascimento). Acesso liberado para qualquer usuário autenticado.

## Passos

1. **Migração no banco**
   - Criar `public.get_usuarios_padrao()` retornando `(id uuid, primeiro_nome text, segundo_nome text)`.
   - `LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public`.
   - Faz `JOIN` entre `profiles` e `user_roles` filtrando `role = 'padrao'` e ordena por nome.
   - `GRANT EXECUTE` para `authenticated`.

2. **Atualizar `src/lib/queries.ts`**
   - Substituir o `useProfiles()` atual (duas queries em sequência) por uma única chamada `supabase.rpc("get_usuarios_padrao")`.

3. **`src/components/prestacao-form.tsx`**
   - Nenhuma mudança visual; já exibe apenas `primeiro_nome segundo_nome`.

## Detalhes técnicos

- A função é `STABLE`, então o Postgres pode otimizar e cachear durante a transação.
- Mantemos o tipo do retorno enxuto para evitar vazamento de PII (e-mail/matrícula continuam protegidos pelo RLS atual).
- A view `public_profiles` continua existindo e útil para outros casos (perfil próprio, área administrativa).
