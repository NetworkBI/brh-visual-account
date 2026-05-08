import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PrestacaoForm } from "@/components/prestacao-form";

export const Route = createFileRoute("/prestacoes/nova")({
  head: () => ({ meta: [{ title: "Nova prestação — BR Hunter" }] }),
  component: () => (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Nova prestação</h1>
        <PrestacaoForm mode="criar" />
      </div>
    </AppShell>
  ),
});
