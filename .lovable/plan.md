
## Mudanças

**1. Botão "Histórico" dentro de Prestação de Contas (`src/routes/dashboard.tsx`)**
- Adicionar botão "Histórico" ao lado do "+Novo Lançamento" no topo da tela, com ícone `History` (lucide), navegando para `/historico`.

**2. Sidebar (`src/components/app-sidebar.tsx`)**
- Remover o subtítulo "Prestação de Contas" abaixo de "BR HUNTER" no header.
- Trocar a logo: copiar `user-uploads://Mascote-2.png` para `src/assets/logo.png` (sobrescrevendo a atual) — todos os usos do logo continuam funcionando.

**3. Dashboard — remover cards de stats (`src/routes/dashboard.tsx`)**
- Excluir os 3 StatCards: "Mês atual", "Condomínios" e "Em fechamento". Manter apenas "Total prestações" (ou remover toda a grade — confirme abaixo se quiser que eu mantenha "Total prestações" ou remova todos os 4).

## Pergunta de escopo
Você disse para excluir Mês atual / Condomínios / Em fechamento. Mantenho o card "Total prestações" sozinho, ou removo a faixa inteira de stats? Vou assumir **manter apenas "Total prestações"** salvo indicação contrária.

## Sem alterações
- Página `/historico` continua igual (já funcional).
- Botão "Histórico" no footer do sidebar (de iteração anterior) — não está presente no código atual, então nada a remover.
