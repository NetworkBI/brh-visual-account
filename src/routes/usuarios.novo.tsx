import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import {
  useUserRole,
  canManageUsers,
  canPromoteToMaster,
  roleLabel,
  type AppRole,
} from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { criarUsuario } from "@/lib/usuarios.functions";
import { cadastroSchema } from "@/lib/schemas";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/usuarios/novo")({
  head: () =>
    pageMeta({
      path: "/usuarios/novo",
      title: "Cadastrar novo usuário — Grupo BR Hunter",
      description: "Cadastro de novo usuário no sistema do Grupo BR Hunter.",
    }),
  component: () => (
    <AppShell>
      <Pagina />
    </AppShell>
  ),
});

function Pagina() {
  const { data: myRole } = useUserRole();
  const podeGerenciar = canManageUsers(myRole);
  const podeMaster = canPromoteToMaster(myRole);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fnCriar = useServerFn(criarUsuario);

  useEffect(() => {
    if (myRole && !podeGerenciar) navigate({ to: "/usuarios" });
  }, [myRole, podeGerenciar, navigate]);

  const [form, setForm] = useState({
    primeiro_nome: "",
    segundo_nome: "",
    email: "",
    data_nascimento: "",
    matricula: "",
    senha: "",
    role: "padrao" as AppRole,
  });
  const [criando, setCriando] = useState(false);

  const opcoesPapel: AppRole[] = podeMaster ? ["padrao", "adm", "master"] : ["padrao", "adm"];

  const criar = async () => {
    setCriando(true);
    try {
      await fnCriar({ data: form });
      toast.success("Usuário criado");
      qc.invalidateQueries({ queryKey: ["usuarios-com-roles"] });
      navigate({ to: "/usuarios" });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao criar usuário");
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Cadastrar novo usuário</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para criar uma nova conta
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/usuarios">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Novo usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Primeiro nome *</Label>
            <Input
              value={form.primeiro_nome}
              onChange={(e) => setForm({ ...form, primeiro_nome: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Sobrenome *</Label>
            <Input
              value={form.segundo_nome}
              onChange={(e) => setForm({ ...form, segundo_nome: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data de nascimento *</Label>
            <Input
              type="date"
              value={form.data_nascimento}
              onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Matrícula</Label>
            <Input
              value={form.matricula}
              onChange={(e) => setForm({ ...form, matricula: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Senha inicial *</Label>
            <Input
              type="password"
              value={form.senha}
              onChange={(e) => setForm({ ...form, senha: e.target.value })}
              placeholder="mín. 6 caracteres"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Papel *</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as AppRole })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesPapel.map((r) => (
                  <SelectItem key={r} value={r}>
                    {roleLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button onClick={criar} disabled={criando}>
              {criando ? "Criando…" : "Criar usuário"}
            </Button>
            <Button asChild variant="ghost">
              <Link to="/usuarios">Cancelar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
