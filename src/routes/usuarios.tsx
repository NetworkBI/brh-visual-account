import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Shield, ShieldCheck, Crown, KeyRound, Save, Trash2, UserPlus, BellRing, Check, X } from "lucide-react";
import { toast } from "sonner";
import { senhaSchema } from "@/lib/schemas";
import { alterarPapel, excluirUsuario } from "@/lib/usuarios.functions";
import {
  listarSolicitacoesSenha,
  aprovarSolicitacaoSenha,
  recusarSolicitacaoSenha,
  preAutorizarTrocaSenha,
} from "@/lib/senha.functions";
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
  const { data: usuariosRaw = [], isLoading } = useUsuarios();

  const podeGerenciar = canManageUsers(myRole);
  const podeMaster = canPromoteToMaster(myRole);

  // ADM não enxerga usuários MASTER
  const usuarios = myRole === "adm"
    ? usuariosRaw.filter((u) => u.role !== "master")
    : usuariosRaw;

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

  const fnAlterar = useServerFn(alterarPapel);
  const fnExcluir = useServerFn(excluirUsuario);
  const fnListarSol = useServerFn(listarSolicitacoesSenha);
  const fnAprovarSol = useServerFn(aprovarSolicitacaoSenha);
  const fnRecusarSol = useServerFn(recusarSolicitacaoSenha);
  const fnPreAutorizar = useServerFn(preAutorizarTrocaSenha);

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["solicitacoes-senha"],
    queryFn: () => fnListarSol(),
    enabled: !!podeGerenciar,
  });

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

  const aprovarSol = async (id: string) => {
    try {
      await fnAprovarSol({ data: { id } });
      toast.success("Solicitação aprovada");
      qc.invalidateQueries({ queryKey: ["solicitacoes-senha"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha");
    }
  };
  const recusarSol = async (id: string) => {
    try {
      await fnRecusarSol({ data: { id } });
      toast.success("Solicitação recusada");
      qc.invalidateQueries({ queryKey: ["solicitacoes-senha"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha");
    }
  };
  const preAutorizar = async (userId: string) => {
    try {
      await fnPreAutorizar({ data: { user_id: userId } });
      toast.success("Pré-autorização criada — usuário trocará a senha ao logar");
      qc.invalidateQueries({ queryKey: ["solicitacoes-senha"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha");
    }
  };

  const opcoesPapel: AppRole[] = podeMaster ? ["padrao", "adm", "master"] : ["padrao", "adm"];


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento de contas e perfis de acesso
          </p>
        </div>
        {podeGerenciar && (
          <Button asChild className="gap-2">
            <Link to="/usuarios/novo">
              <UserPlus className="h-4 w-4" />
              Cadastrar novo usuário
            </Link>
          </Button>
        )}
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
          <div className="space-y-1.5">
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

      {podeGerenciar && solicitacoes.length > 0 && (
        <Card className="border-amber-300/60 bg-amber-50/40 dark:border-amber-500/40 dark:bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <BellRing className="h-4 w-4" /> Solicitações de troca de senha ({solicitacoes.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Pendências de usuários que solicitaram a redefinição de senha. Aprovadas serão consumidas no próximo login do usuário.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">E-mail</th>
                    <th className="px-4 py-3 text-left">Origem</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Solicitado em</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {solicitacoes.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{s.email}</td>
                      <td className="px-4 py-3">
                        {s.origem === "pre_autorizada" ? "Pré-autorizada" : "Usuário"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === "aprovada" ? "default" : "secondary"}>
                          {s.status === "aprovada" ? "Aprovada" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(s.criado_em).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === "pendente" ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="default" onClick={() => aprovarSol(s.id)} className="gap-1">
                              <Check className="h-3.5 w-3.5" /> Aprovar
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => recusarSol(s.id)}>
                              <X className="h-3.5 w-3.5" /> Recusar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Aguardando login</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Usuários cadastrados
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {podeMaster
              ? "Como MASTER, você pode gerenciar todos os usuários."
              : "Somente usuários ADM podem alterar papéis e criar novos usuários"}
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
