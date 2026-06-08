## Objetivo
Promover a paleta **Grafite** a padrão do sistema, manter a atual como alternativa **Clássica**, e garantir que o sidebar fique **branco no modo claro** e **escuro no modo escuro** — com vermelho apenas como acento discreto.

## Mudanças

### 1. `src/lib/palette.tsx` — Ciclo e nomes
- Renomear o id `"padrao"` para `"classica"` e adicionar `"grafite"` como novo padrão inicial.
- Manter a ordem atual de ciclo trocando apenas a primeira posição:
  - `ORDER = ["grafite", "brasa", "classica"]`
- Labels:
  - `grafite` → "Cores Alternativas — Grafite"
  - `brasa` → "Cores Alternativas — Brasa"
  - `classica` → "Cores Alternativas — Clássica"
- Estado inicial: `"grafite"`.
- Migração leve do `localStorage`: se o valor salvo for `"padrao"`, converter para `"classica"` na leitura (sem quebrar usuários existentes).

### 2. `src/styles.css` — Tokens
- **`:root` (sem `[data-palette]`)**: passa a representar o Grafite (novo padrão). Ajustar para que o sidebar fique **branco** no modo claro:
  - `--sidebar: oklch(1 0 0)` (branco puro)
  - `--sidebar-foreground`: cinza escuro grafite
  - `--sidebar-primary`: vermelho discreto (acento)
  - `--sidebar-accent`: cinza muito claro
  - `--sidebar-border`: cinza claro
  - `--primary`: grafite escuro; `--secondary`/acentos cinza; vermelho fica reservado para `--destructive` e detalhes pontuais.
- **`.dark` (default)**: sidebar escuro grafite (`--sidebar` cinza muito escuro, foreground claro, vermelho discreto como acento). Garante a regra "no modo escuro o menu também fica escuro".
- **`[data-palette="classica"]`** (nova): move para cá os tokens que hoje estão em `:root` (vermelho institucional dominante, sidebar branco no claro / escuro no dark) — exatamente o visual atual.
- **`[data-palette="brasa"]`**: inalterado.
- **Remover** o bloco `[data-palette="grafite"]` antigo (vira o novo `:root`).

### 3. `src/components/app-sidebar.tsx` — Topo do sidebar
Hoje o `SidebarHeader` tem `bg-gradient-to-b from-[#7a1418] to-[#3a0a0c]` hardcoded, o que mantém o topo vermelho mesmo com sidebar branco.
- Trocar para usar tokens do sidebar: fundo `bg-sidebar`, borda `border-sidebar-border`, texto `text-sidebar-foreground`.
- Logo continua com o card branco interno; o título "BR HUNTER" passa a usar `text-sidebar-foreground` (cinza grafite no claro, claro no escuro).
- `SidebarTrigger`: ajustar hover para `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground` (em vez de `hover:bg-white/15`).
- Resultado: no modo claro o sidebar fica 100% branco; no escuro fica grafite escuro; nas demais paletas (Clássica/Brasa) o topo volta ao gradiente vermelho dessas paletas via tokens.

> Observação: como o gradiente vermelho some, para preservá-lo nas paletas Clássica/Brasa vamos definir um token novo `--sidebar-header-bg` em `:root` (branco/grafite) e nos blocos `[data-palette="classica"]` e `[data-palette="brasa"]` (gradiente vermelho). O `SidebarHeader` usa `style={{ background: "var(--sidebar-header-bg)" }}`.

### 4. Acento "vermelho discreto" no Grafite
- `--destructive` permanece vermelho (botão Sair, erros).
- `--primary` no Grafite vira grafite escuro, então CTAs primários ficam em grafite — vermelho aparece só em `destructive` e em hovers/realces críticos. Nenhum botão precisa ser reescrito; basta os tokens.

## Detalhes técnicos
- Sem mudanças em rotas, dados ou lógica de negócio.
- Sem alterar contratos do `usePalette()` — só os ids/labels internos.
- Migração transparente do `localStorage` (`padrao` → `classica`).
- Tooltip/label do botão de paleta no rodapé do sidebar continua mostrando o nome dinâmico via `paletteLabel`.
- Cobertura visual: revisar Home, Dashboard, Usuários, Condomínios, Configurações nas três paletas × dois temas após a mudança.
