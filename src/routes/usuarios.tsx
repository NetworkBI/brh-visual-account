import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/app-shell";
import {
  useAuth,
  useUserRole,
  canManageUsers,
  canPromoteToMaster,
  roleLabel,
  type AppRole,
} from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, ShieldCheck, Crown, KeyRound, Save, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { senhaSchema } from "@/lib/schemas";
import { criarUsuario, alterarPapel, excluirUsuario } from "@/lib/usuarios.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/usuarios")({
  head: () =>
    pageMeta({
      path: "/usuarios",
      title: "Usuários — Grupo BR Hunter",
      description:
        "Gerencie operadores, papéis e redefinição de senhas no sistema do Grupo BR Hunter.",
    }),
  component: () => (
    <AppShell>
      <Pagina />
    </AppShell>
  ),
});

function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios-com-roles"],
    queryFn: async () => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("id, primeiro_nome, segundo_nome, email, matricula"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      return (profiles ?? []).map((p) => {
        const rs = (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role);
        const role: AppRole = rs.includes("master")
          ? "master"
          : rs.includes("adm")
            ? "adm"
            : "padrao";
        return { ...p, role };
      });
    },
  });
}

function RoleBadge({ role }: { role: AppRole }) {
  const Icon = role === "master" ? Crown : role === "adm" ? ShieldCheck : Shield;
  const variant = role === "master" ? "default" : role === "adm" ? "default" : "secondary";
  return (
    <Badge variant={variant as any} className="gap-1">
      <Icon className="h-3 w-3" />
      {roleLabel(role)}
    </Badge>
  );
}

function Pagina() {
  const { user } = useAuth();
  const { data: myRole } = useUserRole();
  const qc = useQueryClient();
  const { data: usuarios = [], isLoading } = useUsuarios();

  const podeGerenciar = canManageUsers(myRole);
  const podeMaster = canPromoteToMaster(myRole);

  // Trocar senha
  const [novaSenha, setNovaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const trocarSenha = async () => {
    const parsed = senhaSchema.safeParse(novaSenha);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSalvandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSalvandoSenha(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha alterada");
    setNovaSenha("");
  };

  // Server fns
  const fnCriar = useServerFn(criarUsuario);
  const fnAlterar = useServerFn(alterarPapel);
  const fnExcluir = useServerFn(excluirUsuario);

  const alterarRole = async (userId: string, role: AppRole) => {
    try {
      await fnAlterar({ data: { user_id: userId, role } });
      toast.success("Papel atualizado");
      qc.invalidateQueries({ queryKey: ["usuarios-com-roles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao alterar papel");
    }
  };

  const excluir = async (userId: string) => {
    try {
      await fnExcluir({ data: { user_id: userId } });
      toast.success("Usuário excluído");
      qc.invalidateQueries({ queryKey: ["usuarios-com-roles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao excluir");
    }
  };

  // Form de criação
  const [openNovo, setOpenNovo] = useState(false);
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

  const criar = async () => {
    setCriando(true);
    try {
      await fnCriar({ data: form });
      toast.success("Usuário criado");
      setForm({
        primeiro_nome: "",
        segundo_nome: "",
        email: "",
        data_nascimento: "",
        matricula: "",
        senha: "",
        role: "padrao",
      });
      setOpenNovo(false);
      qc.invalidateQueries({ queryKey: ["usuarios-com-roles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao criar usuário");
    } finally {
      setCriando(false);
    }
  };

  const opcoesPapel: AppRole[] = podeMaster ? ["padrao", "adm", "master"] : ["padrao", "adm"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Gerenciamento de contas e perfis de acesso
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Minha conta
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Papel atual</Label>
            <div>{myRole && <RoleBadge role={myRole} />}</div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nova senha</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="mín. 6 caracteres + 1 número"
              />
              <Button onClick={trocarSenha} disabled={salvandoSenha || !novaSenha}>
                <Save className="mr-1 h-4 w-4" /> Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {podeGerenciar && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Novo usuário
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setOpenNovo((v) => !v)}>
              {openNovo ? "Cancelar" : "Cadastrar"}
            </Button>
          </CardHeader>
          {openNovo && (
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
              <div className="sm:col-span-2">
                <Button onClick={criar} disabled={criando}>
                  {criando ? "Criando…" : "Criar usuário"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Usuários cadastrados
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {podeGerenciar
              ? podeMaster
                ? "Como MASTER, você pode gerenciar todos os usuários."
                : "Como ADM, você gerencia PADRÃO e ADM (sem mexer em MASTER)."
              : "Somente ADM ou MASTER podem gerenciar usuários."}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">E-mail</th>
                  <th className="px-4 py-3 text-left">Matrícula</th>
                  <th className="px-4 py-3 text-left">Papel</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Sem usuários.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => {
                    const isSelf = u.id === user?.id;
                    const isAlvoMaster = u.role === "master";
                    // ADM não mexe em MASTER; ninguém mexe em si mesmo
                    const podeEditar =
                      podeGerenciar && !isSelf && (podeMaster || !isAlvoMaster);
                    return (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {u.primeiro_nome} {u.segundo_nome}
                        </td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">{u.matricula || "—"}</td>
                        <td className="px-4 py-3">
                          {podeEditar ? (
                            <Select
                              value={u.role}
                              onValueChange={(v) => alterarRole(u.id, v as AppRole)}
                            >
                              <SelectTrigger className="h-8 w-32">
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
                          ) : (
                            <RoleBadge role={u.role} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {podeEditar && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação é permanente. {u.primeiro_nome} {u.segundo_nome}{" "}
                                    perderá o acesso e seus dados de perfil serão removidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => excluir(u.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
