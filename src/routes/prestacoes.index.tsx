import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SiteShell } from "@/components/site-shell";
import { usePrestacoes } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import { PROCESSOS } from "@/lib/schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/prestacoes/")({
  head: () => pageMeta({
    path: "/prestacoes",
    title: "Prestações — Grupo BR Hunter",
    description: "Lista completa de prestações de contas cadastradas, com busca e filtro por processo.",
  }),
  component: () => <SiteShell><Lista /></SiteShell>,
});

function Lista() {
  const { data = [], isLoading } = usePrestacoes();
  const [q, setQ] = useState("");
  const [proc, setProc] = useState<string>("todos");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return data.filter((p) =>
      (proc === "todos" || p.processo === proc) &&
      (!ql || p.condominios?.nome?.toLowerCase().includes(ql) || p.mes?.toLowerCase().includes(ql))
    );
  }, [data, q, proc]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Prestações</h1>
          <p className="text-sm text-muted-foreground">Todas as prestações de contas</p>
        </div>
        <Button asChild><Link to="/prestacoes/nova">+ Nova prestação</Link></Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar por condomínio ou mês…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={proc} onValueChange={setProc}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os processos</SelectItem>
            {PROCESSOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Mês</th>
                <th className="px-4 py-3 text-left">Condomínio</th>
                <th className="px-4 py-3 text-left">Processo</th>
                <th className="px-4 py-3 text-left">Data Evento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma prestação encontrada.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.mes}</td>
                    <td className="px-4 py-3">{p.condominios?.nome ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{p.processo}</span>
                    </td>
                    <td className="px-4 py-3">{new Date(p.data_evento).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/prestacoes/$id/editar" params={{ id: p.id }}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
