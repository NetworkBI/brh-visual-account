
# Sistema de Controle de Prestação de Contas — Grupo BR Hunter

## Identidade Visual (extraída de brhunter.com.br + Instagram)

- **Cores**: vermelho institucional `#C8102E` (primária), cinza escuro `#4A4A4A` (secundária), branco `#FFFFFF` (fundo), cinza claro `#F5F5F5` (superfícies). Acento dourado/bege sutil do padrão hexagonal de fundo.
- **Logo**: usar `Logo.png` enviado (escudo cinza/vermelho) no header e `hunter.jpg` como elemento decorativo opcional na tela de login.
- **Tipografia**: sans-serif limpa, peso bold para títulos (estilo do site original) — par `Outfit` (títulos) + `Inter` (corpo).
- **Layout**: header branco com logo à esquerda + navegação, botões com cantos arredondados e contorno vermelho (estilo "Trabalhe Conosco" / "Condomínio Online" do site).

## Estrutura de dados (baseada na planilha enviada)

Tabela principal **prestacoes** com os campos da planilha:
- Mês
- Condomínio
- Processo (enum: `Doc/Recebimento`, `Lançamento`, `Montagem`, `Data Fechamento`)
- Data do Evento
- Usuário Responsável
- Usuário
- Ocorrido (enum: `criação`, `edição`)
- Data do Ocorrido

Tabela **condominios** (cadastro auxiliar) e tabela **profiles** ligada a `auth.users` com os campos do cadastro.

## Cadastro de Usuário

Campos coletados:
- Primeiro nome *(obrigatório)*
- Segundo nome *(obrigatório)*
- Data de nascimento *(obrigatório)*
- E-mail corporativo *(usado como login)*
- Matrícula
- Senha — validação: mínimo 6 caracteres, ao menos 1 número, **sem caracteres especiais** (regex `^[A-Za-z0-9]{6,}$` com pelo menos um dígito)

## Tela de Login

Layout simples centralizado, logo BR Hunter no topo, dois campos rotulados exatamente:
```
NOME
SENHA
```
Botão "Entrar" vermelho. Link "Cadastrar-se" abaixo.

## Telas do Sistema

1. **/login** — formulário NOME / SENHA
2. **/cadastro** — formulário com os 5 campos + validações
3. **/dashboard** — visão geral: cards com totais por processo, mês atual, últimos lançamentos
4. **/prestacoes** — tabela completa (filtro por mês, condomínio, processo, responsável), botão "Nova Prestação"
5. **/prestacoes/nova** e **/prestacoes/:id/editar** — formulário com todos os campos da planilha; ao salvar, registra automaticamente em "ocorrido" (criação/edição) com Data_ocorrido e usuário logado
6. **/condominios** — CRUD de condomínios
7. **/historico** — log de alterações (criação/edição) por prestação

## Tecnologia

- **Frontend**: TanStack Start + Tailwind v4 + shadcn/ui, design tokens em `src/styles.css` (oklch das cores BR Hunter)
- **Backend**: Lovable Cloud
  - Auth: e-mail/senha com validação Zod
  - Tabelas: `profiles`, `condominios`, `prestacoes`, `prestacao_eventos` (auditoria)
  - RLS: usuários autenticados leem todas as prestações; só o autor edita; auditoria insere automática via trigger
- **Validação**: Zod tanto no client quanto regras de constraint no banco

## Próximos passos após aprovação

1. Habilitar Lovable Cloud
2. Criar tabelas + RLS + trigger de auditoria
3. Copiar logo para `src/assets/`
4. Definir tokens de cor em `src/styles.css`
5. Criar rotas: `__root` (header + outlet), `login`, `cadastro`, `dashboard`, `prestacoes`, `prestacoes.nova`, `prestacoes.$id.editar`, `condominios`, `historico`
6. Implementar formulários com react-hook-form + Zod
7. Validar fluxo completo (cadastro → login → criar prestação → editar → conferir auditoria)

## Pergunta antes de implementar

A planilha enviada está vazia (apenas cabeçalhos). Confirma que:
- (a) **devo começar com banco vazio** e o usuário cadastra condomínios/prestações pela interface, ou
- (b) tem dados de exemplo que devo importar?
