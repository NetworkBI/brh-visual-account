import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { PrestacaoForm } from "@/components/prestacao-form";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/prestacoes/nova")({
  head: () => pageMeta({
    path: "/prestacoes/nova",
    title: "Nova prestação — Grupo BR Hunter",
    description: "Cadastre um novo lançamento de prestação de contas no sistema do Grupo BR Hunter.",
  }),
  component: () => (
    <SiteShell>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Novo Lançamento</h1>
        <PrestacaoForm mode="criar" />
      </div>
    </SiteShell>
  ),
});
