## Objetivo
Importar usuários fictícios da planilha (aba `gid=2136183962`) para o sistema, em execução única, sem mexer na UI.

## Fonte de dados
- URL CSV: `https://docs.google.com/spreadsheets/d/1PlX_X3vS5MsWcwBXUpDSV6ZXWhYo_xasiu5819VxYcc/export?format=csv&gid=2136183962`
- Colunas: `Primeiro/Segundo, Data de nascimento, E-mail, Matrícula, Senha`
- Parsing: `Primeiro/Segundo` será dividido no primeiro espaço → `primeiro_nome` + `segundo_nome` (sobrenome composto vai inteiro no segundo).

## Estratégia
Criar **um único server function admin** (`src/lib/seed-usuarios.functions.ts`) que:
1. Baixa o CSV ao vivo.
2. Para cada linha:
   - Se o e-mail **não existe** em `auth.users` → cria via `supabaseAdmin.auth.admin.createUser` com `email_confirm: true`, `password` da planilha e `user_metadata` (primeiro_nome, segundo_nome, data_nascimento, matrícula). O trigger `handle_new_user` popula `profiles`, e `handle_new_user_role` aplica papel `padrao`.
   - Se o e-mail **já existe** → faz `UPDATE` em `profiles` (primeiro_nome, segundo_nome, data_nascimento, matrícula). Senha e papel não são tocados.
3. Retorna um resumo `{ criados, atualizados, erros: [{email, motivo}] }`.

Para garantir que só ADM execute, o handler valida o caller via `requireSupabaseAuth` + `has_role(userId, 'adm')` antes de fazer qualquer coisa. O `supabaseAdmin` (service role) é importado dinamicamente dentro do handler.

## Como rodar (única vez)
Como você escolheu "script único sem UI", a execução vai ser feita via ferramenta de invocação de server function logada como ADM. Após confirmar o sucesso e ver o resumo no log, **o arquivo `seed-usuarios.functions.ts` é deletado** para não ficar resíduo no projeto.

Alternativa, se preferir: posso deixar o arquivo no repo comentado/desabilitado para você reusar quando quiser regenerar a base de teste — me diga na hora de implementar.

## Detalhes técnicos
- Parse CSV reaproveita a função já existente em `src/lib/sheet.functions.ts` (mesmo padrão de aspas/escape).
- Header detectado dinamicamente (ignora linhas vazias do topo da planilha).
- Validação: pula linhas sem e-mail válido ou sem senha (registra em `erros`).
- Senha: usada como está na planilha. As senhas atuais (ex: `joao123`, `maria456`) já passam no `senhaSchema` (≥6 chars, letras+números, ao menos 1 número).
- Sem RLS: `supabaseAdmin` ignora; usado só dentro do handler verificado.

## Arquivos
- **Criar**: `src/lib/seed-usuarios.functions.ts`
- **Deletar após sucesso**: o mesmo arquivo (a menos que você peça para manter).

## Nada muda
- Schemas, triggers, RLS, UI, rotas — intocados.