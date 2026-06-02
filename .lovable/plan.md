## Ocultar botão "Voltar" na tela Home

**Arquivo:** `src/components/app-shell.tsx`

1. Importar `useLocation` de `@tanstack/react-router` (junto aos imports já existentes).
2. Obter o pathname atual: `const { pathname } = useLocation();`
3. Envolver o `<Button>` do "Voltar" em `{pathname !== "/home" && ( ... )}` para que ele só apareça fora da Home.

O restante do header (logo, data, botão "Sair", FAB de configurações) permanece igual.