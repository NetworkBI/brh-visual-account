## Diagnóstico

O botão **"Criar usuário"** em `/usuarios/novo` está conectado corretamente (`onClick={criar}` → `fnCriar({ data: form })`), o `Toaster` está montado em `__root.tsx`, e o middleware `attachSupabaseAuth` está registrado em `src/start.ts`. Então a chamada está saindo.

O motivo provável de "nada acontecer" é que o handler executa o `zod.parse(input)` no servidor, e como o formulário hoje **não tem validação no cliente**, qualquer campo vazio (e‑mail inválido, data em branco, senha < 6) faz o `parse` falhar. Quando isso acontece o `createServerFn` rejeita com um erro genérico que o `catch` captura — mas como a mensagem do Zod vem em formato bruto/longo, em alguns casos o toast é exibido de forma quase imperceptível no canto e o usuário tem a impressão de que "nada aconteceu".

Outros pontos que reforçam a sensação:
- Não há indicador visível enquanto o botão está em `criando` além do texto trocar para "Criando…".
- O `criar` não confere localmente nenhum campo, então não há mensagem inline sob o input que falhou.

## Plano (apenas `src/routes/usuarios.novo.tsx`)

1. **Validar antes de chamar o servidor** usando um `safeParse` com um schema Zod local (reaproveitando regras de `src/lib/schemas.ts` — `cadastroSchema` + `role`). Se inválido:
   - `toast.error(primeiraMensagem)` para o usuário ver imediatamente o motivo.
   - Não chamar `fnCriar`.
2. **Mensagem de erro do servidor mais clara**: no `catch`, exibir `e?.message` e também logar `console.error(e)` para facilitar depuração futura.
3. **Estado visual do botão**: manter `disabled={criando}` e adicionar um pequeno spinner/ícone no botão durante o envio (apenas estilo, sem mudar lógica).
4. **Resetar `criando` mesmo em erro** (já está no `finally`, mantido).

Sem mudanças em rotas, sem mudanças no servidor (`src/lib/usuarios.functions.ts`), sem mudanças em estilo global.

## Como confirmar

- Clicar em "Criar usuário" com campos vazios → toast vermelho aparece no canto superior direito ("Obrigatório" / "E‑mail inválido" / "Mínimo de 6 caracteres").
- Preencher tudo corretamente → toast verde "Usuário criado" e redirecionamento para `/usuarios`.
- Se ainda assim falhar, o `console.error` deixa o erro real visível no console para análise.
