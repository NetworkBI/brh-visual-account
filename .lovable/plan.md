## Plano

Renderizar a sidebar **somente** na rota `/dashboard` (Prestação de Contas), sem afetar as demais telas.

### Alterações

**1. `src/routes/dashboard.tsx`**
- Importar `SidebarProvider`, `SidebarTrigger` de `@/components/ui/sidebar` e `AppSidebar` de `@/components/app-sidebar`.
- Trocar o `component` da rota para envolver `<Pagina />` com a sidebar:
  ```tsx
  component: () => (
    <AppShell>
      <SidebarProvider>
        <div className="flex w-full">
          <AppSidebar />
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">Menu</span>
            </div>
            <Pagina />
          </div>
        </div>
      </SidebarProvider>
    </AppShell>
  ),
  ```
- O `SidebarTrigger` fica acima do conteúdo da página para permitir colapsar/expandir (a sidebar usa `collapsible="icon"`).

**2. `src/components/app-sidebar.tsx` (nenhuma alteração necessária)**
- Já contém apenas os itens "Início" e "Usuários" (este último só visível para ADM/MASTER), conforme estado atual.

### O que NÃO mudar
- `src/components/app-shell.tsx` permanece intacto — sem sidebar global.
- Demais rotas (`/home`, `/usuarios`, `/condominios`, `/historico`, etc.) continuam sem sidebar.

### Resultado
Apenas em `/dashboard` aparecerá a sidebar à esquerda com os botões Início e Usuários, podendo ser recolhida pelo trigger.
