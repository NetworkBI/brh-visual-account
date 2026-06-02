import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { usePrestacoes, useCondominios, useProfiles, useAllProfiles } from "@/lib/queries";
import { useAuth, useUserRole } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Building2, CalendarClock, ListChecks, Pencil, EyeOff, Eye, Plus, Sparkles, History } from "lucide-react";
import { PROCESSOS } from "@/lib/schemas";
import { toast } from "sonner";

import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: () => pageMeta({
    path: "/dashboard",
    title: "Prestação de Contas — Grupo BR Hunter",
    description: "Painel operacional com indicadores por processo, últimas prestações e lista completa de lançamentos do ciclo.",
  }),
  component: () => <AppShell><Pagina /></AppShell>,
});

// Meta esperada por processo por ciclo do mês (ajuste conforme regra de negócio).
// Usada para calcular a % de conclusão na barra horizontal de cada processo.
const META_POR_PROCESSO = 10;

function Pagina() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: role } = useUserRole();
  const { data: prestacoes = [], isLoading } = usePrestacoes();
  const { data: condominios = [] } = useCondominios();
  const { data: profiles = [] } = useProfiles();
  const { data: allProfiles = [] } = useAllProfiles();

  const nomeUsuario = (id?: string | null) => {
    if (!id) return "—";
    const p = allProfiles.find((p) => p.id === id);
    return p ? `${p.primeiro_nome ?? ""} ${p.segundo_nome ?? ""}`.trim() || "—" : "—";
  };

  const mesAtual = new Date().toISOString().slice(0, 7);
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual);
  const doMes = useMemo(() => prestacoes.filter((p) => (p.mes || "").startsWith(mesSelecionado) && (p as any).ativo !== false), [prestacoes, mesSelecionado]);

  const porProcesso = PROCESSOS.map((proc) => {
    const count = doMes.filter((p) => p.processo === proc).length;
    const pct = Math.min(100, Math.round((count / META_POR_PROCESSO) * 100));
    return { proc, count, pct };
  });

  // Top 5 últimos lançamentos do ciclo do mês (com animação ao surgir)
  const top5 = useMemo(
    () => [...doMes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [doMes],
  );

  const inativar = async (id: string, ativo: boolean) => {
    const { error } = await supabase.from("prestacoes").update({ ativo: !ativo } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(ativo ? "Lançamento inativado" : "Lançamento reativado");
    qc.invalidateQueries({ queryKey: ["prestacoes"] });
  };

  // ----- Filtros da lista (apenas busca por condomínio + mês do topo) -----
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return prestacoes.filter((p) =>
      (p as any).ativo !== false &&
      (p.mes || "").startsWith(mesSelecionado) &&
      (!ql || p.condominios?.nome?.toLowerCase().includes(ql)),
    );
  }, [prestacoes, q, mesSelecionado]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Prestação de Contas</h1>
          <p className="text-sm text-muted-foreground">Resumo Operacional</p>
          <div className="mt-3 flex items-center gap-2">
            <label htmlFor="filtro-mes" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Mês
            </label>
            <Input
              id="filtro-mes"
              type="month"
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value || mesAtual)}
              className="h-8 w-44"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild className="shadow-elegant">
            <Link to="/prestacoes/nova"><Plus className="mr-1 h-4 w-4" /> Novo Lançamento</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Quantidades de Condomínios que vão prestar contas" value={new Set(doMes.map((p) => p.condominio_id)).size} />
        <StatCard icon={FileText} label="Quantidade de Lançamento Realizados" value={prestacoes.length} />
        <StatCard icon={Building2} label="Quantidade de Condomínios sem nenhum processo" value={Math.max(0, condominios.length - new Set(doMes.map((p) => p.condominio_id)).size)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Por processo — barras com tooltip */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold leading-none tracking-tight">Por processo</h2>
            <p className="text-xs text-muted-foreground">% concluído do ciclo · meta de {META_POR_PROCESSO} por processo</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <TooltipProvider delayDuration={100}>
              {porProcesso.map((r) => (
                <div key={r.proc} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-sm font-medium">{r.proc}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="group relative h-3 flex-1 cursor-help overflow-hidden rounded-full bg-muted ring-1 ring-border">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-primary-glow to-primary transition-[width] duration-700 ease-out"
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs"><b>{r.pct}%</b> realizado · {r.count} de {META_POR_PROCESSO} esperados</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="w-12 text-right text-sm font-semibold tabular-nums">{r.pct}%</span>
                </div>
              ))}
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Últimas prestações — Top 5 animado */}
        <Card className="overflow-hidden">
          <CardHeader>
            <h2 className="flex items-center gap-2 font-semibold leading-none tracking-tight"><Sparkles className="h-4 w-4 text-primary" /> Últimos Lançamentos de Prestações</h2>
            <p className="text-xs text-muted-foreground">Top 5 da Competência selecionada ({mesSelecionado})</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : top5.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem lançamentos neste ciclo.</p>
            ) : (
              <ul className="space-y-2">
                {top5.map((p, i) => (
                  <li
                    key={p.id}
                    className="animate-fade-in rounded-lg border border-border/60 bg-gradient-to-r from-card to-muted/30 p-3 transition hover:border-primary/40 hover:shadow-md"
                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.condominios?.nome ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.mes} · {p.processo}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">#{i + 1}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista completa (mesclada da antiga aba Prestações) */}
      <Card className="mt-10">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3 space-y-0 pt-8">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">HISTÓRICO</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Buscar condomínio" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Mês</th>
                  <th className="px-4 py-3 text-left font-medium">Condomínio</th>
                  <th className="px-4 py-3 text-left font-medium">Data Ocorrido</th>
                  <th className="px-4 py-3 text-left font-medium">Processo</th>
                  <th className="px-4 py-3 text-left font-medium">Responsável</th>
                  <th className="px-4 py-3 text-left font-medium">Usuário de Criação</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum lançamento encontrado.</td></tr>
                ) : (
                  filtered.map((p) => {
                    const ativo = (p as any).ativo !== false;
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{p.mes}</td>
                        <td className="px-4 py-3">{p.condominios?.nome ?? "—"}</td>
                        <td className="px-4 py-3">{new Date(p.data_evento).toLocaleDateString("pt-BR")}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{p.processo}</span></td>
                        <td className="px-4 py-3">
                          <Select value={(p as any).usuario_responsavel ?? ""} disabled>
                            <SelectTrigger className="h-8 w-48">
                              <SelectValue placeholder={nomeUsuario((p as any).usuario_responsavel)}>
                                {nomeUsuario((p as any).usuario_responsavel)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.filter((u) => u.id).map((u) => (
                                <SelectItem key={u.id!} value={u.id!}>{u.primeiro_nome ?? ""} {u.segundo_nome ?? ""}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">{nomeUsuario((p as any).usuario)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="sm" aria-label="Editar lançamento">
                              <Link to="/prestacoes/$id/editar" params={{ id: p.id }}><Pencil className="h-4 w-4" /></Link>
                            </Button>
                            {(role === "padrao" || role === "adm" || p.usuario === user?.id) && (
                              <Button variant="ghost" size="sm" onClick={() => inativar(p.id, ativo)} title="Inativar" aria-label="Inativar lançamento">
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 p-2.5 text-primary ring-1 ring-primary/20">
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
