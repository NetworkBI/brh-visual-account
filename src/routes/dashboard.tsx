import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { usePrestacoes, useCondominios } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Building2, CalendarClock, ListChecks } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PROCESSOS } from "@/lib/schemas";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — BR Hunter" }] }),
  component: () => <AppShell><Dashboard /></AppShell>,
});

function Dashboard() {
  const { data: prestacoes = [], isLoading } = usePrestacoes();
  const { data: condominios = [] } = useCondominios();

  const mesAtual = new Date().toISOString().slice(0, 7);
  const doMes = prestacoes.filter((p) => (p.mes || "").startsWith(mesAtual));
  const porProcesso = PROCESSOS.map((proc) => ({
    proc,
    count: prestacoes.filter((p) => p.processo === proc).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral das prestações de contas</p>
        </div>
        <Button asChild>
          <Link to="/prestacoes/nova">+ Nova prestação</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total prestações" value={prestacoes.length} />
        <StatCard icon={CalendarClock} label="Mês atual" value={doMes.length} />
        <StatCard icon={Building2} label="Condomínios" value={condominios.length} />
        <StatCard icon={ListChecks} label="Em fechamento" value={prestacoes.filter(p => p.processo === "Data Fechamento").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Por processo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {porProcesso.map((r) => (
              <div key={r.proc} className="flex items-center gap-3">
                <span className="w-44 text-sm">{r.proc}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${prestacoes.length ? (r.count / prestacoes.length) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-semibold">{r.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Últimas prestações</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : prestacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma prestação cadastrada ainda.</p>
            ) : (
              <ul className="divide-y">
                {prestacoes.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.condominios?.nome ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{p.mes} · {p.processo}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(p.data_evento).toLocaleDateString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
