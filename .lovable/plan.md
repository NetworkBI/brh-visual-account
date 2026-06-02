## Objetivo

1. Trocar o rótulo do botão de paleta de "Identidade BR Hunter" para **"Cores Alternativas"** (aplicado a todas as 3 paletas do ciclo, mantendo o sufixo descritivo de cada uma).
2. Reforçar a diferença visual entre as paletas — hoje "Brasa" e "Grafite" são sutis demais — mantendo sempre boa legibilidade de texto (contraste AA em light e dark).

## Alterações

### `src/lib/palette.tsx`
Atualizar o mapa `LABELS`:
- `padrao` → "Cores Alternativas — Padrão"
- `brasa`  → "Cores Alternativas — Brasa"
- `grafite`→ "Cores Alternativas — Grafite"

(Mantém o nome único "Cores Alternativas" como pedido, com um sufixo curto pra o usuário saber em qual variação está.)

### `src/styles.css` — refinar tokens das paletas alternativas

Objetivo: cada paleta deve ter uma **personalidade visual clara** (background, cards, primary, accent) já no primeiro clique, sem sacrificar contraste de texto.

**Padrão (`:root`)** — sem mudanças (já é a identidade base).

**Brasa** (vermelho dominante, quente):
- Light: background levemente avermelhado/cremoso, cards brancos, primary vermelho mais saturado e escuro (melhor contraste em botões), accent rosé visível em badges/hover.
- Dark: background marrom-avermelhado escuro (não preto puro), cards um tom acima, primary vermelho-coral luminoso.
- Garantir `foreground` sempre ≥ AA contra `background` e `card`.

**Grafite** (cinza dominante, vermelho só como acento):
- Light: background cinza-claro perceptível (não branco), cards brancos para destacar, primary cinza-grafite escuro, `secondary` vermelho como acento pontual.
- Dark: background quase-preto azulado, cards cinza-escuro, primary cinza-claro luminoso, accent vermelho ainda visível em hovers e foco.
- Ajustar `muted-foreground` para manter texto secundário legível.

Também revisar/garantir nas três paletas (light e dark):
- `--foreground` com contraste ≥ 7:1 contra `--background`
- `--muted-foreground` ≥ 4.5:1 contra `--background` e `--card`
- `--primary-foreground` ≥ 4.5:1 contra `--primary`
- `--border` perceptível mas suave (não invisível em light, não estourado em dark)

### Validação
Após a mudança, percorrer mentalmente Home/Dashboard/Usuários nas 3 paletas × 2 temas (6 combinações) confirmando:
- Cor de fundo claramente diferente entre as 3 paletas
- Botões primários com identidade própria em cada paleta
- Nenhum texto cinza-em-cinza ou vermelho-em-vermelho ilegível

## Fora de escopo
- Não mexer em componentes (botões, cards, sidebar) — só design tokens + label.
- Não adicionar novas paletas.
