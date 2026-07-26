import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { prestacaoSchema, PROCESSOS, type PrestacaoInput } from "@/lib/schemas";
import { useCondominios, useProfiles, useAllProfiles } from "@/lib/queries";
import { getCondominiosFromSheet } from "@/lib/sheet.functions";
import { useAuth } from "@/lib/auth";
import { insertCondominio, createPrestacao, updatePrestacao } from "@/lib/db.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  initial?: Partial<PrestacaoInput> & { id?: string };
  mode: "criar" | "editar";
}

export function PrestacaoForm({ initial, mode }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PrestacaoInput>({
    resolver: zodResolver(prestacaoSchema),
    defaultValues: {
      mes: initial?.mes ?? new Date().toISOString().slice(0, 7),
      condominio_id: initial?.condominio_id ?? null,
      id_condominio: initial?.id_condominio ? Number(initial.id_condominio) : undefined,
      processo: (initial?.processo as any) ?? "Documentação Recebida",
      data_evento: initial?.data_evento ?? new Date().toISOString().slice(0, 10),
      usuario_responsavel: initial?.usuario_responsavel ?? user?.id ?? "",
      observacoes: initial?.observacoes ?? "",
    },
  });

  const [filtroTexto, setFiltroTexto] = useState("");

  const mesSelecionado = watch("mes");
  const { data: condominios = [], isLoading: condominiosLoading } = useCondominios(mesSelecionado);
  const { data: allProfiles = [] } = useAllProfiles();

  const idCondominioAtual = watch("id_condominio");
  const stringIdCondominio = idCondominioAtual !== undefined && idCondominioAtual !== null ? String(idCondominioAtual) : "";

  // Filtra condominios localmente pelo texto digitado
  const condominiosFiltrados = condominios.filter((c) =>
    c.nome.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  // Garante que o valor inicial seja sincronizado caso a lista demore a carregar
  useEffect(() => {
    if (initial?.id_condominio && !idCondominioAtual) {
      setValue("id_condominio", Number(initial.id_condominio), { shouldValidate: true });
    }
  }, [condominios, initial, setValue]);

  const onSubmit = async (v: PrestacaoInput) => {
    if (!user) return;
    setSubmitting(true);
    try {
      if (mode === "criar") {
        await createPrestacao({ data: {
          mes: v.mes,
          condominio_id: v.condominio_id,
          id_condominio: v.id_condominio,
          processo: v.processo as any,
          data_evento: v.data_evento,
          usuario_responsavel: v.usuario_responsavel,
          observacoes: v.observacoes,
        }});
      } else {
        await updatePrestacao({ data: {
          id: initial!.id!,
          mes: v.mes,
          condominio_id: v.condominio_id,
          id_condominio: v.id_condominio,
          processo: v.processo as any,
          data_evento: v.data_evento,
          usuario_responsavel: v.usuario_responsavel,
          observacoes: v.observacoes,
        }});
      }
    } catch (err: any) {
      setSubmitting(false);
      toast.error(err.message);
      return;
    }
    setSubmitting(false);
    toast.success(mode === "criar" ? "Prestação criada" : "Prestação atualizada");
    navigate({ to: "/dashboard" });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4">
        {/* Linha 1: Mês + Condomínio */}
        <div className="space-y-1.5 sm:col-span-1">
          <Label>Mês *</Label>
          <Input type="month" {...register("mes")} />
          {errors.mes && <p className="text-xs text-destructive">{errors.mes.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-3">
          <Label>Condomínio *</Label>
          <Select 
            value={stringIdCondominio} 
            onValueChange={(val) => setValue("id_condominio", Number(val), { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder={condominiosLoading ? "Buscando condomínios históricos…" : "Selecione…"} />
            </SelectTrigger>
            <SelectContent className="max-h-80 overflow-y-auto">
              <div className="p-2 sticky top-0 bg-popover z-50">
                <Input 
                  type="text" 
                  placeholder="Pesquisar condomínio..." 
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              {condominiosFiltrados.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 text-center">Nenhum condomínio encontrado</div>
              ) : (
                condominiosFiltrados.map((c) => (
                  <SelectItem key={String(c.id)} value={String(c.id)}>{c.nome}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.id_condominio && <p className="text-xs text-destructive">{errors.id_condominio.message}</p>}
        </div>

        {/* Linha 2: Data Ocorrido + Processo + Usuário Responsável */}
        <div className="space-y-1.5 sm:col-span-1">
          <Label>Data Ocorrido *</Label>
          <Input type="date" {...register("data_evento")} />
          {errors.data_evento && <p className="text-xs text-destructive">{errors.data_evento.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Processo *</Label>
          <Select value={watch("processo")} onValueChange={(v) => setValue("processo", v as any, { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROCESSOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-1">
          <Label>Usuário Responsável *</Label>
          <Select value={watch("usuario_responsavel")} onValueChange={(v) => setValue("usuario_responsavel", v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              {allProfiles.filter((p) => p.id).map((p) => (
                <SelectItem key={p.id!} value={p.id!}>{p.primeiro_nome} {p.segundo_nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.usuario_responsavel && <p className="text-xs text-destructive">{errors.usuario_responsavel.message}</p>}
        </div>

        {/* Linha 3: Observações */}
        <div className="space-y-1.5 sm:col-span-4">
          <Label>Observações</Label>
          <Textarea rows={3} {...register("observacoes")} />
        </div>

        {/* Linha 4: Botões */}
        <div className="sm:col-span-4 flex gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Salvando…" : "Salvar"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
