import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PrestacaoForm } from "@/components/prestacao-form";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/prestacoes/$id/editar")({
  head: () => ({ meta: [{ title: "Editar prestação — BR Hunter" }] }),
  component: EditarPage,
});

function EditarPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["prestacao", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("prestacoes").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Editar prestação</h1>
        {isLoading || !data ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : (
          <PrestacaoForm
            mode="editar"
            initial={{
              id: data.id,
              mes: data.mes,
              condominio_id: data.condominio_id,
              processo: data.processo,
              data_evento: data.data_evento,
              usuario_responsavel: data.usuario_responsavel,
              observacoes: data.observacoes ?? "",
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
