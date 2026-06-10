## Por que o texto está claro

Os campos `#nome` e `#senha` em `src/routes/login.tsx` usam `className="... bg-transparent ..."` no componente `Input`. Sem uma cor de texto explícita, o input herda a cor `foreground` do tema. Quando o sistema/navegador está em **modo escuro**, `foreground` vira quase branco — e como o card de login tem fundo claro (`bg-white/95`), o texto digitado fica praticamente invisível.

A correção pedida anteriormente ("esses dois campos sempre deverão estar com letras em preto, independente de qualquer coisa") nunca foi aplicada no arquivo — por isso o problema persiste.

## Plano

Editar `src/routes/login.tsx` e adicionar `text-black placeholder:text-black/60` à `className` de **ambos** os inputs (`#nome` e `#senha`), forçando texto preto independentemente do tema:

- Linha 79: `className="flex-1 rounded-none border-0 bg-transparent text-black placeholder:text-black/60 shadow-none focus-visible:ring-0"`
- Linha 96: idem para o campo senha.

Sem outras mudanças (layout, validação e fluxo permanecem).

### Observação
A regra geral do projeto evita cores hardcoded, mas aqui é exigência explícita do usuário ("sempre preto, independente de qualquer coisa"), então o override é intencional e restrito a esses dois campos.
