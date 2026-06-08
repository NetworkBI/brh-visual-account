## Objetivo
Padronizar a navegação: header só na Home; demais páginas autenticadas usam o AppSidebar com todos os controles consolidados; botão flutuante "voltar ao topo" global.

## Mudanças

### 1. `src/components/app-shell.tsx` — Header só na Home
- O `<header>` (logo "BR HUNTER", data, Voltar, Sair) passa a renderizar **apenas** quando `pathname === "/home"`.
- Nas demais rotas, o AppShell renderiza só o background + `<main>` (sem header, sem padding extra), deixando o sidebar como única navegação.
- Remover o FAB (Settings/tema/paleta) — funções migram para o sidebar. Mantém o `<main>` com `Outlet`/children.

### 2. `src/components/app-sidebar.tsx` — Sidebar consolidado
**Header do sidebar (topo):**
- Logo + "BR HUNTER" à esquerda.
- `SidebarTrigger` (botão de recolher) à direita do logo, dentro do próprio `SidebarHeader`. Quando colapsado, o trigger continua visível na faixa de ícones.

**Conteúdo (mesmo de hoje):** Início, Usuários (se permissão).

**Rodapé do sidebar — agrupamento profissional (na ordem):**
1. Alternar paleta (`PaletteIcon` + label dinâmico)
2. Alternar tema (Sun/Moon + "Modo claro/escuro")
3. Separador
4. Voltar (`ArrowLeft`) — usa `window.history.back()` com fallback para `/home`; **oculto quando `pathname === "/home"`**
5. Sair (`LogOut`) — chama `signOut()` e navega para `/login`

Remover o toggle "Configurações rápidas" (open/close) — todos os itens ficam sempre visíveis no rodapé, harmonizados com `SidebarMenuButton` padrão (mesmo tamanho, ícones 4×4, tooltip quando colapsado).

### 3. Adicionar AppSidebar nas páginas que ainda não têm
Aplicar o mesmo wrapper já usado em `dashboard.tsx`/`usuarios.tsx` em:
- `src/routes/condominios.tsx`
- `src/routes/historico.tsx`
- `src/routes/configuracoes.tsx`
- `src/routes/prestacoes.index.tsx`
- `src/routes/prestacoes.nova.tsx`
- `src/routes/prestacoes.$id.editar.tsx`

`home.tsx` **não recebe sidebar** — fica só com o header da AppShell.

Como o `SidebarTrigger` agora vive dentro do sidebar, remover os `SidebarTrigger` que ficam no topo de cada página (em dashboard/usuarios).

### 4. Botão "Voltar ao topo" — global
Criar `src/components/back-to-top.tsx`:
- `position: fixed` no canto inferior direito (`bottom-6 right-6 z-40`).
- `useEffect` com listener `scroll` na `window`: aparece quando `window.scrollY > 300`, some abaixo disso (transição de opacidade + translate-y suave).
- `onClick`: `window.scrollTo({ top: 0, behavior: "smooth" })`.
- Botão circular (`h-12 w-12 rounded-full`) com ícone `ArrowUp` (lucide), variante `default`, sombra suave; `aria-label="Voltar ao topo"`.
- Montar dentro do `AppShell` (renderiza em todas as páginas autenticadas).

## Detalhes técnicos
- Sem alterações em backend, rotas ou dados.
- Reuso de `useAuth`, `useTheme`, `usePalette` já existentes — apenas migração de uso para o sidebar.
- Tooltips do sidebar (`SidebarMenuButton` com `tooltip={label}`) mantêm rótulos legíveis quando recolhido.
- Sem mudança de tokens de cor; mantém gradiente vermelho atual do header do sidebar.
