## Plano

Adicionar um botão "Voltar" no topo da tela `/historico` que retorna à tela anterior usando o histórico do navegador.

### Mudanças
- Em `src/routes/historico.tsx`, adicionar acima do título um `Button` com variante `ghost` e ícone `ArrowLeft` (lucide-react).
- Ao clicar, executar `window.history.back()` (fallback: navegar para `/home` se não houver histórico).

Sem alterações de lógica de negócio nem de dados.