import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useEventos, useAllProfiles } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/historico")({
  head: () => pageMeta({
    path: "/historico",
    title: "Histórico — Grupo BR Hunter",
    description: "Consulte o histórico completo de eventos e movimentações realizadas no sistema do Grupo BR Hunter.",
  }),
  component: () => <AppShell><Pagina /></AppShell>,
});

function Pagina() {
  const { data = [], isLoading } = useEventos();
  const { data: profiles = [] } = useAllProfiles();
  const navigate = useNavigate();
  const nomeDe = (id: string) => {
    const p = profiles.find((p) => p.id === id);
    return p ? `${p.primeiro_nome} ${p.segundo_nome}` : id.slice(0, 8);
  };

  const handleVoltar = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/home" });
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={handleVoltar} className="-ml-2">
        <ArrowLeft /> Voltar
      </Button>
      <div>
        <h1 className="font-display text-3xl font-bold">Histórico</h1>
        <p className="text-sm text-muted-foreground">Auditoria de criações e edições</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Ocorrido</th>
              <th className="px-4 py-3 text-left">Condomínio</th>
              <th className="px-4 py-3 text-left">Mês</th>
              <th className="px-4 py-3 text-left">Usuário</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem eventos.</td></tr>
            ) : data.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">{new Date(e.data_ocorrido).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    e.ocorrido === "criação" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  }`}>{e.ocorrido}</span>
                </td>
                <td className="px-4 py-3">{e.prestacoes?.condominios?.nome ?? "—"}</td>
                <td className="px-4 py-3">{e.prestacoes?.mes ?? "—"}</td>
                <td className="px-4 py-3">{nomeDe(e.usuario)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
