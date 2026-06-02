import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { prestacaoSchema, PROCESSOS, type PrestacaoInput } from "@/lib/schemas";
import { useCondominios, useProfiles } from "@/lib/queries";
import { getCondominiosFromSheet } from "@/lib/sheet.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  const { data: condominios = [] } = useCondominios();
  const { data: profiles = [] } = useProfiles();
  const [submitting, setSubmitting] = useState(false);

  const fetchSheet = useServerFn(getCondominiosFromSheet);
  const { data: sheetData, isLoading: sheetLoading } = useQuery({
    queryKey: ["condominios-sheet"],
    queryFn: () => fetchSheet(),
    staleTime: 60_000,
  });
  const nomesSheet = sheetData?.nomes ?? [];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PrestacaoInput>({
    resolver: zodResolver(prestacaoSchema),
    defaultValues: {
      mes: initial?.mes ?? new Date().toISOString().slice(0, 7),
      condominio_id: initial?.condominio_id ?? "",
      processo: (initial?.processo as any) ?? "Documentação Recebida",
      data_evento: initial?.data_evento ?? new Date().toISOString().slice(0, 10),
      usuario_responsavel: initial?.usuario_responsavel ?? user?.id ?? "",
      observacoes: initial?.observacoes ?? "",
    },
  });

  // Lista exibida: nomes da planilha + nomes já no banco (sem duplicar)
  const nomesUnificados = (() => {
    const set = new Set<string>();
    nomesSheet.forEach((n) => set.add(n));
    condominios.forEach((c) => set.add(c.nome));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  })();

  const condominioIdAtual = watch("condominio_id");
  const nomeSelecionado =
    condominios.find((c) => c.id === condominioIdAtual)?.nome ?? "";

  async function selecionarCondominioPorNome(nome: string) {
    const existente = condominios.find((c) => c.nome === nome);
    if (existente) {
      setValue("condominio_id", existente.id, { shouldValidate: true });
      return;
    }
    if (!user) return;
    const { data, error } = await supabase
      .from("condominios")
      .insert({ nome, created_by: user.id })
      .select("id")
      .single();
    if (error || !data) { toast.error(error?.message ?? "Falha ao cadastrar condomínio"); return; }
    setValue("condominio_id", data.id, { shouldValidate: true });
  }

  const onSubmit = async (v: PrestacaoInput) => {
    if (!user) return;
    setSubmitting(true);
    const payload = { ...v, usuario: user.id };
    let error;
    if (mode === "criar") {
      ({ error } = await supabase.from("prestacoes").insert(payload as any));
    } else {
      ({ error } = await supabase.from("prestacoes").update(payload as any).eq("id", initial!.id!));
    }
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(mode === "criar" ? "Prestação criada" : "Prestação atualizada");
    navigate({ to: "/dashboard" });
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Mês *</Label>
          <Input type="month" {...register("mes")} />
          {errors.mes && <p className="text-xs text-destructive">{errors.mes.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Data do Evento *</Label>
          <Input type="date" {...register("data_evento")} />
          {errors.data_evento && <p className="text-xs text-destructive">{errors.data_evento.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Condomínio *</Label>
          <Select value={nomeSelecionado} onValueChange={selecionarCondominioPorNome}>
            <SelectTrigger>
              <SelectValue placeholder={sheetLoading ? "Carregando planilha…" : "Selecione…"} />
            </SelectTrigger>
            <SelectContent>
              {nomesUnificados.map((nome) => (
                <SelectItem key={nome} value={nome}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sheetData?.error && (
            <p className="text-xs text-destructive">Planilha: {sheetData.error}</p>
          )}
          {errors.condominio_id && <p className="text-xs text-destructive">{errors.condominio_id.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Processo *</Label>
          <Select value={watch("processo")} onValueChange={(v) => setValue("processo", v as any, { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROCESSOS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Usuário Responsável *</Label>
          <Select value={watch("usuario_responsavel")} onValueChange={(v) => setValue("usuario_responsavel", v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              {profiles.filter((p) => p.id).map((p) => (
                <SelectItem key={p.id!} value={p.id!}>{p.primeiro_nome} {p.segundo_nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.usuario_responsavel && <p className="text-xs text-destructive">{errors.usuario_responsavel.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Observações</Label>
          <Textarea rows={3} {...register("observacoes")} />
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Salvando…" : "Salvar"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );
}
