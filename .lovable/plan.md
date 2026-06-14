## Diagnóstico
O botão está apontando corretamente para `/usuarios/novo`, mas o roteador interpreta `usuarios.novo.tsx` como uma rota filha de `usuarios.tsx`. Como a tela de Usuários é uma página completa e não renderiza um ponto de saída (`Outlet`) para páginas filhas, a URL muda, porém a tela de cadastro não aparece.

## Plano
1. Tornar `/usuarios/novo` uma rota independente no roteador, preservando exatamente a mesma URL e o mesmo formulário.
2. Manter o botão “Cadastrar novo usuário” navegando dentro do sistema, na mesma aba.
3. Deixar a árvore de rotas ser regenerada automaticamente pelo framework, sem editar o arquivo gerado manualmente.
4. Validar o clique e confirmar que a tela de cadastro é exibida e que “Voltar/Cancelar” retorna para Usuários.