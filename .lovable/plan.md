## Objetivo
Reformular a Home com a animação enviada, remover a sidebar do sistema inteiro, e centralizar tema/paleta/sair em um popover discreto no canto inferior direito.

## 1. Anima\u00e7\u00e3o do mascote
- Pr\u00e9-processar o MP4 (15s, 1920x1080, fundo preto) com `ffmpeg` para gerar `public/mascote-intro.mp4` **sem a marca d'\u00e1gua "Pippit AI"**: desenhar um ret\u00e2ngulo preto no canto superior esquerdo (`drawbox`) e re-encodar em H.264 + faststart, sem \u00e1udio. Tamb\u00e9m gerar um poster JPG do \u00faltimo frame (`public/mascote-final.jpg`) para o estado congelado.
- Componente `<MascotIntro />`:
  - `<video>` com `autoPlay muted playsInline preload="auto"`, **sem `loop`**, `poster={mascoteFinal}`.
  - No evento `onEnded`, esconde o `<video>` e mostra o poster (mascote congelado na pose final). Em `prefers-reduced-motion`, j\u00e1 inicia no poster.
  - Misturado ao fundo via `mix-blend-mode: screen` (o preto do v\u00eddeo some sobre o fundo escuro/claro) + leve glow vermelho atr\u00e1s.

## 2. Home (`src/routes/home.tsx`)
- Layout em duas colunas no desktop, empilhado no mobile:
  - **Esquerda**: tag "Grupo BR Hunter", `<h1>` "Bem-vindo, {nome}.", subt\u00edtulo, e a grade dos 4 cards (Presta\u00e7\u00e3o, Usu\u00e1rios, Condom\u00ednios, Configura\u00e7\u00f5es \u2192 abre o mesmo popover do canto).
  - **Direita**: `<MascotIntro />` ocupando ~480px, com halo radial na cor prim\u00e1ria.
- Substitui o `mascot.png` est\u00e1tico atual.
- N\u00e3o usa mais `AppShell` (que injeta sidebar). Passa a usar o novo shell sem sidebar.

## 3. Remover sidebar do sistema
- Criar `src/components/site-shell.tsx`: shell sem sidebar, com **header fino** (logo + nome + links de m\u00f3dulos \u00e0 direita) e o popover de Configura\u00e7\u00f5es flutuante.
- Header aparece em **todas as telas autenticadas exceto a Home** (na Home, mostra apenas a logo no topo, conforme pedido, sem os links de m\u00f3dulo \u2014 a navega\u00e7\u00e3o acontece pelos cards).
- Substituir `AppShell` por `SiteShell` em: `dashboard`, `usuarios`, `condominios`, `configuracoes`, `historico`, `prestacoes.index`, `prestacoes.nova`, `prestacoes.$id.editar`, `home`.
- `app-sidebar.tsx` e `app-shell.tsx` ficam sem uso \u2014 removo os imports e deleto os arquivos.
- Mant\u00e9m destaque do link ativo no header (`activeProps`).

## 4. Bot\u00e3o Configura\u00e7\u00f5es flutuante
- Componente `<SettingsFab />` posicionado `fixed bottom-6 right-6 z-40`.
- Bot\u00e3o redondo, "sobre-tom do fundo": `bg-foreground/5 backdrop-blur border border-border/40 text-muted-foreground hover:bg-foreground/10` (discreto, n\u00e3o chama aten\u00e7\u00e3o).
- Ao clicar, abre um `Popover` (shadcn) ancorado acima/\u00e0 esquerda do bot\u00e3o, com 3 a\u00e7\u00f5es empilhadas:
  1. **Modo Escuro / Modo Claro** \u2014 \u00edcone `Sun`/`Moon` alterna conforme `theme`. Usa o `useTheme()` existente.
  2. **Cor Alternativa** \u2014 \u00edcone `Palette`. Alterna entre paleta **"Brasa"** (atual: vermelho dominante) e paleta **"Carv\u00e3o"** (invertida: grafite/preto dominante com vermelho como toque de destaque). Persistido em `localStorage`.
  3. **Sair** \u2014 \u00edcone `LogOut`, executa `signOut()` e redireciona para `/login`. Estilo `text-destructive`.

## 5. Paleta alternativa (toggle "Cor Alternativa")
- Criar `src/lib/palette.tsx` com `PaletteProvider` + `usePalette()`, an\u00e1logo ao `ThemeProvider`. Aplica um atributo `data-palette="brasa"` ou `data-palette="carvao"` no `<html>`.
- Em `src/styles.css`, adicionar bloco `:root[data-palette="carvao"]` (e variante dark) com tokens invertidos:
  - **Brasa (atual, default)**: vermelho `#C8102E` como `--primary` dominante, cinza/branco como apoio.
  - **Carv\u00e3o (alternativa)**: grafite escuro como dominante (`--primary` muda para um cinza-grafite profundo) e o vermelho passa a `--accent` / `--ring` (toque de destaque). Os fundos, bordas e foreground ajustam para manter contraste WCAG AA em light e dark.
- `PaletteProvider` registrado em `__root.tsx` junto do `ThemeProvider`.

## 6. SEO / acessibilidade
- `<video>` recebe `aria-label="Anima\u00e7\u00e3o de boas-vindas do mascote BR Hunter"` e respeita `prefers-reduced-motion`.
- Bot\u00e3o flutuante com `aria-label="Configura\u00e7\u00f5es"` e `title`.
- Mantenho `pageMeta` da Home intacto.

## Arquivos
**Criar**
- `public/mascote-intro.mp4`, `public/mascote-final.jpg` (gerados via ffmpeg)
- `src/components/mascot-intro.tsx`
- `src/components/site-shell.tsx`
- `src/components/site-header.tsx` (header com logo + links)
- `src/components/settings-fab.tsx`
- `src/lib/palette.tsx`

**Editar**
- `src/routes/__root.tsx` (adicionar `PaletteProvider`)
- `src/styles.css` (tokens da paleta "carv\u00e3o")
- `src/routes/home.tsx` (novo layout, sem `AppShell`, com `SiteShell` + `MascotIntro`)
- `src/routes/dashboard.tsx`, `usuarios.tsx`, `condominios.tsx`, `configuracoes.tsx`, `historico.tsx`, `prestacoes.index.tsx`, `prestacoes.nova.tsx`, `prestacoes.$id.editar.tsx` (trocar `AppShell` por `SiteShell`)

**Remover**
- `src/components/app-shell.tsx`
- `src/components/app-sidebar.tsx`

## Pontos t\u00e9cnicos
- O `ffmpeg` j\u00e1 est\u00e1 dispon\u00edvel no sandbox; o re-encode roda 1x no momento da implementa\u00e7\u00e3o e o resultado vai versionado em `public/`.
- A p\u00e1gina `/configuracoes` continua existindo (pode ser desreferenciada do menu, mas mantenho a rota para n\u00e3o quebrar links). O card de Configura\u00e7\u00f5es da Home pode opcionalmente abrir o popover \u2014 vou faz\u00ea-lo abrir o popover via evento custom em vez de navegar, para refletir a inten\u00e7\u00e3o do pedido.
- Sem mudan\u00e7as de banco, RLS ou backend.