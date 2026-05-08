import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { useCondominios } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/condominios")({
  head: () => ({ meta: [{ title: "Condomínios — BR Hunter" }] }),
  component: () => <AppShell><Pagina /></AppShell>,
});

function Pagina() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useCondominios();
  const [nome, setNome] = useState("");

  const adicionar = async () => {
    if (!nome.trim() || !user) return;
    const { error } = await supabase.from("condominios").insert({ nome: nome.trim(), created_by: user.id });
    if (error) { toast.error(error.message); return; }
    setNome("");
    toast.success("Condomínio adicionado");
    qc.invalidateQueries({ queryKey: ["condominios"] });
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from("condominios").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["condominios"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Condomínios</h1>
        <p className="text-sm text-muted-foreground">Cadastro de condomínios usados nas prestações</p>
      </div>
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1.5 min-w-60">
            <Label>Nome do condomínio</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ed. Exemplo" />
          </div>
          <Button onClick={adicionar}>Adicionar</Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={2} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={2} className="p-6 text-center text-muted-foreground">Nenhum condomínio cadastrado.</td></tr>
            ) : data.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.nome}</td>
                <td className="px-4 py-3 text-right">
                  {c.created_by === user?.id && (
                    <Button variant="ghost" size="sm" onClick={() => remover(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
