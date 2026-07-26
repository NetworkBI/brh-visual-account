import { createFileRoute, redirect } from "@tanstack/react-router";

// /prestacoes agora é redirecionado para /dashboard (Prestação de Contas)
export const Route = createFileRoute("/prestacoes/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
