## Diagnóstico

A lentidão não é do servidor — são **assets enormes** carregando em toda navegação, somados a recargas desnecessárias de dados.

### Causas encontradas

1. **`src/assets/logo.png` tem 2,6 MB** (PNG sem otimização). Esse logo aparece no `AppSidebar` em **todas** as telas autenticadas. Cada navegação que monta o shell força o navegador a decodificar uma imagem gigante.
2. **`src/assets/login-bg.jpg` tem 1,5 MB** — pesa na tela de login.
3. **`mascot.png` tem 348 KB** — também maior do que precisa.
4. **`AppShell` desmonta e remonta a cada rota** (cada `route.tsx` faz `<AppShell><Pagina/></AppShell>`). Isso recria `SidebarProvider`, recarrega o `<img>` do logo do cache, e dá aquela "piscada" lenta entre telas.
5. **React Query sem `staleTime`** — `usePrestacoes`, `useCondominios`, `useProfiles` refazem fetch toda vez que você entra na tela, mesmo já tendo os dados.
6. **Dashboard busca todas as prestações** (`select *`) sem paginação. Funciona hoje, mas escala mal.

## Plano de correção

### 1. Reduzir o logo (impacto maior)
- Reprocessar `src/assets/logo.png` para um PNG otimizado (~80–150 KB) mantendo a transparência e a aparência. Sem mudar nada visual.

### 2. Reduzir backgrounds
- Recomprimir `login-bg.jpg` para ~200 KB (qualidade 75, mesmas dimensões).
- Recomprimir `mascot.png` para ~80 KB.

### 3. Layout estável (eliminar remontagem do shell)
- Converter `AppShell` em **layout route** via `src/routes/_authenticated.tsx` (com `<Outlet/>` e a checagem de auth no `beforeLoad`).
- Mover `dashboard.tsx`, `home.tsx`, `historico.tsx`, `usuarios.tsx`, `condominios.tsx`, `configuracoes.tsx`, `prestacoes.*` para dentro de `_authenticated/`.
- Cada route file deixa de envelopar `<AppShell>` manualmente. Sidebar e header passam a persistir entre navegações — sem piscada, sem re-fetch do logo.

### 4. Cache de dados
- Adicionar `staleTime: 60_000` em `useCondominios`, `useProfiles`, `usePrestacoes` (`src/lib/queries.ts`). Dados ficam "frescos" por 1 min e a tela abre instantaneamente na segunda visita.

### 5. (Opcional, posterior) Paginação no dashboard
- Limitar `usePrestacoes` aos últimos 200 registros ou paginar via search params. Não é urgente agora.

## Resultado esperado
- Primeira tela após login: muito mais rápida (logo de 2,6 MB → ~120 KB).
- Trocar entre Início / Prestação / Histórico / Usuários: instantâneo (sem remontar sidebar, sem refetch).
- Tela de login: carrega rápido em conexões fracas.

Nenhuma mudança visual nem de funcionalidade — só performance.